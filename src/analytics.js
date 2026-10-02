const SUPABASE_URL="https://lbkhadjmkwtrbzwkuhyn.supabase.co";
const SUPABASE_KEY="sb_publishable_NQ17m1yFOZf-6Yg69U3kWQ_yOzFgKkK";
const SESSION_KEY="flames_analytics_session";
const VISITOR_KEY="flames_web_unique_id";

function id(key,storage){
  try{
    let value=storage.getItem(key);
    if(!value){value=crypto.randomUUID();storage.setItem(key,value);}
    return value;
  }catch{return "anonymous";}
}
function sessionId(){return id(SESSION_KEY,sessionStorage)}
function visitorId(){return id(VISITOR_KEY,localStorage)}
function deviceType(){
  const w=window.innerWidth;
  return w<640?"mobile":w<1024?"tablet":"desktop";
}
export async function trackEvent(name,properties={}){
  try{
    const p=properties&&typeof properties==="object"?properties:{};
    await fetch(SUPABASE_URL+"/rest/v1/flames_analytics_events",{
      method:"POST",
      headers:{apikey:SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json","Prefer":"return=minimal"},
      body:JSON.stringify({
        event_name:name,session_id:sessionId(),visitor_id:visitorId(),
        mode:p.mode==="classic"||p.mode==="secret_crush"?p.mode:null,
        result_key:["F","L","A","M","E","S"].includes(p.result)?p.result:null,
        path:location.pathname,device_type:deviceType()
      }),keepalive:true
    });
  }catch{}
}
