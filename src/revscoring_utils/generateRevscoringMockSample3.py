#!/usr/bin/env python3

import os
import json
import sys
import pandas as pd
from tqdm import tqdm


def get_input_rev_ids(derived_data_dir):
    # read in the sample dataframe
    revision_sample_dir = os.path.join(derived_data_dir, 'revision_sample')
    sample_filepath = os.path.join(revision_sample_dir, 'sample3_all.pkl')
    rev_df = pd.read_pickle(sample_filepath)
    # sort chronologically
    rev_df = rev_df.sort_values(by='rev_timestamp')
    print("Finished loading and sorting sample data.")
    # return the rev ids
    return rev_df.rev_id.tolist()


def main():
    # read in the input
    git_root_dir = "/export/scratch2/levon003/repos/wiki-ores-feedback"
    derived_data_dir = os.path.join(git_root_dir, "data", "derived")
    rev_id_list = get_input_rev_ids(derived_data_dir)
    rev_id_set = set(rev_id_list)
  
    # set paths
    working_dir = os.path.join(git_root_dir, "data/derived/labeled-revs/sample3-features")
    mock_rev_filepath = os.path.join(working_dir, "sample3.mock.json")
    features_filepath = os.path.join(working_dir, "sample3.damaging.tsv")
    
    cache_filepath = os.path.join(working_dir, "sample3.mock.w_cache.json")
    prev_cache_filepath = os.path.join(working_dir, "sample3.mock.w_cache.backup.json")
    
    # if a cache file already exits, consolidate it with any backup cache if necessary
    # otherwise, create the backup cache from the current cache file
    if os.path.exists(cache_filepath):
        # Consolidate cache files if necessary
        if os.path.exists(prev_cache_filepath):
            # consolidate old cache files
            with open(prev_cache_filepath, 'a') as outfile:
                with open(cache_filepath, 'r') as infile:
                    for line in infile:
                        outfile.write(line)
            print(f"Combined 2+ existing cache files at path '{prev_cache_filepath}'.")
        else:
            # No existing "old" cache; can create it by renaming the newly-old cache file
            os.rename(cache_filepath, prev_cache_filepath)
            print(f"Moved backup cache file from '{cache_filepath}' to '{prev_cache_filepath}'.")
        assert os.path.exists(prev_cache_filepath), "Failed to transition existing cache data to backup cache."
        if os.path.exists(cache_filepath):
            # remove any existing cache file, now that the backup of the existing cache is finished
            os.remove(cache_filepath)
    else:
        print("No existing cache file; a new one will be created.")

    # identify rev_ids that have already been extracted
    if os.path.exists(prev_cache_filepath):
        existing_rev_count = 0
        with open(prev_cache_filepath, 'r') as infile:
            for line in tqdm(infile):
                cache_entry = json.loads(line)
                cached_rev_id = cache_entry['rev_id']
                if cached_rev_id in rev_id_set:
                    rev_id_set.remove(cached_rev_id)
                    existing_rev_count += 1
        if len(rev_id_set) > 0:
            print(f"Identified {len(rev_id_set)} rev_ids that still need cache extraction ({existing_rev_count} existing).")
        else:
            print("No additional revisions to extract in this sample! No processing will be done.")
            sys.exit(0)
    else:
        print(f"No backup cache found at '{prev_cache_filepath}'.")
    
    # trim out removed revs
    trimmed_rev_id_list = []
    for rev_id in rev_id_list:
        if rev_id in rev_id_set:
            trimmed_rev_id_list.append(rev_id)
    rev_id_list = trimmed_rev_id_list
    
    # trim rev_ids to the top 1 million
    if len(rev_id_list) > 1000000:
        print("Restricting rev_ids generated to 1,000,000.")
        rev_id_list = rev_id_list[:1000000]
        
    # mock up the rev_ids in json
    mock_template = '{"rev_id": %d, "auto_labeled": false, "damaging": false, "goodfaith": true, "autolabel": {}}'
    with open(mock_rev_filepath, 'w') as outfile:
        for rev_id in rev_id_list:
            line = mock_template % rev_id
            outfile.write(line + "\n")
    
    # generate the revscoring command needed to extract the feature cache
    generate_cache_command = f"cat {mock_rev_filepath} | revscoring extract editquality.feature_lists.enwiki.damaging editquality.feature_lists.enwiki.goodfaith --host https://en.wikipedia.org --extractors 32 --verbose > {cache_filepath}"
    print(generate_cache_command)
        
    # generate the revscoring command to extract the features from the cache
    extract_features_command = f"revscoring dump_cache --input {cache_filepath} --output {features_filepath} editquality.feature_lists.enwiki.damaging damaging"
    print(extract_features_command)
    

if __name__ == '__main__':
    main()
