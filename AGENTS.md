# Repository working notes

## Changes and commits

- After completing a requested change, verify it and commit it to this repository before finishing the task. Do not push unless the user asks.
- Split unrelated work into focused commits so each change is easy to review. Keep required code, data, and tests together; avoid mixing unrelated cleanup with feature work.
- Use a clear Conventional Commits title and a description explaining the change, its purpose, and the checks run. Record any checks that could not run and why.
- Add or update code comments when the reason for a decision, constraint, or workaround is not obvious. Avoid comments that merely repeat the code.
- Update README instructions when editing, running, or publishing the project changes.
- Inspect existing changes before staging. Preserve other work; stage only the requested scope unless the user explicitly asks to organize all outstanding changes.
- Never commit credentials, local database files, downloaded source archives, dependencies, or generated build output.
- If repository permissions prevent a commit, report the blocker and leave the completed changes intact.

## Learning content and deployment

- Edit learning entries in `public/kana.json`, `public/kanji.json`, `public/grammar.json`, `public/vocabulary.json`, `public/numbers.json`, or `public/adjectives.json`.
- `public/notebook.json` lists those files. Keep entry IDs unique and stable.
- `npm run export:static` replaces the subject files with PostgreSQL content; do not run it over direct JSON edits unless replacement is intended.
- Verify static-site changes with `npm run build:static` and `npm run test:static`; run `npm run format:check` for formatting.
- Server/database changes also need the relevant PostgreSQL integration checks.
- GitHub Actions publishes the static site to S3 and CloudFront after a successful default-branch push.
