Audit Web Client
===

A web application for auditing ORES predictions.

The deployed version is available at: https://ores-inspect.toolforge.org/

The web interface is built using a React front-end and a Flask back-end.
The Flask back-end uses SQLite as its database.
The React front-end is based directly on the [Devias Kit - React Admin Dashboard](https://material-ui.com/store/items/devias-kit/) code.

To prepare for development, install `node` and `yarn` (`npm install -g yarn`). Then, from this directory, run `npm install`.

To start the development backend: `yarn start-flask`

To start the development frontend: `yarn start`


Directories:
 - `flask`: Code for the Flask back-end.
 - `public`: Static assets.
 - `src`: Where all of the front-end implementation lives.
 - `jsconfig.json`: Defines dependencies and yarn commands.

Not version controlled:
 - `node_modules`: Managed by npm.
 - `build`: Output produced by `yarn build`.
 - `instance`: Output produced by Flask backend.

Other scratch notes:
 - To recreate the condition that the Flask server expects for the static front-end files, run `yarn build`, then `ln -s build flask/api/www`, then `yarn start-flask`. Then, try http://localhost:5000/ (rather than port 3000 for the node development server).
 - The deployment script uses rsync to deal with whatever issue is stopping permissions from being set correctly from the user's umask.  Note that it only copies (a) the build/ directory, app.py, and the api directory.
 - SSH to toolforge as <username>@login.toolforge.org. See the [Python webservice guide](https://wikitech.wikimedia.org/wiki/Help:Toolforge/Web/Python).

