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
            s = select(aht.c.custom_name, aht.c.total_annotated, aht.c.num_damaging, aht.c.num_flagged, aht.c.num_not_damaging, aht.c.prediction_filter, aht.c.revert_filter, aht.c.history_id).where(aht.c.user_token == user_token, aht.c.deleted == False).order_by(aht.c.last_updated.desc())
            for row in session.execute(s):
                custom_name, total_annotated, num_damaging, num_flagged, num_not_damaging, prediction_filter, revert_filter, history_id = row
                annotation_history.append({'custom_name': custom_name, 'total_annotated': total_annotated, 'num_damaging': num_damaging, 'num_flagged': num_flagged, 'num_not_damaging': num_not_damaging, 'prediction_filter': prediction_filter, 'revert_filter': revert_filter, 'history_id': history_id})
    return {'annotation_history': annotation_history}


def add_new_annotation_history(request_json, user_token):
    logger = logging.getLogger("annotation_history.add_new_annotation_history")
    filters = request_json['filters']
    if 'focus' in request_json:
        focus_selected = request_json['focus']['focus_selected']
        filters['prediction_filter'] = focus_selected['prediction_filter']
        assert filters['prediction_filter'] in ['very_likely_bad', 'very_likely_good', 'confusing', 'any']
        filters['revert_filter'] = focus_selected['revert_filter']
        assert filters['revert_filter'] in ['reverted', 'nonreverted', 'any']
    else:
        filters['prediction_filter'] = 'any'
        filters['revert_filter'] = 'any'
        logger.warn("No focus_selected key provided in the JSON body of this request; using defaults.")
        raise ValueError("No focus_selected.")

    custom_name = request_json['custom_name']
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
                    created_at=timestamp,
                    last_updated=timestamp,
                    deleted=False,
                    custom_name=custom_name,
                    filter_hash=filter_hash,
                    prediction_filter=filters['prediction_filter'],
                    revert_filter=filters['revert_filter'],
                    total_annotated=request_json['total_annotated'],
                    num_damaging=request_json['num_damaging'],
                    num_flagged=request_json['num_flagged'],
                    num_not_damaging=request_json['num_not_damaging']
                )
                session.execute(i)
            else:
                u = update(aht).where(aht.c.user_token == user_token, aht.c.filter_hash == filter_hash).values(
                    last_updated=timestamp,
                    deleted=False,
                    total_annotated=request_json['total_annotated'],
                    num_damaging=request_json['num_damaging'],
                    num_flagged=request_json['num_flagged'],
                    num_not_damaging=request_json['num_not_damaging'],
                )
                session.execute(u)
    return get_annotation_history(user_token)

def delete_annotation_history(history_id, user_token):
    Session = db.get_oidb_session()
    logger = logging.getLogger('annotation_history.delete_annotation_history')
    with Session() as session:
        with session.begin():
            aht = user_db.get_annotation_history_table()
            s = select(aht.c.user_token).where(aht.c.history_id == history_id)
            res = list(session.execute(s))
            if len(list(res)) == 0:
                return {'error': 'History id not found.'}
            elif res[0][0] != user_token:
                return {'error': 'Cannot delete another user\'s history'}
            else:
                u = update(aht).where(aht.c.history_id == history_id).values(
                    deleted=True
                )
                session.execute(u)
                return {'success': f'history with id {history_id} deleted'}, 200


@bp.route('/api/annotation_history/', methods=('GET', 'POST'))
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

@bp.route('/api/annotation_history/delete/<history_id>', methods=('DELETE',))
def handle_annotation_history_delete(history_id):
    logger = logging.getLogger('annotation_history.handle_annotation_history_delete')
    user_token = flask_session['username'] if 'username' in flask_session else ""
    if user_token == "":
        logger.warn("User not logged in, so deleting this annotation history should be impossible.")
        return {'error': 'No identified user token.'}, 403
    return delete_annotation_history(int(history_id), user_token)
