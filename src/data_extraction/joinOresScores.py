"""
The goal of this script is to merge with the output of extractStubRevData.
Basically, adds a few columns to each row with ORES predictions (and filters out a few rows for which we can't retrieve predictions.)

Other notes during conceptualization of task:
Idea: load into memory all of the 2019 posts. Add whatever ORES scores we can, filtering as we go. (i.e. don't include in the dataset revisions that don't have associated scores.)

We should also produce columns with the autolabel "reverted for damage" columns.
https://github.com/wikimedia/editquality/blob/master/editquality/utilities/autolabel.py
Reverted for damage has a multi-part definition:
 - Identified as a revert by the detector (with some radius)
 - Not by a user in a trusted group
 - Not more than X revisions (X=1000?)
 - Not a self-revert
 - Not a "revision that is reverted back to by others"

Self-revert: user-text of reverting user == user-text of this [reverted] revision
"revision that is reverted back to by others": Is a revert target (is_revert_target) AND 
    reverted_doc['user'] != reverted_to.reverting['user']

A revert is any edit that returns a page's content to that of a previous revision.*
A reverted edit is one undone by a revert. Some reverted edits are "damaging" and against consensus, while others are reverted for other reasons, such as mistakes, edit wars, and . 

Which reverted edits are "reverted for damage"?  (Unchecked == "I don't trust that these reverted edits were actually for damage", checked == "I consider these reverted edits ")
[x] Edits from registered users with fewer than 1000 edits
[x] Edits reverted between [0 seconds] and [1 year]

Alternate: which reverted edits do you think are non-damaging?
[ ] Reverted to by others (?) If a revision is maintained by edits 
[ ] Self-reverts (?) Reverts of an edit by the same user
[ ] Edits from registered users in a trusted group (?) Trusted user groups are sysops, oversight, bot, rollbacker, checkuser, abusefilter, bureaucrat

*A revert is any edit that returns a page's content to that of _one of the last 15 previous revisions_.  Otherwise, an edit that blanks a page would be a "revert" of all prior revisions on that page.

See: https://meta.wikimedia.org/wiki/Research:Revert

"""

import numpy as np
import pandas as pd
import os
import json
from datetime import datetime
import dateutil
import pytz
import pickle
from tqdm import tqdm

ores_preds_2019_filepath = "/export/scratch2/levon003/repos/wiki-ores-feedback/data/raw/editquality/hdfs/ores_scores_damaging-goodfaith_enwiki_2019_01-12.json"
oidb_dir = "/export/scratch2/levon003/repos/wiki-ores-feedback/data/derived/stub-history-all-revisions/oidb"
TRUSTED_GROUPS = ['sysops','oversight','bot','rollbacker','checkuser','abusefilter','bureaucrat']


def get_ores_df():
    # read in the ores predictions
    s = datetime.now()
    ores_df = pd.read_feather(os.path.join(oidb_dir, 'ores_2019.feather'))
    print(f"Loaded {len(ores_df)} rows from feather in {datetime.now() - s}.")
    
    s = datetime.now()
    ores_df = ores_df.sort_values(by='pred_timestamp', ascending=True)
    print(f"Finished sort in {datetime.now() - s}.")
    
    s = datetime.now()
    rev_counts = ores_df.rev_id.value_counts()
    print(f"Identified {len(rev_counts)} unique rev_ids of which {np.sum(rev_counts > 1)} are duplicated at least once. Done in {datetime.now() - s}.")

    # drop duplicate rev_ids
    s = datetime.now()
    ores_df = ores_df.drop_duplicates(subset='rev_id', keep='first')
    print(f"Filtered duplicates in {datetime.now() - s}: {len(ores_df)} remaining in ORES predictions.")
    
    # make rev_id the index
    ores_df = ores_df.set_index('rev_id')
    return ores_df


def get_missing_ores_df():
    oidb_dir = "/export/scratch2/levon003/repos/wiki-ores-feedback/data/derived/stub-history-all-revisions/oidb"
    missing_ores_df = pd.read_csv(os.path.join(oidb_dir, 'rev_ids_missing_scores_available.csv'), 
                                 header=None,
                                 names=['rev_id', 'damaging_pred', 'damaging_label', 'd_model_version', 'goodfaith_pred', 'goodfaith_label', 'gf_model_version']
                                 )
    print(f"Loaded {len(missing_ores_df)} rows from CSV for missing_ores_df.")
    
    # make rev_id the index
    missing_ores_df = missing_ores_df.set_index('rev_id')
    
    return missing_ores_df


def get_page_info_dict():
    page_info_dict = {}
    with open(os.path.join(oidb_dir, 'page.ndjson'), 'r') as infile:
        for line in tqdm(infile, total=15570615, desc='Parsing page data'):
            page = json.loads(line)
            page_id = page['page_id']
            page_info = page['range_rev_count'], page['wiki_namespace'], page['is_page_redirect']
            page_info_dict[page_id] = page_info
    return page_info_dict


def generate_user_text_dict(ores_df, use_cached_if_available=True, should_cache_result=True):
    user_text_dict_filepath = os.path.join(oidb_dir, 'ores_df_user_text_dict.pkl')
    if use_cached_if_available and os.path.exists(user_text_dict_filepath):
        with open(user_text_dict_filepath, 'rb') as handle:
            user_text_dict = pickle.load(handle)
        print("Successfully retrieved user_text_dict from cache.")
        return user_text_dict
    
    user_text_dict = {}
    on_newcomer_crux_count = 0
    on_max_edit_crux_count = 0
    for user_text, group in tqdm(ores_df.groupby(by='user_text', sort=False), desc='Generating user_text_dict'):
        user_is_bot = np.any(group.user_is_bot)
        user_is_trusted = np.any(group.user_is_trusted)
        min_edits = np.min(group.user_edit_count)
        max_edits = np.max(group.user_edit_count)
        if min_edits < 10 and max_edits > 10:
            #print(f"User on the 10-edit crux; {user_text}")
            #print(group)
            #break
            on_newcomer_crux_count += 1
        elif min_edits < 500 and max_edits > 500:
            #print(f"User on the 500-edit crux; {user_text}")
            #print(group)
            #break
            on_max_edit_crux_count += 1
        user_edit_count = int(np.median(group.user_edit_count))
        user_text_dict[user_text] = (user_is_bot, user_is_trusted, user_edit_count)
    print(f"Identified {on_newcomer_crux_count} users on the crux between newcomer and learner (10 edits).")
    print(f"Identified {on_max_edit_crux_count} users on the crux between learner and experienced (500 edits).")
    if should_cache_result:
        with open(user_text_dict_filepath, 'wb') as handle:
            pickle.dump(user_text_dict, handle, protocol=pickle.HIGHEST_PROTOCOL)
        print("Successfully cached user_text_dict for future use.")
    return user_text_dict


def join_ores_scores(ores_df, missing_ores_df, page_info_dict, user_text_dict):
    start_date = datetime.fromisoformat('2019-01-01').replace(tzinfo=pytz.UTC)  # start of 2019
    start_timestamp = int(start_date.timestamp())
    midpoint_date = datetime.fromisoformat('2020-01-01').replace(tzinfo=pytz.UTC)
    midpoint_timestamp = int(midpoint_date.timestamp())
    end_date = datetime.fromisoformat('2021-01-01').replace(tzinfo=pytz.UTC)
    end_timestamp = int(end_date.timestamp())
    with open(os.path.join(oidb_dir, 'revs.tsv'), 'r') as infile, open(os.path.join(oidb_dir, 'revs_scored.tsv'), 'w') as outfile:
        processed_count = 0
        missing_rev_ids = set()
        missing_score_count = 0
        existing_user_available_count = 0
        for line in tqdm(infile, total=55130432, desc='Reading revision data'):
            processed_count += 1
            tokens = line.strip().split('\t')
            assert len(tokens) == 20
            rev_timestamp, page_id, rev_id, prev_rev_id, is_minor, user_text, user_id, seconds_to_prev, curr_bytes, delta_bytes, has_edit_summary, is_reverted, is_revert, is_reverted_to_by_other, is_self_reverted, is_self_revert, revert_target_id, revert_set_size, revert_id, seconds_to_revert = tokens
            rev_id = int(rev_id)
            page_id = int(page_id)
            rev_timestamp = int(rev_timestamp)
            if rev_timestamp > midpoint_timestamp:
                break
            # speed note: using .at is fast, much faster than .loc, still slower than dicts but fine
            if rev_id in ores_df.index:
                damaging_pred = ores_df.at[rev_id, 'damaging_pred']
                goodfaith_pred = ores_df.at[rev_id, 'goodfaith_pred']
                model_version = ores_df.at[rev_id, 'model_version']
                user_is_bot = ores_df.at[rev_id, 'user_is_bot']
                user_is_trusted = ores_df.at[rev_id, 'user_is_trusted']
                user_edit_count = ores_df.at[rev_id, 'user_edit_count']
            elif rev_id in missing_ores_df.index:
                missing_score_count += 1
                if missing_score_count == 1:
                    print("Identified first available 'missing' score.")
                damaging_pred = missing_ores_df.at[rev_id, 'damaging_pred']
                goodfaith_pred = missing_ores_df.at[rev_id, 'goodfaith_pred']
                model_version = missing_ores_df.at[rev_id, 'd_model_version']

                #user_group = ores_df[ores_df.user_text == user_text]
                #if len(user_group) == 0:
                if user_text not in user_text_dict:
                    user_is_bot = False
                    user_is_trusted = False
                    user_edit_count = 0
                else:
                    existing_user_available_count += 1
                    if existing_user_available_count == 1:
                        print(f"Identified first 'missing' rev with available user info. {rev_id} {user_text}")
                    user_is_bot, user_is_trusted, user_edit_count = user_text_dict[user_text]
                    #user_is_bot = np.any(user_group.user_is_bot)
                    #user_is_trusted = np.any(user_group.user_is_trusted)
                    #user_edit_count = int(np.median(user_group.user_edit_count))
            else:
                # rev id just plain missing
                missing_rev_ids.add(rev_id)
                if len(missing_rev_ids) == 1:
                    print(f"Identified first completely missing score. {rev_id}")
                continue
            # get page data
            page_info = page_info_dict[page_id]
            page_rev_count, page_namespace, is_page_redirect = page_info

            new_line = line.strip() + f"\t{damaging_pred}\t{goodfaith_pred}\t{model_version}\t{user_is_bot}\t{user_is_trusted}\t{user_edit_count}\t{page_rev_count}\t{page_namespace}\t{is_page_redirect}\n"
            outfile.write(new_line)
    print(f"{len(missing_rev_ids)} missing rev ids of {processed_count} processed ({len(missing_rev_ids) / processed_count*100:.2f}%).")
    print(f"In {missing_score_count} - {existing_user_available_count} = {missing_score_count - existing_user_available_count} cases ({existing_user_available_count / missing_score_count * 100:.2f}%), we had no user info so we assumed the user was not a bot, not trusted, and had no edits.")

    
def main():
    s = datetime.now()
    ores_df = get_ores_df()
    missing_ores_df = get_missing_ores_df()
    page_info_dict = get_page_info_dict()
    user_text_dict = generate_user_text_dict(ores_df)
    
    join_ores_scores(ores_df, missing_ores_df, page_info_dict, user_text_dict)
    print("Finished in {datetime.now() - s}.")
    
    
if __name__ == '__main__':
    main()
