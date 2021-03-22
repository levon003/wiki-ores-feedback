#!/usr/bin/env python3
# This script extracts revisions from a Stub History XML dump
# Saves as much information as possible
# Took 17h10m35s to run on 27 cores; minimal memory usage.
# 2nd run: 111200155 revisions (and 15082470 pages) in 17:10:39.688123
# head revs.tsv > sort -T /export/scratch2/tmp --parallel=8 -t $'\t' -k 1,1 -n


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

from sqlalchemy import create_engine, Table, Column, Integer, String, MetaData, ForeignKey, Text, Boolean, TIMESTAMP, Float


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
    detector_start_date = datetime.fromisoformat('2013-01-01')  # 5 years before the start of 2018
    detector_start_timestamp = int(detector_start_date.timestamp())
    start_date = datetime.fromisoformat('2018-01-01')  # start of 2018
    start_timestamp = int(start_date.timestamp())
    midpoint_date = datetime.fromisoformat('2019-01-01')
    midpoint_timestamp = int(midpoint_date.timestamp())
    end_date = datetime.fromisoformat('2020-01-01')
    end_timestamp = int(end_date.timestamp())
    for page in dump:
        is_page_redirect = int(page.redirect is not None)
        page_namespace = page.namespace
        page_id = page.id
        rev_count = 0
        target_range_rev_count = 0
        target_range_midpoint_rev_count = 0

        rev_list = []
        rev_dict = {}
        rev_user_text_dict = {}
        
        prev_timestamp = None
        prev_rev_size_bytes = None

        # we use a new detector for each page
        detector = mwreverts.Detector(radius=15)
        for revision in page:
            rev_count += 1

            # convert each revision to json and extract the relevant info from it
            rev_doc = revision.to_json()
            rev_id = rev_doc['id']
            rev_timestamp = int(datetime.strptime(rev_doc['timestamp'], "%Y-%m-%dT%H:%M:%SZ").timestamp())
            rev_size_bytes = rev_doc['bytes']
            
            if rev_timestamp < detector_start_timestamp:
                # skip all initial page revisions
                prev_timestamp = rev_timestamp
                prev_rev_size_bytes = rev_size_bytes
                continue
            elif rev_timestamp > end_timestamp:
                # skip all revisions after the period of interest
                continue
            
            rev_user_text = ""
            rev_user_id = ""
            if 'user' in rev_doc:
                rev_user_text = rev_doc['user']['text'].replace('\t', '\\t').replace('\n', '\\n') if 'text' in rev_doc['user'] else None
                rev_user_id = rev_doc['user']['id'] if 'id' in rev_doc['user'] else None
            
            if rev_timestamp < start_timestamp:
                # process the sha1 so that we can identify reverts once we are in the range of interest
                checksum = rev_doc.get('sha1') or mwreverts.DummyChecksum()
                detector.process(checksum, rev_doc)
                prev_timestamp = rev_timestamp
                prev_rev_size_bytes = rev_size_bytes
                rev_user_text_dict[rev_id] = rev_user_text
                continue
            # after this point, we are after 2018!
            target_range_rev_count += 1
            if rev_timestamp < midpoint_timestamp:
                # still before the midpoint
                target_range_midpoint_rev_count += 1
            
            seconds_to_prev = None
            if prev_timestamp is not None:
                seconds_to_prev = rev_timestamp - prev_timestamp
            delta_bytes = None
            if prev_rev_size_bytes is not None:
                delta_bytes = rev_size_bytes - prev_rev_size_bytes
            
            assert rev_doc['page']['id'] == page_id
            assert rev_doc['page']['namespace'] == page_namespace
            page_title = rev_doc['page']['title']
            
            rev_data = {
                'page_id': page_id,
                'rev_id': rev_id,
                'prev_rev_id': rev_doc['parent_id'] if 'parent_id' in rev_doc else None,
                'is_minor': rev_doc['minor'],
                'user_text': rev_user_text,
                'user_id': rev_user_id,
                'rev_timestamp': rev_timestamp,
                'seconds_to_prev': seconds_to_prev,
                'curr_bytes': rev_size_bytes,
                'delta_bytes': delta_bytes,
                #'edit_summary': rev_doc['comment'] if 'comment' in rev_doc else None,
                'has_edit_summary': 'comment' in rev_doc,
                'is_reverted': False,
                'is_revert': False,
                'is_self_reverted': False,
                'is_self_revert': False,
                'revert_target_id': None,
                'revert_set_size': None,
                'revert_id': None,
                'seconds_to_revert': None,
            }
            rev_list.append(rev_data)
            rev_dict[rev_id] = rev_data

            # now, we check if we have identified a new revert
            checksum = rev_doc.get('sha1') or mwreverts.DummyChecksum()
            revert = detector.process(checksum, rev_doc)

            # we only consider reverts in the target timerange
            if revert:
                revert_json = revert.to_json()

                reverting_id = revert_json['reverting']['id']
                reverted_to_id = revert_json['reverted_to']['id']
                reverteds_ids = [rev['id'] for rev in revert_json['reverteds']]
                
                assert reverting_id == rev_id
                rev_data['is_revert'] = True
                rev_data['revert_target_id'] = reverted_to_id
                rev_data['revert_set_size'] = len(reverteds_ids)
                
                is_self_revert = rev_data['user_text'] is not None  # true in most cases; if false, not enough info to know if a self revert
                # update the data of the reverted revisions
                for rev_id in reverteds_ids:
                    if rev_id not in rev_dict:
                        # this revision happened before the target period
                        if rev_id in rev_user_text_dict:
                            if rev_user_text_dict[rev_id] is None or rev_user_text_dict[rev_id] != rev_data['user_text']:
                                is_self_revert = False
                        else:
                            # note: in rare circumstances, we can miss self-reverts, iff
                            # (a) reverted rev is before 2013, (b) reverting rev is after 2018
                            # In this case, we assume not a self revert
                            is_self_revert = False
                            print(f"Revision {rev_id} reverted by revision {reverting_id} after more than 5 years.")
                        continue
                    reverted_rev_data = rev_dict[rev_id]
                    reverted_rev_data['is_reverted'] = True
                    reverted_rev_data['revert_id'] = reverting_id
                    if reverted_rev_data['user_text'] is None or reverted_rev_data['user_text'] != rev_data['user_text']:
                        # at least one reverted id is not by this user, so not a self-revert
                        is_self_revert = False
                    reverted_rev_data['seconds_to_revert'] = rev_data['rev_timestamp'] - reverted_rev_data['rev_timestamp']
                    reverted_rev_data['revert_target_id'] = reverted_to_id
                    reverted_rev_data['revert_set_size'] = len(reverteds_ids)
                if is_self_revert:
                    # need to update all of the reverteds as well
                    for rev_id in reverteds_ids:
                        if rev_id not in rev_dict:
                            continue
                        reverted_rev_data = rev_dict[rev_id]
                        reverted_rev_data['is_self_reverted'] = True
                
            prev_timestamp = rev_timestamp
            prev_rev_size_bytes = rev_size_bytes

        if target_range_rev_count > 0:
            # emit page info
            page_info = {
                'page_id': page_id,
                'wiki_namespace': page_namespace,
                'page_title': page_title,
                'full_rev_count': target_range_rev_count,  # corresponds to 2018-2020 revs
                'range_rev_count': target_range_midpoint_rev_count,  # corresponds to 2018-2019 revs
                'is_page_redirect': is_page_redirect,
            }
            yield page_info
            # emit revision data from target range
            for rev_data in rev_list:
                yield rev_data

                    
def process_stub_history_filepath(path):
    """
    :path str: string path to a Gzip-ed Wikipedia XML file. Designed to be called with stub history files.
    """
    with gzip.open(path, 'rt', encoding='utf-8', errors='replace') as infile:
        dump = mwxml.Dump.from_file(infile)
        results = process_dump(dump)
        yield from results

        
def get_engine(output_filepath):
    test_db_filepath = f'sqlite:///{output_filepath}'
    print(test_db_filepath)
    engine = create_engine(test_db_filepath, echo=False)
    return engine
        
    
def create_tables(engine):
    metadata = MetaData()

    page_metadata = Table('page_metadata', metadata,
        Column('page_id', Integer, primary_key=True),
        Column('wiki_namespace', Integer, nullable=False),
        Column('page_title', Text, nullable=False),
        Column('rev_count', Integer, nullable=False),
    )
    
    revision = Table('revision', metadata,
        Column('rev_id', Integer, primary_key=True),
        Column('page_id', Integer, nullable=False),
        Column('prev_rev_id', Integer),

        Column('rev_timestamp', Integer, nullable=False),
        Column('seconds_to_prev', Integer),
        Column('is_minor', Boolean, nullable=False),

        Column('user_text', Text(length=85), nullable=False),
        Column('user_id', Integer),
                     
        Column('curr_bytes', Integer),
        Column('delta_bytes', Integer),
        Column('edit_summary', Text(length=500)),
        
        Column('is_reverted', Boolean, nullable=False),
        Column('is_revert', Boolean, nullable=False),
        Column('is_self_reverted', Boolean, nullable=False),
        Column('is_self_revert', Boolean, nullable=False),
        Column('revert_target_id', Integer),
        Column('revert_set_size', Integer),
        Column('revert_id', Integer),
        Column('seconds_to_revert', Integer),
    )
    
    metadata.drop_all(engine, checkfirst=True)
    metadata.create_all(engine, checkfirst=True)

    
def process_all(paths):
    git_root_dir = "/export/scratch2/levon003/repos/wiki-ores-feedback"
    derived_data_dir = os.path.join(git_root_dir, "data", "derived")
    working_dir = os.path.join(derived_data_dir, 'stub-history-all-revisions', 'oidb')
    os.makedirs(working_dir, exist_ok=True)
    
    #output_filepath = os.path.join(working_dir, 'oidb.sqlite')
    #engine = get_engine(output_filepath)
    #create_tables(engine)
    
    #metadata = MetaData(bind=engine)
    #metadata.reflect()
    
    #page_metadata = metadata.tables['page_metadata']
    #revision = metadata.tables['revision']
    #conn = engine.connect()
    
    start = datetime.now()
    processed_count = 0
    page_processed_count = 0
    curr_batch = []
    FORCE_COMMIT_SIZE = 100000
    
    with open(os.path.join(working_dir, 'revs_unsorted.tsv'), 'w') as outfile, open(os.path.join(working_dir, 'page.ndjson'), 'w') as page_outfile:
        for result in para.map(process_stub_history_filepath, paths, mappers=len(paths)):
            if 'wiki_namespace' in result:
                # this is a page result
                page_outfile.write(json.dumps(result) + "\n")
                page_processed_count += 1
                if page_processed_count % 100000 == 0:
                    print(f"Processed {page_processed_count} pages in {datetime.now() - start}")
            else:
                #outfile.write(json.dumps(result) + "\n")
                outfile.write("{rev_timestamp}\t{page_id}\t{rev_id}\t{prev_rev_id}\t{is_minor}\t{user_text}\t{user_id}\t{rev_timestamp}\t{seconds_to_prev}\t{curr_bytes}\t{delta_bytes}\t{has_edit_summary}\t{is_reverted}\t{is_revert}\t{is_self_reverted}\t{is_self_revert}\t{revert_target_id}\t{revert_set_size}\t{revert_id}\t{seconds_to_revert}\n".format(**result))
                
                #curr_batch.append(result)
                #if len(curr_batch) >= FORCE_COMMIT_SIZE:
                #    conn.execute(revision.insert(), curr_batch)
                #    curr_batch = []
                processed_count += 1
                if processed_count % 1000000 == 0:
                    print(f"Processed {processed_count} revisions in {datetime.now() - start}")
    #if len(curr_batch) > 0:
    #    conn.execute(revision.insert(), curr_batch)
    print(f"Finished processing {processed_count} revisions (and {page_processed_count} pages) in {datetime.now() - start}")


def main():
    stub_history_dir = get_stub_history_dir()
    paths = get_stub_history_paths(stub_history_dir)
    process_all(paths)

if __name__ == "__main__":
    main()
