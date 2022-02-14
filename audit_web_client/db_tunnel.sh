#!/bin/bash

if [ ! -f "replica.my.cnf" ]; then
    echo "Expected configuration file with auth details.";
    exit 1;
fi

# if no argument provided, assume the user is levon003 (sorry, other team members)
# otherwise, need to provide the connection username as an argument to this script
user=${1:-levon003}
echo "Connecting as '${user}'."
replica_db_local_port=${2:-3306}
tool_db_local_port=${3:-3307}
echo "Tunneling replica DB to local port ${replica_db_local_port}."
echo "Tunneling tool DB to local port ${tool_db_local_port}."

ssh -N ${user}@dev.toolforge.org \
    -L ${replica_db_local_port}:enwiki.analytics.db.svc.wikimedia.cloud:3306 \
    -L ${tool_db_local_port}:tools.db.svc.eqiad.wmflabs:3306

echo "Terminated SSH tunnel."
