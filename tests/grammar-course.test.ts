import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entries } from '../app/lib/content.ts';
import {
  makePractice,
  answerFor,
  grade,
  withAlternate,
  normalize,
  isReadingQuestion,
} from '../app/lib/learning.ts';
import { rubyParts, proseReadings } from '../app/lib/sentence-support.ts';
const lessons = entries.filter((e) => e.lesson).sort((a, b) => a.lesson!.order - b.lesson!.order);
test('all 30 grammar lessons have an ordered path, meaningful examples and 56 fully readable exercises', () => {
  assert.equal(lessons.length, 30);
  assert.deepEqual(
    lessons.map((e) => e.lesson!.order),
    Array.from({ length: 30 }, (_, i) => i + 1),
  );
  assert.deepEqual(
    [...new Set(lessons.map((e) => e.lesson!.group))],
    [
      'Sentence basics',
      'Polite verbs and particles',
      'Existence and location',
      'Negatives and past',
      'Descriptions and preferences',
      'Requests and ongoing actions',
      'Connecting descriptions and actions',
      'Passing places',
    ],
  );
  for (const e of lessons) {
    const l = e.lesson!;
    assert.ok(l.goal && l.recap && l.comparison, e.id);
    for (const id of l.prerequisites)
      assert.ok(
        lessons.some((p) => p.id === id && p.lesson!.order < l.order),
        e.id + ': prerequisite ' + id,
      );
    assert.equal(l.examples.length, 3);
    assert.equal(new Set(l.examples.map((x) => x.japanese)).size, 3);
    assert.equal(e.exercises!.length, 56);
    assert.equal(new Set(e.exercises!.map((x) => x.id)).size, 56);
    assert.deepEqual(
      e.exercises!.filter((x) => !x.alternate && !x.id.startsWith('extra-')).map((x) => x.type),
      ['meaning-choice', 'pattern-choice', 'gap', 'tiles', 'typing'],
    );
    assert.equal(e.exercises!.filter((x) => x.alternate).length, 1);
    assert.equal(new Set(e.exercises!.map((x) => x.prompt)).size, 56);
    for (const v of l.vocabulary) assert.ok(v.meaning && v.reading, v.text);
    for (const x of e.exercises!) {
      assert.ok(x.hint && x.explanation && x.feedback.reading, x.id);
      for (const part of [x.context, x.feedback, ...(x.choices || []), ...(x.tiles || [])].filter(
        Boolean,
      )) {
        assert.ok(!/[一-龯々]/.test(part!.text) || part!.reading, `${e.id}/${x.id}: ${part!.text}`);
        assert.equal(
          rubyParts(part!.text, part!.reading)
            .map((p) => p.text)
            .join(''),
          part!.text,
        );
      }
      for (const answer of x.answers)
        assert.equal(grade(e, 'grammar', answer, undefined, x.id), true);
      if (x.choices)
        assert.equal(
          x.choices.filter((c) => grade(e, 'grammar', c.text, undefined, x.id)).length,
          1,
        );
      if (x.tiles)
        assert.ok(grade(e, 'grammar', x.tiles.map((t) => t.text).join(''), undefined, x.id));
      if (x.type === 'typing')
        assert.ok(
          x.answers.some((a) => normalize(a) === normalize(x.feedback.reading)),
          e.id,
        );
    }
  }
});
test('guided practice preserves teaching order, mixed practice samples, and legacy exercises remain usable', () => {
  const e = lessons[0];
  const guided = makePractice(entries, [], { entryId: e.id, mode: 'guided' });
  assert.deepEqual(
    guided.slice(0, 5).map((q) => q.exerciseId),
    ['meaning', 'pattern', 'gap', 'tiles', 'typing'],
  );
  const mixed = makePractice(entries, [], { kind: 'grammar', mode: 'mixed' }, () => 0.25);
  assert.equal(mixed.length, 12);
  assert.ok(mixed.every((q) => q.exerciseId !== 'alternate'));
  const legacy = { ...e, id: 'custom-legacy', exercises: undefined, lesson: undefined };
  assert.equal(makePractice([legacy], [], { entryId: legacy.id, mode: 'guided' }).length, 1);
  assert.ok(grade(legacy, 'grammar', legacy.exercise!.answers[0]));
  assert.deepEqual(answerFor(e, 'grammar', undefined, 'missing'), []);
  const retry = withAlternate(guided, e);
  assert.equal(retry.length, 56);
  assert.equal(withAlternate(retry, e).length, 56);
});
test('authored particle contrasts and kana alternatives grade the intended pattern', () => {
  const de = lessons.find((e) => e.id === 'grammar-de')!;
  assert.ok(grade(de, 'grammar', 'で', undefined, 'gap'));
  assert.equal(grade(de, 'grammar', 'に', undefined, 'gap'), false);
  const destination = lessons.find((e) => e.id === 'grammar-destination')!;
  assert.ok(grade(destination, 'grammar', 'にほんへいきます', undefined, 'alternate'));
  assert.equal(grade(destination, 'grammar', 'へほんにいきます', undefined, 'alternate'), false);
  const negative = lessons.find((e) => e.id === 'grammar-noun-negative')!;
  assert.ok(grade(negative, 'grammar', 'たなかさんは学生ではありません', undefined, 'typing'));
  const suki = lessons.find((e) => e.id === 'grammar-suki')!;
  assert.ok(grade(suki, 'grammar', 'が', undefined, 'gap'));
  assert.equal(grade(suki, 'grammar', 'を', undefined, 'gap'), false);
});

test('grammar explanations carry readings for Japanese examples inside English prose', () => {
  for (const e of lessons)
    for (const value of [e.note, e.lesson!.comparison]) {
      const parts = proseReadings(value);
      assert.equal(parts.map((p) => p.text).join(''), value);
      for (const p of parts)
        assert.ok(!/[一-龯々]/.test(p.text) || p.reading, `${e.id}: ${p.text}`);
    }
});

test('legacy number pronunciation exercises retain reading-question safeguards', () => {
  const number = entries.find((e) => e.kind === 'numbers')!;
  const adjective = entries.find((e) => e.kind === 'adjectives')!;
  assert.equal(isReadingQuestion(number, 'grammar'), true);
  assert.equal(isReadingQuestion(adjective, 'grammar'), false);
  assert.equal(isReadingQuestion(lessons[0], 'grammar'), false);
  assert.equal(isReadingQuestion(adjective, 'reading'), true);
});

test('every guided example and Japanese practice sentence has matching role colors and translations', () => {
  for (const e of lessons) {
    for (const ex of e.lesson!.examples) {
      assert.equal(ex.tokens!.map((t) => t.text).join('') + '。', ex.japanese, e.id);
      assert.equal(ex.tokens!.map((t) => t.reading).join('') + '。', ex.reading, e.id);
      assert.equal(ex.translationTokens!.map((t) => t.text).join(''), ex.meaning, e.id);
      const roles = new Set(ex.tokens!.map((t) => t.role));
      for (const t of ex.translationTokens!)
        assert.ok(t.implicit || roles.has(t.role), e.id + ': ' + t.text);
    }
    for (const x of e.exercises!) {
      for (const value of [
        x.context,
        x.feedback,
        ...(x.type === 'pattern-choice' ? x.choices || [] : []),
      ].filter(Boolean)) {
        assert.ok(value!.tokens?.length, e.id + '/' + x.id);
        assert.equal(
          value!.tokens!.map((t) => t.text).join('') + '。',
          value!.text,
          e.id + '/' + x.id,
        );
      }
      for (const tile of x.tiles || []) assert.ok(tile.role, e.id + '/' + x.id);
    }
  }
  const e = lessons.find((e) => e.id === 'grammar-existence-negative')!;
  assert.deepEqual(
    e.lesson!.examples[0].tokens!.map((t) => [t.text, t.role]),
    [
      ['本', 'subject'],
      ['が', 'particle'],
      ['ありません', 'predicate'],
    ],
  );
  assert.deepEqual(
    e.lesson!.examples[0].translationTokens!.map((t) => [t.text, t.role]),
    [
      ['There is no ', 'predicate'],
      ['book.', 'subject'],
    ],
  );
});
