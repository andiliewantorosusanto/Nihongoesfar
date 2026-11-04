import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entries } from '../app/lib/content.ts';
import { makePractice, grade, normalize, skillsFor, entryInBook } from '../app/lib/learning.ts';
import { checkStroke } from '../app/lib/stroke-check.ts';
import strokes from '../app/lib/strokes.json' with { type: 'json' };
test('starter library is complete, linked, and has distinct grammar concepts', () => {
  assert.equal(new Set(entries.map((e) => e.id)).size, entries.length);
  for (const kind of ['kana', 'grammar', 'kanji', 'vocabulary', 'numbers', 'adjectives'])
    assert.ok(entries.some((e) => e.kind === kind));
  assert.equal(entries.filter((e) => e.kind === 'kanji').length, 100);
  assert.equal(entries.filter((e) => e.lesson).length, 30);
  assert.ok(entries.filter((e) => e.kind === 'grammar').length >= 25);
  assert.ok(entries.filter((e) => e.kind === 'vocabulary').length >= 200);
  for (const e of entries) {
    assert.ok(e.examples.length, e.id);
    assert.ok(e.reading, e.id);
    if (e.exercise) {
      assert.ok(e.exercise.answers.length, e.id);
      for (const a of e.exercise.answers) assert.ok(grade(e, 'grammar', a), e.id);
    }
  }
  for (const e of entries.filter((e) => e.kind === 'grammar'))
    assert.ok(e.examples[0].tokens?.every((t) => t.role && t.wordClass));
  const basic = entries.filter((e) => e.kind === 'kana' && e.tags.includes('Basic kana'));
  assert.equal(basic.length, 92);
  for (const e of [...basic, ...entries.filter((e) => e.kind === 'kanji')])
    assert.ok(e.japanese in strokes, 'Missing stroke data: ' + e.japanese);
});
test('practice starts immediately without study selections and supports book, skill, entry, and notes filters', () => {
  const grammar = makePractice(entries, Object.keys(strokes), { kind: 'grammar' });
  assert.equal(grammar.length, 12);
  for (const q of grammar) {
    assert.equal(q.skill, 'grammar');
    assert.equal(entries.find((e) => e.id === q.entryId)!.kind, 'grammar');
  }
  const kanji = entries.find((e) => e.kind === 'kanji')!;
  const single = makePractice(entries, Object.keys(strokes), { entryId: kanji.id });
  assert.ok(single.some((q) => q.skill === 'writing'));
  assert.ok(single.some((q) => q.skill === 'reading'));
  assert.ok(single.every((q) => q.entryId === kanji.id));
  const writing = makePractice(entries, Object.keys(strokes), { kind: 'kanji', skill: 'writing' });
  assert.equal(writing.length, 12);
  assert.ok(writing.every((q) => q.skill === 'writing'));
  assert.equal(
    makePractice(entries, Object.keys(strokes), { kind: 'grammar', skill: 'writing' }).length,
    0,
  );
  const note = {
    ...kanji,
    id: 'custom-note',
    kind: 'grammar' as const,
    exercise: undefined,
    exercises: undefined,
    lesson: undefined,
  };
  assert.equal(skillsFor(note, false).length, 0);
  assert.equal(makePractice([...entries, note], Object.keys(strokes), { kind: 'notes' }).length, 0);
  const word = { ...kanji, id: 'custom-word', kind: 'vocabulary' as const };
  assert.ok(
    makePractice([...entries, word], Object.keys(strokes), { kind: 'notes' }).every(
      (q) => q.entryId === word.id,
    ),
  );
});
test('Japanese answer normalization supports kana, IME width, spacing, punctuation', () => {
  assert.equal(normalize('ワタシ は 学生です。'), normalize('わたしは学生です'));
  assert.equal(normalize('ﾆﾎﾝ'), normalize('にほん'));
  const e = entries.find((e) => e.kind === 'grammar')!;
  assert.ok(grade(e, 'grammar', e.exercise!.answers[0]));
  assert.equal(grade(e, 'grammar', 'incorrect'), false);
});
test('guided strokes accept approximate shapes and reject reversed, displaced, or missing strokes', () => {
  const line = Array.from({ length: 30 }, (_, i) => ({ x: 10 + i * 2, y: 40 + i * 0.2 }));
  assert.ok(checkStroke(line, line));
  assert.ok(
    checkStroke(
      line.map((p) => ({ x: p.x + 3, y: p.y - 2 })),
      line,
    ),
  );
  assert.equal(checkStroke([...line].reverse(), line), false);
  assert.equal(
    checkStroke(
      line.map((p) => ({ x: p.x, y: p.y + 35 })),
      line,
    ),
    false,
  );
  assert.equal(checkStroke([{ x: 10, y: 40 }], line), false);
});

test('numbers and time books keep their entries and practice separate', () => {
  const time = entries.filter((e) => entryInBook(e, 'time'));
  const numbers = entries.filter((e) => entryInBook(e, 'numbers'));
  assert.ok(time.some((e) => e.topic === 'Clock time'));
  assert.ok(time.some((e) => e.topic === 'Minutes'));
  assert.ok(numbers.some((e) => e.japanese === '二十'));
  assert.ok(numbers.some((e) => e.japanese === '百'));
  assert.ok(
    !numbers.some(
      (e) => time.includes(e) || ['Dates', 'Months', 'Weekdays', 'Durations'].includes(e.topic),
    ),
  );
  for (const kind of ['numbers', 'time']) {
    const queue = makePractice(entries, [], { kind });
    assert.ok(queue.length);
    for (const q of queue)
      assert.ok(
        entryInBook(
          entries.find((e) => e.id === q.entryId)!,
          kind,
        ),
      );
  }
});

test('polite family meanings accept the plain relationship', () => {
  const sister = { ...entries[0], meaning: 'someone else’s older sister (polite reference)' };
  assert.equal(grade(sister, 'meaning', 'older sister'), true);
  assert.equal(grade(sister, 'meaning', 'younger sister'), false);
  assert.equal(grade(sister, 'meaning', sister.meaning), true);
});

test('the year before last accepts two years ago', () => {
  const entry = { ...entries[0], japanese: '一昨年', meaning: 'the year before last' };
  for (const answer of ['2 years ago', 'two years ago', 'the year before last']) {
    assert.equal(grade(entry, 'meaning', answer), true);
  }
  assert.equal(grade(entry, 'meaning', 'last year'), false);
});

test('time vocabulary accepts equivalent English and numeric forms', () => {
  const cases = [
    ['the day before yesterday', '2 days ago'],
    ['the day after tomorrow', 'in two days'],
    ['the week before last', 'two weeks ago'],
    ['the month after next', '2 months from now'],
    ['the year after next', 'in 2 years'],
    ['two hours', '2 hours'],
    ['three o’clock', '3:00'],
    ['half past three', '3:30'],
    ['every week', 'weekly'],
  ];
  for (const [meaning, answer] of cases) {
    assert.equal(grade({ ...entries[0], meaning }, 'meaning', answer), true, meaning);
  }
  assert.equal(
    grade({ ...entries[0], meaning: 'the week before last' }, 'meaning', 'last week'),
    false,
  );
});
