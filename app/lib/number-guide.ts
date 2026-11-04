// Compact pronunciation reference. Long vowels use doubled vowels in romaji.
export type GuideReading = { kana: string; romaji: string; special?: boolean };
const unitKana = ['いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
const unitRomaji = ['ichi', 'ni', 'san', 'yon', 'go', 'roku', 'nana', 'hachi', 'kyuu'];
const hundredKana = [
  'ひゃく',
  'にひゃく',
  'さんびゃく',
  'よんひゃく',
  'ごひゃく',
  'ろっぴゃく',
  'ななひゃく',
  'はっぴゃく',
  'きゅうひゃく',
];
const hundredRomaji = [
  'hyaku',
  'ni-hyaku',
  'sanbyaku',
  'yon-hyaku',
  'go-hyaku',
  'roppyaku',
  'nana-hyaku',
  'happyaku',
  'kyuu-hyaku',
];
const thousandKana = [
  'せん',
  'にせん',
  'さんぜん',
  'よんせん',
  'ごせん',
  'ろくせん',
  'ななせん',
  'はっせん',
  'きゅうせん',
];
const thousandRomaji = [
  'sen',
  'ni-sen',
  'sanzen',
  'yon-sen',
  'go-sen',
  'roku-sen',
  'nana-sen',
  'hassen',
  'kyuu-sen',
];
export const numberGuide = unitKana.map((kana, i) => ({
  value: i + 1,
  unit: { kana, romaji: unitRomaji[i] },
  hundred: { kana: hundredKana[i], romaji: hundredRomaji[i], special: [2, 5, 7].includes(i) },
  thousand: { kana: thousandKana[i], romaji: thousandRomaji[i], special: [2, 7].includes(i) },
}));
const hourKana = [
  'いちじ',
  'にじ',
  'さんじ',
  'よじ',
  'ごじ',
  'ろくじ',
  'しちじ',
  'はちじ',
  'くじ',
  'じゅうじ',
  'じゅういちじ',
  'じゅうにじ',
];
const hourRomaji = [
  'ichi-ji',
  'ni-ji',
  'san-ji',
  'yo-ji',
  'go-ji',
  'roku-ji',
  'shichi-ji',
  'hachi-ji',
  'ku-ji',
  'juu-ji',
  'juuichi-ji',
  'juuni-ji',
];
export const hourGuide = hourKana.map((kana, i) => ({
  value: i + 1,
  reading: { kana, romaji: hourRomaji[i], special: [3, 6, 8].includes(i) },
  half: { kana: kana + 'はん', romaji: hourRomaji[i] + ' han' },
}));
const minuteKana = [
  'いっぷん',
  'にふん',
  'さんぷん',
  'よんぷん',
  'ごふん',
  'ろっぷん',
  'ななふん',
  'はっぷん',
  'きゅうふん',
  'じゅっぷん',
];
const minuteRomaji = [
  'ippun',
  'ni-fun',
  'san-pun',
  'yon-pun',
  'go-fun',
  'roppun',
  'nana-fun',
  'happun',
  'kyuu-fun',
  'juppun',
];
export const minuteGuide = minuteKana.map((kana, i) => ({
  value: i + 1,
  reading: { kana, romaji: minuteRomaji[i], special: [0, 2, 3, 5, 7, 9].includes(i) },
  ending: [1, 4, 6, 8].includes(i) ? 'ふん' : 'ぷん',
}));
