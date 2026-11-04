# Nihongoesfar

A minimal Japanese reference and practice notebook. White pages, readable Japanese, and direct access to every exercise. Visitors read and practice a shared library without accounts. No studied-status tracking, review schedules, streaks, or saved answer history.

## Static website (recommended for hosting)

The static build runs entirely in the browser: no hosted database, API, owner key, or server is needed. Reading preferences stay in each browser, and practice answers are checked locally. The interface is read-only. All exported library entries (including custom notes) are public.

The library is authored directly in the subject JSON files in `public/`; `notebook.json` lists them. No database, API server, Docker, or environment configuration is needed.

Run `npm ci`, then `npm run dev` to develop locally. Run `npm run build` to produce `dist/` and `npm start` to preview it. Upload only the contents of `dist/`.

For AWS hosting:

1. Upload `dist/` to a private S3 bucket; keep public access blocked.
2. Put CloudFront in front using its S3 REST origin and Origin Access Control. Set the default root object to `index.html` and redirect HTTP to HTTPS.
3. Request an ACM certificate in `us-east-1` for your domain, validate it through DNS, and attach it to CloudFront along with the custom domain name.
4. Point DNS to CloudFront (Route 53 alias records, or a subdomain CNAME at another DNS provider).
5. Give `index.html` and the JSON files a short cache lifetime; hashed `assets/` files can be cached for a year. Invalidate `/*` after publishing to refresh the page, library, and guide files.

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

Special book navigation and interactive number/family guides are defined in application code. Adding an ordinary library entry needs only JSON; a new custom screen needs code. Compound and stroke datasets are also JSON.

## GitHub Actions: push → test → deploy

`.github/workflows/deploy.yml` builds the static site and runs all browser/content logic tests on pushes and pull requests. Only a successful push to the repository's default branch deploys the tested artifact to S3 and refreshes CloudFront. Pull requests never receive deployment credentials.

One-time setup:

- Create the private S3 bucket, CloudFront distribution and domain/certificate described above.
- In AWS IAM, add an OpenID Connect provider: URL `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`.
- Create a role such as `github-nihongo-deploy`. Restrict its trust to this repository's default branch using `token.actions.githubusercontent.com:aud = sts.amazonaws.com` and an exact `token.actions.githubusercontent.com:sub`. The traditional subject is `repo:andiliewantorosusanto/Nihongoesfar:ref:refs/heads/main` if the default branch is `main`. New repositories may use immutable owner/repository IDs in the subject; match your repository's actual subject format. This workflow does not use a GitHub environment, so use the branch subject, not an environment subject.
- Give the role `s3:ListBucket` on the specific bucket, `s3:PutObject` on that bucket's objects, and `cloudfront:CreateInvalidation` on the specific distribution. CloudFront's Origin Access Control separately needs permission to read that bucket.
- In GitHub **Settings → Secrets and variables → Actions → Variables**, add repository variables `AWS_ROLE_ARN`, `AWS_DEFAULT_REGION`, `S3_BUCKET`, and `CLOUDFRONT_DISTRIBUTION_ID`. These identifiers are not credentials; no permanent AWS access keys are needed.
- Protect the default branch and enable GitHub Actions for the repository.

For code or content changes, edit the source or subject JSON files, commit, and push. CI publishes only `dist/`. Old hashed assets remain available to already-open browser tabs.

## Run locally

Requires Node.js 24 or newer.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. To preview production output, run `npm run build` and `npm start`, then open **http://127.0.0.1:4173**.

## Library organization

`app/lib/` groups shared code by responsibility:

- `api/`: browser JSON loading and practice requests.
- `content/`: shared entry types and a loader for the public subject JSON files.
- `japanese/`: readings, sentence annotations, romanization, and word forms.
- `practice/`: question generation, grading, and stroke checking.
- `guides/`: number conversion and lookup functions for public guide data.
- `ui/`: shared rendering helpers such as duplicate-safe list keys.

Guide data lives in `public/guides/`: `numbers.json` contains number/hour/minute pronunciation tables, `family.json` contains pronunciation help and diagram positions, `topic-books.json` groups existing entry IDs into books, and `tense-topics.json` maps older links to combined lessons. Edit these files, then build, commit, and push to publish changes. Converter and lookup behavior remains in TypeScript. Guide JSON is bundled during the build, so deploy a fresh build after editing it.

The editable subject files and attributed stroke/compound datasets live in `public/`. Stroke and compound code imports those same datasets, avoiding duplicate JSON copies. All lesson material lives in the public subject files; there is no separate TypeScript seed library.

## Styles

`app/globals.css` is the ordered stylesheet entry point. Feature styles live in `app/styles/` (layout, notebook, entry details, writing, practice, guides, reading, grammar, references, family tree, and topic books). Shared base and responsive rules remain separate. Keep import order stable because later rules refine earlier styles.

## Code style

Run `npm run format` to apply consistent spacing and line wrapping to source, tests, styles, and configuration. `npm run format:check` checks formatting without changing files and runs in GitHub Actions. Generated datasets and local data are excluded. Type checking also flags unused imports and variables.

## Read and practice

The Numbers quick guide includes a live number-to-kanji/hiragana converter and random practice with an inclusive minimum and maximum. Both support whole numbers from 0 to 999,999,999,999. Range practice accepts kanji or the displayed hiragana reading and offers answer reveal and a next-number action.

- Open any knowledge book: Kana, Grammar, Kanji, Vocabulary, Numbers & time, or Adjectives.
- Numbers & time opens a compact quick guide: basic numbers/hundreds/thousands with sound changes marked, plus hours, half past, and minute readings. Switch to All entries for the full date, month, duration, and counter reference.
- Search and filter by topic, level, and tag. Levels are labels, so the notebook can grow beyond N5.
- Practice any book immediately, or open an individual entry and select **Practice this entry**. Choose mixed practice or a specific skill. Up to 12 random questions are shown at a time; no prior selections are required.
- Sentence tiles work by tapping, keyboard, or dragging. Typed Japanese answers accept kana equivalents where authored in the lesson.
- Writing practice includes stroke animation, tracing guides, undo, and feedback on stroke order, direction, and approximate shape. It does not grade calligraphy or recognize arbitrary handwriting. Missing verified paths are labeled explicitly.
- Preferences control furigana and kana readings. Kana charts always show their sounds. Library changes are made in subject JSON files; reading preferences are saved in each browser. Practice answers and sessions are not saved.

Includes complete modern kana with combinations and voiced sounds, 25 grammar lessons with colored sentence roles, 100 kanji with readings and an expanded JMdict compound selection, 210 vocabulary entries, 121 number/time/counter entries, and 23 adjective entries. Beginner level tags are approximate study groupings, not an official JLPT syllabus.

## Guided grammar refresher

Grammar opens grouped by level: N5, N4, and N3. The current 25 lessons are N5; levels without entries are shown as empty. Every lesson is available directly and links to useful prerequisites. Read the goal, recap, common mix-up, and three worked examples, then start five guided questions: meaning choice, pattern choice, gap fill, sentence tiles, and independent typing. A successful retry adds one extra question per lesson at most. Mixed grammar practice and All entries remain available.

Hints give a clue before the separate Show answer action. Review explanation keeps the current answer and question in place; Return to question resumes it. Practice state stays in memory only. Furigana follows reading preferences, while reading questions hide the target reading until Reveal reading; answer feedback always supplies readings. Lesson vocabulary includes kana and English meanings.

Grammar sentences separate topic, subject, object, particles, modifiers, and predicates with consistent colors. Japanese chunks, kana readings, and English translations share those role colors.

## Class topics

The Class topics tag collects the requested beginner material across the books. Grammar includes separate demonstratives, は / が / を / へ, personal questions, and existence. Vocabulary includes polite movement forms, family comparisons, and special katakana sounds; Kana includes the missing loanword combinations. Numbers & time adds Calendar & durations and Age quick-guide tabs, plus large-number anchors through 1,000,000. Existing full month, weekday, and date entries are reused in the tables.

The Family entry includes a relationship tree with kanji/usual spelling, kana and romaji, plus a switch for own-family versus polite other-family words. The tree also appears in practice explanations and uses the saved comparison-table vocabulary.

The new guides include four color-aligned examples and five practice stages with one optional retry question. Search also matches authored romaji, including ikimasu, kore, kono, and sai. Tables and practice fields are included in the subject JSON files.

Reading references: [Japan Foundation katakana chart](https://www.irodori.jpf.go.jp/assets/data/Kana_all.pdf), [TUFS movement particle へ](https://www.coelang.tufs.ac.jp/mt/ja/gmod/courses/c02/lesson15/step1/explanation/026.html). Explanations and practice sentences are authored for this app.

## Checks

```sh
npm run format:check
npm run build
npm test
```

The tests use the built JSON files in `dist/`, so build first. The `dev:static`, `build:static`, and `test:static` commands remain as aliases for existing workflows.

## Credits

KanjiVG stroke paths © Ulrich Apel and contributors, CC BY-SA 3.0. The derived bundle retains that license; see `public/credits.html` and `public/stroke-data.json`. Explanations and examples are authored for this notebook. Primary orientation references include Japan Foundation IRODORI/MARUGOTO and Tokyo University of Foreign Studies language modules.

## Compound dictionary

Each starter kanji includes all compounds accepted by the dictionary selection rules, without a per-kanji count cap, with kana readings and English meanings. Some words are above N5. Different readings of the same spelling may have separate entries; reading practice accepts the readings listed for that word. The list initially shows 12 entries; use Show more to reveal another 12, or search the entire list. Search a kanji’s compound list or use its arrow button to practice that word immediately. Refreshing the dictionary updates the static kanji JSON while preserving other fields.

Compound entries are derived from JMdict © James William Breen and the Electronic Dictionary Research and Development Group, CC BY-SA 4.0. The offline dataset includes source entry identifiers, its source-file checksum, update date, selection notes, and attribution. See `public/credits.html#dictionary` and `public/compound-data.json`.

Refresh the dictionary data at least monthly when hosting/distributing it, following the EDRDG licence. The update uses Python 3’s standard library and downloads the current English JMdict from EDRDG:

```sh
npm run update:compounds
npm run build
```

Commit the refreshed JSON files and push to publish dictionary updates. For reproducibility, pass `--source /path/to/JMdict_e.gz` to `python3 scripts/update-compounds.py` to use an already downloaded copy.
