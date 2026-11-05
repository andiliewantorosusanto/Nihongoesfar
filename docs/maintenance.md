# Maintaining Nihongoesfar

[Back to the project overview](../README.md).

Development, content editing, hosting, and dictionary update instructions.

## Static website (recommended for hosting)

The static build runs entirely in the browser: no hosted database, API, owner key, or server is needed. Reading preferences stay in each browser, and practice answers are checked locally. The interface is read-only. All exported library entries (including custom notes) are public.

Grammar is authored in `content/grammar/*.yaml` and compiled into `public/grammar.json`. Other subjects are authored directly in their JSON files in `public/`; `notebook.json` lists the published files. No database, API server, Docker, or environment configuration is needed.

Run `npm ci`, then `npm run dev` to develop locally. Run `npm run build` to produce `dist/` and `npm start` to preview it. Upload only the contents of `dist/`.

For AWS hosting:

1. Upload `dist/` to a private S3 bucket; keep public access blocked.
2. Put CloudFront in front using its S3 REST origin and Origin Access Control. Set the default root object to `index.html` and redirect HTTP to HTTPS.
3. Request an ACM certificate in `us-east-1` for your domain, validate it through DNS, and attach it to CloudFront along with the custom domain name.
4. Point DNS to CloudFront (Route 53 alias records, or a subdomain CNAME at another DNS provider).
5. Give `index.html` and the JSON files a short cache lifetime; hashed `assets/` files can be cached for a year. Invalidate `/*` after publishing to refresh the page, library, and guide files.

Navigation is currently in-page, so no SPA path rewrite is required. Keep the S3 bucket: deleting it deletes the published content. Domain registration and AWS usage are billed separately.

## Edit grammar in YAML

Use the [grammar authoring guide](grammar-authoring.md) for sentence templates, question types, particle blanks, and accepted alternatives. Each grammar topic has its own YAML file; the index preserves topic order. Run `npm run content:build` after editing and commit both the YAML and generated `public/grammar.json`. Do not edit that generated JSON directly. Development watches grammar YAML changes; production builds generate before compiling. `npm run content:check` validates source and checks freshness without writing; CI runs it before building.

## Edit other learning material directly in JSON

The published learning library is split into `public/kana.json`, `public/kanji.json`, `public/grammar.json`, `public/vocabulary.json`, `public/numbers.json`, and `public/adjectives.json`. Each file is an array of entries. Edit the matching subject file for non-grammar material; use YAML for grammar. Then verify and commit your changes. Push only when ready to publish. GitHub Actions builds and publishes that JSON automatically; no database export is needed for this workflow.

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

Special book navigation and interactive number/family guides are defined in application code. Adding an ordinary library entry needs only content (YAML for grammar, JSON for other subjects); a new custom screen needs code. Compound and stroke datasets are also JSON.

## GitHub Actions: push → test → deploy

`.github/workflows/deploy.yml` builds the static site and runs all browser/content logic tests on pushes and pull requests. Only a successful push to the repository's default branch deploys the tested artifact to S3 and refreshes CloudFront. Pull requests never receive deployment credentials.

One-time setup:

- Create the private S3 bucket, CloudFront distribution and domain/certificate described above.
- In AWS IAM, add an OpenID Connect provider: URL `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`.
- Create a role such as `github-nihongo-deploy`. Restrict its trust to this repository's default branch using `token.actions.githubusercontent.com:aud = sts.amazonaws.com` and an exact `token.actions.githubusercontent.com:sub`. The traditional subject is `repo:andiliewantorosusanto/Nihongoesfar:ref:refs/heads/main` if the default branch is `main`. New repositories may use immutable owner/repository IDs in the subject; match your repository's actual subject format. This workflow does not use a GitHub environment, so use the branch subject, not an environment subject.
- Give the role `s3:ListBucket` on the specific bucket, `s3:PutObject` on that bucket's objects, and `cloudfront:CreateInvalidation` on the specific distribution. CloudFront's Origin Access Control separately needs permission to read that bucket.
- In GitHub **Settings → Secrets and variables → Actions → Variables**, add repository variables `AWS_ROLE_ARN`, `AWS_DEFAULT_REGION`, `S3_BUCKET`, and `CLOUDFRONT_DISTRIBUTION_ID`. These identifiers are not credentials; no permanent AWS access keys are needed.
- Protect the default branch and enable GitHub Actions for the repository.

For code or content changes, edit the source, generate grammar JSON if needed, and verify before committing. An authorized push publishes the changes. CI publishes only `dist/`. Old hashed assets remain available to already-open browser tabs.

## Library organization

`app/lib/` groups shared code by responsibility:

- `api/`: browser JSON loading and practice requests.
- `content/`: shared entry types and a loader for the public subject JSON files.
- `japanese/`: readings, sentence annotations, romanization, and word forms.
- `practice/`: question generation, grading, and stroke checking.
- `guides/`: number conversion and lookup functions for public guide data.
- `ui/`: shared rendering helpers such as duplicate-safe list keys.

Guide data lives in `public/guides/`: `numbers.json` contains number/hour/minute pronunciation tables, `family.json` contains pronunciation help and diagram positions, `topic-books.json` groups existing entry IDs into books, and `tense-topics.json` maps older links to combined lessons. Edit these files, then build, commit, and push to publish changes. Converter and lookup behavior remains in TypeScript. Guide JSON is bundled during the build, so deploy a fresh build after editing it.

The editable subject files and attributed stroke/compound datasets live in `public/`. Stroke and compound code imports those same datasets, avoiding duplicate JSON copies. Published lesson material lives in the public subject files; grammar is maintained in YAML and generated into that public snapshot. There is no separate TypeScript seed library.

## Styles

`app/globals.css` is the ordered stylesheet entry point. Feature styles live in `app/styles/` (layout, notebook, entry details, writing, practice, guides, reading, grammar, references, family tree, and topic books). Shared base and responsive rules remain separate. Keep import order stable because later rules refine earlier styles.

## Code style

Run `npm run format` to apply consistent spacing and line wrapping to source, tests, styles, and configuration. `npm run format:check` checks formatting without changing files and runs in GitHub Actions. Generated datasets and local data are excluded. Type checking also flags unused imports and variables.

## Compound dictionary

Compound entries are derived from JMdict © James William Breen and the Electronic Dictionary Research and Development Group, CC BY-SA 4.0. The offline dataset includes source entry identifiers, its source-file checksum, update date, selection notes, and attribution. See `public/credits.html#dictionary` and `public/compound-data.json`.

Refresh the dictionary data at least monthly when hosting/distributing it, following the EDRDG licence. The update uses Python 3’s standard library and downloads the current English JMdict from EDRDG:

```sh
npm run update:compounds
npm run build
```

Commit the refreshed JSON files and push to publish dictionary updates. For reproducibility, pass `--source /path/to/JMdict_e.gz` to `python3 scripts/update-compounds.py` to use an already downloaded copy.
