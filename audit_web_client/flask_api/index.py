from flask import (
    Blueprint, flash, g, redirect, render_template, request, url_for, make_response
)
from werkzeug.exceptions import abort

bp = Blueprint('index', __name__)

@bp.route('/', methods=('GET', 'POST'))
def index():
    if request.method == 'POST':
        
        return {'key': 'value'}
        
        raise ValueError("POST not yet implemented")
    # TODO remove me or implement with more formal debug functionality
    return {'value': 201}

