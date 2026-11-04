export type TranslationToken = { text: string; role: string; implicit?: boolean };
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
