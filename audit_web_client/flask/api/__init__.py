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
        MYSQL_CONFIG_FILEPATH=os.path.join(app.root_path, 'replica.my.cnf'),
	    REPLICA_DB_PORT=3308,
	    TOOLS_DB_PORT=3307,
    )
    
    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile(os.path.join(app.root_path, 'config.py'), silent=False)

        # check to see if port configuration has been provided
        port_config_filepath = os.path.join(app.root_path, 'port_config.py')
        if os.path.exists(port_config_filepath):
            app.config.from_pyfile(port_config_filepath, silent=False)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    os.makedirs(app.instance_path, exist_ok=True)
    os.makedirs(os.path.join(app.instance_path, 'log'), exist_ok=True)
    os.makedirs(app.config['INSTANCE_DATA_DIR'], exist_ok=True)
    
    # set up logging
    set_up_logging(app)
    logging.info(f"Root path: {app.root_path}")
    
    from . import index
    app.register_blueprint(index.bp)
    #app.add_url_rule('/', endpoint='index')

    from . import auth
    auth.init_app(app)
    app.register_blueprint(auth.bp)


    from . import db
    db.init_app(app)

    from . import user_db
    user_db.init_app(app)

    from . import replica
    replica.init_app(app)

    from . import sample
    app.register_blueprint(sample.bp)
    sample.init_app(app)

    from . import annotation
    app.register_blueprint(annotation.bp)

    from . import autocomplete
    app.register_blueprint(autocomplete.bp)

    logging.info(app.url_map)
    logging.debug('Loaded configuration mapping:')
    for key, value in app.config.items():
        logging.debug(f'{key}: \t{value}')
    
    return app

  
class FlaskLoggingFilter(logging.Filter):
    def filter(self, record):  # "should log this LogRecord?"
        # no idea what this is, but they spam at the DEBUG level
        if record.name == 'watchdog.observers.inotify_buffer':
            return False
        return True
  
  
def set_up_logging(app):
    root = logging.getLogger()
    if len(root.handlers) > 0:
        # if the Flask reloader is active, it tries to set up the logger twice
        # stop if we already have the appropriate handlers i.e. any handlers
        return
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
