import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entries } from '../app/lib/content.ts';
import { makePractice, answerFor, grade, promptFor } from '../app/lib/learning.ts';
import strokes from '../app/lib/strokes.json' with { type: 'json' };
test('every starter kanji has varied, real compounds rather than one repeated example', () => {
  const kanji = entries.filter((e) => e.kind === 'kanji');
  assert.equal(kanji.length, 100);
  assert.ok(kanji.some((e) => e.compounds!.length > 20));
  assert.ok(kanji.reduce((n, e) => n + (e.compounds?.length || 0), 0) >= 600);
  for (const e of kanji) {
    assert.ok(e.compounds!.length >= 3, e.japanese);
    assert.equal(
      new Set(e.compounds!.map((c) => c.japanese + ':' + c.reading)).size,
      e.compounds!.length,
      e.japanese,
    );
    for (const c of e.compounds!) {
      assert.ok(c.japanese.includes(e.japanese));
      assert.ok((c.japanese.match(/[一-龯]/g) || []).length >= 2);
      assert.ok(c.reading);
      assert.ok(c.meaning);
    }
  }
  const fire = kanji.find((e) => e.japanese === '火')!;
  for (const [word, reading] of [
    ['火山', 'かざん'],
    ['火事', 'かじ'],
    ['花火', 'はなび'],
    ['消火', 'しょうか'],
    ['火災', 'かさい'],
  ])
    assert.ok(
      fire.compounds?.some((c) => c.japanese === word && c.reading === reading),
      word,
    );
});
test('compound reading questions display and grade the actual chosen word', () => {
  const fire = entries.find((e) => e.japanese === '火' && e.kind === 'kanji')!;
  const q = makePractice(entries, Object.keys(strokes), { entryId: fire.id, word: '火山' });
  assert.equal(q.length, 1);
  assert.equal(q[0].skill, 'reading');
  assert.equal(q[0].word, '火山');
  assert.equal(promptFor(fire, 'reading', '火山'), 'How do you read 火山?');
  assert.deepEqual(answerFor(fire, 'reading', '火山'), ['かざん']);
  assert.ok(grade(fire, 'reading', 'カザン', '火山'));
  assert.equal(grade(fire, 'reading', 'かようび', '火山'), false);
  const mixed = makePractice(entries, Object.keys(strokes), { entryId: fire.id });
  assert.ok(mixed.some((q) => q.skill === 'writing'));
  assert.ok(mixed.some((q) => q.skill === 'meaning'));
  assert.ok(mixed.some((q) => q.word));
});

test('dictionary selection keeps irregular readings and separates same-spelling senses', () => {
  const fire = entries.find((e) => e.kind === 'kanji' && e.japanese === '火')!;
  assert.ok(fire.compounds?.some((c) => c.japanese === '火傷' && c.reading === 'やけど'));
  assert.ok(
    fire.compounds?.some(
      (c) => c.japanese === '火口' && c.reading === 'かこう' && c.meaning.includes('crater'),
    ),
  );
  const person = entries.find((e) => e.kind === 'kanji' && e.japanese === '人')!;
  assert.ok(person.compounds?.some((c) => c.japanese === '大人' && c.reading === 'おとな'));
  const one = entries.find((e) => e.kind === 'kanji' && e.japanese === '一')!;
  assert.ok(!one.compounds?.some((c) => c.japanese === '十一日'));
  assert.ok(
    one.compounds?.some(
      (c) =>
        c.japanese === '一日' &&
        c.reading === 'ついたち' &&
        c.meaning.includes('first day of the month'),
    ),
  );
});

test('static kanji library includes every exported dictionary compound', () => {
  const published = JSON.parse(readFileSync('public/kanji.json', 'utf8'));
  for (const entry of entries.filter((entry) => entry.kind === 'kanji')) {
    const saved = published.find((item: any) => item.id === entry.id);
    assert.ok(saved, entry.id);
    const words = new Set(saved.compounds.map((word: any) => word.japanese + ':' + word.reading));
    for (const word of entry.compounds!)
      assert.ok(words.has(word.japanese + ':' + word.reading), word.japanese);
  }
});
