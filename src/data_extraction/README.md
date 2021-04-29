For scripts and code to extract info from flat files, i.e. XML wikipedia dumps.

## Creating the OIDB database for Ores-Inspect

Steps:
1. Run `python extractStubRevData.py` to create `/export/scratch2/levon003/repos/wiki-ores-feedback/data/derived/stub-history-all-revisions/oidb/revs_unsorted.tsv`
2. Run `sort -T /export/scratch2/tmp --parallel=8 -t $'\t' -k 1,1 -n revs_unsorted.tsv > revs.tsv` to create `/export/scratch2/levon003/repos/wiki-ores-feedback/data/derived/stub-history-all-revisions/oidb/revs.tsv`
3. Run `python joinOresScores.py` to create `/export/scratch2/levon003/repos/wiki-ores-feedback/data/derived/stub-history-all-revisions/oidb/revs_scored.tsv`
4. Run `flask create-db --revision` using the ores-inspect conda env `conda activate ores-inspect`. May need to set `FLASK_ENV=development` and `FLASK_APP=flask/api:create_app`. Note: need to run `flask create-db --page` first, if not previously performed and/or the page data has updated (which is produced by step 1).

