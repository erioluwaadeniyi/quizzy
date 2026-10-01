import { supabase } from "./supabase.js";

export async function getSessionUser(){
  const {data}=await supabase.auth.getUser();
  return data?.user||null;
}

export async function createAccount({displayName,username,avatarId}){
  return supabase.auth.signInAnonymously({
    options:{data:{display_name:displayName,username,avatar_id:avatarId}}
  });
}

export async function signOut(){
  return supabase.auth.signOut();
}
