#!/usr/bin/env python3

import os
import json
import sys
import pandas as pd


def get_input_rev_ids(derived_data_dir):
    # read in the sample dataframe
    revision_sample_dir = os.path.join(derived_data_dir, 'revision_sample')
    sample2_filepath = os.path.join(revision_sample_dir, 'sample2_1M.pkl')
    rev_df = pd.read_pickle(sample2_filepath)
    return set(rev_df.rev_id.tolist())


def main():
    # read in the input
    git_root_dir = "/export/scratch2/levon003/repos/wiki-ores-feedback"
    derived_data_dir = os.path.join(git_root_dir, "data", "derived")
    rev_id_set = get_input_rev_ids(derived_data_dir)
  
    # set paths
    working_dir = os.path.join(git_root_dir, "data/derived/labeled-revs")
    mock_rev_filepath = os.path.join(working_dir, "sample2.mock.json")
    features_filepath = os.path.join(working_dir, "sample2.mock.damaging.tsv")
    
    # identify rev_ids that already exist in the cache
    # and remove them
    cache_filepath = os.path.join(working_dir, "sample2.mock.w_cache.json")
    existing_cache_file = False
    if os.path.exists(cache_filepath):
        existing_cache_file = True
        with open(cache_filepath, 'r') as infile:
            for line in infile:
                cache_entry = json.loads(line)
                cached_rev_id = cache_entry['rev_id']
                if cached_rev_id in rev_id_set:
                    rev_id_set.remove(cached_rev_id)
        if len(rev_id_set) > 0:
            print(f"Identified {len(rev_id_set)} rev_ids that still need cache extraction.")
        else:
            print("No additional revisions to extract!")
            sys.exit(0)
        
        prev_cache_filepath = os.path.join(working_dir, "sample2.mock.w_cache.old.json")
        os.rename(cache_filepath, prev_cache_filepath)
        print(f"Moved old cache file from '{cache_filepath}' to '{prev_cache_filepath}'.")
    
        
    # mock up the rev_ids in json
    mock_template = '{"rev_id": %d, "auto_labeled": false, "damaging": false, "goodfaith": true, "autolabel": {}}'
    with open(mock_rev_filepath, 'w') as outfile:
        for rev_id in rev_id_set:
            line = mock_template % rev_id
            outfile.write(line + "\n")
    
    # generate the revscoring command needed to extract the feature cache
    generate_cache_command = f"cat {mock_rev_filepath} | revscoring extract editquality.feature_lists.enwiki.damaging editquality.feature_lists.enwiki.goodfaith --host https://en.wikipedia.org --extractors 32 --verbose > {cache_filepath}"
    print(generate_cache_command)
    
    # generate the command needed to consolidate cache files, if such consolidation is required
    if existing_cache_file:
        consolidate_cache_command = f"cat {prev_cache_filepath} >> {cache_filepath}"
        print(consolidate_cache_command)
    
    # generate the revscoring command to extract the features from the cache
    extract_features_command = f"revscoring dump_cache --input {cache_filepath} --output {features_filepath} --verbose editquality.feature_lists.enwiki.damaging damaging"
    print(extract_features_command)
    

if __name__ == '__main__':
    main()
