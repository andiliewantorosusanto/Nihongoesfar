export type TranslationToken={text:string;role:string;implicit?:boolean};
export type ExampleAlignment={readings:string[];english:TranslationToken[]};
const t=(text:string,role:string,implicit=false):TranslationToken=>({text,role,implicit});
const impliedI=t('I ','implicit',true);
export const sentenceAlignments:Record<string,ExampleAlignment>={
 desu:{readings:['わたし','は','がくせいです'],english:[t('I','topic'),t(' am a student.','predicate')]},
 'noun-negative':{readings:['わたし','は','せんせいじゃありません'],english:[t('I','topic'),t(' am not a teacher.','predicate')]},
 'noun-past':{readings:['きのう','は','やすみでした'],english:[t('Yesterday','topic'),t(' was a day off.','predicate')]},
 question:{readings:['これ','は','ほんです','か'],english:[t('Is ','predicate'),t('this','topic'),t(' a book','predicate'),t('?','particle')]},
 no:{readings:['これ','は','わたしの','ほんです'],english:[t('This','topic'),t(' is ','predicate'),t('my','modifier'),t(' book.','predicate')]},
 mo:{readings:['わたし','も','がくせいです'],english:[t('I','topic'),t(' am ','predicate'),t('also','particle'),t(' a student.','predicate')]},
 demonstratives:{readings:['この','ほん','は','おもしろいです'],english:[t('This','modifier'),t(' book','topic'),t(' is interesting.','predicate')]},
 arimasu:{readings:['つくえ','が','あります'],english:[t('There is ','predicate'),t('a desk.','subject')]},
 imasu:{readings:['ねこ','が','います'],english:[t('There is ','predicate'),t('a cat.','subject')]},
 'existence-negative':{readings:['じかん','が','ありません'],english:[impliedI,t('do not have ','predicate'),t('time.','subject')]},
 location:{readings:['へやに','ねこ','が','います'],english:[t('There is ','predicate'),t('a cat','subject'),t(' in the room.','modifier')]},
 object:{readings:['みず','を','のみます'],english:[impliedI,t('drink','predicate'),t(' water.','object')]},
 de:{readings:['としょかんで','べんきょうします'],english:[impliedI,t('study','predicate'),t(' at the library.','modifier')]},
 destination:{readings:['がっこうに','いきます'],english:[impliedI,t('go','predicate'),t(' to school.','modifier')]},
 'time-ni':{readings:['しちじに','おきます'],english:[impliedI,t('get up','predicate'),t(' at seven.','modifier')]},
 masu:{readings:['まいにち','ほん','を','よみます'],english:[impliedI,t('read','predicate'),t(' a book','object'),t(' every day.','modifier')]},
 masen:{readings:['にく','を','たべません'],english:[impliedI,t('do not eat','predicate'),t(' meat.','object')]},
 'verb-past':{readings:['きのう','ほん','を','かいました'],english:[impliedI,t('bought','predicate'),t(' a book','object'),t(' yesterday.','modifier')]},
 'te-request':{readings:['なまえ','を','かいてください'],english:[t('Please write','predicate'),t(' your name.','object')]},
 'te-imasu':{readings:['いま','ほん','を','よんでいます'],english:[impliedI,t('am reading','predicate'),t(' a book','object'),t(' now.','modifier')]},
 hoshii:{readings:['わたし','は','ほん','が','ほしいです'],english:[t('I','topic'),t(' want ','predicate'),t('a book.','subject')]},
 tai:{readings:['にほんに','いきたいです'],english:[impliedI,t('want to go','predicate'),t(' to Japan.','modifier')]},
 suki:{readings:['ねこ','が','すきです'],english:[impliedI,t('like','predicate'),t(' cats.','subject')]},
 'i-adjective':{readings:['この','ほん','は','おもしろいです'],english:[t('This','modifier'),t(' book','topic'),t(' is interesting.','predicate')]},
 'na-adjective':{readings:['ここ','は','しずかです'],english:[t('It ','implicit',true),t('is quiet','predicate'),t(' here.','topic')]}
};
const hira=(s:string)=>s.replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
export type RubyPart={text:string;reading?:string};
export function rubyParts(text:string,reading:string):RubyPart[]{
 if(!/[一-龯々]/.test(text))return [{text}];
 const chunks=text.match(/[一-龯々]+|[^一-龯々]+/gu)||[],kana=hira(reading);let pos=0;const parts:RubyPart[]=[];
 for(let i=0;i<chunks.length;i++){
  const chunk=chunks[i];
  if(!/[一-龯々]/.test(chunk)){if(!kana.startsWith(hira(chunk),pos))return [{text,reading}];pos+=chunk.length;parts.push({text:chunk});continue}
  const next=chunks[i+1],end=next?kana.indexOf(hira(next),pos):kana.length;
  if(end<=pos)return [{text,reading}];parts.push({text:chunk,reading:reading.slice(pos,end)});pos=end;
 }
 return pos===reading.length?parts:[{text,reading}];
}
