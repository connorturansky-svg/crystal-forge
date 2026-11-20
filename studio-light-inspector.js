import {manualLightChecks} from './light-passage-inspection.js';

export function createLightInspector({THREE, scene, camera, prepare, cancel}) {
 const root=document.createElement('details');
 root.id='smsLightInspector';root.className='sms-panel-details';
 root.innerHTML=`<summary>Light Path Inspection<span data-summary-status></span></summary>
  <p role="status"></p>
  <div class="sms-actions"><button type="button" data-prepare>Prepare inspection</button><button type="button" data-cancel hidden>Cancel preparation</button></div>
  <fieldset hidden><legend>Prepared section</legend>
  <label><input type="checkbox" data-section-toggle checked> Cut section</label>
  <label>Section axis <select><option>X</option><option>Z</option></select></label>
  <label>Section position <input type="range"><output></output></label>
  <button type="button" data-reset>Reset section</button>
  <label data-overlay><input type="checkbox" checked> Show light paths</label>
  </fieldset>
  <div data-results></div><button type="button" data-close>Close inspection</button>`;
 const status=root.querySelector('[role=status]'),controls=root.querySelector('fieldset');
 const axis=root.querySelector('select'),slider=root.querySelector('[type=range]'),offset=root.querySelector('output');
 const sectionToggle=root.querySelector('[data-section-toggle]'),overlay=root.querySelector('[data-overlay] input'),results=root.querySelector('[data-results]');
 const prepareButton=root.querySelector('[data-prepare]'),cancelButton=root.querySelector('[data-cancel]');
 const plane=new THREE.Plane(),bounds=new THREE.Box3();
 const inspectionLayer=21;
 let group,paths,marker,report,activeModel,result,jobState,jobError,selected,cameraMask,modelType,lights=[];
 const showSection=(reset=false)=>{
  const key=axis.value.toLowerCase(),min=bounds.min[key],max=bounds.max[key];
  if(reset){slider.min=min;slider.max=max;slider.step=.1;slider.value=(min+max)/2;}
  const position=Number(slider.value);
  plane.normal.set(key==='x'?1:0,0,key==='z'?1:0);plane.constant=-position;
  offset.value=position.toFixed(1)+' mm · '+Math.round(100*(position-min)/(max-min||1))+'%';
 };
 const clear=()=>{
  if(!group)return;
  camera.layers.mask=cameraMask;
  for(const [light,mask] of lights)light.layers.mask=mask;
  scene.remove(group);
  group.traverse(object=>{object.geometry?.dispose();object.material?.dispose();});
  group=null;paths=null;marker=null;lights=[];
 };
 const makeGeometry=mesh=>{
  const source=mesh.vertProperties||mesh.points,stride=mesh.numProp||3;
  const points=new Float32Array(source.length/stride*3);
  for(let from=0,to=0;from<source.length;from+=stride,to+=3){
   points[to]=source[from];points[to+1]=source[from+1];points[to+2]=source[from+2];
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(points,3));
  geometry.setIndex(new THREE.BufferAttribute(Uint32Array.from(mesh.triVerts||mesh.triangles),1));
  geometry.computeVertexNormals();
  return geometry;
 };
 const select=(row,button)=>{
  selected=row?.id;
  results.querySelectorAll('button').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  const points=row.crystalPosition?[row.crystalPosition]:row.points;
  if(!points)return;
  const endpoint=points.at(-1),key=axis.value.toLowerCase();
  marker.position.set(...endpoint);marker.visible=true;
  const value=key==='x'?endpoint[0]:endpoint[2];
  slider.value=value-Math.max(.15,(bounds.max[key]-bounds.min[key])*.025);
  showSection();
 };
 const draw=()=>{
  clear();
  if(!root.open||!result)return;
  group=new THREE.Group();paths=new THREE.Group();group.add(paths);
  for(const {mesh} of result.bodies){
   group.add(new THREE.Mesh(makeGeometry(mesh),new THREE.MeshStandardMaterial({
    color:0xa4b9ca,roughness:.65,flatShading:true,side:THREE.DoubleSide,clippingPlanes:sectionToggle.checked?[plane]:[]
   })));
  }
  bounds.setFromObject(group);
  marker=new THREE.Mesh(new THREE.SphereGeometry(1.2,12,8),new THREE.MeshBasicMaterial({color:0xffff5a,depthTest:false}));
  marker.visible=false;group.add(marker);
  for(const row of report?.rows||[]){
   if(!row.points||row.status!=='clear'&&row.status!=='blocked')continue;
   const line=new THREE.BufferGeometry().setFromPoints(row.points.map(point=>new THREE.Vector3(...point)));
   paths.add(new THREE.Line(line,new THREE.LineBasicMaterial({color:row.status==='clear'?0x007e89:0xb92836,depthTest:false})));
  }
  paths.visible=overlay.checked;
  cameraMask=camera.layers.mask;
  scene.traverse(light=>{if(light.isLight){lights.push([light,light.layers.mask]);light.layers.enable(inspectionLayer);}});
  group.traverse(object=>object.layers.set(inspectionLayer));
  scene.add(group);camera.layers.set(inspectionLayer);
  showSection(true);
  const row=report?.rows.find(row=>row.id===selected);
  if(row)select(row,[...results.querySelectorAll('button')].find(button=>button.dataset.crystal===String(row.id)));
 };
 const render=()=>{
  report=result?.report.lightPassageInspection;
  const needsReview=report?report.counts.blocked+report.counts.skipped+report.counts.unknown:0;
  root.querySelector('[data-summary-status]').textContent=needsReview?' · '+needsReview+' to review':'';
  controls.hidden=!result;
  root.querySelector('[data-overlay]').hidden=!report;
  prepareButton.disabled=jobState==='preparing';
  cancelButton.hidden=jobState!=='preparing';
  prepareButton.textContent=result?'Refresh inspection':'Prepare inspection';
  status.textContent=jobState==='preparing'?'Preparing the current model…':jobState==='failed'?(jobError||'Preparation failed. Retry from this panel.'):!result?'Preview only — prepare first to inspect real cuts.':report?'Prepared manufacturing mesh · '+report.mode+' · software sampling only.':modelType==='light-pods'?'Prepared Light Pod · access geometry visible. Illumination unverified.':'Prepared manufacturing mesh · verified export geometry.';
  results.replaceChildren();
  if(report){
   const key=document.createElement('p');key.textContent='Teal: sampled clear. Red: obstructed route trace.';results.append(key);
   const summary=document.createElement('p');
   summary.textContent=Object.entries(report.counts).map(([label,count])=>count+' '+label).join(' · ');
   results.append(summary);
   const list=document.createElement('ul');
   for(const row of report.rows){
    const li=document.createElement('li'),button=document.createElement('button');
    button.type='button';button.dataset.crystal=row.id;button.textContent='Inspect '+row.name;
    button.setAttribute('aria-pressed','false');button.onclick=()=>select(row,button);
    li.append(button,document.createTextNode(' '+(row.status==='clear'?'Sampled clear':row.status)+' · '+(row.source?row.source+' · ':'')+row.reason));
    list.append(li);
   }
   results.append(list);
   const note=document.createElement('p');note.textContent=manualLightChecks;results.append(note);
  }
  draw();
 };
 root.addEventListener('toggle',()=>root.open?render():clear());
 root.querySelector('[data-close]').onclick=()=>{root.open=false;clear();root.querySelector('summary').focus();};
 prepareButton.onclick=()=>prepare(activeModel);
 cancelButton.onclick=()=>cancel(activeModel);
 sectionToggle.onchange=()=>draw();
 axis.onchange=()=>{if(!sectionToggle.checked){sectionToggle.checked=true;draw();}else showSection(true);};
 slider.oninput=()=>showSection();
 root.querySelector('[data-reset]').onclick=()=>{selected=null;marker.visible=false;results.querySelectorAll('[aria-pressed]').forEach(item=>item.setAttribute('aria-pressed','false'));axis.value='X';showSection(true);};
 overlay.onchange=()=>{if(paths)paths.visible=overlay.checked;};
 root.hidden=true;
 return {root,hasPrepared:()=>!!result,openManufacturingMesh(){
  if(!activeModel)return;
  sectionToggle.checked=false;root.open=true;draw();
  if(!result&&jobState!=='preparing')prepare(activeModel);
 },update(model,nextResult,nextState,type,nextError){
  if(model===activeModel&&nextResult===result&&nextState===jobState&&nextError===jobError)return;
  if(model!==activeModel){root.open=false;selected=null;axis.value='X';sectionToggle.checked=true;}
  activeModel=model;result=nextResult;jobState=nextState;jobError=nextError;modelType=type;root.hidden=!model;render();
 }};
}
