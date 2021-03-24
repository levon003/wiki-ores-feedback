#!/bin/bash

if [ -f "replica.my.cnf" ]; then
    #export MARIADB_PASSWORD="$( grep 'password = .*' replica.my.cnf | sed 's/password = //' )";
    export FLASK_APP=flask/api:create_app
    export FLASK_ENV=development
    flask test-replica
else
    echo "Expected configuration file with auth details.";
fi

