const root=document.getElementById("root");

function login(){
  root.innerHTML='<main class="login"><h1>🔥 FLAMES Admin</h1><p class="muted">Private first-party analytics. Anonymous usage data only.</p><input id="pw" type="password" placeholder="Admin password" autocomplete="current-password"><button class="btn" onclick="doLogin()">Open dashboard</button><div id="err"></div></main>';
}
async function doLogin(){
  const password=document.getElementById("pw").value;
  const r=await fetch("/api/admin-analytics",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});
  if(r.ok)load();else{document.getElementById("err").className="error";document.getElementById("err").textContent="Invalid password or server configuration."}
}
async function load(){
  root.innerHTML='<main class="wrap"><header class="top"><div><div class="brand">🔥 <b>FLAMES</b> ADMIN</div><div class="muted">First-party analytics · last 7 days</div></div><button class="btn" onclick="load()">Refresh</button></header><div id="content" class="status">Loading analytics…</div></main>';
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),10000);
  let r;
  try{r=await fetch("/api/admin-analytics?days=7",{signal:controller.signal,cache:"no-store"});}
  catch(e){clearTimeout(timeout);document.getElementById("content").innerHTML="<strong>Analytics request failed</strong><p class=\"muted\">"+esc(e.name==="AbortError"?"The analytics API timed out after 10 seconds.":"Could not reach the analytics API.")+"</p>";return}
  finally{clearTimeout(timeout)}
  if(r.status===401)return login();
  const d=await r.json().catch(()=>({error:"Invalid analytics response"}));
  if(!r.ok){document.getElementById("content").innerHTML='<strong>Analytics unavailable</strong><p class="muted">'+esc(d.error)+'</p>';return}
  const events=d.events||{};
  const rows=Object.entries(events).sort((a,b)=>b[1]-a[1]).map(([name,count])=>'<div class="event"><span>'+esc(name)+'</span><strong>'+count+'</strong></div>').join("");
  const daily=Object.entries(d.daily||{}).sort().reverse().map(([day,count])=>'<div class="event"><span>'+esc(day)+'</span><strong>'+count+'</strong></div>').join("");
  document.getElementById("content").outerHTML=
    '<section class="cards">'+
      card("UNIQUE VISITORS",d.uniqueVisitors)+card("PAGEVIEWS",d.pageviews)+card("MATCHES COMPLETED",d.matchesCompleted)+
    '</section>'+
    '<section class="cards">'+
      card("MATCHES STARTED",d.matchesStarted)+card("CLASSIC",d.classicMatches)+card("SECRET CRUSH",d.secretCrushMatches)+
    '</section>'+
    '<section class="panel"><h2>Engagement</h2><table>'+
      row("Shares",d.shares)+row("Downloads",d.downloads)+row("Invites",d.invites)+row("Copies",d.copies)+row("Total tracked events",d.totalEvents)+
    '</table></section>'+
    '<section class="panel"><h2>FLAMES results</h2><div>'+
      Object.entries(d.results||{}).sort((a,b)=>b[1]-a[1]).map(([name,count])=>'<div class="event"><span>'+esc(name)+'</span><strong>'+count+'</strong></div>').join("")+
    '</div></section>'+
    '<section class="panel"><h2>Usage by day</h2><div>'+daily+'</div></section>'+
    '<section class="panel"><h2>All tracked events</h2><div>'+rows+'</div></section>'+
    '<p class="muted footer-note">No names, form inputs, IP addresses, or personal profiles are stored by this analytics system.</p>';
}
function card(label,value){return '<div class="card"><small>'+label+'</small><div class="num">'+Number(value||0).toLocaleString()+'</div></div>'}
function row(label,value){return '<tr><td>'+label+'</td><td>'+Number(value||0).toLocaleString()+'</td></tr>'}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
load();