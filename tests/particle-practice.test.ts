import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entries } from '../app/lib/content/content.ts';
import { grade, makePractice, practiceRound } from '../app/lib/practice/learning.ts';

const entry = entries.find((e) => e.id === 'study-particle-fill')!;
test('particle bank has distinct readable sentences, ordered blanks and strict grading', () => {
  assert.equal(entry.exercises!.length, 72);
  assert.equal(new Set(entry.exercises!.map((q) => q.feedback.text)).size, 72);
  let blanks = 0;
  for (const q of entry.exercises!) {
    const segments = q.particleSegments!;
    const parts = q.answers[0].split('|');
    blanks += parts.length;
    assert.ok(parts.length >= 2 && parts.length <= 4);
    assert.equal(segments.length, parts.length + 1);
    assert.equal(segments.map((s, i) => s.text + (parts[i] || '')).join(''), q.feedback.text);
    assert.equal(segments.map((s, i) => s.reading + (parts[i] || '')).join(''), q.feedback.reading);
    for (const answer of q.answers) assert.ok(grade(entry, 'grammar', answer, undefined, q.id));
    assert.equal(grade(entry, 'grammar', parts.slice(1).join('|'), undefined, q.id), false);
    assert.equal(grade(entry, 'grammar', parts.map(() => 'を').join('|'), undefined, q.id), false);
    for (let i = 1; i <= parts.length; i++) assert.ok(q.explanation.includes(`Blank ${i}:`));
  }
  assert.equal(blanks, 210);
  const destination = entry.exercises!.find((q) => q.answers.includes('は|に'))!;
  assert.ok(grade(entry, 'grammar', 'は|へ', undefined, destination.id));
});

test('particle practice opens five different drills and continues in endless rounds', () => {
  const queue = makePractice(entries, [], { entryId: entry.id, mode: 'guided' }, () => 0.5);
  assert.equal(queue.length, 5);
  assert.equal(new Set(queue.map((q) => q.id)).size, 5);
  const next = practiceRound(entries, queue, 'gap', queue.at(-1)!.id, () => 0.5);
  assert.equal(next.length, 12);
  assert.ok(next.every((q) => q.entryId === entry.id));
});
