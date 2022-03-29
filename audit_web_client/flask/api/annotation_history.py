from flask import current_app, g, request, make_response, Blueprint
from flask import session as flask_session
from flask.cli import with_appcontext

from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy import insert, select, update
import sqlalchemy.sql.functions

import logging
from datetime import datetime
import pytz

from . import sample
from . import db
from . import user_db

bp = Blueprint('annotation_history', __name__)

def get_annotation_history(user_token):
    annotation_history = []
    Session = db.get_oidb_session()
    with Session() as session:
        with session.begin():
            aht = user_db.get_annotation_history_table()
            s = select(aht.c.custom_name, aht.c.total_annotated, aht.c.num_damaging, aht.c.num_flagged, aht.c.num_not_damaging).where(aht.c.user_token == user_token)
            for row in session.execute(s):
                custom_name, total_annotated, num_damaging, num_flagged, num_not_damaging = row
                annotation_history.append({'custom_name': custom_name, 'total_annotated': total_annotated, 'num_damaging': num_damaging, 'num_flagged': num_flagged, 'num_not_damaging': num_not_damaging})
    return {'annotation_history': annotation_history}


def add_new_annotation_history(request_json, user_token):
    filters = request_json['filters']
    focus = request_json['focus']['focus_selected']
    custom_name = request_json['custom_name']
    total_annotated = request_json['total_annotated']
    filter_hash = sample.get_filter_hash(filters)
    timestamp = int(datetime.now().replace(tzinfo=pytz.UTC).timestamp())
    Session = db.get_oidb_session()
    with Session() as session:
        with session.begin():
            aht = user_db.get_annotation_history_table()
            # let's check if this filter criteria is already in the user's annotation history.
            s = select(aht.c.total_annotated, aht.c.num_damaging, aht.c.num_flagged, aht.c.num_not_damaging).where(aht.c.user_token == user_token, aht.c.filter_hash == filter_hash)
            res = session.execute(s)
            if len(list(res)) == 0:
                i = aht.insert().values(
                    user_token=user_token,
                    last_updated=timestamp,
                    custom_name=custom_name,
                    filter_hash=filter_hash,
                    total_annotated=request_json['total_annotated'],
                    num_damaging=request_json['num_damaging'],
                    num_flagged=request_json['num_flagged'],
                    num_not_damaging=request_json['num_not_damaging']
                )
                session.execute(i)
            else:
                u = update(aht).where(aht.c.user_token == user_token, aht.c.filter_hash == filter_hash).values(
                    total_annotated=request_json['total_annotated'],
                    num_damaging=request_json['num_damaging'],
                    num_flagged=request_json['num_flagged'],
                    num_not_damaging=request_json['num_not_damaging'],
                )
    return get_annotation_history(user_token)


@bp.route('/api/annotation_history/', methods=('GET', 'POST',))
def handle_annotation_history_request():
    logger = logging.getLogger('annotation_history.handle_annotation_history_request')
    user_token = flask_session['username'] if 'username' in flask_session else ""
    if user_token == "":
        logger.warn("User not logged in, so setting this annotation history should be impossible.")
        return {'error': 'No identified user token.'}, 403
    request_json = request.get_json()
    if request.method == "POST":
        return add_new_annotation_history(request_json, user_token)
    elif request.method == "GET":
        return get_annotation_history(user_token)
    else:
        raise ValueError("Unexpected request method.")
