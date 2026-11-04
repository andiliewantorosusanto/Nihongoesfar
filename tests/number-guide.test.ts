import { test } from 'node:test';
import assert from 'node:assert/strict';
import { numberGuide, hourGuide, minuteGuide } from '../app/lib/number-guide.ts';
test('number guide contrasts regular patterns with the important hundred and thousand sound changes', () => {
  assert.deepEqual(
    numberGuide.map((r) => r.value),
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
  );
  assert.equal(numberGuide[1].hundred.kana, 'にひゃく');
  assert.equal(numberGuide[1].hundred.special, false);
  for (const [value, kana, romaji] of [
    [3, 'さんびゃく', 'sanbyaku'],
    [6, 'ろっぴゃく', 'roppyaku'],
    [8, 'はっぴゃく', 'happyaku'],
  ] as const) {
    const r = numberGuide.find((r) => r.value === value)!;
    assert.equal(r.hundred.kana, kana);
    assert.equal(r.hundred.romaji, romaji);
    assert.equal(r.hundred.special, true);
  }
  assert.equal(numberGuide[0].hundred.kana, 'ひゃく');
  assert.equal(numberGuide[0].thousand.kana, 'せん');
  assert.equal(numberGuide[2].thousand.kana, 'さんぜん');
  assert.equal(numberGuide[7].thousand.kana, 'はっせん');
});
test('clock reference gives the different hour readings, half past, and fun/pun minutes', () => {
  assert.equal(hourGuide.length, 12);
  assert.deepEqual(
    hourGuide.filter((r) => r.reading.special).map((r) => r.value),
    [4, 7, 9],
  );
  assert.equal(hourGuide[3].reading.kana, 'よじ');
  assert.equal(hourGuide[6].reading.kana, 'しちじ');
  assert.equal(hourGuide[8].reading.kana, 'くじ');
  assert.equal(hourGuide[3].half.kana, 'よじはん');
  assert.equal(hourGuide[8].half.kana, 'くじはん');
  for (const r of hourGuide) assert.equal(r.half.kana, r.reading.kana + 'はん');
  assert.deepEqual(
    minuteGuide.filter((r) => r.ending === 'ふん').map((r) => r.value),
    [2, 5, 7, 9],
  );
  assert.deepEqual(
    minuteGuide.filter((r) => r.ending === 'ぷん').map((r) => r.value),
    [1, 3, 4, 6, 8, 10],
  );
  assert.equal(minuteGuide[0].reading.kana, 'いっぷん');
  assert.equal(minuteGuide[5].reading.kana, 'ろっぷん');
  assert.equal(minuteGuide[7].reading.kana, 'はっぷん');
  assert.equal(minuteGuide[9].reading.kana, 'じゅっぷん');
});
