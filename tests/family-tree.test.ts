import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entries } from '../app/lib/content/content.ts';
import { familyTreeWord, familySiblingPositions } from '../app/lib/guides/family-tree.ts';
const family = entries.find((e) => e.id === 'study-family')!;
test('family tree uses the stored own-family and polite-family words with kana and romaji', () => {
  for (const row of family.references![0].rows)
    for (const mode of ['own', 'other'] as const) {
      const term = familyTreeWord(family, row[0].text, mode)!;
      const cell = row[mode === 'own' ? 1 : 2];
      assert.equal(term.text, cell.text);
      assert.equal(term.reading, cell.reading);
      assert.ok(term.romaji, row[0].text + '/' + mode);
    }
  assert.deepEqual(familyTreeWord(family, 'father', 'own'), {
    relationship: 'father',
    text: '父',
    reading: 'ちち',
    romaji: 'chichi',
  });
  assert.deepEqual(familyTreeWord(family, 'father', 'other'), {
    relationship: 'father',
    text: 'お父さん',
    reading: 'おとうさん',
    romaji: 'otousan',
  });
  assert.equal(familyTreeWord(family, 'older brother', 'other')!.romaji, 'oniisan');
  assert.equal(familyTreeWord(family, 'grandfather', 'other')!.romaji, 'ojiisan');
  assert.equal(familyTreeWord(family, 'grandmother', 'other')!.romaji, 'obaasan');
  assert.deepEqual(familySiblingPositions, [
    'older brother',
    'older sister',
    'you',
    'spouse',
    'younger brother',
    'younger sister',
  ]);
});
test('family tree preserves saved vocabulary edits and does not invent missing readings or relationships', () => {
  const edited = structuredClone(family);
  edited.references![0].rows[0][1] = { text: 'My custom spelling', reading: 'custom reading' };
  const term = familyTreeWord(edited, 'father', 'own')!;
  assert.equal(term.text, 'My custom spelling');
  assert.equal(term.reading, 'custom reading');
  assert.equal(term.romaji, undefined);
  assert.equal(familyTreeWord(family, 'unknown relative', 'own'), undefined);
  assert.equal(familyTreeWord({ ...family, references: undefined }, 'father', 'own'), undefined);
});
