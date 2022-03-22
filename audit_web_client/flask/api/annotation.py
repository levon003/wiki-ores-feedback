from flask import current_app, g, request, make_response, Blueprint
from flask import session as flask_session
from flask.cli import with_appcontext

from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy import insert, select
import sqlalchemy.sql.functions

import logging
from datetime import datetime
import pytz

from . import db
from . import user_db


bp = Blueprint('annotation', __name__)


def set_annotation_data(user_token, rev_id, timestamp, annotation_type, annotation_data):
    logger = logging.getLogger('annotation.set_annotation_data')
    Session = db.get_oidb_session()
    with Session() as session:
        with session.begin():
            rat = user_db.get_rev_annotation_table()

            i = rat.insert().values(
                rev_id=rev_id,
                timestamp=timestamp,
                user_token=user_token,
                annotation_type=annotation_type,
                annotation_data=annotation_data,
            )
            result = session.execute(i)
            assert result.rowcount == 1
            # TODO somehow check to see if the execution fails



def set_revision_annotation(user_token):
    logger = logging.getLogger('annotation.set_revision_annotation')
    data = request.get_json()
    data = data if data is not None else {}
    if 'rev_id' not in data or 'annotation_type' not in data:
        return {}, 404
    rev_id = data['rev_id']
    annotation_type = data['annotation_type']
    logger.info(f"Setting annotation for rev {rev_id} of type '{annotation_type}'. (user='{user_token}')")

    annotation_data = None
    if annotation_type == 'correctness':
        correctness_type = data['correctness_type']
        annotation_data = correctness_type if correctness_type is not None else "none"
    elif annotation_type == 'note':
        note_text = data['note_text']
        annotation_data = note_text if note_text is not None else ""
    else:
        raise ValueError(f"Annotation type {annotation_type} not yet implemented.")

    timestamp = int(datetime.now().replace(tzinfo=pytz.UTC).timestamp())
    set_annotation_data(user_token, rev_id, timestamp, annotation_type, annotation_data)

    # now that the new data is saved, retrieve the current annotation data for this revision
    return get_revision_annotation(user_token, rev_id)


def get_revision_annotation(user_token, rev_id):
    logger = logging.getLogger('annotation.get_revision_annotation')

    # this is the JSON data that is returned with this request
    data = {
        'rev_id': rev_id,
        'correctness_type': None,
        'note': None,
    }

    existing_annotation_identified = False
    Session = db.get_oidb_session()
    with Session() as session:
        with session.begin():
            rat = user_db.get_rev_annotation_table()  # rat = "rev_annotation table"
            most_recent = select(sqlalchemy.sql.functions.max(rat.c.annotation_id)).\
                where(
                    rat.c.rev_id == rev_id, 
                    rat.c.user_token == user_token
                ).\
                group_by(rat.c.annotation_type).scalar_subquery()
            s = select(rat.c.timestamp, rat.c.annotation_type, rat.c.annotation_data).\
                where(
                    rat.c.annotation_id.in_(most_recent)
                )
            # logger.info(s)  # note: this is a way of seeing the raw SQL that will actually be executed
            for row in session.execute(s):
                timestamp, annotation_type, annotation_data = row
                if annotation_type == 'correctness':
                    data['correctness_type'] = annotation_data if annotation_data != 'none' else None
                    logger.info(f"Identified existing correctness annotation '{annotation_data}', originally made {datetime.utcfromtimestamp(timestamp)} ({timestamp}). (user='{user_token}')")
                    existing_annotation_identified = True
                elif annotation_type == 'note':
                    data['note'] = annotation_data
                    logger.info(f"Identified existing note annotation with {len(annotation_data)} characters, originally made {datetime.utcfromtimestamp(timestamp).replace(tzinfo=pytz.UTC)} ({timestamp}). (user='{user_token}')")
                    existing_annotation_identified = True
                else:
                    logger.warn(f"Annotation type {annotation_type} not yet implemented.")
    if not existing_annotation_identified:
        logger.info(f"Identified no existing annotations for rev_id {rev_id}. (user='{user_token}')")

    return data, 200


@bp.route('/api/annotation/', methods=('GET', 'POST',))
def handle_annotation_request():
    logger = logging.getLogger('annotation.handle_annotation_request')
    user_token = flask_session['username'] if 'username' in flask_session else ""
    if user_token == "":
        logger.warn("User not logged in, so setting this annotation should be impossible.")
    if request.method == 'POST':
        # trying to set the value of an annotation
        return set_revision_annotation(user_token)
    elif request.method == 'GET':
        # trying to get the value of an annotation
        if 'rev_id' not in request.args:
            logger.warn("Received annotation GET that doesn't specify the rev_id.")
            return {'error': 'Expected rev_id parameter.'}, 404
        rev_id = int(request.args['rev_id'])
        return get_revision_annotation(user_token, rev_id)
    else:
        raise ValueError("Unexpected request method.")
