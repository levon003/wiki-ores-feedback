"""
The goal of this script is to merge with the output of extractStubRevData.

Note that currently data-merging is done in the create-table command in the audit_web_client itself.
A newer version is in the OresHdfsDataInspection notebook.

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

"""