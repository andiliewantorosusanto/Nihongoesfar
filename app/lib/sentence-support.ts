export type TranslationToken = { text: string; role: string; implicit?: boolean };
export type ExampleAlignment = { readings: string[]; english: TranslationToken[] };
const t = (text: string, role: string, implicit = false): TranslationToken => ({
  text,
  role,
  implicit,
});
const impliedI = t('I ', 'implicit', true);
export const sentenceAlignments: Record<string, ExampleAlignment> = {
  desu: {
    readings: ['わたし', 'は', 'がくせいです'],
    english: [t('I', 'topic'), t(' am a student.', 'predicate')],
  },
  'noun-negative': {
    readings: ['わたし', 'は', 'せんせいじゃありません'],
    english: [t('I', 'topic'), t(' am not a teacher.', 'predicate')],
  },
  'noun-past': {
    readings: ['きのう', 'は', 'やすみでした'],
    english: [t('Yesterday', 'topic'), t(' was a day off.', 'predicate')],
  },
  question: {
    readings: ['これ', 'は', 'ほんです', 'か'],
    english: [
      t('Is ', 'predicate'),
      t('this', 'topic'),
      t(' a book', 'predicate'),
      t('?', 'particle'),
    ],
  },
  no: {
    readings: ['これ', 'は', 'わたしの', 'ほんです'],
    english: [
      t('This', 'topic'),
      t(' is ', 'predicate'),
      t('my', 'modifier'),
      t(' book.', 'predicate'),
    ],
  },
  mo: {
    readings: ['わたし', 'も', 'がくせいです'],
    english: [
      t('I', 'topic'),
      t(' am ', 'predicate'),
      t('also', 'particle'),
      t(' a student.', 'predicate'),
    ],
  },
  demonstratives: {
    readings: ['この', 'ほん', 'は', 'おもしろいです'],
    english: [t('This', 'modifier'), t(' book', 'topic'), t(' is interesting.', 'predicate')],
  },
  arimasu: {
    readings: ['つくえ', 'が', 'あります'],
    english: [t('There is ', 'predicate'), t('a desk.', 'subject')],
  },
  imasu: {
    readings: ['ねこ', 'が', 'います'],
    english: [t('There is ', 'predicate'), t('a cat.', 'subject')],
  },
  'existence-negative': {
    readings: ['じかん', 'が', 'ありません'],
    english: [impliedI, t('do not have ', 'predicate'), t('time.', 'subject')],
  },
  location: {
    readings: ['へやに', 'ねこ', 'が', 'います'],
    english: [t('There is ', 'predicate'), t('a cat', 'subject'), t(' in the room.', 'modifier')],
  },
  object: {
    readings: ['みず', 'を', 'のみます'],
    english: [impliedI, t('drink', 'predicate'), t(' water.', 'object')],
  },
  de: {
    readings: ['としょかんで', 'べんきょうします'],
    english: [impliedI, t('study', 'predicate'), t(' at the library.', 'modifier')],
  },
  destination: {
    readings: ['がっこうに', 'いきます'],
    english: [impliedI, t('go', 'predicate'), t(' to school.', 'modifier')],
  },
  'time-ni': {
    readings: ['しちじに', 'おきます'],
    english: [impliedI, t('get up', 'predicate'), t(' at seven.', 'modifier')],
  },
  masu: {
    readings: ['まいにち', 'ほん', 'を', 'よみます'],
    english: [
      impliedI,
      t('read', 'predicate'),
      t(' a book', 'object'),
      t(' every day.', 'modifier'),
    ],
  },
  masen: {
    readings: ['にく', 'を', 'たべません'],
    english: [impliedI, t('do not eat', 'predicate'), t(' meat.', 'object')],
  },
  'verb-past': {
    readings: ['きのう', 'ほん', 'を', 'かいました'],
    english: [
      impliedI,
      t('bought', 'predicate'),
      t(' a book', 'object'),
      t(' yesterday.', 'modifier'),
    ],
  },
  'te-request': {
    readings: ['なまえ', 'を', 'かいてください'],
    english: [t('Please write', 'predicate'), t(' your name.', 'object')],
  },
  'te-imasu': {
    readings: ['いま', 'ほん', 'を', 'よんでいます'],
    english: [
      impliedI,
      t('am reading', 'predicate'),
      t(' a book', 'object'),
      t(' now.', 'modifier'),
    ],
  },
  hoshii: {
    readings: ['わたし', 'は', 'ほん', 'が', 'ほしいです'],
    english: [t('I', 'topic'), t(' want ', 'predicate'), t('a book.', 'subject')],
  },
  tai: {
    readings: ['にほんに', 'いきたいです'],
    english: [impliedI, t('want to go', 'predicate'), t(' to Japan.', 'modifier')],
  },
  suki: {
    readings: ['ねこ', 'が', 'すきです'],
    english: [impliedI, t('like', 'predicate'), t(' cats.', 'subject')],
  },
  'i-adjective': {
    readings: ['この', 'ほん', 'は', 'おもしろいです'],
    english: [t('This', 'modifier'), t(' book', 'topic'), t(' is interesting.', 'predicate')],
  },
  'na-adjective': {
    readings: ['ここ', 'は', 'しずかです'],
    english: [t('It ', 'implicit', true), t('is quiet', 'predicate'), t(' here.', 'topic')],
  },
};
const hira = (s: string) =>
  s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
export type RubyPart = { text: string; reading?: string };
export function rubyParts(text: string, reading: string): RubyPart[] {
  if (!/[一-龯々]/.test(text)) return [{ text }];
  const chunks = text.match(/[一-龯々]+|[^一-龯々]+/gu) || [];
  const kana = hira(reading);
  let pos = 0;
  const parts: RubyPart[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!/[一-龯々]/.test(chunk)) {
      if (!kana.startsWith(hira(chunk), pos)) return [{ text, reading }];
      pos += chunk.length;
      parts.push({ text: chunk });
      continue;
    }
    const next = chunks[i + 1];
    const end = next ? kana.indexOf(hira(next), pos) : kana.length;
    if (end <= pos) return [{ text, reading }];
    parts.push({ text: chunk, reading: reading.slice(pos, end) });
    pos = end;
  }
  return pos === reading.length ? parts : [{ text, reading }];
}

// Authored word readings used when Japanese appears inside English explanations.
const proseWords =
  '私:わたし|学生:がくせい|田中さん:たなかさん|先生:せんせい|本:ほん|時計:とけい|学校:がっこう|車:くるま|母:はは|かばん:かばん|毎日:まいにち|勉強し:べんきょうし|朝:あさ|働き:はたらき|歩き:あるき|夜:よる|水:みず|飲みます:のみます|読みます:よみます|パン:ぱん|食べます:たべます|お茶:おちゃ|図書館:としょかん|勉強します:べんきょうします|家:いえ|行きます:いきます|帰ります:かえります|日本:にほん|七時:しちじ|起きます:おきます|八時:はちじ|九時:くじ|六時:ろくじ|机:つくえ|猫:ねこ|犬:いぬ|部屋:へや|昨日:きのう|休み:やすみ|雨:あめ|飲みません:のみません|読みません:よみません|食べません:たべません|今日:きょう|働きません:はたらきません|読みました:よみました|飲みました:のみました|食べました:たべました|行きました:いきました|面白い:おもしろい|高い:たかい|大きい:おおきい|新しい:あたらしい|静か:しずか|便利:べんり|きれい:きれい|町:まち|好きです:すきです|ほしいです:ほしいです|飲みたいです:のみたいです|読みたいです:よみたいです|食べたいです:たべたいです|行きたいです:いきたいです|読んで:よんで|飲んで:のんで|名前:なまえ|書いて:かいて|食べて:たべて|今:いま|読んでいます:よんでいます|飲んでいます:のんでいます|書いています:かいています|食べています:たべています|何ですか:なんですか|時間:じかん|明日:あした|肉:にく|買います:かいます|買いました:かいました|買いませんでした:かいませんでした|書く:かく|食べる:たべる|読む:よむ|来る:くる|来て:きて|来ます:きます|行く:いく|行って:いって|飲む:のむ|行きたくないです:いきたくないです|行きたい:いきたい|好き:すき|食べ物:たべもの|嫌い:きらい|面白:おもしろ';
const familyProseWords =
  'お父さん:おとうさん|お母さん:おかあさん|お兄さん:おにいさん|お姉さん:おねえさん|弟さん:おとうとさん|妹さん:いもうとさん|祖父:そふ|祖母:そぼ|ご主人:ごしゅじん|奥さん:おくさん|息子さん:むすこさん|娘さん:むすめさん|ご両親:ごりょうしん|ご家族:ごかぞく';
const readingWords = (proseWords + '|' + familyProseWords).split('|').map((s) => {
  const [text, reading] = s.split(':');
  return { text, reading };
});
export function proseReadings(value: string): { text: string; reading: string }[] {
  const parts: { text: string; reading: string }[] = [];
  let rest = value;
  while (rest) {
    const found = readingWords
      .map((word) => ({ word, at: rest.indexOf(word.text) }))
      .filter((x) => x.at >= 0)
      .sort((a, b) => a.at - b.at || b.word.text.length - a.word.text.length)[0];
    if (!found) {
      parts.push({ text: rest, reading: '' });
      break;
    }
    if (found.at) parts.push({ text: rest.slice(0, found.at), reading: '' });
    parts.push(found.word);
    rest = rest.slice(found.at + found.word.text.length);
  }
  return parts;
}
