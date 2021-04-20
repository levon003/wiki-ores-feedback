#!/usr/bin/env python3
# Script to retreive ORES scores for a sample

import mwapi
import mwxml
import mwxml.utilities
import mwcli
import oresapi

import os
from tqdm import tqdm
from datetime import datetime


def main():
    # set directories
    oidb_dir = "/export/scratch2/levon003/repos/wiki-ores-feedback/data/derived/stub-history-all-revisions/oidb"
    input_filepath = os.path.join(oidb_dir, 'rev_ids_missing_scores_2.txt')
    output_filepath = os.path.join(oidb_dir, 'rev_ids_missing_scores_scored_2.csv')
    
    # extract the revision ids to retrieve
    with open(input_filepath, 'r') as infile:
        rev_id_list = []
        for line in infile:
            rev_id = int(line.strip())
            rev_id_list.append(rev_id)
    print(f"Attempting to retrieve ORES scores for {len(rev_id_list)} rev_ids.")
    
    # establish the session and create the score iterator
    session = oresapi.Session("https://ores.wikimedia.org", 
                              user_agent="levon003@umn.edu - ores-inspect Toolforge user",
                              parallel_requests=2, batch_size=50)
    
    model_names=["damaging", "goodfaith"]
    model_versions = session.get_model_versions("enwiki", models=model_names)
    damaging_version = model_versions['damaging']
    goodfaith_version = model_versions['goodfaith']
    print(f"Retrieving scores from v{damaging_version} of the damaging model and v{goodfaith_version} of the goodfaith model.")
    
    scores = session.score("enwiki", model_names, rev_id_list)
    
    scores_list = []
    with open(output_filepath, 'w') as outfile:
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
            outfile.write(f"{rev_id},{damaging_score},{damaging_prediction},{damaging_version},{goodfaith_score},{goodfaith_prediction},{goodfaith_version}\n")
            total_processed += 1        
    print(f"Processed {total_processed} ORES scores.")
        
        
if __name__ == "__main__":
    main()

    