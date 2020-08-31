# coding: utf-8

# Revert Classification - Demo
# ===
# 
# Building a classifier to predict reverts and produce calibrated propensity scores for being reverted.

import numpy as np
import pandas as pd

import os
from tqdm import tqdm
import bz2
import sqlite3
import difflib
import gzip
import json
import re
import hashlib
from datetime import datetime
from datetime import timezone
import scipy.stats
from itertools import groupby
from collections import Counter

import sklearn
import sklearn.ensemble
import sklearn.metrics
import sklearn.calibration
from sklearn.model_selection import cross_val_score

import math
import argparse
import sys

from joblib import dump, load

parser = argparse.ArgumentParser()
parser.add_argument("--maxdepth", type = int)
parser.add_argument("--maxfeat", type = int)
parser.add_argument("--thresh_l", type = int)
parser.add_argument("--thresh_h", type = int)
args = parser.parse_args()

raw_data_dir = "/export/scratch2/wiki_data"
derived_data_dir = os.path.join('/export/scratch2/levon003/repos/wiki-ores-feedback', "data", "derived")
stub_history_dir = os.path.join(derived_data_dir, 'stub-history-all-revisions')
revision_sample_dir = os.path.join(derived_data_dir, 'revision_sample')
working_dir = os.path.join(derived_data_dir, 'audit')

# ### Data loading and cleaning
# read in the sample dataframe
s = datetime.now()
revision_sample_dir = os.path.join(derived_data_dir, 'revision_sample')
sample3_filepath = os.path.join(revision_sample_dir, 'sample3_all.pkl')
rev_df = pd.read_pickle(sample3_filepath)
print(f"Sample 3 data loaded in {datetime.now() - s}.")

# Load the features
s = datetime.now()
labeled_revs_dir = os.path.join(derived_data_dir, 'labeled-revs')
sample3_features_dir = os.path.join(labeled_revs_dir, 'sample3-features')
sample3_damaging_filepath = os.path.join(sample3_features_dir, 'sample3.damaging.2020-07-11T15:11:15Z.tsv')
features_df = pd.read_csv(sample3_damaging_filepath, sep='\t', header=0)
print(f"Features data loaded in {datetime.now() - s}.")

# drop the useless 'damaging' column (it is auto-generated)
features_df = features_df.drop(columns='damaging')

# load in the rev_ids that correspond to the feature data
# this is really slow, because it requires JSON decoding
# this could be made faster by caching the result
cache_filepath = os.path.join(labeled_revs_dir, 'sample3-features', 'sample3.mock.w_cache.2020-07-11T15:11:15Z.json')
cache_rev_id_list = []
with open(cache_filepath, 'r') as infile:
    for line in tqdm(infile, total=len(features_df)):
        rev = json.loads(line)
        rev_id = rev['rev_id']
        cache_rev_id_list.append(rev_id)

assert len(cache_rev_id_list) == len(features_df)

cache_rev_id_set = set(cache_rev_id_list)

# use the last revision in this same to figure out when the analysis end time should be
last_rev = cache_rev_id_list[-1]

# every rev_id in the cache should ALSO be in the rev_df
assert len(cache_rev_id_set & set(rev_df.rev_id)) == len(cache_rev_id_set), len(cache_rev_id_set & set(rev_df.rev_id))

# set the analysis start time to be the beginning of 2018
analysis_start_date = datetime.fromisoformat('2018-01-01')
analysis_start_date = analysis_start_date.replace(tzinfo=timezone.utc)
analysis_start_timestamp = int(analysis_start_date.timestamp())
print(f"Starting analysis from {datetime.utcfromtimestamp(analysis_start_timestamp)}")

# note that this is less than 2 months of data right now!
# we have 20-25 million downloaded, but this 4 million set should be enough to get going
analysis_end_timestamp = rev_df[rev_df.rev_id == last_rev].rev_timestamp.iloc[0]
print(f"Using revisions up to {datetime.utcfromtimestamp(analysis_end_timestamp)}")

# mostly to save memory, we trim out unneeded data in the rev_df
rev_df = rev_df[(rev_df.rev_timestamp <= analysis_end_timestamp)&(rev_df.rev_timestamp >= analysis_start_timestamp)]

# Read the revert info
# This dataframe contains additional data beyond what is in the rev_df
s = datetime.now()
stub_history_reverts_dir = os.path.join(derived_data_dir, 'stub-history-reverts')
revert_df_filepath = os.path.join(stub_history_reverts_dir, 'revert_df.pkl')
revert_df = pd.read_pickle(revert_df_filepath)
print(f"Loaded revert data in {datetime.now() - s}.")

# The most important info in the `revert_df` that isn't in the `rev_df` is the username info, which enables the identification of self-reverts.
# `revert_df` has one line per **revert** revision, compared to the `rev_df` which has one line per revision.

# identify self-reverts
is_self_revert_list = []
for row in tqdm(revert_df.itertuples(), total=len(revert_df)):
    is_self_revert = row.reverting_user_text in row.reverted_user_texts
    is_self_revert_list.append(is_self_revert)
revert_df['is_self_revert'] = is_self_revert_list

# only keep reverts that appear in the (filtered) rev_df
analysis_rev_ids = set(rev_df.rev_id)
revert_subset = revert_df[revert_df.reverting_rev_id.isin(analysis_rev_ids)].copy()

# now compute the outcome, which is a variant of `rev_df.is_reverted`
reverted_rev_ids = set()
# only count it as a reverted revision if it was not a self-revert
# and it was reverted within the specified time window (threshold_low to threshold_high)
threshold_low = args.thresh_l
threshold_high = args.thresh_h
rs = revert_subset[~revert_subset.is_self_revert]
for row in tqdm(rs.itertuples(), total=len(rs)):
    reverting_timestamp = row.reverting_timestamp
    for rev_id, timestamp in zip(row.reverted_rev_ids, row.reverted_timestamps):
        if reverting_timestamp - timestamp <= threshold_high and reverting_timestamp - timestamp > threshold_low:
            reverted_rev_ids.add(rev_id)

revids_filepath = os.path.join('/export/scratch2/wastv004/wiki-ores-feedback/results_train_allsample3/models/', 'revertedrevids_' + str(threshold_low) + '_' + str(threshold_high) + '.pkl')
pd.DataFrame(list(reverted_rev_ids)).to_pickle(revids_filepath)

# just for fun, we'll compare how the revised revert outcome we computed in the cell above compares to 
# the broader definition of reverting
rev_df['is_reverted_for_damage'] = rev_df.rev_id.map(lambda rev_id: rev_id in reverted_rev_ids)

# our revised revert measure trims off 84251 of 499347 (16.9%) of the total reverts
# as expected, all revisions with is_reverted == 0 also have is_reverted_for_damage == 1
#pd.crosstab(rev_df.is_reverted, rev_df.is_reverted_for_damage, margins=True)

# #### Create the actual outcome variable and add it to the features dataframe
# `features_df` contains only the features, not the revision ids. We create a binary outcome column based on the order of the revisions as they were read from the cache (and stored in `cache_rev_id_list`).

is_reverted = [rev_id in reverted_rev_ids for rev_id in cache_rev_id_list]
features_df['is_reverted'] = is_reverted

###########################################
# using all training data
train = features_df
X_train = sklearn.preprocessing.scale(train.iloc[:,:-1])

# GB classifier
clf = sklearn.ensemble.GradientBoostingClassifier(
    learning_rate=0.01, 
    n_estimators=700, 
    max_features=args.maxfeat,
    max_depth=args.maxdepth
)
print(clf)

# Train GB model
# Use CalibratedClassifierCV to produce calibrated probability predictions for the test data
s = datetime.now()
ccCV = sklearn.calibration.CalibratedClassifierCV(clf, method = "isotonic", cv = 5)

md = ccCV.fit(X_train, train.iloc[:,-1])

print(f"Training completed in {datetime.now() - s}.")

# save model to file
md_filepath = os.path.join('/export/scratch2/wastv004/wiki-ores-feedback/results_train_allsample3/models/', 'GB_' + str(args.maxfeat) + '_' + str(args.maxdepth) + '_' + str(threshold_low) + '_' + str(threshold_high) + '.joblib')
dump(md, md_filepath)