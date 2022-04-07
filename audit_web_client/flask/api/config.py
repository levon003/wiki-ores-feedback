
import subprocess
import os

from flask import current_app


def get_root_dir(env):
    if env == 'development':
        # during development, redirect to front-end dev server
        return os.path.join(get_git_root_dir(), 'audit_web_client')
    else:
        # path to directory on toolforge
        return "/data/project/ores-inspect/www/python/src/"


def get_git_root_dir():
    res = subprocess.run(["git", "rev-parse", "--show-toplevel"], 
        stdout=subprocess.PIPE, 
        stderr=subprocess.PIPE
    )
    path = res.stdout.decode('utf-8').strip()
    return path


def get_mysql_file_config(mysql_config_filepath):
    mysql_file_config = {}
    with open(mysql_config_filepath, 'r') as infile:
        res = infile.readlines()
        for line in res:
            line = line.strip()
            try:
                key, value = line.split(" = ")
                mysql_file_config[key] = value
            except:
                continue
    return mysql_file_config


def get_secret_config(env):
    MYSQL_CONFIG_FILEPATH = os.path.join(get_root_dir(env), 'replica.my.cnf')
    mysql_file_config = get_mysql_file_config(MYSQL_CONFIG_FILEPATH)
    secret_config = {
        'MYSQL_CONFIG_FILEPATH': MYSQL_CONFIG_FILEPATH,
        'MARIADB_PASSWORD': mysql_file_config['password'],

        'DEV_CONSUMER_KEY': mysql_file_config['dev_oauth_consumer_token'],
        'DEV_CONSUMER_SECRET': mysql_file_config['dev_oauth_consumer_secret'],
        'PROD_CONSUMER_KEY': mysql_file_config['prod_oauth_consumer_token'],
        'PROD_CONSUMER_SECRET': mysql_file_config['prod_oauth_consumer_secret'],

        # used by the mwoauth library to target an OAuth request
        'OAUTH_MWURI': 'https://en.wikipedia.org/w/index.php',

        'SECRET_KEY': mysql_file_config['secret_key'],
    }

    # use different OAuth consumers depending on dev vs prod
    if env == 'development':
        secret_config['CONSUMER_KEY'] = secret_config['DEV_CONSUMER_KEY']
        secret_config['CONSUMER_SECRET'] = secret_config['DEV_CONSUMER_SECRET']
    else:
        secret_config['CONSUMER_KEY'] = secret_config['PROD_CONSUMER_KEY']
        secret_config['CONSUMER_SECRET'] = secret_config['PROD_CONSUMER_SECRET']

    return secret_config
