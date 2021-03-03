import os

from flask import Flask
from flask.logging import default_handler

import os
import sys
import logging
from datetime import datetime

VERSION = "0.0.1"


def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, 
        instance_relative_config=True,
        static_url_path='',
        static_folder='www'
    )
    app.config.from_mapping(
        SECRET_KEY='dev',
        DATABASE=os.path.join(app.instance_path, 'interface.sqlite'),
        INSTANCE_DATA_DIR=os.path.join(app.instance_path, 'data'),
        VERSION=VERSION,
    )
    
    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    os.makedirs(app.instance_path, exist_ok=True)
    os.makedirs(os.path.join(app.instance_path, 'log'), exist_ok=True)
    os.makedirs(app.config['INSTANCE_DATA_DIR'], exist_ok=True)
    
    # set up logging
    set_up_logging(app)
    
    from . import index
    app.register_blueprint(index.bp)
    #app.add_url_rule('/', endpoint='index')

    logging.info(app.url_map)
    
    return app

  
class FlaskLoggingFilter(logging.Filter):
    def filter(self, record):  # "should log this LogRecord?"
        # no idea what this is, but they spam at the DEBUG level
        if record.name == 'watchdog.observers.inotify_buffer':
            return False
        return True
  
  
def set_up_logging(app):
    root = logging.getLogger()
    root.setLevel(logging.DEBUG)
        
    stream_handler = logging.StreamHandler()
    # TODO Log at info level by default for normal operations
    stream_handler.setLevel(logging.DEBUG) 
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    stream_handler.setFormatter(formatter)
    stream_handler.addFilter(FlaskLoggingFilter())
    root.addHandler(stream_handler)
        
    root_logging_filename = f"{datetime.now().strftime('flask_backend_%Y-%m-%d-%H_%M_%S')}.log"
    root_logging_filepath = os.path.join(app.instance_path, 'log', root_logging_filename)
    file_handler = logging.FileHandler(root_logging_filepath)
    formatter = logging.Formatter('%(asctime)s,%(name)s,%(levelname)s,%(message)s')
    file_handler.setFormatter(formatter)
    file_handler.addFilter(FlaskLoggingFilter())
    root.addHandler(file_handler)
    
    # remove flask logging defaults
    app.logger.removeHandler(default_handler)
    
    logging.info("Loggers initiated.")
    logging.debug(f"Log filepath is '{root_logging_filepath}'.")
  
application = create_app()
