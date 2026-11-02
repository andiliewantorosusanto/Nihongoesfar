import type {Entry} from './content.ts';
import type {ReadingText,GuidedExercise} from './grammar-course.ts';
export type ReferenceTable={heading:string;columns:string[];rows:ReadingText[][]};
const c=(text:string,reading=''):ReadingText=>({text,reading});
const table=(heading:string,columns:string[],rows:(string|ReadingText)[][]):ReferenceTable=>({heading,columns,rows:rows.map(row=>row.map(v=>typeof v==='string'?c(v):v))});
const tag='Class topics';
// Authored chunks keep the Japanese, kana and English role colors together.
function s(japanese:string,english:string):Entry['examples'][number]{
 const tokens=japanese.split('|').map(part=>{const [text,reading,role]=part.split('~');return {text,reading,role,wordClass:role==='particle'?'particle':role==='predicate'?'predicate':'noun phrase'}});
 const translationTokens=english.split('|').map(part=>{const [text,role]=part.split('~');return {text,role,...(role==='implicit'?{implicit:true}:{})}});
 return {japanese:tokens.map(t=>t.text).join('')+'。',reading:tokens.map(t=>t.reading).join('')+'。',meaning:translationTokens.map(t=>t.text).join(''),tokens,translationTokens};
}
const rt=(sample:Entry['examples'][number])=>({text:sample.japanese,reading:sample.reading,meaning:sample.meaning,tokens:sample.tokens,translationTokens:sample.translationTokens});
function answers(sample:Entry['examples'][number]){return [...new Set(sample.tokens!.reduce<string[]>((all,t)=>all.flatMap(p=>[p+t.text,p+t.reading]),['']))]}
function exercises(samples:Entry['examples'],note:string,gapIndex=1):GuidedExercise[]{
 const [a,b,d]=samples,last=samples[3]||d,part=b.tokens![gapIndex],gap=b.tokens!.map((t,i)=>i===gapIndex?{...t,text:'___',reading:'___'}:t);
 const common={hint:'Look at the examples and the comparison table. Notice the particle or ending being used.',explanation:note};
 return [
 {...common,id:'meaning',type:'meaning-choice',prompt:'Choose the meaning of this sentence.',context:rt(a),choices:[c(a.meaning),c(b.meaning)],answers:[a.meaning],feedback:rt(a)},
 {...common,id:'pattern',type:'pattern-choice',prompt:'Choose the Japanese: '+b.meaning,choices:[rt(a),rt(b)],answers:answers(b),feedback:rt(b)},
 {...common,id:'gap',type:'gap',prompt:'Fill the missing part: '+b.meaning,context:{text:gap.map(t=>t.text).join('')+'。',reading:gap.map(t=>t.reading).join('')+'。',tokens:gap},answers:[part.text,part.reading!],feedback:rt(b)},
 {...common,id:'tiles',type:'tiles',prompt:'Build: '+b.meaning,tiles:b.tokens!.map(t=>({text:t.text,reading:t.reading!,role:t.role,wordClass:t.wordClass})),answers:answers(b),feedback:rt(b)},
 {...common,id:'typing',type:'typing',prompt:'Write in Japanese: '+d.meaning,answers:answers(d),feedback:rt(d)},
 {...common,id:'alternate',type:'typing',prompt:'Another example: '+last.meaning,answers:answers(last),feedback:rt(last),alternate:true},
 ];
}
function guide(id:string,kind:Entry['kind'],title:string,note:string,samples:Entry['examples'],references:ReferenceTable[],gapIndex=1):Entry{
 return {id:'study-'+id,kind,title,japanese:samples[0].japanese,reading:samples[0].reading,meaning:title,level:'N5',topic:kind==='numbers'?'Calendar, numbers & age':kind==='vocabulary'?'Family & daily life':'Class grammar',tags:[tag],note,examples:samples,references,exercises:exercises(samples,note,gapIndex)};
}
function word(id:string,kind:Entry['kind'],japanese:string,reading:string,meaning:string,note:string,romaji?:string):Entry{
 return {id:'study-'+id,kind,title:japanese,japanese,reading,meaning,romaji,level:kind==='kana'?'Foundation':'N5',topic:kind==='kana'?'Katakana':kind==='numbers'?'Numbers':'Class vocabulary',tags:[tag,...(kind==='kana'?['Loanword sounds']:[])],note,examples:[{japanese,reading,meaning}]};
}
export const largeNumberAnchors=[
 {value:10,japanese:'十',kana:'じゅう',romaji:'juu'},
 {value:100,japanese:'百',kana:'ひゃく',romaji:'hyaku'},
 {value:1000,japanese:'千',kana:'せん',romaji:'sen'},
 {value:10000,japanese:'一万',kana:'いちまん',romaji:'ichi-man'},
 {value:100000,japanese:'十万',kana:'じゅうまん',romaji:'juu-man'},
 {value:1000000,japanese:'百万',kana:'ひゃくまん',romaji:'hyaku-man'},
];
export function makeStudyEntries(existing:Entry[]):Entry[]{
 const result:Entry[]=[];
 const push=(entry:Entry)=>result.push(entry);
 push(guide('kore-sore-are','grammar','これ・それ・あれ — this, that, that over there','これ is near the speaker; それ is near the listener or refers to something just mentioned; あれ is away from both. These words stand alone. Use この / その / あの directly before a noun.',[
 s('これ~これ~topic|は~は~particle|本です~ほんです~predicate','This~topic| is a book.~predicate'),
 s('それ~それ~topic|は~は~particle|時計です~とけいです~predicate','That~topic| is a clock.~predicate'),
 s('あれ~あれ~topic|は~は~particle|学校です~がっこうです~predicate','That over there~topic| is a school.~predicate'),
 s('これ~これ~topic|は~は~particle|何です~なんです~predicate|か~か~particle','What is ~predicate|this~topic|?~particle'),
 ],[table('Stand-alone pointing words',['Word','Meaning'],[[c('これ','これ'),'this (near me)'],[c('それ','それ'),'that (near you / just mentioned)'],[c('あれ','あれ'),'that over there (away from both)']])]));
 push(guide('kono-sono-ano','grammar','この・その・あの — before a noun','この / その / あの must be followed by a noun. この本 means “this book”; この alone cannot replace これ. The near-me / near-you / far-from-both distinction is the same.',[
 s('この~この~modifier|本~ほん~topic|は~は~particle|私のです~わたしのです~predicate','This ~modifier|book~topic| is mine.~predicate'),
 s('その~その~modifier|時計~とけい~topic|は~は~particle|先生のです~せんせいのです~predicate',"That ~modifier|clock~topic| is the teacher's.~predicate"),
 s('あの~あの~modifier|車~くるま~topic|は~は~particle|母のです~ははのです~predicate',"That ~modifier|car~topic| over there~modifier| is my mother's.~predicate"),
 s('この~この~modifier|かばん~かばん~topic|は~は~particle|私のです~わたしのです~predicate','This ~modifier|bag~topic| is mine.~predicate'),
 ],[table('A pointing word plus a noun',['Pattern','Example'],[[c('この','この'),c('この本','このほん')],[c('その','その'),c('その時計','そのとけい')],[c('あの','あの'),c('あの車','あのくるま')]])],0));
 const particleNotes={
 wa:'は is written ha but pronounced wa when it is a particle. It sets the topic: “As for ...”. It can contrast topics. It is not automatically the grammatical subject.',
 ga:'が (ga) marks the subject. In basic existence sentences, it identifies what is present. は sets a topic; が can introduce the subject as new information or answer “who/what?”. They are not freely interchangeable in every sentence.',
 o:'を is written wo but normally pronounced o. It marks the direct object of an action such as eating, drinking, or reading. It can also mark a route or place traversed, as in 公園を歩きます (walk through the park).',
 e:'へ is written he but pronounced e as a particle. It marks direction or a destination of movement. It is not limited to 行きます, 来ます, and 帰ります: 駅へ歩きます means “walk toward the station”. に also marks destinations with many movement verbs; で marks where an action happens. Do not replace every に with へ: specific times and existence locations use に.',
 };
 const particleExamples={
 wa:[s('私~わたし~topic|は~は~particle|学生です~がくせいです~predicate','I~topic| am a student.~predicate'),s('母~はは~topic|は~は~particle|先生です~せんせいです~predicate','My mother~topic| is a teacher.~predicate'),s('今日~きょう~topic|は~は~particle|休みです~やすみです~predicate','Today~topic| is a day off.~predicate'),s('これ~これ~topic|は~は~particle|本です~ほんです~predicate','This~topic| is a book.~predicate')],
 ga:[s('猫~ねこ~subject|が~が~particle|います~います~predicate','There is ~predicate|a cat.~subject'),s('本~ほん~subject|が~が~particle|あります~あります~predicate','There is ~predicate|a book.~subject'),s('先生~せんせい~subject|が~が~particle|います~います~predicate','There is ~predicate|a teacher.~subject'),s('犬~いぬ~subject|が~が~particle|います~います~predicate','There is ~predicate|a dog.~subject')],
 o:[s('水~みず~object|を~を~particle|飲みます~のみます~predicate','I ~implicit|drink ~predicate|water.~object'),s('本~ほん~object|を~を~particle|読みます~よみます~predicate','I ~implicit|read ~predicate|a book.~object'),s('パン~ぱん~object|を~を~particle|食べます~たべます~predicate','I ~implicit|eat ~predicate|bread.~object'),s('公園~こうえん~modifier|を~を~particle|歩きます~あるきます~predicate','I ~implicit|walk~predicate| through the park.~modifier')],
 e:[s('学校~がっこう~modifier|へ~へ~particle|行きます~いきます~predicate','I ~implicit|go~predicate| to school.~modifier'),s('日本~にほん~modifier|へ~へ~particle|来ます~きます~predicate','I ~implicit|come~predicate| to Japan.~modifier'),s('家~いえ~modifier|へ~へ~particle|帰ります~かえります~predicate','I ~implicit|return~predicate| home.~modifier'),s('駅~えき~modifier|へ~へ~particle|歩きます~あるきます~predicate','I ~implicit|walk~predicate| toward the station.~modifier')],
 };
 for(const [key,japanese,pronunciation] of [['wa','は','wa'],['ga','が','ga'],['o','を','o'],['e','へ','e']] as const)push(guide('particle-'+key,'grammar',japanese+' — the '+pronunciation+' particle',particleNotes[key],particleExamples[key],[table('Spelling and particle pronunciation',['Written','Said as'],[[c(japanese,japanese),pronunciation]])]));
 const family=[
 ['father','父','ちち','お父さん','おとうさん'],['mother','母','はは','お母さん','おかあさん'],['older brother','兄','あに','お兄さん','おにいさん'],['older sister','姉','あね','お姉さん','おねえさん'],['younger brother','弟','おとうと','弟さん','おとうとさん'],['younger sister','妹','いもうと','妹さん','いもうとさん'],['grandfather','祖父','そふ','おじいさん','おじいさん'],['grandmother','祖母','そぼ','おばあさん','おばあさん'],['husband','夫','おっと','ご主人','ごしゅじん'],['wife','妻','つま','奥さん','おくさん'],['son','息子','むすこ','息子さん','むすこさん'],['daughter','娘','むすめ','娘さん','むすめさん'],['parents','両親','りょうしん','ご両親','ごりょうしん'],['family','家族','かぞく','ご家族','ごかぞく'],
 ];
 push(guide('family','vocabulary','Family — my family and someone else’s family','Use the plain family terms when describing your own family to outsiders. Use polite terms for someone else’s family. お父さん, お母さん, お兄さん, and お姉さん are also common ways of addressing your own relatives. The polite-reference column is not a universal list of direct forms of address; spouses are often addressed by name. おばさん (aunt) and おばあさん (grandmother) differ in vowel length; so do おじさん and おじいさん.',[
 s('父~ちち~topic|は~は~particle|会社員です~かいしゃいんです~predicate','My father~topic| is a company employee.~predicate'),s('母~はは~topic|は~は~particle|先生です~せんせいです~predicate','My mother~topic| is a teacher.~predicate'),s('兄~あに~topic|は~は~particle|学生です~がくせいです~predicate','My older brother~topic| is a student.~predicate'),s('お父さん~おとうさん~topic|は~は~particle|先生です~せんせいです~predicate|か~か~particle','Is ~predicate|your father~topic| a teacher~predicate|?~particle'),
 ],[table('Whose family are you describing?',['Relationship','My family (to outsiders)','Someone else’s family'],family.map(([meaning,a,ar,b,br])=>[meaning,c(a,ar),c(b,br)]))]));
 for(const [meaning,a,ar,b,br] of family)for(const [jp,r,context] of [[a,ar,'my '+meaning+' (speaking to outsiders)'],[b,br,"someone else’s "+meaning+' (polite reference)']]){
  if(!existing.some(e=>e.kind==='vocabulary'&&e.japanese===jp))push(word('family-'+[...jp].map(c=>c.codePointAt(0)!.toString(16)).join('-'),'vocabulary',jp,r,context,'See the Family comparison guide for the distinction between talking about your own family and someone else’s family.'));
 }
 for(const [jp,r,en,romaji,form] of [['行きます','いきます','go','ikimasu','行く（いく）'],['来ます','きます','come','kimasu','来る（くる）'],['帰ります','かえります','return home','kaerimasu','帰る（かえる）']]){
  const e=word('movement-'+romaji,'vocabulary',jp,r,en,'Polite form of '+form+'. Destination + に / へ is possible. 行きます goes away from the current viewpoint; 来ます comes toward it; 帰ります returns to home or a familiar base. へ is not limited to these three verbs.',romaji);
  e.examples=particleExamples.e.filter(ex=>ex.japanese.includes(jp));push(e);
 }
 const nameSamples=[s('お名前~おなまえ~topic|は~は~particle|何です~なんです~predicate|か~か~particle','What is ~predicate|your name~topic|?~particle'),s('アリです~ありです~predicate','My name~implicit| is Ali.~predicate'),s('田中です~たなかです~predicate','My name~implicit| is Tanaka.~predicate'),s('ハナです~はなです~predicate','My name~implicit| is Hana.~predicate')];
 push(guide('ask-name','grammar','Ask and answer: your name','Ask お名前は何ですか (おなまえはなんですか). Answer with your name + です, or 名前は～です. The names here are fictional examples; substitute your own name.',nameSamples,[table('Name',['Question','Example answer'],[[c('お名前は何ですか','おなまえはなんですか'),c('アリです','ありです')]])],0));
 const jobSamples=[s('お仕事~おしごと~topic|は~は~particle|何です~なんです~predicate|か~か~particle','What is ~predicate|your job~topic|?~particle'),s('会社員です~かいしゃいんです~predicate','I ~implicit|am a company employee.~predicate'),s('学生です~がくせいです~predicate','I ~implicit|am a student.~predicate'),s('教師です~きょうしです~predicate','I ~implicit|am a teacher.~predicate')];
 push(guide('ask-job','grammar','Ask and answer: your job','Ask お仕事は何ですか (おしごとはなんですか). Answer with your occupation + です. A student can answer 学生です. These are example answers, not information about the visitor.',jobSamples,[table('Useful answers',['Japanese','Meaning'],[[c('会社員','かいしゃいん'),'company employee'],[c('学生','がくせい'),'student'],[c('教師','きょうし'),'teacher (occupation)'],[c('医者','いしゃ'),'doctor']])],0));
 const hobbySamples=[s('ご趣味~ごしゅみ~topic|は~は~particle|何です~なんです~predicate|か~か~particle','What is ~predicate|your hobby~topic|?~particle'),s('趣味~しゅみ~topic|は~は~particle|読書です~どくしょです~predicate','My hobby~topic| is reading.~predicate'),s('趣味~しゅみ~topic|は~は~particle|料理です~りょうりです~predicate','My hobby~topic| is cooking.~predicate'),s('趣味~しゅみ~topic|は~は~particle|音楽です~おんがくです~predicate','My hobby~topic| is music.~predicate')];
 push(guide('ask-hobby','grammar','Ask and answer: your hobby','Ask 趣味は何ですか or the polite ご趣味は何ですか (ごしゅみはなんですか). Answer 趣味は～です. Use a noun such as 読書 (reading) or 料理 (cooking).',hobbySamples,[table('Hobbies',['Japanese','Meaning'],[[c('読書','どくしょ'),'reading'],[c('料理','りょうり'),'cooking'],[c('音楽','おんがく'),'music'],[c('旅行','りょこう'),'travel']])]));
 const routineRows=[
 ['Wake up','何時に起きますか','なんじにおきますか','六時に起きます','ろくじにおきます','What time do you wake up? → I wake up at six.'],
 ['Go to school','何時に学校に行きますか','なんじにがっこうにいきますか','八時に学校に行きます','はちじにがっこうにいきます','What time do you go to school? → I go at eight.'],
 ['Go to work','何時に仕事に行きますか','なんじにしごとにいきますか','九時に仕事に行きます','くじにしごとにいきます','What time do you go to work? → I go at nine.'],
 ['Travel to school','学校までどのくらいかかりますか','がっこうまでどのくらいかかりますか','三十分かかります','さんじゅっぷんかかります','How long does it take to get to school? → It takes thirty minutes.'],
 ['Travel to work','職場までどのくらいかかりますか','しょくばまでどのくらいかかりますか','一時間かかります','いちじかんかかります','How long does it take to get to work? → It takes an hour.'],
 ['Time at school','毎日何時間学校にいますか','まいにちなんじかんがっこうにいますか','六時間います','ろくじかんいます','How many hours are you at school each day? → Six hours.'],
 ['Hours of work','毎日何時間働きますか','まいにちなんじかんはたらきますか','八時間働きます','はちじかんはたらきます','How many hours do you work each day? → Eight hours.'],
 ['Food','昨日、何を食べましたか','きのう、なにをたべましたか','カレーを食べました','かれーをたべました','What did you eat yesterday? → I ate curry.'],
 ['Cooking','昨日、何を作りましたか','きのう、なにをつくりましたか','晩ご飯にカレーを作りました','ばんごはんにかれーをつくりました','What did you make yesterday? → I made curry for dinner.'],
 ['Activities','昨日、何をしましたか','きのう、なにをしましたか','日本語を勉強しました','にほんごをべんきょうしました','What did you do yesterday? → I studied Japanese.'],
 ['Bedtime','何時に寝ますか','なんじにねますか','十一時に寝ます','じゅういちじにねます','What time do you go to bed? → I go to bed at eleven.']
 ];
 const routineSamples=[
 s('何時~なんじ~modifier|に~に~particle|起きます~おきます~predicate|か~か~particle','What time ~modifier|do you wake up~predicate|?~particle'),
 s('六時~ろくじ~modifier|に~に~particle|起きます~おきます~predicate','At six ~modifier|I wake up.~predicate'),
 s('十一時~じゅういちじ~modifier|に~に~particle|寝ます~ねます~predicate','At eleven ~modifier|I go to bed.~predicate'),
 s('八時~はちじ~modifier|に~に~particle|起きます~おきます~predicate','At eight ~modifier|I wake up.~predicate')];
 push(guide('daily-routine','grammar','Daily routine: ask and answer','何時に asks at what time; 何時間 asks how many hours. Use どのくらいかかりますか for travel time. Answer clock times with に, but durations without に. Use ます for routines and ました for past activities. Replace these example answers with your own.',routineSamples,[table('Daily routine',['Topic','Ask','Example answer','Meaning'],routineRows.map(([label,q,qr,a,ar,en])=>[label,c(q+'。',qr+'。'),c(a+'。',ar+'。'),en]))]));
 const ageSamples=[s('何歳です~なんさいです~predicate|か~か~particle','How old are you~predicate|?~particle'),s('二十歳です~はたちです~predicate','I ~implicit|am twenty years old.~predicate'),s('二十一歳です~にじゅういっさいです~predicate','I ~implicit|am twenty-one years old.~predicate'),s('おいくつです~おいくつです~predicate|か~か~particle','How old are you (more politely)~predicate|?~particle')];
 const ages=[['1','一歳','いっさい'],['2','二歳','にさい'],['3','三歳','さんさい'],['4','四歳','よんさい'],['5','五歳','ごさい'],['6','六歳','ろくさい'],['7','七歳','ななさい'],['8','八歳','はっさい'],['9','九歳','きゅうさい'],['10','十歳','じゅっさい'],['20','二十歳','はたち'],['21','二十一歳','にじゅういっさい'],['30','三十歳','さんじゅっさい'],['40','四十歳','よんじゅっさい']];
 push(guide('ages','numbers','Age — 歳 and asking how old','歳 is read さい (sai). Watch 一歳 (いっさい), 八歳 (はっさい), 十歳 (じゅっさい / じっさい), and 二十歳 (はたち). For 21, return to number + さい: にじゅういっさい. Do not add さい after はたち. Ask 何歳ですか; おいくつですか is more polite. Age can be personal, so ask only when appropriate.',ageSamples,[table('Age readings',['Age','Japanese and reading'],ages.map(([n,jp,r])=>[n,c(jp,r)]))],0));
 push(guide('ask-time','grammar','Ask and answer: what time is it?','Ask 今、何時ですか (いま、なんじですか). Answer with hour + 時（じ）, then minutes + 分（ふん / ぷん）if needed. 半（はん）means half past. This asks clock time; 何時間 asks a duration.',[
 s('今~いま~modifier|何時です~なんじです~predicate|か~か~particle','What time is it~predicate| now~modifier|?~particle'),s('三時です~さんじです~predicate','It is three o’clock.~predicate'),s('四時半です~よじはんです~predicate','It is half past four.~predicate'),s('七時十五分です~しちじじゅうごふんです~predicate','It is seven fifteen.~predicate'),
 ],[table('Time questions',['Japanese','Meaning'],[[c('何時ですか','なんじですか'),'What time is it?'],[c('何時間ですか','なんじかんですか'),'How many hours?']])],0));
 push(guide('existence','grammar','Existence — people and animals versus things','Use います for people and animals, and あります for things and plants. “Living/non-living” is only a rough shortcut: plants are biologically living but normally use あります. Use subject + が + existence verb. Location uses に, not で.',[
 s('猫~ねこ~subject|が~が~particle|います~います~predicate','There is ~predicate|a cat.~subject'),s('本~ほん~subject|が~が~particle|あります~あります~predicate','There is ~predicate|a book.~subject'),s('先生~せんせい~subject|が~が~particle|います~います~predicate','There is ~predicate|a teacher.~subject'),s('花~はな~subject|が~が~particle|あります~あります~predicate','There is ~predicate|a flower.~subject'),
 ],[table('Choose the existence verb',['Use','Positive','Negative'],[['people / animals',c('います','います'),c('いません','いません')],['things / plants',c('あります','あります'),c('ありません','ありません')]])]));
 const calendarSamples=[s('今日~きょう~topic|は~は~particle|何月何日です~なんがつなんにちです~predicate|か~か~particle','What is ~predicate|today’s~topic| date~predicate|?~particle'),s('一月一日です~いちがつついたちです~predicate','It is January first.~predicate'),s('四月四日です~しがつよっかです~predicate','It is April fourth.~predicate'),s('七月二十日です~しちがつはつかです~predicate','It is July twentieth.~predicate')];
 const monthSamples=[s('一月です~いちがつです~predicate','It is January.~predicate'),s('四月です~しがつです~predicate','It is April.~predicate'),s('七月です~しちがつです~predicate','It is July.~predicate'),s('九月です~くがつです~predicate','It is September.~predicate')];
 const weekdaySamples=[s('今日~きょう~topic|は~は~particle|日曜日です~にちようびです~predicate','Today~topic| is Sunday.~predicate'),s('明日~あした~topic|は~は~particle|月曜日です~げつようびです~predicate','Tomorrow~topic| is Monday.~predicate'),s('昨日~きのう~topic|は~は~particle|土曜日でした~どようびでした~predicate','Yesterday~topic| was Saturday.~predicate'),s('明後日~あさって~topic|は~は~particle|火曜日です~かようびです~predicate','The day after tomorrow~topic| is Tuesday.~predicate')];
 const numbers=existing.filter(e=>e.kind==='numbers');
 for(const [id,title,topic,note] of [
 ['months','Months — January to December','Months','Calendar months use がつ (gatsu). April is しがつ, July is しちがつ, and September is くがつ. Duration uses か月（かげつ）instead: 二月 is February, 二か月 is two months.'],
 ['dates','Dates — the 1st to the 31st','Dates','Read a full date in year → month → day order. January 1 is 一月一日（いちがつついたち）. The first is ついたち, but a duration of one day is いちにち. Watch 14（じゅうよっか）, 20（はつか）, and 24（にじゅうよっか）.'],
 ['weekdays','Days of the week — 日・月・火・水・木・金・土','Weekdays','Weekday names end in 曜日（ようび）. The weekday abbreviations read にち・げつ・か・すい・もく・きん・ど. These are readings in weekday names, not the only readings of each kanji. Ask 何曜日ですか（なんようびですか）for the weekday; ask 何日ですか（なんにちですか）for the date.'],
 ])push(guide(id,'numbers',title,note,topic==='Months'?monthSamples:topic==='Weekdays'?weekdaySamples:calendarSamples,[table(title,['Meaning','Japanese and reading'],numbers.filter(e=>e.topic===topic).map(e=>[e.meaning,c(e.japanese,e.reading)]))],0));
 const relative=[['day','一昨日','おととい','昨日','きのう','今日','きょう','明日','あした','明後日','あさって'],['week','先々週','せんせんしゅう','先週','せんしゅう','今週','こんしゅう','来週','らいしゅう','再来週','さらいしゅう'],['month','先々月','せんせんげつ','先月','せんげつ','今月','こんげつ','来月','らいげつ','再来月','さらいげつ'],['year','一昨年','おととし','去年','きょねん','今年','ことし','来年','らいねん','再来年','さらいねん']];
 const relativeSamples=[s('今日~きょう~topic|は~は~particle|休みです~やすみです~predicate','Today~topic| is a day off.~predicate'),s('昨日~きのう~topic|は~は~particle|休みでした~やすみでした~predicate','Yesterday~topic| was a day off.~predicate'),s('明日~あした~modifier|学校~がっこう~modifier|に~に~particle|行きます~いきます~predicate','I ~implicit|will go~predicate| to school~modifier| tomorrow.~modifier'),s('明後日~あさって~modifier|学校~がっこう~modifier|に~に~particle|行きます~いきます~predicate','I ~implicit|will go~predicate| to school~modifier| the day after tomorrow.~modifier')];
 push(guide('relative-time','numbers','Relative time — yesterday, today, tomorrow','一昨日（おととい）means two days ago (the day before yesterday); 明後日（あさって）is the day after tomorrow. 二日（ふつか）can mean a duration of two days; it does not mean the day after tomorrow by itself. Relative time expressions usually do not take に.',relativeSamples,[table('Relative day, week, month, year',['Period','Two before','Previous','Current','Next','Two after'],relative.map(row=>[row[0],...Array.from({length:5},(_,i)=>c(row[1+i*2],row[2+i*2]))]))]));
 const durationRows=[['one day','一日','いちにち'],['two days','二日間','ふつかかん'],['three days','三日間','みっかかん'],['one week','一週間','いっしゅうかん'],['two weeks','二週間','にしゅうかん'],['one month','一か月','いっかげつ'],['two months','二か月','にかげつ'],['six months','六か月','ろっかげつ'],['one year','一年間','いちねんかん'],['two years','二年間','にねんかん']];
 const durationSamples=[s('二日間~ふつかかん~modifier|休みます~やすみます~predicate','I ~implicit|will rest~predicate| for two days.~modifier'),s('二週間~にしゅうかん~modifier|勉強します~べんきょうします~predicate','I ~implicit|will study~predicate| for two weeks.~modifier'),s('二か月~にかげつ~modifier|働きます~はたらきます~predicate','I ~implicit|will work~predicate| for two months.~modifier'),s('二年間~にねんかん~modifier|勉強します~べんきょうします~predicate','I ~implicit|will study~predicate| for two years.~modifier')];
 push(guide('durations','numbers','Durations — days, weeks, months, years','A calendar date and a duration are different. 一日 is ついたち for the first day of a month, but いちにち for a duration. 二日 / 二日間 is two days. 週間 measures weeks; か月 measures months; 年 / 年間 measures years. 二月（にがつ）is February, not a two-month duration.',durationSamples,[table('How long?',['Duration','Japanese and reading'],durationRows.map(([en,jp,r])=>[en,c(jp,r)]))],0));
 const every=[['every day','毎日','まいにち'],['every morning','毎朝','まいあさ'],['every evening','毎晩','まいばん'],['every week','毎週','まいしゅう'],['every month','毎月','まいつき'],['every year','毎年','まいとし']];
 push(guide('every','numbers','Every day, every morning — 毎','毎 means “every”. 毎月 is commonly まいつき (also まいげつ); 毎年 can be まいとし or まいねん. These expressions normally do not take に. Keep 毎朝（every morning）distinct from 今朝（けさ, this morning）.',[
 s('毎日~まいにち~modifier|勉強します~べんきょうします~predicate','I ~implicit|study~predicate| every day.~modifier'),s('毎朝~まいあさ~modifier|水~みず~object|を~を~particle|飲みます~のみます~predicate','I ~implicit|drink ~predicate|water~object| every morning.~modifier'),s('毎晩~まいばん~modifier|本~ほん~object|を~を~particle|読みます~よみます~predicate','I ~implicit|read ~predicate|a book~object| every evening.~modifier'),s('毎週~まいしゅう~modifier|勉強します~べんきょうします~predicate','I ~implicit|study~predicate| every week.~modifier'),
 ],[table('Every ...',['Meaning','Japanese and reading'],every.map(([en,jp,r])=>[en,c(jp,r)]))],0));
 for(const [en,jp,r] of [...every,...durationRows])if(!existing.some(e=>e.japanese===jp&&e.kind!=='kanji'))push(word('time-'+[...jp].map(c=>c.codePointAt(0)!.toString(16)).join('-'),'vocabulary',jp,r,en,'See the calendar and duration guides. Calendar months use がつ; month durations use かげつ.'));
 for(const [index,row] of relative.entries())for(let i=0;i<5;i++){const jp=row[1+i*2],r=row[2+i*2];if(!existing.some(e=>e.japanese===jp&&e.kind!=='kanji'))push(word('relative-'+index+'-'+i,'vocabulary',jp,r,[['two days ago','yesterday','today','tomorrow','the day after tomorrow'],['the week before last','last week','this week','next week','the week after next'],['the month before last','last month','this month','next month','the month after next'],['the year before last','last year','this year','next year','the year after next']][index][i],'Relative time expressions normally do not take に.'))}
 const numberRows=[...largeNumberAnchors.map(r=>[r.value.toLocaleString('en'),r.japanese,r.kana]),['12,345','一万二千三百四十五','いちまんにせんさんびゃくよんじゅうご'],['100,001','十万一','じゅうまんいち'],['999,999','九十九万九千九百九十九','きゅうじゅうきゅうまんきゅうせんきゅうひゃくきゅうじゅうきゅう']];
 const priceSamples=[s('一万円です~いちまんえんです~predicate','It costs 10,000 yen.~predicate'),s('十万円です~じゅうまんえんです~predicate','It costs 100,000 yen.~predicate'),s('百万円です~ひゃくまんえんです~predicate','It costs 1,000,000 yen.~predicate'),s('一万二千三百四十五円です~いちまんにせんさんびゃくよんじゅうごえんです~predicate','It costs 12,345 yen.~predicate')];
 push(guide('large-numbers','numbers','Numbers through one million — 十・百・千・万','Japanese large numbers group in units of 10,000 (万), not 1,000. Ten thousand is 一万, one hundred thousand is 十万, and one million is 百万 (100 × 10,000). Build the 万 part, then the thousands, hundreds, tens and units. Say ひゃく and usually せん without いち. In the examples, 円（えん）means yen.',priceSamples,[table('Large number anchors and examples',['Value','Japanese and reading'],numberRows.map(([n,jp,r])=>[n,c(jp,r)]))],0));
 for(const [n,jp,r] of numberRows)if(!existing.some(e=>e.kind==='numbers'&&e.japanese===jp)){
  const e=word('number-'+n.replaceAll(',',''),'numbers',jp,r,n,'Large numbers group around 万 (10,000). One million is 百万（ひゃくまん）.');e.exercise={prompt:'Read '+jp+' in kana.',answers:[r],explanation:e.note};push(e);
 }
 for(const [n,jp,r] of ages)if(!existing.some(e=>e.kind==='numbers'&&e.japanese===jp)){const e=word('age-'+n,'numbers',jp,r,n+' years old','Age uses 歳（さい）. Watch 1, 8, 10 and 20.');e.exercise={prompt:'Read '+jp+' in kana.',answers:[r,...(r.includes('じゅっ')?[r.replace('じゅっ','じっ')]:[])],explanation:e.note};push(e)}
 const loanGroups=[['v','ヴァ ヴィ ヴ ヴェ ヴォ ヴュ','va vi vu ve vo vyu'],['w','ワ ウィ ウ ウェ ウォ','wa wi u we wo'],['f','ファ フィ フ フェ フォ フュ','fa fi fu fe fo fyu'],['ch','チャ チ チュ チェ チョ','cha chi chu che cho'],['sh','シャ シ シュ シェ ショ','sha shi shu she sho'],['j','ジャ ジ ジュ ジェ ジョ','ja ji ju je jo'],['t','ティ トゥ テュ','ti tu tyu'],['d','ディ ドゥ デュ','di du dyu']];
 const kanaGuide=guide('katakana-sounds','vocabulary','Katakana — special and loanword sounds','Small vowels combine with the preceding katakana as one sound unit: フ + small ァ = ファ (fa). ヴ is vu; ウ is u, not a separate modern “wu” character. ワ / ウィ / ウ / ウェ / ウォ give wa / wi / u / we / wo. Standard chi is チ, shi is シ, ji is ジ; use ティ / トゥ for ti / tu and ディ / ドゥ for di / du. ヴ sounds may be approximated with b sounds by some speakers. ヰ and ヱ are historical characters, not the normal modern spellings of wi / we.',[
 s('これ~これ~topic|は~は~particle|ファイルです~ふぁいるです~predicate','This~topic| is a file.~predicate'),s('これ~これ~topic|は~は~particle|フォークです~ふぉーくです~predicate','This~topic| is a fork.~predicate'),s('これ~これ~topic|は~は~particle|チーズです~ちーずです~predicate','This~topic| is cheese.~predicate'),s('これ~これ~topic|は~は~particle|シャツです~しゃつです~predicate','This~topic| is a shirt.~predicate'),
 ],[table('Read each combination as one unit',['Group','Katakana','Sounds'],loanGroups.map(([en,jp,r])=>[en,c(jp,jp.normalize('NFKC').replace(/[ァ-ヶ]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0x60))),r]))],1);kanaGuide.level='Foundation';push(kanaGuide);
 for(const [jp,r,romaji] of [['ヴュ','ゔゅ','vyu'],['フュ','ふゅ','fyu'],['テュ','てゅ','tyu'],['デュ','でゅ','dyu'],['イェ','いぇ','ye'],['ツァ','つぁ','tsa'],['ツィ','つぃ','tsi'],['ツェ','つぇ','tse'],['ツォ','つぉ','tso']])if(!existing.some(e=>e.kind==='kana'&&e.japanese===jp))push(word('kana-'+jp.codePointAt(0)!.toString(16)+'-'+jp.codePointAt(1)!.toString(16),'kana',jp,r,romaji+' sound','Read this combination as one sound unit. The second character is small. See the special katakana comparison guide.',romaji));
 const romanized:Record<string,string>={'study-weekdays':'nichi / getsu / ka / sui / moku / kin / do','study-kore-sore-are':'kore / sore / are','study-kono-sono-ano':'kono / sono / ano','study-particle-e':'e / he','study-particle-o':'o / wo','study-particle-wa':'wa / ha','study-particle-ga':'ga','study-ages':'sai / nansai / oikutsu / hatachi','study-ask-name':'onamae wa nan desu ka','study-ask-job':'oshigoto wa nan desu ka','study-ask-hobby':'goshumi wa nan desu ka','study-ask-time':'ima nanji desu ka','study-every':'mainichi / maiasa / maiban / maishuu / maitsuki / maitoshi','study-large-numbers':'juu / jyuu / hyaku / sen / man / hyakuman'};
 for(const e of result)if(romanized[e.id])e.romaji=romanized[e.id];
 return result;
}
