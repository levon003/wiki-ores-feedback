#!/usr/bin/env python3
# Extract diff info from revisions
# Seems to run at about 2500 revisions per minute (before the addition of the content tokens list to the output)

import numpy as np
import pandas as pd
import sys
import json
import os
from tqdm import tqdm
from datetime import datetime
import sqlite3
import multiprocessing as mp

import deltas
from deltas.tokenizers import wikitext_split
from deltas import segment_matcher
# For use of deltas, see this gist: https://gist.github.com/halfak/b2f2dfa775c59d9de7c89a8eabe5530e

def get_db(db_filename):
    db = sqlite3.connect(
            db_filename,
            detect_types=sqlite3.PARSE_DECLTYPES
        )
    db.row_factory = sqlite3.Row
    return db


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


def create_diff_for_revision(prev_rev_id, rev_id, db_filepath):
    # first, retrieve the text from the database
    try:
        db = get_db(db_filepath)
        
        cursor = db.execute("SELECT rev_id, content FROM revisionText WHERE rev_id = ?", (prev_rev_id,))
        result = cursor.fetchall()
        if len(result) > 1:
            # This should never happen if the database is properly constructed...
            raise ValueError("WARNING: Duplicated rev_id in database, check integrity.")
        if len(result) == 0:
            raise ValueError(f"Failed to find rev_id {rev_id} in database.")
        result = result[0]
        prev_content = result['content']
        
        cursor = db.execute("SELECT rev_id, content FROM revisionText WHERE rev_id = ?", (rev_id,))
        result = cursor.fetchall()
        if len(result) > 1:
            # This should never happen if the database is properly constructed...
            raise ValueError("WARNING: Duplicated rev_id in database, check integrity.")
        if len(result) == 0:
            raise ValueError(f"Failed to find rev_id {rev_id} in database.")
        result = result[0]
        curr_content = result['content']
    finally:
        db.close()
    
    # second, tokenize the texts
    prev_tokens = wikitext_split.tokenize(prev_content)
    curr_tokens = wikitext_split.tokenize(curr_content)
    
    # third, identify segments that were inserted and removed, tracking the tokens that were added and subtracted
    all_removed_tokens = []
    all_inserted_tokens = []
    delete_count = 0
    insert_count = 0
    for segment in segment_matcher.diff(prev_tokens, curr_tokens):
        if segment.name == 'equal':
            continue
        elif segment.name == 'delete':
            removed_tokens = prev_tokens[segment.a1:segment.a2]
            removed_tokens.insert(0, 'REMOVAL_START')
            removed_tokens.append('REMOVAL_END')
            all_removed_tokens.extend(removed_tokens)
            delete_count += 1
        elif segment.name == 'insert':
            inserted_tokens = curr_tokens[segment.b1:segment.b2]
            inserted_tokens.insert(0, 'INSERTION_START')
            inserted_tokens.append('INSERTION_END')
            all_inserted_tokens.extend(inserted_tokens)
            insert_count += 1
        else:
            raise ValueError('Substitutions are not implemented by the segment matcher.')
    content_token_count = len(curr_tokens)
    #if len(curr_tokens) >= 100000: # TODO consider avoiding writing out very long articles
    return {'prev_rev_id': prev_rev_id, 
            'rev_id': rev_id,
            'delete_count': delete_count,
            'insert_count': insert_count,
            'content_token_count': content_token_count,
            'content_tokens': curr_tokens,
            'removed_tokens': all_removed_tokens, 
            'inserted_tokens': all_inserted_tokens}


def process_texts_to_diff_info(rev_id_pairs, db_filepath, output_filepath):    
    s = datetime.now()
    with mp.Pool(processes=31) as pool:
        results = []
        for pair in tqdm(rev_id_pairs, desc='Spooling tasks'):
            prev_rev_id, curr_rev_id = pair
            result = pool.apply_async(create_diff_for_revision, (prev_rev_id, curr_rev_id, db_filepath))
            results.append(result)
        
        # wait for all remaining tasks to terminate
        with open(output_filepath, 'w') as outfile:
            for result in tqdm(results, desc="Joining processed tasks", disable=None):
                result_dict = result.get()
                outfile.write(json.dumps(result_dict) + '\n')
    print(f"Diffs computed and saved in {datetime.now() - s}.")


def main():
    derived_data_dir = os.path.join('/export/scratch2/levon003/repos/wiki-ores-feedback', "data", "derived")
    revision_sample_dir = os.path.join(derived_data_dir, 'revision_sample')
    audit_dir = os.path.join(derived_data_dir, 'audit')
    
    db_filepath = os.path.join(audit_dir, 'text_2020-07-23T13:08:38Z.sqlite')
    diff_output_filepath = os.path.join(audit_dir, 'diff_2020-07-23T13:08:38Z.ldjson')
    
    # read in the sample dataframe
    s = datetime.now()
    revision_sample_dir = os.path.join(derived_data_dir, 'revision_sample')
    sample3_filepath = os.path.join(revision_sample_dir, 'sample3_all.pkl')
    rev_df = pd.read_pickle(sample3_filepath)
    print(f"Sample 3 revision data loaded in {datetime.now() - s}.")
    
    existing_rev_ids = get_existing_rev_ids(db_filepath)
    print(f"Identified {len(existing_rev_ids)} revisions with text in the input database.")
    
    rev_df['has_text'] = rev_df.rev_id.map(lambda rev_id: rev_id in existing_rev_ids)
    print(f"Found text for {np.sum(rev_df.has_text)} revisions ({np.sum(rev_df.has_text) / len(rev_df)*100:.2f}%)")
    
    rev_ids_with_text = set(rev_df[rev_df.has_text].rev_id)
    rev_df['prev_rev_has_text'] = rev_df.prev_rev_id.map(lambda rev_id: rev_id in rev_ids_with_text)
    sdf = rev_df[(rev_df.prev_rev_has_text)&(rev_df.has_text)]
    print(f"Identified {len(sdf)} revisions for which a diff can be computed.")
    rev_id_pairs = [(row.prev_rev_id, row.rev_id) for row in sdf.itertuples()]
    
    del sdf
    del rev_df
    print("Freed memory of all but the revision id pairs.")
    
    process_texts_to_diff_info(rev_id_pairs, db_filepath, diff_output_filepath)
    

if __name__ == "__main__":
    main()
