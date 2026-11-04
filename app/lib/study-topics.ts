import type { Entry } from './content.ts';
import type { ReadingText, GuidedExercise } from './grammar-course.ts';
import { tenseReferences } from './tense-forms.ts';
export type ReferenceTable = { heading: string; columns: string[]; rows: ReadingText[][] };
const c = (text: string, reading = ''): ReadingText => ({ text, reading });
const table = (
  heading: string,
  columns: string[],
  rows: (string | ReadingText)[][],
): ReferenceTable => ({
  heading,
  columns,
  rows: rows.map((row) => row.map((v) => (typeof v === 'string' ? c(v) : v))),
});
const tag = 'Study guide';
// Authored chunks keep the Japanese, kana and English role colors together.
function s(japanese: string, english: string): Entry['examples'][number] {
  const tokens = japanese.split('|').map((part) => {
    const [text, reading, role] = part.split('~');
    return {
      text,
      reading,
      role,
      wordClass:
        role === 'particle' ? 'particle' : role === 'predicate' ? 'predicate' : 'noun phrase',
    };
  });
  const translationTokens = english.split('|').map((part) => {
    const [text, role] = part.split('~');
    return { text, role, ...(role === 'implicit' ? { implicit: true } : {}) };
  });
  return {
    japanese: tokens.map((t) => t.text).join('') + '。',
    reading: tokens.map((t) => t.reading).join('') + '。',
    meaning: translationTokens.map((t) => t.text).join(''),
    tokens,
    translationTokens,
  };
}
const rt = (sample: Entry['examples'][number]) => ({
  text: sample.japanese,
  reading: sample.reading,
  meaning: sample.meaning,
  tokens: sample.tokens,
  translationTokens: sample.translationTokens,
});
function answers(sample: Entry['examples'][number]) {
  return [
    ...new Set(
      sample.tokens!.reduce<string[]>(
        (all, t) => all.flatMap((p) => [p + t.text, p + t.reading]),
        [''],
      ),
    ),
  ];
}
export function exercises(
  samples: Entry['examples'],
  note: string,
  gapIndex = 1,
): GuidedExercise[] {
  const [a, b, d] = samples;
  const last = samples[3] || d;
  const part = b.tokens![gapIndex];
  const gap = b.tokens!.map((t, i) => (i === gapIndex ? { ...t, text: '___', reading: '___' } : t));
  const common = {
    hint: 'Look at the examples and the comparison table. Notice the particle or ending being used.',
    explanation: note,
  };
  return [
    {
      ...common,
      id: 'meaning',
      type: 'meaning-choice',
      prompt: 'Choose the meaning of this sentence.',
      context: rt(a),
      choices: [c(a.meaning), c(b.meaning)],
      answers: [a.meaning],
      feedback: rt(a),
    },
    {
      ...common,
      id: 'pattern',
      type: 'pattern-choice',
      prompt: 'Choose the Japanese: ' + b.meaning,
      choices: [rt(a), rt(b)],
      answers: answers(b),
      feedback: rt(b),
    },
    {
      ...common,
      id: 'gap',
      type: 'gap',
      prompt: 'Fill the missing part: ' + b.meaning,
      context: {
        text: gap.map((t) => t.text).join('') + '。',
        reading: gap.map((t) => t.reading).join('') + '。',
        tokens: gap,
      },
      answers: [part.text, part.reading!],
      feedback: rt(b),
    },
    {
      ...common,
      id: 'tiles',
      type: 'tiles',
      prompt: 'Build: ' + b.meaning,
      tiles: b.tokens!.map((t) => ({
        text: t.text,
        reading: t.reading!,
        role: t.role,
        wordClass: t.wordClass,
      })),
      answers: answers(b),
      feedback: rt(b),
    },
    {
      ...common,
      id: 'typing',
      type: 'typing',
      prompt: 'Write in Japanese: ' + d.meaning,
      answers: answers(d),
      feedback: rt(d),
    },
    {
      ...common,
      id: 'alternate',
      type: 'typing',
      prompt: 'Another example: ' + last.meaning,
      answers: answers(last),
      feedback: rt(last),
      alternate: true,
    },
  ];
}
function guide(
  id: string,
  kind: Entry['kind'],
  title: string,
  note: string,
  samples: Entry['examples'],
  references: ReferenceTable[],
  gapIndex = 1,
): Entry {
  return {
    id: 'study-' + id,
    kind,
    title,
    japanese: samples[0].japanese,
    reading: samples[0].reading,
    meaning: title,
    level: 'N5',
    topic:
      kind === 'numbers'
        ? 'Calendar, numbers & age'
        : kind === 'vocabulary'
          ? 'Family & daily life'
          : 'Grammar basics',
    tags: [tag],
    note,
    examples: samples,
    references,
    exercises: exercises(samples, note, gapIndex),
  };
}
function word(
  id: string,
  kind: Entry['kind'],
  japanese: string,
  reading: string,
  meaning: string,
  note: string,
  romaji?: string,
): Entry {
  return {
    id: 'study-' + id,
    kind,
    title: japanese,
    japanese,
    reading,
    meaning,
    romaji,
    level: kind === 'kana' ? 'Foundation' : 'N5',
    topic: kind === 'kana' ? 'Katakana' : kind === 'numbers' ? 'Numbers' : 'Vocabulary',
    tags: [tag, ...(kind === 'kana' ? ['Loanword sounds'] : [])],
    note,
    examples: [{ japanese, reading, meaning }],
  };
}
export const largeNumberAnchors = [
  { value: 10, japanese: '十', kana: 'じゅう', romaji: 'juu' },
  { value: 100, japanese: '百', kana: 'ひゃく', romaji: 'hyaku' },
  { value: 1000, japanese: '千', kana: 'せん', romaji: 'sen' },
  { value: 10000, japanese: '一万', kana: 'いちまん', romaji: 'ichi-man' },
  { value: 100000, japanese: '十万', kana: 'じゅうまん', romaji: 'juu-man' },
  { value: 1000000, japanese: '百万', kana: 'ひゃくまん', romaji: 'hyaku-man' },
];
export function makeStudyEntries(existing: Entry[]): Entry[] {
  const result: Entry[] = [];
  const push = (entry: Entry) => result.push(entry);
  const everydayPairs = guide(
    'vehicles-appliances',
    'grammar',
    'Verb pairs: vehicles and appliances',
    'Use vehicle + に + 乗ります (のります) to get on or into a vehicle, and vehicle + を + 降ります (おります) to get off or out. For example, 車に乗ります (くるまにのります) means get into a car, not 車に入ります. The place where you board or get off takes で: 駅で電車を降ります (えきででんしゃをおります). To switch an appliance or light on, use object + を + つけます; to switch it off, use object + を + 消します (けします). Compare 電気をつけます (でんきをつけます, I turn on the light) with 電気がつきます (でんきがつきます, the light comes on). 止めます (とめます) means stop a machine or operation; it does not always mean switch off the power.',
    [
      s(
        '電気~でんき~object|を~を~particle|つけます~つけます~predicate',
        'I ~implicit|turn on ~predicate|the light.~object',
      ),
      s(
        'テレビ~てれび~object|を~を~particle|消します~けします~predicate',
        'I ~implicit|turn off ~predicate|the TV.~object',
      ),
      s(
        '車~くるま~modifier|に~に~particle|乗ります~のります~predicate',
        'I ~implicit|get into~predicate| the car.~modifier',
      ),
      s(
        'バス~ばす~modifier|を~を~particle|降ります~おります~predicate',
        'I ~implicit|get off~predicate| the bus.~modifier',
      ),
    ],
    [
      table(
        'Get on / get off',
        ['Situation', 'Polite', 'Casual'],
        [
          ['Get into a car', c('車に乗ります', 'くるまにのります'), c('車に乗る', 'くるまにのる')],
          [
            'Get out of a car',
            c('車を降ります', 'くるまをおります'),
            c('車を降りる', 'くるまをおりる'),
          ],
          [
            'Get on a train',
            c('電車に乗ります', 'でんしゃにのります'),
            c('電車に乗る', 'でんしゃにのる'),
          ],
          [
            'Get off a train',
            c('電車を降ります', 'でんしゃをおります'),
            c('電車を降りる', 'でんしゃをおりる'),
          ],
        ],
      ),
      table(
        'Switch on / switch off',
        ['Situation', 'Polite', 'Casual'],
        [
          [
            'Turn on the light',
            c('電気をつけます', 'でんきをつけます'),
            c('電気をつける', 'でんきをつける'),
          ],
          [
            'Turn off the light',
            c('電気を消します', 'でんきをけします'),
            c('電気を消す', 'でんきをけす'),
          ],
          [
            'Turn on the TV',
            c('テレビをつけます', 'てれびをつけます'),
            c('テレビをつける', 'てれびをつける'),
          ],
          [
            'Turn off the TV',
            c('テレビを消します', 'てれびをけします'),
            c('テレビを消す', 'てれびをけす'),
          ],
          [
            'Turn on the air conditioner',
            c('エアコンをつけます', 'えあこんをつけます'),
            c('エアコンをつける', 'えあこんをつける'),
          ],
          [
            'Turn off the air conditioner',
            c('エアコンを消します', 'えあこんをけします'),
            c('エアコンを消す', 'えあこんをけす'),
          ],
        ],
      ),
    ],
  );
  everydayPairs.topic = 'Polite verbs and particles';
  push(everydayPairs);
  const presentTense = guide(
    'present-tense',
    'grammar',
    'Present',
    'Learn the present / non-past forms together: polite, casual, negative polite, negative casual, and questions. Non-past also covers routines and future actions. Nouns and な-adjectives use だ / です; い-adjectives do not take だ. Verbs have their own dictionary and negative forms. Add か to a polite statement to ask a question; casual questions usually use rising intonation, for example 食べる？ (たべる？). Negative questions depend on context: 食べませんか (たべませんか) can invite someone to eat. では and じゃ are alternative forms in noun / な-adjective negatives. いい changes to よくない in the negative.',
    [
      s(
        '私~わたし~topic|は~は~particle|学生です~がくせいです~predicate',
        'I~topic| am a student.~predicate',
      ),
      s(
        'パン~ぱん~object|を~を~particle|食べない~たべない~predicate',
        'I ~implicit|do not eat ~predicate|bread.~object',
      ),
      s(
        '今日~きょう~topic|は~は~particle|暑くないです~あつくないです~predicate',
        'Today~topic| is not hot.~predicate',
      ),
      s(
        '田中さん~たなかさん~topic|は~は~particle|元気です~げんきです~predicate|か~か~particle',
        'Is ~predicate|Tanaka~topic| well~predicate|?~particle',
      ),
    ],
    tenseReferences('Present'),
    2,
  );
  const pastTense = guide(
    'past-tense',
    'grammar',
    'Past',
    'Learn the past forms together: polite, casual, negative polite, negative casual, and questions. Nouns and な-adjectives use でした / だった. い-adjectives change final い to かった; negative past is くなかった. Verbs use ました in polite speech and their た-form in casual speech: 食べた (たべた), 読んだ (よんだ). Learn each verb’s conjugation; do not simply remove ました to make the casual form. Negative verbs use ませんでした / なかった. Add か for a polite question; casual questions can use rising intonation: 食べた？ (たべた？). いい becomes よかった / よくなかった. Negative questions can seek confirmation rather than being neutral yes-or-no questions.',
    [
      s(
        '昨日~きのう~modifier|は~は~particle|休みでした~やすみでした~predicate',
        'Yesterday~modifier| was a day off.~predicate',
      ),
      s(
        'パン~ぱん~object|を~を~particle|食べなかった~たべなかった~predicate',
        'I ~implicit|did not eat ~predicate|bread.~object',
      ),
      s(
        '昨日~きのう~topic|は~は~particle|暑くなかったです~あつくなかったです~predicate',
        'Yesterday~topic| was not hot.~predicate',
      ),
      s(
        '田中さん~たなかさん~topic|は~は~particle|元気でした~げんきでした~predicate|か~か~particle',
        'Was ~predicate|Tanaka~topic| well~predicate|?~particle',
      ),
    ],
    tenseReferences('Past'),
    2,
  );
  // Keep distractors close enough to require reading the vocabulary and ending.
  for (const [entry, past] of [
    [presentTense, false],
    [pastTense, true],
  ] as const) {
    const practice = entry.exercises!;
    practice[0].choices = (
      past
        ? [
            'Yesterday was a day off.',
            'Yesterday was a workday.',
            'Yesterday was not a day off.',
            'Tomorrow is a day off.',
          ]
        : ['I am a student.', 'I am a teacher.', 'I am an employee.', 'I was a student.']
    ).map((text) => c(text));
    practice[0].hint = past
      ? 'Check both the time word and the noun before the ending.'
      : 'Identify the noun after は, then check whether the ending is present or past.';
    const contrasts = past
      ? [
          s(
            'パン~ぱん~object|を~を~particle|食べた~たべた~predicate',
            'I ~implicit|ate ~predicate|bread.~object',
          ),
          s(
            'パン~ぱん~object|を~を~particle|食べない~たべない~predicate',
            'I ~implicit|do not eat ~predicate|bread.~object',
          ),
          s(
            'ご飯~ごはん~object|を~を~particle|食べなかった~たべなかった~predicate',
            'I ~implicit|did not eat ~predicate|rice.~object',
          ),
        ]
      : [
          s(
            'パン~ぱん~object|を~を~particle|食べる~たべる~predicate',
            'I ~implicit|eat ~predicate|bread.~object',
          ),
          s(
            'パン~ぱん~object|を~を~particle|食べなかった~たべなかった~predicate',
            'I ~implicit|did not eat ~predicate|bread.~object',
          ),
          s(
            'ご飯~ごはん~object|を~を~particle|食べない~たべない~predicate',
            'I ~implicit|do not eat ~predicate|rice.~object',
          ),
        ];
    practice[1].choices = [rt(entry.examples[1]), ...contrasts.map(rt)];
    const explanations = past
      ? [
          '昨日 (きのう) means “yesterday”; 休み (やすみ) means “a day off”. でした makes this a polite past statement: “Yesterday was a day off.” There is no negative ending here.',
          'パン means “bread”, and を marks what is eaten. 食べなかった (たべなかった) is the casual past negative of 食べる (たべる): “did not eat”. 食べた means “ate”; 食べない means “do not eat”.',
          'The missing verb is 食べなかった (たべなかった), “did not eat”. The ending なかった expresses a negative action in the past.',
          'Put the object パン first, then を, then 食べなかった (たべなかった): “I did not eat bread.” Japanese normally puts the verb last.',
          '昨日 (きのう) sets the time to yesterday. 暑い (あつい), “hot”, becomes 暑くなかった (あつくなかった), “was not hot”; です makes the sentence polite.',
          '元気 (げんき) means “well”. でした places it in the past, and final か makes a polite question: “Was Tanaka well?”',
        ]
      : [
          '私 (わたし) means “I”; は marks the topic. 学生 (がくせい) means “student”, while 先生 (せんせい) means “teacher” and 会社員 (かいしゃいん) means “employee”. です identifies the speaker as a student; “was a student” would use でした.',
          'パン means “bread”; ご飯 (ごはん) means “rice”. を marks what is eaten. 食べない (たべない) means “do not eat”; 食べる (たべる) means “eat”, and 食べなかった (たべなかった) means “did not eat”.',
          'Use 食べない (たべない), “do not eat”. This is the casual non-past negative of 食べる (たべる). The polite equivalent is 食べません (たべません).',
          'Put パン, “bread”, before を, then finish with 食べない (たべない), “do not eat”. The verb comes last: “I do not eat bread.”',
          '今日 (きょう) means “today”. 暑い (あつい), “hot”, changes to 暑くない (あつくない), “not hot”. Add です for politeness: “Today is not hot.”',
          '元気 (げんき) means “well”. です makes a polite statement, and final か turns it into “Is Tanaka well?”',
        ];
    practice.forEach((exercise, i) => {
      exercise.explanation = explanations[i];
      if (i > 0)
        exercise.hint =
          i === 1 || i === 2 || i === 3
            ? 'Check the food word and whether the verb is affirmative, negative, or past.'
            : 'Check the time word, the negative ending, and whether this is a question.';
    });
  }
  for (const entry of [presentTense, pastTense]) {
    entry.topic = 'Tenses';
    entry.tags.push('Adjective guide');
    push(entry);
  }
  const nounSentences = guide(
    'noun-sentences',
    'grammar',
    'Noun sentences: present, past, negatives, and questions',
    'Use noun A + は + noun B + です to identify or describe A. は is pronounced “wa”. Nouns use でした for polite past; do not add the verb ending ます. じゃ is the contracted form of では. Both じゃありません and ではありません are polite negatives. これ / それ / あれ stand alone; この / その / あの must come before a noun. どれ asks which item among several choices: どれがあなたのペンですか (どれがあなたのぺんですか). Use が after どれ in this question. の connects an owner or related noun to the following noun: 私の車 (わたしのくるま).',
    [
      s(
        'それ~それ~topic|は~は~particle|私~わたし~modifier|の~の~particle|車~くるま~predicate|です~です~predicate',
        'That~topic| is ~predicate|my~modifier| car.~predicate',
      ),
      s(
        'あれ~あれ~topic|は~は~particle|キムさん~きむさん~modifier|の~の~particle|車~くるま~predicate|じゃありません~じゃありません~predicate',
        "That~topic| is not ~predicate|Kim's~modifier| car.~predicate",
      ),
      s(
        'この~この~modifier|建物~たてもの~topic|は~は~particle|病院~びょういん~predicate|でした~でした~predicate',
        'This ~modifier|building~topic| was a hospital.~predicate',
      ),
      s(
        'Aビル~えーびる~topic|は~は~particle|学校~がっこう~predicate|じゃありませんでした~じゃありませんでした~predicate',
        'Building A~topic| was not a school.~predicate',
      ),
    ],
    [
      table(
        'Noun endings: polite and casual together',
        ['Form', 'Polite', 'Casual', 'Meaning'],
        [
          [
            'Present',
            c('学生です', 'がくせいです'),
            c('学生だ', 'がくせいだ'),
            'am / is a student',
          ],
          [
            'Negative',
            c('学生じゃありません', 'がくせいじゃありません'),
            c('学生じゃない', 'がくせいじゃない'),
            'am / is not a student',
          ],
          [
            'Past',
            c('学生でした', 'がくせいでした'),
            c('学生だった', 'がくせいだった'),
            'was a student',
          ],
          [
            'Negative past',
            c('学生じゃありませんでした', 'がくせいじゃありませんでした'),
            c('学生じゃなかった', 'がくせいじゃなかった'),
            'was not a student',
          ],
        ],
      ),
      table(
        'Pointing words and possession',
        ['Word / pattern', 'Example', 'Meaning'],
        [
          [
            c('これ', 'これ'),
            c('これはボールペンです', 'これはぼーるぺんです'),
            'This is a ballpoint pen (near me).',
          ],
          [
            c('それ', 'それ'),
            c('それは私の車です', 'それはわたしのくるまです'),
            'That is my car (near you).',
          ],
          [
            c('あれ', 'あれ'),
            c('あれはエアコンです', 'あれはえあこんです'),
            'That is an air conditioner (away from both of us).',
          ],
          [
            c('どれ', 'どれ'),
            c('どれがあなたのペンですか', 'どれがあなたのぺんですか'),
            'Which one is your pen?',
          ],
          [c('noun + の + noun'), c('キムさんの車', 'きむさんのくるま'), "Kim's car"],
        ],
      ),
      table(
        'Ask and answer',
        ['Question', 'Yes', 'No'],
        [
          [
            c('田中さんは学生ですか', 'たなかさんはがくせいですか'),
            c('はい、学生です', 'はい、がくせいです'),
            c('いいえ、学生じゃありません', 'いいえ、がくせいじゃありません'),
          ],
          [
            c('この建物は病院でしたか', 'このたてものはびょういんでしたか'),
            c('はい、病院でした', 'はい、びょういんでした'),
            c('いいえ、病院じゃありませんでした', 'いいえ、びょういんじゃありませんでした'),
          ],
        ],
      ),
    ],
    5,
  );
  nounSentences.topic = 'Sentence basics';
  for (const exercise of nounSentences.exercises!.filter(
    (exercise) => exercise.type !== 'meaning-choice',
  )) {
    exercise.answers = [
      ...new Set(exercise.answers.flatMap((answer) => [answer, answer.replace(/じゃ/g, 'では')])),
    ];
  }
  push(nounSentences);
  const adjectiveForms = guide(
    'adjective-forms',
    'grammar',
    'い / な adjectives: present, past, and negatives',
    'For い-adjectives, replace final い with くない, かった, or くなかった. Add です to make these forms polite; do not add だ after an い-adjective. For な-adjectives and nouns, change the ending instead: だ / です, じゃない / じゃありません, だった / でした, じゃなかった / じゃありませんでした. では is a more formal alternative to じゃ. くありません and くありませんでした are also polite い-adjective negatives. いい is irregular: よくない, よかった, よくなかった. きれい and 嫌い (きらい) are な-adjectives even though they end in い.',
    [
      s(
        '今日~きょう~topic|は~は~particle|暑くないです~あつくないです~predicate',
        'Today~topic| is not hot.~predicate',
      ),
      s(
        '昨日~きのう~topic|は~は~particle|元気でした~げんきでした~predicate',
        'I ~implicit|was well~predicate| yesterday.~topic',
      ),
      s(
        'この~この~modifier|料理~りょうり~topic|は~は~particle|おいしくなかったです~おいしくなかったです~predicate',
        'This ~modifier|dish~topic| was not delicious.~predicate',
      ),
      s(
        'この~この~modifier|部屋~へや~topic|は~は~particle|きれいじゃなかったです~きれいじゃなかったです~predicate',
        'This ~modifier|room~topic| was not clean.~predicate',
      ),
    ],
    [
      table(
        'Present and past: polite and casual together',
        ['Form', 'い: hot', 'な: energetic', 'Noun: rain'],
        [
          [
            'Present · polite',
            c('暑いです', 'あついです'),
            c('元気です', 'げんきです'),
            c('雨です', 'あめです'),
          ],
          ['Present · casual', c('暑い', 'あつい'), c('元気だ', 'げんきだ'), c('雨だ', 'あめだ')],
          [
            'Negative · polite',
            c('暑くないです', 'あつくないです'),
            c('元気じゃありません', 'げんきじゃありません'),
            c('雨じゃありません', 'あめじゃありません'),
          ],
          [
            'Negative · casual',
            c('暑くない', 'あつくない'),
            c('元気じゃない', 'げんきじゃない'),
            c('雨じゃない', 'あめじゃない'),
          ],
          [
            'Past · polite',
            c('暑かったです', 'あつかったです'),
            c('元気でした', 'げんきでした'),
            c('雨でした', 'あめでした'),
          ],
          [
            'Past · casual',
            c('暑かった', 'あつかった'),
            c('元気だった', 'げんきだった'),
            c('雨だった', 'あめだった'),
          ],
          [
            'Negative past · polite',
            c('暑くなかったです', 'あつくなかったです'),
            c('元気じゃありませんでした', 'げんきじゃありませんでした'),
            c('雨じゃありませんでした', 'あめじゃありませんでした'),
          ],
          [
            'Negative past · casual',
            c('暑くなかった', 'あつくなかった'),
            c('元気じゃなかった', 'げんきじゃなかった'),
            c('雨じゃなかった', 'あめじゃなかった'),
          ],
        ],
      ),
      table(
        'Adjective vocabulary',
        ['Japanese', 'Type', 'Meaning'],
        existing
          .filter((entry) => entry.kind === 'adjectives')
          .map((entry) => [
            c(entry.japanese, entry.reading),
            entry.tags.includes('な-adjective') ? 'な' : 'い',
            entry.meaning,
          ]),
      ),
      table(
        'いい uses よい when its ending changes',
        ['Present', 'Negative', 'Past', 'Negative past'],
        [
          [
            c('いいです', 'いいです'),
            c('よくないです', 'よくないです'),
            c('よかったです', 'よかったです'),
            c('よくなかったです', 'よくなかったです'),
          ],
        ],
      ),
    ],
    2,
  );
  const adjectiveJoining = guide(
    'adjective-joining',
    'grammar',
    'Connect descriptions: ～くて / ～で',
    'To connect compatible descriptions, change an い-adjective’s final い to くて; add で to a な-adjective or noun. いい becomes よくて. Choose the connector from the first description, even when the next word is a different adjective type. The last predicate carries the sentence’s tense and politeness. Use these patterns for “and”; use が or けど when contrasting descriptions.',
    [
      s(
        'この~この~modifier|料理~りょうり~topic|は~は~particle|おいしくて~おいしくて~predicate|安いです~やすいです~predicate',
        'This ~modifier|dish~topic| is delicious and ~predicate|inexpensive.~predicate',
      ),
      s(
        'この~この~modifier|町~まち~topic|は~は~particle|有名で~ゆうめいで~predicate|にぎやかです~にぎやかです~predicate',
        'This ~modifier|town~topic| is famous and ~predicate|lively.~predicate',
      ),
      s(
        'この~この~modifier|料理~りょうり~topic|は~は~particle|おいしくて~おいしくて~predicate|有名です~ゆうめいです~predicate',
        'This ~modifier|dish~topic| is delicious and ~predicate|famous.~predicate',
      ),
      s(
        '田中さん~たなかさん~topic|は~は~particle|学生で~がくせいで~predicate|親切です~しんせつです~predicate',
        'Tanaka~topic| is a student and ~predicate|kind.~predicate',
      ),
    ],
    [
      table(
        'The first description chooses the connector',
        ['Type', 'Base', 'Connecting form', 'Example'],
        [
          [
            'い-adjective',
            c('おいしい', 'おいしい'),
            c('おいしくて', 'おいしくて'),
            c('おいしくて、安いです', 'おいしくて、やすいです'),
          ],
          [
            'な-adjective',
            c('有名', 'ゆうめい'),
            c('有名で', 'ゆうめいで'),
            c('有名で、にぎやかです', 'ゆうめいで、にぎやかです'),
          ],
          [
            'Noun',
            c('学生', 'がくせい'),
            c('学生で', 'がくせいで'),
            c('学生で、親切です', 'がくせいで、しんせつです'),
          ],
          [
            'Irregular いい',
            c('いい', 'いい'),
            c('よくて', 'よくて'),
            c('天気がよくて、暖かいです', 'てんきがよくて、あたたかいです'),
          ],
        ],
      ),
    ],
    3,
  );
  const nounDescriptions = guide(
    'noun-descriptions',
    'grammar',
    'Describe nouns: い / な / の',
    'Keep い directly before a noun: おいしい料理 (おいしいりょうり). Add な between a な-adjective and a noun: 静かな町 (しずかなまち). Link a describing noun to another noun with の: 日本の料理 (にほんのりょうり). Do not use です or だ between the description and its noun. Compare 日本の料理はおいしいです (にほんのりょうりはおいしいです, Japanese food is delicious) with おいしい日本の料理 (おいしいにほんのりょうり, delicious Japanese food).',
    [
      s(
        'おいしい~おいしい~modifier|料理~りょうり~predicate|です~です~predicate',
        'It ~implicit|is a ~predicate|delicious ~modifier|dish.~predicate',
      ),
      s(
        '静か~しずか~modifier|な~な~particle|町~まち~predicate|です~です~predicate',
        'It ~implicit|is a ~predicate|quiet ~modifier|town.~predicate',
      ),
      s(
        '日本~にほん~modifier|の~の~particle|料理~りょうり~predicate|です~です~predicate',
        'It ~implicit|is ~predicate|Japanese ~modifier|food.~predicate',
      ),
      s(
        'きれい~きれい~modifier|な~な~particle|部屋~へや~predicate|です~です~predicate',
        'It ~implicit|is a ~predicate|clean ~modifier|room.~predicate',
      ),
    ],
    [
      table(
        'What goes before the noun?',
        ['Type', 'Pattern', 'Example', 'Meaning'],
        [
          [
            'い-adjective',
            c('い-adjective + noun'),
            c('おいしい料理', 'おいしいりょうり'),
            'a delicious dish',
          ],
          [
            'な-adjective',
            c('な-adjective + な + noun'),
            c('静かな町', 'しずかなまち'),
            'a quiet town',
          ],
          ['Noun', c('noun + の + noun'), c('日本の料理', 'にほんのりょうり'), 'Japanese food'],
          [
            'Exception ending in い',
            c('きれい + な + noun', 'きれい + な + noun'),
            c('きれいな部屋', 'きれいなへや'),
            'a clean room',
          ],
        ],
      ),
    ],
    1,
  );
  for (const entry of [adjectiveForms, adjectiveJoining, nounDescriptions]) {
    entry.topic = 'Adjectives and noun descriptions';
    entry.tags.push('Adjective guide');
    push(entry);
  }
  const verbParticles = guide(
    'verb-particle-pairs',
    'grammar',
    'Verb–particle pairs: を and に',
    'Learn the particle together with the verb. を is pronounced “o”. It marks an object, but also a place or vehicle you leave, or a route you move through. に can mark what you board, a place you enter, or a person you meet. These patterns stay the same in polite and casual speech. For example, use 電車に乗ります (でんしゃにのります), not 電車を乗ります. The place where you board or get off takes で: 駅で電車を降ります (えきででんしゃをおります).',
    [
      s(
        '電車~でんしゃ~modifier|に~に~particle|乗ります~のります~predicate',
        'I ~implicit|get on~predicate| the train.~modifier',
      ),
      s(
        'バス~ばす~modifier|を~を~particle|降ります~おります~predicate',
        'I ~implicit|get off~predicate| the bus.~modifier',
      ),
      s(
        '部屋~へや~modifier|に~に~particle|入ります~はいります~predicate',
        'I ~implicit|enter~predicate| the room.~modifier',
      ),
      s(
        '家~いえ~modifier|を~を~particle|出ます~でます~predicate',
        'I ~implicit|leave~predicate| the house.~modifier',
      ),
    ],
    [
      table(
        'Learn each verb with its particle',
        ['Use', 'Polite', 'Casual', 'Meaning'],
        [
          [
            'Board a vehicle',
            c('電車に乗ります', 'でんしゃにのります'),
            c('電車に乗る', 'でんしゃにのる'),
            'get on the train',
          ],
          [
            'Leave a vehicle',
            c('バスを降ります', 'ばすをおります'),
            c('バスを降りる', 'ばすをおりる'),
            'get off the bus',
          ],
          [
            'Enter a place',
            c('部屋に入ります', 'へやにはいります'),
            c('部屋に入る', 'へやにはいる'),
            'enter the room',
          ],
          [
            'Leave a place',
            c('家を出ます', 'いえをでます'),
            c('家を出る', 'いえをでる'),
            'leave the house',
          ],
          [
            'Move through a place',
            c('公園を散歩します', 'こうえんをさんぽします'),
            c('公園を散歩する', 'こうえんをさんぽする'),
            'take a walk in the park',
          ],
          [
            'Meet a person',
            c('友達に会います', 'ともだちにあいます'),
            c('友達に会う', 'ともだちにあう'),
            'meet a friend',
          ],
          [
            'Sit on a seat',
            c('椅子に座ります', 'いすにすわります'),
            c('椅子に座る', 'いすにすわる'),
            'sit on a chair',
          ],
          [
            'Act on an object',
            c('水を飲みます', 'みずをのみます'),
            c('水を飲む', 'みずをのむ'),
            'drink water',
          ],
        ],
      ),
    ],
  );
  verbParticles.topic = 'Polite verbs and particles';
  const particleExercise = verbParticles.exercises!.find((exercise) => exercise.id === 'pattern')!;
  particleExercise.choices = [
    rt(verbParticles.examples[1]),
    c('バスに降ります。', 'ばすにおります。'),
  ];
  particleExercise.explanation =
    'Use を with the vehicle you get off: バスを降ります (ばすをおります). Use に with the vehicle you board: バスに乗ります (ばすにのります).';
  push(verbParticles);
  const kara = guide(
    'particle-kara',
    'grammar',
    'から — from a place or starting time',
    'から marks a starting point: a place or a time. まで marks an endpoint and is optional. Use どこから to ask “from where?” and 何時から (なんじから) to ask “from what time?”. You do not add に after から in these patterns. This lesson covers “from”; clause + から meaning “because” is a different pattern.',
    [
      s(
        '家~いえ~modifier|から~から~particle|学校~がっこう~modifier|まで~まで~particle|歩きます~あるきます~predicate',
        'I ~implicit|walk~predicate| from home~modifier| to school.~modifier',
      ),
      s(
        '九時~くじ~modifier|から~から~particle|勉強します~べんきょうします~predicate',
        'I ~implicit|study~predicate| from nine.~modifier',
      ),
      s(
        'インドネシア~いんどねしあ~modifier|から~から~particle|来ました~きました~predicate',
        'I ~implicit|came~predicate| from Indonesia.~modifier',
      ),
      s(
        '八時~はちじ~modifier|から~から~particle|五時~ごじ~modifier|まで~まで~particle|働きます~はたらきます~predicate',
        'I ~implicit|work~predicate| from eight~modifier| until five.~modifier',
      ),
    ],
    [
      table(
        'Starting points and endpoints',
        ['Use', 'Question', 'Example answer', 'Meaning'],
        [
          [
            'Origin',
            c('どこから来ましたか', 'どこからきましたか'),
            c('インドネシアから来ました', 'いんどねしあからきました'),
            'Where did you come from? — I came from Indonesia.',
          ],
          [
            'Starting time',
            c('何時から勉強しますか', 'なんじからべんきょうしますか'),
            c('九時から勉強します', 'くじからべんきょうします'),
            'From what time will you study? — From nine.',
          ],
          [
            'Time range',
            c('何時から何時まで働きますか', 'なんじからなんじまではたらきますか'),
            c('八時から五時まで働きます', 'はちじからごじまではたらきます'),
            'From what time until what time do you work? — From eight until five.',
          ],
          [
            'Route',
            c('どこからどこまで歩きますか', 'どこからどこまであるきますか'),
            c('家から学校まで歩きます', 'いえからがっこうまであるきます'),
            'From where to where do you walk? — From home to school.',
          ],
        ],
      ),
    ],
  );
  kara.topic = 'Polite verbs and particles';
  push(kara);
  const travel = guide(
    'travel-when-how',
    'grammar',
    'Travel: where, when, and how',
    'Combine the patterns: transport + で + destination + に / へ + movement verb. Use 行きます (いきます) for go, 来ます (きます) for come toward the speaker or viewpoint, and 帰ります (かえります) for return home. Past polite forms are 行きました (いきました), 来ました (きました), and 帰りました (かえりました). A specific clock time takes に; 昨日 (きのう, yesterday) does not. Say 歩いて (あるいて) for “on foot”, not 歩いてで. Ask 何で行きますか (なんでいきますか) about transport; どうやって行きますか is another way to ask how to get there.',
    [
      s(
        'デパート~でぱーと~modifier|へ~へ~particle|行きます~いきます~predicate',
        'I ~implicit|go~predicate| to the department store.~modifier',
      ),
      s(
        '昨日~きのう~modifier|日本~にほん~modifier|に~に~particle|来ました~きました~predicate',
        'I ~implicit|came~predicate| to Japan~modifier| yesterday.~modifier',
      ),
      s(
        '昨日~きのう~modifier|十一時~じゅういちじ~modifier|に~に~particle|家~いえ~modifier|へ~へ~particle|帰りました~かえりました~predicate',
        'I ~implicit|returned~predicate| home~modifier| at eleven~modifier| yesterday.~modifier',
      ),
      s(
        '飛行機~ひこうき~modifier|で~で~particle|日本~にほん~modifier|へ~へ~particle|行きます~いきます~predicate',
        'I ~implicit|go~predicate| to Japan~modifier| by plane.~modifier',
      ),
    ],
    [
      table(
        'How do you travel?',
        ['Japanese', 'Reading', 'Meaning'],
        [
          [c('飛行機で', 'ひこうきで'), c('ひこうきで', 'ひこうきで'), 'by plane'],
          [c('電車で', 'でんしゃで'), c('でんしゃで', 'でんしゃで'), 'by train'],
          [c('バスで', 'ばすで'), c('ばすで', 'ばすで'), 'by bus'],
          [c('バイクで', 'ばいくで'), c('ばいくで', 'ばいくで'), 'by motorbike'],
          [c('自転車で', 'じてんしゃで'), c('じてんしゃで', 'じてんしゃで'), 'by bicycle'],
          [c('歩いて', 'あるいて'), c('あるいて', 'あるいて'), 'on foot'],
        ],
      ),
      table(
        'Ask and answer',
        ['Question', 'Example answer', 'Meaning'],
        [
          [
            c('どこへ行きますか', 'どこへいきますか'),
            c('デパートへ行きます', 'でぱーとへいきます'),
            'Where are you going? — To the department store.',
          ],
          [
            c('どうやって日本へ行きますか', 'どうやってにほんへいきますか'),
            c('飛行機で行きます', 'ひこうきでいきます'),
            'How will you go to Japan? — By plane.',
          ],
          [
            c('何時に家へ帰りましたか', 'なんじにいえへかえりましたか'),
            c('十一時に帰りました', 'じゅういちじにかえりました'),
            'At what time did you return home? — At eleven.',
          ],
          [
            c('何で会社へ行きますか', 'なんでかいしゃへいきますか'),
            c('バイクで会社へ行きます', 'ばいくでかいしゃへいきます'),
            'How do you travel to work? — By motorbike.',
          ],
        ],
      ),
      table(
        'Places',
        ['Place', 'Meaning'],
        [
          [c('図書館', 'としょかん'), 'library'],
          [c('病院', 'びょういん'), 'hospital'],
          [c('郵便局', 'ゆうびんきょく'), 'post office'],
          [c('銀行', 'ぎんこう'), 'bank'],
          [c('美術館', 'びじゅつかん'), 'art museum'],
          [c('大使館', 'たいしかん'), 'embassy'],
          [c('公園', 'こうえん'), 'park'],
          [c('駅', 'えき'), 'station'],
        ],
      ),
      table(
        '半 and 分: read them in context',
        ['Japanese', 'Reading', 'Meaning'],
        [
          [c('三時半', 'さんじはん'), c('さんじはん', 'さんじはん'), 'half past three'],
          [
            c('十分 / 10分', 'じゅっぷん'),
            c('じゅっぷん / じっぷん', 'じゅっぷん / じっぷん'),
            'ten minutes; both readings are accepted',
          ],
          [
            c('十分', 'じゅうぶん'),
            c('じゅうぶん', 'じゅうぶん'),
            'enough / sufficient (a different word)',
          ],
          [c('分ける', 'わける'), c('わける', 'わける'), 'divide / share'],
          [c('分かる', 'わかる'), c('わかる', 'わかる'), 'understand'],
        ],
      ),
    ],
    2,
  );
  travel.topic = 'Polite verbs and particles';
  for (const exercise of travel.exercises!.filter(
    (exercise) => exercise.type !== 'meaning-choice',
  )) {
    exercise.answers = [
      ...new Set(
        exercise.answers.flatMap((answer) => [
          answer,
          answer === 'に'
            ? 'へ'
            : answer.replace(/に(?=来|きました)/g, 'へ').replace(/へ(?=行|いき|帰|かえ)/g, 'に'),
        ]),
      ),
    ];
  }
  push(travel);
  if (!existing.some((entry) => entry.kind === 'vocabulary' && entry.japanese === '大使館')) {
    const embassy = word(
      'embassy',
      'vocabulary',
      '大使館',
      'たいしかん',
      'embassy',
      'A place: 大使館へ行きます (たいしかんへいきます), go to the embassy.',
    );
    embassy.topic = 'Places';
    push(embassy);
  }
  push(
    guide(
      'kore-sore-are',
      'grammar',
      'これ・それ・あれ — this, that, that over there',
      'これ is near the speaker; それ is near the listener or refers to something just mentioned; あれ is away from both. These words stand alone. Use この / その / あの directly before a noun.',
      [
        s(
          'これ~これ~topic|は~は~particle|本です~ほんです~predicate',
          'This~topic| is a book.~predicate',
        ),
        s(
          'それ~それ~topic|は~は~particle|時計です~とけいです~predicate',
          'That~topic| is a clock.~predicate',
        ),
        s(
          'あれ~あれ~topic|は~は~particle|学校です~がっこうです~predicate',
          'That over there~topic| is a school.~predicate',
        ),
        s(
          'これ~これ~topic|は~は~particle|何です~なんです~predicate|か~か~particle',
          'What is ~predicate|this~topic|?~particle',
        ),
      ],
      [
        table(
          'Stand-alone pointing words',
          ['Word', 'Meaning'],
          [
            [c('これ', 'これ'), 'this (near me)'],
            [c('それ', 'それ'), 'that (near you / just mentioned)'],
            [c('あれ', 'あれ'), 'that over there (away from both)'],
          ],
        ),
      ],
    ),
  );
  push(
    guide(
      'kono-sono-ano',
      'grammar',
      'この・その・あの — before a noun',
      'この / その / あの must be followed by a noun. この本 means “this book”; この alone cannot replace これ. The near-me / near-you / far-from-both distinction is the same.',
      [
        s(
          'この~この~modifier|本~ほん~topic|は~は~particle|私のです~わたしのです~predicate',
          'This ~modifier|book~topic| is mine.~predicate',
        ),
        s(
          'その~その~modifier|時計~とけい~topic|は~は~particle|先生のです~せんせいのです~predicate',
          "That ~modifier|clock~topic| is the teacher's.~predicate",
        ),
        s(
          'あの~あの~modifier|車~くるま~topic|は~は~particle|母のです~ははのです~predicate',
          "That ~modifier|car~topic| over there~modifier| is my mother's.~predicate",
        ),
        s(
          'この~この~modifier|かばん~かばん~topic|は~は~particle|私のです~わたしのです~predicate',
          'This ~modifier|bag~topic| is mine.~predicate',
        ),
      ],
      [
        table(
          'A pointing word plus a noun',
          ['Pattern', 'Example'],
          [
            [c('この', 'この'), c('この本', 'このほん')],
            [c('その', 'その'), c('その時計', 'そのとけい')],
            [c('あの', 'あの'), c('あの車', 'あのくるま')],
          ],
        ),
      ],
      0,
    ),
  );
  const particleNotes = {
    wa: 'は is written ha but pronounced wa when it is a particle. It sets the topic: “As for ...”. It can contrast topics. It is not automatically the grammatical subject.',
    ga: 'が (ga) marks the subject. In basic existence sentences, it identifies what is present. は sets a topic; が can introduce the subject as new information or answer “who/what?”. They are not freely interchangeable in every sentence.',
    o: 'を is written wo but normally pronounced o. It marks the direct object of an action such as eating, drinking, or reading. It can also mark a route or place traversed, as in 公園を歩きます (walk through the park).',
    e: 'へ is written he but pronounced e as a particle. It marks direction or a destination of movement. It is not limited to 行きます, 来ます, and 帰ります: 駅へ歩きます means “walk toward the station”. に also marks destinations with many movement verbs; で marks where an action happens. Do not replace every に with へ: specific times and existence locations use に.',
  };
  const particleExamples = {
    wa: [
      s(
        '私~わたし~topic|は~は~particle|学生です~がくせいです~predicate',
        'I~topic| am a student.~predicate',
      ),
      s(
        '母~はは~topic|は~は~particle|先生です~せんせいです~predicate',
        'My mother~topic| is a teacher.~predicate',
      ),
      s(
        '今日~きょう~topic|は~は~particle|休みです~やすみです~predicate',
        'Today~topic| is a day off.~predicate',
      ),
      s(
        'これ~これ~topic|は~は~particle|本です~ほんです~predicate',
        'This~topic| is a book.~predicate',
      ),
    ],
    ga: [
      s(
        '猫~ねこ~subject|が~が~particle|います~います~predicate',
        'There is ~predicate|a cat.~subject',
      ),
      s(
        '本~ほん~subject|が~が~particle|あります~あります~predicate',
        'There is ~predicate|a book.~subject',
      ),
      s(
        '先生~せんせい~subject|が~が~particle|います~います~predicate',
        'There is ~predicate|a teacher.~subject',
      ),
      s(
        '犬~いぬ~subject|が~が~particle|います~います~predicate',
        'There is ~predicate|a dog.~subject',
      ),
    ],
    o: [
      s(
        '水~みず~object|を~を~particle|飲みます~のみます~predicate',
        'I ~implicit|drink ~predicate|water.~object',
      ),
      s(
        '本~ほん~object|を~を~particle|読みます~よみます~predicate',
        'I ~implicit|read ~predicate|a book.~object',
      ),
      s(
        'パン~ぱん~object|を~を~particle|食べます~たべます~predicate',
        'I ~implicit|eat ~predicate|bread.~object',
      ),
      s(
        '公園~こうえん~modifier|を~を~particle|歩きます~あるきます~predicate',
        'I ~implicit|walk~predicate| through the park.~modifier',
      ),
    ],
    e: [
      s(
        '学校~がっこう~modifier|へ~へ~particle|行きます~いきます~predicate',
        'I ~implicit|go~predicate| to school.~modifier',
      ),
      s(
        '日本~にほん~modifier|へ~へ~particle|来ます~きます~predicate',
        'I ~implicit|come~predicate| to Japan.~modifier',
      ),
      s(
        '家~いえ~modifier|へ~へ~particle|帰ります~かえります~predicate',
        'I ~implicit|return~predicate| home.~modifier',
      ),
      s(
        '駅~えき~modifier|へ~へ~particle|歩きます~あるきます~predicate',
        'I ~implicit|walk~predicate| toward the station.~modifier',
      ),
    ],
  };
  for (const [key, japanese, pronunciation] of [
    ['wa', 'は', 'wa'],
    ['ga', 'が', 'ga'],
    ['o', 'を', 'o'],
    ['e', 'へ', 'e'],
  ] as const)
    push(
      guide(
        'particle-' + key,
        'grammar',
        japanese + ' — the ' + pronunciation + ' particle',
        particleNotes[key],
        particleExamples[key],
        [
          table(
            'Spelling and particle pronunciation',
            ['Written', 'Said as'],
            [[c(japanese, japanese), pronunciation]],
          ),
        ],
      ),
    );
  const family = [
    ['father', '父', 'ちち', 'お父さん', 'おとうさん'],
    ['mother', '母', 'はは', 'お母さん', 'おかあさん'],
    ['older brother', '兄', 'あに', 'お兄さん', 'おにいさん'],
    ['older sister', '姉', 'あね', 'お姉さん', 'おねえさん'],
    ['younger brother', '弟', 'おとうと', '弟さん', 'おとうとさん'],
    ['younger sister', '妹', 'いもうと', '妹さん', 'いもうとさん'],
    ['grandfather', '祖父', 'そふ', 'おじいさん', 'おじいさん'],
    ['grandmother', '祖母', 'そぼ', 'おばあさん', 'おばあさん'],
    ['husband', '夫', 'おっと', 'ご主人', 'ごしゅじん'],
    ['wife', '妻', 'つま', '奥さん', 'おくさん'],
    ['son', '息子', 'むすこ', '息子さん', 'むすこさん'],
    ['daughter', '娘', 'むすめ', '娘さん', 'むすめさん'],
    ['parents', '両親', 'りょうしん', 'ご両親', 'ごりょうしん'],
    ['family', '家族', 'かぞく', 'ご家族', 'ごかぞく'],
  ];
  push(
    guide(
      'family',
      'vocabulary',
      'Family — my family and someone else’s family',
      'Use the plain family terms when describing your own family to outsiders. Use polite terms for someone else’s family. お父さん, お母さん, お兄さん, and お姉さん are also common ways of addressing your own relatives. The polite-reference column is not a universal list of direct forms of address; spouses are often addressed by name. おばさん (aunt) and おばあさん (grandmother) differ in vowel length; so do おじさん and おじいさん.',
      [
        s(
          '父~ちち~topic|は~は~particle|会社員です~かいしゃいんです~predicate',
          'My father~topic| is a company employee.~predicate',
        ),
        s(
          '母~はは~topic|は~は~particle|先生です~せんせいです~predicate',
          'My mother~topic| is a teacher.~predicate',
        ),
        s(
          '兄~あに~topic|は~は~particle|学生です~がくせいです~predicate',
          'My older brother~topic| is a student.~predicate',
        ),
        s(
          'お父さん~おとうさん~topic|は~は~particle|先生です~せんせいです~predicate|か~か~particle',
          'Is ~predicate|your father~topic| a teacher~predicate|?~particle',
        ),
      ],
      [
        table(
          'Whose family are you describing?',
          ['Relationship', 'My family (to outsiders)', 'Someone else’s family'],
          family.map(([meaning, a, ar, b, br]) => [meaning, c(a, ar), c(b, br)]),
        ),
      ],
    ),
  );
  for (const [meaning, a, ar, b, br] of family)
    for (const [jp, r, context] of [
      [a, ar, 'my ' + meaning + ' (speaking to outsiders)'],
      [b, br, 'someone else’s ' + meaning + ' (polite reference)'],
    ]) {
      if (!existing.some((e) => e.kind === 'vocabulary' && e.japanese === jp))
        push(
          word(
            'family-' + [...jp].map((c) => c.codePointAt(0)!.toString(16)).join('-'),
            'vocabulary',
            jp,
            r,
            context,
            'See the Family comparison guide for the distinction between talking about your own family and someone else’s family.',
          ),
        );
    }
  for (const [jp, r, en, romaji, form] of [
    ['行きます', 'いきます', 'go', 'ikimasu', '行く（いく）'],
    ['来ます', 'きます', 'come', 'kimasu', '来る（くる）'],
    ['帰ります', 'かえります', 'return home', 'kaerimasu', '帰る（かえる）'],
  ]) {
    const e = word(
      'movement-' + romaji,
      'vocabulary',
      jp,
      r,
      en,
      'Polite form of ' +
        form +
        '. Destination + に / へ is possible. 行きます goes away from the current viewpoint; 来ます comes toward it; 帰ります returns to home or a familiar base. へ is not limited to these three verbs.',
      romaji,
    );
    e.examples = particleExamples.e.filter((ex) => ex.japanese.includes(jp));
    push(e);
  }
  const nameSamples = [
    s(
      'お名前~おなまえ~topic|は~は~particle|何です~なんです~predicate|か~か~particle',
      'What is ~predicate|your name~topic|?~particle',
    ),
    s('アリです~ありです~predicate', 'My name~implicit| is Ali.~predicate'),
    s('田中です~たなかです~predicate', 'My name~implicit| is Tanaka.~predicate'),
    s('ハナです~はなです~predicate', 'My name~implicit| is Hana.~predicate'),
  ];
  push(
    guide(
      'ask-name',
      'grammar',
      'Ask and answer: your name',
      'Ask お名前は何ですか (おなまえはなんですか). Answer with your name + です, or 名前は～です. The names here are fictional examples; substitute your own name.',
      nameSamples,
      [
        table(
          'Name',
          ['Question', 'Example answer'],
          [[c('お名前は何ですか', 'おなまえはなんですか'), c('アリです', 'ありです')]],
        ),
      ],
      0,
    ),
  );
  const jobSamples = [
    s(
      'お仕事~おしごと~topic|は~は~particle|何です~なんです~predicate|か~か~particle',
      'What is ~predicate|your job~topic|?~particle',
    ),
    s('会社員です~かいしゃいんです~predicate', 'I ~implicit|am a company employee.~predicate'),
    s('学生です~がくせいです~predicate', 'I ~implicit|am a student.~predicate'),
    s('教師です~きょうしです~predicate', 'I ~implicit|am a teacher.~predicate'),
  ];
  push(
    guide(
      'ask-job',
      'grammar',
      'Ask and answer: your job',
      'Ask お仕事は何ですか (おしごとはなんですか). Answer with your occupation + です. A student can answer 学生です. These are example answers, not information about the visitor.',
      jobSamples,
      [
        table(
          'Useful answers',
          ['Japanese', 'Meaning'],
          [
            [c('会社員', 'かいしゃいん'), 'company employee'],
            [c('学生', 'がくせい'), 'student'],
            [c('教師', 'きょうし'), 'teacher (occupation)'],
            [c('医者', 'いしゃ'), 'doctor'],
          ],
        ),
      ],
      0,
    ),
  );
  const hobbySamples = [
    s(
      'ご趣味~ごしゅみ~topic|は~は~particle|何です~なんです~predicate|か~か~particle',
      'What is ~predicate|your hobby~topic|?~particle',
    ),
    s(
      '趣味~しゅみ~topic|は~は~particle|読書です~どくしょです~predicate',
      'My hobby~topic| is reading.~predicate',
    ),
    s(
      '趣味~しゅみ~topic|は~は~particle|料理です~りょうりです~predicate',
      'My hobby~topic| is cooking.~predicate',
    ),
    s(
      '趣味~しゅみ~topic|は~は~particle|音楽です~おんがくです~predicate',
      'My hobby~topic| is music.~predicate',
    ),
  ];
  push(
    guide(
      'ask-hobby',
      'grammar',
      'Ask and answer: your hobby',
      'Ask 趣味は何ですか or the polite ご趣味は何ですか (ごしゅみはなんですか). Answer 趣味は～です. Use a noun such as 読書 (reading) or 料理 (cooking).',
      hobbySamples,
      [
        table(
          'Hobbies',
          ['Japanese', 'Meaning'],
          [
            [c('読書', 'どくしょ'), 'reading'],
            [c('料理', 'りょうり'), 'cooking'],
            [c('音楽', 'おんがく'), 'music'],
            [c('旅行', 'りょこう'), 'travel'],
          ],
        ),
      ],
    ),
  );
  const routineRows = [
    [
      'Wake up',
      '何時に起きますか',
      'なんじにおきますか',
      '六時に起きます',
      'ろくじにおきます',
      'What time do you wake up? → I wake up at six.',
    ],
    [
      'Go to school',
      '何時に学校に行きますか',
      'なんじにがっこうにいきますか',
      '八時に学校に行きます',
      'はちじにがっこうにいきます',
      'What time do you go to school? → I go at eight.',
    ],
    [
      'Go to work',
      '何時に仕事に行きますか',
      'なんじにしごとにいきますか',
      '九時に仕事に行きます',
      'くじにしごとにいきます',
      'What time do you go to work? → I go at nine.',
    ],
    [
      'Travel to school',
      '学校までどのくらいかかりますか',
      'がっこうまでどのくらいかかりますか',
      '三十分かかります',
      'さんじゅっぷんかかります',
      'How long does it take to get to school? → It takes thirty minutes.',
    ],
    [
      'Travel to work',
      '職場までどのくらいかかりますか',
      'しょくばまでどのくらいかかりますか',
      '一時間かかります',
      'いちじかんかかります',
      'How long does it take to get to work? → It takes an hour.',
    ],
    [
      'Time at school',
      '毎日何時間学校にいますか',
      'まいにちなんじかんがっこうにいますか',
      '六時間います',
      'ろくじかんいます',
      'How many hours are you at school each day? → Six hours.',
    ],
    [
      'Hours of work',
      '毎日何時間働きますか',
      'まいにちなんじかんはたらきますか',
      '八時間働きます',
      'はちじかんはたらきます',
      'How many hours do you work each day? → Eight hours.',
    ],
    [
      'Food',
      '昨日、何を食べましたか',
      'きのう、なにをたべましたか',
      'カレーを食べました',
      'かれーをたべました',
      'What did you eat yesterday? → I ate curry.',
    ],
    [
      'Cooking',
      '昨日、何を作りましたか',
      'きのう、なにをつくりましたか',
      '晩ご飯にカレーを作りました',
      'ばんごはんにかれーをつくりました',
      'What did you make yesterday? → I made curry for dinner.',
    ],
    [
      'Activities',
      '昨日、何をしましたか',
      'きのう、なにをしましたか',
      '日本語を勉強しました',
      'にほんごをべんきょうしました',
      'What did you do yesterday? → I studied Japanese.',
    ],
    [
      'Bedtime',
      '何時に寝ますか',
      'なんじにねますか',
      '十一時に寝ます',
      'じゅういちじにねます',
      'What time do you go to bed? → I go to bed at eleven.',
    ],
  ];
  const routineSamples = [
    s(
      '何時~なんじ~modifier|に~に~particle|起きます~おきます~predicate|か~か~particle',
      'What time ~modifier|do you wake up~predicate|?~particle',
    ),
    s(
      '六時~ろくじ~modifier|に~に~particle|起きます~おきます~predicate',
      'At six ~modifier|I wake up.~predicate',
    ),
    s(
      '十一時~じゅういちじ~modifier|に~に~particle|寝ます~ねます~predicate',
      'At eleven ~modifier|I go to bed.~predicate',
    ),
    s(
      '八時~はちじ~modifier|に~に~particle|起きます~おきます~predicate',
      'At eight ~modifier|I wake up.~predicate',
    ),
  ];
  push(
    guide(
      'daily-routine',
      'grammar',
      'Daily routine: ask and answer',
      '何時に asks at what time; 何時間 asks how many hours. Use どのくらいかかりますか for travel time. Answer clock times with に, but durations without に. Use ます for routines and ました for past activities. Replace these example answers with your own.',
      routineSamples,
      [
        table(
          'Daily routine',
          ['Topic', 'Ask', 'Example answer', 'Meaning'],
          routineRows.map(([label, q, qr, a, ar, en]) => [
            label,
            c(q + '。', qr + '。'),
            c(a + '。', ar + '。'),
            en,
          ]),
        ),
      ],
    ),
  );
  const ageSamples = [
    s('何歳です~なんさいです~predicate|か~か~particle', 'How old are you~predicate|?~particle'),
    s('二十歳です~はたちです~predicate', 'I ~implicit|am twenty years old.~predicate'),
    s(
      '二十一歳です~にじゅういっさいです~predicate',
      'I ~implicit|am twenty-one years old.~predicate',
    ),
    s(
      'おいくつです~おいくつです~predicate|か~か~particle',
      'How old are you (more politely)~predicate|?~particle',
    ),
  ];
  const ages = [
    ['1', '一歳', 'いっさい'],
    ['2', '二歳', 'にさい'],
    ['3', '三歳', 'さんさい'],
    ['4', '四歳', 'よんさい'],
    ['5', '五歳', 'ごさい'],
    ['6', '六歳', 'ろくさい'],
    ['7', '七歳', 'ななさい'],
    ['8', '八歳', 'はっさい'],
    ['9', '九歳', 'きゅうさい'],
    ['10', '十歳', 'じゅっさい'],
    ['20', '二十歳', 'はたち'],
    ['21', '二十一歳', 'にじゅういっさい'],
    ['30', '三十歳', 'さんじゅっさい'],
    ['40', '四十歳', 'よんじゅっさい'],
  ];
  push(
    guide(
      'ages',
      'numbers',
      'Age — 歳 and asking how old',
      '歳 is read さい (sai). Watch 一歳 (いっさい), 八歳 (はっさい), 十歳 (じゅっさい / じっさい), and 二十歳 (はたち). For 21, return to number + さい: にじゅういっさい. Do not add さい after はたち. Ask 何歳ですか; おいくつですか is more polite. Age can be personal, so ask only when appropriate.',
      ageSamples,
      [
        table(
          'Age readings',
          ['Age', 'Japanese and reading'],
          ages.map(([n, jp, r]) => [n, c(jp, r)]),
        ),
      ],
      0,
    ),
  );
  push(
    guide(
      'ask-time',
      'grammar',
      'Ask and answer: what time is it?',
      'Ask 今、何時ですか (いま、なんじですか). Answer with hour + 時（じ）, then minutes + 分（ふん / ぷん）if needed. 半（はん）means half past. This asks clock time; 何時間 asks a duration.',
      [
        s(
          '今~いま~modifier|何時です~なんじです~predicate|か~か~particle',
          'What time is it~predicate| now~modifier|?~particle',
        ),
        s('三時です~さんじです~predicate', 'It is three o’clock.~predicate'),
        s('四時半です~よじはんです~predicate', 'It is half past four.~predicate'),
        s('七時十五分です~しちじじゅうごふんです~predicate', 'It is seven fifteen.~predicate'),
      ],
      [
        table(
          'Time questions',
          ['Japanese', 'Meaning'],
          [
            [c('何時ですか', 'なんじですか'), 'What time is it?'],
            [c('何時間ですか', 'なんじかんですか'), 'How many hours?'],
          ],
        ),
      ],
      0,
    ),
  );
  push(
    guide(
      'existence',
      'grammar',
      'Existence — people and animals versus things',
      'Use います for people and animals, and あります for things and plants. “Living/non-living” is only a rough shortcut: plants are biologically living but normally use あります. Use subject + が + existence verb. Location uses に, not で.',
      [
        s(
          '猫~ねこ~subject|が~が~particle|います~います~predicate',
          'There is ~predicate|a cat.~subject',
        ),
        s(
          '本~ほん~subject|が~が~particle|あります~あります~predicate',
          'There is ~predicate|a book.~subject',
        ),
        s(
          '先生~せんせい~subject|が~が~particle|います~います~predicate',
          'There is ~predicate|a teacher.~subject',
        ),
        s(
          '花~はな~subject|が~が~particle|あります~あります~predicate',
          'There is ~predicate|a flower.~subject',
        ),
      ],
      [
        table(
          'Choose the existence verb',
          ['Use', 'Positive', 'Negative'],
          [
            ['people / animals', c('います', 'います'), c('いません', 'いません')],
            ['things / plants', c('あります', 'あります'), c('ありません', 'ありません')],
          ],
        ),
      ],
    ),
  );
  const calendarSamples = [
    s(
      '今日~きょう~topic|は~は~particle|何月何日です~なんがつなんにちです~predicate|か~か~particle',
      'What is ~predicate|today’s~topic| date~predicate|?~particle',
    ),
    s('一月一日です~いちがつついたちです~predicate', 'It is January first.~predicate'),
    s('四月四日です~しがつよっかです~predicate', 'It is April fourth.~predicate'),
    s('七月二十日です~しちがつはつかです~predicate', 'It is July twentieth.~predicate'),
  ];
  const monthSamples = [
    s('一月です~いちがつです~predicate', 'It is January.~predicate'),
    s('四月です~しがつです~predicate', 'It is April.~predicate'),
    s('七月です~しちがつです~predicate', 'It is July.~predicate'),
    s('九月です~くがつです~predicate', 'It is September.~predicate'),
  ];
  const weekdaySamples = [
    s(
      '今日~きょう~topic|は~は~particle|日曜日です~にちようびです~predicate',
      'Today~topic| is Sunday.~predicate',
    ),
    s(
      '明日~あした~topic|は~は~particle|月曜日です~げつようびです~predicate',
      'Tomorrow~topic| is Monday.~predicate',
    ),
    s(
      '昨日~きのう~topic|は~は~particle|土曜日でした~どようびでした~predicate',
      'Yesterday~topic| was Saturday.~predicate',
    ),
    s(
      '明後日~あさって~topic|は~は~particle|火曜日です~かようびです~predicate',
      'The day after tomorrow~topic| is Tuesday.~predicate',
    ),
  ];
  const numbers = existing.filter((e) => e.kind === 'numbers');
  for (const [id, title, topic, note] of [
    [
      'months',
      'Months — January to December',
      'Months',
      'Calendar months use がつ (gatsu). April is しがつ, July is しちがつ, and September is くがつ. Duration uses か月（かげつ）instead: 二月 is February, 二か月 is two months.',
    ],
    [
      'dates',
      'Dates — the 1st to the 31st',
      'Dates',
      'Read a full date in year → month → day order. January 1 is 一月一日（いちがつついたち）. The first is ついたち, but a duration of one day is いちにち. Watch 14（じゅうよっか）, 20（はつか）, and 24（にじゅうよっか）.',
    ],
    [
      'weekdays',
      'Days of the week — 日・月・火・水・木・金・土',
      'Weekdays',
      'Weekday names end in 曜日（ようび）. The weekday abbreviations read にち・げつ・か・すい・もく・きん・ど. These are readings in weekday names, not the only readings of each kanji. Ask 何曜日ですか（なんようびですか）for the weekday; ask 何日ですか（なんにちですか）for the date.',
    ],
  ])
    push(
      guide(
        id,
        'numbers',
        title,
        note,
        topic === 'Months' ? monthSamples : topic === 'Weekdays' ? weekdaySamples : calendarSamples,
        [
          table(
            title,
            ['Meaning', 'Japanese and reading'],
            numbers
              .filter((e) => e.topic === topic)
              .map((e) => [e.meaning, c(e.japanese, e.reading)]),
          ),
        ],
        0,
      ),
    );
  const relative = [
    [
      'day',
      '一昨日',
      'おととい',
      '昨日',
      'きのう',
      '今日',
      'きょう',
      '明日',
      'あした',
      '明後日',
      'あさって',
    ],
    [
      'week',
      '先々週',
      'せんせんしゅう',
      '先週',
      'せんしゅう',
      '今週',
      'こんしゅう',
      '来週',
      'らいしゅう',
      '再来週',
      'さらいしゅう',
    ],
    [
      'month',
      '先々月',
      'せんせんげつ',
      '先月',
      'せんげつ',
      '今月',
      'こんげつ',
      '来月',
      'らいげつ',
      '再来月',
      'さらいげつ',
    ],
    [
      'year',
      '一昨年',
      'おととし',
      '去年',
      'きょねん',
      '今年',
      'ことし',
      '来年',
      'らいねん',
      '再来年',
      'さらいねん',
    ],
  ];
  const relativeSamples = [
    s(
      '今日~きょう~topic|は~は~particle|休みです~やすみです~predicate',
      'Today~topic| is a day off.~predicate',
    ),
    s(
      '昨日~きのう~topic|は~は~particle|休みでした~やすみでした~predicate',
      'Yesterday~topic| was a day off.~predicate',
    ),
    s(
      '明日~あした~modifier|学校~がっこう~modifier|に~に~particle|行きます~いきます~predicate',
      'I ~implicit|will go~predicate| to school~modifier| tomorrow.~modifier',
    ),
    s(
      '明後日~あさって~modifier|学校~がっこう~modifier|に~に~particle|行きます~いきます~predicate',
      'I ~implicit|will go~predicate| to school~modifier| the day after tomorrow.~modifier',
    ),
  ];
  push(
    guide(
      'relative-time',
      'numbers',
      'Relative time — yesterday, today, tomorrow',
      '一昨日（おととい）means two days ago (the day before yesterday); 明後日（あさって）is the day after tomorrow. 二日（ふつか）can mean a duration of two days; it does not mean the day after tomorrow by itself. Relative time expressions usually do not take に.',
      relativeSamples,
      [
        table(
          'Relative day, week, month, year',
          ['Period', 'Two before', 'Previous', 'Current', 'Next', 'Two after'],
          relative.map((row) => [
            row[0],
            ...Array.from({ length: 5 }, (_, i) => c(row[1 + i * 2], row[2 + i * 2])),
          ]),
        ),
      ],
    ),
  );
  const durationRows = [
    ['one day', '一日', 'いちにち'],
    ['two days', '二日間', 'ふつかかん'],
    ['three days', '三日間', 'みっかかん'],
    ['one week', '一週間', 'いっしゅうかん'],
    ['two weeks', '二週間', 'にしゅうかん'],
    ['one month', '一か月', 'いっかげつ'],
    ['two months', '二か月', 'にかげつ'],
    ['six months', '六か月', 'ろっかげつ'],
    ['one year', '一年間', 'いちねんかん'],
    ['two years', '二年間', 'にねんかん'],
  ];
  const durationSamples = [
    s(
      '二日間~ふつかかん~modifier|休みます~やすみます~predicate',
      'I ~implicit|will rest~predicate| for two days.~modifier',
    ),
    s(
      '二週間~にしゅうかん~modifier|勉強します~べんきょうします~predicate',
      'I ~implicit|will study~predicate| for two weeks.~modifier',
    ),
    s(
      '二か月~にかげつ~modifier|働きます~はたらきます~predicate',
      'I ~implicit|will work~predicate| for two months.~modifier',
    ),
    s(
      '二年間~にねんかん~modifier|勉強します~べんきょうします~predicate',
      'I ~implicit|will study~predicate| for two years.~modifier',
    ),
  ];
  push(
    guide(
      'durations',
      'numbers',
      'Durations — days, weeks, months, years',
      'A calendar date and a duration are different. 一日 is ついたち for the first day of a month, but いちにち for a duration. 二日 / 二日間 is two days. 週間 measures weeks; か月 measures months; 年 / 年間 measures years. 二月（にがつ）is February, not a two-month duration.',
      durationSamples,
      [
        table(
          'How long?',
          ['Duration', 'Japanese and reading'],
          durationRows.map(([en, jp, r]) => [en, c(jp, r)]),
        ),
      ],
      0,
    ),
  );
  const every = [
    ['every day', '毎日', 'まいにち'],
    ['every morning', '毎朝', 'まいあさ'],
    ['every evening', '毎晩', 'まいばん'],
    ['every week', '毎週', 'まいしゅう'],
    ['every month', '毎月', 'まいつき'],
    ['every year', '毎年', 'まいとし'],
  ];
  push(
    guide(
      'every',
      'numbers',
      'Every day, every morning — 毎',
      '毎 means “every”. 毎月 is commonly まいつき (also まいげつ); 毎年 can be まいとし or まいねん. These expressions normally do not take に. Keep 毎朝（every morning）distinct from 今朝（けさ, this morning）.',
      [
        s(
          '毎日~まいにち~modifier|勉強します~べんきょうします~predicate',
          'I ~implicit|study~predicate| every day.~modifier',
        ),
        s(
          '毎朝~まいあさ~modifier|水~みず~object|を~を~particle|飲みます~のみます~predicate',
          'I ~implicit|drink ~predicate|water~object| every morning.~modifier',
        ),
        s(
          '毎晩~まいばん~modifier|本~ほん~object|を~を~particle|読みます~よみます~predicate',
          'I ~implicit|read ~predicate|a book~object| every evening.~modifier',
        ),
        s(
          '毎週~まいしゅう~modifier|勉強します~べんきょうします~predicate',
          'I ~implicit|study~predicate| every week.~modifier',
        ),
      ],
      [
        table(
          'Every ...',
          ['Meaning', 'Japanese and reading'],
          every.map(([en, jp, r]) => [en, c(jp, r)]),
        ),
      ],
      0,
    ),
  );
  for (const [en, jp, r] of [...every, ...durationRows])
    if (!existing.some((e) => e.japanese === jp && e.kind !== 'kanji'))
      push(
        word(
          'time-' + [...jp].map((c) => c.codePointAt(0)!.toString(16)).join('-'),
          'vocabulary',
          jp,
          r,
          en,
          'See the calendar and duration guides. Calendar months use がつ; month durations use かげつ.',
        ),
      );
  for (const [index, row] of relative.entries())
    for (let i = 0; i < 5; i++) {
      const jp = row[1 + i * 2];
      const r = row[2 + i * 2];
      if (!existing.some((e) => e.japanese === jp && e.kind !== 'kanji'))
        push(
          word(
            'relative-' + index + '-' + i,
            'vocabulary',
            jp,
            r,
            [
              ['two days ago', 'yesterday', 'today', 'tomorrow', 'the day after tomorrow'],
              [
                'the week before last',
                'last week',
                'this week',
                'next week',
                'the week after next',
              ],
              [
                'the month before last',
                'last month',
                'this month',
                'next month',
                'the month after next',
              ],
              [
                'the year before last',
                'last year',
                'this year',
                'next year',
                'the year after next',
              ],
            ][index][i],
            'Relative time expressions normally do not take に.',
          ),
        );
    }
  const numberRows = [
    ...largeNumberAnchors.map((r) => [r.value.toLocaleString('en'), r.japanese, r.kana]),
    ['12,345', '一万二千三百四十五', 'いちまんにせんさんびゃくよんじゅうご'],
    ['100,001', '十万一', 'じゅうまんいち'],
    [
      '999,999',
      '九十九万九千九百九十九',
      'きゅうじゅうきゅうまんきゅうせんきゅうひゃくきゅうじゅうきゅう',
    ],
  ];
  const priceSamples = [
    s('一万円です~いちまんえんです~predicate', 'It costs 10,000 yen.~predicate'),
    s('十万円です~じゅうまんえんです~predicate', 'It costs 100,000 yen.~predicate'),
    s('百万円です~ひゃくまんえんです~predicate', 'It costs 1,000,000 yen.~predicate'),
    s(
      '一万二千三百四十五円です~いちまんにせんさんびゃくよんじゅうごえんです~predicate',
      'It costs 12,345 yen.~predicate',
    ),
  ];
  push(
    guide(
      'large-numbers',
      'numbers',
      'Numbers through one million — 十・百・千・万',
      'Japanese large numbers group in units of 10,000 (万), not 1,000. Ten thousand is 一万, one hundred thousand is 十万, and one million is 百万 (100 × 10,000). Build the 万 part, then the thousands, hundreds, tens and units. Say ひゃく and usually せん without いち. In the examples, 円（えん）means yen.',
      priceSamples,
      [
        table(
          'Large number anchors and examples',
          ['Value', 'Japanese and reading'],
          numberRows.map(([n, jp, r]) => [n, c(jp, r)]),
        ),
      ],
      0,
    ),
  );
  for (const [n, jp, r] of numberRows)
    if (!existing.some((e) => e.kind === 'numbers' && e.japanese === jp)) {
      const e = word(
        'number-' + n.replaceAll(',', ''),
        'numbers',
        jp,
        r,
        n,
        'Large numbers group around 万 (10,000). One million is 百万（ひゃくまん）.',
      );
      e.exercise = { prompt: 'Read ' + jp + ' in kana.', answers: [r], explanation: e.note };
      push(e);
    }
  for (const [n, jp, r] of ages)
    if (!existing.some((e) => e.kind === 'numbers' && e.japanese === jp)) {
      const e = word(
        'age-' + n,
        'numbers',
        jp,
        r,
        n + ' years old',
        'Age uses 歳（さい）. Watch 1, 8, 10 and 20.',
      );
      e.exercise = {
        prompt: 'Read ' + jp + ' in kana.',
        answers: [r, ...(r.includes('じゅっ') ? [r.replace('じゅっ', 'じっ')] : [])],
        explanation: e.note,
      };
      push(e);
    }
  const loanGroups = [
    ['v', 'ヴァ ヴィ ヴ ヴェ ヴォ ヴュ', 'va vi vu ve vo vyu'],
    ['w', 'ワ ウィ ウ ウェ ウォ', 'wa wi u we wo'],
    ['f', 'ファ フィ フ フェ フォ フュ', 'fa fi fu fe fo fyu'],
    ['ch', 'チャ チ チュ チェ チョ', 'cha chi chu che cho'],
    ['sh', 'シャ シ シュ シェ ショ', 'sha shi shu she sho'],
    ['j', 'ジャ ジ ジュ ジェ ジョ', 'ja ji ju je jo'],
    ['t', 'ティ トゥ テュ', 'ti tu tyu'],
    ['d', 'ディ ドゥ デュ', 'di du dyu'],
  ];
  const kanaGuide = guide(
    'katakana-sounds',
    'vocabulary',
    'Katakana — special and loanword sounds',
    'Small vowels combine with the preceding katakana as one sound unit: フ + small ァ = ファ (fa). ヴ is vu; ウ is u, not a separate modern “wu” character. ワ / ウィ / ウ / ウェ / ウォ give wa / wi / u / we / wo. Standard chi is チ, shi is シ, ji is ジ; use ティ / トゥ for ti / tu and ディ / ドゥ for di / du. ヴ sounds may be approximated with b sounds by some speakers. ヰ and ヱ are historical characters, not the normal modern spellings of wi / we.',
    [
      s(
        'これ~これ~topic|は~は~particle|ファイルです~ふぁいるです~predicate',
        'This~topic| is a file.~predicate',
      ),
      s(
        'これ~これ~topic|は~は~particle|フォークです~ふぉーくです~predicate',
        'This~topic| is a fork.~predicate',
      ),
      s(
        'これ~これ~topic|は~は~particle|チーズです~ちーずです~predicate',
        'This~topic| is cheese.~predicate',
      ),
      s(
        'これ~これ~topic|は~は~particle|シャツです~しゃつです~predicate',
        'This~topic| is a shirt.~predicate',
      ),
    ],
    [
      table(
        'Read each combination as one unit',
        ['Group', 'Katakana', 'Sounds'],
        loanGroups.map(([en, jp, r]) => [
          en,
          c(
            jp,
            jp
              .normalize('NFKC')
              .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60)),
          ),
          r,
        ]),
      ),
    ],
    1,
  );
  kanaGuide.level = 'Foundation';
  push(kanaGuide);
  for (const [jp, r, romaji] of [
    ['ヴュ', 'ゔゅ', 'vyu'],
    ['フュ', 'ふゅ', 'fyu'],
    ['テュ', 'てゅ', 'tyu'],
    ['デュ', 'でゅ', 'dyu'],
    ['イェ', 'いぇ', 'ye'],
    ['ツァ', 'つぁ', 'tsa'],
    ['ツィ', 'つぃ', 'tsi'],
    ['ツェ', 'つぇ', 'tse'],
    ['ツォ', 'つぉ', 'tso'],
  ])
    if (!existing.some((e) => e.kind === 'kana' && e.japanese === jp))
      push(
        word(
          'kana-' + jp.codePointAt(0)!.toString(16) + '-' + jp.codePointAt(1)!.toString(16),
          'kana',
          jp,
          r,
          romaji + ' sound',
          'Read this combination as one sound unit. The second character is small. See the special katakana comparison guide.',
          romaji,
        ),
      );
  const romanized: Record<string, string> = {
    'study-weekdays': 'nichi / getsu / ka / sui / moku / kin / do',
    'study-kore-sore-are': 'kore / sore / are',
    'study-kono-sono-ano': 'kono / sono / ano',
    'study-particle-e': 'e / he',
    'study-particle-o': 'o / wo',
    'study-particle-wa': 'wa / ha',
    'study-particle-ga': 'ga',
    'study-ages': 'sai / nansai / oikutsu / hatachi',
    'study-ask-name': 'onamae wa nan desu ka',
    'study-ask-job': 'oshigoto wa nan desu ka',
    'study-ask-hobby': 'goshumi wa nan desu ka',
    'study-ask-time': 'ima nanji desu ka',
    'study-every': 'mainichi / maiasa / maiban / maishuu / maitsuki / maitoshi',
    'study-large-numbers': 'juu / jyuu / hyaku / sen / man / hyakuman',
  };
  for (const e of result) if (romanized[e.id]) e.romaji = romanized[e.id];
  return result;
}
