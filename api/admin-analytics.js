import crypto from "node:crypto";

const cookieName="flames_admin";
const blobApi="https://vercel.com/api/blob";
const daysLimit=90;

function sign(value){return crypto.createHmac("sha256",process.env.ADMIN_PASSWORD||"").update(value).digest("base64url");}
function makeToken(){const value=String(Date.now());return value+"."+sign(value);}
function validToken(token){
  if(!token)return false;
  const [value,signature]=token.split(".");
  if(!value||!signature)return false;
  const expected=sign(value);
  if(signature.length!==expected.length)return false;
  return crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)) && Date.now()-Number(value)<604800000;
}
function send(res,status,body,extra={}){
  res.statusCode=status;
  for(const [k,v] of Object.entries(extra))res.setHeader(k,v);
  res.setHeader("Content-Type","application/json");
  res.setHeader("Cache-Control","no-store");
  res.end(JSON.stringify(body));
}
function authHeaders(){return {"authorization":"Bearer "+process.env.BLOB_READ_WRITE_TOKEN,"x-api-version":"12"};}

async function blobList(prefix,limit=1000){
  const url=new URL(blobApi);
  url.searchParams.set("prefix",prefix);
  url.searchParams.set("limit",String(limit));
  const r=await fetch(url,{headers:authHeaders()});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.error?.message||"Analytics storage could not be read");
  return data;
}
async function blobRead(url){
  const r=await fetch(url,{headers:authHeaders()});
  if(!r.ok)throw new Error("Analytics event could not be read");
  return r.json();
}

export default async function handler(req,res){
  if(req.method==="POST"){
    let body={};try{body=typeof req.body==="string"?JSON.parse(req.body):req.body||{}}catch{}
    if(!process.env.ADMIN_PASSWORD||body.password!==process.env.ADMIN_PASSWORD)return send(res,401,{error:"Invalid admin password"});
    return send(res,200,{ok:true}, {"Set-Cookie":cookieName+"="+makeToken()+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800"});
  }

  const cookies=Object.fromEntries((req.headers.cookie||"").split(";").filter(Boolean).map(x=>{const i=x.indexOf("=");return[x.slice(0,i).trim(),decodeURIComponent(x.slice(i+1))]}));
  if(!validToken(cookies[cookieName]))return send(res,401,{error:"Unauthorized"});
  if(!process.env.BLOB_READ_WRITE_TOKEN)return send(res,503,{error:"BLOB_READ_WRITE_TOKEN is not configured. Connect a Vercel Blob store to this project."});

  try{
    const days=Math.min(Math.max(Number(req.query?.days||7),1),daysLimit);
    const prefix="analytics/events/";
    const listed=await blobList(prefix,1000);
    const cutoff=Date.now()-days*86400000;
    const files=(listed.blobs||[]).filter(b=>new Date(b.uploadedAt).getTime()>=cutoff);

    const events=[];
    for(const blob of files){
      try{events.push(await blobRead(blob.url));}catch{}
    }

    const sessions=new Set();
    const eventCounts={};
    const modeCounts={classic:0,secret_crush:0};
    const resultCounts={};
    const daily={};

    for(const e of events){
      const day=String(e.at||e.uploadedAt||"").slice(0,10)||"unknown";
      daily[day]=(daily[day]||0)+1;
      eventCounts[e.event]=(eventCounts[e.event]||0)+1;
      if(e.sessionId)sessions.add(e.sessionId);
      const mode=e.properties?.mode;
      if(e.event==="match_completed"&&modeCounts[mode]!==undefined)modeCounts[mode]++;
      if(e.event==="match_completed"&&e.properties?.result){
        const k=e.properties.result;
        resultCounts[k]=(resultCounts[k]||0)+1;
      }
    }

    return send(res,200,{
      source:"FLAMES first-party analytics",
      days,
      events:eventCounts,
      totalEvents:events.length,
      uniqueVisitors:sessions.size,
      pageviews:eventCounts.page_view||0,
      matchesStarted:eventCounts.match_started||0,
      matchesCompleted:eventCounts.match_completed||0,
      classicMatches:modeCounts.classic,
      secretCrushMatches:modeCounts.secret_crush,
      shares:eventCounts.share_clicked||0,
      downloads:eventCounts.download_clicked||0,
      invites:eventCounts.invite_clicked||0,
      copies:eventCounts.copy_clicked||0,
      results:resultCounts,
      daily
    });
  }catch(error){
    return send(res,502,{error:error.message});
  }
}
