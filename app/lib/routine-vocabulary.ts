import { exercises } from './study-topics.ts';
import type { Entry } from './content.ts';
const rows = `歯を磨く|はをみがく|brush one's teeth|歯を磨きます|はをみがきます
仕事に行く|しごとにいく|go to work|仕事に行きます|しごとにいきます
学校に行く|がっこうにいく|go to school|学校に行きます|がっこうにいきます
勉強する|べんきょうする|study|勉強します|べんきょうします
働く|はたらく|work|働きます|はたらきます
料理する|りょうりする|cook|料理します|りょうりします
掃除する|そうじする|clean|掃除します|そうじします
洗う|あらう|wash|洗います|あらいます
食べる|たべる|eat|食べます|たべます
シャワーを浴びる|しゃわーをあびる|take a shower|シャワーを浴びます|しゃわーをあびます
顔を洗う|かおをあらう|wash one's face|顔を洗います|かおをあらいます
皿を洗う|さらをあらう|wash dishes|皿を洗います|さらをあらいます
祈る|いのる|pray|祈ります|いのります
飲む|のむ|drink|飲みます|のみます
寝る|ねる|sleep; go to bed|寝ます|ねます
車を使う|くるまをつかう|use a car|車を使います|くるまをつかいます
車を運転する|くるまをうんてんする|drive a car|車を運転します|くるまをうんてんします
言う|いう|say|言います|いいます
話す|はなす|talk; speak|話します|はなします
立つ|たつ|stand|立ちます|たちます
帰る|かえる|go home; return|帰ります|かえります
死ぬ|しぬ|die|死にます|しにます
遊ぶ|あそぶ|play; spend time for fun|遊びます|あそびます
読む|よむ|read|読みます|よみます
置く|おく|put; place|置きます|おきます
泳ぐ|およぐ|swim|泳ぎます|およぎます
開ける|あける|open something|開けます|あけます
閉める|しめる|close something|閉めます|しめます
つける|つける|turn on; attach|つけます|つけます
かける|かける|hang; make a phone call (context dependent)|かけます|かけます
勤める|つとめる|work for; be employed by|勤めます|つとめます
起きる|おきる|wake up; get up|起きます|おきます
見る|みる|see; watch|見ます|みます
来る|くる|come|来ます|きます
する|する|do|します|します`;
const code = (s: string) =>
  Array.from(s)
    .map((c) => c.codePointAt(0)!.toString(16))
    .join('-');
export const routineVocabulary: Entry[] = rows.split('\n').map((row) => {
  const [japanese, reading, meaning, polite, politeReading] = row.split('|');
  return {
    id: `routine-${code(japanese)}`,
    kind: 'vocabulary',
    title: japanese,
    japanese,
    reading,
    meaning,
    level: 'Beginner',
    topic: 'Daily routine',
    tags: ['Daily routine', 'Verb'],
    note: `Polite non-past: ${polite} (${politeReading}). This form can express a routine or future action.`,
    forms: { casual: japanese, polite },
    examples: [
      {
        japanese: polite + '。',
        reading: politeReading + '。',
        meaning: `I ${meaning.split(';')[0]}.`,
      },
    ],
  };
});
const sample = (japanese: string, reading: string, meaning: string) => ({
  japanese,
  reading,
  meaning,
});
const cell = (text: string) => ({ text, reading: '' });
export const routineGuides: Entry[] = [
  {
    id: 'study-masu-groups',
    kind: 'grammar',
    title: 'Verb groups: dictionary form → ます',
    japanese: '毎日、歯を磨きます。',
    reading: 'まいにち、はをみがきます。',
    meaning: 'Verb groups and polite ます forms',
    level: 'Beginner',
    topic: 'Daily routine',
    tags: ['Study guide', 'Verb forms'],
    note: 'Group 1 (godan): change the final u-row sound to its i-row partner, then add ます: う→い, く→き, ぐ→ぎ, す→し, つ→ち, ぬ→に, ぶ→び, む→み, る→り. Group 2 (ichidan): remove final る and add ます. Many end in -iru or -eru, but the ending alone is not a reliable rule: 帰る (かえる), 入る (はいる), and 走る (はしる) are group 1. Group 3: する→します and 来る (くる)→来ます (きます). Compounds follow the same pattern: 勉強する→勉強します. ます is polite non-past; “talking” in progress is 話しています (はなしています). 死ぬ means die; 死んでいる (しんでいる) means be dead. 顔 (かお) is face; 皿 (さら) is plate. 浴びる (あびる) means bathe or shower; する means do.',
    examples: [
      sample('毎日、歯を磨きます。', 'まいにち、はをみがきます。', 'I brush my teeth every day.'),
      sample('今、話しています。', 'いま、はなしています。', 'I am talking now.'),
      sample('学校から帰ります。', 'がっこうからかえります。', 'I return home from school.'),
    ],
    references: [
      {
        heading: 'Group 1: final sound → i-row + ます',
        columns: ['Dictionary', 'Polite'],
        rows: [
          ['言う → いう', '言います → いいます'],
          ['話す → はなす', '話します → はなします'],
          ['立つ → たつ', '立ちます → たちます'],
          ['帰る → かえる', '帰ります → かえります'],
          ['死ぬ → しぬ', '死にます → しにます'],
          ['遊ぶ → あそぶ', '遊びます → あそびます'],
          ['読む → よむ', '読みます → よみます'],
          ['置く → おく', '置きます → おきます'],
          ['泳ぐ → およぐ', '泳ぎます → およぎます'],
        ].map((row) => row.map(cell)),
      },
      {
        heading: 'Group 2 and irregular verbs',
        columns: ['Dictionary', 'Polite'],
        rows: [
          ['あける', 'あけます'],
          ['しめる', 'しめます'],
          ['つける', 'つけます'],
          ['かける', 'かけます'],
          ['ねる', 'ねます'],
          ['つとめる', 'つとめます'],
          ['たべる', 'たべます'],
          ['おきる', 'おきます'],
          ['みる', 'みます'],
          ['あびる', 'あびます'],
          ['くる (irregular)', 'きます'],
          ['する (irregular)', 'します'],
        ].map((row) => row.map(cell)),
      },
    ],
  },
  {
    id: 'study-ni-vs-e',
    kind: 'grammar',
    title: 'Going places: に versus へ',
    japanese: '学校に行きます。',
    reading: 'がっこうにいきます。',
    meaning: 'Destination に and direction へ',
    level: 'Beginner',
    topic: 'Travel',
    tags: ['Study guide', 'Particles'],
    note: 'With 行く (いく), 来る (くる), and 帰る (かえる), に emphasizes the destination and へ emphasizes movement toward it. They are often interchangeable in ordinary travel sentences. The particle へ is pronounced え (e). に has other uses that へ cannot replace: time, existence, and a verb’s target, such as 七時に起きます (しちじにおきます), 部屋にいます (へやにいます), and 電車に乗ります (でんしゃにのります). Use で for the vehicle or means of travel: 車で学校に行きます (くるまでがっこうにいきます).',
    examples: [
      sample('学校に行きます。', 'がっこうにいきます。', 'I go to school.'),
      sample('学校へ行きます。', 'がっこうへいきます。', 'I go toward school / to school.'),
      sample('車で会社に行きます。', 'くるまでかいしゃにいきます。', 'I go to work by car.'),
    ],
  },
];

for (const guide of routineGuides) {
  guide.examples.push(
    guide.id === 'study-masu-groups'
      ? sample('本を読みます。', 'ほんをよみます。', 'I read a book.')
      : sample('家へ帰ります。', 'いえへかえります。', 'I return home.'),
  );
  for (const ex of guide.examples) {
    ex.tokens = [
      {
        text: ex.japanese.slice(0, -1),
        reading: ex.reading.slice(0, -1),
        role: 'predicate',
        wordClass: 'sentence',
      },
    ];
    ex.translationTokens = [{ text: ex.meaning, role: 'predicate' }];
  }
  for (const ref of guide.references || [])
    for (const row of ref.rows)
      for (const cell of row) {
        const pair = cell.text.split(' → ');
        if (pair.length === 2) {
          cell.text = pair[0];
          cell.reading = pair[1];
        }
      }
  guide.exercises = exercises(guide.examples, guide.note, 0);
}
