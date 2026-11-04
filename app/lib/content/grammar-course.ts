import { annotateGrammarSentence } from '../japanese/grammar-annotations.ts';
import type { Entry } from './content.ts';
export type ReadingText = {
  text: string;
  reading: string;
  role?: string;
  wordClass?: string;
  tokens?: Entry['examples'][number]['tokens'];
  translationTokens?: Entry['examples'][number]['translationTokens'];
};
export type GuidedExercise = {
  id: string;
  type: 'meaning-choice' | 'pattern-choice' | 'gap' | 'tiles' | 'typing';
  prompt: string;
  context?: ReadingText;
  choices?: ReadingText[];
  tiles?: ReadingText[];
  answers: string[];
  hint: string;
  explanation: string;
  feedback: ReadingText & { meaning?: string };
  alternate?: boolean;
};
export type GrammarLesson = {
  order: number;
  group: string;
  goal: string;
  prerequisites: string[];
  recap: string;
  comparison: string;
  examples: Entry['examples'];
  vocabulary: (ReadingText & { meaning: string })[];
};

// Each row is authored teaching content, with word boundaries paired to kana readings.
// Four distinct sentences supply three demonstrations plus a new retry sentence.
const authored = `
@desu|Sentence basics|Introduce someone or identify something politely.||Use noun + です. A noun does not take the verb ending ます.|Look for the polite ending used after a noun.|3
私 は 学生 です|わたし は がくせい です|I am a student.
田中さん は 先生 です|たなかさん は せんせい です|Tanaka is a teacher.
これ は 本 です|これ は ほん です|This is a book.
それ は 時計 です|それ は とけい です|That is a clock.
!私 は 学生 ます|わたし は がくせい ます|I was a student.
@question|Sentence basics|Ask a polite yes-or-no question.|desu|A statement ends in です; add か to make a question.|Find the particle that turns a statement into a question.|4
これ は 本 です か|これ は ほん です か|Is this a book?
田中さん は 先生 です か|たなかさん は せんせい です か|Is Tanaka a teacher?
それ は 時計 です か|それ は とけい です か|Is that a clock?
あれ は 学校 です か|あれ は がっこう です か|Is that a school over there?
!これ は 本 か です|これ は ほん か です|This is a book.
@no|Sentence basics|Say who something belongs to.|desu,question|The owner comes before の, and the owned thing comes after it.|Link the owner to the following noun.|3
これ は 私 の 本 です|これ は わたし の ほん です|This is my book.
それ は 先生 の 時計 です|それ は せんせい の とけい です|That is the teacher's clock.
あれ は 田中さん の 車 です|あれ は たなかさん の くるま です|That is Tanaka's car over there.
これ は 母 の かばん です|これ は はは の かばん です|This is my mother's bag.
!これ は 私 は 本 です|これ は わたし は ほん です|This is the teacher's book.
@mo|Sentence basics|Add someone or something to an existing statement.|desu|も often replaces は when adding “also”; do not stack は and も here.|Choose the particle meaning “also”.|1
私 も 学生 です|わたし も がくせい です|I am also a student.
田中さん も 先生 です|たなかさん も せんせい です|Tanaka is also a teacher.
これ も 本 です|これ も ほん です|This is also a book.
それ も 時計 です|それ も とけい です|That is also a clock.
!私 は も 学生 です|わたし は も がくせい です|I am not a student.
@demonstratives|Sentence basics|Point to things using stand-alone and noun-modifying words.|desu,no|これ stands alone; この must be followed by a noun. The same distinction applies to それ/その and あれ/あの.|Use the form that goes directly before a noun.|0
これ は 本 です|これ は ほん です|This is a book.
この 本 は 私 の です|この ほん は わたし の です|This book is mine.
その 時計 は 先生 の です|その とけい は せんせい の です|That clock is the teacher's.
あの 車 は 田中さん の です|あの くるま は たなかさん の です|That car over there is Tanaka's.
!この は 本 です|この は ほん です|That is a book over there.
@masu|Polite verbs and particles|Describe a routine with a polite verb.|desu|Use ます with a verb stem. Noun + です and verb + ます are different patterns.|The action is habitual, so use the polite non-past ending.|2
毎日 勉強し ます|まいにち べんきょうし ます|I study every day.
朝 働き ます|あさ はたらき ます|I work in the morning.
毎日 歩き ます|まいにち あるき ます|I walk every day.
夜 勉強し ます|よる べんきょうし ます|I study at night.
!毎日 勉強し です|まいにち べんきょうし です|I studied every day.
@object|Polite verbs and particles|Say what you eat, drink, or read.|masu|を marks the object of an action. は marks a topic and does not replace the object marker in this basic pattern.|Choose the particle linking the thing to the action done to it.|1
水 を 飲みます|みず を のみます|I drink water.
本 を 読みます|ほん を よみます|I read a book.
パン を 食べます|ぱん を たべます|I eat bread.
お茶 を 飲みます|おちゃ を のみます|I drink tea.
!水 が 飲みます|みず が のみます|I eat bread.
@de|Polite verbs and particles|Say where an action happens.|masu,object|Use で for where an action happens; use に for a destination or where something exists.|The place is where an action happens, not a destination.|1
図書館 で 勉強します|としょかん で べんきょうします|I study at the library.
家 で 本 を 読みます|いえ で ほん を よみます|I read a book at home.
学校 で パン を 食べます|がっこう で ぱん を たべます|I eat bread at school.
家 で お茶 を 飲みます|いえ で おちゃ を のみます|I drink tea at home.
!図書館 に 勉強します|としょかん に べんきょうします|I go to the library.
@destination|Polite verbs and particles|Say where you go.|masu|に or へ can mark a destination. で marks where an action takes place, not the destination in these sentences.|Choose a destination particle; に and へ are both possible here.|1
学校 に 行きます|がっこう に いきます|I go to school.
図書館 に 行きます|としょかん に いきます|I go to the library.
家 に 帰ります|いえ に かえります|I return home.
日本 に 行きます|にほん に いきます|I go to Japan.
!学校 で 行きます|がっこう で いきます|I study at school.
@time-ni|Polite verbs and particles|Say at what clock time an action happens.|masu|Use に after a specific clock time; relative times such as 毎日 usually do not take に.|This is a specific clock time, so a time particle is needed.|1
七時 に 起きます|しちじ に おきます|I get up at seven.
八時 に 行きます|はちじ に いきます|I go at eight.
九時 に 勉強します|くじ に べんきょうします|I study at nine.
六時 に 帰ります|ろくじ に かえります|I return at six.
!七時 を 起きます|しちじ を おきます|I get up at eight.
@arimasu|Existence and location|Say that a thing exists.|desu|Use あります for things and plants; use います for people and animals.|The thing is not a person or animal.|2
本 が あります|ほん が あります|There is a book.
机 が あります|つくえ が あります|There is a desk.
時計 が あります|とけい が あります|There is a clock.
車 が あります|くるま が あります|There is a car.
!本 が います|ほん が います|There is a cat.
@imasu|Existence and location|Say that a person or animal is present.|arimasu|Use います for people and animals; use あります for things.|A living person or animal needs the animate existence verb.|2
猫 が います|ねこ が います|There is a cat.
先生 が います|せんせい が います|There is a teacher.
犬 が います|いぬ が います|There is a dog.
田中さん が います|たなかさん が います|Tanaka is here.
!猫 が あります|ねこ が あります|There is a book.
@location|Existence and location|Locate a thing, person, or animal.|arimasu,imasu|に marks the location of existence; で marks the location of an action.|Nothing is doing an action here; choose the existence-location particle.|1
部屋 に 猫 が います|へや に ねこ が います|There is a cat in the room.
学校 に 先生 が います|がっこう に せんせい が います|There is a teacher at school.
家 に 本 が あります|いえ に ほん が あります|There is a book at home.
部屋 に 机 が あります|へや に つくえ が あります|There is a desk in the room.
!部屋 で 猫 が います|へや で ねこ が います|There is a dog in the room.
@noun-negative|Negatives and past|Say that someone or something is not a noun.|desu|Noun + じゃありません negates a noun sentence. Plain ありません alone expresses non-existence.|Replace です with the polite noun-negative ending.|3
私 は 先生 じゃありません|わたし は せんせい じゃありません|I am not a teacher.
これ は 本 じゃありません|これ は ほん じゃありません|This is not a book.
田中さん は 学生 じゃありません|たなかさん は がくせい じゃありません|Tanaka is not a student.
それ は 時計 じゃありません|それ は とけい じゃありません|That is not a clock.
!私 は 先生 ありません|わたし は せんせい ありません|I am a teacher.
@noun-past|Negatives and past|Describe what something was.|desu,noun-negative|Use noun + でした for the past. ます is a verb ending, not the past of です.|The sentence describes yesterday, so use the noun-past ending.|3
昨日 は 休み でした|きのう は やすみ でした|Yesterday was a day off.
田中さん は 学生 でした|たなかさん は がくせい でした|Tanaka was a student.
ここ は 学校 でした|ここ は がっこう でした|This place was a school.
昨日 は 雨 でした|きのう は あめ でした|Yesterday was rainy.
!昨日 は 休み ます|きのう は やすみ ます|Tomorrow is a day off.
@masen|Negatives and past|Say that you do not do an action.|masu,object|Replace verb ます with ません. Do not attach noun-negative じゃありません to a verb stem.|Use the negative partner of ます.|2
水 を 飲みません|みず を のみません|I do not drink water.
本 を 読みません|ほん を よみません|I do not read books.
パン を 食べません|ぱん を たべません|I do not eat bread.
今日 は 働きません|きょう は はたらきません|I do not work today.
!水 を 飲みじゃありません|みず を のみじゃありません|I drink water.
@verb-past|Negatives and past|Describe a completed action politely.|masu,masen|Replace ます with ました for past actions; noun + でした follows a different pattern.|Use the polite past verb form for a completed action.|3
昨日 本 を 読みました|きのう ほん を よみました|I read a book yesterday.
昨日 水 を 飲みました|きのう みず を のみました|I drank water yesterday.
昨日 パン を 食べました|きのう ぱん を たべました|I ate bread yesterday.
昨日 学校 に 行きました|きのう がっこう に いきました|I went to school yesterday.
!昨日 本 を 読みでした|きのう ほん を よみでした|I will read a book tomorrow.
@existence-negative|Negatives and past|Say that something or someone is absent.|arimasu,imasu|ありません negates あります; いません negates います. Noun + じゃありません means “is not”, not “is absent”.|The desk is a thing, so negate the inanimate existence verb.|2
本 が ありません|ほん が ありません|There is no book.
机 が ありません|つくえ が ありません|There is no desk.
猫 が いません|ねこ が いません|There is no cat.
先生 が いません|せんせい が いません|There is no teacher.
!本 が じゃありません|ほん が じゃありません|There is a book.
@i-adjective|Descriptions and preferences|Describe something with an い-adjective.|desu|An い-adjective can go directly before a noun. Do not insert な after an い-adjective such as 高い.|Keep the adjective's final い before です.|3
この 本 は 面白い です|この ほん は おもしろい です|This book is interesting.
この 車 は 高い です|この くるま は たかい です|This car is expensive.
この 部屋 は 大きい です|この へや は おおきい です|This room is big.
この 本 は 新しい です|この ほん は あたらしい です|This book is new.
!この 本 は 面白い な です|この ほん は おもしろい な です|This book is boring.
@na-adjective|Descriptions and preferences|Describe a place with a な-adjective.|desu,i-adjective|Use な before a noun, but omit it before です: 静かな部屋 / 部屋は静かです. きれい is a な-adjective despite ending in い.|Before です, use the adjective without な.|3
この 部屋 は 静か です|この へや は しずか です|This room is quiet.
この 学校 は 便利 です|この がっこう は べんり です|This school is convenient.
この 部屋 は きれい です|この へや は きれい です|This room is clean.
この 町 は 静か です|この まち は しずか です|This town is quiet.
!この 部屋 は 静か な です|この へや は しずか な です|This room is noisy.
@suki|Descriptions and preferences|Say what you like.|na-adjective|好き is a な-adjective. The liked thing is marked by が in this basic pattern, not the action-object particle を.|Use the particle that introduces the thing you like.|3
私 は 猫 が 好きです|わたし は ねこ が すきです|I like cats.
私 は 本 が 好きです|わたし は ほん が すきです|I like books.
田中さん は お茶 が 好きです|たなかさん は おちゃ が すきです|Tanaka likes tea.
私 は 犬 が 好きです|わたし は いぬ が すきです|I like dogs.
!私 は 猫 を 好きます|わたし は ねこ を すきます|I dislike cats.
@hoshii|Descriptions and preferences|Say what thing you want.|i-adjective,suki|Use が + ほしい for a wanted thing. Use verb stem + たい for an action you want to do.|Choose the adjective for wanting a thing, not an action.|4
私 は 本 が ほしいです|わたし は ほん が ほしいです|I want a book.
私 は 車 が ほしいです|わたし は くるま が ほしいです|I want a car.
私 は 時計 が ほしいです|わたし は とけい が ほしいです|I want a clock.
私 は 水 が ほしいです|わたし は みず が ほしいです|I want some water.
!私 は 本 が たいです|わたし は ほん が たいです|I already have a book.
@tai|Descriptions and preferences|Say what action you want to do.|masu,hoshii|Attach たい to the ます stem, not the full ます form: 飲みます becomes 飲みたいです.|Use the verb stem followed by the desire ending.|2
水 を 飲みたいです|みず を のみたいです|I want to drink water.
本 を 読みたいです|ほん を よみたいです|I want to read a book.
パン を 食べたいです|ぱん を たべたいです|I want to eat bread.
日本 に 行きたいです|にほん に いきたいです|I want to go to Japan.
!水 を 飲みますたいです|みず を のみますたいです|I do not want to drink water.
@te-request|Requests and ongoing actions|Make a polite request using a verb's て-form.|masu,object|Use the て-form before ください: 読む→読んで, 飲む→飲んで, 書く→書いて, 食べる→食べて. Do not use the ます form here.|The request needs the verb's て-form followed by ください.|2
本 を 読んで ください|ほん を よんで ください|Please read the book.
水 を 飲んで ください|みず を のんで ください|Please drink the water.
名前 を 書いて ください|なまえ を かいて ください|Please write your name.
パン を 食べて ください|ぱん を たべて ください|Please eat the bread.
!本 を 読みます ください|ほん を よみます ください|I read a book.
@te-imasu|Requests and ongoing actions|Describe an action happening now.|te-request,imasu|Use verb て-form + います for an ongoing action. 読んでいます means “am reading”; 読みます often describes a routine. Some verbs use this form for a resulting state.|Combine the て-form with います to describe the action in progress.|3
今 本 を 読んでいます|いま ほん を よんでいます|I am reading a book now.
今 水 を 飲んでいます|いま みず を のんでいます|I am drinking water now.
今 名前 を 書いています|いま なまえ を かいています|I am writing my name now.
今 パン を 食べています|いま ぱん を たべています|I am eating bread now.
!今 本 を 読みますいます|いま ほん を よみますいます|I read a book yesterday.
@adjective-kute|Connecting descriptions and actions|Join two descriptions with an い-adjective.|i-adjective|Replace the final い with くて to connect descriptions: たかい → たかくて. いい becomes よくて. The final description carries tense and politeness.|Use くて on the first い-adjective.|3
この 本 は 面白くて 安い です|この ほん は おもしろくて やすい です|This book is interesting and inexpensive.
この 車 は 大きくて 新しい です|この くるま は おおきくて あたらしい です|This car is big and new.
この 部屋 は 明るくて 広い です|この へや は あかるくて ひろい です|This room is bright and spacious.
この かばん は 軽くて 便利 です|この かばん は かるくて べんり です|This bag is light and convenient.
!この 本 は 面白いで 安い です|この ほん は おもしろいで やすい です|This book is interesting but expensive.
@description-de|Connecting descriptions and actions|Join descriptions using a な-adjective or noun.|na-adjective,adjective-kute|Use the な-adjective stem + で, or noun + で, before the next description. きれい uses で despite ending in い. This connecting で differs from the place or means particle で.|Connect the first description with で.|4
この 町 は 静か で 便利 です|この まち は しずか で べんり です|This town is quiet and convenient.
この 部屋 は きれい で 静か です|この へや は きれい で しずか です|This room is clean and quiet.
田中さん は 先生 で 親切 です|たなかさん は せんせい で しんせつ です|Tanaka is a teacher and kind.
母 は 医者 で 元気 です|はは は いしゃ で げんき です|My mother is a doctor and healthy.
!この 町 は 静かくて 便利 です|この まち は しずかくて べんり です|This town is quiet but inconvenient.
@te-sequence|Connecting descriptions and actions|Connect two actions in sequence.|te-request|Use verb て-form + the next verb. Some て-forms end in で: よむ → よんで. Do not simply attach で to every verb. The final verb sets tense and politeness.|Put the first action in its て-form.|2
パン を 食べて 学校 に 行きます|ぱん を たべて がっこう に いきます|I eat bread and then go to school.
本 を 読んで 寝ます|ほん を よんで ねます|I read a book and then go to bed.
家 に 帰って 勉強します|いえ に かえって べんきょうします|I return home and then study.
水 を 飲んで 休みます|みず を のんで やすみます|I drink water and then rest.
!パン を 食べます 学校 に 行きます|ぱん を たべます がっこう に いきます|I eat bread and then return home.
@pass-by|Passing places|Say you pass by or through a place.|object,destination|Use place + を + とおる for a route you pass along or through. To pass by a building, use its まえ: えきのまえをとおります. を marks the route here, rather than a direct object.|Mark the route with を.|3
駅 の 前 を 通ります|えき の まえ を とおります|I pass in front of the station.
学校 の 前 を 通ります|がっこう の まえ を とおります|I pass in front of the school.
公園 を 通って 帰ります|こうえん を とおって かえります|I go home through the park.
この 道 を 通ります|この みち を とおります|I take this road.
!駅 の 前 で 通ります|えき の まえ で とおります|I stop at the station.
@drop-by|Passing places|Say you stop by a place on the way.|destination,te-sequence|Use place + に + よる for a short stop or visit. よって connects it to the next action. とおる means passing along or by; よる means stopping there.|Use に for the place you stop at.|1
店 に 寄ります|みせ に よります|I stop by the shop.
銀行 に 寄って 帰ります|ぎんこう に よって かえります|I stop by the bank and then go home.
友達 の 家 に 寄ります|ともだち の いえ に よります|I drop by my friend's house.
コンビニ に 寄ります|こんびに に よります|I stop by the convenience store.
!店 を 寄ります|みせ を よります|I pass by the shop.
`;

// Substitutions stay within the same grammatical and semantic category.
const practiceWords = [
  '町:まち:town|村:むら:village|都市:とし:city|地域:ちいき:area|地区:ちく:district|島:しま:island|近所:きんじょ:neighborhood|場所:ばしょ:place|住宅街:じゅうたくがい:residential area|商店街:しょうてんがい:shopping street|田舎:いなか:countryside',

  'パン:ぱん:bread|ご飯:ごはん:rice|寿司:すし:sushi|魚:さかな:fish|肉:にく:meat|卵:たまご:eggs|野菜:やさい:vegetables|果物:くだもの:fruit|りんご:りんご:apples|バナナ:ばなな:bananas|チーズ:ちーず:cheese',
  '昨日:きのう:Yesterday|月曜日:げつようび:Monday|火曜日:かようび:Tuesday|水曜日:すいようび:Wednesday|木曜日:もくようび:Thursday|金曜日:きんようび:Friday|土曜日:どようび:Saturday|日曜日:にちようび:Sunday',

  '本:ほん:book|雑誌:ざっし:magazine|新聞:しんぶん:newspaper|辞書:じしょ:dictionary|小説:しょうせつ:novel|漫画:まんが:comic|教科書:きょうかしょ:textbook|絵本:えほん:picture book|手紙:てがみ:letter|日記:にっき:diary|記事:きじ:article',
  '水:みず:water|お茶:おちゃ:tea|牛乳:ぎゅうにゅう:milk|コーヒー:こーひー:coffee|ジュース:じゅーす:juice|紅茶:こうちゃ:black tea|緑茶:りょくちゃ:green tea|豆乳:とうにゅう:soy milk|麦茶:むぎちゃ:barley tea|冷水:れいすい:cold water|炭酸水:たんさんすい:sparkling water',
  '学校:がっこう:school|図書館:としょかん:library|店:みせ:shop|銀行:ぎんこう:bank|駅:えき:station|公園:こうえん:park|病院:びょういん:hospital|会社:かいしゃ:office|郵便局:ゆうびんきょく:post office|美術館:びじゅつかん:art museum|スーパー:すーぱー:supermarket|大学:だいがく:university|空港:くうこう:airport|港:みなと:port|市場:いちば:market|劇場:げきじょう:theater|映画館:えいがかん:cinema|博物館:はくぶつかん:museum|動物園:どうぶつえん:zoo|水族館:すいぞくかん:aquarium|体育館:たいいくかん:gym|食堂:しょくどう:cafeteria|喫茶店:きっさてん:cafe|本屋:ほんや:bookstore|薬局:やっきょく:pharmacy|交番:こうばん:police box|市役所:しやくしょ:city hall|ホテル:ほてる:hotel',
  '猫:ねこ:cat|犬:いぬ:dog|鳥:とり:bird|馬:うま:horse|魚:さかな:fish|兎:うさぎ:rabbit|亀:かめ:turtle|牛:うし:cow|羊:ひつじ:sheep|猿:さる:monkey|豚:ぶた:pig',
  '車:くるま:car|時計:とけい:clock|机:つくえ:desk|かばん:かばん:bag|椅子:いす:chair|自転車:じてんしゃ:bicycle|靴:くつ:shoe|傘:かさ:umbrella|箱:はこ:box|帽子:ぼうし:hat|財布:さいふ:wallet',
  '田中さん:たなかさん:Tanaka|山田さん:やまださん:Yamada|佐藤さん:さとうさん:Sato|鈴木さん:すずきさん:Suzuki|高橋さん:たかはしさん:Takahashi|伊藤さん:いとうさん:Ito|中村さん:なかむらさん:Nakamura|小林さん:こばやしさん:Kobayashi|加藤さん:かとうさん:Kato|吉田さん:よしださん:Yoshida|山本さん:やまもとさん:Yamamoto',
  '七時:しちじ:seven|八時:はちじ:eight|九時:くじ:nine|六時:ろくじ:six|一時:いちじ:one|二時:にじ:two|三時:さんじ:three|四時:よじ:four|五時:ごじ:five|十時:じゅうじ:ten|十一時:じゅういちじ:eleven',
  '毎日:まいにち:every day|朝:あさ:in the morning|夜:よる:at night|毎朝:まいあさ:every morning|毎晩:まいばん:every evening|毎週:まいしゅう:every week|毎月:まいつき:every month|毎年:まいとし:every year|週末:しゅうまつ:on weekends|午後:ごご:in the afternoon|夕方:ゆうがた:in the evening',
].map((group) => group.split('|').map((word) => word.split(':')));

function expandedSentences(examples: ReturnType<typeof sentence>[]) {
  const result: ReturnType<typeof sentence>[] = [];
  const seen = new Set(examples.map((s) => s.text));
  for (const source of examples) {
    for (const group of practiceWords) {
      const from = group.find(([text]) => source.tiles.some((t) => t.text === text));
      if (!from) continue;
      for (const to of group) {
        if (to === from) continue;
        const replace = (value: string) =>
          value.replaceAll(from[0], to[0]).replaceAll(from[1], to[1]);
        const translate = (value: string) => value.replaceAll(from[2], to[2]);
        // Only substitute words whose English counterpart is explicitly present.
        if (!source.meaning.includes(from[2])) continue;
        const next = {
          ...source,
          text: replace(source.text),
          reading: replace(source.reading),
          meaning: translate(source.meaning),
          tiles: source.tiles.map((t) => ({
            ...t,
            text: replace(t.text),
            reading: replace(t.reading),
          })),
          tokens: source.tokens.map((t) => ({
            ...t,
            text: replace(t.text),
            reading: replace(t.reading || ''),
          })),
          translationTokens: source.translationTokens?.map((t) => ({
            ...t,
            text: translate(t.text),
          })),
        };
        if (!seen.has(next.text)) {
          seen.add(next.text);
          result.push(next);
        }
        if (result.length === 25) return result;
      }
    }
  }
  if (result.length < 17)
    throw new Error('Not enough variants: ' + examples[0].text + ' (' + result.length + ')');
  return result;
}

const vocabulary = Object.fromEntries(
  "私:I / me|学生:student|田中さん:Tanaka (a person's name)|先生:teacher|本:book|時計:clock / watch|学校:school|車:car|母:my mother|かばん:bag|毎日:every day|勉強し:study (verb stem)|朝:morning|働き:work (verb stem)|歩き:walk (verb stem)|夜:night|水:water|飲みます:drink|読みます:read|食べます:eat|お茶:tea|パン:bread|図書館:library|勉強します:study|家:home / house|行きます:go|帰ります:return|日本:Japan|七時:seven o'clock|起きます:get up|八時:eight o'clock|九時:nine o'clock|六時:six o'clock|机:desk|猫:cat|犬:dog|部屋:room|昨日:yesterday|休み:day off / rest|雨:rain|飲みません:do not drink|読みません:do not read|食べません:do not eat|今日:today|働きません:do not work|読みました:read (past)|飲みました:drank|食べました:ate|行きました:went|面白い:interesting|高い:expensive / high|大きい:big|新しい:new|静か:quiet|便利:convenient|きれい:clean / beautiful|町:town|好きです:like|ほしいです:want a thing|飲みたいです:want to drink|読みたいです:want to read|食べたいです:want to eat|行きたいです:want to go|読んで:read (て-form)|飲んで:drink (て-form)|名前:name|書いて:write (て-form)|食べて:eat (て-form)|今:now|読んでいます:am reading|飲んでいます:am drinking|書いています:am writing|食べています:am eating"
    .split('|')
    .map((row) => row.split(':')),
);
function sentence(row: string, id: string, index: number, wrong = false) {
  const [words, kana, meaning] = row.split('|');
  const texts = words.split(' ');
  const readings = kana.split(' ');
  if (texts.length !== readings.length) throw new Error('Unaligned grammar sentence: ' + row);
  const tiles = texts.map((text, i) => ({ text, reading: readings[i] }));
  return {
    text: texts.join('') + '。',
    reading: readings.join('') + '。',
    meaning,
    ...annotateGrammarSentence(tiles, id, index, meaning, wrong),
  };
}
function variants(tiles: ReadingText[]): string[] {
  return [
    ...new Set(
      tiles.reduce<string[]>(
        (all, t) => all.flatMap((prefix) => [prefix + t.text, prefix + t.reading]),
        [''],
      ),
    ),
  ];
}
export const grammarCourse: Record<string, { lesson: GrammarLesson; exercises: GuidedExercise[] }> =
  Object.fromEntries(
    authored
      .trim()
      .split('\n@')
      .map((block, index) => {
        const [header, ...rows] = block.replace(/^@/, '').split('\n');
        const [id, group, goal, prereqs, comparison, hint, gapNumber] = header.split('|');
        const examples = rows.slice(0, 4).map((row, i) => sentence(row, id, i));
        const [a, b, c, d] = examples;
        const wrong = sentence(rows[4].slice(1), id, 0, true);
        const gapIndex = Number(gapNumber);
        const gap = b.tiles[gapIndex];
        const gapParts = b.tiles.map((t, i) =>
          i === gapIndex ? { ...t, text: '___', reading: '___' } : t,
        );
        const context = {
          tokens: annotateGrammarSentence(gapParts, id, 1, b.meaning).tokens,
          text: b.tiles.map((t, i) => (i === gapIndex ? '___' : t.text)).join('') + '。',
          reading: b.tiles.map((t, i) => (i === gapIndex ? '___' : t.reading)).join('') + '。',
        };
        const base = { hint, explanation: comparison };
        const exercises: GuidedExercise[] = [
          {
            ...base,
            id: 'meaning',
            type: 'meaning-choice',
            prompt: 'Choose the meaning of this sentence.',
            context: a,
            choices: [
              { text: a.meaning, reading: '' },
              { text: wrong.meaning, reading: '' },
            ],
            answers: [a.meaning],
            feedback: a,
          },
          {
            ...base,
            id: 'pattern',
            type: 'pattern-choice',
            prompt: 'Choose the correct Japanese: ' + a.meaning,
            choices: [a, wrong],
            answers: variants(a.tiles),
            feedback: a,
          },
          {
            ...base,
            id: 'gap',
            type: 'gap',
            prompt: 'Fill the gap: ' + b.meaning,
            context,
            answers: [gap.text, gap.reading],
            feedback: b,
          },
          {
            ...base,
            id: 'tiles',
            type: 'tiles',
            prompt: 'Build this sentence: ' + b.meaning,
            tiles: b.tiles,
            answers: variants(b.tiles),
            feedback: b,
          },
          {
            ...base,
            id: 'typing',
            type: 'typing',
            prompt: 'Write in Japanese: ' + c.meaning,
            answers: variants(c.tiles),
            feedback: c,
          },
          {
            ...base,
            id: 'alternate',
            type: 'typing',
            prompt: 'One more example: ' + d.meaning,
            answers: variants(d.tiles),
            feedback: d,
            alternate: true,
          },
        ];
        for (const [i, example] of expandedSentences(examples).entries()) {
          for (const type of ['tiles', 'typing', 'meaning-choice'] as const) {
            if (exercises.length >= 56) break;
            exercises.push({
              ...base,
              id: `extra-${i + 1}-${type}`,
              type,
              prompt:
                type === 'meaning-choice'
                  ? 'Choose the meaning: ' + example.text
                  : (type === 'tiles' ? 'Build this sentence: ' : 'Write in Japanese: ') +
                    example.meaning,
              ...(type === 'meaning-choice'
                ? {
                    context: example,
                    choices: [
                      { text: example.meaning, reading: '' },
                      {
                        text: examples.find((s) => s.meaning !== example.meaning)!.meaning,
                        reading: '',
                      },
                    ],
                  }
                : {}),
              ...(type === 'tiles' ? { tiles: example.tiles } : {}),
              answers: type === 'meaning-choice' ? [example.meaning] : variants(example.tiles),
              feedback: example,
            });
          }
        }
        // Destination particles are interchangeable in these particular authored sentences.
        if (id === 'destination')
          for (const ex of exercises.filter(
            (e) => e.type !== 'meaning-choice' && e.type !== 'pattern-choice',
          ))
            ex.answers = [
              ...new Set([
                ...ex.answers,
                ...ex.answers.map((a) =>
                  a === 'に' ? 'へ' : a.replace(/に(?=行|いき|帰|かえ)/, 'へ'),
                ),
              ]),
            ];
        // The noun-negative sentences also accept common polite equivalent endings.
        if (id === 'noun-negative')
          for (const ex of exercises.filter((e) => e.type !== 'meaning-choice'))
            ex.answers = [
              ...new Set(
                ex.answers.flatMap((a) => [
                  a,
                  a.replace('じゃありません', 'ではありません'),
                  a.replace('じゃありません', 'じゃないです'),
                ]),
              ),
            ];
        const lesson: GrammarLesson = {
          order: index + 1,
          group,
          goal,
          prerequisites: prereqs ? prereqs.split(',').map((p) => 'grammar-' + p) : [],
          recap: comparison,
          comparison,
          examples: examples.slice(0, 3).map((s) => ({
            japanese: s.text,
            reading: s.reading,
            meaning: s.meaning,
            tokens: s.tokens,
            translationTokens: s.translationTokens,
          })),
          vocabulary: [
            ...new Map(
              examples
                .flatMap((s) => s.tiles)
                .filter((t) => vocabulary[t.text])
                .map((t) => [t.text, { ...t, meaning: vocabulary[t.text] }]),
            ).values(),
          ],
        };
        return ['grammar-' + id, { lesson, exercises }];
      }),
  );
