import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entries } from '../app/lib/content.ts';
import { rubyParts } from '../app/lib/sentence-support.ts';
test('all grammar examples have aligned readings and exact natural English translations', () => {
  for (const e of entries.filter((e) => e.kind === 'grammar')) {
    const ex = e.examples[0];
    assert.equal(ex.tokens!.map((t) => t.reading).join('') + '。', ex.reading, e.id);
    assert.equal(ex.translationTokens!.map((t) => t.text).join(''), ex.meaning, e.id);
    const roles = new Set(ex.tokens!.map((t) => t.role));
    for (const t of ex.translationTokens!) assert.ok(t.implicit || roles.has(t.role), e.id);
  }
  const ex = entries.find((e) => e.id === 'grammar-de')!.examples[0];
  assert.equal(ex.tokens![0].reading, 'としょかんで');
  assert.equal(ex.translationTokens!.find((t) => t.text.includes('library'))!.role, 'modifier');
  assert.equal(ex.translationTokens!.find((t) => t.text === 'study')!.role, 'predicate');
  assert.equal(ex.translationTokens![0].implicit, true);
});
test('furigana attaches only to kanji, keeping particles and okurigana separate', () => {
  assert.deepEqual(rubyParts('図書館で', 'としょかんで'), [
    { text: '図書館', reading: 'としょかん' },
    { text: 'で' },
  ]);
  assert.deepEqual(rubyParts('勉強します', 'べんきょうします'), [
    { text: '勉強', reading: 'べんきょう' },
    { text: 'します' },
  ]);
  assert.deepEqual(rubyParts('この本は面白いです。', 'このほんはおもしろいです。'), [
    { text: 'この' },
    { text: '本', reading: 'ほん' },
    { text: 'は' },
    { text: '面白', reading: 'おもしろ' },
    { text: 'いです。' },
  ]);
  assert.deepEqual(rubyParts('これ', 'これ'), [{ text: 'これ' }]);
  for (const e of entries)
    for (const ex of e.examples) {
      const parts = rubyParts(ex.japanese, ex.reading);
      assert.equal(parts.map((p) => p.text).join(''), ex.japanese);
    }
});
