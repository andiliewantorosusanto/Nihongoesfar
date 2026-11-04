import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entries } from '../app/lib/content/content.ts';
import { wordForms } from '../app/lib/japanese/word-forms.ts';
const get = (word: string) =>
  wordForms(
    entries.find((e) => e.japanese === word && ['vocabulary', 'adjectives'].includes(e.kind))!,
  )!;
const jp = (word: string) => get(word).table.rows.map((r) => r[1].text);
test('word detail forms handle verb groups, exceptions and phrase prefixes', () => {
  assert.ok(jp('飲む').includes('飲んで'));
  assert.ok(jp('飲む').includes('飲みます'));
  assert.ok(jp('行く').includes('行って'));
  assert.ok(jp('帰る').includes('帰らない'));
  assert.ok(jp('食べる').includes('食べない'));
  assert.ok(jp('勉強する').includes('勉強しました'));
  assert.ok(jp('歯を磨く').includes('歯を磨いて'));
  const kuru = get('来る').table.rows;
  assert.equal(kuru[1][1].reading, 'きます');
  assert.equal(kuru[5][1].reading, 'こない');
  assert.ok(jp('いい').includes('よくない'));
  assert.ok(jp('きれい').includes('きれいじゃない'));
  assert.equal(
    wordForms(entries.find((e) => e.japanese === '水' && e.kind === 'vocabulary')!),
    undefined,
  );
});
