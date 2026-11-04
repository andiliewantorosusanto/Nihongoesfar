import familyData from '../../../public/guides/family.json' with { type: 'json' };
import type { Entry } from '../content/content.ts';
export type FamilyWordMode = 'own' | 'other';
// Word spellings and kana still come from the editable family entry.
const pronunciation: Record<string, string> = familyData.pronunciation;
export const familySiblingPositions = familyData.siblingPositions;
export function familyTreeWord(entry: Entry, relationship: string, mode: FamilyWordMode) {
  const row = entry.references
    ?.flatMap((table) => table.rows)
    .find((row) => row[0]?.text === relationship);
  const word = row?.[mode === 'own' ? 1 : 2];
  return word
    ? { relationship, text: word.text, reading: word.reading, romaji: pronunciation[word.reading] }
    : undefined;
}
