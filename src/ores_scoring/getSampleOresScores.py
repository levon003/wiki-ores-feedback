#!/usr/bin/env python3
# Script to retreive ORES scores for a sample

import mwapi
import mwxml
import mwxml.utilities
import mwcli
import oresapi

import numpy as np
import pandas as pd
import os
from tqdm import tqdm
import bz2
import gzip
import json
import re
import hashlib
from datetime import datetime
import nltk
import scipy.stats
import para
from itertools import groupby
from collections import Counter
import pickle


def main():
    # set directories
    git_root_dir = '/export/scratch2/levon003/repos/wiki-ores-feedback'
    derived_data_dir = os.path.join(git_root_dir, "data", "derived")
    working_dir = os.path.join(derived_data_dir, 'revision_sample')
    
    # read in the sample dataframe
    revision_sample_dir = os.path.join(derived_data_dir, 'revision_sample')
    sample1_filepath = os.path.join(revision_sample_dir, 'sample2_1M.pkl')
    rev_df = pd.read_pickle(sample1_filepath)
    
    rev_id_list = rev_df.rev_id
    print(f"Attempting to retrieve ORES scores for {len(rev_id_list)} rev_ids.")
    
    session = oresapi.Session("https://ores.wikimedia.org", 
                              user_agent="levon003@umn.edu - ores.api for UMN research",
                              parallel_requests=2, batch_size=50)
    scores = session.score("enwiki", ["damaging", "goodfaith"], rev_id_list)
    
    scores_list = []
    ores_score_filepath = os.path.join(working_dir, 'sample2_ores_scores.csv')
    with open(ores_score_filepath, 'w') as outfile:
        total_processed = 0
        for rev_id, score in tqdm(zip(rev_id_list, scores), total=len(rev_id_list)):
            score['rev_id'] = rev_id
            scores_list.append(score)
            damaging_score = -1
            damaging_prediction = ""
            if 'damaging' in score and 'score' in score['damaging']:
                damaging_score = score['damaging']['score']['probability']['true']
                damaging_prediction = str(score['damaging']['score']['prediction'])
            goodfaith_score = -1
            goodfaith_prediction = ""
            if 'goodfaith' in score and 'score' in score['goodfaith']:
                goodfaith_score = score['goodfaith']['score']['probability']['true']
                goodfaith_prediction = str(score['goodfaith']['score']['prediction'])
            outfile.write(f"{rev_id},{damaging_score},{damaging_prediction},{goodfaith_score},{goodfaith_prediction}\n")
            total_processed += 1
    
    # save out the scores list so it can be inspected
    scores_pickle_filepath = os.path.join(working_dir, 'sample2_scores_list.pkl')
    with open(scores_pickle_filepath, 'wb') as outfile:
        pickle.dump(scores_list, outfile)
        
    print(f"Processed {total_processed} ORES scores.")
        
        
if __name__ == "__main__":
    main()
