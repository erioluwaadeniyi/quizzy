import crypto from "node:crypto";

const cookieName = "flames_admin";
const projectId = process.env.VERCEL_PROJECT_ID;\nconst teamId = process.env.VERCEL_TEAM_ID;

function sign(value) {
  return crypto.createHmac("sha256", process.env.ADMIN_PASSWORD || "").update(value).digest("base64url");
}
function makeToken() {
  const value = String(Date.now());
  return value + "." + sign(value);
}
function validToken(token) {
  if (!token) return false;
  const [value, signature] = token.split(".");
  if (!value || !signature) return false;
  const expected = sign(value);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) &&
    Date.now() - Number(value) < 1000 * 60 * 60 * 24 * 7;
}
function send(res, status, body, extra={}) {
  res.statusCode = status;
  for (const [key,value] of Object.entries(extra)) res.setHeader(key,value);
  res.setHeader("Content-Type","application/json");
  res.end(JSON.stringify(body));
}
async function vercel(path) {
  const params = new URLSearchParams({ projectId, ...path.params });
  const teamId = process.env.VERCEL_TEAM_ID;
  if (teamId) params.set("teamId", teamId);
  const response = await fetch("https://api.vercel.com" + path.url + "?" + params, {
    headers: { Authorization: "Bearer " + process.env.VERCEL_TOKEN }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Vercel Analytics request failed");
  return data;
}
export default async function handler(req,res) {
  if (req.method === "POST") {
    let body={}; try { body=typeof req.body==="string"?JSON.parse(req.body):req.body||{}; } catch {}
    if (!process.env.ADMIN_PASSWORD || body.password !== process.env.ADMIN_PASSWORD) {
      return send(res,401,{error:"Invalid admin password"});
    }
    res.setHeader("Set-Cookie", cookieName+"="+makeToken()+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800");
    return send(res,200,{ok:true});
  }
  const cookies = Object.fromEntries((req.headers.cookie||"").split(";").filter(Boolean).map(x=>{const i=x.indexOf("=");return [x.slice(0,i).trim(),decodeURIComponent(x.slice(i+1))]}));
  if (!validToken(cookies[cookieName])) return send(res,401,{error:"Unauthorized"});
  if (!process.env.VERCEL_TOKEN) return send(res,503,{error:"VERCEL_TOKEN is not configured"});
  try {
    const days=Math.min(Math.max(Number(req.query?.days||7),1),90);
    const until=new Date(); const since=new Date(Date.now()-days*86400000);
    const iso=d=>d.toISOString().slice(0,10);
    const visits=await vercel({url:"/v1/query/web-analytics/visits/count",params:{since:iso(since),until:iso(until)}});
    const events=await vercel({url:"/v1/query/web-analytics/events/aggregate",params:{since:iso(since),until:iso(until),by:"eventName",limit:"100"}});
    const classic=await vercel({url:"/v1/query/web-analytics/events/count",params:{since:iso(since),until:iso(until),filter:"eventName eq 'match_completed' and eventData/mode eq 'classic'"}});
    const secret=await vercel({url:"/v1/query/web-analytics/events/count",params:{since:iso(since),until:iso(until),filter:"eventName eq 'match_completed' and eventData/mode eq 'secret_crush'"}});
    return send(res,200,{projectId,days,visits:visits.data||{},events:events.data||[],classic:classic.data||{},secret:secret.data||{},source:"Vercel Web Analytics"});
  } catch(error) {
    return send(res,502,{error:error.message});
  }
}
