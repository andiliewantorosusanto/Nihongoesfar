import {test} from 'node:test';
import assert from 'node:assert/strict';
import {proseReadings} from '../app/lib/sentence-support.ts';
import {entries} from '../app/lib/content.ts';
import {largeNumberAnchors} from '../app/lib/study-topics.ts';
import {makePractice,grade,skillsFor,isReadingQuestion} from '../app/lib/learning.ts';
const get=(id:string)=>{const e=entries.find(e=>e.id==='study-'+id);assert.ok(e,id);return e};
test('requested class topics are present with full comparison tables, rather than placeholder entries',()=>{
 for(const id of ['kore-sore-are','kono-sono-ano','particle-e','particle-o','particle-wa','particle-ga','family','ask-name','ask-job','ask-hobby','ask-time','ages','existence','months','dates','weekdays','relative-time','durations','every','large-numbers','katakana-sounds'])assert.ok(get(id).references?.[0].rows.length);
 assert.equal(get('months').references![0].rows.length,12);assert.equal(get('dates').references![0].rows.length,31);assert.equal(get('weekdays').references![0].rows.length,7);assert.equal(get('family').references![0].rows.length,14);
 const family=JSON.stringify(get('family').references);for(const term of ['父','ちち','お父さん','おとうさん','兄','お兄さん','祖父','おじいさん','夫','ご主人','妻','奥さん'])assert.ok(family.includes(term),term);
 for(const [jp,r] of [['行きます','いきます'],['来ます','きます'],['帰ります','かえります']])assert.ok(entries.some(e=>e.kind==='vocabulary'&&e.japanese===jp&&e.reading===r));
 assert.match(get('particle-e').note,/not limited/);assert.match(get('existence').note,/plants/);
});
test('calendar readings distinguish irregular dates, month names, durations and ages',()=>{
 const rows=(id:string)=>get(id).references![0].rows;
 for(const [jp,kana] of [['四月','しがつ'],['七月','しちがつ'],['九月','くがつ']])assert.ok(rows('months').flat().some(c=>c.text===jp&&c.reading===kana));
 for(const [jp,kana] of [['一日','ついたち'],['二日','ふつか'],['十四日','じゅうよっか'],['二十日','はつか'],['二十四日','にじゅうよっか']])assert.ok(rows('dates').flat().some(c=>c.text===jp&&c.reading===kana));
 for(const [jp,kana] of [['一日','いちにち'],['二日間','ふつかかん'],['二週間','にしゅうかん'],['二か月','にかげつ'],['二年間','にねんかん']])assert.ok(rows('durations').flat().some(c=>c.text===jp&&c.reading===kana));
 for(const [jp,kana] of [['一歳','いっさい'],['八歳','はっさい'],['十歳','じゅっさい'],['二十歳','はたち'],['二十一歳','にじゅういっさい']])assert.ok(rows('ages').flat().some(c=>c.text===jp&&c.reading===kana));
 const relative=JSON.stringify(rows('relative-time'));for(const word of ['一昨日','おととい','昨日','今日','明日','明後日','あさって','先週','来月','今年'])assert.ok(relative.includes(word));
 assert.ok(get('ask-name').examples.some(e=>e.japanese==='お名前は何ですか。'));assert.ok(get('ask-time').examples.some(e=>e.japanese==='今何時ですか。'));
});
test('number and katakana additions cover the requested boundaries and spellings',()=>{
 assert.deepEqual(largeNumberAnchors.map(r=>r.value),[10,100,1000,10000,100000,1000000]);assert.equal(largeNumberAnchors.at(-1)!.kana,'ひゃくまん');
 assert.ok(entries.some(e=>e.kind==='numbers'&&e.japanese==='百万'&&e.reading==='ひゃくまん'));
 for(const kana of ['ヴァ','ヴィ','ヴ','ヴェ','ヴォ','ヴュ','ワ','ウィ','ウ','ウェ','ウォ','ファ','フィ','フ','フェ','フォ','フュ','チャ','チュ','チェ','チョ','シャ','シュ','シェ','ショ','ジャ','ジュ','ジェ','ジョ','ティ','トゥ','テュ','ディ','ドゥ','デュ'])assert.ok(entries.some(e=>e.kind==='kana'&&e.japanese===kana),kana);
 assert.match(get('katakana-sounds').note,/not a separate modern/);
});
test('every new guide has varied, readable, color-aligned examples and five valid practice stages',()=>{
 const guides=entries.filter(e=>e.references);
 assert.equal(guides.length,21);
 for(const e of guides){
  assert.equal(e.examples.length,4,e.id);assert.equal(new Set(e.examples.map(x=>x.japanese)).size,4,e.id);
  for(const ex of e.examples){assert.equal(ex.tokens!.map(t=>t.text).join('')+'。',ex.japanese,e.id);assert.equal(ex.tokens!.map(t=>t.reading).join('')+'。',ex.reading,e.id);assert.equal(ex.translationTokens!.map(t=>t.text).join(''),ex.meaning,e.id);const roles=new Set(ex.tokens!.map(t=>t.role));for(const t of ex.translationTokens!)assert.ok(t.implicit||roles.has(t.role),e.id+': '+t.text)}
  for(const ref of e.references!)for(const row of ref.rows){assert.equal(row.length,ref.columns.length);for(const cell of row)assert.ok(!/[一-龯々]/.test(cell.text)||cell.reading,cell.text)}
  assert.deepEqual(skillsFor(e,false),['grammar']);assert.equal(isReadingQuestion(e,'grammar'),false);
  const queue=makePractice(entries,[],{entryId:e.id,mode:'guided'});assert.equal(queue.length,5,e.id);
  assert.deepEqual(queue.map(q=>e.exercises!.find(x=>x.id===q.exerciseId)!.type),['meaning-choice','pattern-choice','gap','tiles','typing']);
  for(const x of e.exercises!){for(const answer of x.answers)assert.ok(grade(e,'grammar',answer,undefined,x.id),e.id+'/'+x.id);if(x.choices)assert.equal(x.choices.filter(c=>grade(e,'grammar',c.text,undefined,x.id)).length,1,e.id+'/'+x.id)}
 }
 const typing=(id:string)=>get(id).exercises!.find(e=>e.id==='typing')!;
 assert.match(typing('large-numbers').feedback.text,/百万/);assert.match(typing('durations').feedback.text,/二か月/);assert.match(typing('months').feedback.text,/七月/);assert.match(typing('weekdays').feedback.text,/土曜日/);
});

test('family honorifics keep whole-word readings in explanation text',()=>{
 const parts=proseReadings('お母さん、お父さん、お兄さん、お姉さん');
 for(const [text,reading] of [['お母さん','おかあさん'],['お父さん','おとうさん'],['お兄さん','おにいさん'],['お姉さん','おねえさん']])assert.ok(parts.some(p=>p.text===text&&p.reading===reading),text);
 assert.ok(!parts.some(p=>p.text==='母'&&p.reading==='はは'));
});
