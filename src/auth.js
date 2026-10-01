import { supabase } from "./supabase.js";

export async function getSessionUser(){
  const {data}=await supabase.auth.getUser();
  return data?.user||null;
}

export async function signUp({email,password,displayName,avatarId}){
  return supabase.auth.signUp({
    email,password,
    options:{data:{display_name:displayName,avatar_id:avatarId}}
  });
}

export async function signIn({email,password}){
  return supabase.auth.signInWithPassword({email,password});
}

export async function signOut(){
  return supabase.auth.signOut();
}
