import type {ReadingText} from '../lib/grammar-course';
import type {Entry} from '../lib/content';
import {rubyParts,proseReadings} from '../lib/sentence-support';
export function Furigana({text,reading,show}:{text:string;reading:string;show:boolean}){
 return <>{(show?rubyParts(text,reading):[{text}]).map((p,i)=>p.reading?<ruby key={i}>{p.text}<rt>{p.reading}</rt></ruby>:<span key={i}>{p.text}</span>)}</>;
}
export function Sentence({example,furigana}:{example:Entry['examples'][number];furigana:boolean}){
 const tokens=example.tokens,aligned=!!tokens?.length&&tokens.every(t=>t.reading);
 return <div className="sentence">{tokens?.length?<div className="sentence-tokens" lang="ja">{tokens.map((t,i)=><span className={'sentence-token role-'+t.role} key={i}><small>{t.role}</small><b title={t.wordClass}><Furigana text={t.text} reading={t.reading||''} show={furigana&&!!t.reading}/></b><em>{t.wordClass}</em></span>)}</div>:<p className="jp example-jp" lang="ja"><Furigana text={example.japanese} reading={example.reading} show={furigana}/></p>}
 {furigana&&<p className="reading aligned-reading" lang="ja">{aligned?<>{tokens!.map((t,i)=><span key={i} className={'aligned-word role-'+t.role} title={t.role}>{t.reading}</span>)}<span>。</span></>:example.reading}</p>}
 <p className="aligned-english" lang="en">{example.translationTokens?.length?example.translationTokens.map((t,i)=><span key={i} className={t.implicit?'implicit-word':'aligned-word role-'+t.role} title={t.implicit?'Understood from context; not written in the Japanese sentence':t.role}>{t.text}</span>):example.meaning}</p>
 {example.translationTokens?.length&&<small className="alignment-note">Colors match the Japanese sentence roles, which may differ from English grammar. Particles may have no separate English word.{example.translationTokens.some(t=>t.implicit)&&' Gray words are understood from context in Japanese.'}</small>}
 </div>;
}

export function JapaneseProse({text,show}:{text:string;show:boolean}){
 return <>{proseReadings(text).map((p,i)=><Furigana key={i} text={p.text} reading={p.reading} show={show}/>)}</>;
}

export function RoleText({value,show}:{value:ReadingText;show:boolean}){
 if(!value.tokens?.length)return <span className={value.role?'aligned-word role-'+value.role:undefined} title={value.role}><Furigana text={value.text} reading={value.reading} show={show}/></span>;
 const covered=value.tokens.map(t=>t.text).join('');
 return <span className="sentence-inline">{value.tokens.map((t,i)=><span key={i} className={'aligned-word role-'+t.role} title={t.role}><Furigana text={t.text} reading={t.reading||''} show={show}/></span>)}{value.text.slice(covered.length)}</span>;
}
export function AlignedTranslation({tokens,meaning}:{tokens?:Entry['examples'][number]['translationTokens'];meaning:string}){
 return <>{tokens?.length?tokens.map((t,i)=><span key={i} className={t.implicit?'implicit-word':'aligned-word role-'+t.role} title={t.implicit?'Understood from context; not written in Japanese':t.role}>{t.text}</span>):meaning}</>;
}

export function RoleReading({value}:{value:ReadingText}){
 return <>{value.tokens?.length?<>{value.tokens.map((t,i)=><span className={'aligned-word role-'+t.role} key={i} title={t.role}>{t.reading}</span>)}{value.reading.slice(value.tokens.reduce((n,t)=>n+(t.reading?.length||0),0))}</>:value.reading}</>;
}

export function ReferenceTables({tables,furigana}:{tables:NonNullable<Entry['references']>;furigana:boolean}){
 return <>{tables.map((table,i)=><section className="study-reference" key={i}><h3>{table.heading}</h3><div className="reference-scroll" tabIndex={0} role="region" aria-label={table.heading}><table className="quick-table"><thead><tr>{table.columns.map((heading,i)=><th scope="col" key={i}>{heading}</th>)}</tr></thead><tbody>{table.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}><RoleText value={cell} show={furigana}/>{cell.reading&&<small className="reading reference-kana" lang="ja">{cell.reading}</small>}</td>)}</tr>)}</tbody></table></div></section>)}</>;
}
