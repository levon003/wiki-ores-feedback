#!/usr/bin/env python3
# This script extracts user edit counts from stub history

import mwxml
import mwxml.utilities
import mwreverts

import os
import bz2
import gzip
import json
import re
import hashlib
from datetime import datetime
import para
from itertools import groupby
from collections import defaultdict


def get_stub_history_dir():
    raw_data_dir = "/export/scratch2/wiki_data"
    stub_history_dir = os.path.join(raw_data_dir, "enwiki-20200101-stub-meta-history-gz")
    assert os.path.exists(stub_history_dir)
    return stub_history_dir


def get_stub_history_paths(stub_history_dir):
    paths = [os.path.join(stub_history_dir, stub_history_filename) 
             for stub_history_filename in os.listdir(stub_history_dir)
             if stub_history_filename.endswith(".xml.gz")]
    return paths


def process_dump(dump):
    start_date = datetime.fromisoformat('2013-01-01')  # 5 years before the start of 2018
    start_timestamp = int(start_date.timestamp())
    end_date = datetime.fromisoformat('2018-01-01')  # start of 2018
    end_timestamp = int(end_date.timestamp())
    user_editcount_dict = defaultdict(int)
    for page in dump:
        for revision in page:
            # convert each revision to json and extract the relevant info from it
            rev_doc = revision.to_json()
            rev_timestamp = int(datetime.strptime(rev_doc['timestamp'], "%Y-%m-%dT%H:%M:%SZ").timestamp())
            
            if rev_timestamp < start_timestamp:
                # skip all initial page revisions
                continue
            elif rev_timestamp > end_timestamp:
                # skip all revisions after the period of interest
                break
            
            if 'user' in rev_doc:
                rev_user_id = rev_doc['user']['id'] if 'id' in rev_doc['user'] else None
                if rev_user_id is not None:
                    user_editcount_dict[rev_user_id] += 1
            
    # emit user count data
    for user_id, count in user_editcount_dict.items():
        yield (user_id, count)

                    
def process_stub_history_filepath(path):
    """
    :path str: string path to a Gzip-ed Wikipedia XML file. Designed to be called with stub history files.
    """
    with gzip.open(path, 'rt', encoding='utf-8', errors='replace') as infile:
        dump = mwxml.Dump.from_file(infile)
        results = process_dump(dump)
        yield from results    


def process_all(paths):
    git_root_dir = "/export/scratch2/levon003/repos/wiki-ores-feedback"
    derived_data_dir = os.path.join(git_root_dir, "data", "derived")
    working_dir = os.path.join(derived_data_dir, 'stub-history-all-revisions', 'oidb')
    os.makedirs(working_dir, exist_ok=True)
        
    start = datetime.now()
    processed_count = 0
    curr_batch = []
    
    with open(os.path.join(working_dir, 'pre2018_edit_counts_ungrouped.tsv'), 'w') as outfile:
        for result in para.map(process_stub_history_filepath, paths, mappers=len(paths)):
            user_id, count = result
            outfile.write(str(user_id) + "\t" + str(count) + "\n")
            processed_count += 1
            if processed_count % 100000 == 0:
                print(f"Processed {processed_count} users in {datetime.now() - start}")
    print(f"Finished processing {processed_count} users in {datetime.now() - start}")


def main():
    stub_history_dir = get_stub_history_dir()
    paths = get_stub_history_paths(stub_history_dir)
    process_all(paths)

if __name__ == "__main__":
    main()
