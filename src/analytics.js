const SUPABASE_URL="https://lbkhadjmkwtrbzwkuhyn.supabase.co";
const SUPABASE_KEY="sb_publishable_NQ17m1yFOZf-6Yg69U3kWQ_yOzFgKkK";
const SESSION_KEY="flames_analytics_session";

function sessionId(){
  try{
    let id=sessionStorage.getItem(SESSION_KEY);
    if(!id){id=crypto.randomUUID();sessionStorage.setItem(SESSION_KEY,id);}
    return id;
  }catch{return "anonymous";}
}

export async function trackEvent(name,properties={}){
  try{
    const p=properties&&typeof properties==="object"?properties:{};
    await fetch(SUPABASE_URL+"/rest/v1/flames_analytics_events",{
      method:"POST",
      headers:{
        "apikey":SUPABASE_KEY,
        "Authorization":"Bearer "+SUPABASE_KEY,
        "Content-Type":"application/json",
        "Prefer":"return=minimal"
      },
      body:JSON.stringify({
        event_name:name,
        session_id:sessionId(),
        mode:p.mode==="classic"||p.mode==="secret_crush"?p.mode:null,
        result_key:["F","L","A","M","E","S"].includes(p.result)?p.result:null,
        path:location.pathname
      }),
      keepalive:true
    });
  }catch{}
}
