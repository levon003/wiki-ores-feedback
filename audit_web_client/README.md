Audit Web Client
===

A web application for auditing ORES predictions.

The deployed version is available at: https://ores-inspect.toolforge.org/

The web interface is built using a React front-end and a Flask back-end.
The Flask back-end uses SQLite as its database.
The React front-end is based directly on the [Devias Kit - React Admin Dashboard](https://material-ui.com/store/items/devias-kit/) code.

### Prepare for local development
 - Install `node` and `yarn` (`npm install -g yarn`)
 - From this directory (`audit_web_client`), run `npm install`.
 - We use the [Feature Branch Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow), generally speaking. No specific naming guidance for the branches, but `feature/<feature_name>` is a good choice.
 - Get a Wikitech account
   - Follow these instructions to create an account: https://wikitech.wikimedia.org/wiki/Help:Create_a_Wikimedia_developer_account  Follow the "Toolforge users" instructions after doing the prerequisites.
   - Follow these steps (which include the step of creating and uploading SSH keys to your account, which you will need to do): https://wikitech.wikimedia.org/wiki/Help:Getting_Started#Get_started_with_Toolforge
   - Tell Zach to add you to the maintainers list: https://toolsadmin.wikimedia.org/tools/id/ores-inspect/maintainers/

#### Backend set-up

 - You'll need Python to run the backend: I recommend installing Anaconda, but if you already have a 3.5+ Python version on your system that's probably fine (Verify with `python --version` from the command line).
 - To use the backend, you'll need the production database credentials. 
   - Ask Zach for the replica.my.cnf file you need.
   - Place the replica.my.cnf file in this directory (wiki-ores-feedback/audit_web_client) on your development system.
 - You need to install the Python requirements listed at `flask/requirements.txt`
   - Run `pip install -r flask/requirements.txt`
   - Most likely, `mysqlclient` installation will fail.
     - Follow installation instructions here: https://pypi.org/project/mysqlclient/
       - Note: you only NEED the client connectors, but installing the full server package on your OS is fine as well. e.g. on Mac I ran `brew install mysql`.
     - For Windows installations, see [this StackOverflow post](https://stackoverflow.com/questions/51146117/installing-mysqlclient-in-python-3-6-in-windows).
     - See relevant SQLAlchemy documentation [here](https://docs.sqlalchemy.org/en/14/dialects/mysql.html#module-sqlalchemy.dialects.mysql.mysqldb).
     - It would not be that challenging to change from a mysqlclient dependency to a mysqlclient OR PyMySql dependency, so let me know if you have a lot of issues installing mysqlclient.  

### Developing

To start the development backend: `yarn start-flask`

To start the development frontend: `yarn start`

#### Developing remotely

If you're running the backend on another server, you can use whatever port you want to run that server, just make sure to port forward to port 5000 e.g. `ssh -L 5000:localhost:5001 {iuser}@{server_name}`.  This is necessary because the development OAuth consumer will redirect to the URL `https://localhost:5000`.

#### Directory structure

Directories:
 - `flask`: Code for the Flask back-end.
 - `public`: Static assets.
 - `src`: Where all of the front-end implementation lives.
 - `jsconfig.json`: Defines dependencies and yarn commands.

Not version controlled:
 - `node_modules`: Managed by npm.
 - `build`: Output produced by `yarn build`.
 - `instance`: Output produced by Flask backend.

### Deployment

Currently just scratch notes for this process.

- To recreate the condition that the Flask server expects for the static front-end files, run `yarn build`, then `ln -s build flask/api/www`, then `yarn start-flask`. Then, try http://localhost:5000/ (rather than port 3000 for the node development server).
 - The deployment script uses rsync to deal with whatever issue is stopping permissions from being set correctly from the user's umask.  Note that it only copies (a) the build/ directory, app.py, and the api directory.


### Connecting to Toolforge 

- SSH to toolforge as <username>@login.toolforge.org. See the [Python webservice guide](https://wikitech.wikimedia.org/wiki/Help:Toolforge/Web/Python).
- For typical development, you want to open an SSH tunnel to dev.toolforge.org. The easiest way to do that is to use the script. Run: `db_tunnel.sh <username>`.
  - Username is your "Instance shell account name" listed in your [Wikitech Preferences](https://wikitech.wikimedia.org/wiki/Special:Preferences).
  - I recommend adding your local SSH key to authorized_hosts on dev.toolforge.org, to make opening this tunnel easier.
  - See additional documentation [here](https://wikitech.wikimedia.org/wiki/Help:Toolforge/Database#SSH_tunneling_for_local_testing_which_makes_use_of_Wiki_Replica_databases).

### Other useful links
 
 - React tutorial: https://reactjs.org/docs/hello-world.html
 - React Hooks tutorial: https://reactjs.org/docs/hooks-intro.html
 - Material-UI: https://material-ui.com/getting-started/usage/
 
 
