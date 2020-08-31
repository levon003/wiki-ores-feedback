# coding: utf-8

# Revert Classification - Prediction
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
parser.add_argument("--model")
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

# Load the features (2020-08-01 tsv file)
s = datetime.now()
labeled_revs_dir = os.path.join(derived_data_dir, 'labeled-revs')
sample3_features_dir = os.path.join(labeled_revs_dir, 'sample3-features')
sample3_damaging_filepath = os.path.join(sample3_features_dir, 'sample3.damaging.2020-08-01T05:40:00Z.tsv')
features_df = pd.read_csv(sample3_damaging_filepath, sep='\t', header=0)
print(f"Features data loaded in {datetime.now() - s}.")

# drop the useless 'damaging' column (it is auto-generated)
features_df = features_df.drop(columns='damaging')

# load the rev_ids that correspond to the feature data
revid_filepath = os.path.join(labeled_revs_dir, 'sample3-features', 'rev_id_2020-08-01T05:40:00Z.txt')
rev_id_list = pd.read_csv(revid_filepath, header=None)
assert len(rev_id_list) == len(features_df)

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

# now compute the outcome, which is a variant of `rev_df.is_reverted`
reverted_rev_ids = set()
# only count it as a reverted revision if it was not a self-revert
# and it was reverted within one week
threshold_low = args.thresh_l
threshold_high = args.thresh_h
rs = revert_df[~revert_df.is_self_revert]
for row in tqdm(rs.itertuples(), total=len(rs)):
    reverting_timestamp = row.reverting_timestamp
    for rev_id, timestamp in zip(row.reverted_rev_ids, row.reverted_timestamps):
        if reverting_timestamp - timestamp <= threshold_high and reverting_timestamp - timestamp > threshold_low:
            reverted_rev_ids.add(rev_id)

# #### Create the actual outcome variable and add it to the features dataframe

is_reverted = [rev_id in reverted_rev_ids for rev_id in rev_id_list.iloc[:,0]]
features_df['is_reverted'] = is_reverted

################################################################

# scale X vars
X_test = sklearn.preprocessing.scale(features_df.iloc[:,:-1])

# load model from file
md_dir = '/export/scratch2/wastv004/wiki-ores-feedback/results_train_allsample3/models'
md_filepath = os.path.join(md_dir, args.model)
md_name = os.path.splitext(args.model)[0]
md = load(md_filepath)

# predict on new data
s = datetime.now()
y_pred_test_calib = md.predict_proba(X_test)[:,1]

print(f"Prediction completed in {datetime.now() - s}.")

# save prediction results
pred_results = pd.DataFrame()
pred_results['test_calib'] = y_pred_test_calib
pred_results['test_label'] = np.array(features_df['is_reverted'])
pred_results['rev_id'] = np.array(rev_id_list.iloc[:,0])
print(pred_results.head())
    
results_filepath = os.path.join('/export/scratch2/wastv004/wiki-ores-feedback/results_train_allsample3/predictions', md_name + '_prediction_2020-08-01.pkl')
pred_results.to_pickle(results_filepath)
print(results_filepath)

