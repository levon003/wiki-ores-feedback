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
import scipy.sparse


def get_doc_vocab(doc_counts_filepath, k=50000):
    with open(doc_counts_filepath, 'r') as infile:
        infile.readline()  # top line is just the total document count
        vocab_list = []
        for line in infile:
            if len(vocab_list) < k:
                token = line.strip().split(",")[0]
                if token == '':
                    token = ','
                vocab_list.append(token)
    assert len(vocab_list) == k
    vocab_dict = {token: i for i, token in enumerate(vocab_list)}
    return vocab_dict


def save_matrix(td_mat, output_filepath, processed_count, total_rows):
    s = datetime.now()
    td_mat_csc = td_mat[0:processed_count,:].asformat('coo')
    scipy.sparse.save_npz(output_filepath, td_mat_csc)
    print(f"Saved after {processed_count} / {total_rows} in {datetime.now() - s}. (curr shape: {td_mat_csc.get_shape()})")
            
            
def build_sparse_matrix(diff_json_filepath, output_filepath, content_vocab_dict, removed_vocab_dict, inserted_vocab_dict):
    # compute counts for the reverted revisions and all revisions separately
    # oc = occurrence count (document frequency)
    total_rows = 9584147
    
    td_mat = scipy.sparse.dok_matrix((total_rows, 150000), dtype=bool)
    
    processed_count = 0
    with open(diff_json_filepath, 'r') as infile:
        for i, line in tqdm(enumerate(infile), total=total_rows, desc='Populating sparse matrix'):
            diff = json.loads(line)
            content_set = set(diff['content_tokens'])
            removed_set = set(diff['removed_tokens'])
            inserted_set = set(diff['inserted_tokens'])
            content_inds = [content_vocab_dict[token] for token in content_set if token in content_vocab_dict]
            removed_inds = [removed_vocab_dict[token] + 50000 for token in removed_set if token in removed_vocab_dict]
            inserted_inds = [inserted_vocab_dict[token] + 100000 for token in inserted_set if token in inserted_vocab_dict]
            inds = np.array(sorted(content_inds + removed_inds + inserted_inds))
            #print(f"content: {len(content_inds)} / {len(content_set)}; removed: {len(removed_inds)} / {len(removed_set)}; inserted: {len(inserted_inds)} / {len(inserted_set)}")
            td_mat[i, inds] = True
            processed_count += 1
            #print('Non-zero elements:', td_mat.nnz)  # note: I think computing this is slow
            
            if processed_count % 50000 == 0:
                save_matrix(td_mat, output_filepath, processed_count, total_rows)
        save_matrix(td_mat, output_filepath, processed_count, total_rows)

def main():
    derived_data_dir = os.path.join('/export/scratch2/levon003/repos/wiki-ores-feedback', "data", "derived")
    audit_dir = os.path.join(derived_data_dir, 'audit')
    token_counts_dir = os.path.join(audit_dir, 'token_counts')
    
    content_doc_counts_filepath = os.path.join(token_counts_dir, 'all_content_doc_counts.csv')
    removed_doc_counts_filepath = os.path.join(token_counts_dir, 'all_removed_doc_counts.csv')
    inserted_doc_counts_filepath = os.path.join(token_counts_dir, 'all_inserted_doc_counts.csv')
    content_vocab_dict = get_doc_vocab(content_doc_counts_filepath)
    removed_vocab_dict = get_doc_vocab(removed_doc_counts_filepath)
    inserted_vocab_dict = get_doc_vocab(inserted_doc_counts_filepath)
    print("Constructed vocabs.")
    
    diff_json_filepath = os.path.join(audit_dir, 'diff_2020-08-01T05:40:00Z.ldjson')
    output_filepath = os.path.join(audit_dir, 'td_doc_150000_csc.npz')
    
    build_sparse_matrix(diff_json_filepath, output_filepath, content_vocab_dict, removed_vocab_dict, inserted_vocab_dict)
    
    print("Finished.")
    

if __name__ == "__main__":
    main()
