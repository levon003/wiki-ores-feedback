#!/usr/bin/env python3
# Script to compute KLD divergence in parallel
# uses a downsampled version of the training data
# this reversion computes KL(P||Q) where P is the month sample and Q is the training data.
# This may be better-motivated: https://stats.stackexchange.com/questions/188903/intuition-on-the-kullback-leibler-kl-divergence/189758#189758

import numpy as np
import pandas as pd
import mwxml
import mwxml.utilities
import os
import requests
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
import time
from multiprocessing import Pool
from scipy.spatial import cKDTree as KDTree


def KLdivergence(x, y):
    """Compute the Kullback-Leibler divergence between two multivariate samples.
    Parameters
    ----------
    x : 2D array (n,d)
    Samples from distribution P, which typically represents the true
    distribution.
    y : 2D array (m,d)
    Samples from distribution Q, which typically represents the approximate
    distribution.
    Returns
    -------
    out : float
    The estimated Kullback-Leibler divergence D(P||Q).
    References
    ----------
    Pérez-Cruz, F. Kullback-Leibler divergence estimation of
    continuous distributions IEEE International Symposium on Information
    Theory, 2008.
    
    https://gist.github.com/atabakd/ed0f7581f8510c8587bc2f41a094b518
    """

    eta = 0.0000000001

    # Check the dimensions are consistent
    x = np.atleast_2d(x)
    y = np.atleast_2d(y)

    n,d = x.shape
    m,dy = y.shape

    assert d == dy
    assert n != 0
    assert n != 1

    # Build a KD tree representation of the samples and find the nearest neighbour
    # of each point in x.
    xtree = KDTree(x)
    ytree = KDTree(y)

    # Get the first two nearest neighbours for x, since the closest one is the
    # sample itself.
    r = xtree.query(x, k=2, eps=.01, p=2)[0][:,1]
    s = ytree.query(x, k=1, eps=.01, p=2)[0]
    s[s == 0] = eta
    
    # There is a mistake in the paper. In Eq. 14, the right side misses a negative sign
    # on the first term of the right hand side.
    ratio = r/s
    return -np.log(ratio, where=ratio > 0).sum() * d / n + np.log(m / (n - 1.))


def compute_kld(sdf, tdf):
    kl_sample_n = 10000
    n_iters = 200
    eta = 0.0000000001
    kld_list = []
    for i in range(n_iters):
        kld = KLdivergence(sdf.sample(n=kl_sample_n).to_numpy(), (tdf.sample(n=kl_sample_n) + eta).to_numpy())
        kld_list.append(kld)
    return kld_list


def main():
    git_root_dir = "/export/scratch2/levon003/repos/wiki-ores-feedback"
    working_dir = os.path.join(git_root_dir, 'data/derived/data-shifts')
    os.makedirs(working_dir, exist_ok=True)

    derived_data_dir = os.path.join(git_root_dir, 'data/derived')
    train_downsampled_dir = os.path.join(derived_data_dir, 'ores-train-resampling')
    revisions_features_filepath = os.path.join(train_downsampled_dir, "enwiki.labeled_revisions.20k_2015.downsampled.damaging.tsv")
    features_df = pd.read_csv(revisions_features_filepath, sep='\t', header=0)
    sdf = features_df.drop(columns='damaging')

    # load all the month feature dataframes
    month_sample_features_dir = os.path.join(derived_data_dir, "stub-history-all-revisions/month_sample/revscoring_features")
    year = 2014
    month = 4
    month_id_list = []
    month_feature_df_list = []
    while year != 2020:
        month_sample_filepath = os.path.join(month_sample_features_dir, 
                                             f"rev_ids_month_sample_{year}_{month:0>2}.mock.damaging.tsv")
        assert os.path.exists(month_sample_filepath), f"Path '{month_sample_filepath}' not found."
        month_features_df = pd.read_csv(month_sample_filepath, sep='\t', header=0)
        assert len(month_features_df >= 19800)
        month_id_list.append(int(f"{year}{month:0>2}"))
        month_feature_df_list.append(month_features_df)
        month += 1
        if month == 13:
            month = 1
            year += 1
    print(f"Loaded {len(month_feature_df_list)} month samples of features.")
    
    # compute K-L divergence between the training data and each of the months in the month sample
    start = datetime.now()
    with Pool(processes=32) as pool:
        multiple_results = [pool.apply_async(compute_kld, kwds={'sdf': month_features_df.drop(columns='damaging'), 
                                                                'tdf': sdf}) 
                            for month_features_df in month_feature_df_list]
        result_arrs = []
        for result in tqdm(multiple_results, total=len(month_feature_df_list)):
            result_arrs.append(result.get())
    assert len(result_arrs) == len(month_id_list)
        
    # save the KL divergence computed
    # along with the month_id
    output_filepath = os.path.join(working_dir, 'month_sample_training_downsampled_inverse_kld_200.csv')
    with open(output_filepath, 'w') as outfile:
        for i, result in enumerate(result_arrs):
            month_id = month_id_list[i]
            line = f"{month_id},"
            line += ",".join([str(kld) for kld in result])
            line += "\n"
            outfile.write(line)
    print(f"Finished at {datetime.now()} after {datetime.now() - start}.")
    
    
if __name__ == "__main__":
    main()
