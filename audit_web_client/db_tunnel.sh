#!/bin/bash

if [ ! -f "replica.my.cnf" ]; then
    echo "Expected configuration file with auth details.";
    exit 1;
fi

# TODO for a multi-developer team, need to connect with that user's username
ssh -N levon003@dev.toolforge.org -L 3306:enwiki.analytics.db.svc.wikimedia.cloud:3306
echo "Terminated SSH tunnel."
