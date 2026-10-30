import { db } from './database.ts';
import { entries as seed, mergeEntry, type Entry } from '../app/lib/content.ts';
import { grade, answerFor, makePractice, skillsFor } from '../app/lib/learning.ts';
import strokes from '../app/lib/strokes.json' with {type:'json'};
const ownerId='personal-notebook';
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
async function load(){
 const [c,p]=await Promise.all([
  db.prepare('SELECT data FROM content WHERE user_id=?').bind(ownerId).all<{data:string}>(),
  db.prepare('SELECT data FROM preferences WHERE user_id=?').bind(ownerId).first<{data:string}>()
 ]);
 const custom=c.results.map(x=>JSON.parse(x.data) as Entry).map(e=>({...e,level:/^n5 starter$/i.test(e.level)?'N5':e.level})), overrides=new Map(custom.map(e=>[e.id,e]));
 return {entries:[...seed.map(e=>mergeEntry(e,overrides.get(e.id))),...custom.filter(e=>!seed.some(s=>s.id===e.id))],custom,preferences:p?JSON.parse(p.data):{furigana:true,romaji:false},strokeIds:Object.keys(strokes)};
}
export async function GET(_req:Request,{params}:{params:Promise<{resource:string}>}){
 try{
  const resource=(await params).resource;
  if(!['state','export'].includes(resource))return json({error:'Not found'},404);
  const state=await load();
  if(resource==='state')return json(state);
  return new Response(JSON.stringify({version:2,exportedAt:new Date().toISOString(),content:state.custom,preferences:state.preferences},null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="nihongoesfar-notes.json"','Cache-Control':'no-store'}});
 }catch(e){console.error(e);return json({error:'Your notebook could not be loaded. Please try again.'},500)}
}
const text=(v:unknown,max=10000):v is string=>typeof v==='string'&&v.length<=max;
const kinds=['kana','kanji','grammar','vocabulary','numbers','adjectives'];
function validEntry(e:any):e is Entry{
 return e&&text(e.id,120)&&/^[\w-]+$/.test(e.id)&&kinds.includes(e.kind)&&['title','japanese','reading','meaning','level','topic','note'].every(k=>text(e[k]))&&e.title.trim()&&e.japanese.trim()&&e.reading.trim()&&Array.isArray(e.tags)&&e.tags.length<=30&&e.tags.every((t:any)=>text(t,80))&&Array.isArray(e.examples)&&e.examples.length<=30&&e.examples.every((x:any)=>x&&['japanese','reading','meaning'].every(k=>text(x[k]))&&(!x.tokens||Array.isArray(x.tokens)&&x.tokens.every((t:any)=>t&&['text','role','wordClass'].every(k=>text(t[k],500))&&(t.reading===undefined||text(t.reading,1000)))))&&['romaji','on','kun'].every(k=>e[k]===undefined||text(e[k],1000))&&(!e.compounds||Array.isArray(e.compounds)&&e.compounds.length<=50&&e.compounds.every((x:any)=>x&&['japanese','reading','meaning'].every(k=>text(x[k],1000))))&&(!e.exercise||text(e.exercise.prompt)&&Array.isArray(e.exercise.answers)&&e.exercise.answers.length>0&&e.exercise.answers.length<=20&&e.exercise.answers.every((a:any)=>text(a,1000)&&a.trim())&&text(e.exercise.explanation)&&(!e.exercise.tiles||Array.isArray(e.exercise.tiles)&&e.exercise.tiles.length<=50&&e.exercise.tiles.every((t:any)=>text(t,500))));
}
export async function POST(req:Request,{params}:{params:Promise<{resource:string}>}){
 try{
 const resource=(await params).resource;
 if(!['content','preferences','practice','check'].includes(resource))return json({error:'Not found'},404);
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return json({error:'This request must come from your notebook.'},403);
 const raw=await req.text();if(raw.length>150000)return json({error:'This entry is too large.'},413);
 const b=JSON.parse(raw),uid=ownerId;
 if(!b||typeof b!=='object'||Array.isArray(b))return json({error:'Invalid request.'},400);
 if(resource==='content'){
 if(!validEntry(b.entry))return json({error:'Please check the entry fields, examples, and accepted answers.'},400);
 const e=b.entry;
 // Store only supported fields; user content is rendered as text, never HTML.
 const safe:Entry={id:e.id,kind:e.kind,title:e.title,japanese:e.japanese,reading:e.reading,meaning:e.meaning,level:e.level,topic:e.topic,note:e.note,tags:e.tags,romaji:e.romaji,on:e.on,kun:e.kun,compounds:e.compounds,examples:e.examples.map((x:any)=>({japanese:x.japanese,reading:x.reading,meaning:x.meaning,tokens:x.tokens})),exercise:e.exercise};
 await db.prepare('INSERT INTO content(user_id,id,data) VALUES(?,?,?) ON CONFLICT(user_id,id) DO UPDATE SET data=excluded.data').bind(uid,e.id,JSON.stringify(safe)).run();return json({ok:true});
 }
 if(resource==='preferences'){
 if(typeof b.furigana!=='boolean'||typeof b.romaji!=='boolean')return json({error:'Invalid preferences'},400);
 await db.prepare('INSERT INTO preferences(user_id,data) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data').bind(uid,JSON.stringify({furigana:b.furigana,romaji:b.romaji})).run();return json({ok:true});
 }

 const state=await load();
 if(resource==='practice'){
  if(b.kind!==undefined&&![...kinds,'notes'].includes(b.kind)||b.entryId!==undefined&&!state.entries.some(e=>e.id===b.entryId)||b.skill!==undefined&&!['recognition','reading','meaning','writing','grammar'].includes(b.skill))return json({error:'Choose a valid book or practice type.'},400);
  if(b.word!==undefined&&(!text(b.word,80)||!state.entries.find(e=>e.id===b.entryId)?.compounds?.some(c=>c.japanese===b.word)))return json({error:'Choose a compound from this entry.'},400);
  return json({queue:makePractice(state.entries,state.strokeIds,{kind:b.kind,entryId:b.entryId,skill:b.skill,word:b.word})});
 }
 if(resource==='check'){
  const entry=state.entries.find(e=>e.id===b.entryId);
  if(!entry||!skillsFor(entry,state.strokeIds.includes(entry.japanese)).includes(b.skill)||!text(b.answer,3000)||(b.skill==='writing'&&typeof b.writingCorrect!=='boolean'))return json({error:'Invalid practice answer.'},400);
  // Feedback is stateless: no attempts, study selections, or session history are recorded.
  if(b.word!==undefined&&(b.skill!=='reading'||!text(b.word,80)||!entry.compounds?.some(c=>c.japanese===b.word)))return json({error:'Choose a compound from this entry.'},400);
  return json({correct:b.skill==='writing'?b.writingCorrect:grade(entry,b.skill,b.answer,b.word),answers:answerFor(entry,b.skill,b.word)});
 }
 return json({error:'Not found'},404);
 }catch(e){console.error(e);return json({error:e instanceof SyntaxError?'Invalid request.':'Your changes could not be saved. Please try again.'},e instanceof SyntaxError?400:500)}
}
