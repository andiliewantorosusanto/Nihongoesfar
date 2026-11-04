import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { entries } from '../app/lib/content/content.ts';

test('the JSON library is the complete content source with unique IDs and valid entry fields', () => {
  const manifest = JSON.parse(readFileSync('public/notebook.json', 'utf8'));
  const published = manifest.files.flatMap((file: string) => {
    const subject = JSON.parse(readFileSync('public' + file, 'utf8'));
    assert.ok(Array.isArray(subject), file);
    for (const entry of subject) assert.equal(entry.kind, file.slice(1, -5), entry.id);
    return subject;
  });
  assert.deepEqual(
    new Set(entries.map((entry) => entry.id)),
    new Set(published.map((entry: { id: string }) => entry.id)),
  );
  assert.equal(entries.length, published.length);
  assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length);
  for (const entry of entries) {
    assert.notEqual(entry.level, 'Beginner', `${entry.id}: beginner entries belong to N5`);
    for (const field of [
      'id',
      'kind',
      'title',
      'japanese',
      'reading',
      'meaning',
      'level',
      'topic',
      'note',
    ] as const)
      assert.equal(typeof entry[field], 'string', `${entry.id}: ${field}`);
    assert.ok(
      Array.isArray(entry.tags) && entry.tags.every((tag) => typeof tag === 'string'),
      entry.id,
    );
    assert.ok(Array.isArray(entry.examples), entry.id);
    for (const example of entry.examples)
      for (const field of ['japanese', 'reading', 'meaning'] as const)
        assert.equal(typeof example[field], 'string', `${entry.id}: example ${field}`);
  }
});
