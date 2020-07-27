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
import pickle
import base64

POISON = "POISON"  # an object that is recognized as a "stop processing" signal by the writer process


def get_db(db_filename):
    db = sqlite3.connect(
            db_filename,
            detect_types=sqlite3.PARSE_DECLTYPES
        )
    db.row_factory = sqlite3.Row
    return db


def create_revision_text_table(db):
    db.execute("DROP TABLE IF EXISTS revisionText")
    create_table_command = """
    CREATE TABLE IF NOT EXISTS revisionText (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          rev_id INTEGER NOT NULL UNIQUE,
          content TEXT NOT NULL,
          comment TEXT NOT NULL
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
    

def process_cache_line(queue, line):
    observation = json.loads(line)
    if 'cache' not in observation:
        return
    cache = pickle.loads(base64.b85decode(bytes(observation['cache'], 'ascii')))
    rev_id = observation['rev_id']
    content_key = 'feature.enwiki.revision.text.content'
    comment_key = 'feature.enwiki.revision.text.comment'
    obs_dict = {
        'rev_id': rev_id,
        'content': "",
        'comment': ""
    }
    if content_key in cache:
        content = cache[content_key]
        obs_dict['content'] = content
    if comment_key in cache:
        comment = cache[comment_key]
        obs_dict['comment'] = comment
    queue.put(obs_dict)

    
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
                rev_id = result['rev_id']
                content = result['content']
                comment = result['comment']

                db.execute(
                    'INSERT INTO revisionText (rev_id, content, comment) VALUES (?, ?, ?)',
                    (rev_id, content, comment)
                )

                processed_count += 1
                if processed_count % 100000 == 0:
                    db.commit()
                    print(f"Rows committed after {datetime.now() - s}. ({processed_count} total)")
            db.commit()
            print(f"Final rows committed after {datetime.now() - s}. ({processed_count} total)")
        except mp.TimeoutError:
            sys.stderr.write("Timeout waiting for a process.\n")
        finally:
            db.close()
        print("Db closed, insertion process terminating.")


def process_cache_to_sqlite(cache_filepath, output_filepath):    
    # TODO get the existing_rev_ids and pass them to the WriterProcess to prevent the insertion of duplicate revs
    
    # we'll execute the processing of the inputs in parallel, reducing the extracted
    # results back to a single writer process
    with mp.Pool(processes=31) as pool:
        results = []
        manager = mp.Manager()
        result_queue = manager.Queue()
        writer_process = WriterProcess(outfile=output_filepath, queue=result_queue)
        writer_process.start()
        print("Processes started.")
        rev_ids = []
        skipped_count = 0
        with open(cache_filepath, 'r') as infile:
            for line in tqdm(infile, desc='Reading cache file', total=23157371, disable=None):
                if len(line) > 120:  # short lines definitely don't have the required cache entry
                    result = pool.apply_async(process_cache_line, (result_queue, line,))
                    results.append(result)
        
        # wait for all remaining tasks to terminate
        for result in tqdm(results, desc="Joining processed lines", disable=None):
            result.get()

        # Stop the writer process, ensuring that the queue has been fully processed
        result_queue.put(POISON)
        writer_process.join()
        manager.shutdown()
    print("Finished.")


def main():
    derived_data_dir = os.path.join('/export/scratch2/levon003/repos/wiki-ores-feedback', "data", "derived")
    labeled_revs_dir = os.path.join(derived_data_dir, 'labeled-revs')
    sample3_dir = os.path.join(labeled_revs_dir, 'sample3-features')
    cache_filepath = os.path.join(sample3_dir, 'sample3.mock.w_cache.text.2020-07-23T13:08:38Z.json')

    revision_sample_dir = os.path.join(derived_data_dir, 'revision_sample')
    audit_dir = os.path.join(derived_data_dir, 'audit')
    text_output_filepath = os.path.join(audit_dir, 'text_2020-07-23T13:08:38Z.sqlite')
            
    process_cache_to_sqlite(cache_filepath, text_output_filepath)


if __name__ == "__main__":
    main()

