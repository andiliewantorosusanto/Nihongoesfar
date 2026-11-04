import type { Entry } from './content.ts';
export type FamilyWordMode = 'own' | 'other';
// Romaji is authored pronunciation help; kanji and kana come from the saved entry.
const pronunciation: Record<string, string> = {
  ちち: 'chichi',
  はは: 'haha',
  あに: 'ani',
  あね: 'ane',
  おとうと: 'otouto',
  いもうと: 'imouto',
  そふ: 'sofu',
  そぼ: 'sobo',
  おっと: 'otto',
  つま: 'tsuma',
  むすこ: 'musuko',
  むすめ: 'musume',
  りょうしん: 'ryoushin',
  かぞく: 'kazoku',
  おとうさん: 'otousan',
  おかあさん: 'okaasan',
  おにいさん: 'oniisan',
  おねえさん: 'oneesan',
  おとうとさん: 'otouto-san',
  いもうとさん: 'imouto-san',
  おじいさん: 'ojiisan',
  おばあさん: 'obaasan',
  ごしゅじん: 'goshujin',
  おくさん: 'okusan',
  むすこさん: 'musuko-san',
  むすめさん: 'musume-san',
  ごりょうしん: 'goryoushin',
  ごかぞく: 'gokazoku',
};
export const familySiblingPositions = [
  'older brother',
  'older sister',
  'you',
  'spouse',
  'younger brother',
  'younger sister',
] as const;
export function familyTreeWord(entry: Entry, relationship: string, mode: FamilyWordMode) {
  const row = entry.references
    ?.flatMap((table) => table.rows)
    .find((row) => row[0]?.text === relationship);
  const word = row?.[mode === 'own' ? 1 : 2];
  return word
    ? { relationship, text: word.text, reading: word.reading, romaji: pronunciation[word.reading] }
    : undefined;
}
