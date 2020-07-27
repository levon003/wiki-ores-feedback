#!/usr/bin/env python3
# Creates an sqlite3 table that contains revision content text and comment text

# After creating the table, I manually created these indices on the table:
# CREATE INDEX revisionText_revId ON revisionText (rev_id);
# CREATE INDEX revisionText_pageId ON revisionText (page_id);

import sys
import json
import os
import re
from tqdm import tqdm
import itertools
from datetime import datetime
import sqlite3
import multiprocessing as mp
import fileinput
import time
import requests

POISON = "POISON"  # an object that is recognized as a "stop processing" signal by the writer process


def get_db(db_filename):
    db = sqlite3.connect(
            db_filename,
            detect_types=sqlite3.PARSE_DECLTYPES
        )
    db.row_factory = sqlite3.Row
    return db


def create_revision_text_table(db):
    #db.execute("DROP TABLE IF EXISTS revisionText")
    create_table_command = """
    CREATE TABLE IF NOT EXISTS revisionText (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          page_id INTEGER NOT NULL,
          rev_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          comment TEXT NOT NULL,
          tags TEXT NOT NULL
        )
    """
    db.execute(create_table_command)
    db.commit()

    
def get_existing_rev_ids(db_filepath):
    rev_ids = set()
    try:
        db = get_db(db_filepath)
        cursor = db.execute("SELECT rev_id FROM revisionText")
        for result in cursor:
            rev_id = result['rev_id']
            rev_ids.add(rev_id)
    finally:
        db.close()
    return rev_ids
    

def process_rev_id_batch(queue, rev_ids_str):
    headers = {
        'User-Agent': 'retrieveRevIdContents/0.2 (github.com/levon003/wiki-ores-feedback; levon003@umn.edu) requests/2.22.0',
        'From': 'levon003@umn.edu'
    }
    params = {
        'action': 'query',
        'format': 'json',
        'formatversion': '2',
        'revids': rev_ids_str,
        'prop': 'revisions',
        'rvprop': 'ids|comment|content|tags',
        'rvslots': 'main',
        'maxlag': 5
    }
    result = None
    awaiting_result = True
    while awaiting_result:
            response = requests.get("https://en.wikipedia.org/w/api.php", params=params, headers=headers)
            if response.ok:
                result = response.json()
                if 'error' in result:
                    print(result['error'])
                    print("Maxlag at:", datetime.now())
                    # https://www.mediawiki.org/wiki/Manual:Maxlag_parameter
                else:
                    break
            else:
                print("Error:", response)
            print("Server response error; waiting before retry.")
            time.sleep(5)
    
    if not result:
        return
    
    for page in result['query']['pages']:
        page_id = page['pageid']
        if 'revisions' not in page:
            continue
        for revision in page['revisions']:
            rev_id = revision['revid']

            if 'commenthidden' in revision and 'comment' not in revision:
                comment = 'commenthidden'
            else:
                comment = revision['comment']
            
            tags = revision['tags']
            tags_str = "|".join(tags) if len(tags) > 0 else ""

            slots = revision['slots']
            if 'texthidden' in slots['main'] and 'content' not in slots['main']:
                content = "texthidden"
            else:
                if 'contentmodel' not in slots['main'] or slots['main']['contentmodel'] != 'wikitext':
                    raise ValueError("Unexpected response JSON: " + str(slots))
                content = slots['main']['content']

            output_tuple = (page_id, rev_id, content, comment, tags_str)
            queue.put(output_tuple)

    
class WriterProcess(mp.Process):
    """
    WriterProcess writes received data to the database.
    
    It is instantiated with a queue (that it reads from) and a filename (that it writes to).
    """
    def __init__(self, outfile, queue, **kwargs):
        super(WriterProcess, self).__init__()
        self.outfile = outfile
        self.queue = queue
        self.kwargs = kwargs

    def run(self):
        db = get_db(self.outfile)
        try:
            # create (and remove existing) table to be inserted into
            create_revision_text_table(db)
            processed_count = 0  # tracks the number of revisions processed so far
            s = datetime.now()
            print(f"Insertion process created table and started queue processing at {str(s)}.")
            while True:
                result = self.queue.get()
                if result == POISON:
                    break
                page_id, rev_id, content, comment, tags_str = result

                db.execute(
                    'INSERT INTO revisionText (page_id, rev_id, content, comment, tags) VALUES (?, ?, ?, ?, ?)',
                    (page_id, rev_id, content, comment, tags_str)
                )

                processed_count += 1
                if processed_count % 10000 == 0:
                    db.commit()
                    print(f"Rows committed after {datetime.now() - s}. ({processed_count} total)")
            db.commit()
            print(f"Final rows committed after {datetime.now() - s}. ({processed_count} total)")
        except mp.TimeoutError:
            sys.stderr.write("Timeout waiting for a process.\n")
        finally:
            db.close()
        print("Db closed, insertion process terminating.")


def process_inputs_to_sqlite(output_filepath):
    # get rev_ids that already exist in the database
    existing_rev_ids = get_existing_rev_ids(output_filepath)
    
    # we'll execute the processing of the inputs in parallel, reducing the extracted
    # results back to a single writer process
    with mp.Pool(processes=1) as pool:
        results = []
        manager = mp.Manager()
        result_queue = manager.Queue()
        writer_process = WriterProcess(outfile=output_filepath, queue=result_queue)
        writer_process.start()
        print("Processes started.")
        rev_ids = []
        skipped_count = 0
        for line in fileinput.input():
            if line.strip() != "":
                rev_id = int(line.strip())
                if rev_id in existing_rev_ids:
                    skipped_count += 1
                    continue
                rev_ids.append(rev_id)
                if len(rev_ids) == 50:
                    rev_ids_str = "|".join([str(rev_id) for rev_id in rev_ids])
                    result = pool.apply_async(process_rev_id_batch, (result_queue, rev_ids_str,))
                    results.append(result)
                    rev_ids = []
                assert len(rev_ids) < 50  # if we ever request more than 50, will get back a bad response
        if len(rev_ids) > 0:
            rev_ids_str = "|".join([str(rev_id) for rev_id in rev_ids])
            result = pool.apply_async(process_rev_id_batch, (result_queue, rev_ids_str,))
            results.append(result)
        print(f"Skipped {skipped_count} input rev_ids that already exist in the SQLite table.")
        
        # wait for all remaining tasks to terminate
        for result in tqdm(results, desc="Joining Results", disable=None):
            result.get()

        # Stop the writer process, ensuring that the queue has been fully processed
        result_queue.put(POISON)
        writer_process.join()
        manager.shutdown()
    print("Finished.")


def main():
    output_filepath = "/export/scratch2/levon003/repos/wiki-ores-feedback/data/derived/text_content/revisionText.sqlite"
    process_inputs_to_sqlite(output_filepath)


if __name__ == "__main__":
    main()

