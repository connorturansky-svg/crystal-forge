/* Shared identity/order rules: serial wiring order is the manual array order;
 * stable IDs do not change when an LED or mounting hole is moved or reordered.
 */
export function ensureHardwareIds(s){
 for(const [kind,key] of [['pixel','manualPixelHoles'],['mount','manualMountHoles']]){
  const entries=Array.isArray(s[key])?s[key]:[];
  const used=new Set();
  for(let i=0;i<entries.length;i++){
   const p=entries[i];if(!p||typeof p!=='object')continue;
   let id=typeof p.id==='string'&&/^[a-zA-Z0-9_-]{1,90}$/.test(p.id)?p.id:'';
   if(!id||used.has(id)){
    let n=i+1;do{id=kind+'-'+n++}while(used.has(id));
    p.id=id;
   }
   used.add(id);
  }
 }
 return s;
}
export function movePixelInString(s,from,to){
 if(s.pixelPlacement!=='manual'||!Array.isArray(s.manualPixelHoles))return false;
 const a=s.manualPixelHoles;
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||from>=a.length||to<0||to>=a.length||from===to)return false;
 ensureHardwareIds(s);
 const [item]=a.splice(from,1);a.splice(to,0,item);
 return true;
}
export const hardwareName=(kind,index)=>({pixel:'P',mount:'M',tab:'T'}[kind]||'?')+String(index+1);
