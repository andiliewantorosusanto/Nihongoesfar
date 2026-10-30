import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const dir=mkdtempSync(join(tmpdir(),'nihongo-test-')),port=34927,base=`http://127.0.0.1:${port}`;
async function launch(){
 const child=spawn(process.execPath,['server/index.ts'],{env:{...process.env,PORT:String(port),DATA_DIR:dir,APP_PASSWORD:'obsolete-password-is-not-used'},stdio:'pipe'});
 let log='';child.stderr.on('data',x=>log+=x);
 for(let i=0;i<100;i++){try{await fetch(base+'/api/state');return child}catch{}await new Promise(r=>setTimeout(r,100));if(child.exitCode!==null)throw new Error(log)}throw new Error('Server failed to start: '+log);
}
async function stop(c:ReturnType<typeof spawn>){c.kill('SIGTERM');await new Promise(r=>c.on('exit',r))}
test('no login or tracking: practice immediately, give stateless feedback, preserve notes, export only content',async()=>{
 let server=await launch();try{
 const post=async(p:string,b:any)=>{const r=await fetch(base+'/api/'+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));return d};
 const response=await fetch(base+'/api/state');assert.equal(response.status,200);assert.equal(response.headers.get('www-authenticate'),null);
 let state=await response.json();for(const k of ['studies','reviews','attempts','session'])assert.ok(!(k in state));
 const entry=state.entries.find((e:any)=>e.kind==='grammar');
 const {queue}=await post('practice',{entryId:entry.id});assert.equal(queue.length,1);assert.equal(queue[0].entryId,entry.id);
 const first=await post('check',{entryId:entry.id,skill:'grammar',answer:entry.exercise.answers[0]});assert.equal(first.correct,true);
 const wrong=await post('check',{entryId:entry.id,skill:'grammar',answer:'wrong'});assert.equal(wrong.correct,false);assert.ok(wrong.answers.length);
 for(const old of ['study','attempt','session'])assert.equal((await fetch(base+'/api/'+old,{method:'POST',body:'{}'})).status,404);
 assert.equal((await fetch(base+'/api/reviews')).status,404);
 const fire=state.entries.find((e:any)=>e.kind==='kanji'&&e.japanese==='火');
 const compoundPractice=await post('practice',{entryId:fire.id,word:'火山',skill:'reading'});assert.equal(compoundPractice.queue.length,1);assert.equal(compoundPractice.queue[0].word,'火山');
 const compoundAnswer=await post('check',{entryId:fire.id,skill:'reading',word:'火山',answer:'かざん'});assert.equal(compoundAnswer.correct,true);
 const otherReading=await post('check',{entryId:fire.id,skill:'reading',word:'火山',answer:'かようび'});assert.equal(otherReading.correct,false);
 const badWord=await fetch(base+'/api/check',{method:'POST',body:JSON.stringify({entryId:fire.id,skill:'reading',word:'偽物',answer:'にせもの'})});assert.equal(badWord.status,400);
 const kanji=state.entries.find((e:any)=>e.kind==='kanji');await post('content',{entry:{...kanji,note:'Edited reference note.'}});
 const custom={...entry,id:'custom-grammar-note',title:'My class note',exercise:undefined,tags:['My class']};await post('content',{entry:custom});assert.equal((await post('practice',{entryId:custom.id})).queue.length,0);
 await post('preferences',{furigana:false,romaji:true});
 await stop(server);server=await launch();state=await(await fetch(base+'/api/state')).json();assert.equal(state.custom.length,2);assert.equal(state.preferences.romaji,true);assert.equal(state.preferences.furigana,false);
 const saved=state.entries.find((e:any)=>e.id===kanji.id);assert.equal(saved.note,'Edited reference note.');assert.equal(saved.on,kanji.on);assert.deepEqual(saved.compounds,kanji.compounds);
 const backup=await(await fetch(base+'/api/export')).json();assert.equal(backup.version,2);assert.equal(backup.content.length,2);for(const k of ['studies','reviews','attempts','session'])assert.ok(!(k in backup));
 const bad=await fetch(base+'/api/preferences',{method:'POST',headers:{Origin:'https://foreign.example','Content-Type':'application/json'},body:JSON.stringify({furigana:true,romaji:false})});assert.equal(bad.status,403);
 const invalid=await fetch(base+'/api/content',{method:'POST',body:JSON.stringify({entry:{title:'broken'}})});assert.equal(invalid.status,400);
 const db=new DatabaseSync(join(dir,'notebook.sqlite'));const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(x=>x.name);assert.deepEqual(tables.sort(),['content','preferences']);db.close();
 }finally{await stop(server);rmSync(dir,{recursive:true,force:true})}
});
