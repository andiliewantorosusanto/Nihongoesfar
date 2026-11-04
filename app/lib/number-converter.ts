import { numberGuide } from './number-guide.ts';

export const maximumNumber = 999_999_999_999;
const digits = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

function digitReading(digit: number, place: number): string {
  const row = numberGuide[digit - 1];
  if (place === 1000) return row.thousand.kana;
  if (place === 100) return row.hundred.kana;
  if (place === 10) return (digit === 1 ? '' : row.unit.kana) + 'じゅう';
  return row.unit.kana;
}

function convertGroup(value: number): { kanji: string; hiragana: string } {
  let kanji = '';
  let hiragana = '';
  for (const [place, unit] of [
    [1000, '千'],
    [100, '百'],
    [10, '十'],
    [1, ''],
  ] as const) {
    const digit = Math.floor(value / place);
    value %= place;
    if (!digit) continue;
    const omitOne = digit === 1 && place > 1;
    kanji += (omitOne ? '' : digits[digit]) + unit;
    hiragana += digitReading(digit, place);
  }
  return { kanji, hiragana };
}

export function convertNumber(value: number): { kanji: string; hiragana: string } {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximumNumber)
    throw new Error('Enter a whole number from 0 to 999,999,999,999.');
  if (value === 0) return { kanji: '零', hiragana: 'れい' };
  let kanji = '';
  let hiragana = '';
  // Japanese groups numbers by four digits: 億, 万, then the remaining units.
  for (const [size, symbol, reading] of [
    [100_000_000, '億', 'おく'],
    [10_000, '万', 'まん'],
    [1, '', ''],
  ] as const) {
    const group = Math.floor(value / size);
    value %= size;
    if (!group) continue;
    const converted = convertGroup(group);
    kanji += converted.kanji + symbol;
    hiragana += converted.hiragana + reading;
  }
  return { kanji, hiragana };
}

export function parseNumberInput(text: string): number {
  if (!/^\d+$/.test(text)) throw new Error('Use digits only, without commas or decimals.');
  const value = Number(text);
  convertNumber(value);
  return value;
}

export function numberInRange(min: number, max: number, random = Math.random): number {
  convertNumber(min);
  convertNumber(max);
  if (min > max) throw new Error('The minimum must be less than or equal to the maximum.');
  return min + Math.floor(random() * (max - min + 1));
}
