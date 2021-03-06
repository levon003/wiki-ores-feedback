#!/usr/bin/env python3
# This script extracts revisions from a Stub History XML dump
# While reverts are identified, their metadata is not saved
# After running this script, one may wish to sort the CSV output: `sort -k1 -n -t, rev_ids.csv > rev_ids_sorted.csv`
# Although, generally, the CSV will be too large to sort using bash tools...

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
    start_date = datetime.fromisoformat('2010-01-01')
    start_timestamp = int(start_date.timestamp())
    end_date = datetime.fromisoformat('2020-01-01')
    end_timestamp = int(end_date.timestamp())
    for page in dump:
        is_page_redirect = int(page.redirect is not None)
        page_namespace = page.namespace
        page_id = page.id
        rev_count = 0

        rev_tups = []
        is_revert_target_set = set()
        is_reverted_set = set()
        is_reverting_set = set()

        # we use a new detector for each page
        detector = mwreverts.Detector(radius=15)
        for revision in page:
            rev_count += 1

            # convert each revision to json and extract the relevant info from it
            rev_doc = revision.to_json()
            rev_id = rev_doc['id']
            rev_timestamp = int(datetime.strptime(rev_doc['timestamp'], "%Y-%m-%dT%H:%M:%SZ").timestamp())
            rev_user_text = ""
            rev_user_id = ""
            if 'user' in rev_doc:
                rev_user_text = rev_doc['user']['text'] if 'text' in rev_doc['user'] else ""
                rev_user_id = rev_doc['user']['id'] if 'id' in rev_doc['user'] else ""
            rev_tup = [page_id, rev_id, rev_timestamp, rev_user_text, rev_user_id]
            rev_tups.append(rev_tup)

            # now, we check if we have identified a new revert
            checksum = rev_doc.get('sha1') or mwreverts.DummyChecksum()
            revert = detector.process(checksum, rev_doc)

            # we only consider reverts in the target timerange
            if revert and rev_timestamp >= start_timestamp and rev_timestamp <= end_timestamp:
                revert_json = revert.to_json()

                reverting_id = revert_json['reverting']['id']
                reverted_to_id = revert_json['reverted_to']['id']
                reverteds_ids = [rev['id'] for rev in revert_json['reverteds']]

                # keep track of which revision ids are reverts/reverting/reverted-to-targets
                is_reverting_set.add(reverting_id)
                is_revert_target_set.add(reverted_to_id)
                is_reverted_set.update(reverteds_ids)

        # having processed for reverts, we output all revisions along with their types back to the central process
        for rev_tup in rev_tups:
            page_id, rev_id, rev_timestamp, rev_user_text, rev_user_id = rev_tup
            if rev_timestamp >= start_timestamp and rev_timestamp <= end_timestamp:
                is_revert_target = int(rev_id in is_revert_target_set)
                is_reverted = int(rev_id in is_reverted_set)
                is_reverting = int(rev_id in is_reverting_set)
                yield page_id, page_namespace, is_page_redirect, rev_id, rev_timestamp, rev_user_text, rev_user_id, is_revert_target, is_reverted, is_reverting

                    
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
    working_dir = os.path.join(derived_data_dir, 'stub-history-all-revisions')
    os.makedirs(working_dir, exist_ok=True)
    start = datetime.now()
    with open(os.path.join(working_dir, 'rev_ids.csv'), 'w') as outfile:
        processed_count = 0
        for result in para.map(process_stub_history_filepath, paths, mappers=len(paths)):
            page_id, page_namespace, is_page_redirect, rev_id, rev_timestamp, rev_user_text, rev_user_id, is_revert_target, is_reverted, is_reverting = result
            outfile.write(f"{page_id},{page_namespace},{is_page_redirect},{rev_id},{rev_timestamp},{rev_user_text},{rev_user_id},{is_revert_target},{is_reverted},{is_reverting}\n")
            processed_count += 1
            if processed_count % 1000000 == 0:
                print(f"Processed {processed_count} revisions in {datetime.now() - start}")
    print(f"Finished processing {processed_count} revisions in {datetime.now() - start}")


def main():
    stub_history_dir = get_stub_history_dir()
    paths = get_stub_history_paths(stub_history_dir)
    process_all(paths)

if __name__ == "__main__":
    main()
