import crypto from "node:crypto";

const SUPABASE_URL="https://lbkhadjmkwtrbzwkuhyn.supabase.co";

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
async function query(path){
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!key)throw new Error("Supabase analytics is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the FLAMES deployment.");
  const r=await fetch(SUPABASE_URL+"/rest/v1/"+path,{headers:{apikey:key,Authorization:"Bearer "+key}});
  const d=await r.json().catch(()=>[]);
  if(!r.ok)throw new Error(d.message||"Supabase analytics query failed");
  return d;
}
export default async function handler(req,res){
  if(req.method==="POST"){
    let b={};try{b=typeof req.body==="string"?JSON.parse(req.body):req.body||{}}catch{}
    if(!process.env.ADMIN_PASSWORD||b.password!==process.env.ADMIN_PASSWORD)return send(res,401,{error:"Invalid admin password"});
    return send(res,200,{ok:true},{"Set-Cookie":"flames_admin="+token()+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800"});
  }
  const cookies=Object.fromEntries((req.headers.cookie||"").split(";").filter(Boolean).map(x=>{const i=x.indexOf("=");return[x.slice(0,i).trim(),decodeURIComponent(x.slice(i+1))]}));
  if(!valid(cookies.flames_admin))return send(res,401,{error:"Unauthorized"});
  try{
    const days=Math.min(Math.max(Number(req.query?.days||7),1),90);
    const since=new Date(Date.now()-days*86400000).toISOString();
    const rows=await query("flames_analytics_events?select=event_name,session_id,mode,result_key,created_at&created_at=gte."+encodeURIComponent(since)+"&order=created_at.desc&limit=10000");
    const feedback=await query("flames_feedback?select=id,rating,category,message,path,created_at&created_at=gte."+encodeURIComponent(since)+"&order=created_at.desc&limit=500");
    const sessions=new Set(),events={},results={},daily={};let classic=0,secret=0;
    for(const e of rows){
      events[e.event_name]=(events[e.event_name]||0)+1;
      if(e.session_id)sessions.add(e.session_id);
      const day=e.created_at.slice(0,10);daily[day]=(daily[day]||0)+1;
      if(e.event_name==="match_completed"){
        if(e.mode==="classic")classic++;
        if(e.mode==="secret_crush")secret++;
        if(e.result_key)results[e.result_key]=(results[e.result_key]||0)+1;
      }
    }
    return send(res,200,{source:"FLAMES custom analytics · Supabase",days,feedback,uniqueVisitors:sessions.size,pageviews:events.page_view||0,matchesStarted:events.match_started||0,matchesCompleted:events.match_completed||0,classicMatches:classic,secretCrushMatches:secret,shares:events.share_clicked||0,downloads:events.download_clicked||0,invites:events.invite_clicked||0,copies:events.copy_clicked||0,totalEvents:rows.length,events,results,daily});
  }catch(e){return send(res,500,{error:e.message});}
}
