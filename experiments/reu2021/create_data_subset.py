"""
Author: Zachary Levonian

Script to subset the revs_scored.tsv file that forms the basis of the OIDB database.

Assumes file is sorted chronologically by rev_timestamp.
"""

import os
import json
import logging
from collections import defaultdict
from tqdm import tqdm
from datetime import datetime
import pytz
import numpy as np


def main():
    data_dir = "/export/scratch2/levon003/repos/wiki-ores-feedback/data"
    if not os.path.exists(data_dir):
        raise ValueError(f"Expected data directory '{data_dir}'. Is this Flagon?")
    oidb_dir = os.path.join(data_dir, 'derived', 'stub-history-all-revisions', 'oidb')
    rev_tsv_filepath = os.path.join(oidb_dir, 'revs_scored.tsv')
    
    
    end_date = datetime.fromisoformat('2019-02-01').replace(tzinfo=pytz.UTC)
    print(f"Keeping revisions before {end_date.isoformat()}.")
    end_timestamp = end_date.timestamp()
    
    output_filepath = "revs_scored_jan.tsv"
    with open(output_filepath, 'w') as outfile:
        with open(rev_tsv_filepath, 'r') as infile:
            header = "rev_timestamp,page_id,rev_id,prev_rev_id,is_minor,user_text,user_id,seconds_to_prev,curr_bytes,delta_bytes,has_edit_summary,is_reverted,is_revert,is_reverted_to_by_other,is_self_reverted,is_self_revert,revert_target_id,revert_set_size,revert_id,seconds_to_revert,damaging_pred,goodfaith_pred,model_version,user_is_bot,user_is_trusted,user_edit_count,page_rev_count,page_namespace,is_page_redirect\n".replace(',', '\t')
            outfile.write(header)
            for line in tqdm(infile, total=111200155, desc='Constructing revision table'):
                tokens = line.strip().split('\t')
                assert len(tokens) == 29
                rev_timestamp, page_id, rev_id, prev_rev_id, is_minor, user_text, user_id, seconds_to_prev, curr_bytes, delta_bytes, has_edit_summary, is_reverted, is_revert, is_reverted_to_by_other, is_self_reverted, is_self_revert, revert_target_id, revert_set_size, revert_id, seconds_to_revert, damaging_pred, goodfaith_pred, model_version, user_is_bot, user_is_trusted, user_edit_count, page_rev_count, page_namespace, is_page_redirect = tokens
                rev_timestamp = int(rev_timestamp)
                #print(f"{datetime.utcfromtimestamp(rev_timestamp)}")
                if rev_timestamp >= end_timestamp:
                    break
                outfile.write(line)
                
    
    
if __name__ == "__main__":
    main()
