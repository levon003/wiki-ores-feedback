# CLAUDE.md

## What this is

**ORES-Inspect**: a web app for auditing [ORES](https://www.mediawiki.org/wiki/ORES) edit-quality
predictions on English Wikipedia, plus the research code used to build it. Deployed on Toolforge
at <https://ores-inspect.toolforge.org/>. This is an older research codebase — see
[DEVELOPMENT.md](DEVELOPMENT.md) for full setup, deployment, and a list of modernization TODOs.

## Layout

- `audit_web_client/` — **the primary product.** React front-end + Flask back-end.
  - `src/` — React front-end. `flask/` — Flask back-end. `flask/sql/` — ToolsDB OIDB SQL.
- `src/` — Python data-processing pipeline, by stage (`data_extraction`, `ores_scoring`,
  `text_retrieval`, `text_computation`, `data_shift`, `revscoring_utils`).
- `experiments/` — research code, not part of the production pipeline (`notebooks`,
  `dump_download`, `revert_prediction`, `reu2021`, `figures`).

## Common commands

Run from `audit_web_client/`:
- `yarn start` — dev front-end (port 3000). `yarn start-flask` — dev back-end (port 5000).
- `yarn build` — production build. `./deploy.sh <wikitech-username>` — deploy to Toolforge.

## Gotchas

- **Hardcoded paths are broken.** ~80 files hardcode `/export/scratch2/levon003/...`, pointing at a
  decommissioned server. Treat these as "a path into this repo or a downloaded Wikipedia dump";
  they will not resolve as-is. Don't assume code that references them runs.
- **The stack is old, although parts have been modernized** and
  ORES itself is being decommissioned by Wikimedia in favor of Lift Wing. Check DEVELOPMENT.md's
  TODOs before assuming a dependency or external service is current.
- **No tests or CI.** There's nothing automated to run; verify changes manually.

