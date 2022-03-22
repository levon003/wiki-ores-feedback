
import click
from flask import current_app, request, Blueprint, session, redirect, url_for
from flask.cli import with_appcontext

from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy import select

import mwoauth
import logging
from urllib.parse import unquote
from datetime import datetime

from . import replica
from . import db

bp = Blueprint('auth', __name__)


@bp.route('/auth/login')
def login():
    logger = logging.getLogger('auth.login')

    consumer_token = mwoauth.ConsumerToken(
        current_app.config['CONSUMER_KEY'], current_app.config['CONSUMER_SECRET'])
    try:
        redirect_request, request_token = mwoauth.initiate(
            current_app.config['OAUTH_MWURI'], consumer_token
        )
    except Exception:
        logger.exception('mwoauth.initiate failed')
        return redirect(url_for('index.redirect_to_index'))
    else:
        session['request_token'] = dict(zip(
            request_token._fields, request_token))
        return redirect(redirect_request)


@bp.route('/auth/callback')
def callback():
    logger = logging.getLogger('auth.callback')
    if 'request_token' not in session:
        logger.warn('OAuth callback failed. Are cookies disabled?')
        return redirect(url_for('index.redirect_to_index'))

    consumer_token = mwoauth.ConsumerToken(
        current_app.config['CONSUMER_KEY'], current_app.config['CONSUMER_SECRET'])

    try:
        access_token = mwoauth.complete(
            current_app.config['OAUTH_MWURI'],
            consumer_token,
            mwoauth.RequestToken(**session['request_token']),
            request.query_string)

        identity = mwoauth.identify(
            current_app.config['OAUTH_MWURI'], consumer_token, access_token)    
    except Exception:
        logger.exception('OAuth authentication failed')
    
    else:
        session['access_token'] = dict(zip(
            access_token._fields, access_token))
        session['username'] = identity['username']

    
    response = redirect(url_for('index.redirect_to_index'))
    # note: could set an additional cookie here, using response.set_cookie?
    # otherwise: figure out what cookie mwoauth is setting and check for it on the front-end
    return response


def init_app(app):
    pass
