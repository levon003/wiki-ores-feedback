# Development

Developer documentation for **ORES-Inspect** and the surrounding research code in this
repository. For a high-level project overview and citation information, see
[`README.md`](README.md).

The repository contains two broad kinds of code:

1. **ORES-Inspect** (`audit_web_client/`) — the primary product: a deployed web application
   (React front-end + Flask back-end) for auditing [ORES](https://www.mediawiki.org/wiki/ORES)
   edit-quality predictions. Deployed at <https://ores-inspect.toolforge.org/>.
2. **Research / data-processing code** (`src/` and `experiments/`) — one-off scripts, Jupyter
   notebooks, and pipeline code used to download and process Wikipedia dumps, score revisions, and
   run analyses. Much of this is historical and tied to the GroupLens compute environment.

> **Heads up:** this is an older research codebase. Several dependencies and external services
> are out of date (notably ORES itself, which Wikimedia has been decommissioning in favor of
> [Lift Wing](https://wikitech.wikimedia.org/wiki/Machine_Learning/LiftWing)). See
> [Modernization TODOs](#modernization-todos) at the bottom of this document before starting
> substantial work.

---

## ORES-Inspect (`audit_web_client`)

A web application for auditing ORES predictions. The deployed version is available at
<https://ores-inspect.toolforge.org/>.

The web interface is built using a React front-end and a Flask back-end. The Flask back-end uses
Toolforge's MariaDB as its database. The React front-end is based directly on the
[Devias Kit - React Admin Dashboard](https://material-ui.com/store/items/devias-kit/) code.

### Prepare for local development

 - Install a current `node` (the build is tested on Node 20+).
 - From the `audit_web_client` directory, run `npm install --legacy-peer-deps`. The flag is
   currently required by one unmaintained transitive dependency (`react-svg-tooltip`, which still
   peers on React 16); see the Modernization TODOs.
 - We use the [Feature Branch Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow),
   generally speaking. No specific naming guidance for the branches, but `feature/<feature_name>`
   is a good choice.
 - Get a Wikitech account:
   - Follow these instructions to create an account:
     <https://wikitech.wikimedia.org/wiki/Help:Create_a_Wikimedia_developer_account>. Follow the
     "Toolforge users" instructions after doing the prerequisites.
   - Follow these steps (which include creating and uploading SSH keys to your account, which you
     will need to do): <https://wikitech.wikimedia.org/wiki/Help:Getting_Started#Get_started_with_Toolforge>
   - Tell Zach to add you to the maintainers list:
     <https://toolsadmin.wikimedia.org/tools/id/ores-inspect/maintainers/>

### Backend setup

 - You'll need Python to run the backend: I recommend installing Anaconda, but if you already have
   a 3.5+ Python version on your system that's probably fine (verify with `python --version`).
 - To use the backend, you'll need the production database credentials.
   - Ask Zach for the `replica.my.cnf` file you need.
   - Place the `replica.my.cnf` file in the `audit_web_client` directory on your development system.
 - Install the Python requirements listed at `audit_web_client/flask/requirements.txt`:
   - Run `pip install -r flask/requirements.txt` (from the `audit_web_client` directory).
   - Most likely, `mysqlclient` installation will fail.
     - Follow installation instructions here: <https://pypi.org/project/mysqlclient/>
       - Note: you only NEED the client connectors, but installing the full server package on your
         OS is fine as well. e.g. on Mac I ran `brew install mysql`.
     - For Windows installations, see [this StackOverflow post](https://stackoverflow.com/questions/51146117/installing-mysqlclient-in-python-3-6-in-windows).
     - See relevant SQLAlchemy documentation [here](https://docs.sqlalchemy.org/en/14/dialects/mysql.html#module-sqlalchemy.dialects.mysql.mysqldb).
     - It would not be that challenging to change from a `mysqlclient` dependency to a
       `mysqlclient` OR `PyMySQL` dependency, so let me know if you have a lot of issues installing
       `mysqlclient`.

### Developing

All commands below are run from the `audit_web_client` directory.

 - Start the development frontend (Vite, port 3000): `npm run dev` (or `npm start`)
 - Start the development backend (Flask, port 5000): `npm run start-flask`
 - Production build (outputs to `build/`): `npm run build`
 - Lint: `npm run lint`

#### Developing remotely

If you're running the backend on another server, you can use whatever port you want to run that
server, just make sure to port forward to port 5000 e.g.
`ssh -L 5000:localhost:5001 {iuser}@{server_name}`. This is necessary because the development
OAuth consumer will redirect to the URL `https://localhost:5000`.

#### Directory structure (`audit_web_client`)

Version controlled:
 - `flask`: Code for the Flask back-end.
 - `public`: Static assets.
 - `src`: Where all of the front-end implementation lives.
 - `jsconfig.json`: Defines dependencies and yarn commands.

Not version controlled:
 - `node_modules`: Managed by npm.
 - `build`: Output produced by `yarn build`.
 - `instance`: Output produced by the Flask backend.

### Deployment

> Currently just scratch notes for this process.

- To recreate the condition that the Flask server expects for the static front-end files, run
  `yarn build`, then `ln -s build flask/api/www`, then `yarn start-flask`. Then, try
  <http://localhost:5000/> (rather than port 3000 for the node development server).
- The deployment script uses rsync to deal with whatever issue is stopping permissions from being
  set correctly from the user's umask. Note that it only copies the `build/` directory, `app.py`,
  and the `api` directory.

#### Initial deployment

Provided for posterity or in the event of an account refresh; these steps only need to be run
once. Basically, follow these instructions:
<https://wikitech.wikimedia.org/wiki/Help:Toolforge/Web/Python>

#### Subsequent deployment

In the instructions below, replace `{deploying_username}` with your WikiTech username (i.e. the
"Instance shell account name", which can be viewed at
<https://wikitech.wikimedia.org/wiki/Special:Preferences>).

 - `yarn build` — this produces the `build` directory.
 - `./deploy.sh {deploying_username}` — this copies the local files in your repository to
   `login.toolforge.org` (including the `build` directory).
 - `ssh {deploying_username}@login.toolforge.org`
 - `become ores-inspect`
 - If `requirements.txt` changed:
   - `webservice --backend=kubernetes python3.9 shell`
   - `cd ~/www/python`
   - `source venv/bin/activate`
   - `pip install --upgrade pip wheel` (optional, but recommended)
   - `pip install -r src/requirements.txt`
 - `webservice --backend=kubernetes python3.9 start`
   - If the webservice was already running, instead run
     `webservice --backend=kubernetes python3.9 restart`, or else run
     `webservice --backend=kubernetes python3.9 stop` first.
   - Check `~/uwsgi.log` for any errors.

### Connecting to Toolforge

- SSH to Toolforge as `<username>@login.toolforge.org`. See the
  [Python webservice guide](https://wikitech.wikimedia.org/wiki/Help:Toolforge/Web/Python).
- For typical development, you want to open an SSH tunnel to `dev.toolforge.org`. The easiest way
  to do that is to use the script. Run: `db_tunnel.sh <username>`.
  - Username is your "Instance shell account name" listed in your
    [Wikitech Preferences](https://wikitech.wikimedia.org/wiki/Special:Preferences).
  - I recommend adding your local SSH key to `authorized_hosts` on `dev.toolforge.org`, to make
    opening this tunnel easier.
  - See additional documentation
    [here](https://wikitech.wikimedia.org/wiki/Help:Toolforge/Database#SSH_tunneling_for_local_testing_which_makes_use_of_Wiki_Replica_databases).

### Other useful links

 - React docs: <https://react.dev/>
 - MUI (Material UI) docs: <https://mui.com/material-ui/getting-started/>
 - Vite docs: <https://vitejs.dev/>
 - tss-react (the `makeStyles` successor used here): <https://www.tss-react.dev/>

### FAQ

#### What ports are in use?

The Flask server runs on port 5000 by default, while the Node development server runs on port 3000
by default.

`flask/api/port_config.py` specifies the ports expected for the Tools and Replica DBs (likely 4000
and 4001). These parameters should be passed to the `db_tunnel.sh` script.

#### How can I run the backend on an M1/Silicon Mac?

Installing `mysqlclient` will be a bit of a pain:
<https://github.com/PyMySQL/mysqlclient/issues/496>

---

## Research & data-processing code

This code is largely historical and was written to run in the GroupLens compute environment. Many
files contain hardcoded absolute paths such as `/export/scratch2/levon003/...` that point at a
server that is no longer accessible; read those as "a path into this repo or into a downloaded
Wikipedia data dump" — they will not resolve as-is. The code is not packaged or pinned, and is
provided primarily for reproducibility. See [Modernization TODOs](#modernization-todos).

`src/` — the Python data-processing pipeline, organized by stage:
 - `data_extraction/` — extract revisions, reverts, user edit counts, and join ORES scores from
   XML dumps. See `src/data_extraction/README.md` for the OIDB-build pipeline.
 - `ores_scoring/` — score revisions with ORES and write results to SQLite.
 - `text_retrieval/` — retrieve and tokenize revision text/diffs.
 - `text_computation/` — compute statistics over retrieved text.
 - `data_shift/` — KL-divergence / data-shift analyses across monthly samples.
 - `revscoring_utils/` — helpers for generating revscoring mocks.

`experiments/` — research code that is not part of the production pipeline:
 - `dump_download/` — shell scripts for downloading dumps from
   [dumps.wikimedia.org](https://dumps.wikimedia.org).
 - `revert_prediction/` — code for training and running revert-prediction models.
 - `notebooks/` — Jupyter notebooks analyzing static Wikipedia data dumps.
 - `reu2021/` — analysis conducted during the 2021 REU. See `experiments/reu2021/README.md`.
 - `figures/` — figures generated by analysis code.

The SQL for accessing the ToolsDB OIDB now lives alongside the backend at
`audit_web_client/flask/sql/`.

---

## Modernization TODOs

A running list of things worth modernizing. Roughly ordered by impact; none are blocking, but the
front-end stack and the folder layout are the highest-leverage cleanups.

### Front-end (`audit_web_client`)

- [x] **Migrated off Create React App to [Vite](https://vitejs.dev/).** Build output still goes to
      `build/` so `deploy.sh` is unchanged. Dev server still on port 3000; the old `setupProxy.js`
      is now Vite's `server.proxy` in `vite.config.js`.
- [x] **Upgraded React 16 → 19** (new `createRoot` entry point in `src/index.js`).
- [x] **Upgraded Material-UI v4 → MUI v7.** `@material-ui/*` → `@mui/material` /
      `@mui/icons-material`; `makeStyles`/`withStyles` migrated to [tss-react](https://www.tss-react.dev/);
      `Hidden`/`Grid`/`ListItem button` updated to their v5+ replacements.
- [x] **Upgraded react-router** `6.0.0-beta.0` → v7 (replaced the removed `activeClassName`).
- [x] **Removed dead deps and Devias template cruft** (`chart.js`, `react-chartjs-2`, `d3`,
      `d3-sankey`, `nprogress`, `react-scripts`, unused views/widgets). `@nivo/*` was bumped and
      kept (the prediction Sankey). `react-helmet` → `react-helmet-async`.
- [x] **Dependency vulnerabilities:** `npm install` now reports **0** (was 120 on the old tree).
- [ ] **Drop `react-svg-tooltip`.** It's the one remaining unmaintained dep (peers on React ^16),
      which is why `npm install` needs `--legacy-peer-deps`. Used in a single file; replace with an
      MUI `Tooltip` or a small custom component, then drop the flag.
- [ ] **Burn down the ESLint warning backlog.** `npm run lint` passes (0 errors) but ~90 pre-existing
      warnings remain (unused vars, `react-hooks/exhaustive-deps`, unescaped entities, stray DOM
      props such as `inputprops`). A few rules are temporarily set to `warn` in `eslint.config.js`;
      promote them back to `error` as the backlog is cleared.
- [ ] **Code-split the bundle.** The single JS chunk is ~745 kB (Vite warns >500 kB); consider
      `manualChunks` or route-level dynamic `import()`.

### Back-end (`audit_web_client/flask`)

- [x] **Pinned Python dependencies** in `flask/requirements.txt` (were unpinned). SQLAlchemy is
      held on the 1.4 series — see below.
- [ ] **Upgrade SQLAlchemy 1.4 → 2.0.** The `api/` code targets the 1.4 API; 2.0 is a separate
      breaking change. Not attempted here because the backend can't be exercised without the
      Toolforge DB credentials.
- [ ] **Offer `PyMySQL` as an alternative to `mysqlclient`** to avoid the recurring install pain
      (especially on Apple Silicon).
- [ ] **Bump the Python runtime.** Deployment still targets `python3.9` on Toolforge; move to a
      currently-supported Python.
- [ ] **Formalize deployment.** The deployment section is admittedly "scratch notes." Capture it in
      a script and/or CI so it's reproducible without tribal knowledge.
- [ ] **Handle secrets better.** `replica.my.cnf` is passed around manually ("ask Zach"); document
      a proper secrets-provisioning flow.

### External services

- [ ] **Account for ORES decommissioning.** Wikimedia has been retiring ORES in favor of
      [Lift Wing](https://wikitech.wikimedia.org/wiki/Machine_Learning/LiftWing) and the
      revert-risk models. Decide whether ORES-Inspect should target the new endpoints, be archived,
      or be reframed as a historical artifact.

### Repository-wide

- [ ] **Add CI.** No automated tests run on push/PR. Wire up GitHub Actions to run `npm run lint`
      and `npm run build` for `audit_web_client` (both are green today and make a good first gate).
- [x] **Modernized the lint setup.** Replaced CRA's `eslint-config-react-app` with a flat
      `eslint.config.js` (ESLint 9). `npm run lint` runs clean (0 errors). Still needs a pre-commit
      hook / CI step to be *enforced* (folded into the CI item above).
- [ ] **Package the Python pipeline.** Add a `pyproject.toml` (and a single dependency declaration)
      for the `src/` pipeline.
- [ ] **Parameterize hardcoded paths.** ~80 files (across `src/`, `experiments/`, and even
      `audit_web_client/flask/api/db.py`) hardcode `/export/scratch2/levon003/...`, pointing at a
      decommissioned server. Replace these with configurable paths / environment variables. The
      `db.py` occurrences are in the offline `create-db` data-loading path (guarded by
      `os.path.exists`), so they do not affect the running web service — but they do block
      rebuilding the database locally.

### Repository layout

The folder restructuring described in earlier revisions of this document has been **completed**.
The current layout is:

```
.
├── README.md                 # public-facing overview + citation
├── DEVELOPMENT.md            # this file
├── LICENSE, CITATION.cff
│
├── audit_web_client/         # ORES-Inspect — the primary product (React + Flask)
│   ├── flask/
│   │   └── sql/              # ToolsDB OIDB SQL (formerly the top-level sql/)
│   ├── public/
│   └── src/
│
├── src/                      # the Python data-processing pipeline, nested by stage
│   ├── data_extraction/
│   ├── ores_scoring/
│   ├── text_retrieval/
│   ├── text_computation/
│   ├── data_shift/
│   └── revscoring_utils/
│
└── experiments/              # research code that is NOT part of the production pipeline
    ├── reu2021/              # formerly reu2021/
    ├── revert_prediction/    # formerly scripts_prediction_SHW/ + scripts_training_SHW/
    ├── dump_download/        # formerly scripts/
    ├── notebooks/            # formerly notebook/
    └── figures/              # formerly figures/
```

Rationale for the notable moves:

- **`sql/` → `audit_web_client/flask/sql/`** — the SQL targets the ToolsDB OIDB that the Flask
  backend reads, so it belongs with the backend.
- **`scripts_prediction_SHW/` + `scripts_training_SHW/` → `experiments/revert_prediction/`** — a
  single research effort that had been split across two oddly-named folders.
- **`scripts/` → `experiments/dump_download/`** — `scripts` was uninformative; these are
  specifically dump-download shell scripts.
- **`audit_web_client/` was intentionally left at the top level** — it is the primary deliverable
  and moving it under `src/` would churn the deployment paths (`deploy.sh`, Toolforge config) for
  little gain.

The moves were done with `git mv` (history preserved) and required no code changes: there were no
cross-folder Python imports or `sys.path` manipulations between the moved directories. The
remaining hardcoded `/export/scratch2/...` paths were already broken (see the TODO above) and are
unaffected by the move.
