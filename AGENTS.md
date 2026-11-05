# Repository working notes

## Changes and commits

- After completing a requested change, verify it and commit it to this repository before finishing the task. Do not push unless the user asks.
- Split unrelated work into focused commits so each change is easy to review. Keep required code, data, and tests together; avoid mixing unrelated cleanup with feature work.
- Use a clear Conventional Commits title and a short description explaining what changed and why. Keep validation results in the task report, not in commit messages.
- Add or update code comments when the reason for a decision, constraint, or workaround is not obvious. Avoid comments that merely repeat the code.
- Update README instructions when editing, running, or publishing the project changes.
- Inspect existing changes before staging. Preserve other work; stage only the requested scope unless the user explicitly asks to organize all outstanding changes.
- Before committing, verify Git uses the user’s name and a GitHub-associated email. Never commit with a placeholder identity; ask for the correct email if it is unavailable.
- Never commit credentials, local database files, downloaded source archives, dependencies, or generated build output.
- If repository permissions prevent a commit, report the blocker and leave the completed changes intact.

## Learning content and deployment

- Edit grammar in `content/grammar/*.yaml`; keep topic order in `content/grammar/index.yaml`. Run `npm run content:build` and commit the generated `public/grammar.json` with source changes. Do not edit that generated file directly.
- Edit other learning entries in `public/kana.json`, `public/kanji.json`, `public/vocabulary.json`, `public/numbers.json`, or `public/adjectives.json`.
- Edit guide reference tables and topic mappings in `public/guides/`; keep conversion and lookup functions in TypeScript.
- `public/notebook.json` lists the subject files. Keep entry IDs unique and stable.
- Verify static-site changes with `npm run build:static` and `npm run test:static`; run `npm run format:check` for formatting.
- GitHub Actions publishes the static site to S3 and CloudFront after a successful default-branch push.

The application reads static JSON; grammar JSON is generated from YAML. `npm run dev` serves it locally; `npm run build` creates `dist/`, and `npm start` previews that build. No API server or database is required.
