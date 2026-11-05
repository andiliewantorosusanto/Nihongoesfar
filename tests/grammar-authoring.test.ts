import { EventEmitter } from 'node:events';
import { grammarAuthoring } from '../scripts/content/vite-grammar.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, copyFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stringify } from 'yaml';
import {
  compileGrammar,
  compileTopic,
  generateGrammar,
  parseYaml,
  type GrammarSource,
} from '../scripts/content/grammar.ts';
import { grade } from '../app/lib/practice/learning.ts';

function topic(): GrammarSource {
  return {
    entry: {
      id: 'grammar-authoring-test',
      kind: 'grammar',
      title: 'Particle practice',
      japanese: '助詞',
      reading: 'じょし',
      meaning: 'Particles',
      level: 'N5',
      topic: 'Particles',
      tags: ['Grammar'],
      note: '',
      examples: [
        {
          japanese: '私は学校に行きます。',
          reading: 'わたしはがっこうにいきます。',
          meaning: 'I go to school.',
        },
      ],
    },
    sentences: {
      'go-to-school': {
        text: '私は学校に行きます。',
        reading: 'わたしはがっこうにいきます。',
        meaning: 'I go to school.',
        form: 'polite',
        hint: 'Think about the topic and destination.',
        explanation: 'に marks the destination.',
        tokens: [
          { text: '私', reading: 'わたし', role: 'topic', wordClass: 'noun' },
          { text: 'は', reading: 'は', role: 'particle', wordClass: 'particle' },
          { text: '学校', reading: 'がっこう', role: 'modifier', wordClass: 'noun' },
          { text: 'に', reading: 'に', role: 'particle', wordClass: 'particle' },
          { text: '行きます', reading: 'いきます', role: 'predicate', wordClass: 'predicate' },
        ],
        translationTokens: [{ text: 'I go to school.', role: 'implicit', implicit: true }],
      },
    },
    exercises: [{ id: 'write-school', type: 'typing', sentence: 'go-to-school' }],
  };
}

test('every YAML topic reproduces the committed runtime data in the original order', () => {
  const generated = compileGrammar();
  const current = JSON.parse(readFileSync('public/grammar.json', 'utf8'));
  assert.deepEqual(generated, current);
  for (const entry of generated)
    for (const exercise of entry.exercises!)
      for (const answer of exercise.answers)
        assert.ok(grade(entry, 'grammar', answer, undefined, exercise.id));
});

test('question templates reuse annotations, label forms, generate tiles and preserve overrides', () => {
  const source = topic();
  source.exercises.push(
    { id: 'build-school', type: 'tiles', sentence: 'go-to-school' },
    {
      id: 'meaning-school',
      type: 'meaning-choice',
      sentence: 'go-to-school',
      choices: [
        { text: 'I go to school.', reading: '' },
        { text: 'I study at school.', reading: '' },
      ],
      answers: ['I go to school.'],
    },
    {
      id: 'choose-school',
      type: 'pattern-choice',
      sentence: 'go-to-school',
      choices: [
        { sentence: 'go-to-school' },
        { text: '学校で行きます。', reading: 'がっこうでいきます。' },
      ],
      answers: ['私は学校に行きます。'],
    },
  );
  const output = compileTopic(source);
  const [writing, tiles, meaning, pattern] = output.exercises!;
  assert.equal(writing.id, 'write-school');
  assert.equal(writing.prompt, 'Write in Japanese: I go to school. (polite)');
  assert.deepEqual(writing.answers, ['私は学校に行きます。', 'わたしはがっこうにいきます。']);
  assert.equal(tiles.tiles!.map((t) => t.text).join(''), '私は学校に行きます');
  assert.deepEqual(meaning.context!.tokens, source.sentences['go-to-school'].tokens);
  assert.deepEqual(
    pattern.choices![0].translationTokens,
    source.sentences['go-to-school'].translationTokens,
  );
  source.sentences['go-to-school'].form = 'casual';
  assert.match(compileTopic(source).exercises![0].prompt, /\(casual\)$/);
  source.exercises[0].prompt = 'Custom question';
  source.exercises[0].answers = ['explicit answer'];
  source.exercises[0].hint = 'Custom hint';
  assert.equal(compileTopic(source).exercises![0].prompt, 'Custom question');
  assert.deepEqual(compileTopic(source).exercises![0].answers, ['explicit answer']);
});

test('particle templates produce ordered blanks, explicit alternatives and explanations', () => {
  const source = topic();
  source.exercises = [
    {
      id: 'particles-school',
      type: 'gap',
      sentence: 'go-to-school',
      blanks: [
        { token: 2, explanation: 'は marks the topic.' },
        { token: 4, answers: ['に', 'へ'], explanation: 'に or へ marks the destination.' },
      ],
    },
  ];
  const entry = compileTopic(source);
  const exercise = entry.exercises![0];
  assert.deepEqual(exercise.particleSegments, [
    { text: '私', reading: 'わたし' },
    { text: '学校', reading: 'がっこう' },
    { text: '行きます。', reading: 'いきます。' },
  ]);
  assert.deepEqual(exercise.answers, ['は|に', 'は|へ']);
  assert.match(exercise.explanation, /Blank 2: に or へ/);
  assert.ok(grade(entry, 'grammar', 'は|へ', undefined, exercise.id));
  assert.equal(grade(entry, 'grammar', 'は|で', undefined, exercise.id), false);
  assert.equal(grade(entry, 'grammar', 'に|は', undefined, exercise.id), false);
});

test('invalid authoring produces contextual errors rather than broken questions', () => {
  const cases: [string, (s: GrammarSource) => void][] = [
    ['duplicate exercise ID', (s) => s.exercises.push({ ...s.exercises[0] })],
    [
      'unresolved sentence reference',
      (s) => {
        s.exercises[0].sentence = 'missing';
      },
    ],
    [
      'choices',
      (s) => {
        s.exercises[0].type = 'meaning-choice';
        s.exercises[0].answers = ['I go to school.'];
      },
    ],
    [
      'missing hint',
      (s) => {
        delete s.sentences['go-to-school'].hint;
      },
    ],
    [
      'reading and meaning',
      (s) => {
        s.sentences['go-to-school'].reading = '';
      },
    ],
    [
      'invalid or repeated token',
      (s) => {
        s.exercises[0].type = 'gap';
        s.exercises[0].blanks = [{ token: 20, explanation: 'Invalid' }];
      },
    ],
    [
      'must select a particle',
      (s) => {
        s.exercises[0].type = 'gap';
        s.exercises[0].blanks = [{ token: 1, explanation: 'Invalid' }];
      },
    ],
    [
      'blank counts differ',
      (s) => {
        s.exercises[0].particleSegments = [
          { text: '', reading: '' },
          { text: '', reading: '' },
          { text: '', reading: '' },
        ];
      },
    ],
  ];
  for (const [message, change] of cases) {
    const source = topic();
    change(source);
    assert.throws(
      () => compileTopic(source, 'school.yaml'),
      (error: Error) => error.message.includes('school.yaml') && error.message.includes(message),
    );
  }
  assert.throws(() => parseYaml('sentences: {}\nsentences: {}', 'school.yaml'), /school.yaml/);
});

test('generation is deterministic, checks without writes, and rejects invalid input atomically', () => {
  const root = mkdtempSync(join(tmpdir(), 'grammar-authoring-'));
  const output = join(root, 'grammar.json');
  const sources = join(root, 'sources');
  // Keep generated output outside the source directory, just as in the repository.
  mkdirSync(sources);
  try {
    writeFileSync(join(sources, 'index.yaml'), '- school.yaml\n');
    writeFileSync(join(sources, 'school.yaml'), stringify(topic()));
    generateGrammar(false, sources, output);
    const first = readFileSync(output, 'utf8');
    generateGrammar(false, sources, output);
    assert.equal(readFileSync(output, 'utf8'), first);
    generateGrammar(true, sources, output);
    const changed = topic();
    changed.entry.title = 'Changed';
    writeFileSync(join(sources, 'school.yaml'), stringify(changed));
    assert.throws(() => generateGrammar(true, sources, output), /stale/);
    assert.equal(readFileSync(output, 'utf8'), first);
    changed.exercises[0].sentence = 'missing';
    writeFileSync(join(sources, 'school.yaml'), stringify(changed));
    assert.throws(() => generateGrammar(false, sources, output), /unresolved/);
    assert.equal(readFileSync(output, 'utf8'), first);
    copyFileSync(join(sources, 'school.yaml'), join(sources, 'unlisted.yaml'));
    assert.throws(() => compileGrammar(sources), /unlisted/);
    writeFileSync(join(sources, 'index.yaml'), '- school.yaml\n- school.yaml\n');
    assert.throws(() => compileGrammar(sources), /duplicate filenames/);
    writeFileSync(join(sources, 'school.yaml'), stringify(topic()));
    copyFileSync(join(sources, 'school.yaml'), join(sources, 'unlisted.yaml'));
    writeFileSync(join(sources, 'index.yaml'), '- school.yaml\n- unlisted.yaml\n');
    assert.throws(() => compileGrammar(sources), /duplicate topic IDs/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('documented examples are copyable and compile into working questions', () => {
  const guide = readFileSync('docs/grammar-authoring.md', 'utf8');
  const blocks = [...guide.matchAll(/```yaml\n([\s\S]*?)```/g)].map((match) =>
    parseYaml(match[1], 'grammar-authoring.md'),
  );
  const source = topic();
  Object.assign(source.sentences, blocks[0]);
  source.exercises = [
    ...(blocks[1] as GrammarSource['exercises']),
    ...(blocks[2] as GrammarSource['exercises']),
  ];
  const entry = compileTopic(source);
  assert.equal(entry.exercises!.length, 4);
  assert.ok(grade(entry, 'grammar', 'は|で|へ', undefined, 'school-by-bus-particles'));
});

test('development watcher reloads valid edits and reports invalid edits without replacing output', () => {
  const root = mkdtempSync(join(tmpdir(), 'grammar-watch-'));
  const sources = join(root, 'sources');
  mkdirSync(sources);
  const output = join(root, 'grammar.json');
  const file = join(sources, 'school.yaml');
  const messages: { type: string }[] = [];
  const watcher = Object.assign(new EventEmitter(), { add: (_path: string) => {} });
  const httpServer = new EventEmitter();
  try {
    writeFileSync(join(sources, 'index.yaml'), '- school.yaml\n');
    writeFileSync(file, stringify(topic()));
    generateGrammar(false, sources, output);
    const initial = readFileSync(output, 'utf8');
    const server = {
      watcher,
      httpServer,
      config: { logger: { error: (_message: string) => {} } },
      ws: { send: (message: { type: string }) => messages.push(message) },
    };
    const configure = grammarAuthoring(sources, output).configureServer as (
      server: unknown,
    ) => void;
    configure(server);
    const invalid = topic();
    invalid.exercises[0].sentence = 'missing';
    writeFileSync(file, stringify(invalid));
    watcher.emit('all', 'change', file);
    assert.equal(messages.at(-1)!.type, 'error');
    assert.equal(readFileSync(output, 'utf8'), initial);
    const valid = topic();
    valid.entry.title = 'Updated';
    writeFileSync(file, stringify(valid));
    watcher.emit('all', 'change', file);
    assert.equal(messages.at(-1)!.type, 'full-reload');
    assert.equal(JSON.parse(readFileSync(output, 'utf8'))[0].title, 'Updated');
    const count = messages.length;
    watcher.emit('all', 'change', output);
    assert.equal(messages.length, count);
    httpServer.emit('close');
    assert.equal(watcher.listenerCount('all'), 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
