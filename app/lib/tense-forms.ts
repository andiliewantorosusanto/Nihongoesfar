import type { ReferenceTable } from './study-topics.ts';

// Columns: polite, casual, negative polite, negative casual, question, negative question.
const present = [
  [
    'Noun — student',
    '学生です~がくせいです',
    '学生だ~がくせいだ',
    '学生じゃありません~がくせいじゃありません',
    '学生じゃない~がくせいじゃない',
    '学生ですか~がくせいですか',
    '学生じゃありませんか~がくせいじゃありませんか',
  ],
  [
    'Verb — eat',
    '食べます~たべます',
    '食べる~たべる',
    '食べません~たべません',
    '食べない~たべない',
    '食べますか~たべますか',
    '食べませんか~たべませんか',
  ],
  [
    'い-adjective — hot',
    '暑いです~あついです',
    '暑い~あつい',
    '暑くないです~あつくないです',
    '暑くない~あつくない',
    '暑いですか~あついですか',
    '暑くないですか~あつくないですか',
  ],
  [
    'な-adjective — well',
    '元気です~げんきです',
    '元気だ~げんきだ',
    '元気じゃありません~げんきじゃありません',
    '元気じゃない~げんきじゃない',
    '元気ですか~げんきですか',
    '元気じゃありませんか~げんきじゃありませんか',
  ],
  [
    'Existence — things',
    'あります~あります',
    'ある~ある',
    'ありません~ありません',
    'ない~ない',
    'ありますか~ありますか',
    'ありませんか~ありませんか',
  ],
  [
    'Existence — people / animals',
    'います~います',
    'いる~いる',
    'いません~いません',
    'いない~いない',
    'いますか~いますか',
    'いませんか~いませんか',
  ],
];

const past = [
  [
    'Noun — student',
    '学生でした~がくせいでした',
    '学生だった~がくせいだった',
    '学生じゃありませんでした~がくせいじゃありませんでした',
    '学生じゃなかった~がくせいじゃなかった',
    '学生でしたか~がくせいでしたか',
    '学生じゃありませんでしたか~がくせいじゃありませんでしたか',
  ],
  [
    'Verb — eat',
    '食べました~たべました',
    '食べた~たべた',
    '食べませんでした~たべませんでした',
    '食べなかった~たべなかった',
    '食べましたか~たべましたか',
    '食べませんでしたか~たべませんでしたか',
  ],
  [
    'い-adjective — hot',
    '暑かったです~あつかったです',
    '暑かった~あつかった',
    '暑くなかったです~あつくなかったです',
    '暑くなかった~あつくなかった',
    '暑かったですか~あつかったですか',
    '暑くなかったですか~あつくなかったですか',
  ],
  [
    'な-adjective — well',
    '元気でした~げんきでした',
    '元気だった~げんきだった',
    '元気じゃありませんでした~げんきじゃありませんでした',
    '元気じゃなかった~げんきじゃなかった',
    '元気でしたか~げんきでしたか',
    '元気じゃありませんでしたか~げんきじゃありませんでしたか',
  ],
  [
    'Existence — things',
    'ありました~ありました',
    'あった~あった',
    'ありませんでした~ありませんでした',
    'なかった~なかった',
    'ありましたか~ありましたか',
    'ありませんでしたか~ありませんでしたか',
  ],
  [
    'Existence — people / animals',
    'いました~いました',
    'いた~いた',
    'いませんでした~いませんでした',
    'いなかった~いなかった',
    'いましたか~いましたか',
    'いませんでしたか~いませんでしたか',
  ],
];

export function tenseReferences(tense: 'Present' | 'Past'): ReferenceTable[] {
  const rows = tense === 'Past' ? past : present;
  const cell = (value: string) => {
    const [text, reading = ''] = value.split('~');
    return { text, reading };
  };
  return [
    ...['Polite', 'Casual', 'Negative polite', 'Negative casual'].map((heading, index) => ({
      heading,
      columns: ['Type', 'Example'],
      rows: rows.map((row) => [cell(row[0]), cell(row[index + 1])]),
    })),
    {
      heading: 'Question / negative question',
      columns: ['Type', 'Question', 'Negative question'],
      rows: rows.map((row) => [cell(row[0]), cell(row[5]), cell(row[6])]),
    },
  ];
}

// Old links remain usable while the grammar index and practice use the combined topics.
export const tenseTopicFor: Record<string, string> = {
  'grammar-desu': 'study-present-tense',
  'grammar-question': 'study-present-tense',
  'grammar-noun-negative': 'study-present-tense',
  'grammar-masu': 'study-present-tense',
  'grammar-masen': 'study-present-tense',
  'grammar-existence-negative': 'study-present-tense',
  'grammar-noun-past': 'study-past-tense',
  'grammar-verb-past': 'study-past-tense',
  'study-noun-sentences': 'study-present-tense',
  'study-adjective-forms': 'study-present-tense',
};
