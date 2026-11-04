import { convertNumber, numberInRange } from './number-converter.ts';

export type NumberPracticeMode = 'mixed' | 'reading' | 'meaning' | 'grammar';

export function numberPracticeQuestion(
  min: number,
  max: number,
  mode: NumberPracticeMode,
  random = Math.random,
) {
  const value = numberInRange(min, max, random);
  const reading = convertNumber(value);
  const skill =
    mode === 'mixed'
      ? (['reading', 'meaning', 'grammar'] as const)[Math.floor(random() * 3)]
      : mode;
  if (skill === 'meaning')
    return { prompt: `Write ${reading.kanji} as digits.`, answers: [String(value)] };
  if (skill === 'grammar')
    return {
      prompt: `Write ${value.toLocaleString('en')} in hiragana, including any sound changes.`,
      answers: [reading.hiragana],
    };
  return { prompt: `Read ${reading.kanji} in hiragana.`, answers: [reading.hiragana] };
}
