#!/usr/bin/env python3
# Simple script to compute correlations for inserted and removed tokens

import numpy as np
import pandas as pd
from tqdm import tqdm
import os
import sqlite3
from datetime import datetime
import scipy.stats
import scipy.sparse


def create_array(token_index, db, total=9584147):
    token_indicator_arr = np.zeros(total, dtype=bool)
    cursor = db.execute('SELECT revision_index FROM inds WHERE token_index = ?', (token_index,))
    inds = cursor.fetchall()
    if len(inds) > 0:
        inds_arr = np.array([ind[0] for ind in inds])
        token_indicator_arr[inds_arr] = 1
    return token_indicator_arr


def main():
    git_root_dir = '/export/scratch2/levon003/repos/wiki-ores-feedback'
    raw_data_dir = "/export/scratch2/wiki_data"
    derived_data_dir = os.path.join(git_root_dir, "data", "derived")
    
    revision_sample_dir = os.path.join(derived_data_dir, 'revision_sample')

    s = datetime.now()
    audit_dir = os.path.join(derived_data_dir, 'audit')
    merged_preds_df_filepath = os.path.join(audit_dir, 'merged_preds.pkl')
    merged_preds_df = pd.read_pickle(merged_preds_df_filepath)
    print(f"Preds loaded. {datetime.now() - s}, pred count={len(merged_preds_df)}")
    
    rev_id_list = []
    with open(os.path.join(audit_dir, 'rev_id_2020-08-01T05:40:00Z.txt'), 'r') as infile:
        for line in infile:
            if line.strip() != '':
                rev_id = int(line.strip())
                rev_id_list.append(rev_id)
    print("Loaded rev id list:", len(rev_id_list))
    
    merged_preds_df['raw_misalignment'] = merged_preds_df.damaging_prob_calibrated - merged_preds_df.revert_prob
    merged_preds_df['binary_misalignment'] = merged_preds_df.damaging_prob_calibrated - merged_preds_df.is_reverted_1week
    
    rev_id_misalignment_dict = {row.rev_id: row.raw_misalignment for row in tqdm(merged_preds_df.itertuples(), total=len(merged_preds_df), desc='Building misalignment dict')}
    rev_id_binary_misalignment_dict = {row.rev_id: row.binary_misalignment for row in tqdm(merged_preds_df.itertuples(), total=len(merged_preds_df), desc='Building binary misalignment dict')}
    
    misalignment = np.zeros(len(rev_id_list), dtype=float)
    for i, rev_id in tqdm(enumerate(rev_id_list), total=len(rev_id_list), desc='Building misalignment arr'):
        if rev_id in rev_id_misalignment_dict:
            misalignment[i] = rev_id_misalignment_dict[rev_id]
    binary_misalignment = np.zeros(len(rev_id_list), dtype=float)
    for i, rev_id in tqdm(enumerate(rev_id_list), total=len(rev_id_list), desc='Building binary misalignment arr'):
        if rev_id in rev_id_binary_misalignment_dict:
            binary_misalignment[i] = rev_id_binary_misalignment_dict[rev_id]
            
    db = sqlite3.connect(
        os.path.join(audit_dir, 'td_doc_indices.sqlite'),
        detect_types=sqlite3.PARSE_DECLTYPES
    )
    try:
        with open(os.path.join(audit_dir, 'doc_corr_2020-08-01T05:40:00Z.csv'), 'w') as outfile:
            outfile.write("token_index,token_count,raw_misalignment_r,raw_misalignment_p,binary_misalignment_r,binary_misalignment_p\n")
            for i in tqdm(range(50000,150000), desc='Computing corrs'):
                token_indicator_arr = create_array(i, db)
                token_count = np.sum(token_indicator_arr)
                r, p = 0, 0
                if token_count > 0:
                    r, p = scipy.stats.pointbiserialr(token_indicator_arr, misalignment)
                    r_binary, p_binary = scipy.stats.pointbiserialr(token_indicator_arr, binary_misalignment)
                outfile.write(f"{i},{token_count},{r},{p},{r_binary},{p_binary}\n")
    finally:
        db.close()


if __name__ == "__main__":
    main()
