
import subprocess
import os

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


MYSQL_CONFIG_FILEPATH = os.path.join(get_git_root_dir(), 'audit_web_client', 'replica.my.cnf')
mysql_file_config = get_mysql_file_config(MYSQL_CONFIG_FILEPATH)

MARIADB_PASSWORD = mysql_file_config['password']

DEV_OAUTH_CONSUMER_TOKEN = mysql_file_config['dev_oauth_consumer_token']
DEV_OAUTH_CONSUMER_SECRET = mysql_file_config['dev_oauth_consumer_secret']
DEV_OAUTH_ACCESS_TOKEN = mysql_file_config['dev_oauth_access_token']
DEV_OAUTH_ACCESS_SECRET = mysql_file_config['dev_oauth_access_secret']

#CONSUMER_KEY = DEV_OAUTH_CONSUMER_TOKEN
#CONSUMER_SECRET = DEV_OAUTH_CONSUMER_SECRET
CONSUMER_KEY = mysql_file_config['oauth_consumer_token']
CONSUMER_SECRET = mysql_file_config['oauth_consumer_secret']

OAUTH_MWURI = 'https://en.wikipedia.org/w/index.php'

SECRET_KEY = mysql_file_config['secret_key']
