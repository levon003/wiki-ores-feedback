#!/bin/bash
# Temp deployment script

DEPLOYING_USERNAME="${1:-levon003}"
echo "Deploying as user '${DEPLOYING_USERNAME}'."

REMOTE="${DEPLOYING_USERNAME}@login.toolforge.org:/data/project/ores-inspect/www/python/src"
CHMOD="--chmod=u+rwx,g+rwx,o+rx --perms"
rsync ${CHMOD} replica.my.cnf ${REMOTE}
rsync ${CHMOD} flask/app.py ${REMOTE}
rsync ${CHMOD} flask/requirements.txt ${REMOTE}
rsync ${CHMOD} flask/api/*.py ${REMOTE}/api
rsync -r ${CHMOD} build/ ${REMOTE}/api/www
echo "Finished syncing."

#scp flask/app.py ${REMOTE}

#scp flask/api/*.py ${REMOTE}/api

#scp -r build ${REMOTE}/api/www
