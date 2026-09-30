const events=globalThis.__flamesAnalytics||(globalThis.__flamesAnalytics=[]);
globalThis.__flamesAnalytics=events;

const allowed=new Set(["page_view","match_started","match_completed","invite_clicked","share_clicked","copy_clicked","download_clicked"]);

export default async function handler(req,res){
  res.setHeader("Content-Type","application/json");
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST"){res.statusCode=405;return res.end(JSON.stringify({error:"Method not allowed"}));}
  try{
    const body=typeof req.body==="string"?JSON.parse(req.body):req.body||{};
    if(body.type!=="event"||!allowed.has(body.event)){res.statusCode=400;return res.end(JSON.stringify({error:"Invalid event"}));}
    events.push({
      event:body.event,
      sessionId:String(body.sessionId||"").slice(0,80),
      properties:body.properties&&typeof body.properties==="object"?body.properties:{},
      at:new Date().toISOString()
    });
    if(events.length>10000)events.splice(0,events.length-10000);
    res.statusCode=202;
    res.end(JSON.stringify({ok:true}));
  }catch{
    res.statusCode=400;
    res.end(JSON.stringify({error:"Invalid analytics event"}));
  }
}
