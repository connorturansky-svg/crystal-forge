import {buildSvgExtrusionRecipe} from './svg-import/index.js';
import {planNativePixelString} from './studio-native-routing.js';
import {layeredCharacter} from './studio-character-relief.js';
import {createPodShell} from './wt002-pod-shell.js';
import {addPixelHoleCuts,checkedPixelBore} from './studio-pixel-builder.js';
import {generateTile,tactileTileGenerator} from './tactile-tile-generator.js';
import {createGeneratorRegistry} from './studio-generator-registry.js';
import {circle,heightField} from './studio-geometry.js';
const numeric=(key,label,value,min,max,unit='mm',step=.5)=>({key,label,type:'number',default:value,min,max,step,unit});
const choice=(key,label,value,options)=>({key,label,type:'select',default:value,options});
const boolean=(key,label,value=false)=>({key,label,type:'boolean',default:value});
const common=[numeric('seed','Repeatable seed',42,0,2147483647,'',1),boolean('dualMaterial','Two material regions')];
const lightingWarning='Optical diffusion, heat, LED fit and printed roof support require physical checks.';
const box=(size,position=[0,size[1]/2,0])=>({kind:'box',size,position});
const cylinder=(radius,height,position=[0,height/2,0])=>({kind:'cylinder',radius,height,position});
const sphere=(radii,position=[0,radii[1],0])=>({kind:'sphere',radii,position});
const extrusion=(outline,height,position=[0,0,0],holes=[])=>({kind:'extrude',outline,height,position,holes});
function define(typeId,displayName,category,schema,presets,recipe,capabilities={}){
 const parameterSchema=[...schema,...common],defaultParameters=Object.fromEntries(parameterSchema.map(p=>[p.key,p.default]));
 const generator={typeId,typeVersion:1,displayName,category,parameterSchema,defaultParameters,
  presets:presets.map(([id,name,parameters])=>({id,name,parameters:{...defaultParameters,...parameters}})),
  capabilities:{supportsBase:true,supportsMounting:true,supportsLEDs:false,supportsTactileSurfaces:false,supportsMechanisms:false,supportsDualMaterial:true,supportsPartSplitting:false,...capabilities},
  validateParameters(input){const p={...defaultParameters,...input},errors=[];
   for(const s of parameterSchema){const v=p[s.key];if(s.type==='number'&&(!Number.isFinite(v)||v<s.min||v>s.max))errors.push(s.label+' must be '+s.min+'-'+s.max+' '+s.unit+'.');if(s.type==='select'&&!s.options.includes(v))errors.push('Choose a supported '+s.label+'.');if(s.type==='boolean'&&typeof v!=='boolean')errors.push(s.label+' must be on or off.');}
   if(!Number.isInteger(p.seed))errors.push('Seed must be a whole number.');
   return {valid:!errors.length,errors,parameters:p};},
  recipe(input){const c=this.validateParameters(input);if(!c.valid)throw Error(c.errors.join(' '));return {...recipe(c.parameters),dualMaterial:c.parameters.dualMaterial};},
  generatePreview(input){return this.recipe(input);},generateManufacturingGeometry(input){return this.recipe(input);},
  estimateBounds(input){return this.recipe(input).bounds;},
  migrateParameters(version,data){if(version!==1)throw Error('Generator migration required.');return {...data};}
 };return generator;
}
export function gearOutline(p){
 const n=Math.round(p.teeth),alpha=p.pressureAngle*Math.PI/180,m=p.mode==='Mechanical'?p.module:p.diameter/(n+2);
 const pitch=m*n/2,base=pitch*Math.cos(alpha),outer=m*(n+2)/2,root=Math.max(m,pitch-1.25*m),half=Math.PI/(2*n),inv=a=>Math.tan(a)-a;
 const flank=r=>half+inv(alpha)-(r>base?inv(Math.acos(base/r)):0);
 const points=[];
 for(let i=0;i<n;i++){
  const centre=i*Math.PI*2/n;
  const polar=(r,a)=>points.push([r*Math.cos(a),r*Math.sin(a)]);
  const start=centre-Math.PI/n,end=centre+Math.PI/n;
  polar(root,start);polar(root,centre-flank(Math.max(base,root)));
  for(let j=0;j<=6;j++){const r=Math.max(root,base)+(outer-Math.max(root,base))*j/6;polar(r,centre-flank(r));}
  for(let j=1;j<=4;j++)polar(outer,centre-flank(outer)+2*flank(outer)*j/4);
  for(let j=5;j>=0;j--){const r=Math.max(root,base)+(outer-Math.max(root,base))*j/6;polar(r,centre+flank(r));}
  polar(root,centre+flank(Math.max(root,base)));polar(root,end);
 }
 // Consecutive root vertices are shared between neighbouring teeth.
 return points.filter((v,i)=>i===0||Math.hypot(v[0]-points[i-1][0],v[1]-points[i-1][1])>1e-7).filter((v,i,arr)=>i!==arr.length-1||Math.hypot(v[0]-arr[0][0],v[1]-arr[0][1])>1e-7);
}
function creativeGearOutline(p, radius) {
 const count=Math.round(p.teeth),samples=count*24;
 return Array.from({length:samples},(_,i)=>{
  const angle=i*2*Math.PI/samples,phase=(i%24)/24;
  let crest;
  switch(p.wheelStyle){
   case 'Crown': crest=Math.min(1,phase*7,(1-phase)*7);break;
   case 'Rotor': crest=Math.min(phase/0.83,(1-phase)/0.17);break;
   case 'Scallop': crest=1-Math.pow(Math.sin(phase*Math.PI),8);break;
   case 'Petal': crest=Math.pow(Math.sin(phase*Math.PI),2.4);break;
   default: crest=(1+Math.cos(phase*Math.PI*2))/2;
  }
  const r=radius*(1-(1-crest)*p.toothDepth/100);
  return [r*Math.cos(angle),r*Math.sin(angle)];
 });
}

function creativeGearWindows(p, outline) {
 const count=Math.round(p.spokes);
 if(!count||p.webStyle==='Solid')return [];
 const rim=Math.min(...outline.map(([x,z])=>Math.hypot(x,z)))-p.rimWidth;
 const root=Math.max(p.hub/2,p.bore/2+2)+1;
 const span=rim-root,sector=Math.PI/count;
 // Keep finite webs between openings at the narrowest radius.
 const half=sector-Math.asin(Math.min(.99,p.webWidth/(2*root)));
 if(span<3||half<.055)throw Error('Openwork needs more room. Reduce the hub, rim or spoke count, or enlarge the wheel.');
 const paired=p.webStyle==='Forked';
 if(paired&&half<.19)throw Error('Forked windows need more room. Reduce the spoke count or enlarge the gear.');
 return Array.from({length:count*(paired?2:1)},(_,index)=>{
  const branch=paired?(index%2===0?-1:1):0;
  const centre=(paired?Math.floor(index/2):index)*2*sector;
  return Array.from({length:48},(_,step)=>{
   const a=step*Math.PI/24,t=(1+Math.cos(a))/2;
   let radius=root+span*t,side=Math.sin(a),sweep=0;
   if(p.webStyle==='Sweep')sweep=half*.35*(t-.5);
   if(p.webStyle==='Teardrop')side*=.43+.57*t;
   if(p.webStyle==='Lens')side*=.82;
   if(p.webStyle==='Sector'){
    const power=x=>Math.sign(x)*Math.pow(Math.abs(x),.48);
    radius=root+span*(1+power(Math.cos(a)))/2;
    side=power(side);
   }
   const angle=paired?centre+branch*half*(.48+.13*t)+side*half*.27:centre+side*half*.78+sweep;
   return [radius*Math.cos(angle),radius*Math.sin(angle)];
  });
 });
}

export const gearGenerator=define('gears','Cogs & Gears','Mechanical',[
 choice('mode','Purpose','Decorative',['Decorative','Mechanical']),numeric('teeth','Tooth count',20,8,80,'',1),numeric('diameter','Decorative outer diameter',80,25,180),numeric('thickness','Body thickness',8,3,25),numeric('module','Mechanical module',3,1,5),numeric('pressureAngle','Pressure angle',20,14.5,30,'degrees'),numeric('bore','Measured shaft bore',8,0,30),numeric('hub','Hub diameter',20,10,45),numeric('spokes','Spoke cutouts',0,0,8,'',1),choice('wheelStyle','Decorative rim','Involute',['Involute','Rounded lobes','Angular teeth','Cam','Pulley','Crown','Rotor','Scallop','Petal']),numeric('toothDepth','Decorative tooth depth',20,5,30,'%',1),choice('holeStyle','Spoke window shape','Round',['Round','Oval','Diamond']),numeric('extraHoles','Extra fixing holes',0,0,6,'',1),choice('inlayStyle','Colour region','Face',['Face','Hub ring']),choice('webStyle','Body structure','Legacy',['Legacy','Solid','Sector','Sweep','Teardrop','Lens','Forked']),numeric('rimWidth','Minimum rim width',4,2,16),numeric('webWidth','Minimum spoke web',3,2,12),choice('reliefStyle','Raised details','None',['None','Hub collar','Rim rail','Hub and rim']),numeric('reliefHeight','Relief height',2,1,5)
],[['weather','Weather wheel',{}],['tactile','Large tactile cog',{teeth:12,diameter:100,thickness:10}],['pulley','Grooved pulley',{wheelStyle:'Pulley',spokes:5}],['flower','Rounded flower cog',{wheelStyle:'Rounded lobes',teeth:9,spokes:5,holeStyle:'Oval'}],['cam','Eccentric cam',{wheelStyle:'Cam',inlayStyle:'Hub ring'}],['crown-open','Openwork crown',{wheelStyle:'Crown',webStyle:'Sector',teeth:12,spokes:5,diameter:100,reliefStyle:'Rim rail'}],['turbine','Swept turbine',{wheelStyle:'Rotor',webStyle:'Sweep',teeth:11,spokes:7,diameter:100,reliefStyle:'Hub collar'}],['petal-web','Petal rosette',{wheelStyle:'Petal',webStyle:'Teardrop',teeth:9,spokes:5,diameter:100}],['scallop-lace','Scalloped lace wheel',{wheelStyle:'Scallop',webStyle:'Lens',teeth:13,spokes:7,diameter:105}],['solid-crown','Solid crown with raised hub',{wheelStyle:'Crown',webStyle:'Solid',teeth:8,diameter:92,reliefStyle:'Hub collar'}],['rail-pulley','Layered pulley wheel',{wheelStyle:'Pulley',webStyle:'Sector',spokes:4,diameter:100,reliefStyle:'Hub and rim'}],['forked-sun','Forked sun wheel',{wheelStyle:'Rounded lobes',webStyle:'Forked',spokes:4,teeth:12,diameter:105,bore:0}],['forked-rotor','Forked rotor wheel',{wheelStyle:'Rotor',webStyle:'Forked',spokes:5,teeth:16,diameter:120,bore:0,webWidth:4}],['mechanical','Module 2 mechanical',{mode:'Mechanical',teeth:24,module:2,bore:6}]],p=>{
 const diameter=p.mode==='Mechanical'?(Math.round(p.teeth)+2)*p.module:p.diameter;
 const radiusOuter=diameter/2;
 const decorative=p.mode!=='Mechanical';
 const outline=!decorative||p.wheelStyle==='Involute'?gearOutline(p):['Crown','Rotor','Scallop','Petal'].includes(p.wheelStyle)?creativeGearOutline(p,radiusOuter):circle(radiusOuter,Math.max(120,Math.round(p.teeth)*12)).map(([x,z])=>{
  const angle=Math.atan2(z,x),wave=(1+Math.cos(angle*Math.round(p.teeth)))/2;
  const shape=p.wheelStyle==='Rounded lobes'?wave:p.wheelStyle==='Angular teeth'?Math.pow(wave,.35):1;
  const scale=p.wheelStyle==='Cam'?.79+.21*Math.cos(angle):1-(1-shape)*p.toothDepth/100;
  return [x*scale,z*scale];
 });
 if(p.bore>=Math.min(p.hub,diameter*.45))throw Error('Bore must leave at least a hub wall.');
 if(p.mode==='Mechanical'&&p.teeth<Math.ceil(2/Math.sin(p.pressureAngle*Math.PI/180)**2))throw Error('This tooth count risks involute undercut. Increase teeth or pressure angle.');
 const holes=p.bore? [circle(p.bore/2)]:[];
 const count=Math.round(p.spokes),radius=diameter*.24,holeRadius=Math.min(diameter*.065,Math.max(1,(diameter*.4-p.hub/2)/2));
 const creativeWeb=decorative&&p.webStyle!=='Legacy';
 const webOutline=p.wheelStyle==='Pulley'?outline.map(([x,z])=>[x*.78,z*.78]):outline;
 if(creativeWeb)holes.push(...creativeGearWindows(p,webOutline));
 if(!creativeWeb&&count&&radius-holeRadius>Math.max(p.hub/2,p.bore/2+2))for(let i=0;i<count;i++){
  const angle=i/count*Math.PI*2,cx=Math.cos(angle)*radius,cz=Math.sin(angle)*radius;
  const form=decorative?p.holeStyle:'Round';
  holes.push(circle(holeRadius,form==='Diamond'?4:32).map(([x,z])=>{
   const radial=x,side=form==='Oval'?z*.55:z;
   return [cx+radial*Math.cos(angle)-side*Math.sin(angle),cz+radial*Math.sin(angle)+side*Math.cos(angle)];
  }));
 }
 const extra=decorative?Math.round(p.extraHoles):0;
 if(extra&&creativeWeb&&holes.length>(p.bore?1:0))throw Error('Turn off extra fixing holes when using an openwork body.');
 for(let i=0;i<extra;i++){
  const angle=i/extra*Math.PI*2,candidate=circle(1.4,24,Math.cos(angle)*radiusOuter*.58,Math.sin(angle)*radiusOuter*.58);
  if(holes.some(h=>h.some(a=>candidate.some(b=>Math.hypot(a[0]-b[0],a[1]-b[1])<1.6))))throw Error('Extra fixing holes are too close to the bore or spoke windows.');
  if(p.wheelStyle==='Cam')throw Error('Choose a concentric rim for evenly spaced extra fixing holes.');
  holes.push(candidate);
 }
 const positive=[extrusion(outline,p.thickness,[0,0,0],holes)];
 if(decorative&&p.wheelStyle==='Pulley'){
  const inset=outline.map(([x,z])=>[x*.78,z*.78]),lip=Math.min(2,p.thickness*.28);
  positive.splice(0,1,extrusion(outline,lip,[0,0,0],holes),extrusion(inset,p.thickness-2*lip,[0,lip,0],holes),extrusion(outline,lip,[0,p.thickness-lip,0],holes));
 }
 const hubRadius=Math.min(radiusOuter*.27,p.hub/2);
 const inlay=decorative&&p.inlayStyle==='Hub ring';
 if(inlay&&p.bore/2>=hubRadius-1.5)throw Error('The hub ring needs more space around the bore.');
 const relief=decorative&&p.reliefStyle!=='None';
 if(relief){
  const overlap=Math.min(.4,p.thickness*.1);
  const height=p.reliefHeight+overlap,y=p.thickness-overlap;
  if(p.reliefStyle!=='Rim rail'){
   const collar=Math.min(p.hub/2,Math.min(...outline.map(([x,z])=>Math.hypot(x,z)))*.4);
   if(collar<=p.bore/2+1.2)throw Error('The raised hub collar needs more space around the bore.');
   positive.push(extrusion(circle(collar),height,[0,y,0],p.bore?[circle(p.bore/2)]:[]));
  }
  if(p.reliefStyle!=='Hub collar'){
   const outer=outline.map(([x,z])=>[x*.985,z*.985]);
   const inner=outline.map(([x,z])=>[x*.94,z*.94]);
   const maxWindow=Math.max(0,...holes.flat().map(([x,z])=>Math.hypot(x,z)));
   if(maxWindow>=Math.min(...inner.map(([x,z])=>Math.hypot(x,z)))-.2)throw Error('The raised rim needs space outside the cutouts. Increase the rim width.');
   positive.push(extrusion(outer,height,[0,y,0],[inner]));
  }
 }
 const serialSupport=decorative&&p.webStyle==='Solid'&&p.wheelStyle!=='Pulley'&&!holes.length?{outline,thickness:p.thickness}:null;
 const serialReason='Use a solid decorative gear without a shaft bore, fixing holes, openwork or pulley recess.';
 if((creativeWeb||relief)&&!inlay)return {positive,serialSupport,serialReason,secondary:[],negative:[],materialSplitHeight:p.thickness-.8,materialSplitRole:'top',bounds:{width:diameter,depth:diameter,height:p.thickness+(relief?p.reliefHeight:0)},warnings:['Decorative wheel. Check wheel clearances before using moving parts.']};
 const secondary=[extrusion(inlay?circle(hubRadius):outline,.8,[0,p.thickness-.8,0],inlay?(p.bore?[circle(p.bore/2)]:[circle(hubRadius*.55)]):holes)];
 return {positive,secondary,negative:[],serialSupport,serialReason,bounds:{width:diameter,depth:diameter,height:p.thickness+(relief?p.reliefHeight:0)},warnings:['Pinch points and moving parts require guarding and physical checks. Mechanical meshing still requires a mating-gear test.']};
},{supportsMechanisms:true});
export const waveGenerator=define('waves','Waves & Organic Forms','Organic',[
 choice('flowStyle','Flow structure','Parallel',['Parallel','Concentric','Vortex','Saddle','Dune']),numeric('width','Length',110,30,200),numeric('depth','Width',65,20,160),numeric('thickness','Minimum base thickness',4,2,15),numeric('amplitude','Wave height',12,1,40),numeric('frequency','Wave count',2,0.5,6,'',.1),numeric('phase','Phase',0,0,360,'degrees'),numeric('direction','Direction',0,0,360,'degrees'),numeric('variation','Organic variation',.25,0,1,'',.05)
],[['river','Flowing river',{}],['wind','Wind surface',{frequency:1,amplitude:20,direction:30}],['ripples','Soft overlapping ripples',{frequency:4,amplitude:6,variation:.6}],['rings','Concentric ripple basin',{flowStyle:'Concentric',frequency:2}],['eddy','Turning river eddy',{flowStyle:'Vortex',frequency:1.5}],['saddle','Crossing saddle',{flowStyle:'Saddle',amplitude:19}],['dune','Wind-sculpted dune',{flowStyle:'Dune',amplitude:19}]],p=>{
 const a=p.direction*Math.PI/180,phase=p.phase*Math.PI/180;
 const top=(x,z)=>{
  const u=(x*Math.cos(a)+z*Math.sin(a))/p.width,v=(-x*Math.sin(a)+z*Math.cos(a))/p.depth;
  const r=Math.hypot(u,v),phaseRate=p.frequency*Math.PI*2;
  let relief;
  switch(p.flowStyle){
   case 'Concentric': relief=(1+Math.cos(r*phaseRate+phase))/2;break;
   case 'Vortex': {
    // Fade angular terms at the origin, where the azimuth is undefined.
    const strength=Math.min(1,r*6);
    relief=.5+.5*strength*Math.sin(r*phaseRate*1.8+Math.atan2(v,u)*2+phase);break;
   }
   case 'Saddle': relief=.5+.45*Math.tanh((u*u-v*v)*p.frequency*4+p.variation*u);break;
   case 'Dune': relief=Math.exp(-Math.pow((u-.18*Math.sin(v*4+phase))*p.frequency*3,2))*(.8+.2*Math.cos(v*2+phase));break;
   default: relief=(1+Math.sin(u*phaseRate+phase+Math.sin(z/p.depth*Math.PI*2+p.seed*.01)*p.variation))/2;
  }
  return p.thickness+p.amplitude*relief;
 };
 const mesh=heightField(p.width,p.depth,top);
 const w = p.width / 2, d = p.depth / 2;
 const pixelBoreSupport = {outline:[[-w,-d],[w,-d],[w,d],[-w,d]],minThickness:p.thickness};
 const material=p.flowStyle==='Parallel'?{secondary:[box([p.width,.8,p.depth],[0,.4,0])]}:{secondary:[],materialSplitHeight:.8,materialSplitRole:'top'};
 return {positive:[{kind:'mesh',mesh}],...material,pixelBoreSupport,serialSupport:{outline:pixelBoreSupport.outline,thickness:p.thickness},negative:[],bounds:{width:p.width,depth:p.depth,height:p.thickness+p.amplitude},warnings:['Review the wave slopes in Cura; the flat underside is the intended bed face.']};
});
function raisedControlSymbol(symbol,width,surface,offset=0){
 const h=2.4,y=surface, size=width*.34;
 const block=(x,z)=>box([size*x,h,size*z],[0,y,offset]);
 const disc=(radius,x=0,z=0)=>cylinder(size*radius,h,[size*x,y,size*z+offset]);
 const polygon=points=>extrusion(points.map(([x,z])=>[size*x,size*z]),h,[0,y-h/2,offset]);
 switch(symbol){
  case 'Plus': return [block(1,.25),block(.25,1)];
  case 'Minus': return [block(1,.25)];
  case 'Dot': return [disc(.28)];
  case 'Pointer': return [polygon([[0,-.56],[.48,.35],[-.48,.35]])];
  case 'River wave': return [polygon([[-.54,.02],[-.28,-.24],[0,-.24],[.28,.02],[.54,-.1],[.54,.16],[.28,.28],[0,.02],[-.28,.02],[-.54,.28]])];
  case 'Mine crystal': return [polygon([[0,-.6],[.34,-.23],[.31,.29],[0,.55],[-.31,.29],[-.34,-.23]])];
  case 'Weather cloud': return [disc(.25,-.30,.08),disc(.34,0,-.08),disc(.26,.30,.08)];
  case 'Sun': return [disc(.3),block(1,.18),block(.18,1)];
  case 'Lightning': return [polygon([[-.10,-.55],[.34,-.55],[.07,-.10],[.40,-.10],[-.25,.58],[-.08,.11],[-.37,.11]])];
  case 'Goat hoof': return [disc(.27,-.20,-.12),disc(.27,.20,-.12),block(.50,.70)];
  default: return [];
 }
}

function roundedSquare(radius,rounding){
 if(!rounding)return [[-radius,-radius],[radius,-radius],[radius,radius],[-radius,radius]];
 return Array.from({length:4},(_,corner)=>{
  const angle=corner*Math.PI/2;
  const x=Math.cos(angle+Math.PI/4)*Math.SQRT2*(radius-rounding);
  const z=Math.sin(angle+Math.PI/4)*Math.SQRT2*(radius-rounding);
  return Array.from({length:9},(_,step)=>{
   const a=angle+step*Math.PI/16;
   return [x+rounding*Math.cos(a),z+rounding*Math.sin(a)];
  });
 }).flat();
}

// Loft one radial outline across a profile so the grip and face share a closed shell.
function rotaryCapMesh(outline, height, topProfile){
 const layers=topProfile==='Dish'
  ? [[0,1],[height*.92,1],[height,.93],[height*.98,.82],[height*.91,.63],[height*.88,.42]]
  : [[0,1],[height*.48,1],[height*.60,.92],[height*.60,.78],[height,.78]];
 const points=[],triangles=[],n=outline.length;
 for(const [y,scale] of layers)for(const [x,z] of outline)points.push(x*scale,y,z*scale);
 const bottom=points.length/3,top=bottom+1,last=(layers.length-1)*n;
 points.push(0,0,0,0,layers.at(-1)[0],0);
 for(let i=0;i<n;i++){
  const next=(i+1)%n;
  triangles.push(bottom,i,next,top,last+next,last+i);
  for(let ring=0;ring<layers.length-1;ring++){
   const a=ring*n+i,b=ring*n+next,c=a+n,d=b+n;
   triangles.push(a,c,b,b,c,d);
  }
 }
 return {kind:'mesh',mesh:{points:new Float32Array(points),triangles:new Uint32Array(triangles)}};
}

function panelControlRecipe(p){
 const w=p.diameter,d=p.depth,h=p.height,r=w/2;
 const oval=(scale=1)=>circle(r*scale).map(([x,z])=>[x,z*d/w]);
 const gripOutline=()=>Array.from({length:192},(_,i)=>{
  const angle=i*Math.PI/96;
  const trough=(1-Math.cos(angle*Math.round(p.gripCount)))/2;
  const shape=p.gripProfile==='Scalloped'?Math.sqrt(trough):trough;
  const grip=p.gripProfile==='Smooth'?1:1-p.gripDepth/100*shape;
  return [r*grip*Math.cos(angle),r*grip*Math.sin(angle)];
 });
 const shape=p.controlStyle,broad=p.controlGrip==='Broad';
 const negative=[],positive=[],secondary=[];
 let width=w,depth=d,top=h;
 if(shape==='Rotary knob'||shape==='Rotary selector'){
  depth=w;
  const outline=gripOutline();
  if(shape==='Rotary knob'&&p.rotaryTop!=='Flat')positive.push(rotaryCapMesh(outline,h,p.rotaryTop));
  else positive.push(extrusion(outline,h));
  if(shape==='Rotary selector'){
   positive.push(box([w*.26,h*.36,w*.8],[0,h*1.12,-w*.06]));
   top=h*1.3;
  }
  if(shape==='Rotary knob'){
   const face=p.rotaryTop==='Dish'?h*.88:h;
   if(p.rotaryMark==='Recessed pointer'){
    const depth=Math.min(1,h*.09);
    negative.push(box([w*.075,top-face+depth+.2,w*.26],[0,(face-depth+top+.2)/2,-w*.19]));
   }else{
    const symbolWidth=p.rotaryTop==='Dish'?w*.78:w;
    secondary.push(...raisedControlSymbol(p.symbol,symbolWidth,face));
    if(secondary.length)top=Math.max(top,face+1.2);
   }
  }
  if(shape==='Rotary selector'){
   secondary.push(...raisedControlSymbol(p.symbol,w*.42,top,-w*.06));
   if(secondary.length)top+=1.2;
  }
 }else if(shape==='Thumb joystick'){
  // One closed shell avoids Boolean seams between the stem and grip.
  const stem=Math.min(w,d)*.22,base=h*.28,tip=h*1.1,radius=stem*1.8;
  const rings=[[0,w/2,d/2],[base*.8,w/2,d/2],[base,stem,stem],[tip-h*.17,stem,stem]];
  for(let i=-2;i<=5;i++){
   const angle=i*Math.PI/12,size=radius*Math.cos(angle);
   rings.push([tip+Math.sin(angle)*h*.21,size*(broad?1.3:1),size*(broad?.83:1)]);
  }
  top=tip+h*.21;
  if(broad)width=Math.max(width,2*radius*1.3);
  positive.push({kind:'ring-solid',rings,top});
 }else if(shape==='Toggle lever'){
  const stem=Math.min(w,d)*.22,base=h*.28;
  const angle=p.leverAngle*Math.PI/180;
  const length=h*.82,tip=[Math.sin(angle)*length,base+Math.cos(angle)*length,0];
  positive.push(extrusion(oval(),base));
  positive.push({...cylinder(stem,length+1),rotation:[0,0,-angle],position:[tip[0]/2,base+Math.cos(angle)*length/2-.45,0]});
  const radius=stem*1.15;
  positive.push(sphere([radius*(broad?1.35:1),h*.21,radius*(broad?1.2:1)],tip));
  width=Math.max(w,2*(Math.abs(tip[0])+radius*(broad?1.35:1)));
  top=tip[1]+h*.21;
 }else if(shape==='Rocker'||shape==='Fader cap'){
  const corners=[[-r,-d*.33],[-w*.34,-d/2],[w*.34,-d/2],[r,-d*.33],[r,d*.33],[w*.34,d/2],[-w*.34,d/2],[-r,d*.33]];
  const footprint=broad?roundedSquare(r,r*.4).map(([x,z])=>[x,z*d/w]):corners;
  positive.push(extrusion(footprint,h*.72));
  if(shape==='Rocker'){
   positive.push({...box([w*(broad?.8:.72),h*.32,d*.73],[0,h*.73,0]),rotation:[p.leverAngle*Math.PI/180,0,0]});
   top=h+Math.sin(p.leverAngle*Math.PI/180)*d*.365;
  }else{
   positive.push(box([w*.8,h*.28,d*(broad?.84:.74)],[0,h*.8,0]));
   negative.push(box([w*.72,h*.12,d*.10],[0,h*.94,0]));
  }
 }else if(shape==='Directional pad'){
  const arm=broad?.4:.3;
  positive.push(extrusion(oval(),h*.54),box([w*.84,h*.55,d*arm],[0,h*.71,0]),box([w*arm,h*.55,d*.84],[0,h*.71,0]));
 }else{
  positive.push(extrusion(oval(),h*.6),sphere([w*.36,h*.44,d*.36],[0,h*.55,0]));
 }
 const socket=p.shaft+p.tolerance;
 if(p.shaft){
  const socketRoof=['Toggle lever','Thumb joystick'].includes(shape)?h*.28:h*.54;
  if(p.socketDepth>socketRoof-1||socket>Math.min(width,depth)-4)throw Error('Reduce the socket diameter or depth, or increase the control size to leave a solid wall.');
  negative.push(p.socketProfile==='Rectangular'
   ?box([socket,p.socketDepth+.2,socket*.55],[0,(p.socketDepth-.2)/2,0])
   :cylinder(socket/2,p.socketDepth+.2,[0,(p.socketDepth-.2)/2,0]));
 }
 const band=Math.min(2,h*.16);
 const separateRotaryFace=shape==='Rotary knob'&&!secondary.length&&(p.rotaryTop!=='Flat'||p.rotaryMark!=='Raised symbol');
 return {positive,negative,secondary,
  materialSplitHeight:shape==='Indicator lens'||separateRotaryFace?band:undefined,
  materialSplitRole:separateRotaryFace?'top':undefined,
  materialBand:secondary.length||shape==='Indicator lens'||separateRotaryFace?undefined:box([width+2,band,depth+2]),
  bounds:{width,depth,height:top},warnings:['Printed control shell. Measure the actual hardware and check fit and movement with a physical sample.']};
}

export const capGenerator=define('control-caps','Buttons & Control Caps','Controls',[
 choice('controlStyle','Control family','Pushbutton',['Pushbutton','Rotary knob','Rotary selector','Toggle lever','Rocker','Fader cap','Thumb joystick','Directional pad','Indicator lens']),
 choice('controlGrip','Grip silhouette','Classic',['Classic','Broad']),
 choice('rotaryTop','Rotary knob face','Flat',['Flat','Dish','Stepped']),choice('rotaryMark','Rotary knob mark','Raised symbol',['Raised symbol','Recessed pointer']),
 choice('gripProfile','Rotary grip','Fluted',['Smooth','Fluted','Scalloped']),numeric('gripCount','Rotary grip count',16,4,32,'',1),numeric('gripDepth','Rotary grip depth',10,2,25,'%',1),
 numeric('leverAngle','Lever or rocker angle',15,0,32,'degrees',1),choice('socketProfile','Socket profile','Round',['Round','Rectangular']),
 choice('outline','Cap profile','Round',['Round','Square','Oval']),choice('top','Top shape','Domed',['Flat','Domed','Concave','Stepped']),numeric('diameter','Cap width',40,20,100),numeric('depth','Oval depth',30,20,100),numeric('height','Overall height',14,6,35),numeric('shaft','Measured switch shaft diameter',6,0,20),numeric('socketDepth','Socket depth',7,2,20),numeric('tolerance','Diametral fit clearance',.25,0,1,'mm',.05),numeric('cornerRound','Square corner radius',0,0,10),choice('symbol','Raised symbol','Plus',['None','Plus','Minus','Dot','Pointer','Goat hoof','River wave','Mine crystal','Weather cloud','Sun','Lightning'])
],[['weather','Weather control',{}],['arcade','Arcade cover',{diameter:55,height:16,shaft:12}],['plain','Non-electronic tactile cap',{shaft:0,symbol:'Dot',top:'Flat'}],
 ['knob','Fluted dial',{controlStyle:'Rotary knob',height:19,socketDepth:6}],
 ['dish-dial','Scalloped dish dial',{controlStyle:'Rotary knob',rotaryTop:'Dish',gripProfile:'Scalloped',gripCount:8,gripDepth:16,rotaryMark:'Recessed pointer',height:19,socketDepth:6}],
 ['crown-dial','Stepped industrial dial',{controlStyle:'Rotary knob',rotaryTop:'Stepped',gripProfile:'Fluted',gripCount:20,gripDepth:14,rotaryMark:'Recessed pointer',height:21,socketDepth:6}],
 ['selector','Rotary selector',{controlStyle:'Rotary selector',gripProfile:'Smooth',symbol:'Pointer',height:18,socketDepth:6}],
 ['toggle','Angled toggle',{controlStyle:'Toggle lever',height:24,socketDepth:4}],
 ['rocker','Panel rocker',{controlStyle:'Rocker',height:18,socketDepth:4}],
 ['fader','Mixer fader cap',{controlStyle:'Fader cap',height:14,socketDepth:4,socketProfile:'Rectangular'}],
 ['joystick','Thumb joystick',{controlStyle:'Thumb joystick',height:30,socketDepth:5}],
 ['pad','Four-way directional pad',{controlStyle:'Directional pad',height:15,socketDepth:4}],
 ['broad-thumb','Wide thumb joystick',{controlStyle:'Thumb joystick',controlGrip:'Broad',height:30,socketDepth:5}],
 ['soft-fader','Rounded broad fader',{controlStyle:'Fader cap',controlGrip:'Broad',height:14,socketDepth:4,socketProfile:'Rectangular'}],
 ['indicator','Pilot-light lens',{controlStyle:'Indicator lens',shaft:0,height:12}]],p=>{
 if(p.controlStyle!=='Pushbutton')return panelControlRecipe(p);
 const d=p.outline==='Oval'?p.depth:p.diameter,r=p.diameter/2;
 if(p.socketDepth>p.height-2&&p.shaft>0)throw Error('Socket must leave a 2 mm minimum top wall.');
 if(p.shaft+p.tolerance>Math.min(p.diameter,d)-6)throw Error('Socket leaves too little side wall.');
 const outline=p.outline==='Square'?roundedSquare(r,Math.min(p.cornerRound,r-.1)):circle(r).map(([x,z])=>[x,z*d/p.diameter]);
 const positive=[extrusion(outline,p.height)],secondary=[];
 if(p.top==='Domed')positive.push(sphere([r,p.height*.3,d/2],[0,p.height*.8,0]));
 if(p.top==='Stepped')positive.push(cylinder(r*.72,2,[0,p.height+1,0]));
 const negative=p.shaft?[cylinder((p.shaft+p.tolerance)/2,p.socketDepth+.1,[0,p.socketDepth/2-.05,0])]:[];
 if(p.top==='Concave')negative.push(sphere([r*.8,r*.65,r*.8],[0,p.height+r*.57,0]));
 const y=p.top==='Domed'?p.height*1.1:p.top==='Stepped'?p.height+2:p.top==='Concave'?p.height-r*.08:p.height;
 secondary.push(...raisedControlSymbol(p.symbol,Math.min(p.diameter,d),y));
 const materialBand=secondary.length?undefined:box([p.diameter+2,1,d+2]);
 return {positive,secondary,negative,materialBand,bounds:{width:p.diameter,depth:d,height:p.height*1.15+2},warnings:['Adapter dimensions are nominal: measure the real switch, print a fit coupon and test operation. This is a cap, not a printed click mechanism.']};
},{supportsMechanisms:true});
export const pebbleGenerator=define('light-pods','Glowing Pebbles & Light Pods','Lighting',[
 choice('shellForm','Shell profile','Pebble',['Pebble','Swept stone','Lantern','Layered dome','Beacon']),
 choice('surface','Surface texture','Plain',['Plain','Ribs','Scallops']),numeric('relief','Texture depth',.16,0,.25,'',.01),
 numeric('width','Width',70,30,150),numeric('depth','Depth',55,25,140),numeric('height','Height',35,18,90),numeric('wall','Wall thickness',2.4,1.2,8,'mm',.2),numeric('facets','Circumference facets',32,12,64,'',4),boolean('illuminated','Accessible illumination cavity',true),numeric('opening','Underside access diameter',24,12,55),numeric('cable','Cable exit diameter',5,3,10)
],[['river','River pebble',{}],['mineral','Faceted mineral pod',{facets:12,width:60,depth:50,height:45}],['solid','Solid tactile pebble',{illuminated:false,width:55,height:28}],
 ['swept','Asymmetrical river stone',{shellForm:'Swept stone',depth:66,opening:22}],
 ['lantern','Ribbed lantern diffuser',{shellForm:'Lantern',surface:'Ribs',width:74,depth:68,height:55,opening:24}],
 ['layered','Scalloped low-profile dome',{shellForm:'Layered dome',surface:'Scallops',width:92,depth:72,height:24,opening:25}],
 ['beacon-tall','Fluted beacon',{shellForm:'Beacon',surface:'Plain',width:76,depth:68,height:61,opening:23}],
 ['beacon-low','Low scalloped beacon',{shellForm:'Beacon',surface:'Scallops',width:108,depth:79,height:31,opening:24}]],p=>{
 const radii=[p.width/2,p.height/2,p.depth/2],centre=[0,p.height*.43,0];
 if(p.shellForm!=='Pebble'||p.surface!=='Plain') {
  if(p.wall>=Math.min(...radii)-3)throw Error('Wall thickness leaves no usable inner volume.');
  const baseDiameter=Math.min(p.width,p.depth)*Math.sqrt(1-.86**2);
  if(p.illuminated&&p.opening+2*p.wall>baseDiameter)
   throw Error('Increase pod width or depth, or reduce the underside opening to leave a continuous rim.');
  if(p.illuminated&&p.cable>p.opening-2)
   throw Error('Cable exit must fit inside the underside opening.');
  const {bounds,...shell}=createPodShell(p),negative=[];
  if(p.illuminated) {
   // Scale the inner shell uniformly in its ellipsoid frame to preserve at
   // least the requested wall in every principal direction. Keep a real
   // floor that the access bore and cable slot open from outside.
   const scale=Math.min(1-p.wall/Math.min(...radii),(centre[1]-1)/radii[1]);
   negative.push(sphere(radii.map(r=>r*scale),centre),
    cylinder(p.opening/2,centre[1]+2,[0,centre[1]/2,0]),
    {...cylinder(p.cable/2,bounds.depth+4),rotation:[Math.PI/2,0,0],
     position:[0,p.cable/2,(bounds.depth+4)/2]});
  }
  return {positive:[shell],secondary:[],negative,bounds,
   materialSplitHeight:Math.max(3,p.wall,p.illuminated?p.cable+.5:0),
   materialSplitRole:'top',
   warnings:p.illuminated?[lightingWarning,'Inspect the underside opening, cable slot and roof in Cura.']:['Non-illuminated solid variant.']};
 }
 if(p.wall>=Math.min(...radii)-3)throw Error('Wall thickness leaves no usable inner volume.');
 if(p.illuminated&&p.opening>Math.min(p.width,p.depth)-p.wall*2-2)throw Error('Access opening leaves too little wall.');
 const outer={...sphere(radii,centre),segments:Math.round(p.facets)};
 const negative=[box([p.width+2,p.height,p.depth+2],[0,-p.height/2,0])];
 if(p.illuminated){negative.push(sphere(radii.map(r=>r-p.wall),centre),cylinder(p.opening/2,p.height/2,[0,p.height/4-1,0]),{...cylinder(p.cable/2,p.depth),rotation:[Math.PI/2,0,0],position:[0,p.cable/2,p.depth/2]});}
 const bandHeight=Math.max(3,p.wall,p.illuminated?p.cable+.5:0);
 return {positive:[outer],secondary:[],negative,
  materialSplitHeight:bandHeight,bounds:{width:p.width,depth:p.depth,height:p.height*.93},warnings:p.illuminated?[lightingWarning,'Inspect access opening, cable exit and curved roof in Cura.']:['Non-illuminated solid variant.']};
},{supportsLEDs:true});
// Characters lie flat as extruded, connected silhouettes with broad features.
export const characterGenerator=define('characters','Characters & Silhouettes','Characters',[
 choice('character','Character','Goat',['Goat','Sheep','Cloud','Boat','Sun','Pickaxe']),
 choice('construction','Construction','Classic',['Classic','Layered']),choice('silhouettePose','Silhouette pose','Standing',['Standing','Alert','Resting']),choice('reliefFinish','Relief finish','Stepped',['Plain','Stepped','Domed']),numeric('reliefRise','Relief rise',2,.5,3,'mm',.1),numeric('outlineRoundness','Corner softening',.18,0,.38,'',.01),
 numeric('width','Silhouette width',90,35,160),numeric('height','Silhouette height',65,25,140),numeric('depth','Relief depth',8,3,20),numeric('head','Head proportion',1,.65,1.3,'',.05),numeric('legs','Leg length',1,.5,1.3,'',.05)
],[['goat','Goat Farm goat',{}],['sheep','Woolly sheep',{character:'Sheep'}],['cloud','Weather cloud',{character:'Cloud'}],['boat','River boat',{character:'Boat'}],['sun','Weather sunshine',{character:'Sun'}],['mine','Mining pickaxe',{character:'Pickaxe'}],
 ['goat-alert','Alert goat relief',{construction:'Layered',silhouettePose:'Alert'}],
 ['sheep-rest','Resting sheep relief',{construction:'Layered',character:'Sheep',silhouettePose:'Resting'}],
 ['cloud-layered','Layered cloud',{construction:'Layered',character:'Cloud'}],
 ['boat-alert','Steam riverboat relief',{construction:'Layered',character:'Boat',silhouettePose:'Alert'}],
 ['sun-relief','Rounded sun relief',{construction:'Layered',character:'Sun',reliefFinish:'Domed'}],
 ['pickaxe-relief','Layered pickaxe',{construction:'Layered',character:'Pickaxe'}]],p=>{
 if(p.construction==='Layered')return layeredCharacter(p);
 const w=p.width,h=p.height,t=p.depth,positive=[],secondary=[];
 const ellipse=(rx,rz,x,z,depth=t,y=0)=>extrusion(circle(1,48).map(([a,b])=>[a*rx+x,b*rz+z]),depth,[0,y,0]);
 if(p.character==='Goat'||p.character==='Sheep'){
  positive.push(ellipse(w*.33,h*.25,-w*.08,0),ellipse(w*.16*p.head,h*.19*p.head,w*.29,-h*.16));
  for(const x of [-w*.25,w*.05])positive.push(box([w*.12,t,h*.36*p.legs],[x,t/2,h*.23]));
  if(p.character==='Goat')for(const x of [w*.22,w*.36])positive.push(extrusion([[x-w*.035,-h*.23],[x+w*.045,-h*.23],[x+w*.015,-h*.43]],t));
  else for(let i=0;i<6;i++)positive.push(ellipse(w*.11,h*.12,-w*.33+i*w*.105,-h*.15));
  secondary.push(ellipse(w*.035,h*.035,w*.34,-h*.20,1.2,t-.3));
 }else if(p.character==='Cloud'){
  positive.push(box([w*.65,t,h*.36],[0,t/2,h*.13]));for(const [x,z,r]of[[-.28,0,.20],[0,-.15,.28],[.28,0,.20]])positive.push(ellipse(w*r,h*r,x*w,z*h));
  secondary.push(ellipse(w*.12,h*.10,0,-h*.15,1.2,t-.3));
 }else if(p.character==='Boat'){
  positive.push(extrusion([[-w*.48,h*.08],[w*.48,h*.08],[w*.30,h*.34],[-w*.30,h*.34]],t),box([w*.06,t,h*.65],[0,t/2,-h*.05]));
  secondary.push(extrusion([[w*.02,-h*.4],[w*.38,h*.04],[w*.02,h*.04]],t));
 }else if(p.character==='Sun'){
  positive.push(ellipse(w*.30,h*.30,0,0));for(let i=0;i<8;i++){const a=i/8*Math.PI*2;positive.push(ellipse(w*.10,h*.10,Math.cos(a)*w*.30,Math.sin(a)*h*.30));}
  secondary.push(ellipse(w*.17,h*.17,0,0,1.2,t-.3));
 }else{
  positive.push(box([w*.12,t,h*.8],[0,t/2,h*.05]),extrusion([[-w*.47,-h*.25],[0,-h*.42],[w*.47,-h*.25],[w*.4,-h*.12],[0,-h*.26],[-w*.4,-h*.12]],t));
  secondary.push(box([w*.12,1.2,h*.3],[0,t+.3,h*.18]));
 }
 return {positive,secondary,negative:[],bounds:{width:w,depth:h,height:t+1.2},warnings:['Broad joined features reduce fragility; inspect printed horns, ears, legs and edges before participant use.']};
});
export const tileGenerator={...tactileTileGenerator,parameterSchema:tactileTileGenerator.parameterSchema.map(s=>({...s,label:s.label||s.key.replace(/[A-Z]/g,c=>' '+c.toLowerCase()),step:s.key==='seed'?1:s.key==='randomness'?.05:.5})),
 recipe(input){const r=generateTile(input);return {serialSupport:{outline:r.bodies[0].mesh.boreOutline,thickness:r.parameters.thickness},pixelBoreSupport:{outline:r.bodies[0].mesh.boreOutline,minThickness:r.parameters.thickness},positive:[{kind:'mesh',mesh:r.bodies[0].mesh}],partitioned:r.parameters.dualMaterial,secondary:r.bodies.length===2?[{kind:'mesh',mesh:r.bodies[1].mesh}]:[],negative:[],dualMaterial:r.parameters.dualMaterial,bounds:this.estimateBounds(input),warnings:['Tactile feel, cleanability and edge comfort require a printed sample.']};}};
export const svgArtworkGenerator=define('svg-artwork','Imported SVG artwork','Imports',[],[],
 p=>buildSvgExtrusionRecipe(p.artwork),{supportsDualMaterial:false});
export const generators=[tileGenerator,gearGenerator,waveGenerator,capGenerator,characterGenerator,pebbleGenerator];
export const studioGenerators=[...generators,svgArtworkGenerator];
export function makeCatalogue(crystalAdapter){const registry=createGeneratorRegistry();for(const g of [crystalAdapter,...studioGenerators].filter(Boolean))registry.register(g);return registry;}
export function applyBuildModules(recipe,build={},capabilities={}, {preview=false}={}){
 const r={...recipe,positive:[...recipe.positive],negative:[...(recipe.negative||[])],secondary:[...(recipe.secondary||[])],warnings:[...(recipe.warnings||[])]};
 // The same recipe reaches both preview and the fabrication worker.
 if(!r.partitioned){
  for(const role of ['positive','secondary']){
   r[role]=r[role].map((part,index)=>{
    if(part.kind==='mesh')return part;
    const partId=role+'-'+index+'-'+part.kind;
    const offset=build.partOffsets?.[partId];
    const position=part.position||[0,0,0];
    if(!offset)return {...part,partId};
    if(!Array.isArray(offset)||offset.length!==3||!offset.every(value=>Number.isFinite(value)&&Math.abs(value)<=50)||offset[1]<0)throw Error('Part offsets must be within 50 mm. Lift a part above its original position.');
    return {...part,partId,position:position.map((value,axis)=>value+offset[axis])};
   });
  }
 }
 const b=r.bounds;
 if(build.mounting&&capabilities.supportsMounting){
  const spacing=Math.min(build.spacing||b.width*.55,b.width*.65),diameter=build.holeDiameter||3.4;
  if(diameter<2||diameter>8||spacing<diameter*3)throw Error('Mounting hole spacing or diameter is unsafe.');
  const style=build.mountStyle||'Through holes';
  for(const x of [-spacing/2,spacing/2]){
   r.negative.push(cylinder(diameter/2,b.height+4,[x,b.height/2,0]));
   if(style==='Underside counterbores')r.negative.push(cylinder(diameter*.75,1.6,[x,.6,0]));
   if(style==='Underside countersinks'){
    r.negative.push({...cylinder(diameter*.75,1.6,[x,.6,0]),topRadius:diameter/2});
   }
  }
  r.warnings.push('Through mounting holes are un-rated; test actual mounting loads.');
 }
 if(build.base&&capabilities.supportsBase){const thickness=Number(build.baseThickness||3);if(thickness<2||thickness>15)throw Error('Base thickness must be 2-15 mm.');r.positive.push(box([b.width+6,thickness,b.depth+6]));r.bounds={...b,width:b.width+6,depth:b.depth+6};if(r.materialBand)r.materialBand={...r.materialBand,size:[r.bounds.width+2,r.materialBand.size[1],r.bounds.depth+2]};}
 // An opt-in, real positive backing provides material for pixel seats on
 // curves and open shells. Old models never receive this automatically.
 if(build.pixelBacking){
  if(!capabilities.supportsBase||r.partitioned)
   throw Error('Fitting backing needs a compatible single-material model. Turn off dual-material mode.');
  const thickness=Number(build.pixelBackingThickness??4);
  if(!Number.isFinite(thickness)||thickness<3||thickness>10)
   throw Error('Choose 3–10 mm fitting backing thickness.');
  const b=r.bounds,spread=12;
  const width=b.width+spread*2,depth=b.depth+spread*2;
  r.positive.push(box([width,thickness,depth]));
  // Only certify the new continuous underside slab. The planner still checks cutters.
  r.serialSupport={outline:[[-width/2,-depth/2],[width/2,-depth/2],[width/2,depth/2],[-width/2,depth/2]],thickness,explicitBacking:true};
  r.bounds={...b,width:b.width+spread*2,depth:b.depth+spread*2,height:Math.max(b.height,thickness)};
  r.warnings.push('Expanded fitting backing was explicitly enabled. Inspect underside openings, material joins and support requirements in Cura and on a printed sample.');
 }
 if(build.pixelBuilderVersion===1){
  const holes=build.pixelHoles||[];
  for(const [index,hole] of holes.entries())if(hole.checked){
   const reason=checkedPixelBore(r,hole,holes.filter((_,i)=>i!==index));
   if(reason)throw Error('P'+(index+1)+': '+reason);
  }
 }
 const routing=planNativePixelString(r,build);
 if(routing.enabled&&!routing.ready&&!preview)throw Error(routing.reason);
 addPixelHoleCuts(r,build.pixelHoles);
 if(routing.ready){
  r.negative.push(...routing.cutters);
  r.warnings.push('Serial grooves are underside-open. Check cable seating and roof layers in Cura and on a physical print.');
 }
 r.nativeRouting=routing;
 return r;
}

gearGenerator.visualFields=['wheelStyle','webStyle','reliefStyle','diameter','teeth','spokes','rimWidth','webWidth','reliefHeight'];



pebbleGenerator.visualFields=['shellForm','surface','relief','width','depth','height','wall','opening','cable'];
