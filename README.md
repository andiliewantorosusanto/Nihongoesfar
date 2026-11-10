# Nihongoesfar

Nihongoesfar is a Japanese study notebook for learners who want to revisit a lesson, look up a reading, and practice what they have just learned. It brings explanations, reference tables, examples, and exercises together so you can move from “I’ve seen this before” to using it yourself.

It is useful alongside classes or self-study: review a confusing particle, check a verb form, learn words that use a kanji, or work through a few questions on a topic you want to remember.

## What you can study

- **Kana:** learn hiragana and katakana sounds, combinations, and stroke order.
- **Grammar:** revisit sentence patterns through explanations, worked examples, and guided practice. Sentence colors help connect Japanese phrases with their readings and English meanings.
- **Kanji:** check readings, explore compound words, and practice writing.
- **Vocabulary and adjectives:** look up words, meanings, readings, example sentences, and useful word forms. Guides to adjective sentence patterns and tenses live in Grammar.
- **Numbers and time:** make sense of pronunciation changes, dates, ages, counters, and clock readings. Number, hour, and minute tables are always visible, with unusual readings highlighted. The minute guide explains compound readings such as 13 and 28, plus exact tens. Open the number converter with **Convert number**, or choose Mixed, Reading, Meaning, or Grammar and click **Practice** to set an inclusive number range in its popup. Reading asks for hiragana, Meaning asks for digits, and Grammar practices pronunciation changes. Both tools are available from the top-right controls.
- **Family terms:** use a relationship tree to compare words for your own family and someone else’s.

The material focuses on beginner Japanese, with level labels to help you browse. Kanji compound lists also include words beyond beginner level.

## How to use it

Sentence-writing and gap prompts label the expected polite or casual form.

Typing exercises mark vocabulary words with dotted underlines. Hover, focus, or tap a marked word to reveal its Japanese and kana.

Open a book and browse, or search for the word or topic you need. Read an explanation, compare examples, then start practice from that entry or the whole book.

Guided grammar rounds sample five questions, moving from recognizing a meaning or pattern to filling gaps, arranging a sentence, and typing an answer. Repeating a round draws fresh examples where available; Present and Past also use their related grammar lessons. Hints and explanations help you work through mistakes. Writing practice offers stroke animation, tracing, and feedback on stroke order, direction, and approximate shape.

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

Practice controls let you choose all question types or focus on meaning choices, Japanese choices, gaps, sentence tiles, or writing. Enable **Endless practice** to keep receiving shuffled rounds from the current lesson and its linked topics until you close practice. Sentences can repeat after the available pool is exhausted.

The smaller grammar topics include additional sentence variants with matching readings, answer choices, gap exercises, tiles, and writing prompts.

For focused particle drills, open **Grammar** and click **Particle practice** in the top practice controls. You can also open the **Particle fill-in practice** topic. The bank
contains 72 sentences with 2–4 blanks each (210 blanks total). Enter one particle
in each numbered box; all blanks are checked together. Destination に and へ are
both accepted. Feedback shows the complete sentence and explains each blank.
Use **Endless practice** to continue with more particle questions. This focused topic
uses fill-in questions throughout.

In **Time**, choose **Practice time** to see a random clock time and type its kanji or hiragana. Check your answer, then choose **Next time**. Half-past answers using 半 are accepted.
