import type { Entry } from '../content/content.ts';
import type { ReferenceTable } from '../content/study-topics.ts';

// Explicit verb roots avoid guessing the group from a final る or mistaking nouns for verbs.
const roots: Record<string, [string, 'godan' | 'ichidan' | 'suru' | 'kuru']> = {};
for (const [group, rows] of Object.entries({
  godan:
    '行く:いく 帰る:かえる 飲む:のむ 聞く:きく 読む:よむ 書く:かく 話す:はなす 買う:かう 休む:やすむ 働く:はたらく 会う:あう 歩く:あるく 待つ:まつ 磨く:みがく 洗う:あらう 祈る:いのる 使う:つかう 言う:いう 立つ:たつ 死ぬ:しぬ 遊ぶ:あそぶ 置く:おく 泳ぐ:およぐ 通る:とおる 渡る:わたる 走る:はしる 飛ぶ:とぶ 乗る:のる 入る:はいる',
  ichidan:
    '食べる:たべる 見る:みる 起きる:おきる 寝る:ねる 浴びる:あびる 開ける:あける 閉める:しめる つける:つける かける:かける 勤める:つとめる 降りる:おりる 出る:でる',
  suru: 'する:する',
  kuru: '来る:くる',
}))
  for (const pair of rows.split(' ')) {
    const [word, reading] = pair.split(':');
    roots[word] = [reading, group as (typeof roots)[string][1]];
  }
const labels = [
  'Dictionary / casual',
  'Polite',
  'Polite negative',
  'Polite past',
  'Polite past negative',
  'Casual negative',
  'Casual past',
  'Casual past negative',
  'て-form',
  'ます-stem',
  'While … (ながら)',
];
function verbForms(word: string, group: (typeof roots)[string][1], kana: boolean): string[] {
  let stem: string, negative: string, te: string, past: string;
  if (group === 'suru') {
    const base = word.slice(0, -2);
    stem = base + 'し';
    negative = base + 'しない';
    te = base + 'して';
    past = base + 'した';
  } else if (group === 'kuru') {
    stem = kana ? 'き' : '来';
    negative = kana ? 'こない' : '来ない';
    te = kana ? 'きて' : '来て';
    past = kana ? 'きた' : '来た';
  } else if (group === 'ichidan') {
    stem = word.slice(0, -1);
    negative = stem + 'ない';
    te = stem + 'て';
    past = stem + 'た';
  } else {
    const end = word.slice(-1),
      base = word.slice(0, -1);
    const i: Record<string, string> = {
      う: 'い',
      く: 'き',
      ぐ: 'ぎ',
      す: 'し',
      つ: 'ち',
      ぬ: 'に',
      ぶ: 'び',
      む: 'み',
      る: 'り',
    };
    const a: Record<string, string> = {
      う: 'わ',
      く: 'か',
      ぐ: 'が',
      す: 'さ',
      つ: 'た',
      ぬ: 'な',
      ぶ: 'ば',
      む: 'ま',
      る: 'ら',
    };
    stem = base + i[end];
    negative = base + a[end] + 'ない';
    const ending = ['う', 'つ', 'る'].includes(end)
      ? 'って'
      : ['む', 'ぶ', 'ぬ'].includes(end)
        ? 'んで'
        : end === 'く'
          ? 'いて'
          : end === 'ぐ'
            ? 'いで'
            : 'して';
    te = base + ending;
    if (word === '行く' || word === 'いく') te = base + 'って';
    past = te.slice(0, -1) + (te.endsWith('で') ? 'だ' : 'た');
  }
  return [
    word,
    stem + 'ます',
    stem + 'ません',
    stem + 'ました',
    stem + 'ませんでした',
    negative,
    past,
    negative.slice(0, -1) + 'かった',
    te,
    stem,
    stem + 'ながら',
  ];
}
export function wordForms(
  entry: Entry,
): { group: string; note: string; table: ReferenceTable } | undefined {
  if (entry.kind === 'vocabulary') {
    const root = Object.keys(roots)
      .sort((a, b) => b.length - a.length)
      .find((word) => entry.japanese.endsWith(word) && entry.reading.endsWith(roots[word][0]));
    if (!root) return;
    // Only accept a standalone root, a known verb phrase, or a する compound.
    if (
      entry.japanese !== root &&
      root !== 'する' &&
      !entry.tags.includes('Verb') &&
      !/[をにで]/.test(entry.japanese.slice(0, -root.length))
    )
      return;
    const [reading, group] = roots[root];
    const prefix = entry.japanese.slice(0, -root.length),
      kanaPrefix = entry.reading.slice(0, -reading.length);
    const jp = verbForms(root, group, false).map((f) => prefix + f),
      kana = verbForms(reading, group, true).map((f) => kanaPrefix + f);
    return {
      group:
        group === 'godan'
          ? 'Group 1 · う-verb'
          : group === 'ichidan'
            ? 'Group 2 · る-verb'
            : 'Group 3 · irregular verb',
      note: 'ます is polite non-past: habits or future actions. The ます-stem is a building block, not a complete polite sentence. ながら means “while doing …”; add the main action afterward. The て-form connects to other endings, such as ています.',
      table: {
        heading: 'Verb forms',
        columns: ['Form', 'Japanese'],
        rows: labels.map((label, i) => [
          { text: label, reading: '' },
          { text: jp[i], reading: kana[i] },
        ]),
      },
    };
  }
  if (entry.kind !== 'adjectives') return;
  const na = entry.tags.includes('な-adjective') || entry.topic === 'な-adjectives';
  const forms = (word: string) => {
    const stem = word === 'いい' ? 'よ' : word.slice(0, -1);
    return na
      ? [
          word + 'だ',
          word + 'です',
          word + 'じゃない',
          word + 'じゃありません',
          word + 'だった',
          word + 'でした',
          word + 'じゃなかった',
          word + 'じゃありませんでした',
          word + 'で',
          word + 'に',
          word + 'になります',
        ]
      : [
          word,
          word + 'です',
          stem + 'くない',
          stem + 'くないです',
          stem + 'かった',
          stem + 'かったです',
          stem + 'くなかった',
          stem + 'くなかったです',
          stem + 'くて',
          stem + 'く',
          stem + 'くなります',
        ];
  };
  const jp = forms(entry.japanese),
    kana = forms(entry.reading);
  const names = [
    'Casual present',
    'Polite present',
    'Casual negative',
    'Polite negative',
    'Casual past',
    'Polite past',
    'Casual past negative',
    'Polite past negative',
    'Connecting descriptions',
    'Adverb form',
    'Becomes …',
  ];
  return {
    group: na ? 'な-adjective' : 'い-adjective',
    note: na
      ? 'Use な before a noun. じゃ can also be written では in negative forms.'
      : 'Replace the final い to change the ending. いい is irregular: よくない, よかった. Do not add だ after an い-adjective.',
    table: {
      heading: 'Adjective forms',
      columns: ['Form', 'Japanese'],
      rows: names.map((label, i) => [
        { text: label, reading: '' },
        { text: jp[i], reading: kana[i] },
      ]),
    },
  };
}
