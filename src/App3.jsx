import { useMemo, useState } from "react";
import "./App.css";

const RESULTS={F:["Friends","🤝","A friendly connection."],L:["Lovers","❤️","A romantic spark, according to the classic game."],A:["Affection","💫","A warm and caring connection."],M:["Marriage","💍","The classic game has taken it all the way to marriage."],E:["Enemies","⚡","Apparently, these names bring a little rivalry."],S:["Siblings","🫶","A familiar, sibling-like connection."]};
const LETTERS=["F","L","A","M","E","S"];

function flames(a,b){
  let x=a.toLowerCase().replace(/[^a-z]/g,"").split("");
  let y=b.toLowerCase().replace(/[^a-z]/g,"").split("");
  if(!x.length||!y.length)return null;
  for(let i=0;i<x.length;i++){const j=y.indexOf(x[i]);if(j>-1){x[i]="";y[j]="";}}
  const n=x.filter(Boolean).length+y.filter(Boolean).length;
  if(!n)return "F";
  let pool=[...LETTERS],i=0;
  while(pool.length>1){i=(i+n-1)%pool.length;pool.splice(i,1);}
  return pool[0];
}
function score(a,b){
  const s=(a.trim().toLowerCase()+":"+b.trim().toLowerCase());let h=0;
  for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;
  return 58+h%40;
}
function Flame(){return <svg className="flame" viewBox="0 0 48 56" aria-hidden="true"><path d="M25.8 2.5c2.5 10.7-5.8 14.4-3.5 22.1 1.1 3.8 4.2 5.2 6.7 2.4 3.1-3.5 1.7-9.6 1.7-9.6 7.9 6.1 12.1 13.1 11.4 21.3C41.2 48.9 33.8 54 24.1 54 13.4 54 5.8 47.5 5.8 38.5c0-7.8 4.4-14.7 11.5-19.6-.7 6.2 1.5 9.6 4.2 10.4-1.7-8.5 4.8-15.1 4.3-26.8Z"/><path className="inner" d="M25.7 25.4c4.1 4.3 6.2 8.4 5.8 12.7-.4 4.7-3.3 7.5-7.5 7.5-4.7 0-7.8-3.3-7.8-7.8 0-3.3 1.5-6.3 4.4-9.1-.1 3.5 1.2 5.3 2.8 5.9-.5-3.4.9-6.4 2.3-9.2Z"/></svg>}

export default function App(){
 const [a,setA]=useState(""),[b,setB]=useState(""),[key,setKey]=useState(null),[loading,setLoading]=useState(false),[copied,setCopied]=useState(false);
 const result=key?RESULTS[key]:null, pct=useMemo(()=>key?score(a,b):0,[a,b,key]);
 const start=e=>{e.preventDefault();if(!a.trim()||!b.trim()||loading)return;setLoading(true);setKey(null);setTimeout(()=>{setKey(flames(a,b));setLoading(false)},1700)};
 const reset=()=>{setKey(null);setLoading(false);setCopied(false)};
 const share=async()=>{const text="I played FLAMES with "+a.trim()+" + "+b.trim()+" and got "+result[0]+" 🔥 Try yours!";if(navigator.share){try{await navigator.share({title:"My FLAMES result",text,url:location.href});return}catch{}}window.open("https://wa.me/?text="+encodeURIComponent(text+" "+location.href),"_blank","noopener,noreferrer")};
 const copy=async()=>{try{await navigator.clipboard.writeText("FLAMES result: "+a.trim()+" + "+b.trim()+" = "+result[0]+" 🔥");setCopied(true);setTimeout(()=>setCopied(false),1800)}catch{}};
 return <main className="app"><div className="glow g1"/><div className="glow g2"/>
  <header><button className="brand" onClick={reset}><span><Flame/></span>FLAMES</button><div className="fun"><i/> Just for fun</div></header>
  <section className="shell">
   {!key&&!loading&&<><div className="hero"><small>01 · NAME CHEMISTRY</small><h1>Two names.<br/><em>One unexpected</em> connection.</h1><p>Bring two names together and let the classic FLAMES game reveal what kind of connection they have.</p></div>
    <form className="card" onSubmit={start}><div className="label">START A MATCH <b>✦</b></div><div className="fields"><label>Your name<input value={a} onChange={e=>setA(e.target.value)} placeholder="e.g. Alex" maxLength={30}/></label><strong>+</strong><label>Their name<input value={b} onChange={e=>setB(e.target.value)} placeholder="e.g. Jamie" maxLength={30}/></label></div><button className="match" disabled={!a.trim()||!b.trim()}>Discover your match <span>↗</span></button><p className="note">No account. No data saved. Just a little fun.</p></form>
    <div className="letters">{LETTERS.map((x,i)=><span style={{animationDelay:i*.12+"s"}} key={x}>{x}</span>)}</div></>}
   {loading&&<div className="loading"><div className="names"><b>{a.trim()}</b><span><Flame/></span><b>{b.trim()}</b></div><div className="ring"><div><Flame/></div></div><p>Calculating your connection<span>...</span></p><div className="bars"><i/><i/><i/><i/><i/></div></div>}
   {key&&result&&<div className="result"><div className="resulttop"><button onClick={reset}>← New match</button><small>RESULT REVEALED</small></div><div className="resultcard"><div className="pair">{a.trim()} <span>×</span> {b.trim()}</div><div className="emoji">{result[1]}</div><small>THE FLAMES SAYS</small><h2>{result[0]}</h2><p>{result[2]}</p><div className="compat"><div><span>PLAYFUL COMPATIBILITY</span><b>{pct}%</b></div><div className="meter"><i style={{width:pct+"%"}}/></div><small>Entertainment only — generated from the names.</small></div><div className="actions"><button onClick={share}>Share result ↗</button><button onClick={copy}>{copied?"Copied ✓":"Copy result"}</button></div></div><p className="disclaimer">FLAMES is a classic name game, not a real measure of relationship compatibility.</p></div>}
  </section>
  <footer><span>FLAMES</span><span>Classic game · Modern experience</span><span>🔥</span></footer>
 </main>
}