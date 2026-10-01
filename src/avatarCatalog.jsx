export const AVATARS = Array.from({length:24},(_,i)=>({id:i+1, label:i<12?"Male":"Female", tone:["deep","dark","medium","warm","light","fair"][i%6]}));

export function avatarStyle(id=1){
  const safe=Math.max(1,Math.min(24,Number(id)||1));
  const female=safe>12;
  const index=(safe-1)%12;
  const skin=["#6f3f2a","#8f573d","#ad7051","#c58b69","#e0aa82","#f1c7a4"][index%6];
  const hair=["#17120f","#2b1a12","#4b2c1e","#111827"][index%4];
  return {
    "--avatar-skin":skin,
    "--avatar-hair":hair,
    "--avatar-shirt":female?["#d85b72","#7d5cc7","#e19b3d","#3d7c9b"][index%4]:["#2f6d8f","#d05a3d","#556b4f","#765b9e"][index%4],
    "--avatar-accent":female?"#f6b7c5":"#9ed5ea"
  };
}

export function Avatar({id=1,size=48,className=""}){
  return <div className={"flames-avatar "+className} style={{...avatarStyle(id),width:size,height:size}} aria-hidden="true">
    <span className="avatar-hair"/><span className="avatar-face"><i/><i/></span><span className="avatar-neck"/><span className="avatar-shirt"/>
  </div>;
}
