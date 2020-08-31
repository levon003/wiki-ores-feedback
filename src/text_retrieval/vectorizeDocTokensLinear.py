#!/usr/bin/env python3

import numpy as np
import pandas as pd
import sys
import json
import os
import pickle
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


def save_matrix(row_inds, col_inds, output_filepath, processed_count, total_rows, subset_row_count):
    s = datetime.now()
    #with open(output_filepath + '_row_inds.pkl', 'wb') as outfile:
    #    pickle.dump(row_inds, outfile, pickle.HIGHEST_PROTOCOL)
    #with open(output_filepath + '_col_inds.pkl', 'wb') as outfile:
    #    pickle.dump(col_inds, outfile, pickle.HIGHEST_PROTOCOL)        
    
    assert len(row_inds) == len(col_inds)
    data = [True for i in range(len(row_inds))]
    td_mat_coo = scipy.sparse.coo_matrix((data, (row_inds, col_inds)), shape=(subset_row_count,150000), dtype=bool)
    scipy.sparse.save_npz(output_filepath + f"_{processed_count}.npz", td_mat_coo)
    print(f"Saved after {processed_count} / {total_rows} in {datetime.now() - s}. (inds: {len(col_inds)})")  # (curr shape: {td_mat_coo.get_shape()})
            
            
def build_sparse_matrix(diff_json_filepath, output_filepath, content_vocab_dict, removed_vocab_dict, inserted_vocab_dict):
    # compute counts for the reverted revisions and all revisions separately
    # oc = occurrence count (document frequency)
    total_rows = 9584147
    
    row_inds = []
    col_inds = []
    
    processed_count = 0
    with open(diff_json_filepath, 'r') as infile:
        curr_row = 0
        for i, line in tqdm(enumerate(infile), total=total_rows, desc='Populating sparse matrix'):
            diff = json.loads(line)
            content_set = set(diff['content_tokens'])
            removed_set = set(diff['removed_tokens'])
            inserted_set = set(diff['inserted_tokens'])
            content_inds = [content_vocab_dict[token] for token in content_set if token in content_vocab_dict]
            removed_inds = [removed_vocab_dict[token] + 50000 for token in removed_set if token in removed_vocab_dict]
            inserted_inds = [inserted_vocab_dict[token] + 100000 for token in inserted_set if token in inserted_vocab_dict]
            inds = sorted(content_inds + removed_inds + inserted_inds)
            row_inds.extend([curr_row for j in range(len(inds))])
            col_inds.extend(inds)
            processed_count += 1
            
            curr_row += 1
            if processed_count % 500000 == 0:  # keep down memory costs by saving subsets of the full matrix
                save_matrix(row_inds, col_inds, output_filepath, processed_count, total_rows, curr_row)
                row_inds = []
                col_inds = []
                curr_row = 0
        save_matrix(row_inds, col_inds, output_filepath, processed_count, total_rows, curr_row)
        #save_matrix(td_mat, output_filepath, processed_count, total_rows)

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
    #output_filepath = os.path.join(audit_dir, 'td_doc_150000_coo.npz')
    output_filepath = os.path.join(audit_dir, 'text_vectors', 'td_doc_150000_coo')
    
    build_sparse_matrix(diff_json_filepath, output_filepath, content_vocab_dict, removed_vocab_dict, inserted_vocab_dict)
    
    print("Finished.")
    

if __name__ == "__main__":
    main()
