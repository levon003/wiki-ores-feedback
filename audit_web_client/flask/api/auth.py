
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


def get_auth_redirect_request():
    if current_app.config['ENV'] == 'development':
        # during development, redirect to front-end dev server
        return redirect("http://localhost:3000")
    else:
        # redirect to index of the app
        return redirect(url_for('index.redirect_to_index'))

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
        return get_auth_redirect_request()
    else:
        session['request_token'] = dict(zip(
            request_token._fields, request_token))
        return redirect(redirect_request)


@bp.route('/auth/callback')
def callback():
    logger = logging.getLogger('auth.callback')
    if 'request_token' not in session:
        logger.warn('OAuth callback failed. Are cookies disabled?')
        return get_auth_redirect_request()

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

    response = get_auth_redirect_request()
    # note: could set an additional cookie here, using response.set_cookie?
    # otherwise: figure out what cookie mwoauth is setting and check for it on the front-end
    response.set_cookie(
        "username",
        "Suriname0",
    )

    return response


def init_app(app):
    pass
