import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtempSync,rmSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import pg from 'pg';
import {randomBytes} from 'node:crypto';
const databaseName='notebook_test_'+randomBytes(6).toString('hex');
const databaseUrl=new URL(process.env.TEST_DATABASE_URL||'postgresql://notebook:notebook@127.0.0.1:5433/notebook');
const admin=new pg.Pool({connectionString:databaseUrl.toString()});
databaseUrl.pathname='/'+databaseName;
const ownerHeaders={Authorization:'Bearer test-owner-key'};
const dir=mkdtempSync(join(tmpdir(),'nihongo-test-')),port=34927,base=`http://127.0.0.1:${port}`;
async function launch(ownerKey='test-owner-key'){
 const child=spawn(process.execPath,['server/index.ts'],{env:{...process.env,PORT:String(port),DATA_DIR:dir,SQLITE_IMPORT_PATH:join(dir,'notebook.sqlite'),DATABASE_URL:databaseUrl.toString(),OWNER_KEY:ownerKey},stdio:'pipe'});
 let log='';child.stderr.on('data',x=>log+=x);
 for(let i=0;i<100;i++){try{const r=await fetch(base+'/api/state');if(r.ok)return child}catch{}await new Promise(r=>setTimeout(r,100));if(child.exitCode!==null)throw new Error(log)}throw new Error('Server failed to start: '+log);
}
async function stop(c:ReturnType<typeof spawn>){c.kill('SIGTERM');await new Promise(r=>c.on('exit',r))}
test('PostgreSQL library: migrate SQLite once, preserve edits, allow visitor practice, restrict writes to owner',async()=>{
 await admin.query('CREATE DATABASE '+databaseName);
 const sqlite=new DatabaseSync(join(dir,'notebook.sqlite'));
 sqlite.exec('CREATE TABLE content(user_id TEXT,id TEXT,data TEXT); CREATE TABLE preferences(user_id TEXT,data TEXT);');
 const imported={id:'custom-imported',kind:'vocabulary',title:'Imported note',japanese:'猫',reading:'ねこ',meaning:'cat',level:'N5',topic:'Animals',tags:[],note:'Preserved from SQLite',examples:[]};
 sqlite.prepare('INSERT INTO content VALUES(?,?,?)').run('personal-notebook',imported.id,JSON.stringify(imported));
 sqlite.prepare('INSERT INTO preferences VALUES(?,?)').run('personal-notebook',JSON.stringify({furigana:false,romaji:true}));sqlite.close();
 let server:Awaited<ReturnType<typeof launch>>|undefined;
 try{
 // A failed import must leave neither partial starter rows nor an applied marker.
 const broken=new DatabaseSync(join(dir,'notebook.sqlite'));
 broken.prepare('UPDATE content SET data=?').run('{invalid-json');broken.close();
 const failure=spawn(process.execPath,['--input-type=module','-e',"const {db,initializeDatabase}=await import('./server/database.ts');try{await initializeDatabase()}finally{await db.end()}"],{env:{...process.env,DATABASE_URL:databaseUrl.toString(),SQLITE_IMPORT_PATH:join(dir,'notebook.sqlite')},stdio:'pipe'});
 let failureLog='';failure.stderr.on('data',chunk=>failureLog+=chunk);
 const [failureCode]=await once(failure,'exit');assert.notEqual(failureCode,0);assert.match(failureLog,/SyntaxError/);
 const probe=new pg.Pool({connectionString:databaseUrl.toString()});
 try{assert.equal((await probe.query("SELECT to_regclass('public.entries') AS name")).rows[0].name,null)}finally{await probe.end()}
 const repaired=new DatabaseSync(join(dir,'notebook.sqlite'));
 repaired.prepare('UPDATE content SET data=?').run(JSON.stringify(imported));repaired.close();
 server=await launch();
 const post=async(p:string,b:any)=>{const r=await fetch(base+'/api/'+p,{method:'POST',headers:{'Content-Type':'application/json',...(['content','preferences'].includes(p)?ownerHeaders:{})},body:JSON.stringify(b)});const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));return d};
 const response=await fetch(base+'/api/state');assert.equal(response.status,200);assert.equal(response.headers.get('www-authenticate'),null);
 let state=await response.json();assert.equal(state.canEdit,false);
 assert.equal(state.entries.find((e:any)=>e.id==='custom-imported').note,'Preserved from SQLite');
 assert.equal(state.preferences.romaji,true);
 assert.equal((await fetch(base+'/api/state',{headers:ownerHeaders}).then(r=>r.json())).canEdit,true);
 for(const headers of [new Headers(),new Headers({Authorization:'Bearer wrong-key'})]){
  assert.equal((await fetch(base+'/api/content',{method:'POST',headers,body:JSON.stringify({entry:imported})})).status,403);
  assert.equal((await fetch(base+'/api/preferences',{method:'POST',headers,body:JSON.stringify({furigana:true,romaji:false})})).status,403);
 }
 await post('content',{entry:{...imported,note:'Updated after import'}});for(const k of ['studies','reviews','attempts','session'])assert.ok(!(k in state));
 const entry=state.entries.find((e:any)=>e.kind==='grammar');
 const {queue}=await post('practice',{entryId:entry.id,mode:'guided'});assert.equal(queue.length,5);assert.equal(queue[0].entryId,entry.id);
 assert.deepEqual(queue.map((q:any)=>q.exerciseId),['meaning','pattern','gap','tiles','typing']);
 for(const exercise of entry.exercises){const checked=await post('check',{entryId:entry.id,skill:'grammar',exerciseId:exercise.id,answer:exercise.answers[0]});assert.equal(checked.correct,true)}
 for(const exerciseId of ['missing','',123])assert.equal((await fetch(base+'/api/check',{method:'POST',body:JSON.stringify({entryId:entry.id,skill:'grammar',exerciseId,answer:'anything'})})).status,400);
 const malformed={...entry,exercises:[{...entry.exercises[0],type:'untrusted-type'}]};
 assert.equal((await fetch(base+'/api/content',{method:'POST',headers:ownerHeaders,body:JSON.stringify({entry:malformed})})).status,400);
 const noReadings={...entry,exercises:[{...entry.exercises[0],feedback:{text:'本',reading:''}}]};
 assert.equal((await fetch(base+'/api/content',{method:'POST',headers:ownerHeaders,body:JSON.stringify({entry:noReadings})})).status,400);
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
 await post('content',{entry:{...entry,note:'Edited grammar note',lesson:undefined,exercises:undefined}});
 const preserved=await fetch(base+'/api/state').then(r=>r.json());
 assert.deepEqual(preserved.entries.find((e:any)=>e.id===entry.id).exercises,entry.exercises);
 const custom={...entry,id:'custom-grammar-note',title:'My class note',exercise:undefined,exercises:undefined,lesson:undefined,tags:['My class']};await post('content',{entry:custom});assert.equal((await post('practice',{entryId:custom.id})).queue.length,0);
 const familyGuide=state.entries.find((e:any)=>e.id==='study-family');
 await post('content',{entry:{...familyGuide,note:'Owner family notes',references:undefined,exercises:undefined}});
 const afterLegacySave=await fetch(base+'/api/state').then(r=>r.json());
 assert.deepEqual(afterLegacySave.entries.find((e:any)=>e.id===familyGuide.id).references,familyGuide.references);
 for(const references of [[{heading:'Invalid',columns:[],rows:[]}],[{heading:'Missing reading',columns:['Japanese'],rows:[[{text:'本',reading:''}]]}]])assert.equal((await fetch(base+'/api/content',{method:'POST',headers:ownerHeaders,body:JSON.stringify({entry:{...familyGuide,references}})})).status,400);
 await post('preferences',{furigana:false,romaji:true});
 await stop(server);server=undefined;
 // Simulate an existing, owner-edited library from before curriculum migration.
 const older=new pg.Pool({connectionString:databaseUrl.toString()});
 try{
  await older.query("UPDATE entries SET data=data-'lesson'-'exercises' WHERE id=$1",[entry.id]);
  await older.query("DELETE FROM schema_migrations WHERE name='003-guided-grammar'");
  await older.query("DELETE FROM entries WHERE data->'tags' ? 'Class topics' AND id<>$1",[familyGuide.id]);
  await older.query("DELETE FROM schema_migrations WHERE name='005-class-topics'");
 }finally{await older.end()}
 server=await launch();state=await(await fetch(base+'/api/state')).json();assert.equal(state.custom.length,2);assert.equal(state.preferences.romaji,true);assert.equal(state.preferences.furigana,false);
 assert.equal(state.entries.find((e:any)=>e.id===familyGuide.id).note,'Owner family notes');assert.deepEqual(state.entries.find((e:any)=>e.id===familyGuide.id).references,familyGuide.references);assert.equal(state.entries.find((e:any)=>e.id==='study-months').references[0].rows.length,12);
 assert.equal(state.entries.find((e:any)=>e.id===entry.id).note,'Edited grammar note');assert.deepEqual(state.entries.find((e:any)=>e.id===entry.id).lesson,entry.lesson);assert.deepEqual(state.entries.find((e:any)=>e.id===entry.id).exercises,entry.exercises);
 const saved=state.entries.find((e:any)=>e.id===kanji.id);assert.equal(saved.note,'Edited reference note.');assert.equal(saved.on,kanji.on);assert.deepEqual(saved.compounds,kanji.compounds);
 assert.deepEqual(state.entries.find((e:any)=>e.id===entry.id).examples,entry.examples);
 const backup=await(await fetch(base+'/api/export')).json();assert.equal(backup.version,3);assert.deepEqual(backup.content.find((e:any)=>e.id===entry.id).exercises,entry.exercises);assert.equal(backup.content.length,state.entries.length);for(const k of ['studies','reviews','attempts','session'])assert.ok(!(k in backup));
 const bad=await fetch(base+'/api/preferences',{method:'POST',headers:{Origin:'https://foreign.example','Content-Type':'application/json'},body:JSON.stringify({furigana:true,romaji:false})});assert.equal(bad.status,403);
 const invalid=await fetch(base+'/api/content',{method:'POST',headers:ownerHeaders,body:JSON.stringify({entry:{title:'broken'}})});assert.equal(invalid.status,400);
 assert.equal(state.entries.find((e:any)=>e.id==='custom-imported').note,'Updated after import');
 const check=new pg.Pool({connectionString:databaseUrl.toString()});
 try{
  const tables=(await check.query("SELECT tablename FROM pg_tables WHERE schemaname='public'")).rows.map(x=>x.tablename).sort();
  assert.deepEqual(tables,['entries','preferences','schema_migrations']);
  assert.equal(Number((await check.query('SELECT count(*) FROM entries')).rows[0].count),state.entries.length);
 }finally{await check.end()}
 await stop(server);server=await launch('');
 assert.equal((await fetch(base+'/api/state',{headers:ownerHeaders}).then(r=>r.json())).canEdit,false);
 assert.equal((await fetch(base+'/api/content',{method:'POST',headers:ownerHeaders,body:JSON.stringify({entry:imported})})).status,403);
 const original=new DatabaseSync(join(dir,'notebook.sqlite'),{readOnly:true});
 assert.equal(JSON.parse(String(original.prepare('SELECT data FROM content').get()!.data)).note,'Preserved from SQLite');original.close();
 }finally{if(server)await stop(server);await admin.query('DROP DATABASE '+databaseName+' WITH (FORCE)');await admin.end();rmSync(dir,{recursive:true,force:true})}
});
