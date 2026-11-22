import {footprintCentre,patternMountTransaction} from './mounting-pattern.js';

const defaults={kind:'line',alignment:'centre',count:2,rows:2,columns:2,
 pitchMm:30,pitchXmm:20,pitchZmm:20,radiusMm:20,angleDeg:0,startAngleDeg:0,offsetX:0,offsetZ:0};
const dimensions={
 line:[['count','Quantity'],['pitchMm','Pitch (mm)'],['angleDeg','Direction (°)']],
 circle:[['count','Quantity'],['radiusMm','Pattern radius (mm)'],['startAngleDeg','Starting angle (°)']],
 grid:[['rows','Rows'],['columns','Columns'],['pitchXmm','X pitch (mm)'],['pitchZmm','Z pitch (mm)'],['angleDeg','Rotation (°)']]
};
const presets=[
 ['2-hole line',{kind:'line',count:2}],['3-hole line',{kind:'line',count:3}],['4-hole line',{kind:'line',count:4}],
 ...[3,4,6,8].map(count=>[count+'-hole circle',{kind:'circle',count}]),
 ...[[2,2],[2,3],[3,3]].map(([rows,columns])=>[rows+' × '+columns+' grid',{kind:'grid',rows,columns}])
];

export function mountPatternEditor({patterns,mounts,limit,footprint,profiles,fixedProfile,validate,apply,ungroup,onPreview=()=>{}}){
 const root=document.createElement('fieldset');
 root.innerHTML='<legend>Mounting patterns</legend><label>Pattern<select data-pattern-select></select></label>'+
  '<div data-pattern-fields></div><p data-pattern-status role="status"></p><ol data-pattern-preview></ol>'+
  '<button type="button" data-pattern-apply>Apply pattern</button> '+
  '<button type="button" data-pattern-ungroup>Ungroup</button>';
 const get=key=>root.querySelector('[data-pattern-'+key+']');
 const selection=get('select'),fields=get('fields'),button=get('apply'),ungroupButton=get('ungroup');
 selection.add(new Option('Add new pattern',''));
 patterns.forEach((entry,index)=>selection.add(new Option(entry.kind+' '+(index+1),entry.id)));
 let draft,fixing,transaction;
 const origin=footprintCentre(footprint);
 function moveCentre(x,z){
  if(fields.inert)return;
  const redraw=draft.alignment!=='custom';
  draft.alignment='custom';draft.offsetX=x-origin.x;draft.offsetZ=z-origin.z;
  if(redraw)renderFields();
  else{
   fields.querySelector('[data-pattern-field=offsetX]').value=draft.offsetX;
   fields.querySelector('[data-pattern-field=offsetZ]').value=draft.offsetZ;
   preview();
  }
 }
 function load(){
  const saved=patterns.find(entry=>entry.id===selection.value);
  draft={...defaults,id:crypto.randomUUID(),...saved};
  fixing=fixedProfile??{profile:profiles[0],entryFace:'underside',diameter:3.4,...saved?.fixing};
  if(draft.kind==='circle'&&!saved)draft.count=4;
  ungroupButton.hidden=!saved;
  button.textContent=saved?'Replace selected pattern':'Apply pattern';
  renderFields();
 }
 function field(label,control){
  const wrapper=document.createElement('label');wrapper.append(label,control);fields.append(wrapper);
 }
 function select(label,key,options,target,redraw=false){
  const control=document.createElement('select');control.dataset.patternField=key;
  options.forEach(([value,label])=>control.add(new Option(label,value)));
  control.value=target[key];
  control.onchange=()=>{
   target[key]=control.value;
   if(key==='kind'&&control.value==='circle'&&draft.count<3)draft.count=4;
   if(redraw)renderFields();else preview();
  };
  field(label,control);
 }
 function number(key,label,target){
  const control=document.createElement('input');
  control.type='number';control.step='any';control.dataset.patternField=key;
  control.value=target[key]??'';
  control.oninput=()=>{target[key]=control.valueAsNumber;preview();};
  field(label,control);
 }
 function renderFields(){
  fields.replaceChildren();
  const preset=document.createElement('select');
  preset.add(new Option('Choose a preset',''));
  presets.forEach(([label],index)=>preset.add(new Option(label,String(index))));
  preset.onchange=()=>{
   if(preset.value==='')return;
   Object.assign(draft,presets[Number(preset.value)][1]);renderFields();
  };
  field('Layout preset',preset);
  select('Layout','kind',[['line','Line'],['circle','Circle / Radial'],['grid','Grid']],draft,true);
  dimensions[draft.kind].forEach(([key,label])=>number(key,label,draft));
  select('Centre alignment','alignment',[['centre','Model centre'],['x','X centreline'],['z','Z centreline'],['custom','Custom offset']],draft,true);
  if(['custom','z'].includes(draft.alignment))number('offsetX','Centre X offset (mm)',draft);
  if(['custom','x'].includes(draft.alignment))number('offsetZ','Centre Z offset (mm)',draft);
  if(fixedProfile){
   const note=document.createElement('p');
   note.textContent=fixing.profile+' · '+fixing.diameter+' mm diameter · '+fixing.depth+' mm depth';
   fields.append(note);
  }else{
   select('Fixing profile','profile',profiles.map(profile=>[profile,profile]),fixing,true);
   select('Entry face','entryFace',[['underside','Underside'],['top','Top']],fixing);
   number('diameter','Hole diameter (mm)',fixing);
   if(fixing.profile!==profiles[0]){
    number('recessDiameter','Recess or pocket diameter (mm)',fixing);
    number('recessDepth','Recess or pocket depth (mm)',fixing);
   }
  }
  preview();
 }
 function preview(){
  const list=get('preview'),status=get('status');
  transaction=null;button.disabled=true;list.replaceChildren();
  try{
   const activeFixing={...fixing};
   if(!fixedProfile&&fixing.profile===profiles[0]){delete activeFixing.recessDiameter;delete activeFixing.recessDepth;}
   const next=patternMountTransaction({patterns,mounts,limit,footprint,pattern:draft,fixing:activeFixing});
   const issues=validate(next);
   onPreview(next,issues,moveCentre);
   next.candidates.forEach(({x,z},index)=>{
    const row=document.createElement('li'),issue=issues[index];
    row.textContent='X '+x.toFixed(3)+' mm, Z '+z.toFixed(3)+' mm'+(issue?' — '+issue:'');
    if(issue)row.className='warning';
    list.append(row);
   });
   status.textContent='Centre X '+next.centre.centerX.toFixed(3)+' mm, Z '+next.centre.centerZ.toFixed(3)+' mm.'+
    (issues.some(Boolean)?' Resolve the marked holes before applying.':'');
   if(!issues.some(Boolean)){transaction=next;button.disabled=false;}
  }catch(error){onPreview(null);status.textContent=error.message;}
 }
 selection.onchange=load;
 button.onclick=async()=>{
  if(!transaction||fields.inert)return;
  const previous=patterns.find(pattern=>pattern.id===draft.id);
  const removed=(previous?.members.length??0)-transaction.candidates.length;
  if(removed>0&&!window.confirm('Replace this pattern and remove '+removed+' mounting hole'+(removed===1?'?':'s?')))return;
  fields.inert=true;selection.disabled=true;button.disabled=true;ungroupButton.disabled=true;
  try{await apply(transaction);}
  catch(error){get('status').textContent=error.message;}
  finally{fields.inert=false;selection.disabled=false;button.disabled=false;ungroupButton.disabled=false;}
 };
 ungroupButton.onclick=()=>ungroup(selection.value);
 load();
 return root;
}
