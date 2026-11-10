# Nihongo Notto

Nihongo Notto is a Japanese study notebook for learners who want to revisit a lesson, look up a reading, and practice. It brings explanations, reference tables, examples, and exercises together so you can move from “I’ve seen this before” to using it yourself.

It is useful alongside classes or self-study: review a confusing particle, check a verb form, learn words that use a kanji, or work through a few questions on a topic you want to remember.

## What you can study

- **Kana:** learn hiragana and katakana sounds, combinations, and stroke order.
- **Grammar:** revisit sentence patterns through explanations, worked examples, and guided practice. Sentence colors help connect Japanese phrases with their readings and English meanings.
- **Kanji:** check readings, explore compound words, and practice writing.
- **Vocabulary and adjectives:** look up words, meanings, readings, example sentences, and useful word forms. Guides to adjective sentence patterns and tenses live in Grammar.onunciation changes. Both tools are available from the top-right controls.

## Run locally

Requires Node.js 24 or newer.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**.

To build and preview the site:

```sh
npm run build
npm start
```

Open **http://127.0.0.1:4173**. The site runs in the browser and uses the learning material bundled with it.

## Contributing

Edit grammar in small topic YAML files under `content/grammar/`; `npm run content:build` generates `public/grammar.json`. See the [grammar authoring guide](docs/grammar-authoring.md) for reusable sentence templates and multi-blank questions. Other learning material lives in the subject JSON files under `public/`. See the [maintenance guide](docs/maintenance.md) for content editing, project structure, hosting, and dictionary updates.

Before committing changes, run:

```sh
npm run format:check
npm run build:static
npm run test:static
```

## Credits

Explanations and examples are authored for this notebook, with reference to Japan Foundation IRODORI/MARUGOTO and Tokyo University of Foreign Studies language modules.

Kanji stroke paths come from KanjiVG © Ulrich Apel and contributors, CC BY-SA 3.0. Compound words come from JMdict © James William Breen and the Electronic Dictionary Research and Development Group, CC BY-SA 4.0. See [the full credits](public/credits.html) for attribution and source details.