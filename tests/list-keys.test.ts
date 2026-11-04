import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyed } from '../app/lib/ui/list-keys.ts';

test('list keys distinguish repeated tokens and survive unrelated reordering', () => {
  const original = keyed(['は', '私', 'は']);
  assert.equal(new Set(original.map(({ key }) => key)).size, original.length);
  assert.deepEqual(
    original.map(({ value }) => value),
    ['は', '私', 'は'],
  );
  const reordered = keyed(['私', 'は', 'は']);
  assert.equal(original[1].key, reordered[0].key);
  assert.equal(original[0].key, reordered[1].key);
  assert.equal(original[2].key, reordered[2].key);
});
