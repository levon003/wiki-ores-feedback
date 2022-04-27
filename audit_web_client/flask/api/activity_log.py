
from flask import current_app, g, request, make_response, Blueprint
from flask import session as flask_session
from flask.cli import with_appcontext

from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy import insert, select
import sqlalchemy.sql.functions

import logging
from datetime import datetime
import pytz
import json
import os

from . import db
from . import user_db


bp = Blueprint('activity_log', __name__)

def get_logging_filepath():
    if "logging_filepath" in g:
        return g.logging_filepath
    logging_filename = f"{datetime.now().strftime('activity_log_%Y-%m-%d')}.ndjson"
    g.logging_filepath = os.path.join(current_app.instance_path, 'log', logging_filename)
    return g.logging_filepath


@bp.route('/api/activity_log/', methods=('POST',))
def handle_logging():
    logger = logging.getLogger('activity_log.handle_logging')
    user_token = flask_session['username'] if 'username' in flask_session else ""

    request_json = request.get_json()
    if 'activity_type' not in request_json:
        return {'error': 'Expected activity_type in logging request.'}, 400
    if 'new_state' not in request_json:
        return {'error': 'Expected new_state in logging request.'}, 400
    
    activity_type = request_json['activity_type']
    new_state = request_json['new_state']
    timestamp = int(datetime.now().timestamp() * 1000)  # TODO verify the server is set to UTC
    
    log_entry = {
        'username': user_token,
        'timestamp': timestamp,
        'activity_type': activity_type,
        'new_state': new_state,
    }
    line = json.dumps(log_entry) + "\n"

    logging_filepath = get_logging_filepath()
    logger.info(f"Logging '{activity_type}' update to '{logging_filepath}'.")
    with open(logging_filepath, 'a') as outfile:
        outfile.write(line)
        outfile.flush()
    return make_response("Logging successful.", 200)

