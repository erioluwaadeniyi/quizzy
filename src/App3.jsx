import { useMemo, useState } from "react";
import "./App.css";

const RESULTS = {
  F: { name:"Friends", emoji:"🤝", messages:["The universe said: relax 😂 You two are giving best-friend energy.","No drama, just vibes. These names are screaming friendship 😂.","Plot twist: the perfect person to send memes to all day."] },
  L: { name:"Lovers", emoji:"❤️", messages:["Hmmmm… somebody might want to send a risky text tonight 👀❤️.","Okayyy, FLAMES is seeing chemistry. We are not saying anything… but 👀.","The names are giving romance. Proceed with confidence… or at least curiosity 😂."] },
  A: { name:"Affection", emoji:"💫", messages:["Soft vibes detected. Somebody definitely cares a little extra 💫.","There is a suspicious amount of sweetness hiding in these names 😂.","Not quite a movie romance, but definitely something warm here."] },
  M: { name:"Marriage", emoji:"💍", messages:["Straight to the wedding plans? FLAMES said skip the talking stage 😂💍.","Someone better start looking at ring sizes. The game has spoken 😂.","FLAMES really looked at these names and said: long-term commitment."] },
  E: { name:"Enemies", emoji:"⚡", messages:["At least the rivalry will never be boring 😂⚡.","The names entered the room and immediately chose violence.","You two might argue over who gets the last slice. Good luck 😂."] },
  S: { name:"Siblings", emoji:"🫶", messages:["The game said family energy. Please stop fighting over the remote 😂.","Very much: 'that's my sibling, don't touch them' energy 🫶.","FLAMES sees a familiar bond… and probably some annoying each other too 😂."] }
};
const LETTERS = ["F","L","A","M","E","S"];

function flames(a,b){
  let x=a.toLowerCase().replace(/[^a-z]/g,"").split("");
  let y=b.toLowerCase().replace(/[^a-z]/g,"").split("");
  if(!x.length || !y.length) return null;
  for(let i=0;i<x.length;i++){ const j=y.indexOf(x[i]); if(j>-1){ x[i]=""; y[j]=""; } }
  const remaining=x.filter(Boolean).length+y.filter(Boolean).length;
  if(!remaining) return "F";
  let pool=[...LETTERS], index=0;
  while(pool.length>1){ index=(index+remaining-1)%pool.length; pool.splice(index,1); }
  return pool[0];
}
function score(a,b){
  const value=a.trim().toLowerCase()+":"+b.trim().toLowerCase(); let hash=0;
  for(let i=0;i<value.length;i++) hash=(hash*31+value.charCodeAt(i))>>>0;
  return 58+(hash%40);
}
function Flame(){
  return <svg className="flame" viewBox="0 0 48 56" aria-hidden="true"><path d="M25.8 2.5c2.5 10.7-5.8 14.4-3.5 22.1 1.1 3.8 4.2 5.2 6.7 2.4 3.1-3.5 1.7-9.6 1.7-9.6 7.9 6.1 12.1 13.1 11.4 21.3C41.2 48.9 33.8 54 24.1 54 13.4 54 5.8 47.5 5.8 38.5c0-7.8 4.4-14.7 11.5-19.6-.7 6.2 1.5 9.6 4.2 10.4-1.7-8.5 4.8-15.1 4.3-26.8Z"/><path className="inner" d="M25.7 25.4c4.1 4.3 6.2 8.4 5.8 12.7-.4 4.7-3.3 7.5-7.5 7.5-4.7 0-7.8-3.3-7.8-7.8 0-3.3 1.5-6.3 4.4-9.1-.1 3.5 1.2 5.3 2.8 5.9-.5-3.4.9-6.4 2.3-9.2Z"/></svg>
}
function escapeXml(value){return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");}
function downloadResultCard(nameA,nameB,resultKey,percent,message,secret){
  const result=RESULTS[resultKey], pairA=escapeXml(nameA), pairB=escapeXml(secret?"SECRET CRUSH":nameB);
  const svg=[
    '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">',
    '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff4d8"/><stop offset="55%" stop-color="#fffaf2"/><stop offset="100%" stop-color="#ffd6ba"/></linearGradient></defs>',
    '<rect width="1080" height="1350" rx="72" fill="url(#bg)"/><circle cx="910" cy="150" r="150" fill="#ff9d3d" opacity=".13"/><circle cx="140" cy="1170" r="190" fill="#d95832" opacity=".10"/>',
    '<rect x="70" y="70" width="940" height="1210" rx="52" fill="#ffffff" fill-opacity=".82" stroke="#eadfd2" stroke-width="3"/>',
    '<text x="540" y="150" text-anchor="middle" fill="#17120f" font-family="Arial,sans-serif" font-size="34" font-weight="700" letter-spacing="7">FLAMES</text>',
    '<text x="540" y="198" text-anchor="middle" fill="#a08f82" font-family="Arial,sans-serif" font-size="16" font-weight="700" letter-spacing="4">RESULT REVEALED</text>',
    '<text x="540" y="310" text-anchor="middle" fill="#756b62" font-family="Arial,sans-serif" font-size="25" font-weight="700">'+pairA+' × '+pairB+'</text>',
    '<circle cx="540" cy="465" r="105" fill="#fff1d0" stroke="#f2dfb7" stroke-width="3"/>',
    '<text x="540" y="500" text-anchor="middle" font-family="Arial,sans-serif" font-size="82">'+escapeXml(result.emoji)+'</text>',
    '<text x="540" y="625" text-anchor="middle" fill="#a19589" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="5">THE FLAMES SAYS</text>',
    '<text x="540" y="720" text-anchor="middle" fill="#d95832" font-family="Arial,sans-serif" font-size="92" font-weight="800">'+escapeXml(result.name)+'</text>',
    '<text x="540" y="805" text-anchor="middle" fill="#70675f" font-family="Arial,sans-serif" font-size="23">'+escapeXml(message)+'</text>',
    '<text x="540" y="980" text-anchor="middle" fill="#8d8176" font-family="Arial,sans-serif" font-size="17" font-weight="700" letter-spacing="3">PLAYFUL COMPATIBILITY</text>',
    '<text x="540" y="1045" text-anchor="middle" fill="#17120f" font-family="Arial,sans-serif" font-size="54" font-weight="800">'+percent+'%</text>',
    '<rect x="180" y="1085" width="720" height="16" rx="8" fill="#eee6dc"/><rect x="180" y="1085" width="'+(percent*7.2)+'" height="16" rx="8" fill="#d95832"/>',
    '<text x="540" y="1165" text-anchor="middle" fill="#a79d94" font-family="Arial,sans-serif" font-size="16">Just for fun · Not a real measure of compatibility</text>',
    '<text x="540" y="1225" text-anchor="middle" fill="#17120f" font-family="Arial,sans-serif" font-size="18" font-weight="700">🔥 Classic game · Modern experience</text>',
    '</svg>'
  ].join("");
  const url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml;charset=utf-8"}));
  const image=new Image();
  image.onload=()=>{const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1350;const ctx=canvas.getContext("2d");ctx.drawImage(image,0,0);URL.revokeObjectURL(url);canvas.toBlob(png=>{if(!png)return;const downloadUrl=URL.createObjectURL(png);const a=document.createElement("a");a.href=downloadUrl;a.download="flames-result.png";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(downloadUrl)},"image/png")};
  image.onerror=()=>URL.revokeObjectURL(url);
  image.src=url;
}

function trackEvent(name, properties={}){ try { window.va?.("event", { name, ...properties }); } catch {} }

export default function App(){
  const [a,setA]=useState(""),[b,setB]=useState(""),[key,setKey]=useState(null),[loading,setLoading]=useState(false),[copied,setCopied]=useState(false),[downloaded,setDownloaded]=useState(false),[secretMode,setSecretMode]=useState(false),[quipIndex,setQuipIndex]=useState(0);
  const result=key?RESULTS[key]:null;
  const pct=useMemo(()=>key?score(a,b):0,[a,b,key]);
  const displayPair=secretMode?a.trim()+" × Secret Crush":a.trim()+" × "+b.trim();

  const start=e=>{e.preventDefault();if(!a.trim()||!b.trim()||loading)return;trackEvent("match_started",{mode:secretMode?"secret_crush":"classic"});setLoading(true);setKey(null);setCopied(false);setDownloaded(false);window.setTimeout(()=>{const k=flames(a,b);const list=RESULTS[k].messages;setQuipIndex((a.length+b.length+Date.now())%list.length);setKey(k);setLoading(false);trackEvent("match_completed",{mode:secretMode?"secret_crush":"classic",result:k})},1700)};
  const reset=()=>{setKey(null);setLoading(false);setCopied(false);setDownloaded(false)};
  const inviteFriends=async()=>{trackEvent("invite_clicked");
    const text="🔥 Come play FLAMES with me! Put two names in and see what the game says.";
    if(navigator.share){
      try{await navigator.share({title:"Play FLAMES",text,url:location.href});return}catch{}
    }
    window.open("https://wa.me/?text="+encodeURIComponent(text+" "+location.href),"_blank","noopener,noreferrer");
  };
  const share=async()=>{if(!result)return;trackEvent("share_clicked",{mode:secretMode?"secret_crush":"classic",result:key});const text=secretMode?"I played FLAMES for a secret crush and got "+result.name+" 🔥 Try yours!":"I played FLAMES with "+a.trim()+" + "+b.trim()+" and got "+result.name+" 🔥 Try yours!";if(navigator.share){try{await navigator.share({title:"My FLAMES result",text,url:location.href});return}catch{}}window.open("https://wa.me/?text="+encodeURIComponent(text+" "+location.href),"_blank","noopener,noreferrer")};
  const copy=async()=>{if(!result)return;trackEvent("copy_clicked",{result:key});const text=secretMode?"FLAMES result: "+a.trim()+" + Secret Crush = "+result.name+" 🔥":"FLAMES result: "+a.trim()+" + "+b.trim()+" = "+result.name+" 🔥";try{await navigator.clipboard.writeText(text);setCopied(true);window.setTimeout(()=>setCopied(false),1800)}catch{}};
  const download=()=>{if(!result)return;trackEvent("download_clicked",{result:key});downloadResultCard(a.trim(),b.trim(),key,pct,result.messages[quipIndex],secretMode);setDownloaded(true);window.setTimeout(()=>setDownloaded(false),2200)};

  return <main className={"app "+(secretMode?"secret-mode":"")}><div className="glow g1"/><div className="glow g2"/>
    <header><button className="brand" onClick={reset} aria-label="Back to FLAMES home"><span><Flame/></span>FLAMES</button><div className="fun"><i/> Just for fun</div></header>
    <section className="shell">
      {!key&&!loading&&<><div className="mode-switch"><button type="button" className={!secretMode?"active":""} onClick={()=>setSecretMode(false)}>Classic FLAMES</button><button type="button" className={secretMode?"active":""} onClick={()=>setSecretMode(true)}>💘 Secret Crush</button></div>
        <div className="hero"><small>{secretMode?"02 · KEEP IT SECRET":"01 · NAME CHEMISTRY"}</small><h1>{secretMode?<>Your crush.<br/><em>Your secret.</em> Your result.</>:<>Two names.<br/><em>One unexpected</em> connection.</>}</h1><p>{secretMode?"Enter the name of the person on your mind. Their name stays hidden on the result.":"Bring two names together and let the classic FLAMES game reveal what kind of connection they have."}</p></div>
        <form className="card" onSubmit={start}><div className="label">{secretMode?"SECRET CRUSH MATCH":"START A MATCH"}<b>✦</b></div><div className="fields"><label>Your name<input value={a} onChange={e=>setA(e.target.value)} placeholder="e.g. Alex" maxLength={30} autoComplete="off"/></label><strong>+</strong><label>{secretMode?"Your crush's name":"Their name"}<input value={b} onChange={e=>setB(e.target.value)} placeholder={secretMode?"keep it secret 👀":"e.g. Jamie"} maxLength={30} autoComplete="off"/></label></div><button className="match" disabled={!a.trim()||!b.trim()}><span>{secretMode?"Reveal secret result":"Discover your match"}</span><b>↗</b></button><p className="note">{secretMode?"Their name stays on this device and is not saved by FLAMES.":"No account. No data saved. Just a little fun."}</p></form>
        <div className="letters">{LETTERS.map((letter,index)=><span style={{animationDelay:index*0.12+"s"}} key={letter}>{letter}</span>)}</div>
        <button type="button" className="invite-home" onClick={inviteFriends}>🔥 Invite friends to play <b>↗</b></button></>}
      {loading&&<div className="loading"><div className="names"><b>{a.trim()}</b><span><Flame/></span><b>{secretMode?"Secret Crush":b.trim()}</b></div><div className="ring"><div><Flame/></div></div><p>{secretMode?"Checking the secret connection":"Calculating your connection"}<span>...</span></p><div className="bars"><i/><i/><i/><i/><i/></div></div>}
      {key&&result&&<div className={"result result-"+key.toLowerCase()}><div className="resulttop"><button onClick={reset}>← Try another person</button><small>{secretMode?"SECRET RESULT":"RESULT REVEALED"}</small></div><div className="resultcard"><div className="result-sparkles"><i/><i/><i/><i/><i/><i/></div><div className="pair">{displayPair}</div><div className="emoji">{result.emoji}</div><small>THE FLAMES SAYS</small><h2>{result.name}</h2><p>{result.messages[quipIndex]}</p><div className="compat"><div><span>PLAYFUL COMPATIBILITY</span><b>{pct}%</b></div><div className="meter"><i style={{width:pct+"%"}}/></div><small>Entertainment only — generated from the names.</small></div><div className="actions"><button onClick={share}>Share result ↗</button><button onClick={download}>{downloaded?"Downloaded ✓":"Download card ↓"}</button><button onClick={copy}>{copied?"Copied ✓":"Copy result"}</button></div></div><p className="disclaimer">FLAMES is a classic name game, not a real measure of relationship compatibility.</p></div>}
    </section>
    <footer><span>FLAMES</span><span>Classic game · Modern experience</span><span>🔥</span></footer>
  </main>;
}
