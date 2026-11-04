# Nihongoesfar

Nihongoesfar is a Japanese study notebook for learners who want to revisit a lesson, look up a reading, and practice what they have just learned. It brings explanations, reference tables, examples, and exercises together so you can move from “I’ve seen this before” to using it yourself.

It is useful alongside classes or self-study: review a confusing particle, check a verb form, learn words that use a kanji, or work through a few questions on a topic you want to remember.

## What you can study

- **Kana:** learn hiragana and katakana sounds, combinations, and stroke order.
- **Grammar:** revisit sentence patterns through explanations, worked examples, and guided practice. Sentence colors help connect Japanese phrases with their readings and English meanings.
- **Kanji:** check readings, explore compound words, and practice writing.
- **Vocabulary and adjectives:** look up words, meanings, readings, example sentences, and useful word forms. Guides to adjective sentence patterns and tenses live in Grammar.
- **Numbers and time:** make sense of pronunciation changes, dates, ages, counters, and clock readings. Number, hour, and minute tables are always visible, with unusual readings highlighted. The minute guide explains compound readings such as 13 and 28, plus exact tens. Use the compact number converter or start range practice from the top-right controls.
- **Family terms:** use a relationship tree to compare words for your own family and someone else’s.

The material focuses on beginner Japanese, with level labels to help you browse. Kanji compound lists also include words beyond beginner level.

## How to use it

Open a book and browse, or search for the word or topic you need. Read an explanation, compare examples, then start practice from that entry or the whole book.

Grammar practice moves from recognizing a meaning or pattern to filling gaps, arranging a sentence, and typing an answer. Hints and explanations help you work through mistakes. Writing practice offers stroke animation, tracing, and feedback on stroke order, direction, and approximate shape.

Turn furigana and romaji on when you need reading support. Your reading preferences stay in your browser. You can start studying without an account, and return to any topic whenever you need it.

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

Learning material lives in the subject JSON files under `public/`. See the [maintenance guide](docs/maintenance.md) for content editing, project structure, hosting, and dictionary updates.

Before committing changes, run:

```sh
npm run format:check
npm run build:static
npm run test:static
```

## Credits

Explanations and examples are authored for this notebook, with reference to Japan Foundation IRODORI/MARUGOTO and Tokyo University of Foreign Studies language modules.

Kanji stroke paths come from KanjiVG © Ulrich Apel and contributors, CC BY-SA 3.0. Compound words come from JMdict © James William Breen and the Electronic Dictionary Research and Development Group, CC BY-SA 4.0. See [the full credits](public/credits.html) for attribution and source details.
