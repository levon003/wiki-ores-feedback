#!/bin/bash
# Temp deployment script

REMOTE="levon003@login.toolforge.org:/data/project/ores-inspect/www/python/src"
CHMOD="--chmod=u+rwx,g+rwx,o+rx --perms"
rsync ${CHMOD} flask/app.py ${REMOTE}
rsync ${CHMOD} flask/api/*.py ${REMOTE}/api
rsync -r ${CHMOD} build/ ${REMOTE}/api/www
echo "Finished syncing."

#scp flask/app.py ${REMOTE}

#scp flask/api/*.py ${REMOTE}/api

#scp -r build ${REMOTE}/api/www