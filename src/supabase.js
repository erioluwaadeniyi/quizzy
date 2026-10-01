const SUPABASE_URL = "https://lbkhadjmkwtrbzwkuhyn.supabase.co";
const SUPABASE_KEY = "sb_publishable_NQ17m1yFOZf-6Yg69U3kWQ_yOzFgKkK";
const SESSION_KEY = "flames_supabase_session";

const listeners = new Set();

function readSession(){
  try{return JSON.parse(localStorage.getItem(SESSION_KEY)||"null")}catch{return null}
}
function writeSession(session){
  try{
    if(session)localStorage.setItem(SESSION_KEY,JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }catch{}
}
function decodeJwt(token){
  try{
    const part=token.split(".")[1];
    return JSON.parse(atob(part.replace(/-/g,"+").replace(/_/g,"/")));
  }catch{return null}
}
async function refreshIfNeeded(){
  let session=readSession();
  if(!session?.access_token)return null;
  const claims=decodeJwt(session.access_token);
  if(!claims?.exp || claims.exp*1000>Date.now()+30000)return session;
  if(!session.refresh_token)return null;
  const r=await fetch(SUPABASE_URL+"/auth/v1/token?grant_type=refresh_token",{
    method:"POST",
    headers:{"apikey":SUPABASE_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({refresh_token:session.refresh_token})
  });
  if(!r.ok){writeSession(null);return null}
  const next=await r.json();writeSession(next);return next;
}
async function authFetch(path,options={}){
  const session=await refreshIfNeeded();
  const headers={apikey:SUPABASE_KEY,Accept:"application/json",...(options.headers||{})};
  headers.Authorization="Bearer "+(session?.access_token||SUPABASE_KEY);
  return fetch(SUPABASE_URL+path,{...options,headers});
}
function emit(event,session){
  listeners.forEach(fn=>{try{fn(event,session)}catch{}});
}
async function getUser(){
  const session=await refreshIfNeeded();
  if(!session?.access_token)return null;
  const r=await authFetch("/auth/v1/user");
  if(!r.ok)return null;
  return r.json();
}
async function signIn(email,password){
  try{
    const r=await fetch(SUPABASE_URL+"/auth/v1/token?grant_type=password",{
      method:"POST",
      headers:{apikey:SUPABASE_KEY, "Content-Type":"application/json"},
      body:JSON.stringify({email,password})
    });
    const body=await r.json().catch(()=>({}));
    if(!r.ok)return {data:{user:null,session:null},error:{message:body.error_description||body.msg||"Unable to log in."}};
    writeSession(body);emit("SIGNED_IN",body);return {data:{user:body.user,session:body},error:null};
  }catch(e){return {data:{user:null,session:null},error:{message:e.message||"Network error."}}}
}
async function signUp(email,password,metadata){
  try{
    const r=await fetch(SUPABASE_URL+"/auth/v1/signup",{
      method:"POST",
      headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({email,password,data:metadata})
    });
    const body=await r.json().catch(()=>({}));
    if(!r.ok)return {data:{user:null,session:null},error:{message:body.msg||body.error_description||"Unable to create account."}};
    if(body.access_token)writeSession(body);emit(body.access_token?"SIGNED_IN":"SIGNED_UP",body.access_token?body:null);
    return {data:{user:body.user||body,session:body.access_token?body:null},error:null};
  }catch(e){return {data:{user:null,session:null},error:{message:e.message||"Network error."}}}
}
async function signOut({silent=false}={}){
  const session=readSession();
  try{if(session?.access_token)await authFetch("/auth/v1/logout",{method:"POST"})}catch{}
  writeSession(null);emit("SIGNED_OUT",null);return {error:null};
}
function buildRequest(table){
  let method="GET",body=null,filters=[],orderBy="",limitValue="",single=false,returnData=false;
  const api={
    select(columns="*"){return make("/rest/v1/"+table,{method:"GET",params:{select:columns}})},
    insert(payload){method="POST";body=payload;return make("/rest/v1/"+table,{method,body,headers:{"Prefer":"return=representation"}})},
    update(payload){method="PATCH";body=payload;return make("/rest/v1/"+table,{method,body,headers:{"Prefer":"return=representation"}})},
  };
  function make(path,state){
    const params=new URLSearchParams(state.params||{});
    const obj={
      eq(column,value){params.set(column,"eq."+value);return obj},
      ilike(column,value){params.set(column,"ilike."+value);return obj},
      in(column,values){params.set(column,"in.("+values.join(",")+")");return obj},
      or(expression){params.set("or","("+expression+")");return obj},
      order(column,{ascending=true}={}){params.set("order",column+"."+(ascending?"asc":"desc"));return obj},
      limit(n){params.set("limit",String(n));return obj},
      select(columns="*"){return make(path,{...state,returnData:true,params:new URLSearchParams(params)})},
      single(){single=true;return run()},
      then(resolve,reject){return run().then(resolve,reject)},
    };
    async function run(){
      try{
        const target=path+(params.toString()?"?"+params.toString():"");
        const r=await authFetch(target,{method:state.method||"GET",body:state.body?JSON.stringify(state.body):undefined,headers:state.headers});
        const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch{}
        if(!r.ok){return {data:null,error:{message:data?.message||data?.hint||data?.details||"Request failed."},status:r.status,count:null}}
        if(single)data=Array.isArray(data)?(data[0]||null):data;
        return {data,error:null,status:r.status,count:null};
      }catch(e){return {data:null,error:{message:e.message||"Network error."},status:0,count:null}}
    }
    return obj;
  }
  return api;
}
export const supabase={
  auth:{
    getUser:async()=>({data:{user:await getUser()}}),
    signInWithPassword:({email,password})=>signIn(email,password),
    signUp:({email,password,options})=>signUp(email,password,options?.data||{}),
    signOut,
    onAuthStateChange(callback){listeners.add(callback);return {data:{subscription:{unsubscribe:()=>listeners.delete(callback)}}}}
  },
  from:buildRequest
};
