import { supabase } from "./supabase.js";

const SUPABASE_URL = "https://lbkhadjmkwtrbzwkuhyn.supabase.co";
const SUPABASE_KEY = "sb_publishable_NQ17m1yFOZf-6Yg69U3kWQ_yOzFgKkK";

export async function getSessionUser(){
  const {data}=await supabase.auth.getUser();
  return data?.user||null;
}

export async function signUp({email,password,displayName,username,avatarId}){
  return supabase.auth.signUp({
    email,password,
    options:{data:{display_name:displayName,username,avatar_id:avatarId}}
  });
}

export async function signIn({email,password}){
  return supabase.auth.signInWithPassword({email,password});
}

export async function signOut(){
  return supabase.auth.signOut();
}

const PASSWORD_RESET_FUNCTION = SUPABASE_URL + "/functions/v1/flames-password-reset";

async function passwordResetRequest(body){
  try{
    const r=await fetch(PASSWORD_RESET_FUNCTION,{
      method:"POST",
      headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},
      body:JSON.stringify(body)
    });
    const data=await r.json().catch(()=>({}));
    if(!r.ok)return {data:null,error:{message:data.error||"Unable to complete the password reset."}};
    return {data,error:null};
  }catch(e){return {data:null,error:{message:e.message||"Network error."}}}
}

export async function requestPasswordReset({email}){
  return passwordResetRequest({action:"request",email});
}

export async function verifyRecoveryCode({email,token}){
  return passwordResetRequest({action:"verify",email,code:token});
}

export async function updatePassword({email,resetToken,password}){
  return passwordResetRequest({action:"update",email,resetToken,password});
}
