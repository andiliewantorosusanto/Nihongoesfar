import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entries } from '../app/lib/content/content.ts';
import { verbExercises } from '../app/lib/practice/verb-practice.ts';
import { makePractice, practiceRound, skillsFor } from '../app/lib/practice/learning.ts';
import { staticResult } from '../app/lib/api/static-api.ts';

const verb = (word: string) => entries.find((e) => e.kind === 'vocabulary' && e.japanese === word)!;

test('verb transformation covers groups, irregulars, all target forms and accepted scripts', () => {
  for (const [word, target, kanji, kana, romaji] of [
    ['言う', 'Casual negative', '言わない', 'いわない', 'iwanai'],
    ['言う', 'て-form', '言って', 'いって', 'itte'],
    ['行く', 'Casual past', '行った', 'いった', 'itta'],
    ['帰る', 'Casual negative', '帰らない', 'かえらない', 'kaeranai'],
    ['食べる', 'て-form', '食べて', 'たべて', 'tabete'],
    ['来る', 'Casual negative', '来ない', 'こない', 'konai'],
    ['勉強する', 'Polite past', '勉強しました', 'べんきょうしました', 'benkyoushimashita'],
    ['飲む', 'Casual past negative', '飲まなかった', 'のまなかった', 'nomanakatta'],
    ['歯を磨く', 'て-form', '歯を磨いて', 'はをみがいて', 'hawomigaite'],
  ]) {
    const entry = verb(word);
    const exercise = verbExercises(entry).find((e) => e.id === target)!;
    assert.equal(exercise.feedback.text, kanji);
    assert.equal(exercise.feedback.reading, kana);
    assert.ok(exercise.explanation.includes('→'));
    for (const answer of [kanji, kana, romaji.toUpperCase()]) {
      assert.equal(
        staticResult(entries, 'check', {
          entryId: entry.id,
          skill: 'conjugation',
          word: target,
          answer,
        }).correct,
        true,
        `${word}: ${answer}`,
      );
    }
  }
  assert.equal(verbExercises(verb('水')).length, 0);
  assert.equal(skillsFor(verb('水'), false).includes('conjugation'), false);
  assert.equal(verbExercises(verb('言う')).length, 8);
  assert.equal(
    staticResult(entries, 'check', {
      entryId: verb('言う').id,
      skill: 'conjugation',
      word: 'Casual negative',
      answer: 'いあない',
    }).correct,
    false,
  );
});

test('verb rounds preserve vocabulary filters, target selection and endless mode', () => {
  const queue = staticResult(entries, 'practice', {
    kind: 'vocabulary',
    skill: 'conjugation',
    topic: verb('言う').topic,
  }).queue!;
  assert.ok(queue.length > 0 && queue.length <= 12);
  for (const q of queue) {
    assert.equal(q.skill, 'conjugation');
    assert.equal(entries.find((e) => e.id === q.entryId)!.topic, verb('言う').topic);
  }
  const te = makePractice([verb('言う'), verb('来る')], [], {
    skill: 'conjugation',
    verbTarget: 'て-form',
  });
  assert.equal(te.length, 2);
  assert.ok(te.every((q) => q.word === 'て-form'));
  const repeat = practiceRound(entries, queue, 'all', queue[0].id);
  assert.ok(repeat.length > 0);
  assert.ok(repeat.every((q) => q.skill === 'conjugation'));
  assert.equal(makePractice([verb('水')], [], { skill: 'conjugation' }).length, 0);
});
