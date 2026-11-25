import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {planHardware} from '../hardware-layout.js';
import {baseSurfaceHeight} from '../geometry-v3.js';
import {solvePixelMove} from '../pixel-motion.js';

function bounds(points){
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const point of points)for(let axis=0;axis<3;axis++){
  min[axis]=Math.min(min[axis],point[axis]);max[axis]=Math.max(max[axis],point[axis]);
 }
 assert(min.every(Number.isFinite)&&max.every(Number.isFinite));
 return {min,max,size:max.map((value,i)=>value-min[i])};
}
function stlPoints(bytes){
 const count=bytes.readUInt32LE(80);
 assert(count>0);
 assert.equal(bytes.length,84+50*count);
 return Array.from({length:count*3},(_,i)=>{
  const offset=96+Math.floor(i/3)*50+(i%3)*12;
  return [0,4,8].map(axis=>bytes.readFloatLE(offset+axis));
 });
}
function modelXml(bytes){
 for(let offset=0;offset+30<=bytes.length&&bytes.readUInt32LE(offset)===0x04034b50;){
  const length=bytes.readUInt16LE(offset+26),start=offset+30+length+bytes.readUInt16LE(offset+28);
  const size=bytes.readUInt32LE(offset+18);
  if(bytes.toString('utf8',offset+30,offset+30+length)==='3D/3dmodel.model'){
   assert.equal(bytes.readUInt16LE(offset+8),0);
   return bytes.toString('utf8',start,start+size);
  }
  offset=start+size;
 }
 assert.fail('Missing 3MF model');
}

const browser=await chromium.launch({headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
 await page.goto(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321');
 await page.waitForFunction(()=>window.__sensoryStudio);
 await page.evaluate(()=>window.__sensoryStudio.addModel('crystals',{
  seed:42,count:5,width:94,height:127,baseStyle:'Square',baseWidth:11,
  baseHeight:14,cutSockets:false,lightingMode:'none'
 },'WT021 asymmetric Crystal'));
 const model=()=>page.evaluate(()=>({id:window.__sensoryStudio.currentModel.id,revision:window.__sensoryStudio.currentModel.revision}));
 const readDimensions=async locator=>(await locator.innerText()).match(/\d+(?:\.\d+)?(?= (?:×|x|mm))/g).slice(0,3).map(Number);
 const dimensions=page.locator('#smsModelDimensions');
 const viewportRender=page.locator('.viewarea').getByRole('button',{name:'Render actual model',exact:true});
 await dimensions.filter({hasText:'Design preview'}).waitFor();
 await viewportRender.waitFor({state:'hidden'});
 const initial=await model(),design=await readDimensions(dimensions);
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 const build=await readDimensions(dimensions);
 assert.deepEqual(design,build);
 await page.setViewportSize({width:390,height:844});
 await viewportRender.click({trial:true});
 await page.setViewportSize({width:1440,height:1000});
 await viewportRender.click();
 const inspector=page.locator('#smsLightInspector');
 await inspector.getByText('Prepared manufacturing mesh').waitFor({timeout:120000});
 const prepared=await readDimensions(dimensions.filter({hasText:'Prepared'}));
 const revision=await model();
 assert.equal(revision.id,initial.id);
 await inspector.getByRole('button',{name:'Close inspection'}).click();
 await page.locator('.sms-workspace-nav [data-tab=print]').click();
 await viewportRender.waitFor({state:'hidden'});
 const job=page.locator('#smsJobs article');
 assert.equal(await job.count(),1,await page.locator('#smsJobs').innerText());
 await job.getByText('Prepared',{exact:true}).waitFor({timeout:5000});
 const print=await readDimensions(job.getByText(/^Prepared X/));
 const download=async selector=>{
  const [file]=await Promise.all([page.waitForEvent('download'),job.locator(selector).click()]);
  return readFile(await file.path());
 };
 const initialStlPoints=stlPoints(await download('[data-job-stl]'));
 const stl=bounds(initialStlPoints);
 const xml=modelXml(await download('[data-job-3mf]'));
 assert.match(xml,/<model unit="millimeter"/);
 assert.match(xml,/<item objectid="2" transform="1 0 0 0 1 0 0 0 1 0 0 0"/);
 const mf=bounds([...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].map(match=>match.slice(1).map(Number)));
 for(const key of ['min','max'])for(let axis=0;axis<3;axis++)assert(Math.abs(stl[key][axis]-mf[key][axis])<.001);
 const rounded=stl.size.map(value=>Number(value.toFixed(1)));
 assert.equal(new Set(rounded).size,3,'Fixture must distinguish every print axis');
 assert.deepEqual(design,rounded);
 assert.deepEqual(prepared,rounded);
 assert.deepEqual(print,rounded);
 assert.deepEqual(await model(),revision);
 console.log('WT-021 Crystal dimensional evidence:',JSON.stringify({initial,revision,design,build,prepared,print,stl,mf}));
 const openDesign=()=>page.locator('.sms-workspace-nav [data-tab=design]').click();
 const openPrint=()=>page.locator('.sms-workspace-nav [data-tab=print]').click();
 const prepareTipRevision=async()=>{
  await openPrint();
  await job.getByText('Stale',{exact:true}).waitFor();
  assert(await job.locator('[data-job-stl]').isDisabled());
  assert(await job.locator('[data-job-3mf]').isDisabled());
  await job.locator('[data-job-prepare]').click();
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  return {
   stl:stlPoints(await download('[data-job-stl]')),
   mf:[...modelXml(await download('[data-job-3mf]')).matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)]
    .map(match=>match.slice(1).map(Number))
  };
 };
 const crystalState=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')));
 const expandParents=locator=>locator.evaluate(element=>{
  for(let ancestor=element.parentElement;ancestor;ancestor=ancestor.parentElement)
   if(ancestor.tagName==='DETAILS')ancestor.open=true;
 });
 await openDesign();
 const selected=page.locator('#objectTree [data-id]').first();
 await expandParents(selected);
 await selected.click();
 const selectedId=await selected.getAttribute('data-id');
 const tip=page.locator('[data-state=tipRound]');
 await expandParents(tip);
 const originalState=await crystalState();
 const beforeTip={stl:initialStlPoints,mf:[...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].map(match=>match.slice(1).map(Number))};
 await tip.evaluate(input=>{input.value='4.5';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.waitForFunction(id=>JSON.parse(localStorage.getItem('crystal-forge-v3')).crystals
  .some(crystal=>crystal.id===id&&crystal.shape?.tipRound>4),selectedId);
 const editedState=await crystalState();
 assert.equal(editedState.settings.tipRound,originalState.settings.tipRound);
 assert.deepEqual(editedState.crystals.filter(crystal=>crystal.id!==selectedId),
  originalState.crystals.filter(crystal=>crystal.id!==selectedId));
 const editedTip=await prepareTipRevision();
 assert.notDeepEqual(editedTip.stl,beforeTip.stl);
 assert.notDeepEqual(editedTip.mf,beforeTip.mf);
 await openDesign();
 await page.locator('#smsGlobalUndo').click();
 assert.deepEqual((await crystalState()).crystals,originalState.crystals);
 assert.deepEqual(await prepareTipRevision(),beforeTip);
 await openDesign();
 await page.locator('#smsGlobalRedo').click();
 assert.deepEqual((await crystalState()).crystals,editedState.crystals);
 assert.deepEqual(await prepareTipRevision(),editedTip);
 console.log('WT-021 selected Crystal tip edit, undo and redo match both prepared print formats');
 await page.evaluate(()=>window.__sensoryStudio.addModel('crystals',{
  seed:42,count:5,width:94,baseHeight:35,baseWidth:18,cutSockets:true,lightingMode:'single',socketConical:true
 },'WT021 physical fitting'));
 await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
 const toggle=page.locator('.sms-palette').getByRole('checkbox',{name:'Show physical pixels and socket cutters'});
 await toggle.check();
 const fit=page.locator('[data-build-fit-preview-status]');
 await fit.getByText(/insertion 22\.00 mm/).waitFor();
 assert.match(await fit.innerText(),/centre roof [\d.]+ mm/);
 assert.match(await fit.innerText(),/interfering with base/);
 const shoulders=page.locator('.sms-palette').getByRole('checkbox',{name:'Support-Free Shoulders'});
 assert.equal(await shoulders.isChecked(),false);
 await shoulders.check();
 const shoulderAngle=page.locator('.sms-palette').getByRole('slider',{name:'Shoulder angle from horizontal'});
 assert.equal(await shoulderAngle.inputValue(),'45');
 await fit.getByText(/insertion 22\.25 mm/).waitFor();
 await shoulderAngle.press('End');
 assert.equal(await shoulderAngle.inputValue(),'60');
 await fit.getByText(/insertion 22\.43 mm/).waitFor();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.socketShoulderAngle),60);
 await shoulders.uncheck();
 await fit.getByText(/insertion 22\.00 mm/).waitFor();
 await toggle.uncheck();
 assert.equal(await fit.innerText(),'');
 console.log('WT-021 Crystal physical fitting preview toggled in Build');
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 const baseHeight=page.locator('.sms-palette').getByRole('slider',{name:'Base height',exact:true});
 await baseHeight.evaluate(input=>{
  input.value='25';
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await viewportRender.click();
 await inspector.getByRole('status').filter({hasText:/Conical pixel socket needs \d+\.\d+ mm of stock/}).waitFor({timeout:120000});
 await page.locator('.sms-palette').getByRole('button',{name:'Fit base to pixel sockets',exact:true}).click();
 const fittedHeight=Number(await baseHeight.inputValue());
 assert.equal(fittedHeight,31,'Pointed gumdrop socket needs a taller base than the previous maximum');
 await viewportRender.click();
 await inspector.getByText('Prepared manufacturing mesh').waitFor({timeout:120000});
 await inspector.getByRole('button',{name:'Close inspection'}).click();
 await page.evaluate(()=>window.__sensoryStudio.addModel('crystals',{
  seed:42,count:5,width:94,baseType:'integrated',baseStyle:'Square',baseHeight:24,baseWidth:32,baseDome:0,
  cutSockets:true,lightingMode:'multi',pixelPlacement:'manual',manualPixelHoles:[],pixelProfileId:'seed',
  wireMode:'string',wireChannels:false,wireInputTailLength:150,wireOutputTailLength:150,pixelStringSpacing:100,wireWidth:3.2,
  tabCount:2,tabHolesPerTab:1,tabHoleDiameter:3.4,tabThickness:5,tabWall:3
 },'WT021 full Crystal'));
 const crystal=()=>page.evaluate(()=>window.__sensoryStudio.currentModel);
 const reveal=async locator=>{
  await locator.evaluate(element=>{for(let node=element.parentElement;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;});
  return locator;
 };
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 const width=await reveal(page.locator('[data-state=width]'));
 await width.press('ArrowRight');
 assert((await crystal()).parameters.width>94);
 await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
 const profile=await reveal(page.locator('#pixelProfileSelect'));
 await profile.selectOption('seed');
 await page.locator('[data-view=top]').click();
 await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
 await (await reveal(page.locator('#placePixelBtn'))).click();
 const sample=async (x,y)=>{
  await page.mouse.move(x,y);
  return page.evaluate(()=>window.__crystalForgePlacementMetrics());
 };
 const onBase=async(x,z,y)=>{
  const viewport=await page.locator('#viewport canvas').boundingBox();
  const {camera,target}=await page.evaluate(()=>window.__crystalForgeViewMetrics());
  const model=await crystal();
  const projection=new THREE.PerspectiveCamera(46,viewport.width/viewport.height,.1,5000);
  projection.position.fromArray(camera);
  projection.lookAt(new THREE.Vector3(...target));
  projection.updateMatrixWorld();
  const p=new THREE.Vector3(x,y??baseSurfaceHeight(model.editableState.crystals,model.parameters,x,z),z).project(projection);
  return {x:viewport.x+(p.x+1)*viewport.width/2,y:viewport.y+(1-p.y)*viewport.height/2};
 };
 for(const [i,x] of [-18,18].entries()){
  const location=await onBase(x,0);
  const cursor=await sample(location.x,location.y);
  assert(cursor.valid,JSON.stringify({location,cursor}));
  await page.mouse.click(location.x,location.y);
  await page.waitForFunction(count=>window.__sensoryStudio.currentModel.parameters.manualPixelHoles.length===count,i+1);
 }
 await page.keyboard.press('Escape');
 const prior=(await crystal()).parameters.manualPixelHoles;
 const p2=page.locator('.hardware-marker[data-hw-kind=pixel]').filter({hasText:'P2'});
 await p2.click();
 const marker=await p2.boundingBox();
 const destination=await onBase(32,0);
 await page.mouse.move(marker.x+marker.width/2,marker.y+marker.height/2);
 await page.mouse.down();
 await page.waitForTimeout(225);
 await page.mouse.move(destination.x,destination.y,{steps:6});
 await page.mouse.up();
 await page.waitForFunction(x=>window.__sensoryStudio.currentModel.parameters.manualPixelHoles[1].x>x+2,prior[1].x,{timeout:8000}).catch(async error=>{
  throw Error('Crystal drag did not commit: '+await page.locator('#status').innerText()+' '+JSON.stringify((await crystal()).parameters.manualPixelHoles),{cause:error});
 });
 const p2x=await reveal(page.locator('[data-hole-kind=pixel][data-hole-axis=x][data-hole-index="1"]'));
 const acceptedX=await p2x.inputValue();
 await p2x.fill('9999');await p2x.press('Tab');
 assert.equal(Number(await p2x.inputValue()),Number(acceptedX));
 await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
 await (await reveal(page.locator('[data-state=wireChannels]'))).check();
 await page.locator('#wireRouteStatus').getByText(/ready|fit/i).first().waitFor();
 await page.locator('#advancedBtn').click();
 await page.locator('.sms-workspace-nav [data-workspace=mounting]').click();
 await (await reveal(page.locator('[data-state=mount]'))).selectOption('Edge fixing tabs');
 const autoTabs=await crystal();
 const originalPositions=planHardware(autoTabs.editableState.crystals,autoTabs.parameters).tabs.map(tab=>tab.u);
 const editTabs=page.getByRole('button',{name:'Make edge tabs editable'});
 await (await reveal(editTabs)).click();
 await page.keyboard.press('Escape');
 assert.deepEqual((await crystal()).parameters.manualEdgeTabs.map(tab=>tab.u),originalPositions);
 for(const [i,u] of [13,63].entries()){
  const tab=await reveal(page.locator('[data-tab-u="'+i+'"]'));
  await tab.fill(String(u));await tab.press('Tab');
 }
 assert.equal((await crystal()).parameters.manualEdgeTabs.length,2);
 await (await reveal(page.locator('#placeMountBtn'))).click();
 for(const [i,x] of [-14,14].entries()){
  const location=await onBase(x,-40);
  assert((await sample(location.x,location.y)).valid);
  await page.mouse.click(location.x,location.y);
  await page.waitForFunction(count=>window.__sensoryStudio.currentModel.parameters.manualMountHoles.length===count,i+1);
 }
 await page.keyboard.press('Escape');
 const mountZ=await reveal(page.locator('[data-hole-kind=mount][data-hole-axis=z][data-hole-index="1"]'));
 await mountZ.fill('-42');await mountZ.press('Tab');
 assert.equal((await crystal()).parameters.manualMountHoles[1].z,-42);
 const crystalCalibration=new Map([['pixelName','Crystal measured seed fit'],['pixelSocketClearance','.4']]);
 await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
 await (await reveal(page.locator('#editPixelProfileBtn'))).click();
 for(const [id,value] of crystalCalibration)await page.locator('#'+id).fill(value);
 await page.locator('#applyPixelSocketFit').click();
 const savedCrystal=await crystal();
 const hardware=planHardware(savedCrystal.editableState.crystals,savedCrystal.parameters);
 assert.equal(hardware.sockets.length,2);
 assert.equal(hardware.mounts.length,2);
 assert.equal(hardware.tabHoles.length,2);
 assert(hardware.wirePlan.ready,hardware.wirePlan.messages.join(' '));
 assert(hardware.sockets.some(socket=>Math.abs(socket.diameter-5.4)<.001));
 await page.locator('#smsProjectTitle').fill('WT-021 Crystal manufacturing journey');
 await page.locator('#smsProjectTitle').press('Tab');
 await page.locator('#smsLibrary').click();
 await page.locator('#smsSaveProject').click();
 await page.locator('#smsSavedProjects').getByRole('heading',{name:'WT-021 Crystal manufacturing journey',exact:true}).waitFor();
 const [backup]=await Promise.all([page.waitForEvent('download'),page.locator('#smsBackup').click()]);
 const backupModel=JSON.parse(await readFile(await backup.path(),'utf8')).project.models.find(model=>model.id===savedCrystal.id);
 assert.deepEqual(backupModel.parameters.manualPixelHoles,savedCrystal.parameters.manualPixelHoles);
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();
 await page.waitForFunction(id=>window.__sensoryStudio?.currentModel?.id===id,savedCrystal.id);
 const restored=await crystal();
 for(const key of ['manualPixelHoles','manualMountHoles','manualEdgeTabs','pixelClearanceByProfile'])
  assert.deepEqual(restored.parameters[key],savedCrystal.parameters[key]);
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 await page.getByRole('button',{name:'Render actual model',exact:true}).click();
 await inspector.getByText('Prepared manufacturing mesh').waitFor({timeout:120000});
 await inspector.getByLabel('Cut section').check();
 await inspector.getByLabel('Section axis').selectOption('X');
 const sectionX=await inspector.getByRole('slider').evaluate(slider=>{
  slider.value='0';
  slider.dispatchEvent(new Event('input',{bubbles:true}));
  return Number(slider.value);
 });
 assert(Math.abs(sectionX)<.1,'Inspection plane crosses the routed band');
 const section=await page.evaluate(async x=>{
  const {Mesh}=await import('three');
  const prior=Mesh.prototype.onBeforeRender;
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{
    Mesh.prototype.onBeforeRender=prior;
    reject(Error('Crystal prepared cutaway did not render'));
   },5000);
   Mesh.prototype.onBeforeRender=function(renderer,scene,camera,geometry,material,...rest){
    prior.call(this,renderer,scene,camera,geometry,material,...rest);
    const plane=material.clippingPlanes?.[0];
    if(plane?.normal.x!==1||Math.abs(plane.constant+x)>.0001)return;
    clearTimeout(timer);
    Mesh.prototype.onBeforeRender=prior;
    resolve({vertices:Array.from(geometry.attributes.position.array),indices:Array.from(geometry.index.array)});
   };
  });
 },sectionX);
 await inspector.getByRole('button',{name:'Close inspection'}).click();
 await page.locator('.sms-workspace-nav [data-tab=print]').click();
 const crystalJob=page.locator('#smsJobs article').filter({hasText:'WT021 full Crystal'});
 await crystalJob.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
 const getFile=async selector=>{
  const [file]=await Promise.all([page.waitForEvent('download'),crystalJob.locator(selector).click()]);
  return {name:file.suggestedFilename(),bytes:await readFile(await file.path())};
 };
 const crystalSTL=await getFile('[data-job-stl]'),crystal3MF=await getFile('[data-job-3mf]');
 const cura=await getFile('[data-job-cura]'),zip=await getFile('[data-job-export]');
 assert(cura.name.endsWith('.curaprofile')&&zip.name.endsWith('.zip'));
 const xml3MF=modelXml(crystal3MF.bytes);
 const points=[...xml3MF.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].flatMap(match=>match.slice(1).map(Number));
 const indices=[...xml3MF.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"/g)].flatMap(match=>match.slice(1).map(Number));
 const indexed=new THREE.BufferGeometry();
 indexed.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
 indexed.setIndex(indices);
 const visibleSection=new THREE.BufferGeometry();
 const printVertices=[];
 for(let i=0;i<section.vertices.length;i+=3)
  printVertices.push(section.vertices[i],-section.vertices[i+2],section.vertices[i+1]);
 visibleSection.setAttribute('position',new THREE.Float32BufferAttribute(printVertices,3));
 visibleSection.setIndex(section.indices);
 const sectionMaterial=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
 const sectionMesh=new THREE.Mesh(visibleSection,sectionMaterial);
 const sectionWall=direction=>new THREE.Raycaster(new THREE.Vector3(sectionX,0,1),
  new THREE.Vector3(0,direction,0)).intersectObject(sectionMesh)[0]?.point.y;
 const viewedWalls=[sectionWall(-1),sectionWall(1)];
 assert(viewedWalls.every(Number.isFinite));
 visibleSection.dispose();sectionMaterial.dispose();
 for(const [format,geometry] of [['STL',new STLLoader().parse(Uint8Array.from(crystalSTL.bytes).buffer)],['3MF',indexed]]){
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geometry,material);
  const hit=(origin,direction)=>new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction)).intersectObject(mesh)[0]?.point;
  const calibrated=hardware.sockets.find(socket=>Math.abs(socket.diameter-5.4)<.001);
  const bore=[calibrated.x,-calibrated.z,4];
  const left=hit(bore,[0,-1,0]),right=hit(bore,[0,1,0]);
  assert(left&&right&&Math.abs(left.distanceTo(right)-5.4)<.04,format+' calibrated Crystal bore');
  const route=[sectionX,0,1];
  const startWall=hit(route,[0,-1,0]),endWall=hit(route,[0,1,0]);
  assert(startWall&&endWall&&Math.abs(startWall.distanceTo(endWall)-3.2)<.04,format+' routed width survives the fit change');
  for(const [i,wall] of [startWall,endWall].entries())
   assert(Math.abs(wall.y-viewedWalls[i])<.01,format+' matches the route wall at the selected X plane');
  for(const hole of [...hardware.mounts,...hardware.tabHoles])
   assert.equal(hit([hole.x,-hole.z,-1],[0,0,1]),undefined,format+' Crystal through-holes are open');
  for(const hole of hardware.tabHoles){
   const tabTop=hit([hole.x+2.5,-hole.z,7],[0,0,-1]);
   assert(tabTop&&Math.abs(tabTop.z-5)<.01,format+' 5 mm positive Crystal tab stock');
  }
  material.dispose();geometry.dispose();
 }
 console.log('WT-021 full Crystal manufacturing journey verified');
 await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
 const wireWidth=await reveal(page.locator('[data-state=wireWidth]'));
 await wireWidth.evaluate(node=>{node.value='6';node.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.wireWidth===6);
 const edited=await crystal();
 for(const key of ['pixelProfileId','pixelClearanceByProfile','pixelRetentionLip','manualPixelHoles'])
  assert.deepEqual(edited.parameters[key],savedCrystal.parameters[key],key+' stays fixed across the wire edit');
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();
 await page.waitForFunction(()=>window.__sensoryStudio?.currentModel?.parameters.wireWidth===6);
 await page.locator('.sms-workspace-nav [data-tab=print]').click();
 await crystalJob.getByText('Stale',{exact:true}).waitFor();
 assert(await crystalJob.locator('[data-job-stl]').isDisabled());
 assert(await crystalJob.locator('[data-job-3mf]').isDisabled());
 await crystalJob.locator('[data-job-prepare]').click();
 await crystalJob.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
 const updatedSTL=await getFile('[data-job-stl]'),updatedMF=await getFile('[data-job-3mf]');
 const trackXml=modelXml(updatedMF.bytes);
 const trackPoints=[...trackXml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].flatMap(match=>match.slice(1).map(Number));
 const trackIndices=[...trackXml.matchAll(/<triangle v1="([^"]+)" v2="([^"]+)" v3="([^"]+)"/g)].flatMap(match=>match.slice(1).map(Number));
 const trackGeometry=new THREE.BufferGeometry();
 trackGeometry.setAttribute('position',new THREE.Float32BufferAttribute(trackPoints,3));
 trackGeometry.setIndex(trackIndices);
 const calibratedSocket=hardware.sockets.find(socket=>Math.abs(socket.diameter-5.4)<.001);
 for(const geometry of [new STLLoader().parse(Uint8Array.from(updatedSTL.bytes).buffer),trackGeometry]){
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),mesh=new THREE.Mesh(geometry,material);
  const span=origin=>[-1,1].reduce((sum,sign)=>sum+new THREE.Raycaster(new THREE.Vector3(...origin),
   new THREE.Vector3(0,sign,0)).intersectObject(mesh)[0].distance,0);
  assert(Math.abs(span([0,0,1])-6)<.04);
  assert(Math.abs(span([calibratedSocket.x,-calibratedSocket.z,4])-5.4)<.04);
  geometry.dispose();material.dispose();
 }
 console.log('WT-021 Crystal cable width changes independently after reload');
 {
  const importedName='Crystal imported fit witness';
  await page.evaluate(name=>window.__sensoryStudio.addModel('crystals',{count:5,baseHeight:22,width:96,depth:82,
   cutSockets:true,pixelFit:.15,wireChannels:false,lightingMode:'single'},name),importedName);
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  const palette=page.locator('.sms-palette'),libraryInput=palette.getByLabel('Import pixel profiles');
  const profileId='custom-wt021-crystal-fit-import';
  const measured={id:profileId,name:'Imported Crystal 5 mm fit',kind:'seed',bodyDiameter:5,bodyHeight:9,
   flangeDiameter:5,flangeHeight:0,capHeight:1,wireWidth:2,wireDepth:1.5,
   measuredFit:{bodyDiameter:5,printedBoreDiameter:5.25}};
  const importProfile=async custom=>libraryInput.setInputFiles({name:'pixel-library.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify({version:1,pixelProfiles:[custom]}))});
  await importProfile(measured);
  const selection=palette.getByLabel('Active Pixel Profile');
  await selection.getByRole('option',{name:measured.name,exact:true}).waitFor({state:'attached'});
  await selection.selectOption(profileId);
  await page.waitForFunction(id=>window.__sensoryStudio.currentModel.parameters.pixelClearanceByProfile?.[id]===.25,profileId);
  const fit=await reveal(page.locator('[data-state=pixelFit]'));
  await fit.press('ArrowRight');
  await page.waitForFunction(id=>window.__sensoryStudio.currentModel.parameters.pixelClearanceByProfile[id]===.3,profileId);
  await importProfile({...measured,measuredFit:{bodyDiameter:5,printedBoreDiameter:5.6}});
  const copy=selection.getByRole('option',{name:measured.name+' (imported copy)',exact:true});
  await copy.waitFor({state:'attached'});
  const revisedId=await copy.getAttribute('value');
  assert.notEqual(revisedId,profileId);
  const importJob=page.locator('#smsJobs article').filter({hasText:importedName});
  const measureImported=async(id,diameter,retention=0)=>{
   await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
   await selection.selectOption(id);
   await page.waitForFunction(id=>window.__sensoryStudio.currentModel.parameters.pixelProfileId===id,id);
   const model=await crystal(),[socket]=planHardware(model.editableState.crystals,model.parameters).sockets;
   assert(socket&&Math.abs(socket.diameter-diameter)<.001);
   await page.locator('.sms-workspace-nav [data-tab=print]').click();
   if(await importJob.count())await importJob.locator('[data-job-prepare]').click();
   else await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
   await importJob.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
   for(const format of ['stl','3mf']){
    const [file]=await Promise.all([page.waitForEvent('download'),importJob.locator('[data-job-'+format+']').click()]);
    const bytes=await readFile(await file.path());
    const geometry=new THREE.BufferGeometry();
    if(format==='stl')geometry.copy(new STLLoader().parse(Uint8Array.from(bytes).buffer));
    else{
     const xml=modelXml(bytes);
     const points=[...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].flatMap(match=>match.slice(1).map(Number));
     const indices=[...xml.matchAll(/<triangle v1="([^"]+)" v2="([^"]+)" v3="([^"]+)"/g)].flatMap(match=>match.slice(1).map(Number));
     geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
     geometry.setIndex(indices);
    }
    const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),mesh=new THREE.Mesh(geometry,material);
    const width=[-1,1].reduce((sum,sign)=>sum+new THREE.Raycaster(
     new THREE.Vector3(socket.x,-socket.z,4),new THREE.Vector3(0,sign,0)).intersectObject(mesh)[0].distance,0);
    assert(Math.abs(width-diameter)<.04,format+' imported Crystal clearance '+width);
    const throat=[-1,1].reduce((sum,sign)=>sum+new THREE.Raycaster(
     new THREE.Vector3(socket.x,-socket.z,2.5),new THREE.Vector3(0,sign,0)).intersectObject(mesh)[0].distance,0);
    assert(Math.abs(throat-(diameter-2*retention))<.04,format+' Crystal retention and bore remain independent');
    geometry.dispose();material.dispose();
   }
  };
  await measureImported(revisedId,5.6);
  await measureImported(profileId,5.3);
  await page.locator('.sms-workspace-nav [data-workspace=pixels]').click();
  await page.locator('#advancedBtn').click();
  const retention=await reveal(page.locator('[data-state=pixelRetentionLip]'));
  for(let i=0;i<4;i++)await retention.press('ArrowRight');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.pixelRetentionLip===.2);
  await measureImported(profileId,5.3,.2);
  console.log('WT-021 Crystal imported measured default and local fit verified');
 }
 {
  const name='Crystal blind hardware presets';
  await page.evaluate(name=>window.__sensoryStudio.addModel('crystals',{
   seed:42,count:5,width:95,baseType:'integrated',baseStyle:'Square',baseHeight:16,baseWidth:32,baseDome:0,
   cutSockets:false,lightingMode:'none',wireChannels:false,mount:'None',mountPlacement:'auto',mountSpacing:34,manualEdgeTabs:null,tabCount:2,tabHolesPerTab:1
  },name),name);
  const build=page.locator('.sms-workspace-nav [data-workspace=mounting]'),print=page.locator('.sms-workspace-nav [data-tab=print]');
  await page.locator('#advancedBtn').click();
  const preset=page.locator('[data-state=mount]'),job=page.locator('#smsJobs article').filter({hasText:name});
  for(const [type,diameter,depth] of [['Magnet inserts',10.2,3.2],['Threaded insert M3',4.2,6]]){
   await build.click();
   await (await reveal(preset)).selectOption(type);
   await page.waitForFunction(type=>window.__sensoryStudio.currentModel.parameters.mount===type,type);
   const model=await crystal(),mounts=planHardware(model.editableState.crystals,model.parameters).mounts;
   assert.equal(mounts.length,2);
   await print.click();
   if(await job.count()){
    await job.getByText('Stale',{exact:true}).waitFor();
    assert(await job.locator('[data-job-stl]').isDisabled());
    assert(await job.locator('[data-job-3mf]').isDisabled());
    await job.locator('[data-job-prepare]').click();
   }else await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
   await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
   for(const format of ['stl','3mf']){
    const [file]=await Promise.all([page.waitForEvent('download'),job.locator('[data-job-'+format+']').click()]);
    const bytes=await readFile(await file.path());
    let geometry;
    if(format==='stl')geometry=new STLLoader().parse(Uint8Array.from(bytes).buffer);
    else{
     const xml=modelXml(bytes);
     assert.match(xml,/<model unit="millimeter"/);
     const positions=[...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].flatMap(match=>match.slice(1).map(Number));
     const indices=[...xml.matchAll(/<triangle v1="([^"]+)" v2="([^"]+)" v3="([^"]+)"/g)].flatMap(match=>match.slice(1).map(Number));
     geometry=new THREE.BufferGeometry();
     geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
     geometry.setIndex(indices);
    }
    const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),mesh=new THREE.Mesh(geometry,material);
    geometry.computeBoundingBox();
    for(const {x,z} of mounts){
     const hit=(height,dx,dz)=>new THREE.Raycaster(new THREE.Vector3(x,-z,height),
      new THREE.Vector3(dx,0,dz)).intersectObject(mesh)[0];
     assert(Math.abs(hit(1,-1,0).distance+hit(1,1,0).distance-diameter)<.02,format+' '+type+' diameter');
     const floor=hit(-1,0,1).point.z,top=hit(geometry.boundingBox.max.z+1,0,-1).point.z;
     assert(Math.abs(floor-depth)<.01,format+' '+type+' blind depth');
     assert(top-floor>=16-depth-.02,format+' '+type+' leaves the measured base stock');
    }
    geometry.dispose();material.dispose();
   }
  }
  console.log('WT-021 Crystal magnet and insert preset sections verified');
  await build.click();
  await (await reveal(preset)).selectOption('Edge fixing tabs');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.mount==='Edge fixing tabs');
  const automatic=await crystal();
  assert.equal(automatic.parameters.manualEdgeTabs,null);
  assert.equal(planHardware(automatic.editableState.crystals,automatic.parameters).tabs.length,2);
  const edit=await reveal(page.locator('[data-edit-tab-positions]'));
  assert.equal(await edit.textContent(),'Make edge tabs editable');
  await edit.click();
  await page.keyboard.press('Escape');
  const count=(await crystal()).parameters.manualEdgeTabs.length;
  assert(count>0);
  for(let i=0;i<count;i++)await (await reveal(page.locator('[data-remove-tab="0"]'))).click();
  assert.deepEqual((await crystal()).parameters.manualEdgeTabs,[]);
  await page.locator('[data-view=top]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  const add=await reveal(page.locator('[data-edit-tab-positions]'));
  assert.equal(await add.textContent(),'Add edge tab');
  await add.click();
  const before=await crystal(),polygon=planHardware(before.editableState.crystals,before.parameters).polygon;
  const a=polygon[0],b=polygon[1];
  const edge=await onBase(.4*(a.x+b.x),.4*(a.z+b.z));
  assert((await sample(edge.x,edge.y)).valid);
  await page.mouse.click(edge.x,edge.y);
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.manualEdgeTabs.length===1);
  await page.keyboard.press('Escape');
  await page.locator('[data-tab-u="0"]').waitFor({state:'attached'});
  console.log('WT-021 Crystal empty tab list can place a new tab');
 }
 {
  const name='Crystal draggable cable openings';
  await page.evaluate(({parameters,name})=>window.__sensoryStudio.addModel('crystals',{
   ...parameters,mount:'None',manualMountHoles:[],manualEdgeTabs:null
  },name),{parameters:savedCrystal.parameters,name});
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  await page.locator('[data-view=top]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  const wireControls=page.locator('.sms-palette');
  await wireControls.locator('[data-build-wire-pitch]').selectOption('custom');
  const available=wireControls.locator('[data-build-wire-custom]');
  await available.fill('10');
  await available.press('Tab');
  const strict=await crystal();
  const strictRoute=planHardware(strict.editableState.crystals,strict.parameters).wirePlan;
  assert(strictRoute.overLengthCount>0&&!strictRoute.ready&&strictRoute.unrouted===0);
  await wireControls.getByRole('checkbox',{name:'Allow over-length cables'}).check();
  const original=await crystal();
  assert.equal(original.parameters.wireAllowOverLength,true);
  const openingKeys=['wireEntryX','wireEntryZ','wireOutputX','wireOutputZ'];
  for(const [kind,prefix,pointKey] of [['input','wireEntry','entryPoint'],['output','wireOutput','exitPoint']]){
   const {parameters,editableState:{crystals}}=await crystal();
   const {polygon,wirePlan}=planHardware(crystals,parameters);
   const marker=page.locator('[data-edge-wire='+kind+']');
   await marker.waitFor();
   const old=wirePlan[pointKey];
   const candidates=polygon.flatMap((a,i)=>{
    const b=polygon[(i+1)%polygon.length];
    return [.2,.4,.6,.8].map(t=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t}));
   }).filter(p=>Math.hypot(p.x-old.x,p.z-old.z)>6);
   const target=candidates.find(({x,z})=>[[0,0],[.4,0],[-.4,0],[0,.4],[0,-.4]].every(([dx,dz])=>
    solvePixelMove(crystals,parameters,{edgeKind:kind,edgePoint:{x:x+dx,z:z+dz}}).valid));
   assert(target,'a valid '+kind+' opening can move along the perimeter');
   const to=await onBase(target.x,target.z,.8),from=await marker.boundingBox();
   await page.mouse.move(from.x+from.width/2,from.y+from.height/2);
   await page.mouse.down();
   await page.mouse.move(to.x,to.y,{steps:4});
   await page.mouse.up();
   await page.locator('#status').filter({hasText:'Moved '+kind+' perimeter opening'}).waitFor({timeout:8000}).catch(async error=>{
    throw Error('Crystal '+kind+' opening did not move: '+await page.locator('#status').innerText(),{cause:error});
   });
   const moved=await crystal();
   assert(Math.hypot(moved.parameters[prefix+'X']-target.x,moved.parameters[prefix+'Z']-target.z)<1);
   assert.deepEqual(moved.parameters.manualPixelHoles.map(({x,z})=>[x,z]),parameters.manualPixelHoles.map(({x,z})=>[x,z]));
   const placed=planHardware(crystals,moved.parameters);
   assert(placed.wirePlan.ready);
   const fromMoved=await marker.boundingBox();
   await page.mouse.move(fromMoved.x+fromMoved.width/2,fromMoved.y+fromMoved.height/2);
   await page.mouse.down();
   await page.mouse.move(8,8);
   await page.mouse.up();
   await page.locator('#status').filter({hasText:'original '+kind+' perimeter opening kept'}).waitFor();
   assert.deepEqual(await crystal(),moved);
  }
  const moved=await crystal();
  assert(moved.revision>original.revision);
  await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
  await page.reload();
  await page.waitForFunction(id=>window.__sensoryStudio?.currentModel?.id===id,moved.id);
  for(const key of openingKeys)assert.equal((await crystal()).parameters[key],moved.parameters[key]);
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  assert(await wireControls.getByRole('checkbox',{name:'Allow over-length cables'}).isChecked());
  await page.getByRole('button',{name:'Render actual model',exact:true}).click();
  await inspector.getByText('Prepared manufacturing mesh').waitFor({timeout:120000});
  await inspector.getByRole('button',{name:'Close inspection'}).click();
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  const routedJob=page.locator('#smsJobs article').filter({hasText:name});
  await routedJob.getByText('Some cable runs need longer wires.',{exact:false}).waitFor();
  assert(await routedJob.locator('[data-job-stl]').isEnabled());
  assert(await routedJob.locator('[data-job-3mf]').isEnabled());
  const downloadRouted=async format=>{
   const [file]=await Promise.all([page.waitForEvent('download'),routedJob.locator('[data-job-'+format+']').click()]);
   return readFile(await file.path());
  };
  const movedStl=bounds(stlPoints(await downloadRouted('stl')));
  const movedXml=modelXml(await downloadRouted('3mf'));
  assert.match(movedXml,/<model unit="millimeter"/);
  const moved3mf=bounds([...movedXml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].map(match=>match.slice(1).map(Number)));
  for(const key of ['min','max'])for(let axis=0;axis<3;axis++)
   assert(Math.abs(movedStl[key][axis]-moved3mf[key][axis])<.001,'Moved openings export with matching print bounds');
  assert.deepEqual(await readDimensions(routedJob.getByText(/^Prepared X/)),movedStl.size.map(value=>Number(value.toFixed(1))));
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  await wireControls.getByRole('checkbox',{name:'Allow over-length cables'}).uncheck();
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  await routedJob.getByText('Stale',{exact:true}).waitFor();
  assert(await routedJob.locator('[data-job-stl]').isDisabled());
  assert(await routedJob.locator('[data-job-3mf]').isDisabled());
  console.log('WT-021 moved cable openings persist and both exports match the prepared dimensions');
  await page.locator('.sms-workspace-nav [data-workspace=wiring]').click();
  await page.waitForFunction(()=>window.__crystalForgePlacementMetrics().routeGuidesVisible);
  const template=page.getByRole('button',{name:'New Cogs & Gears from template',exact:true});
  await page.locator('#smsLibrary').click();
 await page.locator('#smsBuiltInTemplates').getByRole('button',{name:'Actions for Cogs & Gears',exact:true}).click();
  await template.click();
  await page.getByRole('dialog',{name:'Name new model'}).getByRole('button',{name:'Create model'}).click();
  await page.waitForFunction(()=>!window.__crystalForgePlacementMetrics().routeGuidesVisible);
  const firstCog=await crystal();
  assert.equal(firstCog.generator.typeId,'gears');
  assert.equal(firstCog.build.pixelHoles?.length??0,0);
  await page.locator('.sms-palette [data-palette-key=diameter]').press('ArrowRight');
  const editedCog=await crystal();
  assert(editedCog.parameters.diameter>firstCog.parameters.diameter);
  page.once('dialog',dialog=>dialog.accept('Cog: Connors new one'));
  await page.getByRole('button',{name:'Save as new model…',exact:true}).click();
  await page.locator('#smsLibrary').click();
  const savedCog=page.locator('#smsSavedModels article').filter({hasText:'Cog: Connors new one'});
  await savedCog.waitFor();
 await page.locator('#smsBuiltInTemplates').getByRole('button',{name:'Actions for Cogs & Gears',exact:true}).click();
  await template.click();
  await page.getByRole('dialog',{name:'Name new model'}).getByRole('button',{name:'Create model'}).click();
  const freshCog=await crystal();
  assert.notEqual(freshCog.id,firstCog.id);
  assert.deepEqual(freshCog.parameters,firstCog.parameters);
  assert.deepEqual(freshCog.build,firstCog.build);
  await page.locator('#smsLibrary').click();
 await savedCog.locator('.sms-library-actions-toggle').click();
  await savedCog.getByRole('button',{name:'Independent copy'}).click();
  await page.getByRole('dialog',{name:'Choose model destination'}).getByRole('button',{name:'Add model',exact:true}).click();
  await page.getByRole('dialog',{name:'Choose model destination'}).waitFor({state:'hidden'});
  assert.deepEqual((await crystal()).parameters,editedCog.parameters);
  console.log('WT-021 Library templates start fresh and saved variants preserve their edits');
 }
}finally{await browser.close();}
