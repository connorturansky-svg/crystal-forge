import {generateFormation, crystalGeometry, crystalOrientation, baseGeometry, baseAccentSpecs, baseSurfaceHeight, crystalRootOffset} from './geometry-v3.js';

// Each starting point is an independent model. These are just the existing
// Crystal parameters, so no new saved shape type or optical path is implied.
export function crystalStartingPoints(defaults){
 const options=[
  ['needle-spire','Needle spire',{pattern:'Central Spire',familyMix:'Shard',count:7,width:95,height:146,spacing:30,bottomScale:.58,topScale:.35,tipLength:.43,leanAmount:19}],
  ['truncated-blades','Truncated blade fan',{pattern:'Fan',familyMix:'Blade',count:7,width:135,height:87,spacing:37,bottomScale:1.2,topScale:1.03,tipFlat:.65,tipLength:.16,leanMode:'One direction',leanAmount:26,angleRandomness:1}],
  ['low-quartz','Low quartz mound',{pattern:'Dense Cluster',familyMix:'Quartz',count:16,width:120,height:53,spacing:39,bottomScale:1.32,topScale:1.04,tipRound:5,leanAmount:15}],
  ['basalt-columns','Basalt columns',{pattern:'Wall Growth',familyMix:'Cubic',count:10,width:128,height:99,spacing:32,tipFlat:.72,tipLength:.11,topScale:1,leanAmount:0}],
  ['radial-bloom','Radial crystal bloom',{pattern:'Organic / Wild',familyMix:'Fantasy',count:11,width:113,height:97,spacing:47,leanMode:'Radial outward',leanAmount:63,angleRandomness:0,bottomScale:.8,topScale:.53,tipLength:.36}],
  ['crescent-geode','Crescent geode',{pattern:'Geode / Crescent',familyMix:'Mixed',count:13,width:130,height:94,spacing:40,leanMode:'Radial inward',leanAmount:48,angleRandomness:15,bottomScale:1.1,topScale:.7,seed:73}]
 ];
 return options.map(([id,name,parameters])=>({id,name,parameters:{...defaults,...parameters}}));
}

export function crystalStartingPointPreview(THREE,settings,cluster=generateFormation(settings)){
 const group=new THREE.Group();
 try{
  if(settings.baseType!=='none'){
   const baseMaterial=()=>new THREE.MeshStandardMaterial({color:settings.colour??0x424c69,roughness:.56,flatShading:true,side:THREE.DoubleSide});
   group.add(new THREE.Mesh(baseGeometry(THREE,cluster,settings),baseMaterial()));
   for(const accent of baseAccentSpecs(cluster,settings)){
    const mesh=new THREE.Mesh(crystalGeometry(THREE,accent,settings),baseMaterial());
    mesh.position.set(accent.x,baseSurfaceHeight(cluster,settings,accent.x,accent.z)-3,accent.z);
    mesh.rotation.y=accent.rotation;group.add(mesh);
   }
  }
  for(const crystal of cluster){
   if(crystal.hidden)continue;
   const mesh=new THREE.Mesh(crystalGeometry(THREE,crystal,settings),new THREE.MeshStandardMaterial({color:settings.colour??0x477e9c,roughness:.4,flatShading:true,side:THREE.DoubleSide}));
   group.add(mesh);
   mesh.position.set(crystal.x,crystal.y+crystalRootOffset(cluster,settings,crystal,THREE),crystal.z);
   mesh.quaternion.copy(crystalOrientation(THREE,crystal));
  }
  return group;
 }catch(error){
  for(const mesh of group.children){mesh.geometry.dispose();mesh.material.dispose();}
  throw error;
 }
}

