import type { Entry } from './content.ts';
export type Skill='recognition'|'reading'|'meaning'|'writing'|'grammar';
export type Question={id:string;entryId:string;skill:Skill;word?:string};
export function normalize(s:string){return s.normalize('NFKC').toLowerCase().replace(/[\s。、！？!?.,・]/g,'').replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));}
export function skillsFor(e:Entry,hasStrokes:boolean):Skill[]{
 if(e.kind==='grammar') return e.exercise?['grammar']:[];
 if(e.kind==='kana')return ['recognition','reading',...(hasStrokes?['writing' as Skill]:[])];
 if(e.kind==='kanji')return ['reading','meaning',...(hasStrokes?['writing' as Skill]:[])];
 if(e.kind==='adjectives' || e.kind==='numbers')return e.exercise?['reading','meaning','grammar']:['reading','meaning'];
 return ['reading','meaning'];
}
export function makePractice(entries:Entry[],strokeIds:string[],options:{kind?:string;entryId?:string;skill?:Skill;word?:string}={},random=Math.random):Question[]{
 const questions:Question[]=[];
 for(const e of entries.filter(e=>(!options.kind||(options.kind==='notes'?e.id.startsWith('custom-'):e.kind===options.kind))&&(!options.entryId||e.id===options.entryId))){
  for(const skill of skillsFor(e,strokeIds.includes(e.japanese)).filter(s=>!options.skill||s===options.skill)){
   if(skill==='reading'&&e.kind==='kanji'&&e.compounds?.length){
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
export function answerFor(e:Entry,skill:Skill,word?:string):string[]{
 if(word&&skill==='reading')return e.compounds?.filter(c=>c.japanese===word).map(c=>c.reading)||[];
 if(skill==='grammar')return e.exercise?.answers??[];
 if(skill==='reading')return [e.reading,...(e.kind==='kana'&&e.romaji?[e.romaji]:[])];
 if(skill==='recognition')return [e.japanese];
 if(skill==='meaning')return [e.meaning,...e.meaning.split(/[;,/]/).map(s=>s.trim()).filter(Boolean)];
 return [];
}
export function grade(e:Entry,skill:Skill,answer:string,word?:string){return answerFor(e,skill,word).some(a=>normalize(a)===normalize(answer));}
export function promptFor(e:Entry,skill:Skill,word?:string){
 if(skill==='grammar')return e.exercise?.prompt??'';
 if(skill==='recognition')return `Choose the kana for “${e.romaji||e.reading}”.`;
 if(skill==='reading')return `How do you read ${word||(e.kind==='kanji'?e.examples[0]?.japanese||e.japanese:e.japanese)}?`;
 if(skill==='meaning')return `What does ${e.japanese} mean?`;
 return `Write ${e.japanese} in stroke order.`;
}
