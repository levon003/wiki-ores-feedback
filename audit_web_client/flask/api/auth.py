
import click
from flask import current_app, g, request, make_response, Blueprint
from flask.cli import with_appcontext

from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy import select

import logging
from urllib.parse import unquote
from datetime import datetime

from . import replica
from . import db

bp = Blueprint('auth', __name__)


@bp.route('/auth/login')
def login():
    logger = logging.getLogger('auth.login')
    start = datetime.now()

    logger.info(f"Logged in in {datetime.now() - start}.")
    return

