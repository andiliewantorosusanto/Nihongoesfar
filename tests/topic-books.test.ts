import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entries } from '../app/lib/content/content.ts';
import { topicBooks, topicBookFor, topicBookEntries } from '../app/lib/guides/topic-books.ts';
import { makePractice } from '../app/lib/practice/learning.ts';

test('topic books open all their saved guides in order and keep practice scoped to each topic', () => {
  for (const [book, ids] of Object.entries(topicBooks)) {
    const guides = topicBookEntries(entries, book);
    assert.deepEqual(
      guides.map((e) => e.id),
      ids,
    );
    for (const guide of guides) {
      assert.equal(topicBookFor(guide.id), book);
      assert.ok(guide.references?.length);
      const queue = makePractice(entries, [], { entryId: guide.id, mode: 'guided' });
      assert.equal(queue.length, 5);
      assert.ok(queue.every((q) => q.entryId === guide.id));
    }
  }
  const edited = {
    ...entries.find((e) => e.id === 'study-months')!,
    note: 'Owner-edited explanation',
  };
  assert.equal(topicBookEntries([edited], 'calendar')[0], edited);
  assert.equal(topicBookFor('custom-entry'), undefined);
  assert.deepEqual(topicBookEntries(entries, 'unknown'), []);
});
