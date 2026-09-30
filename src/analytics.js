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
    await fetch("/api/analytics",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({type:"event",event:name,sessionId:sessionId(),properties}),
      keepalive:true
    });
  }catch{}
}
