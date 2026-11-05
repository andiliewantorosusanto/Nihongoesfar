# Editing grammar questions

Grammar is authored in `content/grammar/*.yaml`, one file per topic.
`content/grammar/index.yaml` lists the files in display order.
**Do not edit `public/grammar.json` by hand**: it is generated and remains the
published format used by the application. Other subjects still use their JSON files.

Each topic has three sections:

- `entry`: the existing topic information, reference tables, lesson, and examples.
- `sentences`: named sentences with their reading, meaning, and annotations.
- `exercises`: ordered questions referring to those sentences by their local IDs.

Start with the topic you want to extend. Add a sentence, then add one or more
exercise definitions. Keep existing topic and exercise IDs stable. New exercise IDs
must be unique within the topic. Sentence IDs are local to their file.

## Add a sentence once

Append this under a topic's existing `sentences:` mapping. These annotations give
furigana, word colors, aligned translations, and sentence-building tiles. They are
authored explicitly; the generator does not guess readings or grammatical roles.

```yaml
school-by-bus:
  text: 私はバスで学校に行きます。
  reading: わたしはばすでがっこうにいきます。
  meaning: I go to school by bus.
  form: polite
  hint: Think about the topic, transport, and destination.
  explanation: は marks the topic, で marks transport, and に marks the destination.
  tokens:
    - { text: 私, reading: わたし, role: topic, wordClass: noun phrase }
    - { text: は, reading: は, role: particle, wordClass: particle }
    - { text: バス, reading: ばす, role: modifier, wordClass: noun phrase }
    - { text: で, reading: で, role: particle, wordClass: particle }
    - { text: 学校, reading: がっこう, role: modifier, wordClass: noun phrase }
    - { text: に, reading: に, role: particle, wordClass: particle }
    - { text: 行きます, reading: いきます, role: predicate, wordClass: predicate }
  translationTokens:
    - { text: 'I ', role: topic }
    - { text: 'go', role: predicate }
    - { text: ' to school by bus.', role: modifier }
```

Use `form: polite` or `form: casual` when the answer depends on register. The label
is added to generated production prompts. Omit it only for questions where that
distinction does not apply. Annotation token text and reading may omit final
punctuation; the complete sentence above retains it.

## Reuse a sentence for several practice types

Append these under the existing `exercises:` list:

```yaml
- id: school-by-bus-write
  type: typing
  sentence: school-by-bus
- id: school-by-bus-build
  type: tiles
  sentence: school-by-bus
- id: school-by-bus-meaning
  type: meaning-choice
  sentence: school-by-bus
  choices:
    - { text: I go to school by bus., reading: '' }
    - { text: I walk from school to the bus stop., reading: '' }
    - { text: I study at school., reading: '' }
    - { text: I go home by train., reading: '' }
  answers: [I go to school by bus.]
```

Writing and sentence-building templates accept the full Japanese sentence and its
kana reading. Tiles use the sentence's `tiles` annotation if supplied, otherwise
its `tokens`. Meaning questions show the shared sentence as their context.
Distractors and choice answers are always explicit; no incorrect Japanese is generated.

For `pattern-choice` questions, choices may be explicit `{ text, reading }` values
or `{ sentence: another-sentence-id }` references to annotated sentences in the
same topic. A `context` may also use a sentence reference.

## Multiple particle blanks

Use `type: gap` and select particle tokens with **1-based positions**. In the
sentence above, tokens 2, 4, and 6 are は, で, and に.

```yaml
- id: school-by-bus-particles
  type: gap
  sentence: school-by-bus
  blanks:
    - token: 2
      explanation: は marks the topic.
    - token: 4
      explanation: で marks the means of transport.
    - token: 6
      answers: [に, へ]
      explanation: に and へ can both mark this destination.
```

The generator creates separate inputs, accepted answer combinations, and numbered
feedback explanations. If a blank has no `answers`, its annotated particle is the
answer. Alternatives must be appropriate for that exact sentence; do not globally
substitute は/が or に/へ. Keep blanks in sentence order.

## Custom questions and existing content

Every exercise can override `prompt`, `hint`, `explanation`, `answers`, `context`,
`choices`, `tiles`, `feedback`, `particleSegments`, and `alternate`. These fields
use the existing application shapes and replace template defaults, rather than
being merged. Explicit overrides preserve older questions exactly.

A conventional single-gap question supplies an explicit masked `context` and
`answers`. Only particle questions with `blanks` generate the missing portions
automatically. Choice questions require at least two choices and explicit answers.
All questions require a hint and explanation, either on their shared sentence or
on the question itself.

Existing entries include separate reference examples and lesson metadata. Preserve
those annotations when editing them; changing a practice sentence does not rewrite
reference tables or lesson examples.

## Generate and check

```sh
npm run content:build
npm run build:static
npm run test:static
npm run format:check
```

`npm run dev` generates the JSON before starting and watches YAML changes. Valid
edits regenerate the data and reload the page. Invalid edits show an error with the
topic, sentence, and question; the previous generated file is left intact.

`npm run content:check` checks validity and freshness **without writing**. CI runs
it before the build, so forgetting to regenerate fails the check. Commit both YAML
changes and updated generated JSON. Generation preserves entry and exercise order,
uses no timestamps, and does not rewrite an unchanged output file.

For a new topic, copy a similar topic file, give it a unique entry ID, and add its
filename to `index.yaml`. Unlisted files, duplicate IDs, broken references, missing
question fields, and invalid particle blank positions are rejected.

## Conversion and rollback

The initial YAML conversion preserves all 59 topics and 2,260 exercises. The
runtime schema, manifest URLs, grading, and static hosting are unchanged. The
committed JSON remains usable independently of the YAML authoring tools. Reverting
the conversion commit restores direct JSON authoring and the previous build steps.
