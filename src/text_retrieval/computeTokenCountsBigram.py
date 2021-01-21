#!/usr/bin/env python3
# Generate token counts from diff info

import numpy as np
import pandas as pd
import sys
import json
import os
from tqdm import tqdm
from datetime import datetime
from collections import Counter


def get_bigrams(token_list):
    ts = []
    for token in token_list:
        if token == '\n':
            token = 'NEWLINE'
        elif token == ' ':
            token = 'WHITESPACE'
        elif token.isspace():
            token = 'specialWHITESPACE'
        ts.append(token)
    return [ts[i] + "_" + ts[i+1] for i in range(len(ts) - 1)]


def save_counter(counter, output_filepath):
    with open(output_filepath, 'w') as outfile:
        for token, count in counter.most_common():
            outfile.write(token + ',' + str(count) + '\n')


def build_counters(diff_json_filepath, output_dir, rev_id_is_reverted_dict):
    # compute counts for the reverted revisions and all revisions separately
    # oc = occurrence count (document frequency)
    content_oc = Counter()
    removed_oc = Counter()
    inserted_oc = Counter()
    reverted_content_oc = Counter()
    reverted_removed_oc = Counter()
    reverted_inserted_oc = Counter()
    content_counter = Counter()
    removed_counter = Counter()
    inserted_counter = Counter()
    
    processed_count = 0
    with open(diff_json_filepath, 'r') as infile:
        for line in tqdm(infile, total=9584147, desc='Building document counters'):
            diff = json.loads(line)
            content_bigrams = get_bigrams(diff['content_tokens'])
            removed_bigrams = get_bigrams(diff['removed_tokens'])
            inserted_bigrams = get_bigrams(diff['inserted_tokens'])
            content_counter.update(content_bigrams)
            removed_counter.update(removed_bigrams)
            inserted_counter.update(inserted_bigrams)
            content_set = set(content_bigrams)
            removed_set = set(removed_bigrams)
            inserted_set = set(inserted_bigrams)
            content_set.add('DOCUMENT_TOTAL')  # add 1 token that is in each document, so we get a total count
            removed_set.add('DOCUMENT_TOTAL')
            inserted_set.add('DOCUMENT_TOTAL')
            content_oc.update(content_set)
            removed_oc.update(removed_set)
            inserted_oc.update(inserted_set)
            if rev_id_is_reverted_dict[diff['rev_id']] == 1:
                reverted_content_oc.update(content_set)
                reverted_removed_oc.update(removed_set)
                reverted_inserted_oc.update(inserted_set)
            processed_count += 1
    print(f"Content tokens (bigram): {len(content_oc)} (reverted {len(reverted_content_oc)})")
    print(f"Removed tokens (bigram): {len(removed_oc)} (reverted {len(reverted_removed_oc)})")
    print(f"Inserted tokens (bigram): {len(inserted_oc)} (reverted {len(reverted_inserted_oc)})")
    
    save_counter(content_counter, os.path.join(output_dir, 'all_content_counts_bigram.csv'))
    save_counter(removed_counter, os.path.join(output_dir, 'all_removed_counts_bigram.csv'))
    save_counter(inserted_counter, os.path.join(output_dir, 'all_inserted_counts_bigram.csv'))
    save_counter(content_oc, os.path.join(output_dir, 'all_content_doc_counts_bigram.csv'))
    save_counter(removed_oc, os.path.join(output_dir, 'all_removed_doc_counts_bigram.csv'))
    save_counter(inserted_oc, os.path.join(output_dir, 'all_inserted_doc_counts_bigram.csv'))
    save_counter(reverted_content_oc, os.path.join(output_dir, 'reverted_content_doc_counts_bigram.csv'))
    save_counter(reverted_removed_oc, os.path.join(output_dir, 'reverted_removed_doc_counts_bigram.csv'))
    save_counter(reverted_inserted_oc, os.path.join(output_dir, 'reverted_inserted_doc_counts_bigram.csv'))


def main():
    derived_data_dir = os.path.join('/export/scratch2/levon003/repos/wiki-ores-feedback', "data", "derived")
    audit_dir = os.path.join(derived_data_dir, 'audit')
    token_counts_dir = os.path.join(audit_dir, 'token_counts')
    
    diff_json_filepath = os.path.join(audit_dir, 'diff_2020-08-01T05:40:00Z.ldjson')
    
    # read in the sample dataframe
    s = datetime.now()
    revision_sample_dir = os.path.join(derived_data_dir, 'revision_sample')
    sample3_filepath = os.path.join(revision_sample_dir, 'sample3_all.pkl')
    rev_df = pd.read_pickle(sample3_filepath)
    print(f"Sample 3 revision data loaded in {datetime.now() - s}.")
    
    rev_id_is_reverted_dict = {row.rev_id: row.is_reverted for row in tqdm(rev_df.itertuples(), total=len(rev_df), desc='Building rev_id -> is_reverted dict')}
    
    del rev_df
    print("Unloaded revision dataframe.")
    
    build_counters(diff_json_filepath, token_counts_dir, rev_id_is_reverted_dict)
    print("Finished.")
    

if __name__ == "__main__":
    main()
