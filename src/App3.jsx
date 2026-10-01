import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { trackEvent } from "./analytics.js";
import { submitFeedback } from "./feedback.js";
import { supabase } from "./supabase.js";
import { signIn, signOut, signUp, requestPasswordReset, verifyRecoveryCode, updatePassword } from "./auth.js";

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


function AuthPage({type}){
  const isLogin=type==="login";
  const [name,setName]=useState(""),[username,setUsername]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[usernameState,setUsernameState]=useState("idle"),[usernameMessage,setUsernameMessage]=useState(""),[done,setDone]=useState(false);

  useEffect(()=>{
    if(isLogin){return}
    const q=username.trim().toLowerCase();
    if(!q){setUsernameState("idle");setUsernameMessage("");return}
    if(q.length<3){setUsernameState("error");setUsernameMessage("Username must be at least 3 characters.");return}
    let cancelled=false;
    const timer=setTimeout(async()=>{
      setUsernameState("checking");setUsernameMessage("Checking username…");
      const {data,error:e}=await supabase.from("flames_profiles").select("id").eq("username",q).limit(1);
      if(cancelled)return;
      if(e){setUsernameState("idle");setUsernameMessage("");return}
      if(data?.length){setUsernameState("error");setUsernameMessage("That username is already taken.");}
      else{setUsernameState("success");setUsernameMessage("Username is available.");}
    },300);
    return()=>{cancelled=true;clearTimeout(timer)}
  },[username,isLogin]);

  const submit=async e=>{
    e.preventDefault();setError("");
    if(!isLogin){
      if(!name.trim()){setError("Enter your full name.");return}
      if(usernameState!=="success"){setError("Choose an available username.");return}
    }
    if(!/^\S+@\S+\.\S+$/.test(email.trim())){setError("Enter a valid email address.");return}
    if(password.length<6){setError("Password must be at least 6 characters.");return}
    setBusy(true);
    const result=isLogin
      ? await signIn({email,password})
      : await signUp({email,password,displayName:name.trim(),username:username.trim().toLowerCase()});
    setBusy(false);
    if(result.error){setError(result.error.message||"Could not complete that request.");return}
    if(!isLogin&&!result.data?.session){
      setError("Account created, but email confirmation is still enabled. Disable Confirm email in Supabase to enter FLAMES immediately.");
      return;
    }
    if(isLogin){
      window.location.href="/app";
      return;
    }
    setDone(true);
  };

  if(done)return <main className="auth-page flames-page"><a className="auth-page-brand" href="/"><span className="brand-icon"><img src="/favicon.svg" alt="" /></span><span>FLAMES</span></a><section className="auth-page-card success-page"><div className="page-flame"><Flame/></div><small className="auth-kicker">ACCOUNT READY</small><h1>You're in.</h1><p>Your FLAMES account is connected. Your next matches can stay with you.</p><div className="page-benefits"><span>🔥 Save matches</span><span>⚡ Build your streak</span><span>✨ Keep your @identity</span></div><a className="auth-page-primary" href="/app">Open your FLAMES ↗</a></section></main>;

  return <main className="auth-page flames-page"><a className="auth-page-brand" href="/"><span className="brand-icon"><img src="/favicon.svg" alt="" /></span><span>FLAMES</span></a><section className="auth-page-card"><div className="page-flame"><Flame/></div><small className="auth-kicker">{isLogin?"WELCOME BACK":"JOIN FLAMES"}</small><h1>{isLogin?"Welcome back.":"Keep your FLAMES."}</h1><p>{isLogin?"Log in and get back to the game.":"Create an account to save your matches, keep your streak and have your own FLAMES identity."}</p>{!isLogin&&<div className="page-unlocks"><span>🔥 Save every result</span><span>⚡ Keep your streak</span><span>✨ Unique @username</span></div>}{!isLogin&&<label>Full name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Alex Johnson" autoComplete="name"/><small>Full names can be identical.</small></label>}{!isLogin&&<label>FLAMES username<div className="username-field"><span className="username-prefix">@</span><input value={username} onChange={e=>setUsername(e.target.value.replace(/[^a-z0-9_]/g,"").slice(0,20))} placeholder="e.g. alexjohnson" autoComplete="username"/></div>{usernameMessage&&<small className={"field-status "+usernameState}>{usernameMessage}</small>}</label>}<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="e.g. alex@gmail.com" autoComplete="email"/></label><label><div className="password-label-row"><span>Password</span>{isLogin&&<a href="/forgot-password">Forgot password?</a>}</div><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={isLogin?"Enter your password":"Create a password (6+ characters)"} autoComplete={isLogin?"current-password":"new-password"}/></label>{error&&<div className="auth-error">{error}</div>}<button className="auth-page-primary" disabled={busy||!email||password.length<6||(!isLogin&&usernameState!=="success")} onClick={submit}>{busy?"Please wait…":isLogin?"Log in":"Create account"}</button><a className="auth-page-switch" href={isLogin?"/register":"/login"}>{isLogin?"New to FLAMES? Create an account":"Already have an account? Log in"}</a></section></main>
}



function ForgotPasswordPage(){
  const [step,setStep]=useState("email"),[email,setEmail]=useState(""),[code,setCode]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[resetToken,setResetToken]=useState(""),[done,setDone]=useState(false);
  const sendCode=async e=>{e.preventDefault();setError("");const clean=email.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(clean)){setError("Enter a valid email address.");return}setBusy(true);const r=await requestPasswordReset({email:clean});setBusy(false);if(r.error){setError(r.error.message);return}setStep("code")};
  const verifyCode=async e=>{e.preventDefault();setError("");const clean=code.replace(/\D/g,"").slice(0,6);if(clean.length!==6){setError("Enter the 6-digit reset code.");return}setBusy(true);const r=await verifyRecoveryCode({email:email.trim().toLowerCase(),token:clean});setBusy(false);if(r.error){setError(r.error.message);return}if(!r.data?.resetToken){setError("The reset session could not be created. Request a new code.");return}setResetToken(r.data.resetToken);setStep("password")};
  const changePassword=async e=>{e.preventDefault();setError("");if(password.length<6){setError("Password must be at least 6 characters.");return}if(password!==confirm){setError("Passwords do not match.");return}if(!resetToken){setError("Verify your reset code first.");return}setBusy(true);const r=await updatePassword({email:email.trim().toLowerCase(),resetToken,password});if(r.error){setError(r.error.message);setBusy(false);return}await signOut();setBusy(false);setDone(true)};
  const resend=async()=>{setBusy(true);setError("");const r=await requestPasswordReset({email:email.trim().toLowerCase()});setBusy(false);if(r.error){setError(r.error.message);return}setCode("");setResetToken("");setStep("code")};
  return <main className="auth-page flames-page"><a className="auth-page-brand" href="/"><span className="brand-icon"><img src="/favicon.svg" alt="" /></span><span>FLAMES</span></a><section className={"auth-page-card recovery-card "+(done?"recovery-done":"")}><div className="page-flame"><Flame/></div>{done?<><small className="auth-kicker">PASSWORD UPDATED</small><h1>You’re back in control.</h1><p>Your FLAMES password has been changed. Log in with your new password.</p><a className="auth-page-primary" href="/login">Log in ↗</a></>:step==="email"?<><small className="auth-kicker">PASSWORD RESET</small><h1>Forgot your password?</h1><p>Enter your FLAMES email and we’ll send a 6-digit reset code.</p><form onSubmit={sendCode}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} /></label>{error&&<div className="auth-error">{error}</div>}<button className="auth-page-primary" disabled={busy||!email.trim()}>{busy?"Sending code…":"Send reset code"}</button></form><a className="auth-page-switch" href="/login">Back to log in</a></>:step==="code"?<><small className="auth-kicker">VERIFY CODE</small><h1>Enter your reset code.</h1><p>We sent a 6-digit code to <strong>{email.trim()}</strong>.</p><form onSubmit={verifyCode}><label>6-digit code<input className="recovery-code-input" inputMode="numeric" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} maxLength={6}/></label>{error&&<div className="auth-error">{error}</div>}<button className="auth-page-primary" disabled={busy||code.length!==6}>{busy?"Checking code…":"Verify code"}</button></form><div className="recovery-actions"><button type="button" onClick={resend}>Send a new code</button><a href="/login">Back to log in</a></div></>:<><small className="auth-kicker">CHOOSE A NEW PASSWORD</small><h1>Set a new password.</h1><form onSubmit={changePassword}><label>New password<input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirm password<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>{error&&<div className="auth-error">{error}</div>}<button className="auth-page-primary" disabled={busy||password.length<6||confirm.length<6}>{busy?"Updating password…":"Update password"}</button></form><a className="auth-page-switch" href="/login">Back to log in</a></>}</section></main>;
}
function ResetPasswordPage(){return <ForgotPasswordPage/>;}
const FLAMES_QUOTES=[
  "Some matches are better as stories than statistics.",
  "A little curiosity can turn an ordinary day into a FLAMES moment.",
  "Today’s energy: ask the question you were too shy to ask.",
  "Your streak is proof that you kept coming back for fun.",
  "There is no pressure here. Just names, vibes and a little chaos."
];

function Icon({name,size=21,stroke=2}){
  const p={width:size,height:size,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:stroke,strokeLinecap:"round",strokeLinejoin:"round",ariaHidden:true};
  const paths={
    home:<><path d="m3 10 9-7 9 7"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/></>,
    play:<><path d="M8 5v14l11-7L8 5Z"/></>,
    history:<><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></>,
    trophy:<><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 6H4v2a4 4 0 0 0 4 4"/><path d="M17 6h3v2a4 4 0 0 1-4 4"/></>,
    flame:<path d="M13 2c2.2 5.8-2.1 7.3-.4 10.1 1 1.7 2.7 1.7 3.6-.1 2.4 2 3.8 4.3 3.8 6.6 0 3.9-3.1 6.9-7 6.9s-7-3-7-6.9c0-3.4 1.9-6.4 4.8-8.9-.2 2.7.8 4.2 2 4.7-.5-4.6 1.9-7.2.2-12.4Z"/>,
    spark:<><path d="m12 2 1.2 6.8L20 10l-6.8 1.2L12 18l-1.2-6.8L4 10l6.8-1.2L12 2Z"/><path d="m19 15 .6 2.4L22 18l-2.4.6L19 21l-.6-2.4L16 18l2.4-.6L19 15Z"/></>,
    arrow:<><path d="M5 12h13"/><path d="m13 6 6 6-6 6"/></>,
    lock:<><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    user:<><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
    settings:<><path d="M12 3v2"/><path d="M12 19v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M3 12h2"/><path d="M19 12h2"/><path d="m4.9 19.1 1.4-1.4"/><path d="m17.7 6.3 1.4 1.4"/><circle cx="12" cy="12" r="4"/></>,
    check:<><path d="m5 12 4 4L19 6"/></>,
    crown:<path d="m4 7 4 5 4-8 4 8 4-5-2 11H6L4 7Z"/>,
    bolt:<path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/>,
    users:<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2.5a4 4 0 0 0-3-3.8"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/></>,
    plus:<><path d="M12 5v14"/><path d="M5 12h14"/></>,
  };
  return <svg {...p}>{paths[name]||paths.spark}</svg>;
}

function Avatar({profile,size="md"}){
  const seed=Number(profile?.avatar_id)||1;
  const initials=(profile?.display_name||"F").split(/\\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase();
  return <div className={"flames-avatar flames-avatar-"+size+" avatar-theme-"+(((seed-1)%12)+1)} aria-hidden="true"><span>{initials}</span><i/></div>;
}
function relativeTime(value){const diff=Math.max(0,Date.now()-new Date(value).getTime());const mins=Math.floor(diff/60000);if(mins<1)return "just now";if(mins<60)return mins+"m ago";const hours=Math.floor(mins/60);if(hours<24)return hours+"h ago";const days=Math.floor(hours/24);return days+"d ago";}
function resultCounts(matches){return matches.reduce((acc,m)=>{acc[m.result_key]=(acc[m.result_key]||0)+1;return acc},{});}

function AppNav({profile,streak,view,setView,onLogout}){
  const go=v=>setView(v);
  const items=[["dashboard","Home","home"],["game","Play","play"],["history","History","history"],["circle","Private Circle","users"],["achievements","Achievements","trophy"]];
  return <header className="app-shell-nav">
    <button className="app-shell-brand" type="button" onClick={()=>go("dashboard")}><span className="app-shell-logo"><Flame/></span><span>FLAMES</span></button>
    <nav className="app-shell-mainnav">
      {items.map(([v,label,icon])=><button type="button" key={v} className={view===v?"active":""} onClick={()=>go(v)}><Icon name={icon} size={19}/><span>{label}</span></button>)}
    </nav>
    <div className="app-shell-actions">
      <span className="nav-streak"><Icon name="flame" size={17}/><b>{streak||0}</b><span>day streak</span></span>
      <button type="button" className="nav-profile-button" aria-label="Open profile" onClick={()=>go("profile")}><Avatar profile={profile} size="sm"/></button>
    </div>
  </header>;
}

function Dashboard({profile,savedCount,streak,recentMatches,setView}){
  const quote=FLAMES_QUOTES[(new Date().getDate()+savedCount)%FLAMES_QUOTES.length];
  const first=(profile?.display_name||"Friend").split(" ")[0];
  const counts=resultCounts(recentMatches);
  const topKey=Object.keys(counts).sort((x,y)=>(counts[y]||0)-(counts[x]||0))[0];
  const top=topKey?RESULTS[topKey]:null;
  const latest=recentMatches[0];
  return <main className="social-page">
    <AppNav profile={profile} streak={streak} view="dashboard" setView={setView}/>
    <div className="social-layout">
      <section className="social-main">
        <div className="social-hero">
          <div>
            <span className="eyebrow">YOUR FLAMES SPACE</span>
            <h1>Hey {first}. <em>Ready for another match?</em></h1>
            <p>“{quote}”</p>
          </div>
          <button className="big-play-btn" type="button" onClick={()=>setView("game")}><Icon name="play" size={18}/> Play FLAMES <Icon name="arrow" size={17}/></button>
        </div>

        <section className="social-feed-card featured">
          <div className="feed-head"><div><span>TODAY'S FLAME</span><h2>Two names. One ridiculous result.</h2></div><span className="live-chip"><i/>Just for fun</span></div>
          <p className="feature-copy">Classic FLAMES is still the main event. Run a match, save the result, and come back whenever curiosity hits.</p>
          <div className="quote-bubble">“{quote}”</div>
          <div className="feature-actions">
            <button type="button" onClick={()=>setView("game")}><Icon name="play" size={17}/> Start a match</button>
            <button type="button" className="quiet-action" onClick={()=>setView("circle")}><Icon name="users" size={17}/> Open Private Circle</button>
          </div>
        </section>

        <section className="social-feed-card">
          <div className="feed-head">
            <div><span>RECENT FLAMES</span><h3>Your latest moments</h3></div>
            <button type="button" className="text-link" onClick={()=>setView("history")}>View history <Icon name="arrow" size={15}/></button>
          </div>
          {recentMatches.length?<div className="match-list">{recentMatches.slice(0,6).map(m=><div className="match-item" key={m.id}>
            <div className={"match-orb result-"+String(m.result_key||"").toLowerCase()}>{m.result_key}</div>
            <div><strong>{m.name_a} <i>×</i> {m.secret_mode?"Secret Crush":m.name_b}</strong><small>{RESULTS[m.result_key]?.name||"FLAMES"} · {relativeTime(m.created_at)}</small></div>
            <b>{m.percent}%</b>
          </div>)}</div>:<div className="empty-space"><Icon name="spark" size={27}/><strong>Your FLAMES history starts here.</strong><p>Play your first match and your saved result will appear on this feed.</p><button type="button" onClick={()=>setView("game")}>Play your first match <Icon name="arrow" size={15}/></button></div>}
        </section>

        <div className="dashboard-footer-actions">
          <button type="button" onClick={()=>setView("achievements")}><Icon name="trophy" size={17}/><span><strong>Achievements</strong><small>See your milestones and records.</small></span><Icon name="arrow" size={16}/></button>
          <button type="button" onClick={()=>setView("profile")}><Avatar profile={profile} size="sm"/><span><strong>Your profile</strong><small>@{profile?.username||"flames"}</small></span><Icon name="arrow" size={16}/></button>
        </div>
      </section>

      <aside className="social-right">
        <section className="side-profile-card"><Avatar profile={profile} size="lg"/><span className="eyebrow">YOUR PROFILE</span><h3>{profile?.display_name||"FLAMES Friend"}</h3><p>@{profile?.username||"flames"}</p><button type="button" onClick={()=>setView("profile")}>Open profile <Icon name="arrow" size={15}/></button></section>
        <section className="side-stat-card"><span className="side-stat-icon"><Icon name="flame" size={20}/></span><div><span>STREAK</span><strong>{streak||0} day{streak===1?"":"s"}</strong><p>{streak>1?"You are on a roll.":"Play tomorrow to keep it going."}</p></div></section>
        <section className="side-stat-card"><span className="side-stat-icon warm"><Icon name="history" size={20}/></span><div><span>SAVED MATCHES</span><strong>{savedCount}</strong><p>{savedCount?"Your FLAMES memories are building.":"Your first one is waiting."}</p></div></section>
        <section className="side-record-card"><span className="eyebrow">YOUR RECORD</span><strong>{top?top.emoji:"✦"}</strong><h3>{top?top.name:"No pattern yet"}</h3><p>{top?counts[topKey]+" saved result"+(counts[topKey]===1?"":"s"):"Play a few matches and your history will start showing a pattern."}</p>{latest&&<button type="button" onClick={()=>setView("history")}>See your latest <Icon name="arrow" size={15}/></button>}</section>
      </aside>
    </div>
  </main>;
}

function HistoryPage({profile,streak,recentMatches,setView}){
  return <main className="social-page">
    <AppNav profile={profile} streak={streak} view="history" setView={setView}/>
    <div className="content-page">
      <div className="page-intro page-intro-row">
        <div><span className="eyebrow">YOUR HISTORY</span><h1>Every match has a little story.</h1><p>Your saved FLAMES results, newest first.</p></div>
        <button className="big-play-btn" type="button" onClick={()=>setView("game")}><Icon name="play" size={18}/> Play another</button>
      </div>
      <div className="page-summary-row">
        <div><span>SAVED MATCHES</span><strong>{recentMatches.length}</strong></div>
        <div><span>CURRENT STREAK</span><strong>{streak||0}</strong></div>
        <div><span>LATEST RESULT</span><strong>{recentMatches[0]?RESULTS[recentMatches[0].result_key]?.name||recentMatches[0].result_key:"—"}</strong></div>
      </div>
      <section className="large-card">
        {recentMatches.length?<div className="history-grid">{recentMatches.map(m=><article className="history-item" key={m.id}>
          <div className={"history-letter result-"+String(m.result_key||"").toLowerCase()}>{m.result_key}</div>
          <div className="history-copy"><strong>{m.name_a} <i>×</i> {m.secret_mode?"Secret Crush":m.name_b}</strong><span>{RESULTS[m.result_key]?.name||"FLAMES"} · {m.percent}% · {relativeTime(m.created_at)}</span><p>{m.message}</p></div>
        </article>)}</div>:<div className="large-empty"><Icon name="history" size={32}/><h3>No saved matches yet.</h3><p>Classic FLAMES is ready whenever you are.</p><button className="big-play-btn" type="button" onClick={()=>setView("game")}><Icon name="play" size={18}/> Play your first match</button></div>}
      </section>
    </div>
  </main>;
}

function AchievementsPage({profile,streak,recentMatches,savedCount,setView}){
  const counts=resultCounts(recentMatches);
  const firstResult=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const items=[
    {icon:"play",title:"First Flame",desc:"Complete your first saved match.",done:savedCount>=1,progress:Math.min(savedCount,1),goal:1},
    {icon:"bolt",title:"Three days hot",desc:"Keep a 3-day FLAMES streak.",done:streak>=3,progress:Math.min(streak,3),goal:3},
    {icon:"trophy",title:"FLAMES Regular",desc:"Save five matches.",done:savedCount>=5,progress:Math.min(savedCount,5),goal:5},
    {icon:"crown",title:"Known around FLAMES",desc:"Save ten matches.",done:savedCount>=10,progress:Math.min(savedCount,10),goal:10}
  ];
  return <main className="social-page">
    <AppNav profile={profile} streak={streak} view="achievements" setView={setView}/>
    <div className="content-page">
      <div className="page-intro page-intro-row"><div><span className="eyebrow">ACHIEVEMENTS & RECORDS</span><h1>Keep the little wins.</h1><p>Everything here comes from your own FLAMES activity.</p></div><button className="big-play-btn" type="button" onClick={()=>setView("game")}><Icon name="play" size={18}/> Play</button></div>
      <div className="records-grid">
        <section className="record-hero-card"><span>CURRENT RUN</span><strong>{streak||0}<small>days</small></strong><p>{streak?"Keep the fire going.":"Start your streak today."}</p></section>
        <section className="record-hero-card warm-record"><span>SAVED MOMENTS</span><strong>{savedCount}</strong><p>{savedCount?"Your history is growing.":"Save your first result."}</p></section>
        <section className="record-hero-card purple-record"><span>YOUR MOST COMMON</span><strong>{firstResult?RESULTS[firstResult].emoji:"✦"}</strong><p>{firstResult?RESULTS[firstResult].name+" · "+counts[firstResult]+" saved":"Your pattern will appear here."}</p></section>
      </div>
      <section className="large-card achievement-list">{items.map(a=><div className={"achievement-row "+(a.done?"complete":"")} key={a.title}>
        <div className="achievement-badge"><Icon name={a.icon} size={21}/></div><div><h3>{a.title}</h3><p>{a.desc}</p></div>
        <div className="achievement-progress"><span>{a.done?"Unlocked":a.progress+"/"+a.goal}</span><div><i style={{width:Math.min((a.progress/a.goal)*100,100)+"%"}}/></div></div>{a.done&&<Icon name="check" size={19}/>}
      </div>)}</section>
      <section className="large-card result-breakdown"><div className="section-head"><div><span>YOUR FLAMES BREAKDOWN</span><h2>What keeps showing up</h2></div></div>{LETTERS.map(k=><div className="result-bar-row" key={k}><b>{k}</b><span>{RESULTS[k].emoji}</span><strong>{RESULTS[k].name}</strong><div><i style={{width:(Math.min(((counts[k]||0)/Math.max(1,recentMatches.length))*100,100))+"%"}}/></div><small>{counts[k]||0}</small></div>)}</section>
    </div>
  </main>;
}

function ProfilePage({profile,streak,savedCount,recentMatches,setView,onLogout}){
  return <main className="social-page">
    <AppNav profile={profile} streak={streak} view="profile" setView={setView} onLogout={onLogout}/>
    <div className="content-page profile-page-content">
      <section className="profile-hero">
        <div className="profile-hero-top"><Avatar profile={profile} size="xl"/><div><span className="eyebrow">YOUR FLAMES PROFILE</span><h1>{profile?.display_name||"FLAMES Friend"}</h1><p>@{profile?.username||"flames"}</p></div><button type="button" onClick={()=>setView("settings")}><Icon name="settings" size={18}/> Settings</button></div>
        <div className="profile-stats"><div><b>{savedCount}</b><span>saved matches</span></div><div><b>{streak||0}</b><span>day streak</span></div><div><b>{recentMatches.length?RESULTS[recentMatches[0].result_key]?.name||"FLAMES":"—"}</b><span>latest result</span></div></div>
      </section>
      <div className="profile-grid">
        <section className="large-card profile-note"><span className="eyebrow">ABOUT YOUR SPACE</span><h2>Your FLAMES identity.</h2><p>Your @username and automatic avatar travel with your account. Your saved matches stay attached to the same FLAMES profile.</p><div className="profile-action-row"><button type="button" onClick={()=>setView("game")}><Icon name="play" size={17}/> Play FLAMES</button><button type="button" onClick={()=>setView("circle")}><Icon name="users" size={17}/> Private Circle</button></div></section>
        <section className="large-card"><div className="section-head"><div><span>RECENT</span><h2>Your latest match</h2></div></div>{recentMatches[0]?<div className="profile-latest"><div className={"history-letter result-"+String(recentMatches[0].result_key||"").toLowerCase()}>{recentMatches[0].result_key}</div><div><strong>{recentMatches[0].name_a} <i>×</i> {recentMatches[0].secret_mode?"Secret Crush":recentMatches[0].name_b}</strong><span>{RESULTS[recentMatches[0].result_key]?.name||"FLAMES"} · {recentMatches[0].percent}%</span><small>{relativeTime(recentMatches[0].created_at)}</small></div></div>:<div className="pending-empty">No matches yet. Your first one can start now.</div>}<button className="text-link profile-history-link" type="button" onClick={()=>setView("history")}>Open full history <Icon name="arrow" size={15}/></button></section>
      </div>
    </div>
  </main>;
}

function CreateGamePage({profile,streak,setView,user}){
  const [kind,setKind]=useState("poll"),[title,setTitle]=useState(""),[prompt,setPrompt]=useState(""),[options,setOptions]=useState(["",""]),[answer,setAnswer]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[created,setCreated]=useState(null);
  const needsOptions=kind==="poll"||kind==="quiz";
  const updateOption=(i,v)=>setOptions(xs=>xs.map((x,n)=>n===i?v:x));
  const addOption=()=>setOptions(xs=>xs.length<6?[...xs,""]:xs);
  const removeOption=i=>setOptions(xs=>xs.length>2?xs.filter((_,n)=>n!==i):xs);
  const create=async e=>{
    e.preventDefault();setError("");
    const cleanTitle=title.trim(),cleanPrompt=prompt.trim(),cleanOptions=options.map(x=>x.trim()).filter(Boolean);
    if(cleanTitle.length<2){setError("Give your game a short title.");return}
    if(cleanPrompt.length<3){setError("Write the question people will answer.");return}
    if(needsOptions&&cleanOptions.length<2){setError("Add at least two choices.");return}
    if(kind==="quiz"&&!answer.trim()){setError("Choose the correct answer for the quiz.");return}
    setBusy(true);
    const {data,error:e2}=await supabase.from("flames_games").insert({creator_id:user.id,kind,title:cleanTitle,prompt:cleanPrompt,options:cleanOptions,answer_value:kind==="quiz"?answer.trim():null}).select().single();
    setBusy(false);
    if(e2){setError(e2.message||"Could not create the game.");return}
    setCreated(data);
  };
  if(created)return <main className="social-page"><AppNav profile={profile} streak={streak} view="create" setView={setView}/><div className="content-page create-page"><section className="create-success-card"><div className="create-success-icon"><Icon name="check" size={28}/></div><span className="eyebrow">GAME CREATED</span><h1>Ready to share.</h1><p>Your question is live. Send the link to friends and watch the answers come in.</p><div className="share-game-link">{location.origin+"/game/"+created.id}</div><div className="create-success-actions"><button type="button" className="big-play-btn" onClick={()=>navigator.clipboard?.writeText(location.origin+"/game/"+created.id)}>Copy link</button><button type="button" onClick={()=>setView("game")}>Back to FLAMES <Icon name="arrow" size={16}/></button></div><button type="button" className="text-link" onClick={()=>{setCreated(null);setTitle("");setPrompt("");setOptions(["",""]);setAnswer("")}}>Create another question</button></section></div></main>;
  return <main className="social-page"><AppNav profile={profile} streak={streak} view="create" setView={setView}/><div className="content-page create-page"><div className="page-intro page-intro-row"><div><span className="eyebrow">CREATE A GAME</span><h1>Ask one good question.</h1><p>Make something small, share it, and let people play.</p></div><span className="create-badge"><Icon name="spark" size={16}/> Simple games</span></div><form className="large-card create-form" onSubmit={create}>
    <div className="create-kind-row">{[["poll","Poll","Everyone picks a choice."],["quiz","Quiz","You choose the right answer."],["opinion","Opinion","Let people write their take."],["recommendation","Recommendation","Ask people what they would choose."]].map(([v,l,d])=><button type="button" key={v} className={kind===v?"kind-card active": "kind-card"} onClick={()=>setKind(v)}><strong>{l}</strong><span>{d}</span></button>)}</div>
    <label>Game title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Friday night plans"/></label>
    <label>Your question<textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={4} maxLength={500} placeholder="What should we do this weekend?"/></label>
    {needsOptions&&<div className="create-options"><div className="create-section-label"><span>CHOICES</span><small>2–6 options</small></div>{options.map((v,i)=><div className="create-option" key={i}><input value={v} onChange={e=>updateOption(i,e.target.value)} placeholder={"Choice "+(i+1)}/>{options.length>2&&<button type="button" onClick={()=>removeOption(i)} aria-label={"Remove choice "+(i+1)}>×</button>}{kind==="quiz"&&<button type="button" className={answer===v.trim()&&v.trim()?"answer-chip selected":"answer-chip"} onClick={()=>setAnswer(v.trim())}>{answer===v.trim()&&v.trim()?"Correct ✓":"Mark correct"}</button>}</div>)}{options.length<6&&<button type="button" className="add-option-btn" onClick={addOption}><Icon name="plus" size={15}/> Add another choice</button>}</div>}
    {error&&<div className="auth-error">{error}</div>}<div className="create-form-footer"><span><Icon name="flame" size={17}/> No pressure. Just a little game.</span><button className="big-play-btn" disabled={busy}>{busy?"Creating…":"Create game ↗"}</button></div>
  </form></div></main>;
}

function PublicGameQuestion({gameId}){
  const [game,setGame]=useState(null),[answer,setAnswer]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState("");
  useEffect(()=>{let active=true;(async()=>{const {data}=await supabase.from("flames_games").select("*").eq("id",gameId).single();if(active){if(data)setGame(data);else setError("This game could not be found.")}})();return()=>{active=false}},[gameId]);
  const submit=async()=>{if(!answer.trim())return;setBusy(true);setError("");const {error:e}=await supabase.from("flames_game_responses").insert({game_id:gameId,answer:answer.trim()});setBusy(false);if(e){setError("Your answer could not be saved.");return}setDone(true)};
  if(error)return <main className="game-question-page"><a className="auth-page-brand" href="/"><span className="brand-icon"><img src="/favicon.svg" alt="" /></span><span>FLAMES</span></a><section className="game-question-card"><Icon name="spark" size={30}/><h1>Game unavailable.</h1><p>{error}</p><a className="big-play-btn" href="/">Play FLAMES</a></section></main>;
  if(!game)return <main className="game-question-page"><div className="game-question-card"><div className="game-question-loader"><Flame/></div><p>Opening the game…</p></div></main>;
  if(done)return <main className="game-question-page"><a className="auth-page-brand" href="/"><span className="brand-icon"><img src="/favicon.svg" alt="" /></span><span>FLAMES</span></a><section className="game-question-card done"><div className="create-success-icon"><Icon name="check" size={28}/></div><span className="eyebrow">ANSWER SAVED</span><h1>Nice. You answered.</h1><p>Your response is in. Now go play FLAMES while they answer yours.</p><a className="big-play-btn" href="/">Play FLAMES <Icon name="arrow" size={16}/></a></section></main>;
  const isChoice=game.kind==="poll"||game.kind==="quiz";
  return <main className="game-question-page"><a className="auth-page-brand" href="/"><span className="brand-icon"><img src="/favicon.svg" alt="" /></span><span>FLAMES</span></a><section className="game-question-card"><span className="eyebrow">{String(game.kind||"game").toUpperCase()}</span><h1>{game.title}</h1><p className="game-question-prompt">{game.prompt}</p>{isChoice?<div className="public-game-options">{(game.options||[]).map(o=><button type="button" className={answer===o?"selected":""} key={o} onClick={()=>setAnswer(o)}>{o}</button>)}</div>:<textarea className="public-game-answer" value={answer} onChange={e=>setAnswer(e.target.value)} maxLength={1000} rows={5} placeholder="Write your answer…"/>}{error&&<div className="auth-error">{error}</div>}<button type="button" className="big-play-btn" disabled={!answer.trim()||busy} onClick={submit}>{busy?"Saving…":"Send answer ↗"}</button><small className="game-question-foot">Just for fun · Created with FLAMES</small></section></main>;
}

function SettingsPage({profile,streak,setView,onLogout}){
  return <main className="social-page">
    <AppNav profile={profile} streak={streak} view="settings" setView={setView} onLogout={onLogout}/>
    <div className="content-page">
      <div className="page-intro"><span className="eyebrow">SETTINGS</span><h1>Your space, your rules.</h1><p>Account navigation without the clutter.</p></div>
      <section className="settings-account">
        <Avatar profile={profile} size="lg"/><div><span className="eyebrow">SIGNED IN AS</span><h2>{profile?.display_name||"FLAMES Friend"}</h2><p>@{profile?.username||"flames"} · {streak||0} day streak</p></div>
      </section>
      <section className="large-card settings-list">
        <button type="button" onClick={()=>setView("profile")}><Icon name="user"/><div><strong>Profile</strong><span>View your FLAMES identity and activity.</span></div><Icon name="arrow" size={18}/></button>
        <button type="button" onClick={()=>setView("circle")}><Icon name="users"/><div><strong>Private Circle</strong><span>Manage your Circle connections and requests.</span></div><Icon name="arrow" size={18}/></button>
        <button type="button" onClick={()=>setView("history")}><Icon name="history"/><div><strong>Saved matches</strong><span>Open the results you have kept.</span></div><Icon name="arrow" size={18}/></button>
        <button type="button" onClick={()=>setView("achievements")}><Icon name="trophy"/><div><strong>Achievements</strong><span>View streaks, milestones and your FLAMES pattern.</span></div><Icon name="arrow" size={18}/></button>
        <button type="button" className="danger" onClick={onLogout}><Icon name="lock"/><div><strong>Log out</strong><span>End this FLAMES session on this device.</span></div><Icon name="arrow" size={18}/></button>
      </section>
      <section className="settings-note"><Icon name="spark" size={19}/><p>FLAMES stays a game first. Your account simply keeps the things worth keeping.</p></section>
    </div>
  </main>;
}

function CirclePage({profile,streak,user,setView}){
 const [query,setQuery]=useState(""),[searching,setSearching]=useState(false),[results,setResults]=useState([]),[connections,setConnections]=useState([]),[profiles,setProfiles]=useState({}),[busy,setBusy]=useState(null),[notice,setNotice]=useState("");
 const load=async()=>{const [a,b]=await Promise.all([supabase.from("flames_connections").select("*").eq("requester_id",user.id),supabase.from("flames_connections").select("*").eq("addressee_id",user.id)]);const rows=[...(a.data||[]),...(b.data||[])].filter((r,i,arr)=>arr.findIndex(x=>x.id===r.id)===i);setConnections(rows);const ids=[...new Set(rows.map(r=>r.requester_id===user.id?r.addressee_id:r.requester_id))];if(ids.length){const p=await supabase.from("flames_profiles").select("*").in("id",ids).limit(50);const map={};(p.data||[]).forEach(x=>map[x.id]=x);setProfiles(map)}};
 useEffect(()=>{load()},[user.id]);
 const findPeople=async e=>{e?.preventDefault();setNotice("");const q=query.trim().toLowerCase();if(q.length<2){setResults([]);return}setSearching(true);const r=await supabase.from("flames_profiles").select("*").ilike("username",q+"%").limit(8);setSearching(false);setResults((r.data||[]).filter(x=>x.id!==user.id))};
 const send=async person=>{setBusy(person.id);setNotice("");const r=await supabase.from("flames_connections").insert({requester_id:user.id,addressee_id:person.id,status:"pending"}).select().single();setBusy(null);if(r.error){setNotice("That connection could not be created. They may already be in your Circle.");return}setNotice("Connection request sent to @"+person.username+".");setResults([]);await load()};
 const respond=async(conn,status)=>{setBusy(conn.id);const r=await supabase.from("flames_connections").update({status}).eq("id",conn.id).select().single();setBusy(null);if(r.error){setNotice("We couldn't update that request.");return}await load()};
 const accepted=connections.filter(x=>x.status==="accepted"),incoming=connections.filter(x=>x.status==="pending"&&x.addressee_id===user.id),outgoing=connections.filter(x=>x.status==="pending"&&x.requester_id===user.id);
 return <main className="social-page"><AppNav profile={profile} streak={streak} view="circle" setView={setView}/><div className="content-page"><div className="page-intro circle-intro"><span className="eyebrow">PRIVATE CIRCLE</span><h1>Your people, kept close.</h1><p>Connect with FLAMES people you trust. Circle connections are only visible to the people in them.</p></div><section className="circle-search-card"><form onSubmit={findPeople}><div><Icon name="users" size={20}/><input value={query} onChange={e=>setQuery(e.target.value.replace(/[^a-z0-9_]/gi,"").slice(0,20))} placeholder="Find someone by @username"/></div><button className="big-play-btn">{searching?"Searching…":"Find them"}</button></form>{notice&&<p className="circle-notice">{notice}</p>}{results.length>0&&<div className="circle-results">{results.map(p=><div className="person-result" key={p.id}><Avatar profile={p} size="md"/><div><strong>{p.display_name}</strong><span>@{p.username}</span></div><button onClick={()=>send(p)} disabled={busy===p.id}><Icon name="plus" size={16}/>{busy===p.id?"Sending":"Add to Circle"}</button></div>)}</div>}</section><div className="circle-columns"><section className="large-card"><div className="section-head"><div><span>YOUR CIRCLE</span><h2>The people you keep close</h2></div><span className="count-pill">{accepted.length}</span></div>{accepted.length?<div className="circle-people">{accepted.map(c=>{const id=c.requester_id===user.id?c.addressee_id:c.requester_id;const p=profiles[id];return <div className="circle-person" key={c.id}><Avatar profile={p} size="md"/><div><strong>{p?.display_name||"FLAMES Friend"}</strong><span>@{p?.username||"flames"}</span></div><Icon name="check" size={17}/></div>})}</div>:<div className="large-empty"><Icon name="users" size={30}/><h3>Your Circle is empty.</h3><p>Find someone by username and send the first connection.</p></div>}</section><section className="large-card pending-card"><div className="section-head"><div><span>REQUESTS</span><h2>Waiting for you</h2></div><span className="count-pill">{incoming.length}</span></div>{incoming.length?incoming.map(c=>{const p=profiles[c.requester_id];return <div className="request-row" key={c.id}><Avatar profile={p} size="sm"/><div><strong>{p?.display_name||"FLAMES Friend"}</strong><span>@{p?.username||"flames"}</span></div><div className="request-actions"><button onClick={()=>respond(c,"accepted")} disabled={busy===c.id}>Accept</button><button onClick={()=>respond(c,"rejected")} disabled={busy===c.id}>Pass</button></div></div>}):<div className="pending-empty">No requests waiting.</div>}{outgoing.length>0&&<div className="outgoing-note">{outgoing.length} outgoing request{outgoing.length>1?"s":""} waiting.</div>}</section></div></div></main>;
}

function PublicGame({initialView="dashboard",appMode=false,appNavigate=null}){
  const [user,setUser]=useState(null),[profile,setProfile]=useState(null),[recentMatches,setRecentMatches]=useState([]),[savedCount,setSavedCount]=useState(0),[streak,setStreak]=useState(0),[view,setView]=useState(initialView),[authReady,setAuthReady]=useState(false),[authOpen,setAuthOpen]=useState(false),[authMode,setAuthMode]=useState("login"),[authSuccess,setAuthSuccess]=useState(false),[authSuccessName,setAuthSuccessName]=useState(""),[nudgeDismissed,setNudgeDismissed]=useState(false),[a,setA]=useState(""),[b,setB]=useState(""),[key,setKey]=useState(null),[loading,setLoading]=useState(false),[copied,setCopied]=useState(false),[downloaded,setDownloaded]=useState(false),[secretMode,setSecretMode]=useState(false),[quipIndex,setQuipIndex]=useState(0),[shareOpen,setShareOpen]=useState(false),[shareNotice,setShareNotice]=useState(""),[feedbackOpen,setFeedbackOpen]=useState(false),[feedbackRating,setFeedbackRating]=useState(""),[feedbackCategory,setFeedbackCategory]=useState(""),[feedbackMessage,setFeedbackMessage]=useState(""),[feedbackSent,setFeedbackSent]=useState(false),[feedbackSending,setFeedbackSending]=useState(false),[miniPromo,setMiniPromo]=useState(()=>{try{return localStorage.getItem("flames_mini_promo_dismissed")!=="1"}catch{return true}});
  const loadAccount=async(u)=>{if(!u)return;const [{data:p},{data:m}]=await Promise.all([supabase.from("flames_profiles").select("*").eq("id",u.id).single(),supabase.from("flames_matches").select("*").eq("user_id",u.id).order("created_at",{ascending:false}).limit(100)]);let account=p||null;if(account&&(!Number.isInteger(account.avatar_id)||account.avatar_id<1||account.avatar_id>24)){const avatarId=(Array.from(u.id).reduce((n,ch)=>n+ch.charCodeAt(0),0)%24)+1;const {data:updated}=await supabase.from("flames_profiles").update({avatar_id:avatarId,updated_at:new Date().toISOString()}).eq("id",u.id).select().single();account=updated||account}setProfile(account);setRecentMatches(m||[]);setSavedCount(m?.length||0);if(p){const today=new Date().toISOString().slice(0,10);if(p.last_active_date!==today){const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);const next=p.last_active_date===yesterday?(p.streak_count||0)+1:1;const {data:updated}=await supabase.from("flames_profiles").update({streak_count:next,last_active_date:today,updated_at:new Date().toISOString()}).eq("id",u.id).select().single();if(updated){setProfile(updated);setStreak(updated.streak_count||0)}}else setStreak(p.streak_count||0)}};
  useEffect(()=>{let active=true;(async()=>{const {data}=await supabase.auth.getUser();if(!active)return;const u=data?.user||null;setUser(u);if(u)await loadAccount(u);else{setProfile(null);setRecentMatches([]);setSavedCount(0);setStreak(0)}if(active)setAuthReady(true)})();const {data:sub}=supabase.auth.onAuthStateChange(async(_,session)=>{if(!active)return;const u=session?.user||null;setUser(u);if(u)await loadAccount(u);else{setProfile(null);setRecentMatches([]);setSavedCount(0);setStreak(0)}setAuthReady(true)});return()=>{active=false;sub.subscription.unsubscribe()}},[]);
  const openAuth=mode=>{setAuthMode(mode);setAuthSuccess(false);setAuthOpen(true)};
  const finishAuth=async()=>{const {data}=await supabase.auth.getUser();if(data?.user){setUser(data.user);await loadAccount(data.user);setAuthSuccessName(data.user.user_metadata?.display_name||"FLAMES Friend");setAuthSuccess(true)}};
  const closeAuth=()=>{setAuthOpen(false);setAuthSuccess(false)};
  const handleLogout=async()=>{await signOut();setUser(null);setProfile(null);setRecentMatches([]);setSavedCount(0);setStreak(0);setView("dashboard")};
  const saveMatch=async(k,message)=>{if(!user)return;const {error}=await supabase.from("flames_matches").insert({user_id:user.id,name_a:a.trim(),name_b:b.trim(),result_key:k,percent:score(a,b),message,secret_mode:secretMode});if(!error)setSavedCount(v=>v+1)};
  const result=key?RESULTS[key]:null;
  const pct=useMemo(()=>key?score(a,b):0,[a,b,key]);
  const displayPair=secretMode?a.trim()+" × Secret Crush":a.trim()+" × "+b.trim();
  if(!authReady)return <main className="dashboard-boot"><div className="dashboard-brand-mark"><Flame/></div><span>Loading your FLAMES…</span></main>;
  if(user&&!key&&!loading&&view==="dashboard")return <Dashboard profile={profile} savedCount={savedCount} streak={streak} recentMatches={recentMatches} setView={setView}/>;
  if(user&&!key&&!loading&&view==="history")return <HistoryPage profile={profile} streak={streak} recentMatches={recentMatches} setView={setView}/>;
  if(user&&!key&&!loading&&view==="achievements")return <AchievementsPage profile={profile} streak={streak} recentMatches={recentMatches} savedCount={savedCount} setView={setView}/>;
  if(user&&!key&&!loading&&view==="profile")return <ProfilePage profile={profile} streak={streak} savedCount={savedCount} recentMatches={recentMatches} setView={setView} onLogout={handleLogout}/>;
  if(user&&!key&&!loading&&view==="settings")return <SettingsPage profile={profile} streak={streak} setView={setView} onLogout={handleLogout}/>;
  if(user&&!key&&!loading&&view==="circle")return <CirclePage profile={profile} streak={streak} user={user} setView={setView}/>;

  const start=e=>{e.preventDefault();if(!a.trim()||!b.trim()||loading)return;trackEvent("match_started",{mode:secretMode?"secret_crush":"classic"});setLoading(true);setKey(null);setCopied(false);setDownloaded(false);setNudgeDismissed(false);window.setTimeout(async()=>{const k=flames(a,b);const list=RESULTS[k].messages;const qi=(a.length+b.length+Date.now())%list.length;setQuipIndex(qi);setKey(k);setLoading(false);trackEvent("match_completed",{mode:secretMode?"secret_crush":"classic",result:k});await saveMatch(k,list[qi])},1700)};
  const reset=()=>{setKey(null);setLoading(false);setCopied(false);setDownloaded(false)};
  const inviteFriends=async()=>{trackEvent("invite_clicked");
    const text="🔥 Come play FLAMES with me! Put two names in and see what the game says.";
    if(navigator.share){
      try{await navigator.share({title:"Play FLAMES",text,url:location.href});return}catch{}
    }
    window.open("https://wa.me/?text="+encodeURIComponent(text+" "+location.href),"_blank","noopener,noreferrer");
  };
  const shareText=()=>secretMode?"I played FLAMES in Secret Crush mode and got "+result.name+" 🔥 Try yours!":"I played FLAMES with "+a.trim()+" + "+b.trim()+" and got "+result.name+" 🔥 Try yours!";
  const resultUrl=()=>location.href;
  const openShareUrl=(url)=>window.open(url,"_blank","noopener,noreferrer");
  const createCardPng=()=>new Promise(resolve=>{
    if(!result){resolve(null);return}
    const pairA=escapeXml(a.trim()),pairB=escapeXml(secretMode?"SECRET CRUSH":b.trim());
    const svg=[
      '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">',
      '<defs><linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff4d8"/><stop offset="55%" stop-color="#fffaf2"/><stop offset="100%" stop-color="#ffd6ba"/></linearGradient></defs>',
      '<rect width="1080" height="1350" rx="72" fill="url(#bg2)"/><circle cx="910" cy="150" r="150" fill="#ff9d3d" opacity=".13"/><circle cx="140" cy="1170" r="190" fill="#d95832" opacity=".10"/>',
      '<rect x="70" y="70" width="940" height="1210" rx="52" fill="#ffffff" fill-opacity=".84" stroke="#eadfd2" stroke-width="3"/>',
      '<rect x="438" y="112" width="204" height="56" rx="17" fill="#17120f"/><path fill="#ff9d3d" d="M520 121c2.3 8.1-4.3 10.5-3 16.2.7 2.9 3.2 3.9 5.1 1.8 2.3-2.5 1.4-6.5 1.4-6.5 5.3 4.1 7.7 8.9 7.1 13.4-1 6.8-6.5 10-12.3 10-7.3 0-12.4-4.5-12.4-11 0-5.4 3.1-10.2 8.1-13.6-.4 4 .9 6.4 2.8 7-1-5.6 2.6-10.1 3.2-16.4Z"/><path fill="#ffe28a" d="M520.3 139c2.7 2.9 3.9 5.2 3.6 7.6-.3 2.6-1.9 4.1-4.1 4.1-2.5 0-4.2-1.8-4.2-4.1 0-1.9.9-3.6 2.7-5.2-.1 1.8.7 2.7 1.6 3.1-.3-1.9.1-3.7.4-5.5Z"/><text x="558" y="150" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="22" font-weight="800" letter-spacing="5">FLAMES</text>',
      '<text x="540" y="220" text-anchor="middle" fill="#a08f82" font-family="Arial,sans-serif" font-size="16" font-weight="700" letter-spacing="4">RESULT REVEALED</text>',
      '<text x="540" y="310" text-anchor="middle" fill="#756b62" font-family="Arial,sans-serif" font-size="25" font-weight="700">'+pairA+' × '+pairB+'</text>',
      '<circle cx="540" cy="465" r="105" fill="#fff1d0" stroke="#f2dfb7" stroke-width="3"/>',
      '<text x="540" y="500" text-anchor="middle" font-family="Arial,sans-serif" font-size="82">'+escapeXml(result.emoji)+'</text>',
      '<text x="540" y="625" text-anchor="middle" fill="#a19589" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="5">THE FLAMES SAYS</text>',
      '<text x="540" y="720" text-anchor="middle" fill="#d95832" font-family="Arial,sans-serif" font-size="92" font-weight="800">'+escapeXml(result.name)+'</text>',
      '<text x="540" y="805" text-anchor="middle" fill="#70675f" font-family="Arial,sans-serif" font-size="23">'+escapeXml(result.messages[quipIndex])+'</text>',
      '<text x="540" y="980" text-anchor="middle" fill="#8d8176" font-family="Arial,sans-serif" font-size="17" font-weight="700" letter-spacing="3">PLAYFUL COMPATIBILITY</text>',
      '<text x="540" y="1045" text-anchor="middle" fill="#17120f" font-family="Arial,sans-serif" font-size="54" font-weight="800">'+pct+'%</text>',
      '<rect x="180" y="1085" width="720" height="16" rx="8" fill="#eee6dc"/><rect x="180" y="1085" width="'+(pct*7.2)+'" height="16" rx="8" fill="#d95832"/>',
      '<text x="540" y="1165" text-anchor="middle" fill="#a79d94" font-family="Arial,sans-serif" font-size="16">Just for fun · Not a real measure of compatibility</text>',
      '</svg>'
    ].join("");
    const url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml;charset=utf-8"})),image=new Image();
    image.onload=()=>{const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1350;const ctx=canvas.getContext("2d");ctx.drawImage(image,0,0);URL.revokeObjectURL(url);canvas.toBlob(resolve,"image/png")};
    image.onerror=()=>{URL.revokeObjectURL(url);resolve(null)};
    image.src=url;
  });
  const shareCard=async()=>{if(!result)return;trackEvent("share_clicked",{mode:secretMode?"secret_crush":"classic",result:key});try{const png=await createCardPng();if(!png)throw new Error("card");const file=new File([png],"flames-result.png",{type:"image/png"});if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:"My FLAMES result",text:shareText(),files:[file]});setShareOpen(false);return}const u=URL.createObjectURL(png);const aTag=document.createElement("a");aTag.href=u;aTag.download="flames-result.png";document.body.appendChild(aTag);aTag.click();aTag.remove();URL.revokeObjectURL(u);setShareNotice("Your result card was downloaded. You can now post it to Instagram, WhatsApp, Facebook or anywhere else.");}catch{}};
  const shareTo=(platform)=>{if(!result)return;trackEvent("share_clicked",{mode:secretMode?"secret_crush":"classic",result:key});const text=shareText(),url=resultUrl(),title="My FLAMES result";if(platform==="whatsapp")openShareUrl("https://wa.me/?text="+encodeURIComponent(text+" "+url));else if(platform==="x")openShareUrl("https://twitter.com/intent/tweet?text="+encodeURIComponent(text)+"&url="+encodeURIComponent(url));else if(platform==="facebook")openShareUrl("https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(url));else if(platform==="threads")openShareUrl("https://www.threads.net/intent/post?text="+encodeURIComponent(text+" "+url));else if(platform==="reddit")openShareUrl("https://www.reddit.com/submit?url="+encodeURIComponent(url)+"&title="+encodeURIComponent(title));else if(platform==="discord"){try{navigator.clipboard.writeText(text+" "+url)}catch{}openShareUrl("https://discord.com/app");setShareNotice("Result text copied. Paste it into the Discord chat you want.");}else if(platform==="instagram"){shareCard()}};
  const copy=async()=>{if(!result)return;trackEvent("copy_clicked",{result:key});const text=secretMode?"FLAMES result: "+a.trim()+" + Secret Crush = "+result.name+" 🔥":"FLAMES result: "+a.trim()+" + "+b.trim()+" = "+result.name+" 🔥";try{await navigator.clipboard.writeText(text);setCopied(true);window.setTimeout(()=>setCopied(false),1800)}catch{}};
  const download=()=>{if(!result)return;trackEvent("download_clicked",{result:key});downloadResultCard(a.trim(),b.trim(),key,pct,result.messages[quipIndex],secretMode);setDownloaded(true);window.setTimeout(()=>setDownloaded(false),2200)};

  const sendFeedback=async()=>{if(feedbackSending||(!feedbackRating&&!feedbackMessage.trim()))return;setFeedbackSending(true);const ok=await submitFeedback({rating:feedbackRating||null,category:feedbackCategory||null,message:feedbackMessage.trim()||null,path:location.pathname});setFeedbackSending(false);if(ok){setFeedbackSent(true);setFeedbackMessage("");setFeedbackRating("");setFeedbackCategory("");window.setTimeout(()=>{setFeedbackSent(false);setFeedbackOpen(false)},1400)}};
  const dismissMiniPromo=()=>{setMiniPromo(false);try{localStorage.setItem("flames_mini_promo_dismissed","1")}catch{}};
  return <main className={"app "+(secretMode?"secret-mode":"")}><div className="glow g1"/><div className="glow g2"/>
    {appMode?<AppNav profile={profile} streak={streak} view="game" setView={appNavigate||setView} onLogout={handleLogout}/>:<header className="main-navbar"><button className="brand" onClick={reset} aria-label="Back to FLAMES home"><span className="brand-icon"><img src="/favicon.svg" alt="" /></span><span className="brand-word">FLAMES</span></button><div className="header-right"><div className="fun"><i/> Just for fun</div>{user?<button className="header-logout" onClick={handleLogout}>Log out</button>:<div className="header-auth"><a className="header-link-button" href="/login">Log in</a><a className="header-link-button header-signup" href="/register">Create account</a></div>}</div></header>}
    {user&&!appMode&&<div className="account-strip"><div className="account-live"><span className="account-dot"></span><b>@{profile?.username||"flames"}</b><small>connected</small></div><div className="account-stats"><span>🔥 {streak} day streak</span><span>✦ {savedCount} saved {savedCount===1?"match":"matches"}</span></div><button onClick={handleLogout}>Log out</button></div>}
    <section className="shell">
      {!key&&!loading&&<><div className="mode-switch"><button type="button" className={!secretMode?"active":""} onClick={()=>setSecretMode(false)}>Classic FLAMES</button><button type="button" className={secretMode?"active":""} onClick={()=>setSecretMode(true)}>💘 Secret Crush</button></div>
        <div className="hero"><small>{secretMode?"02 · KEEP IT SECRET":"01 · NAME CHEMISTRY"}</small><h1>{secretMode?<>Your crush.<br/><em>Your secret.</em> Your result.</>:<>Two names.<br/><em>One unexpected</em> connection.</>}</h1><p>{secretMode?"Enter the name of the person on your mind. Their name stays hidden on the result.":"Bring two names together and let the classic FLAMES game reveal what kind of connection they have."}</p></div>
        <form className="card" onSubmit={start}><div className="label">{secretMode?"SECRET CRUSH MATCH":"START A MATCH"}<b>✦</b></div><div className="fields"><label>Your name<input value={a} onChange={e=>setA(e.target.value)} placeholder="e.g. Alex" maxLength={30} autoComplete="off"/></label><strong>+</strong><label>{secretMode?"Your crush's name":"Their name"}<input value={b} onChange={e=>setB(e.target.value)} placeholder={secretMode?"keep it secret 👀":"e.g. Jamie"} maxLength={30} autoComplete="off"/></label></div><button className="match" disabled={!a.trim()||!b.trim()}><span>{secretMode?"Reveal secret result":"Discover your match"}</span><b>↗</b></button><p className="note">{secretMode?"Their name stays on this device and is not saved by FLAMES.":(user?"Your result will be saved to your FLAMES account.":"No account needed. Just play.")}</p></form>
        <div className="letters">{LETTERS.map((letter,index)=><span style={{animationDelay:index*0.12+"s"}} key={letter}>{letter}</span>)}</div>
        {!appMode&&<>
          <button type="button" className="invite-home" onClick={inviteFriends}>🔥 Invite friends to play <b>↗</b></button>

          <section className="flames-info-section how-flames">
            <div className="info-heading"><small>THE CLASSIC GAME</small><h2>How FLAMES works.</h2><p>It is simple on purpose. Put two names in, let the letters do their thing, and see what comes out.</p></div>
            <div className="how-grid">
              <div className="how-item"><span>01</span><div><h3>Enter two names</h3><p>Use your name and the person you want to check.</p></div></div>
              <div className="how-item"><span>02</span><div><h3>FLAMES does the math</h3><p>Matching letters are crossed out and the classic elimination game runs.</p></div></div>
              <div className="how-item"><span>03</span><div><h3>Reveal the result</h3><p>One of six letters remains: Friends, Lovers, Affection, Marriage, Enemies or Siblings.</p></div></div>
            </div>
          </section>

          <section className="flames-info-section meaning-section">
            <div className="info-heading centered"><small>SIX POSSIBILITIES</small><h2>What will FLAMES say?</h2></div>
            <div className="meaning-grid">
              <div className="meaning-card"><b>F</b><div><strong>Friends</strong><span>Bestie energy 🤝</span></div></div>
              <div className="meaning-card"><b>L</b><div><strong>Lovers</strong><span>Romance detected ❤️</span></div></div>
              <div className="meaning-card"><b>A</b><div><strong>Affection</strong><span>Something sweet 💫</span></div></div>
              <div className="meaning-card"><b>M</b><div><strong>Marriage</strong><span>Skipping straight ahead 💍</span></div></div>
              <div className="meaning-card"><b>E</b><div><strong>Enemies</strong><span>Chaos incoming ⚡</span></div></div>
              <div className="meaning-card"><b>S</b><div><strong>Siblings</strong><span>Family vibes 🫶</span></div></div>
            </div>
          </section>

          <section className="flames-info-section final-invite-section">
            <div className="final-invite-inner">
              <div className="final-flame"><Flame/></div>
              <div><small>READY FOR ANOTHER ONE?</small><h2>Send FLAMES to someone.</h2><p>Drop the link in the group chat, challenge a friend, or keep your crush result to yourself. 👀</p></div>
              <button type="button" onClick={inviteFriends}>Invite someone ↗</button>
            </div>
          </section>
        </>}        </section></>}
      {loading&&<div className="loading"><div className="names"><b>{a.trim()}</b><span><Flame/></span><b>{secretMode?"Secret Crush":b.trim()}</b></div><div className="ring"><div><Flame/></div></div><p>{secretMode?"Checking the secret connection":"Calculating your connection"}<span>...</span></p><div className="bars"><i/><i/><i/><i/><i/></div></div>}
      {key&&result&&<div className={"result result-"+key.toLowerCase()}><div className="resulttop"><button onClick={reset}>← Try another person</button><small>{secretMode?"SECRET RESULT":"RESULT REVEALED"}</small></div><div className="resultcard"><div className="result-logo"><img src="/favicon.svg" alt="" /></div><div className="result-sparkles"><i/><i/><i/><i/><i/><i/></div><div className="pair">{displayPair}</div><div className="emoji">{result.emoji}</div><small>THE FLAMES SAYS</small><h2>{result.name}</h2><p>{result.messages[quipIndex]}</p><div className="compat"><div><span>PLAYFUL COMPATIBILITY</span><b>{pct}%</b></div><div className="meter"><i style={{width:pct+"%"}}/></div><small>Entertainment only — generated from the names.</small></div><div className="actions"><button className="share-primary" onClick={()=>{setShareNotice("");setShareOpen(true)}}>Share result ↗</button><button onClick={download}>{downloaded?"Downloaded ✓":"Download card ↓"}</button><button onClick={copy}>{copied?"Copied ✓":"Copy result"}</button></div></div><p className="disclaimer">FLAMES is a classic name game, not a real measure of relationship compatibility.</p>{!user&&!nudgeDismissed&&<div className="account-nudge"><div className="nudge-flame"><Flame/></div><div className="nudge-copy"><small>KEEP YOUR FLAMES</small><strong>Create an account today</strong><p>Save your results and keep your FLAMES history connected.</p></div><div className="nudge-actions"><a className="header-link-button header-signup" href="/register">Create account</a><button className="nudge-later" onClick={()=>setNudgeDismissed(true)}>Maybe later</button></div></div>}</div>}
    </section>
    {shareOpen&&<div className="share-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setShareOpen(false)}}><div className="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-title"><button className="share-close" type="button" aria-label="Close share options" onClick={()=>setShareOpen(false)}>×</button><div className="share-kicker">YOUR RESULT IS READY</div><h2 id="share-title">Share your FLAMES result</h2><p className="share-sub">Send the card directly, or choose a platform.</p><button className="share-card-btn" type="button" onClick={shareCard}>↗ <span>Share result card</span><small>Choose an app on your device</small></button><div className="share-divider"><span>or choose a platform</span></div><div className="platform-grid"><button type="button" onClick={()=>shareTo("x")}><b>𝕏</b><span>X</span></button><button type="button" onClick={()=>shareTo("instagram")}><b>◎</b><span>Instagram</span></button><button type="button" onClick={()=>shareTo("whatsapp")}><b>◔</b><span>WhatsApp</span></button><button type="button" onClick={()=>shareTo("facebook")}><b>f</b><span>Facebook</span></button><button type="button" onClick={()=>shareTo("threads")}><b>@</b><span>Threads</span></button><button type="button" onClick={()=>shareTo("reddit")}><b>●</b><span>Reddit</span></button><button type="button" onClick={()=>shareTo("discord")}><b>◌</b><span>Discord</span></button></div>{shareNotice&&<div className="share-notice">{shareNotice}</div>}<button type="button" className="share-copy-link" onClick={copy}>{copied?"Result copied ✓":"Copy result text"}</button><p className="share-footnote">On phones that support it, “Share result card” opens the system share sheet so the image can go straight to Instagram, WhatsApp, Facebook and other apps. On desktop, the platform buttons open their share pages.</p></div></div>}

    {!appMode&&<>
      <footer><span>FLAMES</span><span>Classic game · Modern experience</span><button type="button" className="feedback-link" onClick={()=>setFeedbackOpen(true)}>Feedback</button><span>🔥</span></footer>
          {miniPromo&&<aside className="mini-promo"><button className="mini-close" aria-label="Dismiss MINI BOX promotion" onClick={dismissMiniPromo}>×</button><div className="mini-promo-kicker">ANOTHER LITTLE THING</div><strong>Try MINI BOX</strong><p>Ask questions anonymously and get real human answers.</p><a href="https://minibox-app.vercel.app/" target="_blank" rel="noreferrer">Try MINI BOX ↗</a></aside>}
          {feedbackOpen&&<div className="feedback-backdrop" role="dialog" aria-modal="true" aria-label="FLAMES feedback"><div className="feedback-modal"><button className="feedback-close" onClick={()=>setFeedbackOpen(false)} aria-label="Close feedback">×</button>{feedbackSent?<div className="feedback-success"><div>✓</div><h3>Thanks for the feedback.</h3><p>It helps us improve FLAMES.</p></div>:<><small>OPTIONAL FEEDBACK</small><h3>How's FLAMES?</h3><p className="feedback-sub">Tell us what you think. You can close this without sending anything.</p><div className="feedback-ratings">{[["love_it","😍","Love it"],["good","🙂","Good"],["okay","😐","Okay"],["needs_work","😕","Needs work"]].map(([v,e,t])=><button key={v} type="button" className={feedbackRating===v?"selected":""} onClick={()=>setFeedbackRating(v)}><span>{e}</span>{t}</button>)}</div><div className="feedback-field"><label>Anything we should improve? <em>Optional</em></label><textarea value={feedbackMessage} onChange={e=>setFeedbackMessage(e.target.value)} maxLength={1000} placeholder="Tell us what you think..."/></div><div className="feedback-field"><label>Category <em>Optional</em></label><div className="feedback-cats">{[["bug","Bug"],["idea","Idea"],["ui","UI"],["game","Game"],["other","Other"]].map(([v,t])=><button key={v} type="button" className={feedbackCategory===v?"selected":""} onClick={()=>setFeedbackCategory(v)}>{t}</button>)}</div></div><button className="feedback-submit" disabled={feedbackSending||(!feedbackRating&&!feedbackMessage.trim())} onClick={sendFeedback}>{feedbackSending?"Sending...":"Send feedback"}</button></>}</div></div>}
    </>}  </main>;
}

function AppNavigate({children,path}){ return <button type="button" onClick={()=>{window.history.pushState({}, "", path);window.dispatchEvent(new PopStateEvent("popstate"));}}>{children}</button>; }

function AuthenticatedRouter({path,navigate}){
  const [authState,setAuthState]=useState("checking");
  const [user,setUser]=useState(null);
  const [profile,setProfile]=useState(null);
  const [recentMatches,setRecentMatches]=useState([]);
  const [savedCount,setSavedCount]=useState(0);
  const [streak,setStreak]=useState(0);

  const loadAccount=async(u)=>{
    if(!u)return;
    const [{data:p},{data:m}]=await Promise.all([
      supabase.from("flames_profiles").select("*").eq("id",u.id).single(),
      supabase.from("flames_matches").select("*").eq("user_id",u.id).order("created_at",{ascending:false}).limit(100)
    ]);
    let account=p||null;
    if(account&&(!Number.isInteger(account.avatar_id)||account.avatar_id<1||account.avatar_id>24)){
      const avatarId=(Array.from(u.id).reduce((n,ch)=>n+ch.charCodeAt(0),0)%24)+1;
      const {data:updated}=await supabase.from("flames_profiles").update({avatar_id:avatarId,updated_at:new Date().toISOString()}).eq("id",u.id).select().single();
      account=updated||account;
    }
    setProfile(account);
    setRecentMatches(m||[]);
    setSavedCount(m?.length||0);
    if(account){
      const today=new Date().toISOString().slice(0,10);
      if(account.last_active_date!==today){
        const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
        const next=account.last_active_date===yesterday?(account.streak_count||0)+1:1;
        const {data:updated}=await supabase.from("flames_profiles").update({streak_count:next,last_active_date:today,updated_at:new Date().toISOString()}).eq("id",u.id).select().single();
        setStreak(updated?.streak_count||next);
        setProfile(updated||account);
      }else setStreak(account.streak_count||0);
    }
  };

  useEffect(()=>{
    let active=true;
    (async()=>{
      const {data}=await supabase.auth.getUser();
      if(!active)return;
      const u=data?.user||null;
      if(!u){
        setAuthState("unauthenticated");
        window.location.replace("/login");
        return;
      }
      setUser(u);
      await loadAccount(u);
      if(active)setAuthState("authenticated");
    })();
    return()=>{active=false};
  },[]);

  const logout=async()=>{await signOut();window.location.replace("/")};
  const nav=(next)=>{const target=next==="dashboard"?"/app":next==="game"?"/app/play":"/app/"+next;window.history.pushState({}, "", target);window.dispatchEvent(new PopStateEvent("popstate"))};

  if(authState!=="authenticated")return <main className="dashboard-boot"><div className="dashboard-brand-mark"><Flame/></div><span>Loading your FLAMES space…</span></main>;
  if(path==="/app/play")return <PublicGame initialView="game" appMode appNavigate={nav}/>;
  if(path==="/app/create")return <CreateGamePage profile={profile} streak={streak} setView={nav} user={user}/>;
  if(path==="/app/history")return <HistoryPage profile={profile} streak={streak} recentMatches={recentMatches} setView={nav}/>;
  if(path==="/app/achievements")return <AchievementsPage profile={profile} streak={streak} recentMatches={recentMatches} savedCount={savedCount} setView={nav}/>;
  if(path==="/app/profile")return <ProfilePage profile={profile} streak={streak} savedCount={savedCount} recentMatches={recentMatches} setView={nav} onLogout={logout}/>;
  if(path==="/app/settings")return <SettingsPage profile={profile} streak={streak} setView={nav} onLogout={logout}/>;
  if(path==="/app/circle")return <CirclePage profile={profile} streak={streak} user={user} setView={nav}/>;
  return <Dashboard profile={profile} savedCount={savedCount} streak={streak} recentMatches={recentMatches} setView={nav}/>;
}

export default function App(){
  const [path,setPath]=useState(()=>location.pathname.replace(/\/$/,"")||"/");
  const [authReady,setAuthReady]=useState(false);
  const [user,setUser]=useState(null);

  useEffect(()=>{
    let active=true;
    const onPop=()=>setPath(location.pathname.replace(/\/$/,"")||"/");
    window.addEventListener("popstate",onPop);
    (async()=>{
      const {data}=await supabase.auth.getUser();
      if(!active)return;
      setUser(data?.user||null);
      setAuthReady(true);
    })();
    return()=>{active=false;window.removeEventListener("popstate",onPop)};
  },[]);

  useEffect(()=>{
    if(!authReady)return;
    const publicAuth=["/login","/register","/forgot-password","/reset-password"];
    if(user&&path==="/"){window.history.replaceState({}, "", "/app");setPath("/app");return;}
    if(user&&publicAuth.includes(path)){window.history.replaceState({}, "", "/app");setPath("/app");}
    if(!user&&path.startsWith("/app")){window.history.replaceState({}, "", "/login");setPath("/login");}
  },[authReady,user,path]);

  if(path==="/login")return <AuthPage type="login"/>;
  if(path==="/register")return <AuthPage type="register"/>;
  if(path==="/forgot-password")return <ForgotPasswordPage/>;
  if(path==="/reset-password")return <ResetPasswordPage/>;
  if(!authReady)return <main className="dashboard-boot"><div className="dashboard-brand-mark"><Flame/></div><span>Opening FLAMES…</span></main>;
  if(path.startsWith("/app"))return <AuthenticatedRouter path={path}/>;
  const gameMatch=path.match(/^\/game\/([0-9a-f-]+)$/i);
  if(gameMatch)return <PublicGameQuestion gameId={gameMatch[1]}/>;
  return <PublicGame initialView="dashboard"/>;
}
