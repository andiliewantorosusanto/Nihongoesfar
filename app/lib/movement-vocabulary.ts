import type { Entry } from './content.ts';
import { exercises } from './study-topics.ts';
const words = `何か|なにか|something
誰か|だれか|someone
どこか|どこか|somewhere
時々|ときどき|sometimes
歩く|あるく|walk
徒歩|とほ|on foot
通る|とおる|pass through; pass along
渡る|わたる|cross
走る|はしる|run
飛ぶ|とぶ|fly
乗る|のる|get on; ride
降りる|おりる|get off; get out of a vehicle
出る|でる|leave; go out
入る|はいる|enter
何もありません|なにもありません|There is nothing.`;
export const movementVocabulary: Entry[] = words.split('\n').map((row) => {
  const [japanese, reading, meaning] = row.split('|');
  return {
    id:
      'movement-' +
      Array.from(japanese)
        .map((c) => c.codePointAt(0)!.toString(16))
        .join('-'),
    kind: 'vocabulary',
    title: japanese,
    japanese,
    reading,
    meaning,
    level: 'Beginner',
    topic: 'Movement and expressions',
    tags: ['Movement and expressions'],
    note: '',
    examples: [{ japanese, reading, meaning }],
  };
});
// Each chunk links the Japanese phrase to the same role in its English translation.
function example(jp: string, en: string): Entry['examples'][number] {
  const tokens = jp.split('|').map((part) => {
    const [text, reading, role] = part.split('~');
    return { text, reading, role, wordClass: role === 'particle' ? 'particle' : 'phrase' };
  });
  const translationTokens = en.split('|').map((part) => {
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
function guide(id: string, title: string, note: string, rows: string[][]): Entry {
  const examples = rows.map(([jp, en]) => example(jp, en));
  return {
    id: 'study-' + id,
    kind: 'grammar',
    title,
    japanese: examples[0].japanese,
    reading: examples[0].reading,
    meaning: title,
    level: 'Beginner',
    topic: 'Movement and expressions',
    tags: ['Study guide'],
    note,
    examples,
    exercises: exercises(examples, note, 1),
  };
}
export const movementGuides: Entry[] = [
  guide(
    'nagara',
    'ながら — do one action while doing another',
    'Use verb ます-stem + ながら + main action. Remove ます: 聞きます (ききます) → 聞きながら (ききながら); 食べます (たべます) → 食べながら (たべながら); します → しながら. Both actions normally have the same subject. The action after ながら is the main action and carries tense: 音楽を聞きながら勉強します (おんがくをききながらべんきょうします) means I study while listening to music. Do not attach ながら to the full ます form or the dictionary form. This pattern describes simultaneous actions, rather than one action followed by another (て-form).',
    [
      [
        '音楽を聞きながら~おんがくをききながら~modifier|勉強します~べんきょうします~predicate',
        'I ~implicit|study~predicate| while listening to music~modifier|.~implicit',
      ],
      [
        '歌いながら~うたいながら~modifier|料理します~りょうりします~predicate',
        'I ~implicit|cook~predicate| while singing~modifier|.~implicit',
      ],
      [
        'テレビを見ながら~てれびをみながら~modifier|晩ご飯を食べます~ばんごはんをたべます~predicate',
        'I ~implicit|eat dinner~predicate| while watching television~modifier|.~implicit',
      ],
      [
        'コーヒーを飲みながら~こーひーをのみながら~modifier|本を読みました~ほんをよみました~predicate',
        'I ~implicit|read a book~predicate| while drinking coffee~modifier|.~implicit',
      ],
    ],
  ),

  guide(
    'some-any-none',
    'Something, someone, somewhere; nothing',
    '何か (なにか) means something; 誰か (だれか) means someone; どこか means somewhere. 時々 (ときどき) means sometimes: it is a frequency word, not a question word + か. With a negative predicate, 何も (なにも) means nothing / not anything: 何もありません (なにもありません). 誰もいません (だれもいません) means nobody is here. どこにも行きません (どこにもいきません) means I do not go anywhere. 何も can be read なんにも in colloquial speech.',
    [
      [
        '何か~なにか~object|を~を~particle|食べます~たべます~predicate',
        'I ~implicit|eat~predicate| something~object|.~implicit',
      ],
      [
        '誰か~だれか~topic|が~が~particle|います~います~predicate',
        'Someone~topic| is here~predicate|.~implicit',
      ],
      [
        'どこか~どこか~modifier|に~に~particle|行きます~いきます~predicate',
        'I ~implicit|go~predicate| somewhere~modifier|.~implicit',
      ],
      [
        '何も~なにも~object|ありません~ありません~predicate',
        'There is not~predicate| anything~object|.~implicit',
      ],
    ],
  ),
  guide(
    'movement-routes',
    'Movement: walking, crossing, flying, boarding and leaving',
    '歩いて (あるいて) and 徒歩で (とほで) mean on foot: 学校まで歩いて行きます (がっこうまであるいていきます). Use を for a route traversed: 道を歩く (みちをあるく), 公園を走る (こうえんをはしる), 空を飛ぶ (そらをとぶ), 橋を渡る (はしをわたる), and 道を通る (みちをとおる). 通る means pass through/along; 渡る means cross to the other side. Vehicle + に乗る (にのる) means board/get into; vehicle + を降りる (をおりる) means get off/out. Place + を出る (をでる) means leave a place; place + に入る (にはいる) means enter. 駅で電車を降ります (えきででんしゃをおります): で marks where you get off. 走る and 入る are group 1: 走ります (はしります), 入ります (はいります). 降りる is group 2: 降ります (おります). In-progress forms include 歩いています (あるいています), 走っています (はしっています), and 飛んでいます (とんでいます).',
    [
      [
        '橋~はし~modifier|を~を~particle|渡ります~わたります~predicate',
        'I ~implicit|cross~predicate| the bridge~modifier|.~implicit',
      ],
      [
        '電車~でんしゃ~modifier|に~に~particle|乗ります~のります~predicate',
        'I ~implicit|board~predicate| the train~modifier|.~implicit',
      ],
      [
        'バス~ばす~modifier|を~を~particle|降ります~おります~predicate',
        'I ~implicit|get off~predicate| the bus~modifier|.~implicit',
      ],
      [
        '家~いえ~modifier|を~を~particle|出ます~でます~predicate',
        'I ~implicit|leave~predicate| the house~modifier|.~implicit',
      ],
    ],
  ),
  guide(
    'becoming-narimasu',
    'Becoming: い-adjective → く / な-adjective or noun → に + なります',
    'なります means become; it is the polite form of なる. For an い-adjective, replace final い with く: 寒い→寒くなります (さむい→さむくなります). いい is irregular: よくなります. For a な-adjective or noun, use に: 静かになります (しずかになります), 先生になります (せんせいになります). Do not use な before なります. きれい is a な-adjective despite its final い: きれいになります. These are adjective and noun patterns, not a rule for all nouns ending in い. Compare a change of state なります with a deliberate change します: 部屋をきれいにします (へやをきれいにします) means I make the room clean.',
    [
      [
        '寒く~さむく~modifier|なります~なります~predicate',
        'It ~implicit|becomes~predicate| cold~modifier|.~implicit',
      ],
      [
        '静かに~しずかに~modifier|なります~なります~predicate',
        'It ~implicit|becomes~predicate| quiet~modifier|.~implicit',
      ],
      [
        '先生に~せんせいに~modifier|なります~なります~predicate',
        'I ~implicit|become~predicate| a teacher~modifier|.~implicit',
      ],
      [
        'よく~よく~modifier|なります~なります~predicate',
        'It ~implicit|gets~predicate| better~modifier|.~implicit',
      ],
    ],
  ),
];
