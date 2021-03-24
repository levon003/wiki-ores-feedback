from flask import (
    Blueprint, flash, g, redirect, render_template, request, url_for, make_response, send_from_directory
)
from werkzeug.exceptions import abort

bp = Blueprint('index', __name__)

@bp.route('/')
def redirect_to_index():
    return send_from_directory('www', 'index.html')

@bp.route('/app/<path:path>')
def redirect_to_index_from_path(path):
    return send_from_directory('www', 'index.html')

@bp.route('/api', methods=('GET',))
def get_api_route_description():
    return "API not yet designed for public access; documentation forthcoming."

@bp.route('/api/login', methods=('GET', 'POST'))
def login():
    return {'value': 'login'}

