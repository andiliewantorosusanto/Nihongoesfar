import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entries } from '../app/lib/content/content.ts';
import { makePractice, practiceRound, grade } from '../app/lib/practice/learning.ts';

test('filtered and endless rounds stay in the lesson and respect the chosen type', () => {
  const initial = makePractice(entries, [], { entryId: 'study-particle-kara', mode: 'guided' });
  for (const type of ['meaning-choice', 'pattern-choice', 'gap', 'tiles', 'typing']) {
    const round = practiceRound(entries, initial, type, '', () => 0.5);
    assert.ok(round.length > 1, type);
    for (const q of round) {
      assert.equal(q.entryId, 'study-particle-kara');
      assert.equal(
        entries.find((e) => e.id === q.entryId)!.exercises!.find((e) => e.id === q.exerciseId)!
          .type,
        type,
      );
    }
    const next = practiceRound(entries, initial, type, round[0].id, () => 0.5);
    assert.notEqual(next[0].id, round[0].id);
  }
});

test('expanded grammar has distinct sentences and gradeable answers in every smaller topic', () => {
  const expanded = entries.filter((e) => e.exercises?.some((q) => q.id.startsWith('expanded-')));
  assert.equal(expanded.length, 28);
  for (const entry of expanded) {
    const added = entry.exercises!.filter((q) => q.id.startsWith('expanded-'));
    const original = new Set(
      entry.exercises!.filter((q) => !q.id.startsWith('expanded-')).map((q) => q.feedback.text),
    );
    for (const q of added) {
      assert.ok(!original.has(q.feedback.text), entry.id);
      for (const answer of q.answers)
        assert.ok(grade(entry, 'grammar', answer, undefined, q.id), `${entry.id}:${q.id}`);
      if (q.choices) {
        assert.equal(q.choices.length, 4);
        assert.equal(new Set(q.choices.map((c) => c.text)).size, 4);
      }
      if (q.type === 'tiles')
        assert.equal(q.tiles!.map((t) => t.text).join(''), q.feedback.text.replace(/。$/, ''));
    }
  }
});
