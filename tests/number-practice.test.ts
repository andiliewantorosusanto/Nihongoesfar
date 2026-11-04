import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  numberPracticeQuestion,
  type NumberPracticeMode,
} from '../app/lib/guides/number-practice.ts';

test('all number practice modes use the inclusive range and reject reversed bounds', () => {
  for (const mode of ['mixed', 'reading', 'meaning', 'grammar'] as NumberPracticeMode[]) {
    const lower = numberPracticeQuestion(300, 600, mode, () => 0);
    const upper = numberPracticeQuestion(300, 600, mode, () => 0.999999);
    assert.match(lower.prompt, /三百|300/);
    assert.match(upper.prompt, /六百|600/);
    assert.throws(() => numberPracticeQuestion(600, 300, mode));
  }
});

test('selected skill controls prompts and expected answers, including sound changes', () => {
  assert.deepEqual(numberPracticeQuestion(300, 300, 'reading'), {
    prompt: 'Read 三百 in hiragana.',
    answers: ['さんびゃく'],
  });
  assert.deepEqual(numberPracticeQuestion(300, 300, 'meaning'), {
    prompt: 'Write 三百 as digits.',
    answers: ['300'],
  });
  assert.deepEqual(numberPracticeQuestion(300, 300, 'grammar'), {
    prompt: 'Write 300 in hiragana, including any sound changes.',
    answers: ['さんびゃく'],
  });
  for (const [index, skill] of ['reading', 'meaning', 'grammar'].entries()) {
    assert.deepEqual(
      numberPracticeQuestion(300, 300, 'mixed', () => (index + 0.1) / 3),
      numberPracticeQuestion(300, 300, skill as NumberPracticeMode),
    );
  }
});
