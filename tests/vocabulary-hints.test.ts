import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entries } from '../app/lib/content/content.ts';
import { vocabularyHints } from '../app/lib/practice/vocabulary-hints.ts';

test('typing hints reveal umbrella and kana without revealing the negative predicate', () => {
  const exercise = entries
    .flatMap((entry) => entry.exercises ?? [])
    .find(
      (exercise) =>
        exercise.type === 'typing' &&
        exercise.prompt === 'Write in Japanese: There is no umbrella.',
    );
  assert.ok(exercise);
  assert.deepEqual(vocabularyHints(exercise), [
    { text: '傘', reading: 'かさ', meaning: 'umbrella' },
  ]);
  assert.deepEqual(vocabularyHints({ ...exercise, type: 'gap' }), []);
  assert.deepEqual(vocabularyHints(undefined), []);
  assert.deepEqual(
    vocabularyHints({
      ...exercise,
      feedback: { text: '傘がありません', reading: 'かさがありません' },
    }),
    [],
  );
});
