import crypto from "node:crypto";

const SUPABASE_URL="https://lbkhadjmkwtrbzwkuhyn.supabase.co";
function sign(v){return crypto.createHmac("sha256",process.env.ADMIN_PASSWORD||"").update(v).digest("base64url")}
function token(){const v=String(Date.now());return v+"."+sign(v)}
function valid(t){if(!t)return false;const[v,s]=t.split("."),e=sign(v||"");return !!v&&!!s&&s.length===e.length&&crypto.timingSafeEqual(Buffer.from(s),Buffer.from(e))&&Date.now()-Number(v)<604800000}
function send(res,status,body,headers={}){res.statusCode=status;for(const[k,v]of Object.entries(headers))res.setHeader(k,v);res.setHeader("Content-Type","application/json");res.setHeader("Cache-Control","no-store");res.end(JSON.stringify(body))}
async function query(path){const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!key)throw new Error("Supabase analytics is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the FLAMES deployment.");const r=await fetch(SUPABASE_URL+"/rest/v1/"+path,{headers:{apikey:key,Authorization:"Bearer "+key}});const d=await r.json().catch(()=>[]);if(!r.ok)throw new Error(d.message||"Supabase query failed");return d}
export default async function handler(req,res){
 if(req.method==="POST"){let b={};try{b=typeof req.body==="string"?JSON.parse(req.body):req.body||{}}catch{}if(!process.env.ADMIN_PASSWORD||b.password!==process.env.ADMIN_PASSWORD)return send(res,401,{error:"Invalid admin password"});return send(res,200,{ok:true},{"Set-Cookie":"flames_admin="+token()+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800"})}
 const cookies=Object.fromEntries((req.headers.cookie||"").split(";").filter(Boolean).map(x=>{const i=x.indexOf("=");return[x.slice(0,i).trim(),decodeURIComponent(x.slice(i+1))]}));if(!valid(cookies.flames_admin))return send(res,401,{error:"Unauthorized"});
 try{
  const days=Math.min(Math.max(Number(req.query?.days||7),1),90),since=new Date(Date.now()-days*86400000).toISOString(),today=new Date().toISOString().slice(0,10);
  const [events,profiles,matches,games,feedback]=await Promise.all([
   query("flames_analytics_events?select=event_name,session_id,visitor_id,user_id,mode,result_key,device_type,created_at&created_at=gte."+encodeURIComponent(since)+"&order=created_at.desc&limit=10000"),
   query("flames_profiles?select=id,username,display_name,streak_count,created_at,updated_at&order=created_at.desc&limit=500"),
   query("flames_matches?select=id,user_id,name_a,name_b,result_key,percent,secret_mode,created_at&created_at=gte."+encodeURIComponent(since)+"&order=created_at.desc&limit=500"),
   query("flames_games?select=id,creator_id,kind,title,prompt,created_at,expires_at&created_at=gte."+encodeURIComponent(since)+"&order=created_at.desc&limit=500"),
   query("flames_feedback?select=id,rating,category,message,path,status,created_at&created_at=gte."+encodeURIComponent(since)+"&order=created_at.desc&limit=500")
  ]);
  const sessions=new Set(),visitors=new Map(),eventsBy={},results={},daily={},deviceMix={};let classic=0,secret=0,gamesToday=0,activeToday=new Set();
  for(const e of events){
   eventsBy[e.event_name]=(eventsBy[e.event_name]||0)+1;if(e.session_id)sessions.add(e.session_id);
   if(e.visitor_id){let v=visitors.get(e.visitor_id);if(!v)v={visitor_id:e.visitor_id,device_type:e.device_type||"unknown",events:0,first_seen:e.created_at,last_seen:e.created_at};v.events++;if(e.created_at<v.first_seen)v.first_seen=e.created_at;if(e.created_at>v.last_seen)v.last_seen=e.created_at;visitors.set(e.visitor_id,v)}
   const day=e.created_at.slice(0,10);daily[day]=(daily[day]||0)+1;if(e.device_type)deviceMix[e.device_type]=(deviceMix[e.device_type]||0)+1;if(day===today&&e.visitor_id)activeToday.add(e.visitor_id);
   if(e.event_name==="match_completed"){if(e.mode==="classic")classic++;if(e.mode==="secret_crush")secret++;if(e.result_key)results[e.result_key]=(results[e.result_key]||0)+1;if(day===today)gamesToday++}
  }
  const openFeedback=feedback.filter(x=>!x.status||x.status==="open"||x.status==="new").length;
  return send(res,200,{source:"FLAMES custom analytics · Supabase",days,realUsers:profiles.length,uniqueVisitors:visitors.size,activeToday:activeToday.size,gamesToday,matchesStarted:eventsBy.match_started||0,matchesCompleted:eventsBy.match_completed||0,classicMatches:classic,secretCrushMatches:secret,questionGames:games.length,questions:games.length,newUsers:profiles.filter(x=>x.created_at>=since).length,openFeedback,feedbackCount:feedback.length,shares:eventsBy.share_clicked||0,downloads:eventsBy.download_clicked||0,invites:eventsBy.invite_clicked||0,copies:eventsBy.copy_clicked||0,totalEvents:events.length,events:eventsBy,results,daily,deviceMix,feedback,users:profiles,visitors:[...visitors.values()],questionList:games,feedbackCount:feedback.length});
 }catch(e){return send(res,500,{error:e.message})}
}