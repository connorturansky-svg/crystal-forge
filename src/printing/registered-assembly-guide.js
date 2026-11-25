// A non-scale seam map and matching print/assembly instructions derived solely
// from verified manifest IDs. No guessed geometry or mechanical claims.
const safe=/^[a-zA-Z0-9-]+$/;
export function registeredAssemblyGuide(manifest,files){
 if(!manifest?.joints?.length||manifest.physicalFitVerified!==false)throw Error('Registered assembly manifest required.');
 const names=new Set(files.map(f=>f.path)),parts=new Map();
 for(const p of manifest.parts){
  const match=/^part-X([1-9][0-9]*)-Z([1-9][0-9]*)$/.exec(p.id);
  if(!match||parts.has(p.id)||p.file!=='05_Assembly/'+p.id+'.stl'||!names.has(p.file))throw Error('Assembly diagram part reference invalid.');
  parts.set(p.id,{x:Number(match[1])-1,z:Number(match[2])-1});
 }
 const maxX=Math.max(...[...parts.values()].map(p=>p.x)),maxZ=Math.max(...[...parts.values()].map(p=>p.z));
 if(maxX>15||maxZ>15)throw Error('Assembly map exceeds supported grid.');
 const w=(maxX+1)*170+60,h=(maxZ+1)*110+100,svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'">','<title>Registered assembly seam map, not to scale</title>','<rect width="100%" height="100%" fill="#fff"/>','<g font-family="sans-serif" fill="#172d3c"><text x="20" y="24" font-size="15">Assembly map • model X right, Z down</text><text x="20" y="44" font-size="11">Schematic only; use original coordinates and inspect actual meshes.</text>'];
 const centre=p=>[30+p.x*170+75,65+p.z*110+44],seams=new Map();
 for(const j of manifest.joints){
  if(!safe.test(j.id)||!j.parts?.every(id=>parts.has(id))||!names.has(j.dowelFile))throw Error('Assembly diagram joint reference invalid.');
  const key=j.parts.join('/');
  if(!seams.has(key))seams.set(key,{a:parts.get(j.parts[0]),b:parts.get(j.parts[1]),ids:[]});
  seams.get(key).ids.push(j.id.replace('joint-','J'));
 }
 for(const [id,p] of parts){const [x,y]=centre(p);svg.push('<rect x="'+(x-65)+'" y="'+(y-32)+'" width="130" height="64" rx="5" fill="#e3edf4" stroke="#526d80"/>','<text x="'+x+'" y="'+(y+4)+'" text-anchor="middle" font-size="12">'+id+'</text>');}
 for(const {a,b,ids} of seams.values()){const [x,y]=centre(a),[xx,yy]=centre(b),cx=(x+xx)/2,cy=(y+yy)/2;svg.push('<line x1="'+x+'" y1="'+y+'" x2="'+xx+'" y2="'+yy+'" stroke="#516e80" stroke-dasharray="4 3" opacity=".6"/>','<rect x="'+(cx-29)+'" y="'+(cy-9)+'" width="58" height="18" fill="#fff" stroke="#526d80" rx="3"/>','<text x="'+cx+'" y="'+(cy+4)+'" text-anchor="middle" font-size="10">'+ids.join(' / ')+'</text>');}
 svg.push('</g></svg>');
 const guide=['REGISTERED ASSEMBLY — PRINT AND FIT GUIDE','The joined STL is a reference; print the named grid parts instead.','Use the same printer, nozzle, material, layer height and orientation for fit coupons. Test actual clearance before printing the full assembly.','Print separate dowels with suitable orientation/support. Dry-fit each seam, starting with rows along X then joining rows along Z. Check access, alignment and mechanical retention; do not force a tight fit.','A geometric socket does not establish printed fit or strength. No load rating or safety certification.','', 'Parts: '+manifest.parts.length+' | Dowels: '+manifest.dowels.length,''];
 for(const p of manifest.parts)guide.push(p.id+' — '+p.file);
 guide.push('','Joints (dimensions in millimetres):');
 for(const j of manifest.joints)guide.push(j.id+': '+j.parts.join(' <-> ')+'; '+j.axis+' seam; pin diameter '+j.diameter+', length '+j.pinLength+', insertion depth '+j.depth+', diametral clearance '+j.diametralClearance+'; '+j.dowelFile);
 guide.push('','Fit samples (try using the actual dowel):');
 for(const c of manifest.fitCoupons||[]){if(!safe.test(c.id)||!names.has(c.file))throw Error('Coupon reference invalid.');guide.push(c.file+' — '+c.axis+' bore, diametral clearance '+c.diametralClearance+' mm');}
 guide.push('Record the successful printed clearance. Change the registration setting and regenerate the entire pack if required.');
 const bom=['Component,Count,Notes','Grid part,'+manifest.parts.length+',See individual named STL files','Matching dowel,'+manifest.dowels.length+',One per joint','Fit coupon,'+(manifest.fitCoupons?.length||0)+',Print before full assembly'].join('\r\n')+'\r\n';
 return [['05_Assembly/assembly-guide.txt',guide.join('\n')+'\n'],['05_Assembly/assembly-map.svg',svg.join('')],['05_Assembly/assembly-bom.csv',bom]];
}
