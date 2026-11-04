import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  convertNumber,
  numberInRange,
  parseNumberInput,
  maximumNumber,
} from '../app/lib/number-converter.ts';

test('number converter handles zero, irregular sounds and Japanese large-number groups', () => {
  for (const [value, kanji, hiragana] of [
    [0, '零', 'れい'],
    [10, '十', 'じゅう'],
    [14, '十四', 'じゅうよん'],
    [300, '三百', 'さんびゃく'],
    [600, '六百', 'ろっぴゃく'],
    [800, '八百', 'はっぴゃく'],
    [3000, '三千', 'さんぜん'],
    [8000, '八千', 'はっせん'],
    [10000, '一万', 'いちまん'],
    [10001, '一万一', 'いちまんいち'],
    [123456, '十二万三千四百五十六', 'じゅうにまんさんぜんよんひゃくごじゅうろく'],
    [100000000, '一億', 'いちおく'],
    [100010001, '一億一万一', 'いちおくいちまんいち'],
  ] as const)
    assert.deepEqual(convertNumber(value), { kanji, hiragana });
  assert.match(convertNumber(maximumNumber).hiragana, /^[ぁ-ゖ]+$/);
  for (const value of [-1, 1.5, NaN, Infinity, maximumNumber + 1])
    assert.throws(() => convertNumber(value));
});

test('practice range includes both bounds, single values and rejects invalid input', () => {
  assert.equal(
    numberInRange(12, 25, () => 0),
    12,
  );
  assert.equal(
    numberInRange(12, 25, () => 0.999999),
    25,
  );
  assert.equal(numberInRange(9, 9), 9);
  assert.equal(
    numberInRange(0, maximumNumber, () => 0.9999999999999999),
    maximumNumber,
  );
  assert.throws(() => numberInRange(5, 4));
  assert.equal(parseNumberInput('0012'), 12);
  for (const value of ['', ' ', '-1', '1.2', '1e3', '1,000', 'abc', String(maximumNumber + 1)])
    assert.throws(() => parseNumberInput(value));
});
