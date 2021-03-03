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

@bp.route('/api', methods=('GET', 'POST'))
def index():
    if request.method == 'POST':
        
        return {'key': 'value'}
        
        raise ValueError("POST not yet implemented")
    # TODO remove me or implement with more formal debug functionality
    return {'value': 201}

