#!/bin/bash
# Script intended to be run on login.toolforge.org as the tool user

COMMAND="create-db"
echo "Executing Flask command '${COMMAND}'."
export 'FLASK_APP=api:create_app' && export 'FLASK_ENV=toolforge' && flask ${COMMAND}
