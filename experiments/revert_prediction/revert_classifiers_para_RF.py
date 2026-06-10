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

parser = argparse.ArgumentParser()
parser.add_argument("--maxdepth", type = int)
parser.add_argument("--nest", type = int)
parser.add_argument("--maxfeat", type = int)
parser.add_argument("--minleaf", type = int)
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
# and it was reverted within one week
threshold = 60 * 60 * 24 * 7 
rs = revert_subset[~revert_subset.is_self_revert]
for row in tqdm(rs.itertuples(), total=len(rs)):
    reverting_timestamp = row.reverting_timestamp
    for rev_id, timestamp in zip(row.reverted_rev_ids, row.reverted_timestamps):
        if reverting_timestamp - timestamp <= threshold:
            reverted_rev_ids.add(rev_id)

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

#Train/test split: test_a is last 20% of revisions, test_b is first 20%
train_a = features_df.head(math.floor(len(features_df)*.8))
test_a = features_df.tail(math.ceil(len(features_df)*.2))

train_b = features_df.tail(math.floor(len(features_df)*.8))
test_b = features_df.head(math.ceil(len(features_df)*.2))

# scale X vars for all four data sets
X_train_a = sklearn.preprocessing.scale(train_a.iloc[:,:-1])
X_test_a = sklearn.preprocessing.scale(test_a.iloc[:,:-1])
X_train_b = sklearn.preprocessing.scale(train_b.iloc[:,:-1])
X_test_b = sklearn.preprocessing.scale(test_b.iloc[:,:-1])

#Use train_a and test_a
X_train = X_train_a
train = train_a
X_test = X_test_a
test = test_a

# Read hyperparameter arguments
n_est = args.nest
maxdepth = args.maxdepth
maxfeat = args.maxfeat
minleaf = args.minleaf

clf = sklearn.ensemble.RandomForestClassifier(
    n_estimators=n_est,
    max_depth=maxdepth,
    max_features = maxfeat,
    min_samples_leaf = minleaf
)

# Train RF model
clf_results = pd.DataFrame()
s = datetime.now()
print(clf)

# train the model
md = clf.fit(X_train, train.iloc[:,-1])

# predict with the model
y_pred_test = md.predict(X_test)
y_pred_test_proba = md.predict_proba(X_test)[:,1]

print(f"Training completed in {datetime.now() - s}.")

# save results for this classifier in a dataframe
clf_results['test_pred'] = y_pred_test
clf_results['test_calib'] = y_pred_test_proba
clf_results['test_label'] = np.array(test['is_reverted'])

print(clf_results.head())

# save results dataframe to file
clf_filepath = os.path.join('/export/scratch2/wastv004/wiki-ores-feedback/', 'RF_' + str(n_est) + '_' + str(maxfeat) + '_' + str(maxdepth) + '_' + str(minleaf) + '.pkl')
print(clf_filepath)

clf_results.to_pickle(clf_filepath)