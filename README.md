# Nihongoesfar

A minimal Japanese reference and practice notebook. White pages, readable Japanese, and direct access to every exercise. No accounts, studied-status tracking, review schedules, streaks, or saved answer history.

## Run locally

Requires Node.js 24 or newer. Uses Node's built-in SQLite for your notes and reading preferences; no external database or API keys are needed.

```sh
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:3001**. The server listens on this computer only by default. Nothing is published or sent to a hosted database. The built app bundles its lessons and stroke data and can run without internet access.

For development, `npm run dev` starts the API on port 3001 and the interface on **http://127.0.0.1:5173**.

## Read and practice

- Open any knowledge book: Kana, Grammar, Kanji, Vocabulary, Numbers & time, or Adjectives.
- Numbers & time opens a compact quick guide: basic numbers/hundreds/thousands with sound changes marked, plus hours, half past, and minute readings. Switch to All entries for the full date, month, duration, and counter reference.
- Search and filter by topic, level, and tag. Levels are labels, so the notebook can grow beyond N5.
- Practice any book immediately, or open an individual entry and select **Practice this entry**. Choose mixed practice or a specific skill. Up to 12 random questions are shown at a time; no prior selections are required.
- Sentence tiles work by tapping, keyboard, or dragging. Typed Japanese answers accept kana equivalents where authored in the lesson.
- Writing practice includes stroke animation, tracing guides, undo, and feedback on stroke order, direction, and approximate shape. It does not grade calligraphy or recognize arbitrary handwriting. Missing verified paths are labeled explicitly.
- Add or edit words, class notes, examples, and grammar exercises. Notes without exercises remain available as reference material.
- Preferences control furigana/readings and optional romaji. Your own entries and preferences are saved; practice answers and sessions are not.

Includes complete modern kana with combinations and voiced sounds, 25 grammar lessons with colored sentence roles, 100 kanji with readings and an expanded JMdict compound selection, 210 vocabulary entries, 121 number/time/counter entries, and 23 adjective entries. Beginner level tags are approximate study groupings, not an official JLPT syllabus.

## Data and backups

Notes and preferences are in **data/notebook.sqlite**. Set `DATA_DIR` to choose another persistent directory. Preferences → Export notes downloads your content edits and preferences as JSON. A JSON import screen is not included.

For a restorable backup, stop the app, copy the entire `data/` directory, then restart it. To restore, stop the app and replace the directory with the saved copy. Keep your source version with the backup too.

Existing databases from the previous version retain their old tracking tables untouched, but the app no longer reads, writes, displays, or exports that history. New databases contain only content and preferences.

## Host on AWS later

No AWS resources have been created. The Docker setup is suitable for an EC2 or Lightsail Linux host with persistent disk; it is not a Lambda template.

```sh
export PUBLIC_ORIGIN='https://japanese.example.com'
docker compose up --build -d
```

The provided Compose file binds the host port to loopback. Place your HTTPS reverse proxy in front of port 3001 and configure PUBLIC_ORIGIN to match the browser URL. Store the SQLite database on persistent disk; the provided named volume survives container replacement.

There is no application login. Devices reaching the same server share the same editable notebook. Choose your intended network access when hosting it. The local default stays bound to 127.0.0.1.

## Checks

```sh
npm test
npm run build
```

Checks cover content and stroke coverage, immediate practice without studied selections, practice filters, grammar grading and Japanese normalization, stroke direction checks, stateless answer feedback, absence of login/tracking endpoints, saved notes and preferences across restarts, exports, and origin protection.

## Credits

KanjiVG stroke paths © Ulrich Apel and contributors, CC BY-SA 3.0. The derived bundle retains that license; see `public/credits.html` and `public/stroke-data.json`. Explanations and examples are authored for this notebook. Primary orientation references include Japan Foundation IRODORI/MARUGOTO and Tokyo University of Foreign Studies language modules.

## Compound dictionary

Each starter kanji has up to 20 selected common compound forms, with kana readings and English meanings. Some words are above N5. Different readings of the same spelling may have separate entries; reading practice accepts the readings listed for that word. Search a kanji’s compound list or use its arrow button to practice that word immediately. Existing note edits are merged with updated compound coverage.

Compound entries are derived from JMdict © James William Breen and the Electronic Dictionary Research and Development Group, CC BY-SA 4.0. The offline dataset includes source entry identifiers, its source-file checksum, update date, selection notes, and attribution. See `public/credits.html#dictionary` and `public/compound-data.json`.

Refresh the dictionary data at least monthly when hosting/distributing it, following the EDRDG licence. The update uses Python 3’s standard library and downloads the current English JMdict from EDRDG:

```sh
npm run update:compounds
npm run build
```

Restart the running app after updating. For reproducibility, pass `--source /path/to/JMdict_e.gz` to `python3 scripts/update-compounds.py` to use an already downloaded copy.
