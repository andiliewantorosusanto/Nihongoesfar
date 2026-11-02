import { db } from './database.ts';
import { type Entry } from '../app/lib/content.ts';
import { grade, answerFor, makePractice, skillsFor } from '../app/lib/learning.ts';
import strokes from '../app/lib/strokes.json' with {type:'json'};
import { timingSafeEqual } from 'node:crypto';
function isOwner(req:Request){
 const key=process.env.OWNER_KEY;
 const authorization=req.headers.get('authorization')||'';
 if(!authorization.startsWith('Bearer '))return false;
 const supplied=authorization.slice(7);
 return !!key&&Buffer.byteLength(key)===Buffer.byteLength(supplied)&&timingSafeEqual(Buffer.from(key),Buffer.from(supplied));
}
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
async function load(){
 const [c,p]=await Promise.all([
  db.query<{data:Entry}>('SELECT data FROM entries ORDER BY position,id'),
  db.query('SELECT data FROM preferences WHERE user_id=$1',['personal-notebook'])
 ]);
 const entries=c.rows.map(x=>({...x.data,level:/^n5 starter$/i.test(x.data.level)?'N5':x.data.level}));
 return {entries,custom:entries.filter(e=>e.id.startsWith('custom-')),preferences:p.rows[0]?.data||{furigana:true,romaji:false},strokeIds:Object.keys(strokes)};
}
export async function GET(_req:Request,{params}:{params:Promise<{resource:string}>}){
 try{
  const resource=(await params).resource;
  if(!['state','export'].includes(resource))return json({error:'Not found'},404);
  const state=await load();
  if(resource==='state')return json({...state,canEdit:isOwner(_req)});
  return new Response(JSON.stringify({version:3,exportedAt:new Date().toISOString(),content:state.entries,preferences:state.preferences},null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="nihongoesfar-notes.json"','Cache-Control':'no-store'}});
 }catch(e){console.error(e);return json({error:'Your notebook could not be loaded. Please try again.'},500)}
}
const text=(v:unknown,max=10000):v is string=>typeof v==='string'&&v.length<=max;
const kinds=['kana','kanji','grammar','vocabulary','numbers','adjectives'];
function validGuidedContent(e:any){
 const annotations=(x:any,surface:string,kana:string)=>{
  if(x.tokens!==undefined&&(!Array.isArray(x.tokens)||x.tokens.length>100||!x.tokens.every((t:any)=>t&&text(t.text,1000)&&text(t.reading,1000)&&['topic','subject','object','particle','predicate','modifier'].includes(t.role)&&text(t.wordClass,120))||x.tokens.map((t:any)=>t.text).join('')!==surface.replace(/。$/,'')||x.tokens.map((t:any)=>t.reading).join('')!==kana.replace(/。$/,'')))return false;
  if(x.translationTokens!==undefined&&(!Array.isArray(x.translationTokens)||x.translationTokens.length>100||!x.translationTokens.every((t:any)=>t&&text(t.text,1000)&&['topic','subject','object','particle','predicate','modifier','implicit'].includes(t.role)&&(t.implicit===undefined||typeof t.implicit==='boolean'))))return false;
  return true;
 };
 const reading=(x:any)=>x&&text(x.text,10000)&&text(x.reading,10000)&&(!/[一-龯々]/.test(x.text)||!!x.reading.trim())&&annotations(x,x.text,x.reading);
 const example=(x:any)=>x&&text(x.japanese)&&text(x.reading)&&text(x.meaning)&&(!/[一-龯々]/.test(x.japanese)||!!x.reading.trim())&&annotations(x,x.japanese,x.reading);
 if(e.references!==undefined&&(!Array.isArray(e.references)||e.references.length>10||!e.references.every((t:any)=>t&&text(t.heading,200)&&Array.isArray(t.columns)&&t.columns.length>0&&t.columns.length<=8&&t.columns.every((v:any)=>text(v,120))&&Array.isArray(t.rows)&&t.rows.length<=100&&t.rows.every((row:any)=>Array.isArray(row)&&row.length===t.columns.length&&row.every(reading)))))return false;
 if(e.lesson!==undefined){const l=e.lesson;if(!l||!Number.isInteger(l.order)||l.order<1||!['group','goal','recap','comparison'].every(k=>text(l[k]))||!Array.isArray(l.prerequisites)||l.prerequisites.length>30||!l.prerequisites.every((p:any)=>text(p,120))||!Array.isArray(l.examples)||l.examples.length>30||!l.examples.every(example)||!Array.isArray(l.vocabulary)||l.vocabulary.length>100||!l.vocabulary.every((v:any)=>reading(v)&&text(v.meaning)))return false}
 if(e.exercises!==undefined){
  if(!Array.isArray(e.exercises)||e.exercises.length>30||new Set(e.exercises.map((x:any)=>x?.id)).size!==e.exercises.length)return false;
  for(const x of e.exercises){
   if(!x||!text(x.id,120)||!x.id||!['meaning-choice','pattern-choice','gap','tiles','typing'].includes(x.type)||!['prompt','hint','explanation'].every(k=>text(x[k]))||!reading(x.feedback)||!Array.isArray(x.answers)||!x.answers.length||x.answers.length>256||!x.answers.every((a:any)=>text(a,3000)&&a.trim())||(x.alternate!==undefined&&typeof x.alternate!=='boolean'))return false;
   if(x.context!==undefined&&!reading(x.context)||x.choices!==undefined&&(!Array.isArray(x.choices)||x.choices.length>10||!x.choices.every(reading))||x.tiles!==undefined&&(!Array.isArray(x.tiles)||x.tiles.length>50||!x.tiles.every(reading)))return false;
   if(x.type.endsWith('choice')&&(!x.choices||x.choices.length<2)||x.type==='tiles'&&!x.tiles?.length||x.type==='gap'&&!x.context)return false;
  }
 }
 return true;
}
function validEntry(e:any):e is Entry{
 return e&&validGuidedContent(e)&&text(e.id,120)&&/^[\w-]+$/.test(e.id)&&kinds.includes(e.kind)&&['title','japanese','reading','meaning','level','topic','note'].every(k=>text(e[k]))&&e.title.trim()&&e.japanese.trim()&&e.reading.trim()&&Array.isArray(e.tags)&&e.tags.length<=30&&e.tags.every((t:any)=>text(t,80))&&Array.isArray(e.examples)&&e.examples.length<=30&&e.examples.every((x:any)=>x&&['japanese','reading','meaning'].every(k=>text(x[k]))&&(!x.translationTokens||Array.isArray(x.translationTokens)&&x.translationTokens.length<=100&&x.translationTokens.every((t:any)=>t&&text(t.text,1000)&&text(t.role,80)&&(t.implicit===undefined||typeof t.implicit==='boolean')))&&(!x.tokens||Array.isArray(x.tokens)&&x.tokens.every((t:any)=>t&&['text','role','wordClass'].every(k=>text(t[k],500))&&(t.reading===undefined||text(t.reading,1000)))))&&['romaji','on','kun'].every(k=>e[k]===undefined||text(e[k],1000))&&(!e.compounds||Array.isArray(e.compounds)&&e.compounds.length<=50&&e.compounds.every((x:any)=>x&&['japanese','reading','meaning'].every(k=>text(x[k],1000))))&&(!e.exercise||text(e.exercise.prompt)&&Array.isArray(e.exercise.answers)&&e.exercise.answers.length>0&&e.exercise.answers.length<=20&&e.exercise.answers.every((a:any)=>text(a,1000)&&a.trim())&&text(e.exercise.explanation)&&(!e.exercise.tiles||Array.isArray(e.exercise.tiles)&&e.exercise.tiles.length<=50&&e.exercise.tiles.every((t:any)=>text(t,500))));
}
export async function POST(req:Request,{params}:{params:Promise<{resource:string}>}){
 try{
 const resource=(await params).resource;
 if(!['content','preferences','practice','check'].includes(resource))return json({error:'Not found'},404);
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return json({error:'This request must come from your notebook.'},403);
 const raw=await req.text();if(raw.length>150000)return json({error:'This entry is too large.'},413);
 const b=JSON.parse(raw);
 if(!b||typeof b!=='object'||Array.isArray(b))return json({error:'Invalid request.'},400);
 if(['content','preferences'].includes(resource)&&!isOwner(req))return json({error:'Only the owner can change the library.'},403);
 if(resource==='content'){
 if(!validEntry(b.entry))return json({error:'Please check the entry fields, examples, and accepted answers.'},400);
 const e=b.entry;
 // Store only supported fields; user content is rendered as text, never HTML.
 const safe:Entry={references:b.entry.references,lesson:b.entry.lesson,exercises:b.entry.exercises,id:e.id,kind:e.kind,title:e.title,japanese:e.japanese,reading:e.reading,meaning:e.meaning,level:e.level,topic:e.topic,note:e.note,tags:e.tags,romaji:e.romaji,on:e.on,kun:e.kun,compounds:e.compounds,examples:e.examples.map((x:any)=>({japanese:x.japanese,reading:x.reading,meaning:x.meaning,tokens:x.tokens,translationTokens:x.translationTokens})),exercise:e.exercise};
 await db.query("INSERT INTO entries(id,data,position) VALUES($1,$2,(SELECT COALESCE(MAX(position),-1)+1 FROM entries)) ON CONFLICT(id) DO UPDATE SET data=jsonb_strip_nulls(jsonb_build_object('lesson',entries.data->'lesson','exercises',entries.data->'exercises','references',entries.data->'references')) || excluded.data",[e.id,safe]);return json({ok:true});
 }
 if(resource==='preferences'){
 if(typeof b.furigana!=='boolean'||typeof b.romaji!=='boolean')return json({error:'Invalid preferences'},400);
 await db.query('INSERT INTO preferences(user_id,data) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data',['personal-notebook',{furigana:b.furigana,romaji:b.romaji}]);return json({ok:true});
 }

 const state=await load();
 if(resource==='practice'){
  if(b.mode!==undefined&&!['guided','mixed'].includes(b.mode)||b.mode==='guided'&&!b.entryId)return json({error:'Choose a lesson for guided practice.'},400);
  if(b.kind!==undefined&&![...kinds,'notes'].includes(b.kind)||b.entryId!==undefined&&!state.entries.some(e=>e.id===b.entryId)||b.skill!==undefined&&!['recognition','reading','meaning','writing','grammar'].includes(b.skill))return json({error:'Choose a valid book or practice type.'},400);
  if(b.word!==undefined&&(!text(b.word,80)||!state.entries.find(e=>e.id===b.entryId)?.compounds?.some(c=>c.japanese===b.word)))return json({error:'Choose a compound from this entry.'},400);
  return json({queue:makePractice(state.entries,state.strokeIds,{kind:b.kind,entryId:b.entryId,skill:b.skill,word:b.word,mode:b.mode})});
 }
 if(resource==='check'){
  const entry=state.entries.find(e=>e.id===b.entryId);
  if(b.exerciseId!==undefined&&(!text(b.exerciseId,120)||b.skill!=='grammar'||!entry?.exercises?.some(x=>x.id===b.exerciseId)))return json({error:'Choose a valid exercise from this lesson.'},400);
  if(!entry||!skillsFor(entry,state.strokeIds.includes(entry.japanese)).includes(b.skill)||!text(b.answer,3000)||(b.skill==='writing'&&typeof b.writingCorrect!=='boolean'))return json({error:'Invalid practice answer.'},400);
  // Feedback is stateless: no attempts, study selections, or session history are recorded.
  if(b.word!==undefined&&(b.skill!=='reading'||!text(b.word,80)||!entry.compounds?.some(c=>c.japanese===b.word)))return json({error:'Choose a compound from this entry.'},400);
  return json({correct:b.skill==='writing'?b.writingCorrect:grade(entry,b.skill,b.answer,b.word,b.exerciseId),answers:answerFor(entry,b.skill,b.word,b.exerciseId),explanation:b.exerciseId?entry.exercises?.find(x=>x.id===b.exerciseId)?.explanation:entry.exercise?.explanation});
 }
 return json({error:'Not found'},404);
 }catch(e){console.error(e);return json({error:e instanceof SyntaxError?'Invalid request.':'Your changes could not be saved. Please try again.'},e instanceof SyntaxError?400:500)}
}
