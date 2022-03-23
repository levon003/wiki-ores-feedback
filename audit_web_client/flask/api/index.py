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

@bp.route('/static/<path:path>')
def retrieve_static_files(path):
    # TODO does this even work?  Also need to investigate how to serve the root-directory files other than index.html effectively e.g. favicon.ico, robots.txt; could manually construct routes for them, perhaps?
    return send_from_directory('www/static', path)

@bp.route('/api', methods=('GET',))
def get_api_route_description():
    return "API not yet designed for public access; ask the developers if you would benefit from documentation."
