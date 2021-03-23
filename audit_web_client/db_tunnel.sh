#!/bin/bash

if [ ! -f "replica.my.cnf" ]; then
    echo "Expected configuration file with auth details.";
    exit 1;
fi

# TODO for a multi-developer team, need to connect with that user's username
ssh -N levon003@dev.toolforge.org \
    -L 3306:enwiki.analytics.db.svc.wikimedia.cloud:3306 \
    -L 3307:tools.db.svc.eqiad.wmflabs:3306
#ssh -N levon003@dev.toolforge.org -L 3306:tools.db.svc.wikimedia.cloud:3306

#tools.db.eqiad.wmflabs
#tools.db.svc.wikimedia.cloud
echo "Terminated SSH tunnel."
