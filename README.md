# Nihongoesfar

A minimal Japanese reference and practice notebook. White pages, readable Japanese, and direct access to every exercise. Visitors read and practice a shared library without accounts. No studied-status tracking, review schedules, streaks, or saved answer history.

## Static website (recommended for hosting)

The static build runs entirely in the browser: no hosted database, API, owner key, or server is needed. Reading preferences stay in each browser, and practice answers are checked locally. The interface is read-only. All exported library entries (including custom notes) are public.

The committed subject JSON files in `public/` contain the saved library; `public/notebook.json` lists them. To publish local edits, start your local database and refresh this snapshot:

```sh
npm run export:static
npm run build:static
```

Export failure stops without replacing the previous snapshot. Export reads saved PostgreSQL entries, preserving owner edits; changes to starter content must first reach the local library before exporting. No database credentials are exported.

For a fresh checkout, `npm ci && npm run build:static` uses the committed snapshot without a database. Preview with `npx vite preview --host 127.0.0.1`, or develop with `npm run dev:static`. Upload only the contents of `dist/`.

For AWS hosting:

1. Upload `dist/` to a private S3 bucket; keep public access blocked.
2. Put CloudFront in front using its S3 REST origin and Origin Access Control. Set the default root object to `index.html` and redirect HTTP to HTTPS.
3. Request an ACM certificate in `us-east-1` for your domain, validate it through DNS, and attach it to CloudFront along with the custom domain name.
4. Point DNS to CloudFront (Route 53 alias records, or a subdomain CNAME at another DNS provider).
5. Give `index.html` and the JSON files a short cache lifetime; hashed `assets/` files can be cached for a year. Invalidate `/index.html`, `/`, and `/*.json` after publishing.

Navigation is currently in-page, so no SPA path rewrite is required. Keep the S3 bucket: deleting it deletes the published content. Domain registration and AWS usage are billed separately. The existing server build remains available for local development.

## Edit learning material directly in JSON

The published learning library is split into `public/kana.json`, `public/kanji.json`, `public/grammar.json`, `public/vocabulary.json`, `public/numbers.json`, and `public/adjectives.json`. Each file is an array of entries. Edit the matching subject file to update material or add entries, then commit and push. GitHub Actions builds and publishes that JSON automatically; no database export is needed for this workflow.

To add material, copy an existing entry of the same `kind`, give it a unique `id`, and edit its fields. Supported kinds are `kana`, `kanji`, `grammar`, `vocabulary`, `numbers`, and `adjectives`. Keep the required fields (`id`, `kind`, `title`, `japanese`, `reading`, `meaning`, `level`, `topic`, `tags`, `note`, and `examples`); copy optional lesson, reference, or exercise fields when needed. Exercise answers and explanations live in the same entry. Keep IDs stable because lessons can refer to other entries.

Example entry to append to a subject array:

```json
{
  "id": "vocabulary-neko-extra",
  "kind": "vocabulary",
  "title": "猫",
  "japanese": "猫",
  "reading": "ねこ",
  "romaji": "neko",
  "meaning": "cat",
  "level": "N5",
  "topic": "Animals",
  "tags": ["animals"],
  "note": "",
  "examples": [{ "japanese": "猫です。", "reading": "ねこです。", "meaning": "It is a cat." }]
}
```

Preview and verify with `npm run build:static && npm run test:static`. JSON requires commas between entries and does not allow trailing commas or comments.

`export:static` replaces these subject files with database content. Once you author directly in JSON, do not run that command unless you intend to replace those edits. The local server still uses PostgreSQL; use `npm run dev:static` to preview JSON edits. Special book navigation and interactive number/family guides are defined in application code; adding an ordinary library entry needs only JSON, while adding a new custom screen still needs code. Compound and stroke datasets are already JSON in `public/compound-data.json` and `public/stroke-data.json`.

## GitHub Actions: push → test → deploy

`.github/workflows/deploy.yml` builds the static site and runs all browser/content logic tests on pushes and pull requests. The PostgreSQL integration test is excluded because the deployed site has no server. Only a successful push to the repository's default branch deploys the tested artifact to S3 and refreshes CloudFront. Pull requests never receive deployment credentials.

One-time setup:

- Create the private S3 bucket, CloudFront distribution and domain/certificate described above.
- In AWS IAM, add an OpenID Connect provider: URL `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`.
- Create a role such as `github-nihongo-deploy`. Restrict its trust to this repository's default branch using `token.actions.githubusercontent.com:aud = sts.amazonaws.com` and an exact `token.actions.githubusercontent.com:sub`. The traditional subject is `repo:andiliewantorosusanto/Nihongoesfar:ref:refs/heads/main` if the default branch is `main`. New repositories may use immutable owner/repository IDs in the subject; match your repository's actual subject format. This workflow does not use a GitHub environment, so use the branch subject, not an environment subject.
- Give the role `s3:ListBucket` on the specific bucket, `s3:PutObject` on that bucket's objects, and `cloudfront:CreateInvalidation` on the specific distribution. CloudFront's Origin Access Control separately needs permission to read that bucket.
- In GitHub **Settings → Secrets and variables → Actions → Variables**, add repository variables `AWS_ROLE_ARN`, `AWS_DEFAULT_REGION`, `S3_BUCKET`, and `CLOUDFRONT_DISTRIBUTION_ID`. These identifiers are not credentials; no permanent AWS access keys are needed.
- Protect the default branch and enable GitHub Actions for the repository.

For ordinary code changes: commit and push. For content edited through the local notebook: run `npm run export:static`, commit the updated `public/*.json` files, then push. CI uses the committed snapshot and does not connect to your local database. Only `dist/` is uploaded. Old hashed assets remain available to already-open browser tabs.

The workflow has been checked locally; an actual GitHub deployment still requires the AWS resources and repository variables above. AWS hosting and domain registration are separate from GitHub Actions usage.

## Run locally

Requires Node.js 24 or newer and Docker Desktop (running). PostgreSQL stores every library entry, including the starter lessons.

```sh
npm ci
cp .env.example .env
node -e "const fs=require('fs');fs.writeFileSync('.env',fs.readFileSync('.env','utf8').replace(/^OWNER_KEY=.*$/m,'OWNER_KEY='+require('crypto').randomBytes(32).toString('hex')))"
npm run db:start
npm run build
npm start
```

Open **http://127.0.0.1:3001**. For development, `npm run dev` serves the interface at **http://127.0.0.1:5173**. The API stays on port 3001. Both bind to this computer by default.

Reading preferences belong to each browser and do not change anyone else's settings. No visitor entries, accounts, or practice history are stored.

## Code style

Run `npm run format` to apply consistent spacing and line wrapping to source, tests, styles, and configuration. `npm run format:check` checks formatting without changing files and runs in GitHub Actions. Generated datasets and local data are excluded. Type checking also flags unused imports and variables.

## Read and practice

- Open any knowledge book: Kana, Grammar, Kanji, Vocabulary, Numbers & time, or Adjectives.
- Numbers & time opens a compact quick guide: basic numbers/hundreds/thousands with sound changes marked, plus hours, half past, and minute readings. Switch to All entries for the full date, month, duration, and counter reference.
- Search and filter by topic, level, and tag. Levels are labels, so the notebook can grow beyond N5.
- Practice any book immediately, or open an individual entry and select **Practice this entry**. Choose mixed practice or a specific skill. Up to 12 random questions are shown at a time; no prior selections are required.
- Sentence tiles work by tapping, keyboard, or dragging. Typed Japanese answers accept kana equivalents where authored in the lesson.
- Writing practice includes stroke animation, tracing guides, undo, and feedback on stroke order, direction, and approximate shape. It does not grade calligraphy or recognize arbitrary handwriting. Missing verified paths are labeled explicitly.
- Preferences control furigana and kana readings. Kana charts always show their sounds. Library changes are saved in PostgreSQL; reading preferences are saved in each browser. Practice answers and sessions are not saved.

Includes complete modern kana with combinations and voiced sounds, 25 grammar lessons with colored sentence roles, 100 kanji with readings and an expanded JMdict compound selection, 210 vocabulary entries, 121 number/time/counter entries, and 23 adjective entries. Beginner level tags are approximate study groupings, not an official JLPT syllabus.

## Guided grammar refresher

Grammar opens grouped by level: N5, N4, and N3. The current 25 lessons are N5; levels without entries are shown as empty. Every lesson is available directly and links to useful prerequisites. Read the goal, recap, common mix-up, and three worked examples, then start five guided questions: meaning choice, pattern choice, gap fill, sentence tiles, and independent typing. A successful retry adds one extra question per lesson at most. Mixed grammar practice and All entries remain available.

Hints give a clue before the separate Show answer action. Review explanation keeps the current answer and question in place; Return to question resumes it. Practice state stays in memory only. Furigana follows reading preferences, while reading questions hide the target reading until Reveal reading; answer feedback always supplies readings. Lesson vocabulary includes kana and English meanings.

Grammar sentences separate topic, subject, object, particles, modifiers, and predicates with consistent colors. Japanese chunks, kana readings, and English translations share those role colors. The `004-grammar-colors` migration adds missing annotations to unchanged lesson text and practice examples while preserving owner edits.

The `003-guided-grammar` database migration adds missing lesson and exercise fields to existing grammar records without replacing your notes, examples, or original exercises. Owner saves preserve these fields, including saves from older clients that omit them. There is no dedicated curriculum editor. The local pre-update backup is `data/before-guided-grammar.dump`; restore it into a separate database using the instructions below and run the previous source version if a full rollback is needed.

## Class topics

The Class topics tag collects the requested beginner material across the books. Grammar includes separate demonstratives, は / が / を / へ, personal questions, and existence. Vocabulary includes polite movement forms, family comparisons, and special katakana sounds; Kana includes the missing loanword combinations. Numbers & time adds Calendar & durations and Age quick-guide tabs, plus large-number anchors through 1,000,000. Existing full month, weekday, and date entries are reused in the tables.

The Family entry includes a relationship tree with kanji/usual spelling, kana and romaji, plus a switch for own-family versus polite other-family words. The tree also appears in practice explanations and uses the saved comparison-table vocabulary.

The new guides include four color-aligned examples and five practice stages with one optional retry question. Search also matches authored romaji, including ikimasu, kore, kono, and sai. Tables and practice fields survive owner edits and exports. The additive `005-class-topics` migration inserts missing entries without replacing existing records.

Reading references: [Japan Foundation katakana chart](https://www.irodori.jpf.go.jp/assets/data/Kana_all.pdf), [TUFS movement particle へ](https://www.coelang.tufs.ac.jp/mt/ja/gmod/courses/c02/lesson15/step1/explanation/026.html). Explanations and practice sentences are authored for this app.

## Data, migration, and backups

Local PostgreSQL runs on `127.0.0.1:5433`; its persistent data is in the `postgres-data` Docker volume. `DATABASE_URL` selects the database. Compose's `notebook` service uses the same database through the internal Docker network. The default database password is for local development only; configure a private password when hosting.

On first startup, the app creates its schema and imports the bundled lessons in one transaction. It then imports your existing `data/notebook.sqlite` entries, edits, and preferences once if the file exists. `DATA_DIR` still selects that legacy directory, or set `SQLITE_IMPORT_PATH` to an explicit file. Your SQLite file is opened read-only and remains untouched. An import failure rolls back the whole transaction and prevents startup; fixing the problem and restarting retries safely. Restarts never overwrite PostgreSQL edits with starter content or old SQLite data. Keep a copy of the old source version and SQLite directory if you need to return to the old app; new PostgreSQL edits do not sync back to SQLite.

The Docker app mounts the previous `notebook-data` volume to import legacy container data. Do not run `docker compose down -v`: that deletes persistent volumes. Stop the old app before switching storage, and keep it stopped during cutover.

Preferences → Export entries downloads **all** library entries as JSON (export version 3). This is a content export; use PostgreSQL backups for full restoration. A JSON import screen is not included.

Create a full backup while PostgreSQL is running:

```sh
docker compose exec -T database pg_dump -U notebook -d notebook -Fc > notebook.dump
```

Restore into a **new, empty database**, then point `DATABASE_URL` at it:

```sh
pg_restore --exit-on-error --no-owner --no-acl --dbname="$NEW_DATABASE_URL" notebook.dump
```

Keep the old database until the restored app is checked. The schema migration records travel with the backup, preventing a restored database from being reseeded or reimported.

## Move to AWS later

No AWS resources are created by this setup. Create a PostgreSQL RDS database using a compatible version (local development uses PostgreSQL 17), with network access restricted to the app server. Pause library editing, take a fresh `pg_dump`, restore it into the empty RDS database, configure the app's `DATABASE_URL` and TLS certificate verification, and verify entry counts and representative content before enabling editing. Use `sslmode=verify-full` with the AWS CA certificate via `sslrootcert` in the connection URL; do not disable certificate verification. Preserve your owner key or replace it intentionally.

For a local container preview of both services:

```sh
docker compose up --build -d
```

For hosting, configure `PUBLIC_ORIGIN` to the browser's HTTPS origin and put an HTTPS reverse proxy in front of port 3001. The provided host bindings stay on loopback. Configure a strong database password and matching connection URL. The app's connection URL can point to RDS without changing the entry schema or editing code.

## Checks

```sh
npm run db:start
npm test
npm run build
```

Server tests create and drop an isolated temporary PostgreSQL database using the local development connection (override with `TEST_DATABASE_URL`; its role needs permission to create databases). They never clear the notebook database. Checks cover SQLite import preservation and retry safety, owner-only writes, visitor practice, content and stroke coverage, immediate practice without studied selections, practice filters, grammar grading and Japanese normalization, stroke direction checks, stateless answer feedback, absence of tracking endpoints, saved entries across restarts, exports, and origin protection.

## Credits

KanjiVG stroke paths © Ulrich Apel and contributors, CC BY-SA 3.0. The derived bundle retains that license; see `public/credits.html` and `public/stroke-data.json`. Explanations and examples are authored for this notebook. Primary orientation references include Japan Foundation IRODORI/MARUGOTO and Tokyo University of Foreign Studies language modules.

## Compound dictionary

Each starter kanji includes all compounds accepted by the dictionary selection rules, without a per-kanji count cap, with kana readings and English meanings. Some words are above N5. Different readings of the same spelling may have separate entries; reading practice accepts the readings listed for that word. The list initially shows 12 entries; use Show more to reveal another 12, or search the entire list. Search a kanji’s compound list or use its arrow button to practice that word immediately. Seed data is imported once; refreshing the source dictionary does not automatically replace entries already stored in PostgreSQL.

Compound entries are derived from JMdict © James William Breen and the Electronic Dictionary Research and Development Group, CC BY-SA 4.0. The offline dataset includes source entry identifiers, its source-file checksum, update date, selection notes, and attribution. See `public/credits.html#dictionary` and `public/compound-data.json`.

Refresh the dictionary data at least monthly when hosting/distributing it, following the EDRDG licence. The update uses Python 3’s standard library and downloads the current English JMdict from EDRDG:

```sh
npm run update:compounds
npm run build
```

Existing hosted libraries need an explicit reviewed content update after refreshing the source dataset. For reproducibility, pass `--source /path/to/JMdict_e.gz` to `python3 scripts/update-compounds.py` to use an already downloaded copy.
