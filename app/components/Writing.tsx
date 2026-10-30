import {useRef,useState,useEffect} from 'react';
import {Play,RotateCcw,Undo2,Eye,Check} from 'lucide-react';
import strokes from '../lib/strokes.json';
import {checkStroke,type Point} from '../lib/stroke-check';
type Stroke={paths:string[];source:string};
const allStrokes=strokes as Record<string,Stroke>;
export default function Writing({character,review=false,onDone,onAssist}:{character:string;review?:boolean;onDone?:(correct:boolean)=>void;onAssist?:()=>void}){
 const data=allStrokes[character],svg=useRef<SVGSVGElement>(null),drawing=useRef<Point[]>([]),[ink,setInk]=useState<Point[][]>([]),[live,setLive]=useState<Point[]>([]),[trace,setTrace]=useState(!review),[playing,setPlaying]=useState(-1),[message,setMessage]=useState(''),[mistake,setMistake]=useState(false),[replayKey,setReplayKey]=useState(0);
 useEffect(()=>{if(playing<0||!data)return;const t=setTimeout(()=>setPlaying(p=>p+1<data.paths.length?p+1:-1),950);return()=>clearTimeout(t)},[playing,data,replayKey]);
 useEffect(()=>{setInk([]);setLive([]);setMessage('');setMistake(false);setPlaying(-1);setTrace(!review)},[character,review]);
 if(!data)return <div className="empty-small"><span className="jp big">{character}</span><p>Verified stroke data isn’t available for this character yet. Reading and meaning practice are still available.</p></div>;
 const point=(e:React.PointerEvent<SVGSVGElement>)=>{const r=e.currentTarget.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*109,y:(e.clientY-r.top)/r.height*109}};
 const finish=(e:React.PointerEvent<SVGSVGElement>)=>{
 if(!drawing.current.length)return;const points=[...drawing.current,point(e)];drawing.current=[];setLive([]);
 const ref=svg.current?.querySelectorAll<SVGPathElement>('.reference-path')[ink.length];if(!ref)return;
 const length=ref.getTotalLength();const expected=Array.from({length:32},(_,i)=>{const p=ref.getPointAtLength(length*i/31);return{x:p.x,y:p.y}});
 if(checkStroke(points,expected)){setInk(s=>[...s,points]);setMessage(ink.length+1===data.paths.length?'Character complete. Nicely done.':`Stroke ${ink.length+1} looks good. Continue with stroke ${ink.length+2}.`)}
 else{setMistake(true);setMessage(`Try stroke ${ink.length+1} again. Check its starting point, direction, and position.`)}
 };
 const line=(p:Point[])=>p.map((v,i)=>(i?'L':'M')+v.x.toFixed(1)+','+v.y.toFixed(1)).join(' ');
 return <div className="writing"><div className="writing-meta"><span>{ink.length} / {data.paths.length} strokes</span><span>Guided stroke check</span></div><svg ref={svg} viewBox="0 0 109 109" className="writing-pad" role="img" aria-label={`Drawing pad for ${character}. Draw strokes in order.`} onPointerDown={e=>{if(playing>=0||ink.length===data.paths.length)return;e.currentTarget.setPointerCapture(e.pointerId);drawing.current=[point(e)];setLive(drawing.current)}} onPointerMove={e=>{if(!drawing.current.length)return;drawing.current=[...drawing.current,point(e)];setLive([...drawing.current])}} onPointerUp={finish} onPointerCancel={()=>{drawing.current=[];setLive([])}}>
 <path d="M54.5 0V109M0 54.5H109M0 0L109 109M109 0L0 109" stroke="#e3e3e3" strokeWidth=".4" strokeDasharray="2 2"/>
 {data.paths.map((d,i)=><path className="reference-path" key={i} d={d} fill="none" stroke={trace?'#dddddd':'transparent'} strokeWidth="3" strokeLinecap="round"/>)}
 {playing>=0&&data.paths.slice(0,playing+1).map((d,i)=><path key={`${replayKey}-${i}`} d={d} fill="none" stroke={i===playing?'#555555':'#aaaaaa'} strokeWidth="3" strokeLinecap="round" pathLength="1" className={i===playing?'animated-stroke':''}/>)}
 {ink.map((p,i)=><path key={i} d={line(p)} fill="none" stroke="#333333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>)}
 <path d={line(live)} fill="none" stroke="#333333" strokeWidth="2.5" strokeLinecap="round"/>
 </svg><div className="writing-tools"><button className="soft-button" onClick={()=>{setPlaying(0);setReplayKey(k=>k+1);onAssist?.()}}><Play size={15}/> Replay</button><button className="soft-button" aria-pressed={trace} onClick={()=>{setTrace(!trace);onAssist?.()}}><Eye size={15}/> Guide {trace?'on':'off'}</button><button className="icon-button" aria-label="Undo stroke" disabled={!ink.length} onClick={()=>{setInk(s=>s.slice(0,-1));setMessage('Stroke undone.')}}><Undo2 size={17}/></button><button className="icon-button" aria-label="Clear writing" onClick={()=>{setInk([]);setMessage('Start again from stroke 1.')}}><RotateCcw size={17}/></button></div><p className="writing-feedback" aria-live="polite">{message||'Draw one stroke at a time. Follow the correct direction.'}</p>{onDone&&<button className="primary full" disabled={ink.length!==data.paths.length} onClick={()=>onDone(!mistake)}><Check size={17}/> Finish writing</button>}<small>Checks order, direction, and approximate shape. This is practice feedback, not calligraphy grading. <a href="/credits.html" target="_blank" rel="noreferrer">Stroke data credits ↗</a></small></div>
}
