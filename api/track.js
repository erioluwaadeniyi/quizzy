import crypto from "node:crypto";

const MAX_BODY=6000;
const allowed=new Set([
  "page_view","match_started","match_completed","invite_clicked",
  "share_clicked","copy_clicked","download_clicked"
]);

function json(res,status,body){
  res.statusCode=status;
  res.setHeader("Content-Type","application/json");
  res.setHeader("Cache-Control","no-store");
  res.end(JSON.stringify(body));
}

function dayKey(d=new Date()){ return d.toISOString().slice(0,10); }

export default async function handler(req,res){
  if(req.method!=="POST") return json(res,405,{error:"Method not allowed"});
  try{
    if(!process.env.BLOB_READ_WRITE_TOKEN) return json(res,503,{error:"Analytics storage is not configured. Add a Vercel Blob store and BLOB_READ_WRITE_TOKEN."});
    const raw=typeof req.body==="string"?req.body:JSON.stringify(req.body||{});
    if(raw.length>MAX_BODY) return json(res,413,{error:"Payload too large"});
    const body=JSON.parse(raw);
    if(!allowed.has(body.event)) return json(res,400,{error:"Unknown event"});
    const event={
      id:crypto.randomUUID(),
      event:body.event,
      sessionId:String(body.sessionId||"").slice(0,80),
      path:String(body.path||"/").slice(0,120),
      referrer:String(body.referrer||"").slice(0,120),
      properties:body.properties&&typeof body.properties==="object"?body.properties:{},
      at:new Date().toISOString()
    };
    const safe=Buffer.from(JSON.stringify(event)).toString("base64url");
    const key=`analytics/events/${dayKey()}/${event.id}.json`;
    const response=await fetch("https://blob.vercel-storage.com/"+key,{
      method:"PUT",
      headers:{
        "authorization":"Bearer "+process.env.BLOB_READ_WRITE_TOKEN,
        "x-vercel-blob-access":"private",
        "x-content-type":"application/json",
        "x-add-random-suffix":"0"
      },
      body:Buffer.from(JSON.stringify({event,...event}))
    });
    if(!response.ok) return json(res,502,{error:"Analytics storage rejected the event"});
    return json(res,202,{ok:true});
  }catch(error){
    return json(res,400,{error:"Invalid analytics event"});
  }
}
