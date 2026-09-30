const SESSION_KEY="flames_analytics_session";

function sessionId(){
  try{
    let id=sessionStorage.getItem(SESSION_KEY);
    if(!id){ id=crypto.randomUUID(); sessionStorage.setItem(SESSION_KEY,id); }
    return id;
  }catch{return "anonymous";}
}

export async function trackEvent(name, properties={}){
  try{
    await fetch("/api/track",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        event:name,
        sessionId:sessionId(),
        path:location.pathname,
        referrer:document.referrer ? new URL(document.referrer).hostname : "",
        properties
      }),
      keepalive:true
    });
  }catch{}
}
