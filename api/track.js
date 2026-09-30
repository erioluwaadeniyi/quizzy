import crypto from "node:crypto";

const allowed=new Set(["page_view","match_started","match_completed","invite_clicked","share_clicked","copy_clicked","download_clicked"]);
const owner=process.env.ANALYTICS_GITHUB_OWNER || "erioluwaadeniyi";
const repo=process.env.ANALYTICS_GITHUB_REPO || "quizzy";
const branch=process.env.ANALYTICS_GITHUB_BRANCH || "master";

function send(res,status,body){
  res.statusCode=status;
  res.setHeader("Content-Type","application/json");
  res.setHeader("Cache-Control","no-store");
  res.end(JSON.stringify(body));
}
function dateKey(){return new Date().toISOString().slice(0,10);}
function headers(){return {Authorization:"Bearer "+process.env.ANALYTICS_GITHUB_TOKEN,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};}

async function getFile(path){
  const r=await fetch("https://api.github.com/repos/"+owner+"/"+repo+"/contents/"+path+"?ref="+encodeURIComponent(branch),{headers:headers()});
  if(r.status===404)return {sha:null,data:[]};
  const d=await r.json();
  if(!r.ok)throw new Error(d.message||"Analytics storage read failed");
  return {sha:d.sha,data:JSON.parse(Buffer.from(d.content.replace(/\n/g,""),"base64").toString("utf8"))};
}
async function putFile(path,sha,data,message){
  const body={message,content:Buffer.from(JSON.stringify(data,null,2)+"\n").toString("base64"),branch};
  if(sha)body.sha=sha;
  const r=await fetch("https://api.github.com/repos/"+owner+"/"+repo+"/contents/"+path,{method:"PUT",headers:{...headers(),"Content-Type":"application/json"},body:JSON.stringify(body)});
  const d=await r.json();
  if(!r.ok)throw new Error(d.message||"Analytics storage write failed");
}

export default async function handler(req,res){
  if(req.method!=="POST")return send(res,405,{error:"Method not allowed"});
  if(!process.env.ANALYTICS_GITHUB_TOKEN)return send(res,503,{error:"Custom analytics is not configured. Add ANALYTICS_GITHUB_TOKEN."});
  try{
    const body=typeof req.body==="string"?JSON.parse(req.body):req.body||{};
    if(!allowed.has(body.event))return send(res,400,{error:"Unknown event"});
    const event={
      id:crypto.randomUUID(),
      event:body.event,
      sessionId:String(body.sessionId||"").slice(0,80),
      properties:body.properties&&typeof body.properties==="object"?body.properties:{},
      at:new Date().toISOString()
    };
    const path="analytics/events/"+dateKey()+".json";
    const current=await getFile(path);
    current.data.push(event);
    await putFile(path,current.sha,current.data,"analytics: record "+event.event);
    return send(res,202,{ok:true});
  }catch(error){
    return send(res,500,{error:error.message});
  }
}
