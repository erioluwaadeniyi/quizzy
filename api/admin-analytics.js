import crypto from "node:crypto";

const cookieName="flames_admin";
const owner=process.env.ANALYTICS_GITHUB_OWNER || "erioluwaadeniyi";
const repo=process.env.ANALYTICS_GITHUB_REPO || "quizzy";
const branch=process.env.ANALYTICS_GITHUB_BRANCH || "master";

function sign(v){return crypto.createHmac("sha256",process.env.ADMIN_PASSWORD||"").update(v).digest("base64url");}
function token(){const v=String(Date.now());return v+"."+sign(v);}
function valid(t){
  if(!t)return false;
  const [v,s]=t.split(".");
  const e=sign(v||"");
  return !!v&&!!s&&s.length===e.length&&crypto.timingSafeEqual(Buffer.from(s),Buffer.from(e))&&Date.now()-Number(v)<604800000;
}
function send(res,status,body,headers={}){
  res.statusCode=status;
  for(const [k,v] of Object.entries(headers))res.setHeader(k,v);
  res.setHeader("Content-Type","application/json");
  res.setHeader("Cache-Control","no-store");
  res.end(JSON.stringify(body));
}
function ghHeaders(){return {Authorization:"Bearer "+process.env.ANALYTICS_GITHUB_TOKEN,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};}

async function readDay(path){
  const r=await fetch("https://api.github.com/repos/"+owner+"/"+repo+"/contents/"+path+"?ref="+encodeURIComponent(branch),{headers:ghHeaders()});
  if(r.status===404)return [];
  const d=await r.json();
  if(!r.ok)throw new Error(d.message||"Analytics storage read failed");
  return JSON.parse(Buffer.from(d.content.replace(/\n/g,""),"base64").toString("utf8"));
}

export default async function handler(req,res){
  if(req.method==="POST"){
    let b={};try{b=typeof req.body==="string"?JSON.parse(req.body):req.body||{}}catch{}
    if(!process.env.ADMIN_PASSWORD||b.password!==process.env.ADMIN_PASSWORD)return send(res,401,{error:"Invalid admin password"});
    return send(res,200,{ok:true},{"Set-Cookie":cookieName+"="+token()+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800"});
  }

  const cookies=Object.fromEntries((req.headers.cookie||"").split(";").filter(Boolean).map(x=>{const i=x.indexOf("=");return[x.slice(0,i).trim(),decodeURIComponent(x.slice(i+1))]}));
  if(!valid(cookies[cookieName]))return send(res,401,{error:"Unauthorized"});
  if(!process.env.ANALYTICS_GITHUB_TOKEN)return send(res,503,{error:"Custom analytics storage is not configured. Add ANALYTICS_GITHUB_TOKEN to the project."});

  try{
    const days=Math.min(Math.max(Number(req.query?.days||7),1),90);
    const all=[];
    for(let i=0;i<days;i++){
      const d=new Date(Date.now()-i*86400000);
      const key=d.toISOString().slice(0,10);
      all.push(...await readDay("analytics/events/"+key+".json"));
    }

    const sessions=new Set(),events={},results={},daily={};
    let classic=0,secret=0;
    for(const e of all){
      events[e.event]=(events[e.event]||0)+1;
      if(e.sessionId)sessions.add(e.sessionId);
      const day=String(e.at).slice(0,10);daily[day]=(daily[day]||0)+1;
      if(e.event==="match_completed"){
        if(e.properties?.mode==="classic")classic++;
        if(e.properties?.mode==="secret_crush")secret++;
        if(e.properties?.result)results[e.properties.result]=(results[e.properties.result]||0)+1;
      }
    }
    return send(res,200,{
      source:"FLAMES custom analytics",
      days,
      uniqueVisitors:sessions.size,
      pageviews:events.page_view||0,
      matchesStarted:events.match_started||0,
      matchesCompleted:events.match_completed||0,
      classicMatches:classic,
      secretCrushMatches:secret,
      shares:events.share_clicked||0,
      downloads:events.download_clicked||0,
      invites:events.invite_clicked||0,
      copies:events.copy_clicked||0,
      totalEvents:all.length,
      events,results,daily
    });
  }catch(e){return send(res,500,{error:e.message});}
}
