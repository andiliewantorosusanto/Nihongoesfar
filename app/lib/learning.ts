import type { Entry } from './content.ts';
export type Skill='recognition'|'reading'|'meaning'|'writing'|'grammar';
export type Question={id:string;entryId:string;skill:Skill;word?:string;exerciseId?:string};
export function normalize(s:string){return s.normalize('NFKC').toLowerCase().replace(/[\s。、！？!?.,・]/g,'').replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));}
export function skillsFor(e:Entry,hasStrokes:boolean):Skill[]{
 if(e.exercises?.length)return ['grammar'];
 if(e.kind==='grammar') return e.exercises?.length||e.exercise?['grammar']:[];
 if(e.kind==='kana')return ['recognition','reading',...(hasStrokes?['writing' as Skill]:[])];
 if(e.kind==='kanji')return ['reading','meaning',...(hasStrokes?['writing' as Skill]:[])];
 if(e.kind==='adjectives' || e.kind==='numbers')return e.exercise?['reading','meaning','grammar']:['reading','meaning'];
 return ['reading','meaning'];
}
export function entryInBook(e:Entry,book:string){
 if(book==='time')return e.kind==='numbers'&&['Clock time','Minutes'].includes(e.topic);
 if(book==='numbers')return e.kind==='numbers'&&!['Clock time','Minutes','Dates','Months','Weekdays','Durations'].includes(e.topic)&&!['study-weekdays','study-months','study-dates','study-relative-time','study-durations','study-every','study-ages'].includes(e.id)&&!e.id.startsWith('study-age-');
 return book==='notes'?e.id.startsWith('custom-'):e.kind===book;
}
export function makePractice(entries:Entry[],strokeIds:string[],options:{kind?:string;entryId?:string;skill?:Skill;word?:string;mode?:'guided'|'mixed'}={},random=Math.random):Question[]{
 if(options.mode==='guided'&&options.entryId){
  const e=entries.find(e=>e.id===options.entryId);
  if(e?.exercises?.length)return e.exercises.filter(x=>!x.alternate).map(x=>({id:e.id+':'+x.id,entryId:e.id,skill:'grammar',exerciseId:x.id}));
 }
 const questions:Question[]=[];
 for(const e of entries.filter(e=>(!options.kind||entryInBook(e,options.kind))&&(!options.entryId||e.id===options.entryId))){
  for(const skill of skillsFor(e,strokeIds.includes(e.japanese)).filter(s=>!options.skill||s===options.skill)){
   if(skill==='grammar'&&e.exercises?.length){
    for(const exercise of e.exercises.filter(x=>!x.alternate))questions.push({id:e.id+':'+exercise.id,entryId:e.id,skill,exerciseId:exercise.id});
   }else if(skill==='reading'&&e.kind==='kanji'&&e.compounds?.length){
    for(const word of new Set(e.compounds.map(c=>c.japanese).filter(w=>!options.word||w===options.word)))questions.push({id:e.id+':reading:'+word,entryId:e.id,skill,word});
   }else if(!options.word)questions.push({id:e.id+':'+skill,entryId:e.id,skill});
  }
 }
 for(let i=questions.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[questions[i],questions[j]]=[questions[j],questions[i]];}
 // Balance skills so a larger compound library does not crowd writing out of mixed practice.
 const groups=new Map<Skill,Question[]>();for(const q of questions){const group=groups.get(q.skill)||[];group.push(q);groups.set(q.skill,group)}
 const result:Question[]=[];while(result.length<12&&[...groups.values()].some(g=>g.length)){for(const g of groups.values()){const q=g.shift();if(q&&result.length<12)result.push(q)}}
 return result;
}
export function answerFor(e:Entry,skill:Skill,word?:string,exerciseId?:string):string[]{
 if(exerciseId)return skill==='grammar'?e.exercises?.find(x=>x.id===exerciseId)?.answers||[]:[];
 if(word&&skill==='reading')return e.compounds?.filter(c=>c.japanese===word).map(c=>c.reading)||[];
 if(skill==='grammar')return e.exercise?.answers??[];
 if(skill==='reading')return [e.reading,...(e.kind==='kana'&&e.romaji?[e.romaji]:[])];
 if(skill==='recognition')return [e.japanese];
 if(skill==='meaning')return [e.meaning,...e.meaning.split(/[;,/]/).map(s=>s.trim()).filter(Boolean)];
 return [];
}
export function grade(e:Entry,skill:Skill,answer:string,word?:string,exerciseId?:string){return answerFor(e,skill,word,exerciseId).some(a=>normalize(a)===normalize(answer));}
export function promptFor(e:Entry,skill:Skill,word?:string){
 if(skill==='grammar')return e.exercise?.prompt??'';
 if(skill==='recognition')return `Choose the kana for “${e.romaji||e.reading}”.`;
 if(skill==='reading')return `How do you read ${word||(e.kind==='kanji'?e.examples[0]?.japanese||e.japanese:e.japanese)}?`;
 if(skill==='meaning')return `What does ${e.japanese} mean?`;
 return `Write ${e.japanese} in stroke order.`;
}

// A retry appends at most one alternate per lesson, even after repeated mistakes.
export function withAlternate(queue:Question[],entry:Entry):Question[]{
 const exercise=entry.exercises?.find(x=>x.alternate);
 if(!exercise||queue.some(q=>q.entryId===entry.id&&q.exerciseId===exercise.id))return queue;
 return [...queue,{id:entry.id+':'+exercise.id,entryId:entry.id,skill:'grammar',exerciseId:exercise.id}];
}

// Legacy number exercises use the grammar slot but still test pronunciation.
export function isReadingQuestion(entry:Entry,skill:Skill){return skill==='reading'||skill==='grammar'&&entry.kind==='numbers'&&!entry.exercises?.length}
