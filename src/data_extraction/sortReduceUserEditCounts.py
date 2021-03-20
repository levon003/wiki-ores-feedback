import os
from collections import defaultdict
from tqdm import tqdm

git_root_dir = "/export/scratch2/levon003/repos/wiki-ores-feedback"
derived_data_dir = os.path.join(git_root_dir, "data", "derived")
working_dir = os.path.join(derived_data_dir, 'stub-history-all-revisions', 'oidb')

user_editcount_dict = defaultdict(int)

with open(os.path.join(working_dir, 'pre2018_edit_counts_ungrouped.tsv'), 'r') as infile:
    for line in infile:
        user_id, edit_count = line.strip().split('\t')
        user_id, edit_count = int(user_id), int(edit_count)
        user_editcount_dict[user_id] += edit_count
        
user_editcounts = list(user_editcount_dict.items())
user_editcounts.sort(key=lambda tup: tup[1], reverse=True)
with open(os.path.join(working_dir, 'pre2018_edit_counts.tsv'), 'w') as outfile:
    outfile.write('user_id\teditcount\n')
    for user_id, editcount in tqdm(user_editcounts):
        outfile.write(f'{user_id}\t{editcount}\n')