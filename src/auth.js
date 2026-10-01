import { supabase } from "./supabase.js";

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

export async function requestPasswordReset({email}){
  return supabase.auth.resetPasswordForEmail(email);
}

export async function verifyRecoveryCode({email,token}){
  return supabase.auth.verifyOtp({email,token,type:"recovery"});
}

export async function updatePassword({password}){
  return supabase.auth.updateUser({password});
}
