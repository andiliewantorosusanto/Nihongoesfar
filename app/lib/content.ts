import {sentenceAlignments,type TranslationToken} from './sentence-support.ts';
import compoundData from './compounds.json' with {type:'json'};
export type Entry = {
  id: string; kind: 'kana' | 'kanji' | 'grammar' | 'vocabulary' | 'numbers' | 'adjectives';
  title: string; japanese: string; reading: string; romaji?: string; meaning: string;
  level: string; topic: string; tags: string[]; note: string;
  examples: { japanese: string; reading: string; meaning: string; tokens?: { text: string; role: string; wordClass: string; reading?: string }[]; translationTokens?: TranslationToken[] }[];
  on?: string; kun?: string; compounds?: { japanese: string; reading: string; meaning: string }[];
  exercise?: { prompt: string; answers: string[]; explanation: string; tiles?: string[] };
};
const rows = (text: string) => text.trim().split('\n').map(line => line.split('|'));
const code = (s: string) => Array.from(s).map(c => c.codePointAt(0)!.toString(16)).join('-');
const ex = (japanese: string, reading: string, meaning: string) => ({ japanese, reading, meaning });

const kanaRows = rows(`あ|a
い|i
う|u
え|e
お|o
か|ka
き|ki
く|ku
け|ke
こ|ko
さ|sa
し|shi
す|su
せ|se
そ|so
た|ta
ち|chi
つ|tsu
て|te
と|to
な|na
に|ni
ぬ|nu
ね|ne
の|no
は|ha
ひ|hi
ふ|fu
へ|he
ほ|ho
ま|ma
み|mi
む|mu
め|me
も|mo
や|ya
ゆ|yu
よ|yo
ら|ra
り|ri
る|ru
れ|re
ろ|ro
わ|wa
を|wo
ん|n
が|ga
ぎ|gi
ぐ|gu
げ|ge
ご|go
ざ|za
じ|ji
ず|zu
ぜ|ze
ぞ|zo
だ|da
ぢ|ji
づ|zu
で|de
ど|do
ば|ba
び|bi
ぶ|bu
べ|be
ぼ|bo
ぱ|pa
ぴ|pi
ぷ|pu
ぺ|pe
ぽ|po
ぁ|a
ぃ|i
ぅ|u
ぇ|e
ぉ|o
ゃ|ya
ゅ|yu
ょ|yo
っ|small tsu
ゎ|small wa
ゔ|vu
きゃ|kya
きゅ|kyu
きょ|kyo
しゃ|sha
しゅ|shu
しょ|sho
ちゃ|cha
ちゅ|chu
ちょ|cho
にゃ|nya
にゅ|nyu
にょ|nyo
ひゃ|hya
ひゅ|hyu
ひょ|hyo
みゃ|mya
みゅ|myu
みょ|myo
りゃ|rya
りゅ|ryu
りょ|ryo
ぎゃ|gya
ぎゅ|gyu
ぎょ|gyo
じゃ|ja
じゅ|ju
じょ|jo
びゃ|bya
びゅ|byu
びょ|byo
ぴゃ|pya
ぴゅ|pyu
ぴょ|pyo`);
const kana: Entry[] = [];
for (const script of ['Hiragana', 'Katakana']) {
  for (let n = 0; n < kanaRows.length; n++) {
    const [hira, romaji] = kanaRows[n];
    const japanese = script === 'Hiragana' ? hira : Array.from(hira).map(c => String.fromCodePoint(c.codePointAt(0)! + 0x60)).join('');
    const small = ['ぁ','ぃ','ぅ','ぇ','ぉ','ゃ','ゅ','ょ','っ','ゎ'].includes(hira);
    const combination = hira.length > 1;
    let note = `${script} represents a sound, rather than a meaning. Read this as “${romaji}”.`;
    if (combination) note = `A full-size kana plus small ${script === 'Hiragana' ? 'ゃ, ゅ or ょ' : 'ャ, ュ or ョ'} makes one combined sound (one mora). ${japanese} is “${romaji}”, not two separate full-size sounds.`;
    if (small) note = hira === 'っ' ? 'Small tsu marks a held consonant: きって (kitte, stamp) differs from きて (kite, come). It is not pronounced “tsu” here.' : 'This is a small kana. Size changes how it joins neighboring sounds; compare with the full-size form. Small vowels are especially useful in katakana loanwords.';
    if (hira === 'は') note += ' As the topic particle, は is pronounced wa.';
    if (hira === 'へ') note += ' As the direction particle, へ is pronounced e.';
    if (hira === 'を') note += ' Usually used as the direct-object particle and pronounced o in modern Japanese.';
    if (hira === 'ぢ' || hira === 'づ') note += ' Usually sounds like じ / ず; spelling depends on the word, as in はなぢ and つづく.';
    if (hira === 'ん') note += ' This is one mora. Its exact sound changes with the next sound; before a vowel, romaji may use an apostrophe.';
    if (hira === 'ゔ') note += ' An extension for foreign sounds; katakana ヴ is more usual than hiragana ゔ.';
    kana.push({id:`kana-${code(japanese)}`,kind:'kana',title:japanese,japanese,reading:hira,romaji,meaning:small ? `Small ${romaji.replace('small ','')}` : `${romaji} sound`,level:'Foundation',topic:script,tags:[small?'Small kana':combination?'Combinations':n<46?'Basic kana':'Voiced sounds'],note,examples:[ex(japanese,hira,`${script} reading: ${romaji}`)]});
  }
}
const loanSounds=rows(`ティ|てぃ|ti
ディ|でぃ|di
トゥ|とぅ|tu
ドゥ|どぅ|du
ファ|ふぁ|fa
フィ|ふぃ|fi
フェ|ふぇ|fe
フォ|ふぉ|fo
ウィ|うぃ|wi
ウェ|うぇ|we
ウォ|うぉ|wo
ヴァ|ゔぁ|va
ヴィ|ゔぃ|vi
ヴェ|ゔぇ|ve
ヴォ|ゔぉ|vo
シェ|しぇ|she
チェ|ちぇ|che
ジェ|じぇ|je
ヵ|か|small ka
ヶ|け|small ke`);
kana.push(...loanSounds.map(([japanese,reading,romaji]):Entry=>({id:`kana-${code(japanese)}`,kind:'kana',title:japanese,japanese,reading,romaji,meaning:`${romaji} sound`,level:'Foundation',topic:'Katakana',tags:['Loanword sounds'],note:japanese==='ヶ'?'Small ヶ appears in counters and place names; 一ヶ月 is read いっかげつ. Its shape resembles ケ but does not always represent the ke sound. Learn its reading in the whole word.':japanese==='ヵ'?'Small ヵ is used in spellings such as 一ヵ月 (いっかげつ). It is not the same size as full カ.':'Katakana uses small vowels to represent additional sounds in loanwords. Read the combination as one sound unit rather than separate full-size kana.',examples:[ex(japanese,reading,`Katakana reading: ${romaji}`)]})));
kana.push({id:'kana-long-vowels',kind:'kana',title:'Long vowels',japanese:'おばあさん・コーヒー',reading:'おばあさん・こーひー',romaji:'obaasan / kōhī',meaning:'Hold the vowel for an extra beat',level:'Foundation',topic:'Reading rules',tags:['Long vowels'],note:'Vowel length can change meaning. Hiragana often repeats あ, い or う; おう is usually a long o sound and えい often a long e sound. Learn each word’s spelling. Katakana usually uses ー: コーヒー. Compare おばさん (aunt) and おばあさん (grandmother).',examples:[ex('おばあさん','おばあさん','grandmother'),ex('コーヒー','こーひー','coffee')]});

const kanjiRows = rows(`一|one|イチ、イツ|ひと|一つ|ひとつ|one thing
二|two|ニ|ふた|二つ|ふたつ|two things
三|three|サン|み|三つ|みっつ|three things
四|four|シ|よ、よん|四月|しがつ|April
五|five|ゴ|いつ|五つ|いつつ|five things
六|six|ロク|む|六日|むいか|sixth day
七|seven|シチ|なな、なの|七月|しちがつ|July
八|eight|ハチ|や|八日|ようか|eighth day
九|nine|キュウ、ク|ここの|九月|くがつ|September
十|ten|ジュウ、ジッ|とお、と|十日|とおか|tenth day
百|hundred|ヒャク|—|百円|ひゃくえん|one hundred yen
千|thousand|セン|ち|千円|せんえん|one thousand yen
万|ten thousand|マン、バン|—|一万円|いちまんえん|ten thousand yen
円|yen; circle|エン|まる|百円|ひゃくえん|one hundred yen
日|day; sun|ニチ、ジツ|ひ、か|日曜日|にちようび|Sunday
月|month; moon|ゲツ、ガツ|つき|月曜日|げつようび|Monday
火|fire|カ|ひ|火曜日|かようび|Tuesday
水|water|スイ|みず|水曜日|すいようび|Wednesday
木|tree; wood|モク、ボク|き、こ|木曜日|もくようび|Thursday
金|gold; money|キン、コン|かね、かな|金曜日|きんようび|Friday
土|soil; earth|ド、ト|つち|土曜日|どようび|Saturday
年|year|ネン|とし|今年|ことし|this year
時|time; hour|ジ|とき|時間|じかん|time; duration
分|minute; part|ブン、フン、ブ|わか|五分|ごふん|five minutes
半|half|ハン|なか|三時半|さんじはん|half past three
今|now|コン、キン|いま|今日|きょう|today
午|noon|ゴ|—|午前|ごぜん|a.m.
前|before; front|ゼン|まえ|名前|なまえ|name
後|after; behind|ゴ、コウ|あと、うし、のち|午後|ごご|p.m.
毎|every|マイ|—|毎日|まいにち|every day
週|week|シュウ|—|今週|こんしゅう|this week
曜|day of the week|ヨウ|—|何曜日|なんようび|what day of the week
人|person|ジン、ニン|ひと|日本人|にほんじん|Japanese person
男|man; male|ダン、ナン|おとこ|男の子|おとこのこ|boy
女|woman; female|ジョ、ニョ|おんな、め|女の子|おんなのこ|girl
子|child|シ、ス|こ|子供|こども|child
父|father|フ|ちち|父母|ふぼ|father and mother
母|mother|ボ|はは|母親|ははおや|mother
友|friend|ユウ|とも|友達|ともだち|friend
先|ahead; previous|セン|さき|先生|せんせい|teacher
生|life; birth|セイ、ショウ|い、う、なま|学生|がくせい|student
学|study; learning|ガク|まな|学校|がっこう|school
校|school|コウ|—|学校|がっこう|school
本|book; origin|ホン|もと|日本|にほん|Japan
語|language; word|ゴ|かた|日本語|にほんご|Japanese language
文|sentence; writing|ブン、モン|ふみ|文字|もじ|written character
字|character; letter|ジ|あざ|漢字|かんじ|kanji
名|name|メイ、ミョウ|な|名前|なまえ|name
何|what|カ|なに、なん|何時|なんじ|what time
私|I; private|シ|わたし、わたくし|私立|しりつ|private (institution)
大|big|ダイ、タイ|おお|大学|だいがく|university
小|small|ショウ|ちい、こ、お|小学校|しょうがっこう|elementary school
中|middle; inside|チュウ|なか|中国|ちゅうごく|China
上|up; above|ジョウ|うえ、あ、のぼ|上手|じょうず|skillful
下|down; below|カ、ゲ|した、さ、くだ、お|地下鉄|ちかてつ|subway
左|left|サ|ひだり|左右|さゆう|left and right
右|right|ウ、ユウ|みぎ|右手|みぎて|right hand
東|east|トウ|ひがし|東京|とうきょう|Tokyo
西|west|セイ、サイ|にし|西口|にしぐち|west exit
南|south|ナン|みなみ|南口|みなみぐち|south exit
北|north|ホク|きた|北口|きたぐち|north exit
外|outside|ガイ、ゲ|そと、ほか、はず|外国|がいこく|foreign country
国|country|コク|くに|外国人|がいこくじん|foreign person
山|mountain|サン|やま|富士山|ふじさん|Mount Fuji
川|river|セン|かわ|川口|かわぐち|river mouth; Kawaguchi
田|rice field|デン|た|田中|たなか|Tanaka (surname)
天|sky; heaven|テン|あめ、あま|天気|てんき|weather
気|spirit; air|キ、ケ|—|元気|げんき|healthy; energetic
雨|rain|ウ|あめ、あま|雨天|うてん|rainy weather
電|electricity|デン|—|電車|でんしゃ|train
車|vehicle; car|シャ|くるま|自動車|じどうしゃ|automobile
駅|station|エキ|—|駅前|えきまえ|in front of the station
店|shop|テン|みせ|店員|てんいん|shop assistant
社|company; shrine|シャ|やしろ|会社|かいしゃ|company
会|meet; association|カイ、エ|あ|会社|かいしゃ|company
行|go|コウ、ギョウ|い、ゆ、おこな|銀行|ぎんこう|bank
来|come|ライ|く、き、こ|来年|らいねん|next year
帰|return|キ|かえ|帰国|きこく|return to one's country
入|enter|ニュウ|はい、い|入口|いりぐち|entrance
出|exit; go out|シュツ、スイ|で、だ|出口|でぐち|exit
見|see|ケン|み|見学|けんがく|observation visit
聞|hear; ask|ブン、モン|き|新聞|しんぶん|newspaper
読|read|ドク、トク、トウ|よ|読書|どくしょ|reading books
書|write|ショ|か|図書館|としょかん|library
話|speak; story|ワ|はな、はなし|電話|でんわ|telephone
食|eat; food|ショク、ジキ|た、く|食事|しょくじ|meal
飲|drink|イン|の|飲み物|のみもの|drink; beverage
買|buy|バイ|か|買い物|かいもの|shopping
休|rest|キュウ|やす|休日|きゅうじつ|day off
立|stand|リツ、リュウ|た|国立|こくりつ|national (institution)
手|hand|シュ|て、た|手紙|てがみ|letter
足|foot; enough|ソク|あし、た|足音|あしおと|footsteps
目|eye|モク、ボク|め、ま|目薬|めぐすり|eye drops
耳|ear|ジ|みみ|耳鼻科|じびか|ear, nose and throat department
口|mouth|コウ、ク|くち|入口|いりぐち|entrance
力|power|リョク、リキ|ちから|力持ち|ちからもち|strong person
白|white|ハク、ビャク|しろ、しら|白い|しろい|white
高|high; expensive|コウ|たか|高校|こうこう|high school
安|inexpensive; peaceful|アン|やす|安全|あんぜん|safety
新|new|シン|あたら、あら、にい|新聞|しんぶん|newspaper`);
const kanji: Entry[] = kanjiRows.map(([japanese,meaning,on,kun,word,reading,wordMeaning]) => ({
 id:`kanji-${code(japanese)}`,kind:'kanji',title:japanese,japanese,reading,meaning,level:'N5',topic:'Beginner kanji',tags:['Kanji','Compounds'],on,kun,
 note:'Readings change with the word. On-readings are shown in katakana; kun-reading stems are shown in hiragana (add the word’s okurigana). These are selected common readings, not an exhaustive dictionary entry. Reading practice uses whole words and compounds so you learn each reading in context.',
 examples:[ex(word,reading,wordMeaning)],compounds:compoundData.characters[japanese as keyof typeof compoundData.characters]||[]
}));

const vocabularyRows = rows(`places|学校|がっこう|school
places|大学|だいがく|university
places|教室|きょうしつ|classroom
places|図書館|としょかん|library
places|駅|えき|station
places|空港|くうこう|airport
places|銀行|ぎんこう|bank
places|郵便局|ゆうびんきょく|post office
places|病院|びょういん|hospital
places|公園|こうえん|park
places|店|みせ|shop
places|本屋|ほんや|bookshop
places|花屋|はなや|flower shop
places|レストラン|れすとらん|restaurant
places|喫茶店|きっさてん|coffee shop
places|スーパー|すーぱー|supermarket
places|コンビニ|こんびに|convenience store
places|デパート|でぱーと|department store
places|ホテル|ほてる|hotel
places|家|いえ|house; home
places|部屋|へや|room
places|台所|だいどころ|kitchen
places|玄関|げんかん|entrance hall
places|トイレ|といれ|toilet; restroom
places|お風呂|おふろ|bath
places|会社|かいしゃ|company
places|食堂|しょくどう|dining hall
places|映画館|えいがかん|cinema
places|美術館|びじゅつかん|art museum
places|海|うみ|sea
places|山|やま|mountain
places|川|かわ|river
places|町|まち|town
places|村|むら|village
places|国|くに|country
places|日本|にほん|Japan
places|入口|いりぐち|entrance
places|出口|でぐち|exit
places|駐車場|ちゅうしゃじょう|car park
places|交番|こうばん|police box
food|ご飯|ごはん|cooked rice; meal
food|パン|ぱん|bread
food|卵|たまご|egg
food|肉|にく|meat
food|魚|さかな|fish
food|野菜|やさい|vegetables
food|果物|くだもの|fruit
food|りんご|りんご|apple
food|みかん|みかん|mandarin orange
food|バナナ|ばなな|banana
food|いちご|いちご|strawberry
food|水|みず|water
food|お茶|おちゃ|tea
food|紅茶|こうちゃ|black tea
food|コーヒー|こーひー|coffee
food|牛乳|ぎゅうにゅう|milk
food|ジュース|じゅーす|juice
food|ビール|びーる|beer
food|お酒|おさけ|alcohol; sake
food|砂糖|さとう|sugar
food|塩|しお|salt
food|醤油|しょうゆ|soy sauce
food|味噌|みそ|miso
food|スープ|すーぷ|soup
food|サラダ|さらだ|salad
food|寿司|すし|sushi
food|うどん|うどん|udon noodles
food|そば|そば|soba noodles
food|ラーメン|らーめん|ramen
food|カレー|かれー|curry
food|弁当|べんとう|boxed meal
food|おにぎり|おにぎり|rice ball
food|ケーキ|けーき|cake
food|アイスクリーム|あいすくりーむ|ice cream
food|お菓子|おかし|snacks; sweets
food|チーズ|ちーず|cheese
food|バター|ばたー|butter
food|鶏肉|とりにく|chicken meat
food|豚肉|ぶたにく|pork
food|牛肉|ぎゅうにく|beef
people|先生|せんせい|teacher
people|学生|がくせい|student
people|友達|ともだち|friend
people|家族|かぞく|family
people|父|ちち|my father
people|母|はは|my mother
people|お父さん|おとうさん|father (polite; address)
people|お母さん|おかあさん|mother (polite; address)
people|兄|あに|my older brother
people|姉|あね|my older sister
people|弟|おとうと|younger brother
people|妹|いもうと|younger sister
people|子供|こども|child
people|男の人|おとこのひと|man
people|女の人|おんなのひと|woman
people|医者|いしゃ|doctor
people|会社員|かいしゃいん|company employee
people|店員|てんいん|shop assistant
food|料理|りょうり|cooking; cuisine
daily life|仕事|しごと|work; job
things|本|ほん|book
things|ノート|のーと|notebook
things|辞書|じしょ|dictionary
things|新聞|しんぶん|newspaper
things|雑誌|ざっし|magazine
things|鉛筆|えんぴつ|pencil
things|ペン|ぺん|pen
things|消しゴム|けしごむ|eraser
things|紙|かみ|paper
things|手紙|てがみ|letter
things|写真|しゃしん|photograph
things|机|つくえ|desk
things|椅子|いす|chair
things|時計|とけい|clock; watch
things|電話|でんわ|telephone
things|携帯電話|けいたいでんわ|mobile phone
things|パソコン|ぱそこん|personal computer
things|テレビ|てれび|television
things|かばん|かばん|bag
things|財布|さいふ|wallet
things|鍵|かぎ|key
things|傘|かさ|umbrella
things|靴|くつ|shoes
things|服|ふく|clothes
things|帽子|ぼうし|hat
things|眼鏡|めがね|glasses
things|車|くるま|car
things|自転車|じてんしゃ|bicycle
things|電車|でんしゃ|train
things|バス|ばす|bus
things|切符|きっぷ|ticket
things|お金|おかね|money
things|地図|ちず|map
things|窓|まど|window
things|ドア|どあ|door
things|花|はな|flower
things|木|き|tree
things|犬|いぬ|dog
things|猫|ねこ|cat
things|鳥|とり|bird
nature|天気|てんき|weather
nature|雨|あめ|rain
nature|雪|ゆき|snow
nature|風|かぜ|wind
nature|空|そら|sky
nature|春|はる|spring
nature|夏|なつ|summer
nature|秋|あき|autumn
nature|冬|ふゆ|winter
nature|季節|きせつ|season
body|手|て|hand
body|足|あし|foot; leg
body|目|め|eye
body|耳|みみ|ear
body|口|くち|mouth
body|鼻|はな|nose
body|頭|あたま|head
body|顔|かお|face
body|体|からだ|body
body|名前|なまえ|name
`);
const vocabulary: Entry[] = vocabularyRows.map(([topic,japanese,reading,meaning]) => {
 const place = topic === 'places';
 const person=topic==='people' && japanese!=='家族';
 const prefix=place?'ここは':person?'あの人は':'これは';
 const readingPrefix=place?'ここは':person?'あのひとは':'これは';
 let jp = `${prefix}${japanese}です。`;
 let rp = `${readingPrefix}${reading}です。`;
 const englishNoun=meaning.split(';')[0];
 const uncountable=['Japan','water','tea','black tea','coffee','milk','juice','beer','alcohol','sugar','salt','soy sauce','miso','soup','salad','sushi','udon noodles','soba noodles','ramen','curry','ice cream','snacks','cheese','butter','chicken meat','pork','beef','cooking','bread','cooked rice','meat','fish','vegetables','fruit','paper','glasses','clothes','shoes','money','weather','rain','snow','wind','spring','summer','autumn','winter','work'];
 const article=uncountable.includes(englishNoun)||englishNoun.startsWith('my ')?'':/^[aeiou]/i.test(englishNoun)?'an ':'a ';
 let english=`${person?'That person is':'This is'} ${article}${englishNoun}.`;
 if(japanese==='家族'){jp='これは家族の写真です。';rp='これはかぞくのしゃしんです。';english='This is a photo of my family.';}
 if(japanese==='お父さん'){jp='お父さん、元気ですか。';rp='おとうさん、げんきですか。';english='Dad, how are you?';}
 if(japanese==='お母さん'){jp='お母さん、元気ですか。';rp='おかあさん、げんきですか。';english='Mom, how are you?';}
 return {id:`vocabulary-${code(japanese)}`,kind:'vocabulary',title:japanese,japanese,reading,meaning,level:'N5',topic:topic[0].toUpperCase()+topic.slice(1),tags:[topic,'Noun'],note:topic==='people'?'Use family terms according to who you are talking about. 父 / 母 refer to your own parents when speaking to outsiders; お父さん / お母さん also serve as forms of address.':'Learn the spelling and reading together. In practice, readings are entered in hiragana; English meanings can be recalled separately.',examples:[ex(jp,rp,english)]};
});
const timeWords=rows(`今日|きょう|today|今日は休みです。|きょうはやすみです。|Today is a day off.
昨日|きのう|yesterday|昨日は休みでした。|きのうはやすみでした。|Yesterday was a day off.
明日|あした|tomorrow|明日、学校に行きます。|あした、がっこうにいきます。|I will go to school tomorrow.
一昨日|おととい|the day before yesterday|一昨日、本を買いました。|おととい、ほんをかいました。|I bought a book the day before yesterday.
明後日|あさって|the day after tomorrow|明後日、友達に会います。|あさって、ともだちにあいます。|I will meet a friend the day after tomorrow.
今朝|けさ|this morning|今朝、パンを食べました。|けさ、ぱんをたべました。|I ate bread this morning.
今晩|こんばん|tonight|今晩、映画を見ます。|こんばん、えいがをみます。|I will watch a movie tonight.
朝|あさ|morning|朝、コーヒーを飲みます。|あさ、こーひーをのみます。|I drink coffee in the morning.
昼|ひる|daytime; noon|昼にご飯を食べます。|ひるにごはんをたべます。|I eat a meal at noon.
夜|よる|night|夜、本を読みます。|よる、ほんをよみます。|I read a book at night.
毎日|まいにち|every day|毎日、日本語を勉強します。|まいにち、にほんごをべんきょうします。|I study Japanese every day.
毎朝|まいあさ|every morning|毎朝、水を飲みます。|まいあさ、みずをのみます。|I drink water every morning.
毎晩|まいばん|every evening|毎晩、本を読みます。|まいばん、ほんをよみます。|I read a book every evening.
今週|こんしゅう|this week|今週は忙しいです。|こんしゅうはいそがしいです。|I am busy this week.
先週|せんしゅう|last week|先週、京都に行きました。|せんしゅう、きょうとにいきました。|I went to Kyoto last week.
来週|らいしゅう|next week|来週、東京に行きます。|らいしゅう、とうきょうにいきます。|I will go to Tokyo next week.
今月|こんげつ|this month|今月は忙しいです。|こんげつはいそがしいです。|I am busy this month.
先月|せんげつ|last month|先月、本を買いました。|せんげつ、ほんをかいました。|I bought a book last month.
来月|らいげつ|next month|来月、日本に行きます。|らいげつ、にほんにいきます。|I will go to Japan next month.
今年|ことし|this year|今年、日本語を勉強します。|ことし、にほんごをべんきょうします。|I am studying Japanese this year.
去年|きょねん|last year|去年、日本に行きました。|きょねん、にほんにいきました。|I went to Japan last year.
来年|らいねん|next year|来年、日本に行きます。|らいねん、にほんにいきます。|I will go to Japan next year.
時間|じかん|time; duration|時間があります。|じかんがあります。|I have time.
午前|ごぜん|a.m.|午前九時に始まります。|ごぜんくじにはじまります。|It starts at 9 a.m.
午後|ごご|p.m.|午後三時に帰ります。|ごごさんじにかえります。|I go home at 3 p.m.
週末|しゅうまつ|weekend|週末、休みます。|しゅうまつ、やすみます。|I rest at the weekend.
誕生日|たんじょうび|birthday|今日は誕生日です。|きょうはたんじょうびです。|Today is my birthday.
休み|やすみ|rest; day off|明日は休みです。|あしたはやすみです。|Tomorrow is a day off.
昼休み|ひるやすみ|lunch break|昼休みに本を読みます。|ひるやすみにほんをよみます。|I read during the lunch break.
今|いま|now|今、勉強しています。|いま、べんきょうしています。|I am studying now.`);
vocabulary.push(...timeWords.map(([japanese,reading,meaning,jp,rp,en]):Entry=>({id:`vocabulary-${code(japanese)}`,kind:'vocabulary',title:japanese,japanese,reading,meaning,level:'N5',topic:'Time',tags:['Time'],note:'Relative time words such as 今日, 明日 and 毎日 usually do not take the time particle に. Specific clock times usually do.',examples:[ex(jp,rp,en)]})));
const actionWords=rows(`行く|いく|go|学校に行きます。|がっこうにいきます。|I go to school.
来る|くる|come|友達が来ます。|ともだちがきます。|A friend is coming.
帰る|かえる|return home|家に帰ります。|いえにかえります。|I go home.
食べる|たべる|eat|パンを食べます。|ぱんをたべます。|I eat bread.
飲む|のむ|drink|水を飲みます。|みずをのみます。|I drink water.
見る|みる|see; watch|映画を見ます。|えいがをみます。|I watch a movie.
聞く|きく|listen; ask|音楽を聞きます。|おんがくをききます。|I listen to music.
読む|よむ|read|本を読みます。|ほんをよみます。|I read a book.
書く|かく|write|名前を書きます。|なまえをかきます。|I write my name.
話す|はなす|speak|日本語を話します。|にほんごをはなします。|I speak Japanese.
買う|かう|buy|本を買います。|ほんをかいます。|I buy a book.
休む|やすむ|rest; take time off|日曜日に休みます。|にちようびにやすみます。|I rest on Sunday.
起きる|おきる|wake up; get up|七時に起きます。|しちじにおきます。|I get up at seven.
寝る|ねる|sleep; go to bed|十時に寝ます。|じゅうじにねます。|I go to bed at ten.
する|する|do|勉強をします。|べんきょうをします。|I study.
勉強する|べんきょうする|study|日本語を勉強します。|にほんごをべんきょうします。|I study Japanese.
働く|はたらく|work|銀行で働きます。|ぎんこうではたらきます。|I work at a bank.
会う|あう|meet|友達に会います。|ともだちにあいます。|I meet a friend.
歩く|あるく|walk|公園を歩きます。|こうえんをあるきます。|I walk through the park.
待つ|まつ|wait|ここで待ちます。|ここでまちます。|I wait here.`);
vocabulary.push(...actionWords.map(([japanese,reading,meaning,jp,rp,en]):Entry=>({id:`vocabulary-${code(japanese)}`,kind:'vocabulary',title:japanese,japanese,reading,meaning,level:'N5',topic:'Daily actions',tags:['Verb'],note:'The headword is the dictionary form. The example uses the polite ます form. Verb endings change with tense and politeness; this is different from noun + です.',examples:[ex(jp,rp,en)]})));

function grammar(id:string,title:string,reading:string,meaning:string,note:string,parts:string,prompt:string,answers:string[],tiles?:string[]):Entry {
 const tokens = parts.split('|').map(p=>{const [text,role,wordClass]=p.split('~'); return {text,role,wordClass,reading:sentenceAlignments[id]?.readings[parts.split('|').indexOf(p)]};});
 const japanese=tokens.map(t=>t.text).join('')+'。';
 return {id:`grammar-${id}`,kind:'grammar',title,japanese,reading,meaning,level:'N5',topic:'Sentence building',tags:['Grammar',id],note,examples:[{japanese,reading,meaning,tokens,translationTokens:sentenceAlignments[id]?.english}],exercise:{prompt,answers,explanation:note,tiles}};
}
const grammarLessons:Entry[] = [
 grammar('desu','A は B です','わたしはがくせいです。','I am a student.','は marks the topic (pronounced wa). A noun followed by です makes a polite statement. Japanese often leaves out an understood topic; は does not automatically mean the grammatical subject.','私~topic~pronoun|は~particle~particle|学生です~predicate~noun + copula','Build: “I am a student.” Start with 私.',['私は学生です','わたしはがくせいです'],['私','は','学生','です']),
 grammar('noun-negative','Noun negation: じゃありません','わたしはせんせいじゃありません。','I am not a teacher.','For noun predicates, replace です with じゃありません (polite) or ではありません (more formal). じゃないです is also common polite speech. Do not use plain ありません directly after a noun to mean “is not”.','私~topic~pronoun|は~particle~particle|先生じゃありません~predicate~noun + negative copula','Build: “I am not a teacher.” Start with 私.',['私は先生じゃありません','私は先生ではありません','私は先生じゃないです','わたしはせんせいじゃありません','わたしはせんせいではありません','わたしはせんせいじゃないです'],['私','は','先生','じゃありません']),
 grammar('noun-past','Noun past: でした','きのうはやすみでした。','Yesterday was a day off.','Noun + でした is the polite past of noun + です. Negative past: じゃありませんでした / ではありませんでした. This noun pattern is different from an い-adjective past ending in かった.','昨日~topic~time noun|は~particle~particle|休みでした~predicate~noun + past copula','Build: “Yesterday was a day off.”',['昨日は休みでした','きのうはやすみでした'],['昨日','は','休み','でした']),
 grammar('question','Questions with か','これはほんですか。','Is this a book?','Add か to a polite statement to ask a question. A question mark is optional. Answer with はい / いいえ and the relevant predicate. 何ですか asks what something is.','これ~topic~demonstrative pronoun|は~particle~particle|本です~predicate~noun + copula|か~particle~question particle','Build: “Is this a book?”',['これは本ですか','これはほんですか'],['これ','は','本','です','か']),
 grammar('no','Possession and connection: の','これはわたしのほんです。','This is my book.','Noun A + の + noun B links the nouns. It may express ownership (私の本), affiliation (学校の先生), or another relationship. の follows the possessor, unlike English apostrophe placement.','これ~topic~demonstrative pronoun|は~particle~particle|私の~modifier~pronoun + particle|本です~predicate~noun + copula','Build: “This is my book.”',['これは私の本です','これはわたしのほんです'],['これ','は','私','の','本','です']),
 grammar('mo','Also: も','わたしもがくせいです。','I am also a student.','も means “also / too” and often replaces は, が or を in the same position. 私も学生です adds me to a group of students already mentioned.','私~topic~pronoun|も~particle~additive particle|学生です~predicate~noun + copula','Build: “I am also a student.”',['私も学生です','わたしもがくせいです'],['私','も','学生','です']),
 grammar('demonstratives','これ・それ・あれ and この','このほんはおもしろいです。','This book is interesting.','これ stands alone: これは本です. この must come before a noun: この本. それ / その refer to something near the listener or already mentioned; あれ / あの are distant from both speakers.','この~modifier~demonstrative determiner|本~topic~noun|は~particle~particle|面白いです~predicate~i-adjective + polite ending','Build: “This book is interesting.” Start with この本.',['この本は面白いです','この本はおもしろいです','このほんはおもしろいです'],['この','本','は','面白い','です']),
 grammar('arimasu','Things exist: あります','つくえがあります。','There is a desk.','Use あります for things and plants. が marks what exists. The existence pattern can also express possession: 時間があります means “I have time”. This is an existence verb, not the negative copula in じゃありません.','机~subject~noun|が~particle~subject particle|あります~predicate~existence verb','Build: “There is a desk.”',['机があります','つくえがあります'],['机','が','あります']),
 grammar('imasu','People and animals: います','ねこがいます。','There is a cat.','Use います for people and animals. Compare 本があります (there is a book) and 猫がいます (there is a cat). います is also used with verb て-forms, but that is a different construction.','猫~subject~noun|が~particle~subject particle|います~predicate~animate existence verb','Build: “There is a cat.”',['猫がいます','ねこがいます'],['猫','が','います']),
 grammar('existence-negative','Negative existence: ありません・いません','じかんがありません。','I do not have time.','The negative of あります is ありません; the negative of います is いません. 時間がありません means there is no time / I do not have time. 私は学生じゃありません instead negates the noun predicate “student”.','時間~subject~noun|が~particle~subject particle|ありません~predicate~negative existence verb','Build: “I do not have time.” Use 時間が.',['時間がありません','じかんがありません'],['時間','が','ありません']),
 grammar('location','Location of existence: に','へやにねこがいます。','There is a cat in the room.','Place + に marks where something exists with あります / います. Place + で instead marks where an action happens. For describing an already-known cat: 猫は部屋にいます.','部屋に~modifier~place noun + location particle|猫~subject~noun|が~particle~subject particle|います~predicate~existence verb','Build: “There is a cat in the room.” Start with 部屋に.',['部屋に猫がいます','へやにねこがいます'],['部屋','に','猫','が','います']),
 grammar('object','Direct object: を','みずをのみます。','I drink water.','を marks the direct object of many action verbs and is pronounced o. The person doing the action can be omitted when clear. 水を飲みます is a verb sentence; 水です is a noun sentence.','水~object~noun|を~particle~object particle|飲みます~predicate~verb','Build: “I drink water.” Leave out 私.',['水を飲みます','みずをのみます'],['水','を','飲みます']),
 grammar('de','Action place and means: で','としょかんでべんきょうします。','I study at the library.','で marks the place where an action occurs. It also marks means: バスで行きます (go by bus). Use に for a destination or the location of existence, not で.','図書館で~modifier~place noun + particle|勉強します~predicate~verb','Build: “I study at the library.”',['図書館で勉強します','としょかんでべんきょうします'],['図書館','で','勉強します']),
 grammar('destination','Destinations: に・へ','がっこうにいきます。','I go to school.','に marks a destination with 行きます / 来ます / 帰ります. へ emphasizes direction and is pronounced e. 学校に行きます and 学校へ行きます are both natural here.','学校に~modifier~destination noun + particle|行きます~predicate~verb','Build: “I go to school.”',['学校に行きます','学校へ行きます','がっこうにいきます','がっこうへいきます'],['学校','に','行きます']),
 grammar('time-ni','Specific times: に','しちじにおきます。','I get up at seven.','Use に after a specific clock time: 七時に. It is usually omitted after relative times such as 今日, 明日 and 毎日. Seven o’clock is commonly しちじ; four o’clock is よじ and nine o’clock is くじ.','七時に~modifier~time noun + particle|起きます~predicate~verb','Fill the missing particle: 七時 __ 起きます。',['に']),
 grammar('masu','Polite non-past: ます','まいにちほんをよみます。','I read a book every day.','ます is a polite verb ending. It describes habits or future actions depending on context. It does not by itself mean an action is happening right now. Learn each verb’s ます form alongside its dictionary form.','毎日~modifier~time noun|本~object~noun|を~particle~object particle|読みます~predicate~verb','Build: “I read a book every day.” Start with 毎日.',['毎日本を読みます','まいにちほんをよみます'],['毎日','本','を','読みます']),
 grammar('masen','Polite verb negative: ません','にくをたべません。','I do not eat meat.','Replace ます with ません for a polite non-past negative: 食べます → 食べません. Do not add じゃありません to the dictionary form of a verb. 食べません may mean a habit or a future choice in context.','肉~object~noun|を~particle~object particle|食べません~predicate~negative verb','Build: “I do not eat meat.”',['肉を食べません','にくをたべません'],['肉','を','食べません']),
 grammar('verb-past','Polite verb past','きのうほんをかいました。','I bought a book yesterday.','Replace ます with ました for past affirmative and with ませんでした for past negative: 買います → 買いました / 買いませんでした. Noun and adjective past forms follow other patterns.','昨日~modifier~time noun|本~object~noun|を~particle~object particle|買いました~predicate~past verb','Build: “I bought a book yesterday.” Start with 昨日.',['昨日本を買いました','きのうほんをかいました'],['昨日','本','を','買いました']),
 grammar('te-request','Requests: てください','なまえをかいてください。','Please write your name.','Verb て-form + ください makes a request. 書く becomes 書いて. て-form changes depend on the verb group: 食べる→食べて, 読む→読んで, する→して, 来る→来て; 行く is exceptional: 行って.','名前~object~noun|を~particle~object particle|書いてください~predicate~verb + request expression','Build: “Please write your name.”',['名前を書いてください','なまえをかいてください'],['名前','を','書いて','ください']),
 grammar('te-imasu','Ongoing actions: ています','いまほんをよんでいます。','I am reading a book now.','Verb て-form + います often describes an ongoing action: 読んでいます. It can also describe a resulting state with some verbs, so it is not always an exact equivalent of English “-ing”.','今~modifier~time noun|本~object~noun|を~particle~object particle|読んでいます~predicate~verb + auxiliary','Build: “I am reading a book now.” Start with 今.',['今本を読んでいます','いまほんをよんでいます'],['今','本','を','読んで','います']),
 grammar('hoshii','Want a thing: ほしい','わたしはほんがほしいです。','I want a book.','ほしい is an い-adjective, not a verb. A common beginner pattern is 私は noun がほしいです. Its negative is ほしくないです. Use verb stem + たい for wanting to do an action. Direct statements normally describe the speaker’s own desire.','私~topic~pronoun|は~particle~topic particle|本~subject~noun|が~particle~subject particle|ほしいです~predicate~i-adjective + polite ending','Build: “I want a book.” Start with 私は.',['私は本がほしいです','私は本が欲しいです','わたしはほんがほしいです'],['私','は','本','が','ほしい','です']),
 grammar('tai','Want to do: たい','にほんにいきたいです。','I want to go to Japan.','Attach たい to the ます stem: 行きます → 行きたいです. The resulting expression inflects like an い-adjective: 行きたくないです. Use ほしい for a desired thing.','日本に~modifier~destination noun + particle|行きたいです~predicate~verb stem + desire adjective','Build: “I want to go to Japan.”',['日本に行きたいです','日本へ行きたいです','にほんにいきたいです','にほんへいきたいです'],['日本','に','行きたい','です']),
 grammar('suki','Likes: 好きです','ねこがすきです。','I like cats.','好き is a な-adjective, not a verb. Use noun が好きです to say what you like. Before another noun, use 好きな: 好きな食べ物 (favorite food). 嫌い (disliked) is also a な-adjective despite ending in い.','猫~subject~noun|が~particle~subject particle|好きです~predicate~na-adjective + copula','Build: “I like cats.” Leave out 私.',['猫が好きです','ねこがすきです','猫がすきです'],['猫','が','好き','です']),
 grammar('i-adjective','い-adjectives in sentences','このほんはおもしろいです。','This book is interesting.','Most い-adjectives keep final い before a noun: 面白い本. Negative: 面白くないです; past: 面白かったです; negative past: 面白くなかったです. Add です for polite speech, but not な before the noun.','この~modifier~determiner|本~topic~noun|は~particle~topic particle|面白いです~predicate~i-adjective + polite ending','Make 面白いです negative.',['面白くないです','おもしろくないです','面白くありません','おもしろくありません']),
 grammar('na-adjective','な-adjectives in sentences','ここはしずかです。','It is quiet here.','A な-adjective uses な directly before a noun: 静かな部屋. At the end of a polite sentence, use 静かです, not 静かなです. Negative: 静かじゃありません; past: 静かでした. きれい and 嫌い belong to this group.','ここ~topic~place pronoun|は~particle~topic particle|静かです~predicate~na-adjective + copula','Fill the missing word: 静か __ 部屋 (a quiet room).',['な'])
];

const numberRows=rows(`Numbers|零|れい|zero|ゼロ is also common.
Numbers|一|いち|one|A following counter may change the pronunciation.
Numbers|二|に|two|A following counter may change the pronunciation.
Numbers|三|さん|three|Three hundred is さんびゃく, not さんひゃく.
Numbers|四|よん|four|し is another reading. Four o’clock is よじ.
Numbers|五|ご|five|A following counter may change the pronunciation.
Numbers|六|ろく|six|Six hundred is ろっぴゃく.
Numbers|七|なな|seven|しち is also used, notably in 七時 (しちじ) and 七月 (しちがつ).
Numbers|八|はち|eight|Eight hundred is はっぴゃく.
Numbers|九|きゅう|nine|く is used in 九時 (くじ) and 九月 (くがつ).
Numbers|十|じゅう|ten|Combine tens then units: 21 is にじゅういち.
Numbers|十一|じゅういち|eleven|Ten plus one.
Numbers|二十|にじゅう|twenty|Two tens. The date 二十日 is はつか.
Numbers|百|ひゃく|one hundred|Normally say ひゃく, without いち.
Numbers|三百|さんびゃく|three hundred|Irregular voiced reading: びゃく.
Numbers|六百|ろっぴゃく|six hundred|Hold the consonant at small っ; use ぴゃく.
Numbers|八百|はっぴゃく|eight hundred|Hold the consonant at small っ; use ぴゃく.
Numbers|千|せん|one thousand|Normally say せん, without いち.
Numbers|三千|さんぜん|three thousand|Irregular voiced reading: ぜん.
Numbers|八千|はっせん|eight thousand|Hold the consonant at small っ.
Numbers|一万|いちまん|ten thousand|Japanese groups large numbers by ten-thousands (万).
Clock time|一時|いちじ|one o’clock|Add に when marking a specific time of an action.
Clock time|二時|にじ|two o’clock|時 (じ) marks an hour on the clock.
Clock time|三時|さんじ|three o’clock|時 (じ) marks an hour on the clock.
Clock time|四時|よじ|four o’clock|Irregular: よじ, not よんじ or しじ.
Clock time|五時|ごじ|five o’clock|時 (じ) marks an hour on the clock.
Clock time|六時|ろくじ|six o’clock|時 (じ) marks an hour on the clock.
Clock time|七時|しちじ|seven o’clock|しちじ is the standard beginner reading; ななじ is also heard to avoid confusion.
Clock time|八時|はちじ|eight o’clock|時 (じ) marks an hour on the clock.
Clock time|九時|くじ|nine o’clock|Irregular: くじ, not きゅうじ.
Clock time|十時|じゅうじ|ten o’clock|時 (じ) marks an hour on the clock.
Clock time|十一時|じゅういちじ|eleven o’clock|Use 午前 or 午後 to specify a.m. or p.m.
Clock time|十二時|じゅうにじ|twelve o’clock|Use 午前 or 午後 to specify a.m. or p.m.
Clock time|三時半|さんじはん|half past three|半 means half; 3:30 is also 三時三十分.
Clock time|何時|なんじ|what time|今、何時ですか asks “What time is it now?”
Minutes|一分|いっぷん|one minute|Hold the consonant at small っ; 分 becomes ぷん.
Minutes|二分|にふん|two minutes|分 is ふん here.
Minutes|三分|さんぷん|three minutes|分 becomes ぷん after 三.
Minutes|四分|よんぷん|four minutes|分 becomes ぷん after 四.
Minutes|五分|ごふん|five minutes|分 is ふん here.
Minutes|六分|ろっぷん|six minutes|Hold the consonant at small っ.
Minutes|七分|ななふん|seven minutes|Use なな with this minute count.
Minutes|八分|はっぷん|eight minutes|はちふん is also used.
Minutes|九分|きゅうふん|nine minutes|Use きゅう with this minute count.
Minutes|十分|じゅっぷん|ten minutes|じっぷん is also standard.
Minutes|二十分|にじゅっぷん|twenty minutes|にじっぷん is also standard.
Minutes|三十分|さんじゅっぷん|thirty minutes|さんじっぷん is also standard.
Dates|一日|ついたち|first day of the month|For a duration of one day, use いちにち instead.
Dates|二日|ふつか|second day; two days|This reading also expresses a duration of two days.
Dates|三日|みっか|third day; three days|Hold the consonant at small っ.
Dates|四日|よっか|fourth day; four days|Do not use よんにち here.
Dates|五日|いつか|fifth day; five days|Learn dates one through ten as a set.
Dates|六日|むいか|sixth day; six days|Learn dates one through ten as a set.
Dates|七日|なのか|seventh day; seven days|Do not use ななにち here.
Dates|八日|ようか|eighth day; eight days|The first vowel is long: よう.
Dates|九日|ここのか|ninth day; nine days|Learn dates one through ten as a set.
Dates|十日|とおか|tenth day; ten days|The first vowel is long: とお.
Dates|十一日|じゅういちにち|eleventh day|Most dates after ten use the number + にち.
Dates|十二日|じゅうににち|twelfth day|Most dates after ten use the number + にち.
Dates|十三日|じゅうさんにち|thirteenth day|Most dates after ten use the number + にち.
Dates|十四日|じゅうよっか|fourteenth day|Irregular: the final part is よっか.
Dates|十五日|じゅうごにち|fifteenth day|Number + にち.
Dates|十六日|じゅうろくにち|sixteenth day|Number + にち.
Dates|十七日|じゅうしちにち|seventeenth day|The standard date reading uses しち.
Dates|十八日|じゅうはちにち|eighteenth day|Number + にち.
Dates|十九日|じゅうくにち|nineteenth day|The standard date reading uses く.
Dates|二十日|はつか|twentieth day; twenty days|Irregular: はつか, not にじゅうにち.
Dates|二十一日|にじゅういちにち|twenty-first day|Number + にち.
Dates|二十二日|にじゅうににち|twenty-second day|Number + にち.
Dates|二十三日|にじゅうさんにち|twenty-third day|Number + にち.
Dates|二十四日|にじゅうよっか|twenty-fourth day|Irregular: the final part is よっか.
Dates|二十五日|にじゅうごにち|twenty-fifth day|Number + にち.
Dates|二十六日|にじゅうろくにち|twenty-sixth day|Number + にち.
Dates|二十七日|にじゅうしちにち|twenty-seventh day|The standard date reading uses しち.
Dates|二十八日|にじゅうはちにち|twenty-eighth day|Number + にち.
Dates|二十九日|にじゅうくにち|twenty-ninth day|The standard date reading uses く.
Dates|三十日|さんじゅうにち|thirtieth day|Number + にち.
Dates|三十一日|さんじゅういちにち|thirty-first day|Number + にち.
Months|一月|いちがつ|January|For calendar months use がつ, not げつ.
Months|二月|にがつ|February|For calendar months use がつ.
Months|三月|さんがつ|March|For calendar months use がつ.
Months|四月|しがつ|April|Irregular: しがつ, not よんがつ.
Months|五月|ごがつ|May|For calendar months use がつ.
Months|六月|ろくがつ|June|For calendar months use がつ.
Months|七月|しちがつ|July|The standard calendar reading uses しち.
Months|八月|はちがつ|August|For calendar months use がつ.
Months|九月|くがつ|September|Irregular: くがつ, not きゅうがつ.
Months|十月|じゅうがつ|October|For calendar months use がつ.
Months|十一月|じゅういちがつ|November|For calendar months use がつ.
Months|十二月|じゅうにがつ|December|For calendar months use がつ.
Weekdays|月曜日|げつようび|Monday|月 means moon; the weekday reading begins げつ.
Weekdays|火曜日|かようび|Tuesday|火 means fire.
Weekdays|水曜日|すいようび|Wednesday|水 means water.
Weekdays|木曜日|もくようび|Thursday|木 means tree / wood.
Weekdays|金曜日|きんようび|Friday|金 means gold / metal.
Weekdays|土曜日|どようび|Saturday|土 means earth / soil.
Weekdays|日曜日|にちようび|Sunday|日 means sun / day.
Durations|一時間|いちじかん|one hour|For duration, use 時間; 一時 means one o’clock.
Durations|二時間|にじかん|two hours|A duration normally does not take the time particle に.
Durations|一日|いちにち|one day|For the first day of a month, the same spelling is ついたち.
Durations|一週間|いっしゅうかん|one week|Hold the consonant at small っ.
Durations|一か月|いっかげつ|one month|か月 is also written ヶ月 / 箇月. This differs from 一月 (January).
Counters|一人|ひとり|one person|Irregular person counter.
Counters|二人|ふたり|two people|Irregular person counter.
Counters|三人|さんにん|three people|From three onward, 人 usually reads にん; 四人 is よにん.
Counters|四人|よにん|four people|Irregular: よにん, not よんにん.
Counters|一つ|ひとつ|one thing|The general つ series counts many everyday objects, commonly through ten.
Counters|二つ|ふたつ|two things|General object counter.
Counters|三つ|みっつ|three things|Hold the consonant at small っ.
Counters|四つ|よっつ|four things|Hold the consonant at small っ.
Counters|五つ|いつつ|five things|General object counter.
Counters|六つ|むっつ|six things|Hold the consonant at small っ.
Counters|七つ|ななつ|seven things|General object counter.
Counters|八つ|やっつ|eight things|Hold the consonant at small っ.
Counters|九つ|ここのつ|nine things|General object counter.
Counters|十|とお|ten things|The general object series ends with とお, without つ.
Counters|一枚|いちまい|one flat item|枚 counts flat objects such as paper, tickets and shirts.
Counters|一本|いっぽん|one long cylindrical item|本 counts long objects. Two: にほん; three: さんぼん; six: ろっぽん.
Counters|一匹|いっぴき|one small animal|匹 counts small animals. Two: にひき; three: さんびき.
Counters|一歳|いっさい|one year old|Age uses 歳. Eight: はっさい; ten: じゅっさい / じっさい.
Counters|二十歳|はたち|twenty years old|The usual age reading is はたち. にじゅっさい is also understandable in explicit counting.`);
const numberAlternatives:Record<string,string[]>={四:['し'],七:['しち'],九:['く'],零:['ゼロ','ぜろ'],七時:['ななじ'],八分:['はちふん'],十分:['じっぷん'],二十分:['にじっぷん'],三十分:['さんじっぷん'],二十歳:['にじゅっさい','にじっさい']};
const numbers:Entry[]=numberRows.map(([topic,japanese,reading,meaning,note])=>({id:`numbers-${topic.toLowerCase().replaceAll(' ','-')}-${code(japanese)}`,kind:'numbers',title:japanese,japanese,reading,meaning,level:'N5',topic,tags:[topic],note,examples:[ex(japanese,reading,meaning)],exercise:{prompt:`Read ${japanese} in hiragana (${meaning}).`,answers:[reading,...(numberAlternatives[japanese]??[])],explanation:note}}));

const adjectiveRows=rows(`おいしい|おいしい|delicious|い-adjectives|このパンはおいしいです。|このぱんはおいしいです。|This bread is delicious.
大きい|おおきい|big|い-adjectives|大きい家です。|おおきいいえです。|It is a big house.
小さい|ちいさい|small|い-adjectives|小さい猫です。|ちいさいねこです。|It is a small cat.
高い|たかい|high; expensive|い-adjectives|この本は高いです。|このほんはたかいです。|This book is expensive.
安い|やすい|inexpensive|い-adjectives|この本は安いです。|このほんはやすいです。|This book is inexpensive.
新しい|あたらしい|new|い-adjectives|新しい本です。|あたらしいほんです。|It is a new book.
古い|ふるい|old (things)|い-adjectives|古い家です。|ふるいいえです。|It is an old house.
面白い|おもしろい|interesting; amusing|い-adjectives|この本は面白いです。|このほんはおもしろいです。|This book is interesting.
忙しい|いそがしい|busy|い-adjectives|今日は忙しいです。|きょうはいそがしいです。|I am busy today.
暑い|あつい|hot (weather)|い-adjectives|今日は暑いです。|きょうはあついです。|It is hot today.
寒い|さむい|cold (weather)|い-adjectives|今日は寒いです。|きょうはさむいです。|It is cold today.
楽しい|たのしい|enjoyable|い-adjectives|日本語の勉強は楽しいです。|にほんごのべんきょうはたのしいです。|Studying Japanese is enjoyable.
静か|しずか|quiet|な-adjectives|静かな部屋です。|しずかなへやです。|It is a quiet room.
にぎやか|にぎやか|lively|な-adjectives|にぎやかな町です。|にぎやかなまちです。|It is a lively town.
便利|べんり|convenient|な-adjectives|この店は便利です。|このみせはべんりです。|This shop is convenient.
元気|げんき|healthy; energetic|な-adjectives|母は元気です。|はははげんきです。|My mother is well.
親切|しんせつ|kind|な-adjectives|親切な人です。|しんせつなひとです。|They are a kind person.
有名|ゆうめい|famous|な-adjectives|有名な店です。|ゆうめいなみせです。|It is a famous shop.
きれい|きれい|beautiful; clean|Exceptions|きれいな花です。|きれいなはなです。|It is a beautiful flower.
嫌い|きらい|disliked|Exceptions|魚が嫌いです。|さかながきらいです。|I dislike fish.
好き|すき|liked; favorite|な-adjectives|好きな食べ物は何ですか。|すきなたべものはなんですか。|What is your favorite food?
いい|いい|good|Exceptions|いい本です。|いいほんです。|It is a good book.
ほしい|ほしい|wanted; desirable|Exceptions|本がほしいです。|ほんがほしいです。|I want a book.`);
const adjectives:Entry[]=adjectiveRows.map(([japanese,reading,meaning,topic,jp,rp,en])=>{
 const na=topic==='な-adjectives'||['きれい','嫌い'].includes(japanese);
 const stem=japanese==='いい'?'よ':japanese.slice(0,-1);
 const readingStem=japanese==='いい'?'よ':reading.slice(0,-1);
 const negative=na?`${japanese}じゃありません`:`${stem}くないです`;
 const past=na?`${japanese}でした`:`${stem}かったです`;
 const negativePast=na?`${japanese}じゃありませんでした`:`${stem}くなかったです`;
 const note=na?`な-adjective. Before a noun: ${japanese}な + noun. Polite statement: ${japanese}です. Negative: ${negative}. Past: ${past}. Negative past: ${negativePast}.`:`い-adjective. Before a noun, keep the final い: ${japanese} + noun. Negative: ${negative}. Past: ${past}. Negative past: ${negativePast}.`;
 const exception=japanese==='いい'?' いい uses the よい stem in inflected forms: よくない, よかった, よくなかった.':japanese==='きれい'||japanese==='嫌い'?' Although this word ends in the sound い, it is a な-adjective.':japanese==='ほしい'?' ほしい expresses wanting a thing; it is an adjective, not a verb. Usually use noun がほしいです for your own desire.':'';
 return {id:`adjectives-${code(japanese)}`,kind:'adjectives',title:japanese,japanese,reading,meaning,level:'N5',topic,tags:[na?'な-adjective':'い-adjective',...(topic==='Exceptions'?['Exception']:[])],note:note+exception,examples:[ex(jp,rp,en),ex(negative,na?`${reading}じゃありません`:`${readingStem}くないです`,`not ${meaning.split(';')[0]}`),ex(past,na?`${reading}でした`:`${readingStem}かったです`,`was ${meaning.split(';')[0]}`),ex(negativePast,na?`${reading}じゃありませんでした`:`${readingStem}くなかったです`,`was not ${meaning.split(';')[0]}`)],exercise:{prompt:`Make ${japanese}です negative in polite Japanese.`,answers:na?[negative,`${japanese}ではありません`,`${japanese}じゃないです`,`${reading}じゃありません`,`${reading}ではありません`,`${reading}じゃないです`]:[negative,`${stem}くありません`,`${readingStem}くないです`,`${readingStem}くありません`],explanation:note+exception}};
});

/** Starter selections are approximate pedagogical groupings, not an official JLPT syllabus. */
for (const entry of adjectives) {
 if (entry.japanese==='いい') entry.exercise!.answers.push('良くないです','良くありません');
 if (entry.japanese==='きれい') entry.exercise!.answers.push('綺麗じゃありません','綺麗ではありません','綺麗じゃないです');
}
export const entries:Entry[]=[...kana,...grammarLessons,...kanji,...vocabulary,...numbers,...adjectives];

// Keep personal notes while letting newer dictionary coverage reach previously edited entries.
export function mergeEntry(base:Entry,custom?:Entry):Entry{
 if(!custom)return base;
 if(base.kind==='grammar'&&custom.kind==='grammar')return {...custom,examples:custom.examples.map(ex=>{
  const original=base.examples.find(b=>b.japanese===ex.japanese&&b.reading===ex.reading&&b.meaning===ex.meaning);
  if(!original)return ex;
  return {...ex,tokens:ex.tokens?.map(t=>({...original.tokens?.find(b=>b.text===t.text&&b.role===t.role&&b.wordClass===t.wordClass),...t}))||original.tokens,translationTokens:ex.translationTokens||original.translationTokens};
 })};
 if(base.kind!=='kanji'||custom.kind!=='kanji')return custom;
 const words=new Map<string,NonNullable<Entry['compounds']>[number]>();
 for(const c of [...(base.compounds||[]),...(custom.compounds||[])])words.set(c.japanese+':'+c.reading,c);
 return {...custom,compounds:[...words.values()]};
}
