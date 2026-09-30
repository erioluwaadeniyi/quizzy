import crypto from "node:crypto";

const cookieName="flames_admin";
const events=globalThis.__flamesAnalytics||(globalThis.__flamesAnalytics=[]);
globalThis.__flamesAnalytics=events;

function sign(v){return crypto.createHmac("sha256",process.env.ADMIN_PASSWORD||"").update(v).digest("base64url");}
function token(){const v=String(Date.now());return v+"."+sign(v);}
function valid(t){
  if(!t)return false;
  const [v,s]=t.split("."),e=sign(v||"");
  return !!v&&!!s&&s.length===e.length&&crypto.timingSafeEqual(Buffer.from(s),Buffer.from(e))&&Date.now()-Number(v)<604800000;
}
function send(res,status,body,headers={}){
  res.statusCode=status;
  for(const [k,v] of Object.entries(headers))res.setHeader(k,v);
  res.setHeader("Content-Type","application/json");
  res.setHeader("Cache-Control","no-store");
  res.end(JSON.stringify(body));
}
export default async function handler(req,res){
  if(req.method==="POST"){
    let b={};try{b=typeof req.body==="string"?JSON.parse(req.body):req.body||{}}catch{}
    if(!process.env.ADMIN_PASSWORD||b.password!==process.env.ADMIN_PASSWORD)return send(res,401,{error:"Invalid admin password"});
    return send(res,200,{ok:true},{"Set-Cookie":cookieName+"="+token()+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800"});
  }
  const cookies=Object.fromEntries((req.headers.cookie||"").split(";").filter(Boolean).map(x=>{const i=x.indexOf("=");return[x.slice(0,i).trim(),decodeURIComponent(x.slice(i+1))]}));
  if(!valid(cookies[cookieName]))return send(res,401,{error:"Unauthorized"});

  const days=Math.min(Math.max(Number(req.query?.days||7),1),90);
  const cutoff=Date.now()-days*86400000;
  const recent=events.filter(e=>new Date(e.at).getTime()>=cutoff);
  const sessions=new Set(),counts={},results={},daily={};
  let classic=0,secret=0;
  for(const e of recent){
    counts[e.event]=(counts[e.event]||0)+1;
    if(e.sessionId)sessions.add(e.sessionId);
    const day=e.at.slice(0,10);daily[day]=(daily[day]||0)+1;
    if(e.event==="match_completed"){
      if(e.properties?.mode==="classic")classic++;
      if(e.properties?.mode==="secret_crush")secret++;
      if(e.properties?.result)results[e.properties.result]=(results[e.properties.result]||0)+1;
    }
  }
  return send(res,200,{
    source:"FLAMES custom analytics",
    persistent:false,
    note:"Analytics are held in server memory and can reset when the server instance restarts.",
    days,
    uniqueVisitors:sessions.size,
    pageviews:counts.page_view||0,
    matchesStarted:counts.match_started||0,
    matchesCompleted:counts.match_completed||0,
    classicMatches:classic,
    secretCrushMatches:secret,
    shares:counts.share_clicked||0,
    downloads:counts.download_clicked||0,
    invites:counts.invite_clicked||0,
    copies:counts.copy_clicked||0,
    totalEvents:recent.length,
    events:counts,
    results,
    daily
  });
}
