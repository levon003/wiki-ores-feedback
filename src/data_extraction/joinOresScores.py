"""
The goal of this script is to merge with the output of extractStubRevData.

Note that currently data-merging is done in the create-table command in the audit_web_client itself.

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

"""