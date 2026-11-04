import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entries } from '../app/lib/content/content.ts';
import { topicBooks } from '../app/lib/guides/topic-books.ts';
import { tenseTopicFor } from '../app/lib/guides/tense-topics.ts';
import practiceSources from '../public/guides/practice-sources.json' with { type: 'json' };

test('guide topic mappings reference published entries without duplicate book members', () => {
  const ids = new Set(entries.map((entry) => entry.id));
  for (const [book, members] of Object.entries(topicBooks)) {
    assert.ok(members.length, book);
    assert.equal(new Set(members).size, members.length, book);
    for (const id of members) assert.ok(ids.has(id), `${book}: ${id}`);
  }
  for (const [source, target] of Object.entries(tenseTopicFor)) {
    assert.ok(ids.has(source), source);
    assert.ok(ids.has(target), target);
    assert.notEqual(source, target);
  }
  for (const [target, sources] of Object.entries(practiceSources)) {
    assert.ok(ids.has(target), target);
    assert.equal(new Set(sources).size, sources.length, target);
    for (const source of sources) {
      assert.notEqual(source, target);
      assert.ok(entries.find((entry) => entry.id === source)?.exercises?.length, source);
    }
  }
});
