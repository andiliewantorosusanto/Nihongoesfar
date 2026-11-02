import type {Entry} from '../lib/content';
import {Sentence,Furigana,JapaneseProse} from './Reading';
export function GrammarLessons({entries,onOpen}:{entries:Entry[];onOpen:(e:Entry)=>void}){
 const ordered=[...entries].sort((a,b)=>(a.lesson?.order??Number.MAX_SAFE_INTEGER)-(b.lesson?.order??Number.MAX_SAFE_INTEGER));
 const levels=[...new Set(['N5','N4','N3',...ordered.map(e=>e.level)])];
 return <section className="grammar-course" aria-label="Grammar by level">
 {levels.map(level=>{const lessons=ordered.filter(e=>e.level===level);return <section className="lesson-group" key={level}><div className="section-heading"><h2>{level}</h2><span>{lessons.length} {lessons.length===1?'entry':'entries'}</span></div>{lessons.length?<div className="lesson-list">{lessons.map(e=><button className="lesson-card" key={e.id} onClick={()=>onOpen(e)}><span><strong>{e.title}</strong>{(!e.references?.length||e.lesson)&&<span className="lesson-goal">{e.lesson?.goal||e.meaning}</span>}</span><span aria-hidden="true">→</span></button>)}</div>:<p className="book-note">No grammar entries at this level yet.</p>}</section>})}
 </section>;
}

export function LessonIntro({entry,entries,furigana,onOpen}:{entry:Entry;entries:Entry[];furigana:boolean;onOpen?:(e:Entry)=>void}){
 const l=entry.lesson;if(!l)return null;
 return <section className="lesson-intro"><p className="eyebrow">LESSON {l.order} / {l.group}</p><h3>Your goal</h3><p>{l.goal}</p>
 <div className="lesson-prerequisites"><small>Useful first: </small>{l.prerequisites.length?l.prerequisites.map(id=>{const e=entries.find(x=>x.id===id);return e?<button className="text-button" key={id} disabled={!onOpen} onClick={()=>onOpen?.(e)}>{e.title}</button>:null}):<span>No earlier grammar lesson needed.</span>}</div>
 <h3>Quick recap</h3><p><JapaneseProse text={entry.note} show={furigana}/></p><div className="lesson-comparison"><h3>A common mix-up</h3><p><JapaneseProse text={l.comparison} show={furigana}/></p></div>
 <h3>See the pattern in three examples</h3>{l.examples.map((example,i)=><Sentence key={i} example={example} furigana={furigana}/>)}
 <details className="lesson-vocabulary"><summary>Words used in this lesson</summary><dl>{l.vocabulary.map(v=><div key={v.text}><dt lang="ja"><Furigana text={v.text} reading={v.reading} show={furigana}/></dt><dd>{v.meaning}</dd></div>)}</dl></details>
 <p className="lesson-practice-guide">Practice goes from choosing a meaning to building a sentence and writing one yourself. Hints, retries, and explanations are always available.</p>
 </section>;
}
