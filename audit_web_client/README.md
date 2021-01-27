Audit Web Client
===

A web application for auditing ORES predictions.

The web interface is built using a React front-end and a Flask back-end.
The Flask back-end uses SQLite as its database.
The React front-end is based directly on the [Devias Kit - React Admin Dashboard](https://material-ui.com/store/items/devias-kit/) code.

To prepare for development, install `node` and `yarn` (`npm install -g yarn`). Then, from this directory, run `npm install`.

To start the development backend: `yarn start-flask`

To start the development frontend: `yarn start`


Directories:
 - `flask_api`: Code for the Flask back-end.
 - `public`: Static assets.
 - `src`: Where all of the front-end implementation lives.
 - `jsconfig.json`: Defines dependencies and yarn commands.

Not version controlled:
 - `node_modules`: Managed by npm.
 - `build`: Output produced by `yarn build`.
 - `instance`: Output produced by Flask backend.

