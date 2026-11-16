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

test('verb ending guides match generated forms for every group 1 ending', () => {
  const sample = entries.find((e) => e.japanese === '飲む' && e.kind === 'vocabulary')!;
  for (const [japanese, reading] of [
    ['買う', 'かう'],
    ['書く', 'かく'],
    ['泳ぐ', 'およぐ'],
    ['話す', 'はなす'],
    ['待つ', 'まつ'],
    ['死ぬ', 'しぬ'],
    ['遊ぶ', 'あそぶ'],
    ['飲む', 'のむ'],
    ['帰る', 'かえる'],
  ]) {
    const forms = wordForms({ ...sample, japanese, reading })!;
    assert.equal(forms.group, 'Group 1 · う-verb');
    assert.equal(forms.note, undefined);
    const ending = japanese.slice(-1);
    const base = japanese.slice(0, -1);
    const rule = forms.guides![0].rows.find((row) => row[0].text.startsWith(ending))!;
    const expected = [
      base + rule[1].text.split(' ')[0] + 'ます',
      base + rule[2].text.split(' ')[0] + 'ない',
      base + rule[3].text,
      base + rule[4].text,
    ];
    for (const form of expected)
      assert.ok(
        forms.table.rows.some((row) => row[1].text === form),
        form,
      );
  }
  assert.equal(get('泳ぐ').guides![0].rows[2][1].text, 'ぎ (gi)');
  assert.ok(get('行く').guides![1].rows.some((row) => row[1].text.includes('行って / 行った')));
});

test('other verb groups have their own guides while adjective notes stay available', () => {
  assert.match(get('食べる').guides![0].heading, /drop the final る/);
  assert.match(get('勉強する').guides![0].heading, /する/);
  assert.match(get('来る').guides![0].rows[2][1].text, /こない/);
  assert.ok(get('いい').note);
  assert.equal(get('いい').guides, undefined);
});
