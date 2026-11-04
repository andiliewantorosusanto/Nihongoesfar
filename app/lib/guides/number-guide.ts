import guideData from '../../../public/guides/numbers.json' with { type: 'json' };

export type GuideReading = { kana: string; romaji: string; special?: boolean };
export const { numberGuide, hourGuide, minuteGuide, compoundMinuteGuide } = guideData;
