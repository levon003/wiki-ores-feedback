
import subprocess
import os

def get_git_root_dir():
    res = subprocess.run(["git", "rev-parse", "--show-toplevel"], 
        stdout=subprocess.PIPE, 
        stderr=subprocess.PIPE
    )
    path = res.stdout.decode('utf-8').strip()
    return path

def get_mariadb_password(mysql_config_filepath):
    with open(mysql_config_filepath, 'r') as infile:
        res = infile.readlines()
        for line in res:
            line = line.strip()
            try:
                key, value = line.split(" = ")
                if key == 'password':
                    return value
            except:
                continue


MYSQL_CONFIG_FILEPATH = os.path.join(get_git_root_dir(), 'audit_web_client', 'replica.my.cnf')
MARIADB_PASSWORD = get_mariadb_password(MYSQL_CONFIG_FILEPATH)
