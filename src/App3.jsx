import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { trackEvent } from "./analytics.js";
import { submitFeedback } from "./feedback.js";
import { supabase } from "./supabase.js";
import { signIn, signOut, signUp } from "./auth.js";

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


function AuthModal({mode,onClose,onAuthed,success,successName}){
  const [kind,setKind]=useState(mode||"login");
  const [name,setName]=useState("");
  const [username,setUsername]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [usernameState,setUsernameState]=useState("idle");
  const [usernameMessage,setUsernameMessage]=useState("");

  useEffect(()=>{
    if(kind!=="signup"){setUsernameState("idle");setUsernameMessage("");return}
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
  },[username,kind]);

  const submit=async e=>{
    e.preventDefault();setError("");
    if(kind==="signup"){
      if(!name.trim()){setError("Enter your full name.");return}
      if(usernameState!=="success"){setError("Choose an available username.");return}
      if(!/^\S+@\S+\.\S+$/.test(email.trim())){setError("Enter a valid email address.");return}
    }
    setBusy(true);
    const r=kind==="login"?await signIn({email,password}):await signUp({email,password,displayName:name.trim(),username:username.trim().toLowerCase()});
    setBusy(false);
    if(r.error){setError(r.error.message||"Could not complete that request.");return}
    if(kind==="signup"&&!r.data?.session){setError("Your account was created, but email confirmation is still enabled. Disable Confirm email in Supabase to enter immediately.");return}
    onAuthed(r.data?.user||null);
  };

  if(success)return <div className="auth-backdrop"><div className="flames-auth-success">
    <div className="success-orbit"><span>F</span><span>L</span><span>A</span><span>M</span><span>E</span><span>S</span><div className="success-fire"><Flame/></div></div>
    <div className="auth-kicker">YOU'RE IN</div>
    <h2>Welcome to your FLAMES.</h2>
    <p>{successName||"Your account"} is now connected. Your future results can stay with you instead of disappearing after the game.</p>
    <div className="unlock-grid">
      <div><b>🔥</b><strong>Save results</strong><span>Your FLAMES matches stay attached to your account.</span></div>
      <div><b>⚡</b><strong>Build a streak</strong><span>Keep playing and your FLAMES streak grows.</span></div>
      <div><b>✨</b><strong>Keep your identity</strong><span>Your FLAMES username stays yours across sessions.</span></div>
    </div>
    <button className="auth-primary" onClick={onClose}>Keep playing</button>
  </div></div>;

  return <div className="auth-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div className="flames-auth-modal">
      <button className="auth-close" type="button" onClick={onClose}>×</button>
      <div className="auth-flame-mark"><Flame/></div>
      <div className="auth-kicker">{kind==="login"?"WELCOME BACK":"JOIN FLAMES"}</div>
      <h2>{kind==="login"?"Come back to your FLAMES.":"Create your FLAMES account."}</h2>
      <p>{kind==="login"?"Your game stays free. Your account keeps the things you build.":"One small account. More FLAMES to keep."}</p>
      {kind==="signup"&&<div className="signup-unlock">
        <small>UNLOCK WITH AN ACCOUNT</small>
        <div className="unlock-row"><span>🔥</span><div><strong>Save every result</strong><em>Never lose a FLAMES match you want to remember.</em></div></div>
        <div className="unlock-row"><span>⚡</span><div><strong>Keep your streak alive</strong><em>Your play builds a personal FLAMES streak.</em></div></div>
        <div className="unlock-row"><span>✨</span><div><strong>Have your own FLAMES identity</strong><em>Your unique @username stays connected to your account.</em></div></div>
      </div>}
      {kind==="signup"&&<>
        <label>Full name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Alex Johnson" autoComplete="name"/><small className="auth-hint">Full names can be identical.</small></label>
        <label>FLAMES username<div className="username-field"><span className="username-prefix">@</span><input value={username} onChange={e=>setUsername(e.target.value.replace(/[^a-z0-9_]/g,"").slice(0,20))} placeholder="e.g. alexjohnson" autoComplete="username"/></div>{usernameMessage&&<small className={"field-status "+usernameState}>{usernameMessage}</small>}</label>
      </>}
      <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="e.g. alex@gmail.com" autoComplete="email"/></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={kind==="login"?"Enter your password":"Create a password (6+ characters)"} autoComplete={kind==="login"?"current-password":"new-password"}/></label>
      {error&&<div className="auth-error">{error}</div>}
      <button className="auth-primary" disabled={busy||!email||password.length<6||(kind==="signup"&&usernameState!=="success")} onClick={submit}>{busy?"Please wait…":kind==="login"?"Log in":"Create account"}</button>
      <button type="button" className="auth-switch" onClick={()=>{setKind(kind==="login"?"signup":"login");setError("")}}>{kind==="login"?"New to FLAMES? Create an account":"Already have an account? Log in"}</button>
    </div>
  </div>
}

export default function App(){
  const [user,setUser]=useState(null),[profile,setProfile]=useState(null),[savedCount,setSavedCount]=useState(0),[streak,setStreak]=useState(0),[authOpen,setAuthOpen]=useState(false),[authMode,setAuthMode]=useState("login"),[authSuccess,setAuthSuccess]=useState(false),[authSuccessName,setAuthSuccessName]=useState(""),[nudgeDismissed,setNudgeDismissed]=useState(false),[a,setA]=useState(""),[b,setB]=useState(""),[key,setKey]=useState(null),[loading,setLoading]=useState(false),[copied,setCopied]=useState(false),[downloaded,setDownloaded]=useState(false),[secretMode,setSecretMode]=useState(false),[quipIndex,setQuipIndex]=useState(0),[shareOpen,setShareOpen]=useState(false),[shareNotice,setShareNotice]=useState(""),[feedbackOpen,setFeedbackOpen]=useState(false),[feedbackRating,setFeedbackRating]=useState(""),[feedbackCategory,setFeedbackCategory]=useState(""),[feedbackMessage,setFeedbackMessage]=useState(""),[feedbackSent,setFeedbackSent]=useState(false),[feedbackSending,setFeedbackSending]=useState(false),[miniPromo,setMiniPromo]=useState(()=>{try{return localStorage.getItem("flames_mini_promo_dismissed")!=="1"}catch{return true}});
  const loadAccount=async(u)=>{if(!u)return;const [{data:p},{data:m}]=await Promise.all([supabase.from("flames_profiles").select("*").eq("id",u.id).single(),supabase.from("flames_matches").select("id").eq("user_id",u.id).limit(100)]);setProfile(p||null);setSavedCount(m?.length||0);if(p){const today=new Date().toISOString().slice(0,10);if(p.last_active_date!==today){const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);const next=p.last_active_date===yesterday?(p.streak_count||0)+1:1;const {data:updated}=await supabase.from("flames_profiles").update({streak_count:next,last_active_date:today,updated_at:new Date().toISOString()}).eq("id",u.id).select().single();if(updated){setProfile(updated);setStreak(updated.streak_count||0)}}else setStreak(p.streak_count||0)}};
  useEffect(()=>{supabase.auth.getUser().then(async({data})=>{if(data?.user){setUser(data.user);await loadAccount(data.user)}});const {data:sub}=supabase.auth.onAuthStateChange(async(_,session)=>{const u=session?.user||null;setUser(u);if(u)await loadAccount(u);else{setProfile(null);setSavedCount(0);setStreak(0)}});return()=>sub.subscription.unsubscribe()},[]);
  const openAuth=mode=>{setAuthMode(mode);setAuthSuccess(false);setAuthOpen(true)};
  const finishAuth=async()=>{const {data}=await supabase.auth.getUser();if(data?.user){setUser(data.user);await loadAccount(data.user);setAuthSuccessName(data.user.user_metadata?.display_name||"FLAMES Friend");setAuthSuccess(true)}};
  const closeAuth=()=>{setAuthOpen(false);setAuthSuccess(false)};
  const handleLogout=async()=>{await signOut();setUser(null);setProfile(null);setSavedCount(0);setStreak(0)};
  const saveMatch=async(k,message)=>{if(!user)return;const {error}=await supabase.from("flames_matches").insert({user_id:user.id,name_a:a.trim(),name_b:b.trim(),result_key:k,percent:score(a,b),message,secret_mode:secretMode});if(!error)setSavedCount(v=>v+1)};
  const result=key?RESULTS[key]:null;
  const pct=useMemo(()=>key?score(a,b):0,[a,b,key]);
  const displayPair=secretMode?a.trim()+" × Secret Crush":a.trim()+" × "+b.trim();

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
    <header className="main-navbar"><button className="brand" onClick={reset} aria-label="Back to FLAMES home"><span className="brand-icon"><img src="/favicon.svg" alt="" /></span><span className="brand-word">FLAMES</span></button><div className="header-right"><div className="fun"><i/> Just for fun</div>{user?<button className="header-logout" onClick={handleLogout}>Log out</button>:<div className="header-auth"><button onClick={()=>openAuth("login")}>Log in</button><button className="header-signup" onClick={()=>openAuth("signup")}>Create account</button></div>}</div></header>
    {user&&<div className="account-strip"><div className="account-live"><span className="account-dot"></span><b>@{profile?.username||"flames"}</b><small>connected</small></div><div className="account-stats"><span>🔥 {streak} day streak</span><span>✦ {savedCount} saved {savedCount===1?"match":"matches"}</span></div><button onClick={handleLogout}>Log out</button></div>}
    <section className="shell">
      {!key&&!loading&&<><div className="mode-switch"><button type="button" className={!secretMode?"active":""} onClick={()=>setSecretMode(false)}>Classic FLAMES</button><button type="button" className={secretMode?"active":""} onClick={()=>setSecretMode(true)}>💘 Secret Crush</button></div>
        <div className="hero"><small>{secretMode?"02 · KEEP IT SECRET":"01 · NAME CHEMISTRY"}</small><h1>{secretMode?<>Your crush.<br/><em>Your secret.</em> Your result.</>:<>Two names.<br/><em>One unexpected</em> connection.</>}</h1><p>{secretMode?"Enter the name of the person on your mind. Their name stays hidden on the result.":"Bring two names together and let the classic FLAMES game reveal what kind of connection they have."}</p></div>
        <form className="card" onSubmit={start}><div className="label">{secretMode?"SECRET CRUSH MATCH":"START A MATCH"}<b>✦</b></div><div className="fields"><label>Your name<input value={a} onChange={e=>setA(e.target.value)} placeholder="e.g. Alex" maxLength={30} autoComplete="off"/></label><strong>+</strong><label>{secretMode?"Your crush's name":"Their name"}<input value={b} onChange={e=>setB(e.target.value)} placeholder={secretMode?"keep it secret 👀":"e.g. Jamie"} maxLength={30} autoComplete="off"/></label></div><button className="match" disabled={!a.trim()||!b.trim()}><span>{secretMode?"Reveal secret result":"Discover your match"}</span><b>↗</b></button><p className="note">{secretMode?"Their name stays on this device and is not saved by FLAMES.":(user?"Your result will be saved to your FLAMES account.":"No account needed. Just play.")}</p></form>
        <div className="letters">{LETTERS.map((letter,index)=><span style={{animationDelay:index*0.12+"s"}} key={letter}>{letter}</span>)}</div>
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
        </section></>}
      {loading&&<div className="loading"><div className="names"><b>{a.trim()}</b><span><Flame/></span><b>{secretMode?"Secret Crush":b.trim()}</b></div><div className="ring"><div><Flame/></div></div><p>{secretMode?"Checking the secret connection":"Calculating your connection"}<span>...</span></p><div className="bars"><i/><i/><i/><i/><i/></div></div>}
      {key&&result&&<div className={"result result-"+key.toLowerCase()}><div className="resulttop"><button onClick={reset}>← Try another person</button><small>{secretMode?"SECRET RESULT":"RESULT REVEALED"}</small></div><div className="resultcard"><div className="result-logo"><img src="/favicon.svg" alt="" /></div><div className="result-sparkles"><i/><i/><i/><i/><i/><i/></div><div className="pair">{displayPair}</div><div className="emoji">{result.emoji}</div><small>THE FLAMES SAYS</small><h2>{result.name}</h2><p>{result.messages[quipIndex]}</p><div className="compat"><div><span>PLAYFUL COMPATIBILITY</span><b>{pct}%</b></div><div className="meter"><i style={{width:pct+"%"}}/></div><small>Entertainment only — generated from the names.</small></div><div className="actions"><button className="share-primary" onClick={()=>{setShareNotice("");setShareOpen(true)}}>Share result ↗</button><button onClick={download}>{downloaded?"Downloaded ✓":"Download card ↓"}</button><button onClick={copy}>{copied?"Copied ✓":"Copy result"}</button></div></div><p className="disclaimer">FLAMES is a classic name game, not a real measure of relationship compatibility.</p>{!user&&!nudgeDismissed&&<div className="account-nudge"><div className="nudge-flame"><Flame/></div><div className="nudge-copy"><small>KEEP YOUR FLAMES</small><strong>Create an account today</strong><p>Save your results and keep your FLAMES history connected.</p></div><div className="nudge-actions"><button onClick={()=>openAuth("signup")}>Create account</button><button className="nudge-later" onClick={()=>setNudgeDismissed(true)}>Maybe later</button></div></div>}</div>}
    </section>
    {shareOpen&&<div className="share-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setShareOpen(false)}}><div className="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-title"><button className="share-close" type="button" aria-label="Close share options" onClick={()=>setShareOpen(false)}>×</button><div className="share-kicker">YOUR RESULT IS READY</div><h2 id="share-title">Share your FLAMES result</h2><p className="share-sub">Send the card directly, or choose a platform.</p><button className="share-card-btn" type="button" onClick={shareCard}>↗ <span>Share result card</span><small>Choose an app on your device</small></button><div className="share-divider"><span>or choose a platform</span></div><div className="platform-grid"><button type="button" onClick={()=>shareTo("x")}><b>𝕏</b><span>X</span></button><button type="button" onClick={()=>shareTo("instagram")}><b>◎</b><span>Instagram</span></button><button type="button" onClick={()=>shareTo("whatsapp")}><b>◔</b><span>WhatsApp</span></button><button type="button" onClick={()=>shareTo("facebook")}><b>f</b><span>Facebook</span></button><button type="button" onClick={()=>shareTo("threads")}><b>@</b><span>Threads</span></button><button type="button" onClick={()=>shareTo("reddit")}><b>●</b><span>Reddit</span></button><button type="button" onClick={()=>shareTo("discord")}><b>◌</b><span>Discord</span></button></div>{shareNotice&&<div className="share-notice">{shareNotice}</div>}<button type="button" className="share-copy-link" onClick={copy}>{copied?"Result copied ✓":"Copy result text"}</button><p className="share-footnote">On phones that support it, “Share result card” opens the system share sheet so the image can go straight to Instagram, WhatsApp, Facebook and other apps. On desktop, the platform buttons open their share pages.</p></div></div>}
    {authOpen&&<AuthModal mode={authMode} success={authSuccess} successName={authSuccessName} onClose={closeAuth} onAuthed={finishAuth}/>}<footer><span>FLAMES</span><span>Classic game · Modern experience</span><button type="button" className="feedback-link" onClick={()=>setFeedbackOpen(true)}>Feedback</button><span>🔥</span></footer>
    {miniPromo&&<aside className="mini-promo"><button className="mini-close" aria-label="Dismiss MINI BOX promotion" onClick={dismissMiniPromo}>×</button><div className="mini-promo-kicker">ANOTHER LITTLE THING</div><strong>Try MINI BOX</strong><p>Ask questions anonymously and get real human answers.</p><a href="https://minibox-app.vercel.app/" target="_blank" rel="noreferrer">Try MINI BOX ↗</a></aside>}
    {feedbackOpen&&<div className="feedback-backdrop" role="dialog" aria-modal="true" aria-label="FLAMES feedback"><div className="feedback-modal"><button className="feedback-close" onClick={()=>setFeedbackOpen(false)} aria-label="Close feedback">×</button>{feedbackSent?<div className="feedback-success"><div>✓</div><h3>Thanks for the feedback.</h3><p>It helps us improve FLAMES.</p></div>:<><small>OPTIONAL FEEDBACK</small><h3>How's FLAMES?</h3><p className="feedback-sub">Tell us what you think. You can close this without sending anything.</p><div className="feedback-ratings">{[["love_it","😍","Love it"],["good","🙂","Good"],["okay","😐","Okay"],["needs_work","😕","Needs work"]].map(([v,e,t])=><button key={v} type="button" className={feedbackRating===v?"selected":""} onClick={()=>setFeedbackRating(v)}><span>{e}</span>{t}</button>)}</div><div className="feedback-field"><label>Anything we should improve? <em>Optional</em></label><textarea value={feedbackMessage} onChange={e=>setFeedbackMessage(e.target.value)} maxLength={1000} placeholder="Tell us what you think..."/></div><div className="feedback-field"><label>Category <em>Optional</em></label><div className="feedback-cats">{[["bug","Bug"],["idea","Idea"],["ui","UI"],["game","Game"],["other","Other"]].map(([v,t])=><button key={v} type="button" className={feedbackCategory===v?"selected":""} onClick={()=>setFeedbackCategory(v)}>{t}</button>)}</div></div><button className="feedback-submit" disabled={feedbackSending||(!feedbackRating&&!feedbackMessage.trim())} onClick={sendFeedback}>{feedbackSending?"Sending...":"Send feedback"}</button></>}</div></div>}
  </main>;
}
