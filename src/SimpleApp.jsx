import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";
import { signIn, signOut, signUp, requestPasswordReset, verifyRecoveryCode, updatePassword } from "./auth.js";
import { trackEvent } from "./analytics.js";
import "./SimpleApp.css";
import "./LandingPage.css";

const RESULTS={
  F:{name:"Friends",emoji:"🤝",title:"THE DAY-ONE DUO",quote:"Some connections just make every random day better.",messages:["Best-friend energy 😂","No drama. Just good vibes.","This one feels like a meme-sharing friendship."]},
  L:{name:"Lovers",emoji:"❤️",title:"IT'S GIVING ROM-COM",quote:"Okay… somebody might want to text first.",messages:["Okay… FLAMES sees chemistry 👀","Somebody might want to send that text.","There is definitely a little romance hiding here."]},
  A:{name:"Affection",emoji:"💫",title:"THE SOFT SPOT",quote:"A little extra care can say a lot.",messages:["Something sweet is going on.","Soft energy detected.","There is a little extra care here."]},
  M:{name:"Marriage",emoji:"💍",title:"CALM DOWN 😂",quote:"FLAMES just skipped several chapters.",messages:["FLAMES skipped straight to forever 😂","Somebody better start looking at rings.","Apparently this got serious very quickly."]},
  E:{name:"Enemies",emoji:"⚡",title:"CHAOS BUDDIES",quote:"At least the rivalry should be entertaining.",messages:["At least the rivalry will be entertaining.","The names chose chaos 😂","Friendly warning: expect arguments."]},
  S:{name:"Siblings",emoji:"🫶",title:"SAME FAMILY ENERGY",quote:"The chaos feels suspiciously familiar.",messages:["Family energy detected.","Very much sibling chaos.","Please stop fighting over the remote 😂."]}
};
const LETTERS=["F","L","A","M","E","S"];
const QUOTES=["One more match. You know you want to.","Curiosity has entered the chat.","Today feels like a good day to test a name.","No pressure. Just FLAMES.","There is always one more person to test 😂."];
const QUESTION_TEMPLATES={
  Fun:[
    ["Who is most likely to survive a zombie apocalypse?",["Me","You","Neither 😂"]],
    ["Who would win in a staring contest?",["Me","You","We both lose"]],
    ["Pick our next chaotic plan.",["Food trip","Movie night","Random adventure"]]
  ],
  Friends:[
    ["Who should choose the movie?",["Me","You","Let's vote"]],
    ["Who would reply first in the group chat?",["Me","You","Both late 😂"]],
    ["Who knows the other person better?",["Obviously me","Obviously you","Let's find out"]]
  ],
  Crush:[
    ["Be honest… who catches feelings first?",["Me 👀","You 👀","It's complicated"]],
    ["Would you actually go on a date?",["Yes","Maybe","Absolutely not 😂"]],
    ["What is our vibe?",["Cute","Dangerous","Don't ask 😂"]]
  ],
  Deep:[
    ["Who gives better advice?",["Me","You","We both try"]],
    ["Who would you trust with your biggest secret?",["Me","You","Depends 😭"]],
    ["Which matters more in a friendship?",["Trust","Fun","Both"]]
  ],
  Chaos:[
    ["Who is more likely to start an argument over nothing?",["Me 😂","You 😂","Both"]],
    ["Who would get lost on a simple trip?",["Me","You","We're doomed"]],
    ["Who is the bigger menace?",["Me","You","No comment"]]
  ]
};

function flames(a,b){
  let x=a.toLowerCase().replace(/[^a-z]/g,"").split("");
  let y=b.toLowerCase().replace(/[^a-z]/g,"").split("");
  if(!x.length||!y.length)return null;
  for(let i=0;i<x.length;i++){const j=y.indexOf(x[i]);if(j>-1){x[i]="";y[j]="";}}
  const n=x.filter(Boolean).length+y.filter(Boolean).length;
  if(!n)return "F";
  let pool=[...LETTERS],i=0;
  while(pool.length>1){i=(i+n-1)%pool.length;pool.splice(i,1)}
  return pool[0];
}
function percent(a,b){
  let h=0;const s=a.trim().toLowerCase()+":"+b.trim().toLowerCase();
  for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;
  return 58+(h%40);
}
function timeAgo(v){
  const m=Math.max(0,Math.floor((Date.now()-new Date(v).getTime())/60000));
  if(m<1)return "just now";if(m<60)return m+"m ago";
  const h=Math.floor(m/60);if(h<24)return h+"h ago";return Math.floor(h/24)+"d ago";
}
function initials(name){return(name||"F").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()}
function Avatar({profile,size="md"}){return <div className={"sa-avatar sa-avatar-"+size}><span>{initials(profile?.display_name)}</span><i/></div>}
function Icon({name,size=18}){
  const p={width:size,height:size,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};
  const x={
    home:<><path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9"/><path d="M9 21v-6h6v6"/></>,
    play:<path d="m8 5 11 7-11 7V5Z"/>,plus:<><path d="M12 5v14"/><path d="M5 12h14"/></>,
    user:<><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
    clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    users:<><circle cx="9" cy="8" r="4"/><path d="M2.5 21a6.5 6.5 0 0 1 13 0"/><path d="M16 4a4 4 0 0 1 0 8"/><path d="M17 15a5.5 5.5 0 0 1 4.5 6"/></>,
    spark:<><path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2Z"/><path d="m19 16 .5 2L21.5 19l-2 .5L19 21l-.5-1.5-2-.5 2-.5L19 16Z"/></>,
    arrow:<><path d="M5 12h13"/><path d="m13 6 6 6-6 6"/></>,back:<><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></>,
    settings:<><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/><path d="m4.9 4.9 1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"/><circle cx="12" cy="12" r="4"/></>,
    results:<><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19H2"/></>,
    bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    trophy:<><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v7a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v3a4 4 0 0 0 4 4"/><path d="M17 6h3v3a4 4 0 0 1-4 4"/></>
  };
  return <svg {...p}>{x[name]||x.spark}</svg>;
}
function go(path){window.history.pushState({}, "", path);window.dispatchEvent(new PopStateEvent("popstate"))}
function useLiveRefresh(interval=5000){
  const [,setTick]=useState(0);
  useEffect(()=>{
    let timer;
    const ping=()=>setTick(v=>v+1);
    const schedule=()=>{clearInterval(timer);timer=setInterval(ping,interval)};
    schedule();
    const onVisible=()=>{if(document.visibilityState==="visible"){ping();schedule()}else clearInterval(timer)};
    document.addEventListener("visibilitychange",onVisible);
    window.addEventListener("flames:data-change",ping);
    return()=>{clearInterval(timer);document.removeEventListener("visibilitychange",onVisible);window.removeEventListener("flames:data-change",ping)};
  },[interval]);
}

function Shell({profile,streak,view,children}){
  return <main className="sa-app">
    <header className="sa-nav">
      <button className="sa-brand" onClick={()=>go("/app")}><span className="sa-logo"><span>F</span></span><span>FLAMES</span></button>
      <nav>
        <button className={view==="home"?"active":""} onClick={()=>go("/app")}><Icon name="home"/>Home</button>
        <button className={view==="play"?"active":""} onClick={()=>go("/app/play")}><Icon name="play"/>Play</button>
        <button className={view==="create"?"active":""} onClick={()=>go("/app/create")}><Icon name="plus"/>Create</button>
        <button className={view==="results"?"active":""} onClick={()=>go("/app/results")}><Icon name="results"/>Results</button>
      </nav>
      <div className="sa-nav-right"><span className="sa-streak">🔥 {streak||0}</span><NotificationsBell user={profile?.id?{id:profile.id}:null}/><button className="sa-avatar-button" onClick={()=>go("/app/profile")}><Avatar profile={profile} size="sm"/></button></div>
    </header>
    {children}
  </main>;
}

async function getAccount(user){
  if(!user)return {profile:null,matches:[]};
  let {data:profile}=await supabase.from("flames_profiles").select("*").eq("id",user.id).single();
  if(!profile){
    const meta=user.user_metadata||{};
    const created=await supabase.from("flames_profiles").insert({id:user.id,username:meta.username||null,display_name:meta.display_name||"FLAMES Friend",avatar_id:Number(meta.avatar_id)||1}).select().single();
    profile=created.data||null;
  }
  const {data:matches}=await supabase.from("flames_matches").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(20);  if(profile){
    
  }
  return {profile,matches:matches||[]};
}

function AuthPage({mode}){
  const login=mode==="login";
  const returnTo=new URLSearchParams(location.search).get("returnTo")||"/app";
  const [name,setName]=useState(""),[username,setUsername]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[available,setAvailable]=useState(null),[done,setDone]=useState(false);
  useEffect(()=>{if(login||username.trim().length<3){setAvailable(null);return}let off=false;const t=setTimeout(async()=>{const {data}=await supabase.from("flames_profiles").select("id").eq("username",username.trim().toLowerCase()).limit(1);if(!off)setAvailable(!data?.length)},300);return()=>{off=true;clearTimeout(t)}},[username,login]);
  const submit=async e=>{
    e.preventDefault();setError("");
    if(!login&&(!name.trim()||available!==true)){setError("Choose an available username and enter your name.");return}
    if(!/^\S+@\S+\.\S+$/.test(email.trim())){setError("Enter a valid email.");return}
    if(password.length<6){setError("Password must be at least 6 characters.");return}
    setBusy(true);
    try{
      const r=login?await signIn({email,password}):await signUp({email,password,displayName:name.trim(),username:username.trim().toLowerCase()});
      if(r.error){setError(r.error.message||"Something went wrong.");return}
      if(login){go(returnTo);return}
      if(!r.data?.session){setError("Account created, but email confirmation is still enabled.");return}
      setDone(true);
    }catch(err){
      setError(err?.message||"We couldn't connect to FLAMES. Check your connection and try again.");
    }finally{setBusy(false)}
  };
  return <main className="sa-auth"><a className="sa-auth-brand" href="/"><span className="sa-logo"><span>F</span></span>FLAMES</a><section className="sa-auth-card"><div className="sa-fire">🔥</div><span className="sa-kicker">{login?"WELCOME BACK":"JOIN FLAMES"}</span>{done?<><h1>You're in.</h1><p>Your FLAMES account is ready.</p><button className="sa-primary" onClick={()=>go(returnTo)}>Play FLAMES <Icon name="arrow"/></button></>:<><h1>{login?"Come back and play.":"Make FLAMES yours."}</h1><p>{login?"Your games, your streak, your little FLAMES history.":"A small account keeps your results and gives you your own FLAMES name."}</p>{!login&&<><label>Full name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Alex Johnson"/></label><label>FLAMES username<div className="sa-user-input"><b>@</b><input value={username} onChange={e=>setUsername(e.target.value.replace(/[^a-z0-9_]/g,"").slice(0,20))} placeholder="alexjohnson"/></div>{available===true&&<small className="sa-good">Name is available.</small>}{available===false&&<small className="sa-bad">That name is taken.</small>}</label></>}<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label><div className="sa-password-line"><span>Password</span>{login&&<a href="/forgot-password">Forgot?</a>}</div><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/></label>{error&&<div className="sa-error">{error}</div>}<button type="button" className="sa-primary" disabled={busy} onClick={submit}>{busy?"One moment…":login?"Log in":"Create account"} <Icon name="arrow"/></button><a className="sa-switch" href={login?"/register":"/login"}>{login?"New here? Create an account":"Already have an account? Log in"}</a></>}</section></main>;
}

function ResetPage(){
  const [step,setStep]=useState("email"),[email,setEmail]=useState(""),[code,setCode]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[token,setToken]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
  const run=async e=>{
    e.preventDefault();setError("");
    if(step==="email"){setBusy(true);const r=await requestPasswordReset({email:email.trim().toLowerCase()});setBusy(false);if(r.error)setError(r.error.message);else setStep("code");return}
    if(step==="code"){setBusy(true);const r=await verifyRecoveryCode({email:email.trim().toLowerCase(),token:code});setBusy(false);if(r.error)setError(r.error.message);else{setToken(r.data?.resetToken||"");setStep("password")}return}
    if(password.length<6||password!==confirm){setError("Make sure both passwords match and are at least 6 characters.");return}
    setBusy(true);const r=await updatePassword({email:email.trim().toLowerCase(),resetToken:token,password});setBusy(false);if(r.error)setError(r.error.message);else{await signOut();setDone(true)}
  };
  return <main className="sa-auth"><a className="sa-auth-brand" href="/"><span className="sa-logo"><span>F</span></span>FLAMES</a><section className="sa-auth-card"><div className="sa-fire">🔥</div>{done?<><span className="sa-kicker">PASSWORD UPDATED</span><h1>You're back.</h1><p>Log in with your new password.</p><a className="sa-primary sa-button-link" href="/login">Log in <Icon name="arrow"/></a></>:<><span className="sa-kicker">PASSWORD RESET</span><h1>{step==="email"?"Forgot your password?":step==="code"?"Check your email.":"Choose a new password."}</h1><p>{step==="email"?"We'll send a 6-digit code.":step==="code"?"Enter the code we sent you.":"Set a new password for FLAMES."}</p><form onSubmit={run}>{step==="email"&&<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>}{step==="code"&&<label>6-digit code<input inputMode="numeric" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))}/></label>}{step==="password"&&<><label>New password<input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirm password<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label></>}{error&&<div className="sa-error">{error}</div>}<button className="sa-primary" disabled={busy}>{busy?"Working…":step==="email"?"Send code":step==="code"?"Verify code":"Update password"} <Icon name="arrow"/></button></form><a className="sa-switch" href="/login">Back to log in</a></>}</section></main>;
}


function Flame(){return <svg className="flame" viewBox="0 0 48 56" aria-hidden="true"><path d="M25.8 2.5c2.5 10.7-5.8 14.4-3.5 22.1 1.1 3.8 4.2 5.2 6.7 2.4 3.1-3.5 1.7-9.6 1.7-9.6 7.9 6.1 12.1 13.1 11.4 21.3C41.2 48.9 33.8 54 24.1 54 13.4 54 5.8 47.5 5.8 38.5c0-7.8 4.4-14.7 11.5-19.6-.7 6.2 1.5 9.6 4.2 10.4-1.7-8.5 4.8-15.1 4.3-26.8Z"/><path className="inner" d="M25.7 25.4c4.1 4.3 6.2 8.4 5.8 12.7-.4 4.7-3.3 7.5-7.5 7.5-4.7 0-7.8-3.3-7.8-7.8 0-3.3 1.5-6.3 4.4-9.1-.1 3.5 1.2 5.3 2.8 5.9-.5-3.4.9-6.4 2.3-9.2Z"/></svg>}
function escapeXml(value){return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}
function makeResultPng(nameA,nameB,resultKey,percent,message,quote,title){return new Promise(resolve=>{const result=RESULTS[resultKey];const svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">','<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff4d8"/><stop offset="55%" stop-color="#fffaf2"/><stop offset="100%" stop-color="#ffd6ba"/></linearGradient></defs>','<rect width="1080" height="1350" rx="72" fill="url(#bg)"/>','<circle cx="910" cy="150" r="150" fill="#ff9d3d" opacity=".13"/><circle cx="140" cy="1170" r="190" fill="#d95832" opacity=".10"/>','<rect x="70" y="70" width="940" height="1210" rx="52" fill="#ffffff" fill-opacity=".82" stroke="#eadfd2" stroke-width="3"/>','<rect x="438" y="112" width="204" height="56" rx="17" fill="#17120f"/>','<text x="540" y="149" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="22" font-weight="800" letter-spacing="5">FLAMES</text>','<text x="540" y="220" text-anchor="middle" fill="#a08f82" font-family="Arial,sans-serif" font-size="16" font-weight="700" letter-spacing="4">RESULT REVEALED</text>','<text x="540" y="310" text-anchor="middle" fill="#756b62" font-family="Arial,sans-serif" font-size="25" font-weight="700">'+escapeXml(nameA)+' × '+escapeXml(nameB)+'</text>','<circle cx="540" cy="465" r="105" fill="#fff1d0" stroke="#f2dfb7" stroke-width="3"/>','<text x="540" y="500" text-anchor="middle" font-family="Arial,sans-serif" font-size="82">'+escapeXml(result.emoji)+'</text>','<text x="540" y="625" text-anchor="middle" fill="#a19589" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="5">THE FLAMES SAYS</text>','<text x="540" y="715" text-anchor="middle" fill="#d95832" font-family="Arial,sans-serif" font-size="82" font-weight="800">'+escapeXml(result.name)+'</text>','<text x="540" y="778" text-anchor="middle" fill="#a08f82" font-family="Arial,sans-serif" font-size="19" font-weight="700">'+escapeXml(title)+'</text>','<text x="540" y="825" text-anchor="middle" fill="#756b62" font-family="Arial,sans-serif" font-size="20">'+escapeXml(quote)+'</text>','<text x="540" y="870" text-anchor="middle" fill="#70675f" font-family="Arial,sans-serif" font-size="21">'+escapeXml(message)+'</text>','<text x="540" y="980" text-anchor="middle" fill="#8d8176" font-family="Arial,sans-serif" font-size="17" font-weight="700" letter-spacing="3">PLAYFUL COMPATIBILITY</text>','<text x="540" y="1040" text-anchor="middle" fill="#17120f" font-family="Arial,sans-serif" font-size="54" font-weight="800">'+percent+'%</text>','<rect x="180" y="1085" width="720" height="16" rx="8" fill="#eee6dc"/><rect x="180" y="1085" width="'+(percent*7.2)+'" height="16" rx="8" fill="#d95832"/>','<text x="540" y="1165" text-anchor="middle" fill="#a79d94" font-family="Arial,sans-serif" font-size="16">Just for fun · Not a real measure of compatibility</text>','</svg>'].join("");const url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml;charset=utf-8"}));const image=new Image();image.onload=()=>{const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1350;const ctx=canvas.getContext("2d");ctx.drawImage(image,0,0);URL.revokeObjectURL(url);canvas.toBlob(resolve,"image/png")};image.onerror=()=>{URL.revokeObjectURL(url);resolve(null)};image.src=url})}

function GamePage({profile,streak,user}){
  const [a,setA]=useState(""),[b,setB]=useState(""),[secret,setSecret]=useState(false),[busy,setBusy]=useState(false),[stage,setStage]=useState(0),[result,setResult]=useState(null),[saved,setSaved]=useState(false),[copied,setCopied]=useState(false),[downloaded,setDownloaded]=useState(false),[shareOpen,setShareOpen]=useState(false),[shareNotice,setShareNotice]=useState(""),[error,setError]=useState("");
  const run=async e=>{
    e.preventDefault();if(!a.trim()||!b.trim()||busy)return;
    setError("");setBusy(true);setSaved(false);setResult(null);setStage(0);setCopied(false);setDownloaded(false);trackEvent("match_started",{mode:secret?"secret_crush":"classic"});
    try{
      for(let n=1;n<=LETTERS.length;n++){await new Promise(r=>setTimeout(r,135));setStage(n)}
      await new Promise(r=>setTimeout(r,430));
      const key=flames(a,b),pct=percent(a,b),data=RESULTS[key],message=data.messages[Math.floor(Math.random()*data.messages.length)];
      if(user){
        const r=await supabase.from("flames_matches").insert({user_id:user.id,name_a:a.trim(),name_b:secret?"":b.trim(),result_key:key,percent:pct,message,secret_mode:secret}).select().single();
        setSaved(!r.error); if(!r.error){const ar=await recordMeaningfulActivity();if(ar?.data?.[0])setTimeout(()=>syncAwards(user,{...profile,streak_count:ar.data[0].streak_count,longest_streak:ar.data[0].longest_streak},[...[]]),0)}
      }
      setStage(7);await new Promise(r=>setTimeout(r,220));
      setResult({key,pct,message,title:data.title,quote:data.quote});
      trackEvent("match_completed",{mode:secret?"secret_crush":"classic",result:key});
    }catch(err){
      setStage(0);
      setResult(null);
      setError(err?.message||"FLAMES couldn't finish that match. Please try again.");
    }finally{setBusy(false)}
  };
  const reset=()=>{setResult(null);setStage(0);setBusy(false);setCopied(false);setDownloaded(false);setShareOpen(false);setShareNotice("");setA("");setB("")};
  const shareText=()=>secret?"I played FLAMES in Secret Crush mode and got "+RESULTS[result.key].name+" 🔥 Try yours!":"I played FLAMES with "+a.trim()+" + "+b.trim()+" and got "+RESULTS[result.key].name+" 🔥 Try yours!";
  const copy=async()=>{if(!result)return;trackEvent("copy_clicked",{result:result.key});try{await navigator.clipboard.writeText(secret?"FLAMES result: "+a.trim()+" + Secret Crush = "+RESULTS[result.key].name+" 🔥":"FLAMES result: "+a.trim()+" + "+b.trim()+" = "+RESULTS[result.key].name+" 🔥");setCopied(true);window.setTimeout(()=>setCopied(false),1800)}catch{}};
  const download=async()=>{if(!result)return;trackEvent("download_clicked",{result:result.key});const png=await makeResultPng(a.trim(),secret?"SECRET CRUSH":b.trim(),result.key,result.pct,result.message,result.quote,result.title);if(!png)return;const u=URL.createObjectURL(png),tag=document.createElement("a");tag.href=u;tag.download="flames-result.png";document.body.appendChild(tag);tag.click();tag.remove();URL.revokeObjectURL(u);setDownloaded(true);window.setTimeout(()=>setDownloaded(false),2200)};
  const shareCard=async()=>{if(!result)return;trackEvent("share_clicked",{mode:secret?"secret_crush":"classic",result:result.key});try{const png=await makeResultPng(a.trim(),secret?"SECRET CRUSH":b.trim(),result.key,result.pct,result.message,result.quote,result.title);if(!png)throw new Error("card");const file=new File([png],"flames-result.png",{type:"image/png"});if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:"My FLAMES result",text:shareText(),files:[file]});setShareOpen(false);return}const u=URL.createObjectURL(png),tag=document.createElement("a");tag.href=u;tag.download="flames-result.png";document.body.appendChild(tag);tag.click();tag.remove();URL.revokeObjectURL(u);setShareNotice("Your result card was downloaded. You can now post it anywhere.")}catch{}};
  const shareTo=platform=>{if(!result)return;trackEvent("share_clicked",{mode:secret?"secret_crush":"classic",result:result.key});const text=shareText(),url=location.href;if(platform==="whatsapp")window.open("https://wa.me/?text="+encodeURIComponent(text+" "+url),"_blank","noopener,noreferrer");else if(platform==="x")window.open("https://twitter.com/intent/tweet?text="+encodeURIComponent(text)+"&url="+encodeURIComponent(url),"_blank","noopener,noreferrer");else if(platform==="facebook")window.open("https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(url),"_blank","noopener,noreferrer");else if(platform==="threads")window.open("https://www.threads.net/intent/post?text="+encodeURIComponent(text+" "+url),"_blank","noopener,noreferrer");else if(platform==="reddit")window.open("https://www.reddit.com/submit?url="+encodeURIComponent(url)+"&title="+encodeURIComponent("My FLAMES result"),"_blank","noopener,noreferrer");else if(platform==="discord"){try{navigator.clipboard.writeText(text+" "+url)}catch{}window.open("https://discord.com/app","_blank","noopener,noreferrer");setShareNotice("Result text copied. Paste it into the Discord chat you want.")}else if(platform==="instagram")shareCard()};
  return <Shell profile={profile} streak={streak} view="play"><div className="landing-app sa-auth-play"><div className="glow g1"/><div className="glow g2"/><section className="shell">
    {!result&&!busy&&<><div className="mode-switch"><button type="button" className={!secret?"active":""} onClick={()=>setSecret(false)}>Classic FLAMES</button><button type="button" className={secret?"active":""} onClick={()=>setSecret(true)}>💘 Secret Crush</button></div><div className="hero"><small>{secret?"02 · KEEP IT SECRET":"01 · NAME CHEMISTRY"}</small><h1>{secret?<>Your crush.<br/><em>Your secret.</em> Your result.</>:<>Two names.<br/><em>One unexpected</em> connection.</>}</h1><p>{secret?"Enter the name of the person on your mind. Their name stays hidden on the result.":"Bring two names together and let the classic FLAMES game reveal what kind of connection they have."}</p></div><form className="card" onSubmit={run}><div className="label">{secret?"SECRET CRUSH MATCH":"START A MATCH"}<b>✦</b></div><div className="fields"><label>Your name<input value={a} onChange={e=>setA(e.target.value)} placeholder="e.g. Alex" maxLength={30} autoComplete="off"/></label><strong>+</strong><label>{secret?"Your crush's name":"Their name"}<input value={b} onChange={e=>setB(e.target.value)} placeholder={secret?"keep it secret 👀":"e.g. Jamie"} maxLength={30} autoComplete="off"/></label></div><button className="match" disabled={!a.trim()||!b.trim()}><span>{secret?"Reveal secret result":"Discover your match"}</span><b>↗</b></button><p className="note">{secret?"Their name stays on this device and is not saved by FLAMES.":"Your result is saved to your FLAMES account."}</p>{error&&<div className="sa-error">{error}</div>}</form><div className="letters">{LETTERS.map((l,i)=><span style={{animationDelay:i*.12+"s"}} key={l}>{l}</span>)}</div></>}
    {busy&&<div className="loading"><div className="names"><b>{a.trim()}</b><span><Flame/></span><b>{secret?"Secret Crush":b.trim()}</b></div><div className="ring"><div><Flame/></div></div><p>{secret?"Checking the secret connection":"Calculating your connection"}<span>...</span></p><div className="bars"><i/><i/><i/><i/><i/></div></div>}
    {result&&<div className={"result result-"+result.key.toLowerCase()}><div className="resulttop"><button onClick={reset}>← Try another person</button><small>{secret?"SECRET RESULT":"RESULT REVEALED"}</small></div><div className="resultcard"><div className="result-logo"><img src="/favicon.svg" alt="" /></div><div className="result-sparkles"><i/><i/><i/><i/><i/><i/></div><div className="pair">{secret?a.trim()+" × Secret Crush":a.trim()+" × "+b.trim()}</div><div className="emoji">{RESULTS[result.key].emoji}</div><small>THE FLAMES SAYS</small><h2>{RESULTS[result.key].name}</h2><div className="result-title">{result.title}</div><p className="result-quote">“{result.quote}”</p><p>{result.message}</p><div className="compat"><div><span>PLAYFUL COMPATIBILITY</span><b>{result.pct}%</b></div><div className="meter"><i style={{width:result.pct+"%"}}/></div><small>Entertainment only — generated from the names.</small></div><div className="actions"><button className="share-primary" onClick={()=>{setShareNotice("");setShareOpen(true)}}>Share result ↗</button><button onClick={download}>{downloaded?"Downloaded ✓":"Download card ↓"}</button><button onClick={copy}>{copied?"Copied ✓":"Copy result"}</button></div></div><p className="disclaimer">FLAMES is a classic name game, not a real measure of relationship compatibility.</p></div>}
  </section>
  {shareOpen&&<div className="share-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setShareOpen(false)}}><div className="share-modal" role="dialog" aria-modal="true" aria-labelledby="auth-play-share-title"><button className="share-close" type="button" aria-label="Close share options" onClick={()=>setShareOpen(false)}>×</button><div className="share-kicker">YOUR RESULT IS READY</div><h2 id="auth-play-share-title">Share your FLAMES result</h2><p className="share-sub">Send the card directly, or choose a platform.</p><button className="share-card-btn" type="button" onClick={shareCard}>↗ <span>Share result card</span><small>Choose an app on your device</small></button><div className="share-divider"><span>or choose a platform</span></div><div className="platform-grid"><button type="button" onClick={()=>shareTo("x")}><b>𝕏</b><span>X</span></button><button type="button" onClick={()=>shareTo("instagram")}><b>◎</b><span>Instagram</span></button><button type="button" onClick={()=>shareTo("whatsapp")}><b>◔</b><span>WhatsApp</span></button><button type="button" onClick={()=>shareTo("facebook")}><b>f</b><span>Facebook</span></button><button type="button" onClick={()=>shareTo("threads")}><b>@</b><span>Threads</span></button><button type="button" onClick={()=>shareTo("reddit")}><b>●</b><span>Reddit</span></button><button type="button" onClick={()=>shareTo("discord")}><b>◌</b><span>Discord</span></button></div>{shareNotice&&<div className="share-notice">{shareNotice}</div>}<button type="button" className="share-copy-link" onClick={copy}>{copied?"Result copied ✓":"Copy result text"}</button><p className="share-footnote">The result card can be shared to supported apps or downloaded on desktop.</p></div></div>}
  </div></Shell>;
}

function Home({profile,streak,matches}){
  const first=(profile?.display_name||"Friend").split(" ")[0],latest=matches[0],quote=QUOTES[(new Date().getDate()+matches.length)%QUOTES.length];
  return <Shell profile={profile} streak={streak} view="home"><div className="sa-home"><section className="sa-welcome"><div><span className="sa-kicker">WELCOME BACK</span><h1>Hey {first}.</h1><p>{quote}</p></div><span className="sa-fire-mini">🔥 {streak||0}</span></section><section className="sa-hero-card"><div className="sa-hero-flame">🔥</div><span className="sa-kicker">READY?</span><h2>Let's see what FLAMES says.</h2><p>No overthinking. Just put in two names.</p><button className="sa-primary sa-hero-button" onClick={()=>go("/app/play")}><Icon name="play"/> Play FLAMES</button></section><div className="sa-quick-actions"><button onClick={()=>go("/app/create")}><Icon name="plus" size={15}/><span>Ask a question</span></button><button onClick={()=>go("/app/circle")}><Icon name="users" size={15}/><span>Private Circle</span></button><button onClick={()=>go("/app/profile")}><Avatar profile={profile} size="xs"/><span>Profile</span></button></div><section className="sa-recent"><div className="sa-section-title"><span className="sa-kicker">RECENT</span><h3>Latest FLAMES</h3></div>{latest?<div className="sa-latest"><div className={"sa-letter-result result-"+String(latest.result_key).toLowerCase()}>{latest.result_key}</div><div><strong>{latest.name_a} × {latest.name_b}</strong><span>{RESULTS[latest.result_key]?.name} · {latest.percent}%</span><small>{timeAgo(latest.created_at)}</small></div></div>:<div className="sa-empty"><span>✦</span><p>Your first result will live here.</p><button onClick={()=>go("/app/play")}>Play now <Icon name="arrow" size={14}/></button></div>}</section></div></Shell>;
}

function CreatePage({profile,streak,user}){
  const [category,setCategory]=useState("Fun"),[question,setQuestion]=useState(""),[options,setOptions]=useState(["",""]),[busy,setBusy]=useState(false),[error,setError]=useState(""),[link,setLink]=useState("");
  const [selectedTemplate,setSelectedTemplate]=useState("");
  const applyTemplate=(item)=>{setQuestion(item[0]);setOptions(item[1].slice(0,4));setSelectedTemplate(item[0]);setError("")};
  const randomTemplate=()=>{const pool=QUESTION_TEMPLATES[category]||QUESTION_TEMPLATES.Fun;applyTemplate(pool[Math.floor(Math.random()*pool.length)])};
  const updateOption=(index,value)=>setOptions(xs=>xs.map((v,i)=>i===index?value:v));
  const addOption=()=>setOptions(xs=>xs.length<4?[...xs,""]:xs);
  const removeOption=(index)=>setOptions(xs=>xs.length>2?xs.filter((_,i)=>i!==index):xs);
  const create=async e=>{
    e.preventDefault();setError("");
    const q=question.trim(),opts=options.map(x=>x.trim()).filter(Boolean);
    if(!user?.id){setError("Please log in again before creating a question.");return}
    if(q.length<3){setError("Give your question a little more detail.");return}
    if(opts.length<2){setError("Add at least two choices.");return}
    setBusy(true);
    try{
      const title=q.length>45?q.slice(0,45).trim()+"…":q;
      const id=crypto.randomUUID();
      const r=await supabase.from("flames_games").insert({
        id,creator_id:user.id,kind:"poll",title,prompt:q,options:opts,answer_value:null
      });
      if(r.error){
        setError(r.error.message||"Could not create the question.");
        return;
      }
      setLink(location.origin+"/game/"+id); await recordMeaningfulActivity(); window.dispatchEvent(new Event("flames:data-change"));
    }catch(err){
      setError(err?.message||"We couldn't create the question. Check your connection and try again.");
    }finally{setBusy(false)}
  };
  if(link)return <Shell profile={profile} streak={streak} view="create"><div className="create-studio-wrap"><section className="create-studio success"><div className="create-success-orbit"><span>✦</span><span>F</span><span>L</span><span>A</span><span>M</span><span>E</span></div><span className="sa-kicker">LIVE</span><h1>Your question is out.</h1><p>Send the link to your people and see what they say.</p><div className="create-share-line"><span>{link}</span><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(link)}catch{}}}>Copy</button></div><div className="create-success-actions"><button className="sa-primary" type="button" onClick={async()=>{try{await navigator.clipboard.writeText(link)}catch{}}}>Copy link <Icon name="arrow"/></button><button type="button" className="create-ghost-button" onClick={()=>{setLink("");setQuestion("");setOptions(["",""]);setSelectedTemplate("")}}>Create another</button></div></section></div></Shell>;
  const previewQuestion=question.trim()||"Who should choose the movie tonight?";
  const previewOptions=options.map(x=>x.trim()).filter(Boolean);
  return <Shell profile={profile} streak={streak} view="create"><div className="create-studio-wrap"><section className="create-studio">
    <div className="create-studio-head"><div><span className="sa-kicker">CREATE</span><h1>Ask something people <em>actually want</em> to answer.</h1><p>Pick a starter, make it yours, send the link.</p></div><button type="button" className="create-surprise" onClick={randomTemplate}><span>✦</span> Surprise me</button></div>

    <div className="create-starters">
      <div className="create-starters-top"><span>START WITH A VIBE</span><small>tap one to fill it in</small></div>
      <div className="create-category-row">{Object.keys(QUESTION_TEMPLATES).map(c=><button type="button" key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}</div>
      <div className="create-template-row">{QUESTION_TEMPLATES[category].map((item,i)=><button type="button" key={i} className={selectedTemplate===item[0]?"selected":""} onClick={()=>applyTemplate(item)}><span>{item[0]}</span><Icon name="arrow" size={14}/></button>)}</div>
    </div>

    <form className="create-editor" onSubmit={create}>
      <div className="create-editor-main">
        <div className="create-field-title"><span>YOUR QUESTION</span><small>{question.length}/500</small></div>
        <textarea rows={4} maxLength={500} value={question} onChange={e=>{setQuestion(e.target.value);setSelectedTemplate("")}} placeholder="Who should choose the movie tonight?"/>
        <div className="create-choices-head"><div><span>CHOICES</span><small>Keep it to 2–4</small></div><button type="button" onClick={addOption} disabled={options.length>=4}>+ Add choice</button></div>
        <div className="create-choice-list">{options.map((x,i)=><div className="create-choice-row" key={i}><span className="create-choice-number">{i+1}</span><input value={x} onChange={e=>updateOption(i,e.target.value)} placeholder={["Me","You","Both","Neither 😂"][i]||("Choice "+(i+1))}/>{options.length>2&&<button type="button" aria-label={"Remove choice "+(i+1)} onClick={()=>removeOption(i)}>×</button>}</div>)}</div>
        {error&&<div className="sa-error">{error}</div>}
        <div className="create-editor-foot"><span><Icon name="users" size={14}/> Private question link</span><button className="sa-primary create-submit" disabled={busy}>{busy?"Publishing…":"Create question"} <Icon name="arrow"/></button></div>
      </div>

      <aside className="create-preview" aria-label="Question preview">
        <div className="create-preview-top"><span>PREVIEW</span><i>LIVE</i></div>
        <div className="create-preview-flame"><Flame/></div>
        <small>FLAMES QUESTION</small>
        <h2>{previewQuestion}</h2>
        <div className="create-preview-options">{(previewOptions.length?previewOptions:["Your first choice","Your second choice"]).map((o,i)=><div key={i}><span>{i+1}</span>{o}</div>)}</div>
        <p>Friends can answer from the link. A FLAMES account is required to submit.</p>
      </aside>
    </form>
  </section></div></Shell>;
}
function ResultsHub({profile,streak}){return <Shell profile={profile} streak={streak} view="results"><div className="sa-secondary results-hub"><span className="sa-kicker">RESULTS</span><h1>Your FLAMES world.</h1><p className="sa-secondary-sub">Keep each part separate. Pick what you want to check.</p><div className="results-menu"><button onClick={()=>go("/app/results/my-results")}><span className="results-menu-icon"><Icon name="results"/></span><span><strong>My Results</strong><small>Your saved FLAMES matches and personal history.</small></span><Icon name="arrow"/></button><button onClick={()=>go("/app/results/my-questions")}><span className="results-menu-icon"><Icon name="users"/></span><span><strong>My Questions</strong><small>Questions you created and the people who answered.</small></span><Icon name="arrow"/></button><button onClick={()=>go("/app/results/streaks")}><span className="results-menu-icon"><Icon name="trophy"/></span><span><strong>Streaks Board</strong><small>Your streak and the FLAMES leaderboard.</small></span><Icon name="arrow"/></button></div></div></Shell>}

function MyResultsPage({profile,streak,matches}){return <Shell profile={profile} streak={streak} view="results"><div className="sa-secondary"><button className="results-back" onClick={()=>go("/app/results")}><Icon name="back"/> Results</button><span className="sa-kicker">MY RESULTS</span><h1>Your latest plays.</h1><div className="sa-list">{matches.length?matches.map(m=><div className="sa-list-item" key={m.id}><div className={"sa-letter-result result-"+String(m.result_key).toLowerCase()}>{m.result_key}</div><div><strong>{m.name_a} × {m.name_b}</strong><span>{RESULTS[m.result_key]?.name} · {m.percent}%</span><small>{timeAgo(m.created_at)}</small></div></div>):<div className="sa-empty">No saved results yet. Play a match and it will appear here.</div>}</div></div></Shell>}

function MyQuestionsPage({profile,streak,user}){const [games,setGames]=useState([]),[busy,setBusy]=useState(true);useEffect(()=>{(async()=>{const r=await supabase.from("flames_games").select("id,title,prompt,created_at").eq("creator_id",user.id).order("created_at",{ascending:false});setGames(r.data||[]);setBusy(false)})()},[user.id]);return <Shell profile={profile} streak={streak} view="results"><div className="sa-secondary"><button className="results-back" onClick={()=>go("/app/results")}><Icon name="back"/> Results</button><span className="sa-kicker">MY QUESTIONS</span><h1>Questions you asked.</h1><p className="sa-secondary-sub">Open one to see every answer and who gave it.</p><div className="question-results-list">{busy?<div className="sa-empty">Loading questions…</div>:games.length?games.map(g=><button className="question-result-card" key={g.id} onClick={()=>go("/app/results/question/"+g.id)}><span className="question-result-icon"><Icon name="users"/></span><span><strong>{g.title}</strong><small>{g.prompt}</small></span><Icon name="arrow"/></button>):<div className="sa-empty">You have not created a question yet.</div>}</div></div></Shell>}

function QuestionResultsPage({profile,streak,user,id}){const [game,setGame]=useState(null),[responses,setResponses]=useState([]),[busy,setBusy]=useState(true);useLiveRefresh(4000);
  useEffect(()=>{(async()=>{const g=await supabase.from("flames_games").select("id,title,prompt,options,created_at").eq("id",id).eq("creator_id",user.id).single();const r=await supabase.from("flames_game_responses").select("id,answer,created_at,respondent_id").eq("game_id",id).order("created_at",{ascending:false});setGame(g.data||null);const rows=r.data||[];const ids=[...new Set(rows.map(x=>x.respondent_id).filter(Boolean))];let profiles=[];if(ids.length){const p=await supabase.from("flames_profiles").select("id,username,display_name,avatar_id").in("id",ids);profiles=p.data||[]}const by=new Map(profiles.map(p=>[p.id,p]));setResponses(rows.map(x=>({...x,profile:by.get(x.respondent_id)||null})));setBusy(false)})()},[id,user.id]);useEffect(()=>{if(!game)return;const run=async()=>{const r=await supabase.from("flames_game_responses").select("id,answer,created_at,respondent_id").eq("game_id",id).order("created_at",{ascending:false});const rows=r.data||[];const ids=[...new Set(rows.map(x=>x.respondent_id).filter(Boolean))];let profiles=[];if(ids.length){const p=await supabase.from("flames_profiles").select("id,username,display_name,avatar_id").in("id",ids);profiles=p.data||[]}const by=new Map(profiles.map(p=>[p.id,p]));setResponses(rows.map(x=>({...x,profile:by.get(x.respondent_id)||null}))) };run()},[id]);const total=responses.length;return <Shell profile={profile} streak={streak} view="results"><div className="sa-secondary"><button className="results-back" onClick={()=>go("/app/results/my-questions")}><Icon name="back"/> My Questions</button>{busy?<div className="sa-empty">Loading results…</div>:!game?<div className="sa-empty">Question not found.</div>:<><span className="sa-kicker">QUESTION RESULTS</span><h1>{game.title}</h1><p className="sa-secondary-sub">{total} {total===1?"person":"people"} answered.</p><div className="answer-breakdown">{(game.options||[]).map(o=>{const count=responses.filter(r=>r.answer===o).length;const pct=total?Math.round(count/total*100):0;return <div className="answer-breakdown-row" key={o}><div><strong>{o}</strong><span>{pct}%</span></div><i><b style={{width:pct+"%"}}/></i></div>})}</div><h2 className="responders-title">People who answered</h2><div className="responders-list">{responses.length?responses.map(r=><button key={r.id} className="responder-card" onClick={()=>r.respondent_id&&go("/app/results/responder/"+r.respondent_id+"/"+id)}><Avatar profile={r.profile||{display_name:"FLAMES Friend"}} size="sm"/><span><strong>{r.profile?("@"+(r.profile.username||"flames")):"Anonymous"}</strong><small>{r.answer} · {timeAgo(r.created_at)}</small></span><Icon name="arrow"/></button>):<div className="sa-empty">No answers yet.</div>}</div></>}</div></Shell>}

function ResponderPage({profile,streak,respondentId,gameId}){const [p,setP]=useState(null),[answer,setAnswer]=useState(null);useEffect(()=>{(async()=>{const [pr,rr]=await Promise.all([supabase.from("flames_profiles").select("id,username,display_name,avatar_id,streak_count").eq("id",respondentId).single(),supabase.from("flames_game_responses").select("answer,created_at").eq("game_id",gameId).eq("respondent_id",respondentId).order("created_at",{ascending:false}).limit(1).single()]);setP(pr.data||null);setAnswer(rr.data||null)})()},[respondentId,gameId]);return <Shell profile={profile} streak={streak} view="results"><div className="sa-secondary responder-page"><button className="results-back" onClick={()=>go("/app/results/question/"+gameId)}><Icon name="back"/> Question results</button>{p?<section className="responder-profile-card"><Avatar profile={p} size="xl"/><span className="sa-kicker">FLAMES PROFILE</span><h1>{p.display_name}</h1><p>@{p.username||"flames"}</p><div className="responder-answer"><span>ANSWERED</span><strong>{answer?.answer||"—"}</strong><small>{answer?.created_at?timeAgo(answer.created_at):""}</small></div></section>:<div className="sa-empty">Profile not found.</div>}</div></Shell>}


async function recordMeaningfulActivity(){
  try{
    const r=await supabase.rpc("flames_record_activity",{});
    if(r?.data?.[0]){
      window.dispatchEvent(new CustomEvent("flames:activity",{detail:r.data[0]}));
      window.dispatchEvent(new Event("flames:data-change"));
    }
    return r;
  }catch{return {error:{message:"activity failed"}}}
}
async function syncAwards(user,profile,matches){
  if(!user)return;
  const streak=profile?.streak_count||0;
  const {data:games}=await supabase.from("flames_games").select("id").eq("creator_id",user.id);
  const {data:responses}=await supabase.from("flames_game_responses").select("id").eq("respondent_id",user.id);
  const gameCount=games?.length||0, responseCount=responses?.length||0, matchCount=matches?.length||0;
  const keys=[];
  if(matchCount>=1)keys.push("first_flame");
  if(matchCount>=5)keys.push("five_matches");
  if(matchCount>=25)keys.push("twentyfive_matches");
  if(matchCount>=100)keys.push("hundred_matches");
  if(gameCount>=1)keys.push("question_starter");
  if(gameCount>=5)keys.push("five_questions");
  if(gameCount>=25)keys.push("twentyfive_questions");
  if(responseCount>=100)keys.push("answers_100");
  if(streak>=3)keys.push("streak_3");
  if(streak>=7)keys.push("streak_7");
  if(streak>=14)keys.push("streak_14");
  if(streak>=30)keys.push("streak_30");
  if(streak>=100)keys.push("streak_100");
  for(const award_key of keys)await supabase.from("flames_awards").insert({user_id:user.id,award_key});
}
const AWARDS={
 first_flame:["First Flame","Your first FLAMES match."],five_matches:["Getting Started","Complete 5 matches."],twentyfive_matches:["Regular","Complete 25 matches."],hundred_matches:["FLAMES Addict","Complete 100 matches."],
 question_starter:["Question Starter","Create your first question."],five_questions:["Curious Mind","Create 5 questions."],twentyfive_questions:["Question Machine","Create 25 questions."],answers_100:["People Are Listening","Get 100 answers."],
 streak_3:["Getting Warm","Keep a 3-day streak."],streak_7:["On Fire","Keep a 7-day streak."],streak_14:["Unstoppable","Keep a 14-day streak."],streak_30:["FLAMES Veteran","Keep a 30-day streak."],streak_100:["Legend","Keep a 100-day streak."],
 friends_energy:["Bestie Energy","Get Friends 10 times."],romcom_energy:["Rom-Com Energy","Get Lovers 10 times."],chaos_energy:["Chaos Energy","Collect the chaotic results."]
};
function NotificationsBell({user}){
 const [items,setItems]=useState([]),[open,setOpen]=useState(false);
 useLiveRefresh(4000);
 const load=async()=>{const r=await supabase.from("flames_notifications").select("*").eq("recipient_id",user.id).order("created_at",{ascending:false}).limit(20);setItems(r.data||[])};
 useEffect(()=>{load()},[user.id]);
 const unread=items.filter(x=>!x.read_at).length;
 const view=async n=>{await supabase.from("flames_notifications").update({read_at:new Date().toISOString()}).eq("id",n.id);go(n.link_path);setOpen(false);setItems(items.map(x=>x.id===n.id?{...x,read_at:new Date().toISOString()}:x))};
 return <div className="sa-notification-wrap"><button className="sa-notification-button" aria-label="Notifications" onClick={()=>setOpen(v=>!v)}><Icon name="bell" size={18}/>{unread>0&&<b>{unread>9?"9+":unread}</b>}</button>{open&&<div className="sa-notification-panel"><div className="sa-notification-head"><strong>Notifications</strong><small>{unread?unread+" new":"You're all caught up"}</small></div>{items.length?items.slice(0,8).map(n=><div className={"sa-notification "+(!n.read_at?"unread":"")} key={n.id}><div><strong>{n.title}</strong><p>{n.body}</p><small>{timeAgo(n.created_at)}</small></div><button onClick={()=>view(n)}>View <Icon name="arrow" size={13}/></button></div>):<div className="sa-notification-empty"><Icon name="spark"/><span>No important updates yet.</span></div>}</div>}</div>;
}
function AwardsPage({profile,streak,matches,user}){
 const [awards,setAwards]=useState([]);
 useEffect(()=>{(async()=>{await syncAwards(user,profile,matches);const r=await supabase.from("flames_awards").select("*").eq("user_id",user.id).order("unlocked_at",{ascending:false});setAwards(r.data||[])})()},[user.id,profile?.streak_count,matches.length]);
 const unlocked=new Set(awards.map(x=>x.award_key));
 return <Shell profile={profile} streak={streak} view="profile"><div className="sa-secondary awards-page"><button className="results-back" onClick={()=>go("/app/profile")}><Icon name="back"/> Profile</button><span className="sa-kicker">AWARDS</span><h1>Your collection.</h1><p className="sa-secondary-sub">No rewards locked behind a paywall. Just things you earned.</p><div className="award-grid">{Object.entries(AWARDS).map(([key,[title,desc]])=><div className={"award-card "+(unlocked.has(key)?"unlocked":"locked")} key={key}><span className="award-icon">{unlocked.has(key)?"✦":"?"}</span><div><strong>{title}</strong><small>{desc}</small></div>{unlocked.has(key)&&<b>UNLOCKED</b>}</div>)}</div></div></Shell>;
}
function StreaksPage({profile,streak,user}){
 const [board,setBoard]=useState([]),[opt,setOpt]=useState(!!profile?.show_on_streak_board);
 useEffect(()=>{(async()=>{const r=await supabase.from("flames_streak_board").select("id,username,display_name,avatar_id,streak_count,longest_streak").limit(50);setBoard(r.data||[])})()},[opt]);
 const toggle=async()=>{const next=!opt;setOpt(next);await supabase.from("flames_profiles").update({show_on_streak_board:next}).eq("id",user.id)};
 return <Shell profile={profile} streak={streak} view="results"><div className="sa-secondary streak-page"><button className="results-back" onClick={()=>go("/app/results")}><Icon name="back"/> Results</button><span className="sa-kicker">STREAKS BOARD</span><h1>Keep the fire alive.</h1><section className="streak-hero"><div className="streak-fire">🔥</div><strong>{streak||0}</strong><span>day streak</span><small>Longest: {profile?.longest_streak||streak||0} days</small></section><div className="streak-toggle"><span><strong>Show me on the board</strong><small>Only your FLAMES username and streak are shown.</small></span><button onClick={toggle} className={opt?"on":""}><i/></button></div><div className="streak-tabs"><span>ALL-TIME</span></div><div className="streak-board">{board.map((p,i)=><div className={"streak-row "+(p.id===user.id?"you":"")} key={p.id}><b>#{i+1}</b><Avatar profile={p} size="sm"/><span><strong>@{p.username||"flames"}</strong><small>{p.id===user.id?"You":p.display_name}</small></span><strong>🔥 {p.streak_count}</strong></div>)}</div></div></Shell>;
}
function ProfilePage({profile,streak,matches}){
  const logout=async()=>{await signOut();window.location.replace("/")};
  return <Shell profile={profile} streak={streak} view="profile"><div className="sa-profile"><section className="sa-profile-card"><Avatar profile={profile} size="xl"/><span className="sa-kicker">YOUR FLAMES</span><h1>{profile?.display_name||"FLAMES Friend"}</h1><p>@{profile?.username||"flames"}</p><div className="sa-profile-stats"><div><strong>{matches.length}</strong><span>matches</span></div><div><strong>{streak||0}</strong><span>day streak</span></div></div></section><section className="sa-profile-list"><button onClick={()=>go("/app/history")}><Icon name="clock"/><span>Recent matches</span><Icon name="arrow"/></button><button onClick={()=>go("/app/circle")}><Icon name="users"/><span>Private Circle</span><Icon name="arrow"/></button><button onClick={()=>go("/app/achievements")}><Icon name="spark"/><span>Achievements</span><Icon name="arrow"/></button><button onClick={()=>go("/app/settings")}><Icon name="settings"/><span>Settings</span><Icon name="arrow"/></button><button className="danger" onClick={logout}><Icon name="back"/><span>Log out</span></button></section></div></Shell>;
}

function HistoryPage({profile,streak,matches}){  return <Shell profile={profile} streak={streak} view="profile"><div className="sa-secondary"><span className="sa-kicker">RECENT MATCHES</span><h1>Your latest plays.</h1><div className="sa-list">{matches.length?matches.map(m=><div className="sa-list-item" key={m.id}><div className={"sa-letter-result result-"+String(m.result_key).toLowerCase()}>{m.result_key}</div><div><strong>{m.name_a} × {m.name_b}</strong><span>{RESULTS[m.result_key]?.name} · {m.percent}%</span><small>{timeAgo(m.created_at)}</small></div></div>):<div className="sa-empty">Nothing here yet.</div>}</div></div></Shell>;
}
function AchievementsPage({profile,streak,matches,user}){return <Shell profile={profile} streak={streak} view="profile"><div className="sa-secondary"><span className="sa-kicker">ACHIEVEMENTS</span><h1>Earned, not bought.</h1><p className="sa-secondary-sub">Streaks, matches and questions can unlock permanent awards.</p><button className="sa-primary" onClick={()=>go("/app/awards")}>View all awards <Icon name="arrow"/></button></div></Shell>}
function SettingsPage({profile,streak}){return <Shell profile={profile} streak={streak} view="profile"><div className="sa-secondary"><span className="sa-kicker">SETTINGS</span><h1>Keep it simple.</h1><p className="sa-secondary-sub">Your account is ready to play.</p><div className="sa-settings-card"><Avatar profile={profile} size="lg"/><div><strong>{profile?.display_name||"FLAMES Friend"}</strong><span>@{profile?.username||"flames"}</span></div></div></div></Shell>}

function CirclePage({profile,streak,user}){
  useLiveRefresh(5000);
  const [query,setQuery]=useState(""),[results,setResults]=useState([]),[people,setPeople]=useState([]),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
  const loadCircle=async()=>{
    const r=await supabase.from("flames_connections").select("requester_id,addressee_id,status").or("requester_id.eq."+user.id+",addressee_id.eq."+user.id).eq("status","accepted");
    const ids=(r.data||[]).map(x=>x.requester_id===user.id?x.addressee_id:x.requester_id);
    if(ids.length){const p=await supabase.from("flames_profiles").select("id,username,display_name,avatar_id,streak_count").in("id",ids);setPeople(p.data||[])}else setPeople([]);
  };
  useEffect(()=>{loadCircle()},[user.id]);
  const search=async e=>{e.preventDefault();const q=query.trim().toLowerCase();if(q.length<2){setResults([]);return}setBusy(true);const r=await supabase.from("flames_profiles").select("id,username,display_name,avatar_id,streak_count").ilike("username",q+"%").limit(6);setBusy(false);setResults((r.data||[]).filter(x=>x.id!==user.id))};
  const add=async p=>{setNotice("");const r=await supabase.from("flames_connections").insert({requester_id:user.id,addressee_id:p.id,status:"pending"});setNotice(r.error?(r.error.message||"Request could not be sent."):"Request sent.");if(!r.error){setResults([]);window.dispatchEvent(new Event("flames:data-change"))}};
  return <Shell profile={profile} streak={streak} view="profile"><div className="sa-secondary circle-page"><span className="sa-kicker">Pfunction PublicQuestion({id}){
  const [game,setGame]=useState(null),[creator,setCreator]=useState(null),[answer,setAnswer]=useState(""),[done,setDone]=useState(false),[error,setError]=useState(""),[authChecked,setAuthChecked]=useState(false),[user,setUser]=useState(null);
  useEffect(()=>{(async()=>{const r=await supabase.auth.getUser();setUser(r.data?.user||null);setAuthChecked(true)})()},[]);
  useEffect(()=>{(async()=>{
    try{
      const r=await fetch("https://lbkhadjmkwtrbzwkuhyn.supabase.co/rest/v1/flames_public_questions?id=eq."+encodeURIComponent(id)+"&select=id,title,prompt,options,creator_username,creator_display_name,creator_avatar_id&limit=1",{
        headers:{apikey:"sb_publishable_NQ17m1yFOZf-6Yg69U3kWQ_yOzFgKkK",Accept:"application/json"}
      });
      const rows=await r.json().catch(()=>[]);
      if(!r.ok||!rows?.length)setError("This question is no longer available.");
      else {setGame(rows[0]);setCreator({username:rows[0].creator_username,display_name:rows[0].creator_display_name,avatar_id:rows[0].creator_avatar_id});}
    }catch{setError("We couldn't open this question. Please try again.")}
  })()},[id]);
  const submit=async()=>{
    if(!answer.trim())return;
    if(!user?.id){go("/register?returnTo="+encodeURIComponent("/game/"+id));return}
    const r=await supabase.from("flames_game_responses").insert({game_id:id,answer:answer.trim(),respondent_id:user.id});
    if(r.error)setError("Could not send your answer.");
    else {await recordMeaningfulActivity();setDone(true)}
  };
  if(error)return <main className="sa-public-question"><a className="sa-auth-brand" href="/"><span className="sa-logo"><span>F</span></span>FLAMES</a><section className="sa-question-card"><h1>Oops.</h1><p>{error}</p><a className="sa-primary sa-button-link" href="/">Play FLAMES</a></section></main>;
  if(!authChecked)return <main className="sa-public-question"><section className="sa-question-card"><div className="sa-loading-flame">🔥</div><p>Opening…</p></section></main>;
  if(done)return <main className="sa-public-question"><a className="sa-auth-brand" href="/"><span className="sa-logo"><span>F</span></span>FLAMES</a><section className="sa-question-card"><div className="sa-success-check">✓</div><span className="sa-kicker">SENT</span><h1>Nice.</h1><p>Your answer is in.</p><a className="sa-primary sa-button-link" href="/">Play FLAMES <Icon name="arrow"/></a></section></main>;
  return <main className="sa-public-question"><a className="sa-auth-brand" href="/"><span className="sa-logo"><span>F</span></span>FLAMES</a><section className="sa-question-card"><div className="public-question-creator"><Avatar profile={creator} size="md"/><span><small>QUESTION FROM</small><strong>{creator?.display_name}</strong><b>@{creator?.username||"flames"}</b></span></div><span className="sa-kicker">{String(game.kind||"poll").toUpperCase()}</span><h1>{game.title}</h1><p className="sa-question-text">{game.prompt}</p><div className="sa-public-options">{(game.options||[]).map(o=><button className={answer===o?"selected":""} key={o} onClick={()=>setAnswer(o)}>{o}</button>)}</div>{!user&&<div className="sa-login-required"><strong>One quick step before you answer.</strong><span>Create your free FLAMES account and we'll bring you straight back here.</span><button type="button" onClick={()=>go("/register?returnTo="+encodeURIComponent("/game/"+id))}>Create account <Icon name="arrow" size={13}/></button><small>Already have an account? <a href={"/login?returnTo="+encodeURIComponent("/game/"+id)}>Log in</a></small></div>}{error&&<div className="sa-error">{error}</div>}<button className="sa-primary" disabled={!answer.trim()} onClick={submit}>Send answer <Icon name="arrow"/></button></section></main>;
}
le"><div className="sa-secondary circle-person-page"><button className="results-back" onClick={()=>go("/app/circle")}><Icon name="back"/> Private Circle</button><section className="circle-person-hero"><Avatar profile={person} size="lg"/><span className="sa-kicker">IN YOUR CIRCLE</span><h1>{person.display_name}</h1><p>@{person.username}</p><div className="circle-person-stats"><span><b>🔥 {person.streak_count||0}</b><small>current streak</small></span><span><b>🔥 {person.longest_streak||person.streak_count||0}</b><small>longest streak</small></span><span><b>{questions.length}</b><small>questions</small></span></div></section><section className="circle-detail-section"><div className="circle-section-title"><span>THEIR QUESTIONS</span><small>{questions.length}</small></div>{questions.length?<div className="circle-question-list">{questions.map(q=><button className="circle-question-card" key={q.id} onClick={()=>go("/app/results/question/"+q.id)}><span className="circle-question-mark">?</span><span><strong>{q.title||q.prompt}</strong><small>{q.prompt}</small></span><Icon name="arrow" size={14}/></button>)}</div>:<div className="sa-empty compact"><p>No questions yet.</p></div>}</section><section className="circle-detail-section"><div className="circle-section-title"><span>THEIR ANSWERS TO YOU</span><small>{theirAnswers.length}</small></div>{theirAnswers.length?<div className="circle-answer-list">{theirAnswers.map(a=><div className="circle-answer-card" key={a.id}><span className="circle-answer-kicker">YOUR QUESTION</span><strong>{a.title}</strong><b>{a.answer}</b><small>{timeAgo(a.created_at)}</small></div>)}</div>:<div className="sa-empty compact"><p>They haven't answered one of your questions yet.</p></div>}</section></div></Shell>;
}


function PublicQuestion({id}){
  const [game,setGame]=useState(null),[creator,setCreator]=useState(null),[answer,setAnswer]=useState(""),[done,setDone]=useState(false),[error,setError]=useState("");
  useEffect(()=>{(async()=>{
    try{
      const r=await fetch("https://lbkhadjmkwtrbzwkuhyn.supabase.co/rest/v1/flames_public_questions?id=eq."+encodeURIComponent(id)+"&select=id,title,prompt,options,creator_username,creator_display_name,creator_avatar_id&limit=1",{
        headers:{apikey:"sb_publishable_NQ17m1yFOZf-6Yg69U3kWQ_yOzFgKkK",Accept:"application/json"}
      });
      const rows=await r.json().catch(()=>[]);
      if(!r.ok||!rows?.length)setError("This question is no longer available.");
      else {setGame(rows[0]);setCreator({username:rows[0].creator_username,display_name:rows[0].creator_display_name,avatar_id:rows[0].creator_avatar_id});}
    }catch{setError("We couldn't open this question. Please try again.")}
  })()},[id]);
  const submit=async()=>{if(!answer.trim())return;const r=await supabase.from("flames_game_responses").insert({game_id:id,answer:answer.trim(),respondent_id:(await supabase.auth.getUser()).data?.user?.id||null});if(r.error)setError("Could not send your answer.");else {if((await supabase.auth.getUser()).data?.user)await recordMeaningfulActivity();setDone(true)}};
  if(error)return <main className="sa-public-question"><a className="sa-auth-brand" href="/"><span className="sa-logo"><span>F</span></span>FLAMES</a><section className="sa-question-card"><h1>Oops.</h1><p>{error}</p><a className="sa-primary sa-button-link" href="/">Play FLAMES</a></section></main>;
  if(!game)return <main className="sa-public-question"><section className="sa-question-card"><div className="sa-loading-flame">🔥</div><p>Opening…</p></section></main>;
  if(done)return <main className="sa-public-question"><a className="sa-auth-brand" href="/"><span className="sa-logo"><span>F</span></span>FLAMES</a><section className="sa-question-card"><div className="sa-success-check">✓</div><span className="sa-kicker">SENT</span><h1>Nice.</h1><p>Your answer is in.</p><a className="sa-primary sa-button-link" href="/">Play FLAMES <Icon name="arrow"/></a></section></main>;
  return <main className="sa-public-question"><a className="sa-auth-brand" href="/"><span className="sa-logo"><span>F</span></span>FLAMES</a><section className="sa-question-card"><div className="public-question-creator"><Avatar profile={creator} size="md"/><span><small>QUESTION FROM</small><strong>{creator?.display_name}</strong><b>@{creator?.username||"flames"}</b></span></div><span className="sa-kicker">{String(game.kind||"poll").toUpperCase()}</span><h1>{game.title}</h1><p className="sa-question-text">{game.prompt}</p><div className="sa-public-options">{(game.options||[]).map(o=><button className={answer===o?"selected":""} key={o} onClick={()=>setAnswer(o)}>{o}</button>)}</div>{error&&<div className="sa-error">{error}</div>}<button className="sa-primary" disabled={!answer.trim()} onClick={submit}>Send answer <Icon name="arrow"/></button></section></main>;
}

export default function SimpleApp(){
  const [path,setPath]=useState(()=>location.pathname.replace(/\/$/,"")||"/");
  const [authReady,setAuthReady]=useState(false),[user,setUser]=useState(null),[profile,setProfile]=useState(null),[matches,setMatches]=useState([]),[streak,setStreak]=useState(0);
  useEffect(()=>{
    const onPop=()=>setPath(location.pathname.replace(/\/$/,"")||"/");
    const onActivity=async()=>{if(user){const a=await getAccount(user);setProfile(a.profile);setMatches(a.matches);setStreak(a.profile?.streak_count||0)}};
    window.addEventListener("flames:activity",onActivity);
    window.addEventListener("popstate",onPop);
    (async()=>{const r=await supabase.auth.getUser();const u=r.data?.user||null;setUser(u);if(u){const a=await getAccount(u);setProfile(a.profile);setMatches(a.matches);setStreak(a.profile?.streak_count||0)}setAuthReady(true)})();
    const {data:sub}=supabase.auth.onAuthStateChange(async(_,session)=>{const u=session?.user||null;setUser(u);if(u){const a=await getAccount(u);setProfile(a.profile);setMatches(a.matches);setStreak(a.profile?.streak_count||0)}else{setProfile(null);setMatches([]);setStreak(0)}});
    return()=>{window.removeEventListener("popstate",onPop);window.removeEventListener("flames:activity",onActivity);sub.subscription.unsubscribe()};
  },[]);
  useEffect(()=>{if(!authReady)return;const authPages=["/login","/register","/forgot-password","/reset-password"];const returnTo=new URLSearchParams(location.search).get("returnTo");if(user&&path==="/"){history.replaceState({}, "", "/app");setPath("/app")}else if(!user&&path.startsWith("/app")){history.replaceState({}, "", "/login");setPath("/login")}else if(user&&authPages.includes(path)){const target=returnTo&&returnTo.startsWith("/")?returnTo:"/app";history.replaceState({}, "", target);setPath(target)}},[authReady,user,path]);
  if(path==="/login")return <AuthPage mode="login"/>;
  if(path==="/register")return <AuthPage mode="register"/>;
  if(path==="/forgot-password"||path==="/reset-password")return <ResetPage/>;
  if(path.match(/^\/game\/[0-9a-f-]+$/i))return <PublicQuestion id={path.split("/")[2]}/>;
  if(!authReady)return <main className="sa-loading-screen"><div>🔥</div><span>Opening FLAMES…</span></main>;
  if(path.startsWith("/app")){
    if(path==="/app/play")return <GamePage profile={profile} streak={streak} user={user}/>;
    if(path==="/app/create")return <CreatePage profile={profile} streak={streak} user={user}/>;
    if(path==="/app/results")return <ResultsHub profile={profile} streak={streak}/>;
    if(path==="/app/results/my-results")return <MyResultsPage profile={profile} streak={streak} matches={matches}/>;
    if(path==="/app/results/my-questions")return <MyQuestionsPage profile={profile} streak={streak} user={user}/>;
    if(path.match(/^\/app\/results\/question\/[0-9a-f-]+$/i))return <QuestionResultsPage profile={profile} streak={streak} user={user} id={path.split("/")[4]}/>;
    if(path.match(/^\/app\/results\/responder\/[0-9a-f-]+\/[0-9a-f-]+$/i))return <ResponderPage profile={profile} streak={streak} respondentId={path.split("/")[4]} gameId={path.split("/")[5]}/>;
    if(path==="/app/profile")return <ProfilePage profile={profile} streak={streak} matches={matches} user={user}/>;
    if(path==="/app/history")return <HistoryPage profile={profile} streak={streak} matches={matches}/>;
    if(path==="/app/achievements")return <AchievementsPage profile={profile} streak={streak} matches={matches} user={user}/>;
    if(path==="/app/awards")return <AwardsPage profile={profile} streak={streak} matches={matches} user={user}/>;
    if(path==="/app/results/streaks")return <StreaksPage profile={profile} streak={streak} user={user}/>;
    if(path==="/app/settings")return <SettingsPage profile={profile} streak={streak}/>;
    if(path.match(/^\/app\/circle\/[0-9a-f-]+$/i))return <CirclePersonPage profile={profile} streak={streak} user={user} personId={path.split("/")[3]}/>;
    if(path==="/app/circle")return <CirclePage profile={profile} streak={streak} user={user}/>;
    return <Home profile={profile} streak={streak} matches={matches}/>;
  }
  return <main className="sa-public"><header className="sa-public-nav"><a className="sa-brand" href="/"><span className="sa-logo"><span>F</span></span><span>FLAMES</span></a><div><a href="/login">Log in</a><a className="sa-nav-cta" href="/register">Create account</a></div></header><section className="sa-public-hero"><span className="sa-kicker">JUST FOR FUN</span><h1>Two names.<br/><em>One FLAMES result.</em></h1><p>Put two names in. See what happens.</p><a className="sa-primary sa-hero-button" href="/login">Play FLAMES <Icon name="play"/></a><div className="sa-public-letters">{LETTERS.map(l=><span key={l}>{l}</span>)}</div></section><section className="sa-public-simple"><div><span className="sa-kicker">HOW IT WORKS</span><h2>Names in. Result out.</h2><p>Enter two names and let the classic elimination game do the rest.</p></div><div className="sa-public-results">{LETTERS.map(l=><div key={l}><b>{l}</b><strong>{RESULTS[l].name}</strong></div>)}</div></section><footer className="sa-public-footer">FLAMES · Just for fun.</footer></main>;

function PublicQuestion({id}){
  const [game,setGame]=useState(null),[creator,setCreator]=useState(null),[answer,setAnswer]=useState(""),[done,setDone]=useState(false),[error,setError]=useState("");
  useEffect(()=>{(async()=>{
    try{
      const r=await fetch("https://lbkhadjmkwtrbzwkuhyn.supabase.co/rest/v1/flames_public_questions?id=eq."+encodeURIComponent(id)+"&select=id,title,prompt,options,creator_username,creator_display_name,creator_avatar_id&limit=1",{
        headers:{apikey:"sb_publishable_NQ17m1yFOZf-6Yg69U3kWQ_yOzFgKkK",Accept:"application/json"}
      });
      const rows=await r.json().catch(()=>[]);
      if(!r.ok||!rows?.length)setError("This question is no longer available.");
      else {setGame(rows[0]);setCreator({username:rows[0].creator_username,display_name:rows[0].creator_display_name,avatar_id:rows[0].creator_avatar_id});}
    }catch{setError("We couldn't open this question. Please try again.")}
  })()},[id]);
  const submit=async()=>{if(!answer.trim())return;const r=await supabase.from("flames_game_responses").insert({game_id:id,answer:answer.trim(),respondent_id:(await supabase.auth.getUser()).data?.user?.id||null});if(r.error)setError("Could not send your answer.");else {if((await supabase.auth.getUser()).data?.user)await recordMeaningfulActivity();setDone(true)}};
  if(error)return <main className="sa-public-question"><a className="sa-auth-brand" href="/"><span className="sa-logo"><span>F</span></span>FLAMES</a><section className="sa-question-card"><h1>Oops.</h1><p>{error}</p><a className="sa-primary sa-button-link" href="/">Play FLAMES</a></section></main>;
  if(!game)return <main className="sa-public-question"><section className="sa-question-card"><div className="sa-loading-flame">🔥</div><p>Opening…</p></section></main>;
  if(done)return <main className="sa-public-question"><a className="sa-auth-brand" href="/"><span className="sa-logo"><span>F</span></span>FLAMES</a><section className="sa-question-card"><div className="sa-success-check">✓</div><span className="sa-kicker">SENT</span><h1>Nice.</h1><p>Your answer is in.</p><a className="sa-primary sa-button-link" href="/">Play FLAMES <Icon name="arrow"/></a></section></main>;
  return <main className="sa-public-question"><a className="sa-auth-brand" href="/"><span className="sa-logo"><span>F</span></span>FLAMES</a><section className="sa-question-card"><div className="public-question-creator"><Avatar profile={creator} size="md"/><span><small>QUESTION FROM</small><strong>{creator?.display_name}</strong><b>@{creator?.username||"flames"}</b></span></div><span className="sa-kicker">{String(game.kind||"poll").toUpperCase()}</span><h1>{game.title}</h1><p className="sa-question-text">{game.prompt}</p><div className="sa-public-options">{(game.options||[]).map(o=><button className={answer===o?"selected":""} key={o} onClick={()=>setAnswer(o)}>{o}</button>)}</div>{error&&<div className="sa-error">{error}</div>}<button className="sa-primary" disabled={!answer.trim()} onClick={submit}>Send answer <Icon name="arrow"/></button></section></main>;
}

export default function SimpleApp(){
  const [path,setPath]=useState(()=>location.pathname.replace(/\/$/,"")||"/");
  const [authReady,setAuthReady]=useState(false),[user,setUser]=useState(null),[profile,setProfile]=useState(null),[matches,setMatches]=useState([]),[streak,setStreak]=useState(0);
  useEffect(()=>{
    const onPop=()=>setPath(location.pathname.replace(/\/$/,"")||"/");
    const onActivity=async()=>{if(user){const a=await getAccount(user);setProfile(a.profile);setMatches(a.matches);setStreak(a.profile?.streak_count||0)}};
    window.addEventListener("flames:activity",onActivity);
    window.addEventListener("popstate",onPop);
    (async()=>{const r=await supabase.auth.getUser();const u=r.data?.user||null;setUser(u);if(u){const a=await getAccount(u);setProfile(a.profile);setMatches(a.matches);setStreak(a.profile?.streak_count||0)}setAuthReady(true)})();
    const {data:sub}=supabase.auth.onAuthStateChange(async(_,session)=>{const u=session?.user||null;setUser(u);if(u){const a=await getAccount(u);setProfile(a.profile);setMatches(a.matches);setStreak(a.profile?.streak_count||0)}else{setProfile(null);setMatches([]);setStreak(0)}});
    return()=>{window.removeEventListener("popstate",onPop);window.removeEventListener("flames:activity",onActivity);sub.subscription.unsubscribe()};
  },[]);
  useEffect(()=>{if(!authReady)return;const authPages=["/login","/register","/forgot-password","/reset-password"];const returnTo=new URLSearchParams(location.search).get("returnTo");if(user&&path==="/"){history.replaceState({}, "", "/app");setPath("/app")}else if(!user&&path.startsWith("/app")){history.replaceState({}, "", "/login");setPath("/login")}else if(user&&authPages.includes(path)){const target=returnTo&&returnTo.startsWith("/")?returnTo:"/app";history.replaceState({}, "", target);setPath(target)}},[authReady,user,path]);
  if(path==="/login")return <AuthPage mode="login"/>;
  if(path==="/register")return <AuthPage mode="register"/>;
  if(path==="/forgot-password"||path==="/reset-password")return <ResetPage/>;
  if(path.match(/^\/game\/[0-9a-f-]+$/i))return <PublicQuestion id={path.split("/")[2]}/>;
  if(!authReady)return <main className="sa-loading-screen"><div>🔥</div><span>Opening FLAMES…</span></main>;
  if(path.startsWith("/app")){
    if(path==="/app/play")return <GamePage profile={profile} streak={streak} user={user}/>;
    if(path==="/app/create")return <CreatePage profile={profile} streak={streak} user={user}/>;
    if(path==="/app/results")return <ResultsHub profile={profile} streak={streak}/>;
    if(path==="/app/results/my-results")return <MyResultsPage profile={profile} streak={streak} matches={matches}/>;
    if(path==="/app/results/my-questions")return <MyQuestionsPage profile={profile} streak={streak} user={user}/>;
    if(path.match(/^\/app\/results\/question\/[0-9a-f-]+$/i))return <QuestionResultsPage profile={profile} streak={streak} user={user} id={path.split("/")[4]}/>;
    if(path.match(/^\/app\/results\/responder\/[0-9a-f-]+\/[0-9a-f-]+$/i))return <ResponderPage profile={profile} streak={streak} respondentId={path.split("/")[4]} gameId={path.split("/")[5]}/>;
    if(path==="/app/profile")return <ProfilePage profile={profile} streak={streak} matches={matches} user={user}/>;
    if(path==="/app/history")return <HistoryPage profile={profile} streak={streak} matches={matches}/>;
    if(path==="/app/achievements")return <AchievementsPage profile={profile} streak={streak} matches={matches} user={user}/>;
    if(path==="/app/awards")return <AwardsPage profile={profile} streak={streak} matches={matches} user={user}/>;
    if(path==="/app/results/streaks")return <StreaksPage profile={profile} streak={streak} user={user}/>;
    if(path==="/app/settings")return <SettingsPage profile={profile} streak={streak}/>;
    if(path.match(/^\/app\/circle\/[0-9a-f-]+$/i))return <CirclePersonPage profile={profile} streak={streak} user={user} personId={path.split("/")[3]}/>;
    if(path==="/app/circle")return <CirclePage profile={profile} streak={streak} user={user}/>;
    return <Home profile={profile} streak={streak} matches={matches}/>;
  }
  return <main className="sa-public"><header className="sa-public-nav"><a className="sa-brand" href="/"><span className="sa-logo"><span>F</span></span><span>FLAMES</span></a><div><a href="/login">Log in</a><a className="sa-nav-cta" href="/register">Create account</a></div></header><section className="sa-public-hero"><span className="sa-kicker">JUST FOR FUN</span><h1>Two names.<br/><em>One FLAMES result.</em></h1><p>Put two names in. See what happens.</p><a className="sa-primary sa-hero-button" href="/login">Play FLAMES <Icon name="play"/></a><div className="sa-public-letters">{LETTERS.map(l=><span key={l}>{l}</span>)}</div></section><section className="sa-public-simple"><div><span className="sa-kicker">HOW IT WORKS</span><h2>Names in. Result out.</h2><p>Enter two names and let the classic elimination game do the rest.</p></div><div className="sa-public-results">{LETTERS.map(l=><div key={l}><b>{l}</b><strong>{RESULTS[l].name}</strong></div>)}</div></section><footer className="sa-public-footer">FLAMES · Just for fun.</footer></main>;
}