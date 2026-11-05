import { readFileSync, readdirSync, writeFileSync, renameSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { parseDocument } from 'yaml';
import type { Entry, GuidedExercise, ReadingText } from '../../app/lib/content/types.ts';

type Sentence = GuidedExercise['feedback'] & {
  form?: 'polite' | 'casual';
  hint?: string;
  explanation?: string;
};
type ParticleBlank = { token: number; answers?: string[]; explanation: string };
type SentenceReference = { sentence: string };
export type ExerciseSource = Omit<Partial<GuidedExercise>, 'context' | 'choices'> & {
  context?: ReadingText | SentenceReference;
  choices?: (ReadingText | SentenceReference)[];
  id: string;
  type: GuidedExercise['type'];
  sentence: string;
  blanks?: ParticleBlank[];
};
export type GrammarSource = {
  entry: Omit<Entry, 'exercises'>;
  sentences: Record<string, Sentence>;
  exercises: ExerciseSource[];
};

function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const stringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every(isText);

export function parseYaml(text: string, file: string): unknown {
  const doc = parseDocument(text, { uniqueKeys: true });
  requireValue(!doc.errors.length, `${file}: ${doc.errors.map((e) => e.message).join('; ')}`);
  return doc.toJS({ maxAliasCount: 1000 });
}

function particleFields(sentence: Sentence, blanks: ParticleBlank[], where: string) {
  const tokens = sentence.tokens;
  requireValue(tokens?.length, `${where}: particle blanks require annotated tokens`);
  requireValue(blanks.length > 0, `${where}: specify at least one particle blank`);
  let last = 0;
  let segments: ReadingText[] = [];
  let combinations: string[][] = [[]];
  const explanations: string[] = [];
  const segment = (start: number, end: number) => ({
    text: tokens
      .slice(start, end)
      .map((t) => t.text)
      .join(''),
    reading: tokens
      .slice(start, end)
      .map((t) => t.reading ?? t.text)
      .join(''),
  });
  for (const [i, blank] of blanks.entries()) {
    const position = blank.token - 1;
    requireValue(
      Number.isInteger(position) && position >= last && position < tokens.length,
      `${where}: blank ${i + 1} has an invalid or repeated token position`,
    );
    requireValue(
      tokens[position].wordClass === 'particle',
      `${where}: blank ${i + 1} must select a particle token`,
    );
    requireValue(isText(blank.explanation), `${where}: blank ${i + 1} needs an explanation`);
    const answers = blank.answers ?? [tokens[position].text];
    requireValue(stringList(answers), `${where}: blank ${i + 1} needs accepted particles`);
    segments.push(segment(last, position));
    combinations = combinations.flatMap((parts) => answers.map((answer) => [...parts, answer]));
    last = position + 1;
    explanations.push(`Blank ${i + 1}: ${blank.explanation}`);
  }
  segments.push(segment(last, tokens.length));
  // Older annotations omit the sentence-final punctuation from their tokens.
  const text = tokens.map((t) => t.text).join('');
  const reading = tokens.map((t) => t.reading ?? t.text).join('');
  requireValue(
    sentence.text.startsWith(text) && /^[。！？!?]*$/.test(sentence.text.slice(text.length)),
    `${where}: particle tokens must reconstruct the sentence`,
  );
  requireValue(
    sentence.reading.startsWith(reading) &&
      /^[。！？!?]*$/.test(sentence.reading.slice(reading.length)),
    `${where}: particle token readings must reconstruct the sentence reading`,
  );
  segments = segments.map((value, i) =>
    i === segments.length - 1
      ? {
          text: value.text + sentence.text.slice(text.length),
          reading: value.reading + sentence.reading.slice(reading.length),
        }
      : value,
  );
  return {
    particleSegments: segments,
    answers: combinations.map((parts) => parts.join('|')),
    explanation: explanations.join(' '),
  };
}

export function compileTopic(source: GrammarSource, file = 'grammar topic'): Entry {
  requireValue(source && typeof source === 'object', `${file}: expected a topic mapping`);
  requireValue(
    Object.keys(source).every((key) => ['entry', 'sentences', 'exercises'].includes(key)),
    `${file}: unknown topic section`,
  );
  const { entry, sentences, exercises } = source;
  requireValue(entry && typeof entry === 'object', `${file}: missing entry metadata`);
  const where = `${file} (${entry.id ?? 'missing topic ID'})`;
  for (const key of ['id', 'title', 'japanese', 'reading', 'meaning', 'level', 'topic'] as const)
    requireValue(isText(entry[key]), `${where}: missing entry.${key}`);
  requireValue(entry.kind === 'grammar', `${where}: entry.kind must be grammar`);
  requireValue(
    typeof entry.note === 'string' && Array.isArray(entry.tags) && entry.tags.every(isText),
    `${where}: entry needs note and tags`,
  );
  requireValue(
    Array.isArray(entry.examples) && entry.examples.length,
    `${where}: entry needs examples`,
  );
  requireValue(
    sentences && typeof sentences === 'object' && !Array.isArray(sentences),
    `${where}: missing sentences mapping`,
  );
  for (const [id, value] of Object.entries(sentences)) {
    const keys = [
      'text',
      'reading',
      'meaning',
      'tokens',
      'tiles',
      'translationTokens',
      'role',
      'wordClass',
      'form',
      'hint',
      'explanation',
    ];
    requireValue(
      value && Object.keys(value).every((key) => keys.includes(key)),
      `${where}, sentence ${id}: unknown sentence field`,
    );
    requireValue(
      value && isText(value.text) && isText(value.reading) && isText(value.meaning),
      `${where}, sentence ${id}: text, reading and meaning are required`,
    );
    requireValue(
      value.form === undefined || ['polite', 'casual'].includes(value.form),
      `${where}, sentence ${id}: form must be polite or casual`,
    );
  }
  requireValue(Array.isArray(exercises) && exercises.length, `${where}: missing exercises`);
  const used = new Set<string>();
  const compiled = exercises.map((sourceExercise, index) => {
    requireValue(
      sourceExercise && typeof sourceExercise === 'object',
      `${where}, exercise ${index + 1}: expected a question mapping`,
    );
    const { sentence: sentenceId, blanks, ...overrides } = sourceExercise;
    const allowed = [
      'id',
      'type',
      'prompt',
      'context',
      'choices',
      'tiles',
      'answers',
      'hint',
      'explanation',
      'feedback',
      'particleSegments',
      'alternate',
    ];
    requireValue(
      Object.keys(overrides).every((key) => allowed.includes(key)),
      `${where}: unknown exercise field in ${sourceExercise.id}`,
    );
    const location = `${where}, sentence ${sentenceId}, exercise ${overrides.id ?? '(missing ID)'}`;
    requireValue(
      isText(overrides.id) && !used.has(overrides.id),
      `${location}: missing or duplicate exercise ID`,
    );
    used.add(overrides.id);
    requireValue(
      Object.hasOwn(sentences, sentenceId),
      `${location}: unresolved sentence reference`,
    );
    requireValue(
      ['meaning-choice', 'pattern-choice', 'gap', 'tiles', 'typing'].includes(overrides.type),
      `${location}: invalid question type`,
    );
    const resolveReading = (value: ReadingText | SentenceReference): ReadingText => {
      if ('sentence' in value) {
        requireValue(
          Object.hasOwn(sentences, value.sentence),
          `${location}: unresolved sentence reference ${value.sentence}`,
        );
        const {
          form: _form,
          hint: _hint,
          explanation: _explanation,
          ...reading
        } = sentences[value.sentence];
        return reading;
      }
      return value;
    };
    const sentence = sentences[sentenceId];
    const { form, hint, explanation, ...feedback } = sentence;
    const suffix = form ? ` (${form})` : '';
    const prompts = {
      'meaning-choice': 'Choose the meaning of this sentence.',
      'pattern-choice': `Choose the Japanese sentence: ${sentence.meaning}${suffix}`,
      gap: `${blanks ? 'Fill every particle blank' : 'Fill the gap'}: ${sentence.meaning}${suffix}`,
      tiles: `Build the Japanese sentence: ${sentence.meaning}${suffix}`,
      typing: `Write in Japanese: ${sentence.meaning}${suffix}`,
    };
    const type = overrides.type;
    requireValue(!blanks || type === 'gap', `${location}: particle blanks require type gap`);
    if (blanks) requireValue(Array.isArray(blanks), `${location}: blanks must be a list`);
    const generated = blanks ? particleFields(sentence, blanks, location) : {};
    const fullAnswers =
      type === 'typing' || type === 'tiles' ? [sentence.text, sentence.reading] : undefined;
    const tiles =
      type === 'tiles'
        ? (sentence.tiles ?? sentence.tokens)?.map((t) => ({
            text: t.text,
            reading: t.reading ?? t.text,
          }))
        : undefined;
    const question = {
      prompt: prompts[type],
      ...(hint !== undefined ? { hint } : {}),
      ...(explanation !== undefined ? { explanation } : {}),
      ...(fullAnswers ? { answers: fullAnswers } : {}),
      ...(tiles ? { tiles } : {}),
      ...(type === 'meaning-choice' ? { context: feedback } : {}),
      feedback,
      ...generated,
      ...overrides,
      ...(overrides.context ? { context: resolveReading(overrides.context) } : {}),
      ...(overrides.choices ? { choices: overrides.choices.map(resolveReading) } : {}),
    } as GuidedExercise;
    for (const key of ['prompt', 'hint', 'explanation'] as const)
      requireValue(isText(question[key]), `${location}: missing ${key}`);
    requireValue(stringList(question.answers), `${location}: missing accepted answers`);
    requireValue(
      question.feedback && isText(question.feedback.text) && isText(question.feedback.reading),
      `${location}: feedback needs text and reading`,
    );
    if (question.context)
      requireValue(
        isText(question.context.text) && typeof question.context.reading === 'string',
        `${location}: context needs text and reading`,
      );
    if (type.endsWith('choice'))
      requireValue(
        question.choices &&
          question.choices.length >= 2 &&
          question.choices.every((c) => isText(c.text) && typeof c.reading === 'string'),
        `${location}: choices need text and reading`,
      );
    if (type === 'tiles')
      requireValue(question.tiles?.length, `${location}: sentence-building questions need tiles`);
    if (type === 'gap')
      requireValue(
        question.context || question.particleSegments?.length,
        `${location}: gap needs context or particle blanks`,
      );
    if (question.particleSegments) {
      const count = question.particleSegments.length - 1;
      requireValue(
        count > 0 && question.answers.every((a) => a.split('|').length === count),
        `${location}: answer and blank counts differ`,
      );
    }
    return question;
  });
  return { ...entry, exercises: compiled };
}

export function compileGrammar(root = resolve('content/grammar')): Entry[] {
  const index = parseYaml(readFileSync(join(root, 'index.yaml'), 'utf8'), 'index.yaml');
  requireValue(stringList(index), 'content/grammar/index.yaml: expected topic filenames');
  requireValue(
    new Set(index).size === index.length,
    'content/grammar/index.yaml: duplicate filenames',
  );
  requireValue(
    index.every((name) => /^[a-z0-9-]+\.yaml$/.test(name) && name !== 'index.yaml'),
    'index.yaml: topic filenames must be local .yaml files',
  );
  const files = readdirSync(root).filter((name) => name.endsWith('.yaml') && name !== 'index.yaml');
  requireValue(
    files.every((name) => index.includes(name)),
    'index.yaml: unlisted topic YAML file',
  );
  const entries = index.map((file) => {
    try {
      return compileTopic(
        parseYaml(readFileSync(join(root, file), 'utf8'), file) as GrammarSource,
        file,
      );
    } catch (error) {
      throw new Error(`${file}: ${(error as Error).message}`);
    }
  });
  requireValue(
    new Set(entries.map((e) => e.id)).size === entries.length,
    'index.yaml: duplicate topic IDs',
  );
  return entries;
}

export function generateGrammar(
  check = false,
  root = resolve('content/grammar'),
  output = resolve('public/grammar.json'),
) {
  const entries = compileGrammar(root);
  const text = JSON.stringify(entries, null, 2) + '\n';
  let current = '';
  try {
    current = readFileSync(output, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  // Object key order is not part of the runtime data contract; avoid migration-only output churn.
  const unchanged = !!current && isDeepStrictEqual(JSON.parse(current), entries);
  if (check) requireValue(unchanged, 'public/grammar.json is stale. Run npm run content:build.');
  else if (!unchanged) {
    const temporary = output + '.tmp';
    writeFileSync(temporary, text);
    renameSync(temporary, output);
  }
  return entries;
}
