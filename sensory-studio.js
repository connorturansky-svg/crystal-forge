import {archiveSummary,archiveChoices,reconcileArchive,commitRecovery,RECOVERY_PREFIX,validateArchive} from './studio-sync-plan.js';
import {readOrganisation,organisationName,ensureSnapshotIds,templateProject} from './studio-organisation.js';
import {createLightInspector} from './studio-light-inspector.js';
import {lightPassageExportBlock,lightPassageReportEntries} from './light-passage-inspection.js';
import {renderPixelProfileDiagram} from './pixel-profile-diagram.js';
import {applyPixelFittingProfile,resolvePixelFitting,withMeasuredPixelFit,saveablePixelFit} from './studio-pixel-fit.js';
import {pixelBuilderMarkup,pixelHoleMarkup,bindPixelBuilder,pixelProfiles,stablePixels,findPixelPosition,checkedPixelBore,newPixel} from './studio-pixel-builder.js';
import {createModel,addModel,findModel,openTab,closeTab,reorderTabs,duplicateModel,editModel,
 queueModel,beginPreparation,finishPreparation,cancelPreparation,canExport,resolveJobPrinter,movePrintJob,invalidatePrintJob,saveLibraryRevision,
 insertLibraryModel,availableLinkedUpdate,acceptLinkedUpdate,breakLink,modelFingerprint,validateProject,WORKSPACE_KEY,newId} from './studio-documents.js';
import {makeCatalogue,applyBuildModules,generators} from './studio-catalogue.js';
import {previewRecipe,disposeGroup} from './studio-geometry.js';
import {exportMaterialBodies} from './studio-material-export.js';
import {installExactValueEditors} from './exact-value-editors.js';
import {createCuraProfile,zipProfileEntries,curaFallbackText,calculateCuraSettings} from './cura-profiles.js';
import {StudioVault} from './studio-vault.js';
import {crystalStartingPoints,crystalStartingPointPreview} from './studio-crystal-presets.js';
const copy=x=>JSON.parse(JSON.stringify(x));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
export function installSensoryStudio({THREE,scene,camera,orbit,renderer,bootstrap,adapter}){
 const state=bootstrap,project=state.project;
 delete project.snapshotId; // Snapshot identity belongs only to the saved Library copy.
 renderer.localClippingEnabled=true;
 const unified=new URLSearchParams(location.search).get('layout')!=='legacy';
 let printExpanded=false,quickPrintThumbnail=null;
 const printSizes=new WeakMap();
 state.savedProjects??=[];
 ensureSnapshotIds(state.savedProjects);
 state.organisation=readOrganisation(state.organisation);
 let collectionFilter='',favouritesOnly=false,templatesOnly=false;
 function saveProjectSnapshot(){
  const saved=copy(project);saved.snapshotId=newId();state.savedProjects.push(saved);return saved;
 }project.printer={printer:'Ultimaker 3 Extended',curaNozzle:.4,curaMaterial:'PLA',curaQuality:60,curaIntent:'balanced',...project.printer};
 const crystalAdapter={typeId:'crystals',typeVersion:1,displayName:'Crystal Clusters',category:'Lighting',defaultParameters:adapter.capture().settings,
  parameterSchema:[],presets:crystalStartingPoints(adapter.formationDefaults()),capabilities:{supportsBase:true,supportsLEDs:true,supportsMounting:true,supportsTactileSurfaces:false,supportsMechanisms:false,supportsDualMaterial:false,supportsPartSplitting:true},
  validateParameters:p=>({valid:!!p,errors:[],parameters:p}),generatePreview:()=>adapter.capture(),
  generateManufacturingGeometry:()=>adapter.capture(),estimateBounds:()=>adapter.bounds(),migrateParameters:(_,p)=>p};
 const registry=makeCatalogue(crystalAdapter),cache=new Map(),histories=new Map(),prepared=new Map(),workers=new Map();
 let currentId=null,mode='model',stage='design',switching=false,saveTimer=null,dirty=false,search='',filter='all',studioVault=null,vaultClient=null,previewBuilds=0;
 const link=document.createElement('link');link.rel='stylesheet';link.href='./sensory-studio.css';document.head.append(link);
 const bar=document.createElement('nav');bar.className='studio-modelbar';bar.setAttribute('aria-label','Project and model workspaces');
 bar.innerHTML='<input id="smsProjectTitle" class="sms-project-input project-title" aria-label="Project name"><button id="smsLibrary">Library</button><div id="smsTabs" class="studio-modeltabs" role="tablist" aria-label="Open models"></div><button id="smsNew" aria-label="Add a model">＋ New model</button><button id="smsPrint">Print Centre</button><button id="smsReload" title="Save your project and load the latest published Studio">↻ Reload Studio</button><span id="smsSaveState" role="status"></span>';
 document.querySelector('.topbar').before(bar);
 const panel=document.createElement('div');panel.id='smsEditor';panel.className='sms-controls';panel.hidden=true;document.querySelector('.left').prepend(panel);
 const overlay=document.createElement('div');overlay.className='sms-overlay';overlay.hidden=true;overlay.id='smsOverlay';document.querySelector('.viewarea').style.position='relative';document.querySelector('.viewarea').append(overlay);
 const shell=unified?setupShell():null;
 const inspection=shell?createLightInspector({THREE,scene,camera,
  prepare:modelId=>prepare(enqueue(modelId).id),
  cancel:modelId=>{const job=project.printJobs.find(item=>item.modelId===modelId);if(job?.status==='preparing'){cancelPreparation(project,job.id);delete job.progress;discardPrintResult(job.id);save();renderJobs();renderTabs();}}}):null;
 if(inspection){
  $('smsPrecisionContent').prepend(inspection.root);
  const cutaway=$('sectionCutBtn');
  cutaway?.addEventListener('click',event=>{
   if(inspection.root.hidden||!inspection.hasPrepared())return;
   event.stopImmediatePropagation();
   inspection.root.open=!inspection.root.open;
  },true);
 }
 function setupShell(){
  document.body.classList.add('sms-unified');
  const layout=document.querySelector('.layout'),left=layout.querySelector('.left'),right=layout.querySelector('.right'),viewer=layout.querySelector('.viewarea');
  const button=(label,action,id)=>{const node=document.createElement('button');node.type='button';node.textContent=label;if(id)node.id=id;node.onclick=action;return node;};
  const home=button('⌂ Home',()=>showHome(),'smsHome');
  const undoButton=button('↶ Undo',()=>shellUndo(-1),'smsGlobalUndo');
  const redoButton=button('↷ Redo',()=>shellUndo(1),'smsGlobalRedo');
  const rail=document.createElement('aside');rail.className='sms-rail';rail.id='smsModelRail';rail.setAttribute('aria-label','Models');
  rail.append($('smsTabs'),$('smsNew'));
  const centre=document.createElement('section');centre.className='sms-centre';centre.append(viewer,overlay);
  const palette=document.createElement('section');palette.className='sms-palette';palette.id='smsVisualPalette';palette.setAttribute('aria-label','Visual choices');
  function side(name,id,...contents){
   const region=document.createElement('aside');region.id=id;region.setAttribute('aria-label',name);
   const heading=document.createElement('header');heading.className='sms-side-heading';
   const label=document.createElement('strong');label.textContent=name;
   const body=document.createElement('div');body.className='sms-side-body';body.id=id+'Content';body.append(...contents);
   const toggle=button('≡',()=>{view[id].collapsed=!view[id].collapsed;applyPanels();});
   toggle.setAttribute('aria-controls',body.id);
   heading.append(toggle,label);region.append(heading,body);
   return {region,body,toggle,name};
  }
  const search=document.createElement('input');search.type='search';search.placeholder='Search settings';search.setAttribute('aria-label','Search settings');
  const tools=side('Design and Build','smsTools',palette,left);
  const precision=side('Precision settings','smsPrecision',search,panel,right);
  tools.region.className='sms-tools';precision.region.className='sms-settings';
  const searchSettings=()=>{
   const query=search.value.trim().toLowerCase();
   for(const item of precision.body.querySelectorAll('.sms-panel-details,.collapsible-section')){
    item.toggleAttribute('data-filtered',!!query&&!item.textContent.toLowerCase().includes(query));
    if(query&&!item.hasAttribute('data-filtered')&&item.tagName==='DETAILS')item.open=true;
   }
  };
  search.oninput=searchSettings;
  const styleNav=document.querySelector('.workspace-tabs'),top=document.querySelector('.topbar');
  styleNav.prepend(home,$('smsLibrary'));styleNav.setAttribute('aria-label','Workspaces');
  top.after(styleNav);styleNav.classList.add('sms-workspace-nav');
  top.querySelector('.topcluster').append($('smsProjectTitle'),$('smsSaveState'));
  const projectName=$('smsProjectTitle');
  const describeTitle=()=>{projectName.title=projectName.value;};
  describeTitle();projectName.addEventListener('input',describeTitle);projectName.addEventListener('focus',describeTitle);
  top.querySelector('.utility').append($('smsReload'),undoButton,redoButton);
  bar.remove();

  const preferenceKey='wt-workspace-panels-v2';
  function readLayout(key){
   try{return JSON.parse(localStorage.getItem(key))||{};}catch{return {};}
  }
  const saved=readLayout(preferenceKey),legacy=readLayout('wt-workspace-panels-v1');
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  function sidePrefs(value,fallback){
   return {width:clamp(Number.isFinite(value?.width)?value.width:fallback,220,460),collapsed:value?.collapsed===true};
  }
  const view={smsTools:sidePrefs(saved.smsTools,280),smsPrecision:sidePrefs(saved.smsPrecision,Number.isFinite(legacy.settingsWidth)?legacy.settingsWidth:300)};
  const narrow=matchMedia('(max-width: 900px)');
  const regions=[tools,precision];
  function maxWidth(other){
   const width=view[other.region.id];
   const reserve=width.collapsed?42:Math.min(width.width,Math.max(220,(layout.clientWidth-436)/2));
   return clamp(layout.clientWidth-436-reserve,220,460);
  }
  function separator(side,other,direction){
   const grip=document.createElement('div');grip.className='sms-edge';grip.tabIndex=0;
   grip.setAttribute('role','separator');grip.setAttribute('aria-orientation','vertical');
   grip.setAttribute('aria-label','Resize '+side.name.toLowerCase());
   grip.setAttribute('aria-controls',side.region.id);grip.title='Drag to resize. Use arrow keys or Shift + arrow keys.';
   const state=view[side.region.id];
   const update=width=>{state.width=clamp(width,220,maxWidth(other));applyPanels();};
   let drag=null;
   grip.onpointerdown=event=>{
    if(event.button!==0||narrow.matches||state.collapsed)return;
    event.preventDefault();grip.focus({preventScroll:true});
    drag={id:event.pointerId,x:event.clientX,width:side.region.getBoundingClientRect().width};
    grip.setPointerCapture(event.pointerId);
   };
   grip.onpointermove=event=>{if(drag?.id===event.pointerId)update(drag.width+direction*(event.clientX-drag.x));};
   grip.onlostpointercapture=()=>{drag=null;};
   grip.onkeydown=event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)||state.collapsed||narrow.matches)return;
    event.preventDefault();
    const delta=direction*(event.key==='ArrowLeft'?-1:1)*(event.shiftKey?24:8);
    update(event.key==='Home'?220:event.key==='End'?maxWidth(other):side.region.getBoundingClientRect().width+delta);
   };
   return grip;
  }
  const grips=[separator(tools,precision,1),separator(precision,tools,-1)];
  function applyPanels(persist=true){
   for(const [i,side] of regions.entries()){
    const state=view[side.region.id],width=state.collapsed?42:Math.min(state.width,maxWidth(regions[1-i]));
    layout.style.setProperty(i?'--sms-settings-width':'--sms-tools-width',width+'px');
    side.region.classList.toggle('sms-collapsed',state.collapsed);
    side.body.hidden=state.collapsed;
    const label=(state.collapsed?'Expand ':'Collapse ')+side.name.toLowerCase();
    side.toggle.title=label;side.toggle.setAttribute('aria-label',label);
    side.toggle.setAttribute('aria-expanded',String(!state.collapsed));
    grips[i].tabIndex=state.collapsed?-1:0;
    grips[i].setAttribute('aria-disabled',String(state.collapsed));
    grips[i].setAttribute('aria-valuemin','220');
    grips[i].setAttribute('aria-valuemax',String(maxWidth(regions[1-i])));
    grips[i].setAttribute('aria-valuenow',String(state.collapsed?220:width));
   }
   if(persist)try{localStorage.setItem(preferenceKey,JSON.stringify(view));}catch{}
  }
  layout.prepend(tools.region,grips[0],centre,grips[1],precision.region,rail);
  applyPanels(false);
  window.addEventListener('resize',()=>applyPanels(false));
  document.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&mode!=='model'&&!document.querySelector('dialog[open]')&&currentId)
    document.querySelector('.workspace-tabs [data-tab=design]').click();
  });
  const focus=button('Focus 3D',()=>{
   const full=document.body.classList.toggle('sms-focused');focus.textContent=full?'Exit focus':'Focus 3D';focus.setAttribute('aria-pressed',String(full));
  },'smsFocus');
  focus.setAttribute('aria-pressed','false');viewer.querySelector('.vcolumn').append(focus);
  window.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('sms-focused'))focus.click();});
  return {palette,home,searchSettings,search,focus};
 }
 function shellUndo(delta){
  if(mode!=='model'||active()?.link)return;
  if(active()?.generator.typeId==='crystals'){adapter.undo(delta);renderTabs();renderPalette();}else undo(delta);
 }
 const picker=document.createElement('dialog');picker.id='smsPicker';picker.setAttribute('aria-labelledby','smsPickerTitle');
 picker.innerHTML='<h2 id="smsPickerTitle">Create a model</h2><div class="sms-grid"></div><form method="dialog"><button>Close</button></form>';
 document.body.append(picker);
 const presetThumbnails=new Map();
 function openPicker(){renderPicker();picker.showModal();}
 function visualPresets(family){
  if(family.typeId!=='gears')return family.presets;
  return [...family.presets].sort((a,b)=>Number(b.parameters.webStyle!=='Legacy')-Number(a.parameters.webStyle!=='Legacy'));
 }
 function renderPicker(generator=null){
  const title=picker.querySelector('h2'),grid=picker.querySelector('.sms-grid');
  title.textContent=generator?generator.displayName+' starting points':'Create a model';
  grid.replaceChildren();
  const appendCard=(family,preset)=>{
   const tile=document.createElement('article');tile.className='sms-tile sms-picker-tile';tile.dataset.modelTheme=family.typeId;
   const button=document.createElement('button');button.className='sms-picker-choice';button.type='button';
   if(preset)button.dataset.preset=preset.id;else button.dataset.generator=family.typeId;
   const label=document.createElement('span');label.textContent=preset?.name||family.displayName;
   const key=family.typeId+':'+(preset?.id||'default');
   if(!preset&&!presetThumbnails.has(key)){
    let preview=null;
    if(family.typeId==='crystals'){
     const cluster=project.models.find(model=>model.generator.typeId==='crystals');
     preview=cluster?.thumbnail||(active()?.generator.typeId==='crystals'?thumbnail(adapter.previewGroup()):null);
    }else preview=recipeThumbnail(family,preset?.parameters||family.defaultParameters);
    if(preview)presetThumbnails.set(key,preview);
   }
   button.append(preset?presetPicture(family,preset):modelPicture(presetThumbnails.get(key)),label);
   button.onclick=()=>{picker.close();add(family.typeId,preset?.parameters,preset?.name);};
   tile.append(button);
   if(!preset&&family.presets.length){
    const variants=document.createElement('button');variants.type='button';variants.textContent='Browse '+family.presets.length+' starting points';
    variants.setAttribute('aria-label','Browse '+family.displayName+' starting points');
    variants.onclick=()=>{renderPicker(family);grid.querySelector('button')?.focus();};
    tile.append(variants);
   }
   grid.append(tile);
  };
  if(generator){
   const back=document.createElement('button');back.type='button';back.className='sms-picker-back';back.textContent='← All model types';
   back.onclick=()=>{renderPicker();grid.querySelector('[data-generator="'+generator.typeId+'"]')?.focus();};
   grid.append(back);
   for(const preset of visualPresets(generator))appendCard(generator,preset);
  }else{
   for(const family of registry.list())appendCard(family,null);
  }
 }
 const snapshot=adapter.capture();
 if(!project.models.length)addModel(project,createModel({name:snapshot.settings.title||'Crystal Mine',typeId:'crystals',parameters:snapshot.settings,editableState:{crystals:snapshot.crystals,selectedId:snapshot.selectedId}}));
 if(!project.tabs.length)openTab(project,project.models[0].id);
 $('smsProjectTitle').value=project.title;
 $('smsProjectTitle').onchange=()=>{project.title=$('smsProjectTitle').value.trim()||'Untitled project';save();};
 $('smsReload').onclick=()=>{
  try{
   saveImmediately();
  }catch(error){
   $('smsSaveState').textContent='Reload paused — download a backup';
   adapter.status('Your work is still open. '+error.message);
   return;
  }
  const url=new URL(window.location.href);
  url.searchParams.set('reload',String(Date.now()));
  window.location.replace(url.href);
 };
 const release=document.querySelector('meta[name="studio-release"]')?.content;
 if(release)$('smsReload').title+=' · Build '+release.slice(0,7);
 $('smsLibrary').onclick=()=>showLibrary();
 if(!shell)$('smsPrint').onclick=()=>showPrint();
 $('smsNew').onclick=openPicker;
 const editors=installExactValueEditors();
 function active(){return currentId?findModel(project,currentId):null;}
 function captureCrystal(){
  if(switching||active()?.generator.typeId!=='crystals')return;
  const v=adapter.capture(),model=active();
  if(model.link){adapter.status('This is a pinned library model. Create an independent variant before editing.');return;}
  editModel(project,model.id,{parameters:v.settings,editableState:{crystals:v.crystals,selectedId:v.selectedId}});
  save();renderTabs();
 }
 function save(){
  dirty=true;$('smsSaveState').textContent='Saving…';clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{
   try{validateProject(project);localStorage.setItem(WORKSPACE_KEY,JSON.stringify(state));dirty=false;$('smsSaveState').textContent='Saved locally';}
   catch(error){$('smsSaveState').textContent='Save failed — download a backup';adapter.status('Your work is still in memory. '+error.message);}
  },120);
 }
 function saveImmediately(){clearTimeout(saveTimer);validateProject(project);localStorage.setItem(WORKSPACE_KEY,JSON.stringify(state));dirty=false;}
 window.addEventListener('beforeunload',event=>{try{if(dirty)saveImmediately();}catch{event.preventDefault();event.returnValue='';}});
 function remember(){
  if(!currentId)return;const model=active();
  if(model.generator.typeId==='crystals'){
   captureCrystal();cache.set(currentId,{...adapter.detach(),kind:'crystals',fingerprint:modelFingerprint(model)});
  }else{
   const c=cache.get(currentId);if(c?.group)c.group.removeFromParent();if(c)c.view={camera:camera.position.toArray(),target:orbit.target.toArray()};
  }
 }
 function switchModel(id){
  if(id===currentId&&mode==='model'){renderEditor();return;}
  cancelPixelGesture();placementModel=null;pendingDuplicate=null;editors.cancel();remember();switching=true;
  try{
   const model=findModel(project,id);currentId=id;openTab(project,id);mode='model';overlay.hidden=true;
   document.body.classList.toggle('sms-generic-mode',model.generator.typeId!=='crystals');
   document.body.classList.toggle('sms-sidebar-mode',model.generator.typeId!=='crystals');
   panel.hidden=model.generator.typeId==='crystals';
   if(model.generator.typeId==='crystals'){
    adapter.activate(model,cache.get(id)?.fingerprint===modelFingerprint(model)?cache.get(id):null);
   }else showGeneric(model);
   renderTabs();renderEditor();save();
   if($('smsIndependentCrystal'))setCrystalReadonly(model.generator.typeId==='crystals'&&!!model.link);
  }catch(error){panel.hidden=false;document.body.classList.add('sms-sidebar-mode');panel.innerHTML='<p class="sms-error">'+esc(error.message)+'</p><p>The document is preserved. Export a backup before recovery.</p>';}
  finally{switching=false;}
 }
 function showGeneric(model){
  const generator=registry.get(model.generator.typeId),fingerprint=modelFingerprint(model);let c=cache.get(model.id);
  if(!c?.group||c.fingerprint!==fingerprint){
   if(c?.group&&c.group.parent)c.view={camera:camera.position.toArray(),target:orbit.target.toArray()};
   if(c?.group)disposeGroup(c.group);
   const recipe=applyBuildModules(generator.recipe(model.parameters),model.build,generator.capabilities,{preview:true});
   const group=previewRecipe(THREE,recipe,[model.materials.primary?.colour||0x88bbff,model.materials.secondary?.colour||0xffcf70]);previewBuilds++;c={kind:'generic',group,fingerprint,view:c?.view,routing:recipe.nativeRouting};cache.set(model.id,c);
   model.thumbnail=thumbnail(group);
  }
  scene.add(c.group);
  if(c.view){camera.position.fromArray(c.view.camera);orbit.target.fromArray(c.view.target);camera.lookAt(orbit.target);}
  else frame(c.group);
  adapter.status('Ready — '+generator.displayName+'. Preview is editable geometry; prepare the print job before exporting.');
 }
 function frame(group){
  const box=new THREE.Box3().setFromObject(group),size=box.getSize(new THREE.Vector3()),centre=box.getCenter(new THREE.Vector3());
  orbit.target.copy(centre);const distance=Math.max(size.length()*1.5,70);camera.position.copy(centre).add(new THREE.Vector3(1,.9,1).normalize().multiplyScalar(distance));camera.lookAt(centre);orbit.update();
 }
 let thumbRenderer=null;
 function thumbnail(group){
  try{
   thumbRenderer??=new THREE.WebGLRenderer({antialias:true,alpha:false});thumbRenderer.localClippingEnabled=true;thumbRenderer.setSize(200,150);thumbRenderer.setPixelRatio(1);
   const thumbScene=new THREE.Scene();thumbScene.background=new THREE.Color(0xeaf0f7);thumbScene.add(new THREE.AmbientLight(0xffffff,2));
   const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(80,140,100);thumbScene.add(light);
   const clone=group.clone(true);thumbScene.add(clone);const box=new THREE.Box3().setFromObject(clone);if(box.isEmpty())return null;
   const centre=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());const view=new THREE.PerspectiveCamera(38,4/3,.1,5000);
   view.position.copy(centre).addScaledVector(new THREE.Vector3(1,1.3,1).normalize(),Math.max(40,size.length()*1.9));view.lookAt(centre);thumbRenderer.render(thumbScene,view);
   return thumbRenderer.domElement.toDataURL('image/png');
  }catch{return null;}
 }
 function crystalPresetThumbnail(settings){
  let group;
  try{group=crystalStartingPointPreview(THREE,settings);return thumbnail(group);}
  catch{return null;}
  finally{if(group)disposeGroup(group);}
 }
 function presetPicture(family,preset){
  const key=family.typeId+':'+preset.id;
  if(!presetThumbnails.has(key)){
   const picture=family.typeId==='crystals'?crystalPresetThumbnail(preset.parameters):recipeThumbnail(family,preset.parameters);
   if(picture)presetThumbnails.set(key,picture);
  }
  return modelPicture(presetThumbnails.get(key));
 }
 function recipeThumbnail(generator,parameters,build={},colours){
  let group;
  try{
   group=previewRecipe(THREE,applyBuildModules(generator.recipe(parameters),build,generator.capabilities,{preview:true}),colours);
   return thumbnail(group);
  }catch{return null;}
  finally{if(group)disposeGroup(group);}
 }
 const isModelThumbnail=src=>typeof src==='string'&&/^data:image\/(png|jpeg|webp);base64,/.test(src);
 function modelPicture(src){
  if(isModelThumbnail(src)){
   const img=document.createElement('img');img.alt='';img.src=src;img.loading='lazy';img.decoding='async';return img;
  }
  const placeholder=document.createElement('span');placeholder.className='sms-picture-empty';placeholder.textContent='Preview unavailable';return placeholder;
 }
 function renderTabs(){
  for(const job of project.printJobs)if(job.status==='stale')discardPrintResult(job.id);
  if(inspection){
   if(!inspection.root.isConnected)$('smsPrecisionContent').prepend(inspection.root);
   const model=active(),job=project.printJobs.find(item=>item.modelId===currentId);
   const type=model?.generator.typeId;
   const supported=mode==='model'&&(type==='crystals'||(type==='light-pods'&&model.parameters.illuminated));
   inspection.update(supported?currentId:null,supported&&job?currentPrintResult(job):undefined,supported?job?.status:undefined);
  }
  if(shell){const history=histories.get(currentId),crystal=active()?.generator.typeId==='crystals';const blocked=mode!=='model'||!!active()?.link;$('smsGlobalUndo').disabled=blocked||!(crystal?adapter.canUndo(-1):history?.index>0);$('smsGlobalRedo').disabled=blocked||!(crystal?adapter.canUndo(1):history?.index<history?.items.length-1);document.body.dataset.studioView=mode;shell.home.toggleAttribute('aria-current',mode==='home');$('smsLibrary').toggleAttribute('aria-current',mode==='library');if(mode!=='model'&&document.body.classList.contains('sms-focused'))shell.focus.click();}
  const type=mode==='model'?active()?.generator.typeId:null;
  document.body.dataset.modelTheme=type||'workspace';
  document.body.classList.add('sms-workspace');
  for(const button of document.querySelectorAll('.workspace-tabs [data-tab]')){
   const step=button.dataset.tab;
   button.textContent=shell?{design:'Design',build:'Build',print:'Print Centre'}[step]:{design:'1 · Design',build:'2 · Build',print:'3 · Print Centre'}[step];
   const selected=mode==='print'?step==='print':mode==='model'&&step===(type==='crystals'?document.querySelector('.workspace-tabs [data-tab].active')?.dataset.tab:stage);
   if(selected)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
  }
  const root=$('smsTabs');root.replaceChildren();
  for(const id of project.tabs){const model=findModel(project,id),button=document.createElement('button');button.role='tab';button.dataset.modelTheme=model.generator.typeId;button.id='model-tab-'+id;button.setAttribute('aria-selected',String(currentId===id&&mode==='model'));button.tabIndex=currentId===id?0:-1;
   button.textContent=model.name+(project.printJobs.some(j=>j.modelId===id&&j.status==='preparing')?' ⏳':'');button.draggable=true;
   button.setAttribute('aria-label',model.name);
   if(shell)button.prepend(modelPicture(model.thumbnail||(model.id===currentId&&model.generator.typeId==='crystals'?thumbnail(adapter.previewGroup()):null)));
   const close=document.createElement('span');close.textContent='×';close.className='close-tab';close.setAttribute('aria-hidden','true');button.append(close);
   button.onclick=e=>{if(e.target===close){closeModel(id);return;}switchModel(id);};
   button.title='Double-click to rename. Drag or use Alt+Up/Down to reorder. Delete closes the tab.';
   button.ondblclick=()=>{const name=prompt('Model name',model.name);if(name?.trim()){if(model.link){adapter.status('Make an independent variant before renaming a linked model.');return;}editModel(project,id,{name:name.trim()});renderTabs();save();}};
   button.onkeydown=e=>{const i=project.tabs.indexOf(id);if(shell&&e.altKey&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const to=Math.max(0,Math.min(project.tabs.length-1,i+(['ArrowUp','ArrowLeft'].includes(e.key)?-1:1)));const ids=[...project.tabs];ids.splice(i,1);ids.splice(to,0,id);reorderTabs(project,ids);renderTabs();save();$('model-tab-'+id)?.focus();return;}if(e.key==='Delete'){e.preventDefault();closeModel(id);}if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const target=e.key==='Home'?0:e.key==='End'?project.tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+project.tabs.length)%project.tabs.length;switchModel(project.tabs[target]);$('model-tab-'+project.tabs[target])?.focus();}};
   button.ondragstart=e=>e.dataTransfer.setData('text/plain',id);button.ondragover=e=>e.preventDefault();button.ondrop=e=>{e.preventDefault();const from=e.dataTransfer.getData('text/plain');if(!project.tabs.includes(from))return;const ids=project.tabs.filter(x=>x!==from);ids.splice(ids.indexOf(id),0,from);reorderTabs(project,ids);renderTabs();save();};root.append(button);
  }
 }
 function closeModel(id){
  if(currentId===id){remember();currentId=null;}
  closeTab(project,id);const c=cache.get(id);
  if(c?.group)disposeGroup(c.group);else if(c)adapter.release(c);cache.delete(id);
  if(project.activeTab)switchModel(project.activeTab);else showLibrary();save();
 }
 function add(typeId,parameters=null,name=null){
  const g=registry.get(typeId),p={...g.defaultParameters,...parameters};
  const editableState=typeId==='crystals'?adapter.createCrystals(p):{};
  const model=createModel({name:name||g.displayName,typeId,parameters:p,editableState});addModel(project,model);switchModel(model.id);return model;
 }
 function control(schema,p){
  const key=esc(schema.key),label=esc(schema.label||schema.key),value=p[schema.key];
  if(schema.type==='select')return '<label>'+label+'<select data-model-param="'+key+'">'+schema.options.map(o=>'<option '+(o===value?'selected':'')+'>'+esc(o)+'</option>').join('')+'</select></label>';
  if(schema.type==='boolean')return '<label><input type="checkbox" data-model-param="'+key+'" '+(value?'checked':'')+'> '+label+'</label>';
  return '<div class="sms-model-control"><label>'+label+'<output data-value-for="'+key+'">'+esc(value)+' '+esc(schema.unit||'')+'</output></label><input type="range" data-model-param="'+key+'" min="'+schema.min+'" max="'+schema.max+'" step="'+(schema.step||.1)+'" value="'+value+'"></div>';
 }
 function details(title,descriptor,html){return '<details class="sms-panel-details"><summary>'+esc(title)+'<small>'+esc(descriptor)+'</small></summary><div>'+html+'</div></details>';}
 function designSections(generator,model){
  const groups=[
   ['Form and silhouette','Choose the outline, teeth or surface pattern.',/mode|outline|pattern|character|top|symbol|style/i],
   ['Size and proportions','Set the overall size and depth.',/^(?!grip|socket).*?(width|height|depth|thickness|diameter|head|legs)/i],
   ['Edges and surface feel','Change the relief, curves and edge profile.',/corner|relief|density|variation|amplitude|frequency|orientation|phase|facets|direction|round|tooth|grip|leverAngle/i],
   ['Holes and fittings','Make space for shafts, spokes or other hardware.',/shaft|bore|hub|spokes|socket|tolerance|opening|cable|hole/i],
   ['Light and materials','Choose material regions and lighting options.',/dualMaterial|illuminated|wall|inlay/i]
  ];
  const family=generator.parameterSchema.find(field=>field.key==='controlStyle');
  const style=model.parameters.controlStyle||'Pushbutton';
  const familyFields={
   outline:['Pushbutton'],top:['Pushbutton'],
   symbol:model.parameters.rotaryMark==='Recessed pointer'?['Pushbutton','Rotary selector']:['Pushbutton','Rotary knob','Rotary selector'],
   rotaryTop:['Rotary knob'],rotaryMark:['Rotary knob'],
   controlGrip:['Thumb joystick','Toggle lever','Rocker','Fader cap','Directional pad'],
   cornerRound:style==='Pushbutton'&&model.parameters.outline==='Square'?['Pushbutton']:[],
   gripProfile:['Rotary knob','Rotary selector'],gripCount:['Rotary knob','Rotary selector'],gripDepth:['Rotary knob','Rotary selector'],
   leverAngle:['Toggle lever','Rocker'],
   socketProfile:['Rotary knob','Rotary selector','Toggle lever','Rocker','Fader cap','Thumb joystick','Directional pad','Indicator lens']
  };
  const remaining=new Set(generator.parameterSchema.filter(field=>field!==family&&(!family||!familyFields[field.key]||familyFields[field.key].includes(style))));
  const output=groups.map(([title,description,pattern])=>{
   const controls=[...remaining].filter(field=>pattern.test(field.key));
   controls.forEach(field=>remaining.delete(field));
   return controls.length?details(title,description,controls.map(field=>control(field,model.parameters)).join('')):'';
  });
  if(remaining.size)output.push(details('Fine adjustments','Adjust the seed or other generator settings.',[...remaining].map(field=>control(field,model.parameters)).join('')));
  return (family?control(family,model.parameters):'')+output.join('');
 }
 const hiddenNativeRoutes=new Set();
 const selectedPixels=new Map(),pixelMessages=new Map(),pixelProfileChoices=new Map();
 let placementModel=null,pixelGesture=null,pendingDuplicate=null;
 const pixelHoles=model=>stablePixels(model.build.pixelHoles||[]);
 const fittingProfiles=()=>pixelProfiles(adapter.pixelFitProfiles?.()||[]);
 const chosenProfile=model=>fittingProfiles().find(profile=>profile.id===(pixelProfileChoices.get(model.id)||'seed'));
 function pixelMarkers(model){
  return (cache.get(model.id)?.group?.children||[]).filter(mesh=>mesh.userData.pixelId);
 }
 function refreshPixelMarkers(model){
  if(model.generator.typeId==='crystals')return;
  for(const guide of cache.get(model.id)?.group?.children||[])if(guide.userData.nativeRoute)
   guide.visible=stage==='build'&&!hiddenNativeRoutes.has(model.id);
  for(const marker of pixelMarkers(model)){
   marker.visible=stage==='build';
   marker.material.color.setHex(marker.userData.pixelId===selectedPixels.get(model.id)?0x48e4f1:0xffbe47);
  }
  for(const port of cache.get(model.id)?.group?.children||[])if(port.userData.pixelLabel||port.userData.pixelPort)
   port.visible=stage==='build'&&(!!port.userData.pixelLabel||port.userData.pixelPort===selectedPixels.get(model.id));
 }
 function pixelStatus(model,message){
  pixelMessages.set(model.id,message);
  for(const output of document.querySelectorAll('[data-pixel-status]'))output.textContent=message;
  if($('smsModelError'))$('smsModelError').textContent=message;
 }
 function pixelSource(model){
  const family=registry.get(model.generator.typeId);
  return applyBuildModules(family.recipe(model.parameters),{...model.build,pixelHoles:[],serialRouting:null},family.capabilities,{preview:true});
 }
 function pixelIssue(model,hole,others,recipe){
  try{return checkedPixelBore(recipe||pixelSource(model),hole,others);}catch(error){return error.message;}
 }
 function redrawPixelEditor(focus){
  const open=$('smsPixelAdd')?.closest('details')?.open;
  renderEditor();
  if(open)$('smsPixelAdd').closest('details').open=true;
  if(focus?.selector)focus.root.querySelector(focus.selector)?.focus({preventScroll:true});
 }
 function selectPixel(model,id){
  selectedPixels.set(model.id,id);
  refreshPixelMarkers(model);
  renderPalette();
 }
 function savePixels(model,holes,id,focus){
  if(!commit({build:{...model.build,pixelHoles:holes,pixelBuilderVersion:1}}))return false;
  selectedPixels.set(model.id,id);
  pixelMessages.delete(model.id);
  redrawPixelEditor(focus);
  return true;
 }
 function editPixel(model,index,hole,focus){
  const holes=pixelHoles(model);
  if(!holes[index]||model.link)return false;
  const issue=pixelIssue(model,hole,holes.filter((_,i)=>i!==index));
  if(issue){pixelStatus(model,issue);return false;}
  holes[index]={...hole,checked:true};
  return savePixels(model,holes,hole.id,focus);
 }
 function removePixel(model,index){
  const holes=pixelHoles(model);
  if(!holes[index]||model.link)return;
  holes.splice(index,1);savePixels(model,holes,holes[Math.min(index,holes.length-1)]?.id);
 }
 function addAutomaticPixel(model){
  try{
   const holes=pixelHoles(model),recipe=pixelSource(model);
   if(holes.length>=16){pixelStatus(model,'Use up to 16 fittings per model.');return;}
   const hole=findPixelPosition(recipe,holes,chosenProfile(model));
   if(hole)savePixels(model,[...holes,{...hole,checked:true}],hole.id);
   else pixelStatus(model,'No clear material for this bore. '+(checkedPixelBore(recipe,newPixel(chosenProfile(model)),holes)||'Try a smaller fitting.'));
  }catch(error){pixelStatus(model,error.message);}
 }
 function pixelRay(event){
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
  partRay.setFromCamera(pointer,camera);
 }
 function projectMarker(marker){
  const rect=viewport.getBoundingClientRect(),p=marker.position.clone().project(camera);
  return {x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};
 }
 function markerAt(model,event){
  return pixelMarkers(model).map(marker=>{
   const p=projectMarker(marker);
   return {marker,distance:Math.hypot(p.x-event.clientX,p.y-event.clientY)};
  }).filter(hit=>hit.distance<=14).sort((a,b)=>a.distance-b.distance)[0]?.marker;
 }
 const viewport=renderer.domElement;
 const consume=event=>{event.preventDefault();event.stopImmediatePropagation();};
 const canEditPixels=model=>mode==='model'&&stage==='build'&&model&&model.generator.typeId!=='crystals';
 viewport.addEventListener('pointerdown',event=>{
  const model=active();
  if(event.button!==0||!canEditPixels(model))return;
  const marker=markerAt(model,event),placing=placementModel===model.id&&!model.link;
  if(!marker&&!placing)return;
  consume(event);viewport.focus({preventScroll:true});viewport.setPointerCapture(event.pointerId);
  const canDrag=marker?.userData.pixelId===selectedPixels.get(model.id);
  pixelGesture={model,marker,placing,canDrag,id:event.pointerId,time:performance.now(),start:[event.clientX,event.clientY]};
  if(marker)selectPixel(model,marker.userData.pixelId);
 },true);
 viewport.addEventListener('pointermove',event=>{
  const gesture=pixelGesture;
  if(!gesture||gesture.id!==event.pointerId)return;
  consume(event);
  if(!gesture.marker||!gesture.canDrag||gesture.model.link||gesture.placing)return;
  const [x,y]=gesture.start;
  if(!gesture.origin&&Math.hypot(event.clientX-x,event.clientY-y)<4)return;
  if(!gesture.origin&&performance.now()-gesture.time<180){cancelPixelGesture();return;}
  if(!gesture.origin){
   gesture.origin=gesture.marker.position.clone();
   try{gesture.recipe=pixelSource(gesture.model);}catch(error){pixelStatus(gesture.model,error.message);cancelPixelGesture();return;}
  }
  pixelRay(event);
  const hit=partRay.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-gesture.origin.y),new THREE.Vector3());
  if(!hit)return;
  const holes=pixelHoles(gesture.model),id=gesture.marker.userData.pixelId;
  const current=holes.find(hole=>hole.id===id);
  gesture.candidate={...current,x:Math.round(hit.x*10)/10,z:Math.round(hit.z*10)/10};
  const issue=pixelIssue(gesture.model,gesture.candidate,holes.filter(hole=>hole.id!==id),gesture.recipe);
  movePixelMarker(gesture.model,gesture.marker,gesture.candidate.x,gesture.candidate.z);
  gesture.marker.material.color.setHex(issue?0xff3c59:0x48e4f1);
 },true);
 function movePixelMarker(model,marker,x,z){
  marker.position.x=x;marker.position.z=z;
  const id=marker.userData.pixelId;
  for(const part of cache.get(model.id)?.group?.children||[]){
   if(part.userData.pixelPort===id||part.userData.pixelLabel===id){part.position.x=x;part.position.z=z;}
  }
 }
 function cancelPixelGesture(){
  const gesture=pixelGesture;pixelGesture=null;
  if(!gesture)return;
  if(gesture.origin)movePixelMarker(gesture.model,gesture.marker,gesture.origin.x,gesture.origin.z);
  refreshPixelMarkers(gesture.model);
  if(viewport.hasPointerCapture(gesture.id))viewport.releasePointerCapture(gesture.id);
 }
 viewport.addEventListener('pointercancel',cancelPixelGesture,true);
 viewport.addEventListener('lostpointercapture',cancelPixelGesture,true);
 viewport.addEventListener('pointerup',event=>{
  const gesture=pixelGesture;
  if(!gesture||gesture.id!==event.pointerId)return;
  consume(event);cancelPixelGesture();
  const model=gesture.model;
  if(active()?.id!==model.id||!canEditPixels(model))return;
  if(gesture.candidate){
   const index=pixelHoles(model).findIndex(hole=>hole.id===gesture.candidate.id);
   editPixel(model,index,gesture.candidate);return;
  }
  if(!gesture.placing||gesture.marker)return;
  pixelRay(event);
  const group=cache.get(model.id)?.group;
  const hit=partRay.intersectObjects(group?.children.filter(mesh=>mesh.isMesh&&!mesh.userData.previewOnly)||[],false)[0];
  if(!hit){pixelStatus(model,'Click a solid model surface to place the fitting.');return;}
  const holes=pixelHoles(model);
  if(holes.length>=16){pixelStatus(model,'Use up to 16 fittings per model.');return;}
  const fresh=newPixel(chosenProfile(model),Math.round(hit.point.x*10)/10,Math.round(hit.point.z*10)/10);
  const hole=pendingDuplicate?{...pendingDuplicate,id:fresh.id,x:fresh.x,z:fresh.z}:fresh;
  const issue=pixelIssue(model,hole,holes);
  if(issue){pixelStatus(model,issue);return;}
  placementModel=null;pendingDuplicate=null;
  savePixels(model,[...holes,{...hole,checked:true}],hole.id);
 },true);
 viewport.addEventListener('keydown',event=>{
  const model=active();
  if(!canEditPixels(model))return;
  if(event.key==='Escape'&&(pixelGesture||placementModel===model.id)){
   consume(event);cancelPixelGesture();placementModel=null;pendingDuplicate=null;pixelStatus(model,'Placement cancelled.');renderPalette();return;
  }
  if(model.link)return;
  const holes=pixelHoles(model),index=holes.findIndex(hole=>hole.id===selectedPixels.get(model.id));
  if(index<0)return;
  const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
  if(event.key==='Delete'){consume(event);removePixel(model,index);}
  if(delta){
   consume(event);const n=event.shiftKey?5:1,hole=holes[index];
   editPixel(model,index,{...hole,x:hole.x+delta[0]*n,z:hole.z+delta[1]*n});
  }
 },true);
 function renderCrystalPixelPalette(root,model){
  const selected=adapter.crystalSelectedPixel?.();
  if(!selected)return;
  const box=document.createElement('fieldset');box.innerHTML='<legend>'+esc(selected.label)+'</legend>';
  for(const [key,label,step] of [['x','X (mm)',.1],['z','Z (mm)',.1],['wireAngle','IN/OUT angle (°)',1]]){
   const field=document.createElement('label'),input=document.createElement('input');
   field.textContent=label;input.type='number';input.required=true;input.step=step;
   input.value=selected[key]??0;input.disabled=!!model.link;input.dataset.crystalPixelKey=key;
   input.onchange=()=>{
    const result=input.checkValidity()?adapter.updateCrystalPixel(selected.id,{[key]:input.valueAsNumber}):{reason:'Enter a valid number.'};
    if(!result.valid){input.value=selected[key]??0;box.querySelector('[role=status]').textContent=result.reason||'This edit could not be placed.';}
   };
   field.append(input);box.append(field);
  }
  const fitting=selected.fitting;
  const profileLabel=document.createElement('label'),profileSelect=document.createElement('select');
  profileLabel.textContent='Pixel profile';profileSelect.disabled=!!model.link;
  for(const profile of selected.profiles){
   const option=document.createElement('option');option.value=profile.id;option.textContent=profile.name;profileSelect.append(option);
  }
  profileSelect.value=fitting.id;profileSelect.dataset.crystalPixelKey='profile';profileLabel.append(profileSelect);box.append(profileLabel);
  const summary=document.createElement('p');
  summary.textContent=fitting.name+' · '+fitting.bodyDiameter+' mm body · '+fitting.boreDiameter.toFixed(2)+' mm bore';
  box.append(summary);
  const status=document.createElement('p');status.setAttribute('role','status');box.append(status);
  profileSelect.onchange=()=>{
   const result=adapter.updateCrystalPixel(selected.id,{profileId:profileSelect.value});
   if(!result.valid){profileSelect.value=fitting.id;status.textContent=result.reason;}
  };
  const formats=document.createElement('label');formats.innerHTML='Seat coupon format<select><option value="stl">STL</option><option value="3mf">3MF</option></select>';
  box.append(formats);
  const coupon=document.createElement('button');coupon.type='button';coupon.textContent='Download selected seat coupon';
  coupon.onclick=async()=>{
   coupon.disabled=true;
   try{
    const sizes=await adapter.crystalPixelFitCoupon(formats.querySelector('select').value);
    status.textContent='Seat coupon downloaded. Bores: '+sizes.map(size=>size.toFixed(2)).join(', ')+' mm.';
   }catch(error){status.textContent=error.message;}
   finally{coupon.disabled=false;}
  };
  box.append(coupon);
  const remove=document.createElement('button');remove.type='button';remove.textContent='Remove '+selected.label;remove.disabled=!!model.link;
  remove.onclick=()=>adapter.removeCrystalPixel();
  box.append(remove);root.append(box);
 }
 document.addEventListener('studio-crystal-pixel-selection',()=>{
  const key=document.activeElement?.dataset.crystalPixelKey;
  renderPalette();
  if(key)shell?.palette.querySelector('[data-crystal-pixel-key="'+key+'"]')?.focus({preventScroll:true});
 });
 function appendNativeRouting(root,model){
  const plan=cache.get(model.id)?.routing;
  if(!plan)return;
  const block=document.createElement('fieldset');
  block.innerHTML='<legend>Serial LED string</legend>';
  root.prepend(block);
  const settings={version:1,enabled:false,pitch:50,inTail:200,outTail:200,...model.build.serialRouting};
  const disabled=model.link?' disabled':'';
  const change=fields=>{
   if(commit({build:{...model.build,serialRouting:{...settings,...fields}}}))redrawPixelEditor();
  };
  const note=document.createElement('p');
  note.setAttribute('role','status');
  note.textContent=plan.reason?(!settings.enabled?'Bore-only — '+plan.reason:plan.reason):settings.enabled?'Channels ready for preparation.':'Opt in to cut 3.2 mm wide, 1.8 mm deep underside channels.';
  block.append(note);
  block.insertAdjacentHTML('beforeend','<label><input type="checkbox" data-native-route'+(settings.enabled?' checked':'')+
   (model.link||(!settings.enabled&&plan.reason)?' disabled':'')+'> Cut serial channels</label>');
  block.querySelector('[data-native-route]').onchange=e=>change({enabled:e.target.checked});
  if(!settings.enabled)return;
  block.insertAdjacentHTML('beforeend','<label>Physical pixel pitch<select data-native-pitch'+disabled+
   '><option value="25">25 mm</option><option value="50">50 mm</option><option value="100">100 mm</option><option value="custom">Custom</option></select></label>'+
   '<label>IN tail limit (mm)<input data-native-in-tail type="number" min="5" max="250" value="'+esc(settings.inTail)+'"'+disabled+'></label>'+
   '<label>OUT tail limit (mm)<input data-native-out-tail type="number" min="5" max="250" value="'+esc(settings.outTail)+'"'+disabled+'></label>'+
   '<label><input data-native-preview type="checkbox"'+(hiddenNativeRoutes.has(model.id)?'':' checked')+'> Show routes and arrows</label>');
  const pitch=block.querySelector('[data-native-pitch]');
  pitch.value=settings.customPitch||![25,50,100].includes(settings.pitch)?'custom':settings.pitch;
  pitch.onchange=()=>change(pitch.value==='custom'?{customPitch:true}:{pitch:Number(pitch.value),customPitch:false});
  const bindNumber=(input,key)=>input.onchange=()=>{
   if(!input.value||!input.checkValidity()){input.reportValidity();input.value=settings[key];return;}
   change({[key]:input.valueAsNumber});
  };
  bindNumber(block.querySelector('[data-native-in-tail]'),'inTail');
  bindNumber(block.querySelector('[data-native-out-tail]'),'outTail');
  if(pitch.value==='custom'){
   pitch.parentElement.insertAdjacentHTML('afterend','<label>Custom pitch (mm)<input data-native-custom type="number" min="5" max="250" value="'+esc(settings.pitch)+'"'+disabled+'></label>');
   bindNumber(block.querySelector('[data-native-custom]'),'pitch');
  }
  block.querySelector('[data-native-preview]').onchange=e=>{
   if(e.target.checked)hiddenNativeRoutes.delete(model.id);else hiddenNativeRoutes.add(model.id);
   refreshPixelMarkers(model);
  };
  for(const link of plan.links){
   const line=document.createElement('p');
   line.textContent=link.label+(Number.isFinite(link.measure)?' · '+link.measure.toFixed(1)+' / '+link.budget+' mm':'')+(link.reason?' · '+link.reason:'');
   if(link.reason)line.className='sms-error';
   block.append(line);
  }
 }
 function renderPixelPalette(root,model){
  const holes=pixelHoles(model),profiles=fittingProfiles(),selected=holes.findIndex(hole=>hole.id===selectedPixels.get(model.id));
  const disabled=model.link?' disabled':'',noAdd=holes.length>=16?' disabled':disabled;
  const hole=holes[selected]||newPixel(chosenProfile(model));
  const fit=resolvePixelFitting(hole,adapter.pixelFitProfiles());
  root.innerHTML='<p>Bores are available on verified solid regions.</p>'+
   '<div class="sms-actions" aria-label="Hardware library">'+profiles.map(profile=>
    '<button type="button" data-fit-profile="'+esc(profile.id)+'" aria-pressed="'+(chosenProfile(model)?.id===profile.id)+'"'+disabled+
    '>◉ '+esc(profile.name)+' · '+profile.bodyDiameter+' mm</button>').join('')+'</div>'+
   '<div class="sms-actions"><button type="button" data-place-pixel'+noAdd+'>Place LED fitting in 3D</button>'+
   '<button type="button" data-auto-pixel'+noAdd+'>Add pixel hole</button></div>'+
   '<div class="sms-actions" aria-label="Select pixel">'+holes.map((hole,i)=>'<button type="button" data-select-pixel="'+i+'" aria-pressed="'+(i===selected)+'">P'+(i+1)+'</button>').join('')+'</div>'+
   '<p role="status" data-pixel-status>'+esc(pixelMessages.get(model.id)||'Click a marker to select. Hold then drag to move. Arrow keys nudge 1 mm, or 5 mm with Shift.')+'</p>'+
   (selected<0?'':pixelHoleMarkup(holes[selected],selected,esc,disabled,profiles)+
    '<div class="sms-actions"><button type="button" data-pixel-previous'+(selected===0?' disabled':disabled)+'>Move earlier</button><button type="button" data-pixel-next'+(selected===holes.length-1?' disabled':disabled)+'>Move later</button><button type="button" data-duplicate-pixel'+noAdd+'>Duplicate fitting in 3D</button></div>')+
   '<section aria-label="Test print"><h3>Test print</h3><p>'+esc(fit.profileName)+' · '+fit.nominalDiameter+' mm nominal · '+fit.diameter+' mm body · '+fit.boreDiameter+' mm bore · '+fit.clearance+' mm clearance.</p>'+
   '<p>'+esc(fit.warning)+' Print flat with the intended material and nozzle. Test the actual pixel and record the bore that fits.</p>'+
   '<label>Coupon<select data-fit-kind><option value="strip">Clearance strip</option><option value="single">Single bore</option></select></label>'+
   '<label>File format<select data-fit-format><option value="stl">STL</option><option value="3mf">3MF</option></select></label>'+
   '<button type="button" data-fit-print>Download pixel fit test</button>'+
   (selected<0||model.link?'':'<details><summary>Record measured fit</summary><form data-fit-calibration>'+
    '<label>Measured pixel body (mm)<input name="bodyDiameter" type="number" min="2" max="30" step=".01" required value="'+hole.diameter+'"></label>'+
    '<label>Printed bore that fits (mm)<input name="printedBoreDiameter" type="number" min="1.5" max="30.8" step=".01" required></label>'+
    '<label>Reusable profile name (optional)<input name="profileName" maxlength="60"></label><button>Save measured fit</button></form></details>')+'</section>';
  if(fit.profile){
   const diagram=document.createElement('details');
   diagram.innerHTML='<summary>Fitting dimensions</summary>'+renderPixelProfileDiagram({...fit.profile,bodyDiameter:fit.diameter});
   root.querySelector('[aria-label="Hardware library"]').after(diagram);
  }
  root.querySelectorAll('[data-fit-profile]').forEach(button=>button.onclick=()=>{
   const profileId=button.dataset.fitProfile;
   if(selected>=0&&!editPixel(model,selected,applyPixelFittingProfile(holes[selected],profileId,adapter.pixelFitProfiles())))return;
   pixelProfileChoices.set(model.id,profileId);
   renderPalette();
   root.querySelectorAll('[data-fit-profile]').forEach(control=>{if(control.dataset.fitProfile===profileId)control.focus({preventScroll:true});});
  });
  const armPlacement=duplicate=>{
   placementModel=model.id;pendingDuplicate=duplicate;viewport.tabIndex=0;viewport.focus({preventScroll:true});
   pixelStatus(model,'Click a solid model surface to place this fitting. Press Escape to cancel.');
  };
  root.querySelector('[data-place-pixel]').onclick=()=>armPlacement(null);
  const duplicate=root.querySelector('[data-duplicate-pixel]');
  if(duplicate)duplicate.onclick=()=>armPlacement(holes[selected]);
  root.querySelector('[data-auto-pixel]').onclick=()=>addAutomaticPixel(model);
  root.querySelectorAll('[data-select-pixel]').forEach(button=>button.onclick=()=>selectPixel(model,holes[Number(button.dataset.selectPixel)].id));
  for(const [button,step] of [['[data-pixel-previous]',-1],['[data-pixel-next]',1]]){
   const control=root.querySelector(button);
   if(control)control.onclick=()=>{
    const next=holes.slice();[next[selected+step],next[selected]]=[next[selected],next[selected+step]];
    savePixels(model,next,holes[selected].id);
   };
  }
  const print=root.querySelector('[data-fit-print]');
  print.onclick=()=>downloadPixelCoupon(model,hole,{
   kind:root.querySelector('[data-fit-kind]').value,format:root.querySelector('[data-fit-format]').value
  },print);
  const calibration=root.querySelector('[data-fit-calibration]');
  if(calibration)calibration.onsubmit=event=>{
   event.preventDefault();
   const data=new FormData(calibration),name=String(data.get('profileName')).trim();
   const measurement={bodyDiameter:Number(data.get('bodyDiameter')),printedBoreDiameter:Number(data.get('printedBoreDiameter'))};
   try{
    if(!name){editPixel(model,selected,withMeasuredPixelFit(hole,measurement));return;}
    const calibrated=saveablePixelFit(hole,measurement,{name,id:'custom-'+newPixel().id,customProfiles:adapter.pixelFitProfiles()});
    if(editPixel(model,selected,calibrated.hole)){
     adapter.savePixelFitProfile(calibrated.profile);
     redrawPixelEditor();pixelStatus(model,'Saved measured fit to the profile library.');
    }
   }catch(error){pixelStatus(model,error.message);}
  };
  bindPixelEditor(root,model,holes,profiles);
  appendNativeRouting(root,model);
 }
 async function downloadPixelCoupon(model,hole,options,button){
  button.disabled=true;
  try{
   const sizes=await adapter.pixelFitCoupon(hole,options);
   if(active()?.id===model.id)pixelStatus(model,'Fit test downloaded. Bore diameters: '+sizes.map(size=>size.toFixed(2)).join(', ')+' mm.');
  }catch(error){if(active()?.id===model.id)pixelStatus(model,error.message);}
  finally{button.disabled=false;}
 }
 function bindPixelEditor(root,model,holes,profiles){
  bindPixelBuilder(root,{holes,profiles,onAdd:()=>addAutomaticPixel(model),onRemove:index=>removePixel(model,index),
   onEdit:(index,hole)=>{
    const node=document.activeElement,field=node?.dataset.pixelField;
    const selector=field?'[data-pixel-index="'+index+'"][data-pixel-field="'+field+'"]':null;
    return editPixel(model,index,hole,{root,selector});
   }});
 }
 const selectedParts=new Map();
 const partRay=new THREE.Raycaster();
 const pointer=new THREE.Vector2();
 let partPress=null;
 renderer.domElement.addEventListener('pointerdown',event=>{
  partPress=event.button===0?[event.clientX,event.clientY]:null;
 });
 renderer.domElement.addEventListener('pointerup',event=>{
  const start=partPress;
  partPress=null;
  const model=active();
  if(!start||Math.hypot(event.clientX-start[0],event.clientY-start[1])>4||mode!=='model'||stage!=='design'||!model||model.generator.typeId==='crystals')return;
  const group=cache.get(model.id)?.group;
  if(!group||!$('smsPartSelect'))return;
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
  partRay.setFromCamera(pointer,camera);
  const hit=partRay.intersectObjects(group.children,false).find(intersection=>intersection.object.userData.partId);
  if(hit){
   panel.querySelector('#smsPartEditor').open=true;
   selectRecipePart(model,hit.object.userData.partId);
   renderPalette();
  }
 });
 function partEditor(model){
  const meshes=(cache.get(model.id)?.group?.children||[]).filter(mesh=>mesh.userData.partId);
  if(!meshes.length)return '';
  const options=meshes.map(mesh=>{
   const id=mesh.userData.partId;
   const [,index,shape]=id.split('-');
   const role=mesh.userData.materialRole==='primary'?'Body':'Detail';
   return '<option value="'+id+'">'+role+' '+(Number(index)+1)+' · '+shape+'</option>';
  });
  const axes=[['X','Left / right'],['Y','Lift'],['Z','Front / back']];
  return '<details class="sms-panel-details" id="smsPartEditor"><summary>Individual parts<small>Pick a part in the preview or choose it here.</small></summary><div>'+
   '<label>Part<select id="smsPartSelect"><option value="">Choose a part</option>'+options.join('')+'</select></label>'+
   '<fieldset id="smsPartOffsets"><legend>Offset from generated position (mm)</legend>'+
   axes.map(([axis,label],index)=>'<label>'+label+' ('+axis+')<input type="number" data-part-axis="'+index+'" min="'+(index===1?0:-50)+'" max="50" step=".1" value="0"></label>').join('')+
   '<button id="smsPartApply" type="button">Apply offset</button><button id="smsPartReset" type="button">Reset offset</button></fieldset></div></details>';
 }
 function selectRecipePart(model,id){
  const selector=$('smsPartSelect');
  if(!selector)return;
  selector.value=id;
  id=selector.value;
  selectedParts.set(model.id,id);
  const offset=model.build.partOffsets?.[id]||[0,0,0];
  $('smsPartOffsets').disabled=!id||!!model.link;
  panel.querySelectorAll('[data-part-axis]').forEach(input=>{input.value=offset[Number(input.dataset.partAxis)];});
  for(const mesh of cache.get(model.id)?.group?.children||[]){
   mesh.material?.emissive?.setHex(id&&mesh.userData.partId===id?0x116047:0);
  }
 }
 function applyPartOffset(model,id,offset){
  if(!id)return false;
  const partOffsets={...model.build.partOffsets};
  if(offset.some(Boolean))partOffsets[id]=offset;
  else delete partOffsets[id];
  if(!commit({build:{...model.build,partOffsets}}))return false;
  selectRecipePart(model,id);
  renderPalette();
  return true;
 }
 function bindPartEditor(model){
  const selector=$('smsPartSelect');
  if(!selector)return;
  selectRecipePart(model,selectedParts.get(model.id)||'');
  selector.onchange=()=>{selectRecipePart(model,selector.value);renderPalette();};
  const apply=offset=>applyPartOffset(model,selector.value,offset);
  $('smsPartApply').onclick=()=>{
   const fields=[...panel.querySelectorAll('[data-part-axis]')];
   if(fields.every(input=>input.reportValidity()&&Number.isFinite(input.valueAsNumber)))apply(fields.map(input=>input.valueAsNumber));
  };
  $('smsPartReset').onclick=()=>apply([0,0,0]);
 }
 function showHome(){
  captureCrystal();mode='home';overlay.hidden=false;panel.hidden=true;renderTabs();
  overlay.innerHTML='<h1>Wonder Trunks Studio</h1><div class="sms-actions"><button id="smsHomeNew">New model</button><button id="smsHomeLibrary">Open Library</button><button id="smsHomeProject">Name current project</button></div><label>Find recent work <input type="search" id="smsHomeSearch"></label><h2>Recent models and saved projects</h2><div id="smsHomeModels" class="sms-grid"></div>';
  $('smsHomeNew').onclick=openPicker;$('smsHomeLibrary').onclick=showLibrary;
  $('smsHomeProject').onclick=()=>{$('smsProjectTitle').focus();$('smsProjectTitle').select();};
  const render=()=>{
   const query=$('smsHomeSearch').value.toLowerCase().trim(),root=$('smsHomeModels');root.replaceChildren();
   for(const model of [...project.models].reverse()){
    const family=registry.get(model.generator.typeId).displayName;
    if(![model.name,family].some(value=>value.toLowerCase().includes(query)))continue;
    const item=document.createElement('button');item.className='sms-tile';item.append(modelPicture(model.thumbnail||(model.id===currentId&&model.generator.typeId==='crystals'?thumbnail(adapter.previewGroup()):null)),model.name);item.onclick=()=>switchModel(model.id);root.append(item);
   }
   for(const saved of state.savedProjects.filter(item=>item.title.toLowerCase().includes(query))){
    const item=document.createElement('button');item.textContent='Open project: '+saved.title;item.onclick=()=>{if(!confirm('Open this project and save a copy of the current project?'))return;remember();saveProjectSnapshot();replaceProject(saved);};root.append(item);
   }
   if(!root.children.length)root.textContent='No matching work. Clear search or create a model.';
  };
  $('smsHomeSearch').oninput=render;render();
 }
 function renderPalette(){
  if(!shell||mode!=='model')return;
  const model=active(),family=registry.get(model.generator.typeId);
  const build=model.generator.typeId==='crystals'?document.querySelector('.workspace-tabs [data-tab=build]').classList.contains('active'):stage==='build';
  const root=shell.palette;root.replaceChildren();
  const heading=document.createElement('h2');heading.textContent=build?'Build tools':'Design choices';root.append(heading);
  const controls=document.createElement('div');controls.className='sms-context-controls';root.append(controls);
  if(!build&&family.presets.length){
   const crystal=family.typeId==='crystals';
   const cards=document.createElement('div');cards.className='sms-preset-strip';
   const presets=document.createElement('details'),summary=document.createElement('summary');
   summary.textContent=crystal?'Crystal starting points — creates a new model':'Illustrated starting points';
   presets.append(summary,cards);controls.before(presets);
   const populate=()=>{
    if(cards.childElementCount)return;
    for(const preset of visualPresets(family)){
     const card=document.createElement('button');card.type='button';card.append(presetPicture(family,preset),preset.name);
     card.disabled=!crystal&&!!model.link;
     card.onclick=()=>{
      if(crystal){add(family.typeId,preset.parameters,preset.name);return;}
      commit({parameters:copy(preset.parameters)});renderEditor();
     };
     cards.append(card);
    }
   };
   if(crystal)presets.addEventListener('toggle',()=>{if(presets.open)populate();});
   else populate();
  }
  const part=build||family.typeId==='crystals'?null:$('smsPartSelect');
  if(part?.value){
   const region=document.createElement('section'), title=document.createElement('h3');
   region.className='sms-context-controls';region.setAttribute('aria-label','Selected part');controls.before(region);
   title.textContent=part.selectedOptions[0].textContent;region.append(title);
   const id=part.value,offset=model.build.partOffsets?.[id]||[0,0,0];
   for(const [axis,label] of ['Left / right','Lift','Front / back'].entries()){
    const key='part-offset-'+axis;
    visualRange(region,{key,label,min:axis===1?0:-50,max:50,step:.1,unit:'mm'},offset[axis],value=>{
     const next=[...offset];next[axis]=Number(value);
     if(!applyPartOffset(model,id,next))return false;
     shell.palette.querySelector('[data-palette-key="'+key+'"]')?.focus({preventScroll:true});
     return true;
    },!!model.link);
   }
  }
  const addAction=(label,target)=>{
   if(!target)return;
   const button=document.createElement('button');button.type='button';button.textContent=label;button.disabled=target.disabled||!!model.link;
   button.onclick=()=>target.click();controls.append(button);
  };
  if(build){
   if(model.generator.typeId==='crystals'){
    addAction('Fit base for gumdrop',$('fitPixelBaseBtn'));
    addAction('Print a pixel fit test',$('calibrationBtn'));
    renderCrystalPixelPalette(controls,model);
   }else{
    renderPixelPalette(controls,model);
   }
  }else if(model.generator.typeId==='crystals'){
   for(const [key,label] of [['count','Crystal count'],['spacing','Crystal spacing'],['width','Cluster width']]){
    const original=document.querySelector('input[data-state="'+key+'"]');
    if(original)visualRange(controls,{key,label,min:original.min,max:original.max,step:original.step},original.value,value=>{
     original.value=value;original.dispatchEvent(new Event('input',{bubbles:true}));original.dispatchEvent(new Event('change',{bubbles:true}));
    },!!model.link);
   }
  }else{
   const parameters={...family.defaultParameters,...model.parameters};
   const gearKeys=()=>parameters.mode==='Mechanical'?['mode','teeth','module','pressureAngle','bore','thickness']:[
    'mode','wheelStyle','webStyle','reliefStyle','diameter','thickness','bore',
    ...(!['Cam','Pulley'].includes(parameters.wheelStyle)?['teeth']:[]),
    ...(parameters.webStyle==='Solid'?[]:['spokes']),
    ...(!['Solid','Legacy'].includes(parameters.webStyle)&&parameters.spokes?['rimWidth','webWidth','hub']:[]),
    ...(parameters.reliefStyle!=='None'?['reliefHeight']:[])
   ];
   const controlKeys=()=>{
    const style=parameters.controlStyle;
    return ['controlStyle','diameter','height',
     ...(['Rotary knob','Rotary selector'].includes(style)?['gripProfile','gripCount','gripDepth']:[]),
     ...(style==='Rotary knob'?['rotaryTop','rotaryMark']:[]),
     ...(['Thumb joystick','Toggle lever','Rocker','Fader cap','Directional pad'].includes(style)?['controlGrip']:[])
    ];
   };
   const characterKeys=()=>['character','construction','width','depth',...(parameters.construction==='Layered'?[
    ...(['Goat','Sheep','Boat'].includes(parameters.character)?['silhouettePose']:[]),'outlineRoundness','reliefFinish',
    ...(parameters.reliefFinish!=='Plain'?['reliefRise']:[])]:[])];
   const keys=({gears:gearKeys,'control-caps':controlKeys,characters:characterKeys}[family.typeId]?.()||family.visualFields)||{
    'tactile-tiles':['pattern','width','depth','relief','density','orientation'],
    waves:['flowStyle','amplitude','frequency','width'],
    'control-caps':['diameter','height','gripDepth'],
    characters:['character','width','depth'],
    'light-pods':['width','height','facets']
   }[family.typeId]||[];
   const apply=(key,value)=>{
    const open=[...panel.querySelectorAll('details')].map(group=>group.open);
    const next={...model.parameters,[key]:value};
    if(family.typeId==='gears'&&key==='webStyle'&&!['Solid','Legacy'].includes(value)&&!parameters.spokes)next.spokes=3;
    if(!commit({parameters:next}))return false;
    renderEditor();
    panel.querySelectorAll('details').forEach((group,index)=>{if(open[index])group.open=true;});
    shell.palette.querySelector('[data-palette-key="'+key+'"]')?.focus({preventScroll:true});
    return true;
   };
   for(const key of keys){
    const field=family.parameterSchema.find(item=>item.key===key);if(!field)continue;
    if(field.type==='number'){
     visualRange(controls,field,parameters[key],value=>apply(key,Number(value)),!!model.link);
    }else if(field.type==='select'){
     const group=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=field.label;group.append(legend);
     for(const option of field.options){
      const button=document.createElement('button');button.type='button';button.textContent=option;button.disabled=!!model.link;
      button.setAttribute('aria-pressed',String(parameters[key]===option));
      if(parameters[key]===option)button.dataset.paletteKey=key;
      button.onclick=()=>apply(key,option);group.append(button);
     }
     controls.append(group);
    }
   }
  }
  shell.searchSettings();
 }
 function visualRange(root,field,value,apply,disabled){
  const label=document.createElement('label'),caption=document.createElement('span'),out=document.createElement('output');
  caption.textContent=field.label;
  const input=document.createElement('input');input.type='range';input.dataset.paletteKey=field.key;
  for(const key of ['min','max','step'])input[key]=field[key]??.1;
  input.value=value;input.disabled=disabled;input.setAttribute('aria-label',field.label);
  const update=()=>{out.textContent=input.value+(field.unit?' '+field.unit:'');};
  input.oninput=update;
  input.onchange=()=>{if(apply(input.value)===false){input.value=value;update();}};
  update();label.append(caption,out,input);root.append(label);
 }
 function renderEditor(){
  if(mode!=='model'||!active())return;const model=active(),g=registry.get(model.generator.typeId);
  if(model.generator.typeId==='crystals'){panel.hidden=true;renderPalette();return;}
  panel.hidden=false;
  viewport.tabIndex=stage==='build'?0:-1;
  refreshPixelMarkers(model);
  $('footerStats').textContent=g.displayName;
  const update=availableLinkedUpdate(model,state.library);
  panel.innerHTML='<h2>'+esc(g.displayName)+'</h2><label>Name<input id="smsModelName" value="'+esc(model.name)+'"></label>'+
   '<div class="sms-actions">'+(stage==='design'?'<button id="smsBuild" class="primary">Next → Build</button>':'<button id="smsDesign">← Design</button><button id="smsSend" class="primary">Next → Queue for print</button>')+'</div>'+
   (model.link?'<p class="sms-descriptor">Linked to library revision '+model.link.revision+'.</p><button id="smsBreak">Make an independent variant</button>'+(update?'<button id="smsAccept">Accept library revision '+update.revision+'</button>':''):'')+
   '<div class="sms-actions"><button id="smsUndo">Undo</button><button id="smsRedo">Redo</button><button id="smsDuplicate">Duplicate</button><button id="smsSaveModel">Save to Library</button></div>'+
   (stage==='design'?'<label>Starting point<select id="smsPreset"><option value="">Choose a preset…</option>'+g.presets.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('')+'</select></label>'+designSections(g,model)+partEditor(model):
    (g.capabilities.supportsBase?details('Base and backing','Add a flat backing and set its thickness.','<label><input type="checkbox" data-build="base" '+(model.build.base?'checked':'')+'> Integrated flat base</label><label>Base thickness (mm)<input type="number" data-build="baseThickness" value="'+(model.build.baseThickness||3)+'" min="2" max="15"></label>'):'')+(g.capabilities.supportsMounting?details('Mounting holes','Choose plain or recessed fixing holes.','<label><input type="checkbox" data-build="mounting" '+(model.build.mounting?'checked':'')+'> Two mounting holes</label><label>Fixing profile<select data-build="mountStyle">'+['Through holes','Underside counterbores','Underside countersinks'].map(value=>'<option'+(model.build.mountStyle===value?' selected':'')+'>'+value+'</option>').join('')+'</select></label><label>Hole diameter (mm)<input type="number" data-build="holeDiameter" value="'+(model.build.holeDiameter||3.4)+'" min="2" max="8" step=".1"></label>'):'')+(g.capabilities.supportsLEDs?details('Lighting and cable access','Set the cavity and opening in Design.','<p>Use the Light and materials and Holes and fittings sections to size the cavity and cable exit.</p>'):'')+details('Pixel holes','Place and size holes to fit real pixels.',pixelBuilderMarkup(model,esc,fittingProfiles())))+
   '<div id="smsModelError" class="sms-descriptor" role="status"></div>';
  $('smsModelName').onchange=e=>commit({name:e.target.value.trim()||g.displayName});
  if($('smsDesign'))$('smsDesign').onclick=()=>{stage='design';renderTabs();renderEditor();};if($('smsBuild'))$('smsBuild').onclick=()=>{stage='build';renderTabs();renderEditor();};if($('smsSend'))$('smsSend').onclick=()=>send(model.id);
  $('smsDuplicate').onclick=()=>{const duplicate=duplicateModel(project,model.id);switchModel(duplicate.id);};$('smsSaveModel').onclick=()=>saveModel(model);
  $('smsUndo').onclick=()=>undo(-1);$('smsRedo').onclick=()=>undo(1);
  if($('smsBreak'))$('smsBreak').onclick=()=>{breakLink(project,model.id);renderEditor();save();};
  if($('smsAccept'))$('smsAccept').onclick=()=>{acceptLinkedUpdate(project,model.id,state.library,update.revision);showGeneric(model);renderEditor();save();};
  if($('smsPreset'))$('smsPreset').onchange=e=>{const preset=g.presets.find(p=>p.id===e.target.value);if(preset){commit({parameters:copy(preset.parameters)});renderEditor();}};
  panel.querySelectorAll('[data-model-param]').forEach(input=>input.oninput=()=>{
   const schema=g.parameterSchema.find(s=>s.key===input.dataset.modelParam),value=input.type==='checkbox'?input.checked:schema.type==='number'?Number(input.value):input.value;
   if(schema.key==='controlStyle'){
    const preset=g.presets.find(item=>item.parameters.controlStyle===value);
    if(preset)commit({parameters:{...preset.parameters,seed:model.parameters.seed,dualMaterial:model.parameters.dualMaterial}});
    renderEditor();
    return;
   }
   if(schema.key==='outline'&&g.typeId==='control-caps'){
    commit({parameters:{...model.parameters,outline:value}});
    renderEditor();
    return;
   }
   const accepted=commit({parameters:{...model.parameters,[schema.key]:value}});
   const current=model.parameters[schema.key]??schema.default;
   if(input.type==='checkbox')input.checked=!!current;else input.value=current;
   const output=panel.querySelector('[data-value-for="'+schema.key+'"]');
   if(output)output.textContent=current+' '+(schema.unit||'');
   if(accepted)renderPalette();
  });
  const coupon=$('smsPixelCoupon');
  if(coupon)coupon.onclick=()=>downloadPixelCoupon(model,
   pixelHoles(model).find(hole=>hole.id===selectedPixels.get(model.id))||newPixel(chosenProfile(model)),{},coupon);
  if($('smsPixelAdd'))bindPixelEditor(panel,model,pixelHoles(model),fittingProfiles());
  panel.querySelectorAll('[data-build]').forEach(input=>input.onchange=()=>commit({build:{...model.build,[input.dataset.build]:input.type==='checkbox'?input.checked:input.tagName==='SELECT'?input.value:Number(input.value)}}));
  bindPartEditor(model);
  editors.refresh();renderPalette();
 }
 function commit(changes,{history=true}={}){
  const model=active();if(model.link){$('smsModelError').textContent='Make an independent variant before editing.';return;}
  const old=copy(model);try{
   const generator=registry.get(model.generator.typeId),candidate={...model,...changes};
   if(candidate.generator.typeId!=='crystals')applyBuildModules(generator.recipe(candidate.parameters),candidate.build,generator.capabilities,{preview:true});
   if(history){let h=histories.get(model.id);if(!h){h={items:[{parameters:old.parameters,build:old.build}],index:0};histories.set(model.id,h);}h.items.splice(h.index+1);h.items.push({parameters:copy(candidate.parameters),build:copy(candidate.build)});h.index=h.items.length-1;}
   editModel(project,model.id,changes);showGeneric(model);renderTabs();save();if($('smsModelError'))$('smsModelError').textContent='Updated. Prepare again before exporting.';
   return true;
  }catch(error){if($('smsModelError'))$('smsModelError').textContent=error.message;}
 }
 function undo(delta){const h=histories.get(currentId),next=(h?.index??0)+delta;if(!h||next<0||next>=h.items.length)return;h.index=next;commit(copy(h.items[next]),{history:false});renderEditor();}
 function saveModel(model){
  try{if(model.generator.typeId==='crystals'){captureCrystal();model.thumbnail=thumbnail(adapter.previewGroup());}
   const record=state.library.find(r=>r.id===model.id);saveLibraryRevision(state.library,model,{expectedRevision:record?.versions.at(-1)?.revision||0});save();adapter.status('Saved '+model.name+' to your reusable library.');
  }catch(error){adapter.status(error.message);}
 }
 function showLibrary(){captureCrystal();mode='library';overlay.hidden=false;document.body.classList.add('sms-sidebar-mode');panel.hidden=false;
  panel.innerHTML='<h2>Library</h2><p class="sms-descriptor">Your models, starting points and complete projects.</p><label>Search<input id="smsSearch" value="'+esc(search)+'"></label><label>Model type<select id="smsFilter"><option value="all">All types</option>'+registry.list().map(g=>'<option value="'+g.typeId+'" '+(filter===g.typeId?'selected':'')+'>'+esc(g.displayName)+'</option>').join('')+'</select></label><button id="smsBrowseModels">Browse model starting points</button><button id="smsDemo">Open Wonder Trunks examples</button><button id="smsSaveProject">Save project to Library</button><button id="smsBackup">Download complete backup</button><label>Restore backup or old Crystal JSON<input id="smsImport" type="file" accept=".json"></label><p class="sms-descriptor">Connect your private GitHub repository in a Crystal model’s saved-project controls. Your token stays in memory.</p>';
  const syncActions=document.createElement('details');syncActions.innerHTML='<summary>Backups &amp; Recovery</summary>';syncActions.open=true;syncActions.insertAdjacentHTML('beforeend','<div class="sms-actions"><button id="smsCloudPush">Upload studio backup</button><button id="smsCloudPull">Check private backup</button></div><p id="smsSyncState" role="status">Saved locally</p><p>On another computer, connect the same private repository through a Crystal model’s saved-project controls. Check the backup, review the differences and choose what to recover. For offline recovery, download a complete backup and restore its JSON file.</p><div id="smsRecoveryList"></div>');panel.append(syncActions);
  syncActions.append($('smsBackup'),$('smsImport').parentElement);
  renderRecoveryList();
  recoveryStatus(adapter.vault()?.connected?'Private repository connected. Check the backup before recovering or uploading.':'Local only. Connect a private repository to use cross-device backup.');
  $('smsCloudPush').onclick=()=>syncStudio(false);$('smsCloudPull').onclick=()=>syncStudio(true);
  $('smsSearch').oninput=e=>{search=e.target.value;renderLibraryCards();};$('smsFilter').onchange=e=>{filter=e.target.value;renderLibraryCards();};
  $('smsBrowseModels').onclick=openPicker;$('smsDemo').onclick=demo;$('smsSaveProject').onclick=()=>{saveProjectSnapshot();save();renderLibraryCards();};$('smsBackup').onclick=backup;$('smsImport').onchange=importFile;
  const organise=document.createElement('section');
  organise.innerHTML='<h3>Organise Library</h3><div class="sms-actions"><button id="smsLibraryAll">All items</button><button id="smsFavourites">Favourites</button><button id="smsTemplates">Templates</button></div><label>Collections<select id="smsCollections"></select></label><div class="sms-actions"><button id="smsCollectionNew">Create collection</button><button id="smsCollectionRename">Rename collection</button><button id="smsCollectionDelete">Delete collection</button></div><p id="smsOrganisationStatus" role="status">Organisation is stored locally until you back up your workspace.</p>';
  panel.append(organise);
  $('smsLibraryAll').onclick=()=>{collectionFilter='';favouritesOnly=false;templatesOnly=false;renderLibraryCards();};
  $('smsFavourites').onclick=()=>{favouritesOnly=!favouritesOnly;templatesOnly=false;renderLibraryCards();};
  $('smsTemplates').onclick=()=>{templatesOnly=!templatesOnly;renderLibraryCards();};
  $('smsCollections').onchange=e=>{collectionFilter=e.target.value;templatesOnly=false;renderLibraryCards();};
  $('smsCollectionNew').onclick=()=>editCollection(false);
  $('smsCollectionRename').onclick=()=>editCollection(true);
  $('smsCollectionDelete').onclick=()=>{
   const collection=state.organisation.collections.find(c=>c.id===collectionFilter);
   if(!collection||!confirm('Delete collection “'+collection.name+'”? Its models, projects and templates stay in the Library.'))return;
   editOrganisation(next=>{
    next.collections=next.collections.filter(c=>c.id!==collection.id);
    for(const item of Object.values(next.items))item.collectionIds=item.collectionIds.filter(id=>id!==collection.id);
   },()=>{collectionFilter='';});
  };
  renderTabs();renderLibraryCards();
 }
 function editOrganisation(change,after=()=>{},redraw=true){
  try{
   const next=copy(state.organisation);change(next);
   const valid=readOrganisation(next);
   validateProject(project);
   localStorage.setItem(WORKSPACE_KEY,JSON.stringify({...state,organisation:valid}));
   state.organisation=valid;after();if(redraw)renderLibraryCards();
   $('smsOrganisationStatus').textContent='Saved locally.';
  }catch(error){$('smsOrganisationStatus').textContent=error.message;}
 }
 function editCollection(rename){
  const current=state.organisation.collections.find(c=>c.id===collectionFilter);
  if(rename&&!current)return;
  const input=prompt(rename?'Rename collection':'Name the new collection',rename?current.name:'');
  if(input===null)return;
  const id=rename?current.id:newId();
  editOrganisation(next=>{
   const name=organisationName(input);
   if(rename)next.collections.find(c=>c.id===id).name=name;
   else next.collections.push({id,name});
  },()=>{collectionFilter=id;templatesOnly=false;});
 }
 function organisationActions(actions,kind,id,revision){
  const key=kind+':'+id,item=state.organisation.items[key]||{favorite:false,collectionIds:[]};
  const update=(change,after,redraw)=>editOrganisation(next=>{
   const entry=next.items[key]||={favorite:false,collectionIds:[]};change(entry);
   if(!entry.favorite&&!entry.collectionIds.length)delete next.items[key];
  },after,redraw);
  const add=(name,handler)=>{
   const button=document.createElement('button');button.type='button';button.textContent=name;button.onclick=handler;actions.append(button);return button;
  };
  add(item.favorite?'★ Favourited':'☆ Favourite',()=>update(entry=>{entry.favorite=!entry.favorite;})).setAttribute('aria-pressed',String(item.favorite));
  const picker=document.createElement('details'),summary=document.createElement('summary');
  summary.textContent='Collections'+(item.collectionIds.length?' ('+item.collectionIds.length+')':'');picker.append(summary);
  for(const collection of state.organisation.collections){
   const label=document.createElement('label'),input=document.createElement('input');
   input.type='checkbox';input.checked=item.collectionIds.includes(collection.id);
   input.onchange=()=>update(entry=>{
    entry.collectionIds=input.checked?[...entry.collectionIds,collection.id]:entry.collectionIds.filter(cid=>cid!==collection.id);
   },()=>{
    const count=state.organisation.items[key]?.collectionIds.length||0;
    summary.textContent='Collections'+(count?' ('+count+')':'');
   },!input.checked&&collectionFilter===collection.id);
   label.append(input,' '+collection.name);picker.append(label);
  }
  if(!state.organisation.collections.length)picker.append('Create a collection to organise this item.');
  actions.append(picker);
  add('Save as reusable template',()=>{
   const input=prompt('Template name');if(input===null)return;
   editOrganisation(next=>next.templates.push({id:newId(),name:organisationName(input),kind,sourceId:id,...(kind==='model'?{revision}:{})}));
  });
 }
 function renderLibraryCards(){
  overlay.innerHTML='<h1>Your model library</h1><p>Closing a tab keeps its model here.</p><h2>In this project</h2><div id="smsProjectModels" class="sms-grid"></div><h2>Saved models</h2><div id="smsSavedModels" class="sms-grid"></div><h2>Saved projects</h2><div id="smsSavedProjects" class="sms-grid"></div>';
  const org=state.organisation;
  const select=$('smsCollections');
  select.replaceChildren(new Option('All collections',''),...org.collections.map(c=>new Option(c.name,c.id)));
  select.value=collectionFilter;
  for(const [id,pressed] of [['smsLibraryAll',!favouritesOnly&&!templatesOnly&&!collectionFilter],['smsFavourites',favouritesOnly],['smsTemplates',templatesOnly]])$(id).setAttribute('aria-pressed',String(pressed));
  $('smsCollectionRename').disabled=$('smsCollectionDelete').disabled=!collectionFilter;
  const includesItem=(kind,id)=>{
   const item=org.items[kind+':'+id];
   return (!favouritesOnly||item?.favorite)&&(!collectionFilter||item?.collectionIds.includes(collectionFilter));
  };
  if(templatesOnly){renderTemplates(org);return;}
  const matches=m=>(filter==='all'||m.generator.typeId===filter)&&(!search||m.name.toLowerCase().includes(search.toLowerCase()));
  function card(model,root,libraryRecord=null){
   const tile=document.createElement('article');tile.className='sms-tile';
   const generator=registry.list().find(g=>g.typeId===model.generator.typeId);
   const src=model.thumbnail||(generator?.recipe?recipeThumbnail(generator,model.parameters,model.build,[model.materials?.primary?.colour||0x88bbff,model.materials?.secondary?.colour||0xffcf70]):null);
   tile.dataset.modelTheme=model.generator.typeId;
   tile.innerHTML='<h3>'+esc(model.name)+'</h3><p class="sms-descriptor">'+esc(generator?.displayName||model.generator.typeId)+' · revision '+(libraryRecord?.versions.at(-1).revision||model.revision)+'</p><div class="sms-actions"></div>';
   tile.prepend(modelPicture(src));
   const actions=tile.querySelector('.sms-actions');
   const action=(name,fn)=>{const b=document.createElement('button');b.textContent=name;b.onclick=fn;actions.append(b);};
   if(!libraryRecord){action('Open',()=>switchModel(model.id));action('Save to library',()=>{saveModel(model);renderLibraryCards();});action('Duplicate',()=>{const m=duplicateModel(project,model.id);switchModel(m.id);});}
   else{
    action('Independent copy',()=>{const m=insertLibraryModel(project,state.library,libraryRecord.id);switchModel(m.id);});
    action('Linked copy',()=>{const m=insertLibraryModel(project,state.library,libraryRecord.id,{linked:true});switchModel(m.id);});
    organisationActions(actions,'model',libraryRecord.id,libraryRecord.versions.at(-1).revision);
    if(libraryRecord.versions.length>1)action('Older revision',()=>{const versions=libraryRecord.versions;const chosen=prompt('Revision to open ('+versions.map(v=>v.revision).join(', ')+')',String(versions.at(-2).revision));if(chosen){const m=insertLibraryModel(project,state.library,libraryRecord.id,{revision:Number(chosen)});switchModel(m.id);}});
   }
   action('Export editable JSON',()=>adapter.download(new Blob([JSON.stringify(model,null,2)],{type:'application/json'}),model.generator.typeId+'-model.json'));
   root.append(tile);
  }
  if(!favouritesOnly&&!collectionFilter)project.models.filter(matches).forEach(m=>card(m,$('smsProjectModels')));
  state.library.filter(r=>includesItem('model',r.id)&&matches(r.versions.at(-1).model)).forEach(r=>card(r.versions.at(-1).model,$('smsSavedModels'),r));
  for(const saved of state.savedProjects){
   if(!includesItem('project',saved.snapshotId)||!saved.title.toLowerCase().includes(search.toLowerCase())||
    (filter!=='all'&&!saved.models.some(model=>model.generator.typeId===filter)))continue;
   const tile=document.createElement('article');tile.className='sms-tile';
   const thumbnail=saved.models.find(model=>isModelThumbnail(model.thumbnail))?.thumbnail;
   const count=saved.models.length;
   tile.innerHTML='<h3>'+esc(saved.title)+'</h3><p class="sms-descriptor">'+count+' '+(count===1?'model':'models')+'</p><div class="sms-actions"><button type="button">Open project</button></div>';
   tile.prepend(modelPicture(thumbnail));
   const button=tile.querySelector('button');
   button.setAttribute('aria-label','Open project '+saved.title);
   button.onclick=()=>{
    if(!confirm('Open this saved project? Your current project will be kept as a saved copy.'))return;
    remember();saveProjectSnapshot();replaceProject(saved);
   };
   const rename=document.createElement('button');
   rename.type='button';rename.textContent='Rename';
   rename.setAttribute('aria-label','Rename saved project '+saved.title);
   const status=document.createElement('p');status.className='sms-descriptor';status.setAttribute('role','status');
   rename.onclick=()=>{
    const input=prompt('Rename saved project',saved.title);
    if(input===null)return;
    const title=input.trim();
    if(!title||Array.from(title).length>100){
     status.textContent='Enter a project name of 1 to 100 characters.';
     return;
    }
    status.textContent='';
    if(title===saved.title)return;
    saved.title=title;save();renderLibraryCards();
   };
   tile.querySelector('.sms-actions').append(rename);
   organisationActions(tile.querySelector('.sms-actions'),'project',saved.snapshotId);
   tile.append(status);
   $('smsSavedProjects').append(tile);
  }
  for(const id of ['smsProjectModels','smsSavedModels','smsSavedProjects'])if(!$(id).childElementCount)$(id).textContent='No matching items.';
 }
 function renderTemplates(org){
  overlay.replaceChildren();
  const heading=document.createElement('h1');heading.textContent='Reusable templates';overlay.append(heading);
  const grid=document.createElement('div');grid.className='sms-grid';overlay.append(grid);
  for(const template of org.templates){
   if(!template.name.toLowerCase().includes(search.toLowerCase()))continue;
   const source=template.kind==='model'
    ?state.library.find(record=>record.id===template.sourceId)?.versions.find(version=>version.revision===template.revision)?.model
    :state.savedProjects.find(saved=>saved.snapshotId===template.sourceId);
   if(filter!=='all'&&source&&!(source.models||[source]).some(model=>model.generator.typeId===filter))continue;
   const tile=document.createElement('article');tile.className='sms-tile';
   const title=document.createElement('h3');title.textContent=template.name;
   const status=document.createElement('p');
   status.textContent=source?(template.kind==='model'?'Model · revision '+template.revision:'Project template'):'Unavailable source';
   tile.append(modelPicture(source?.thumbnail||source?.models?.find(model=>isModelThumbnail(model.thumbnail))?.thumbnail),title,status);
   const controls=document.createElement('div');controls.className='sms-actions';tile.append(controls);
   const action=(name,handler)=>{
    const button=document.createElement('button');button.type='button';button.textContent=name;button.onclick=handler;controls.append(button);
   };
   if(source&&template.kind==='model')for(const [name,linked] of [['Independent copy',false],['Linked copy',true]])action(name,()=>{
    const model=insertLibraryModel(project,state.library,template.sourceId,{revision:template.revision,linked});switchModel(model.id);
   });
   if(source&&template.kind==='project')action('Create project from template',()=>{
    if(!confirm('Create a new project from this template? Your current project will be saved as a recoverable copy.'))return;
    try{
     const next=templateProject(source);captureCrystal();
     const saved=copy(project);saved.snapshotId=newId();
     const savedProjects=[...state.savedProjects,saved];
     localStorage.setItem(WORKSPACE_KEY,JSON.stringify({...state,savedProjects}));
     state.savedProjects=savedProjects;remember();replaceProject(next);
    }catch(error){$('smsOrganisationStatus').textContent=error.message;}
   });
   action('Remove template',()=>{if(confirm('Remove this template? Its source stays in the Library.'))editOrganisation(next=>{next.templates=next.templates.filter(t=>t.id!==template.id);});});
   grid.append(tile);
  }
  if(!grid.childElementCount)grid.textContent='No matching templates. Save a model or project as a reusable template to get started.';
 }
 function recoveryStatus(message){
  const node=$('smsSyncState');if(node)node.textContent=message;else adapter.status(message);
 }
 function renderRecoveryList(){
  const root=$('smsRecoveryList');if(!root)return;root.replaceChildren();
  const keys=Object.keys(localStorage).filter(key=>key.startsWith(RECOVERY_PREFIX)).sort().reverse().slice(0,3);
  for(const key of keys){
   const button=document.createElement('button');
   button.type='button';button.textContent='Review local snapshot · '+new Date(Number(key.slice(RECOVERY_PREFIX.length).split('-')[0])).toLocaleString();
   button.onclick=()=>{try{previewRecovery(JSON.parse(localStorage.getItem(key)),'Local recovery snapshot');}catch(error){recoveryStatus(error.message);}};
   root.append(button);
  }
 }
 function previewRecovery(remote,source,acknowledge=()=>{}){
  const summary=archiveSummary(state,remote);
  const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','Review backup');
  dialog.innerHTML='<h2>Review backup</h2><p data-source></p><div data-changes></div><label>Recover <select data-selection></select></label><label>Recovery strategy <select data-strategy><option value="keep">Keep local workspace</option><option value="copies">Import separate copies</option><option value="merge">Merge new items and copy conflicts</option></select></label><p>Recovered projects appear in the Library. The active project stays open.</p><p role="status"></p><div class="sms-actions"><button type="button" data-apply>Apply choice</button><button type="button" data-cancel>Cancel</button></div>';
  dialog.querySelector('[data-source]').textContent=source+' · '+summary.revisions+' Library revisions · '+summary.collections+' collections · '+summary.templates+' templates';
  const changes=dialog.querySelector('[data-changes]');
  for(const [group,record] of [['Library models',summary.models],['Projects',summary.projects]]){
   const title=document.createElement('h3');title.textContent=group;changes.append(title);
   for(const [label,names] of [['Local only',record.localOnly],['Backup only',record.remoteOnly],['Same ID, different content',record.conflicts]]){
    const row=document.createElement('p');row.textContent=label+' ('+names.length+')'+(names.length?' · '+names.slice(0,12).join(', '):'');changes.append(row);
   }
   const identical=document.createElement('p');identical.textContent='Identical · '+record.identical;changes.append(identical);
  }
  const selection=dialog.querySelector('[data-selection]'),strategy=dialog.querySelector('[data-strategy]');
  selection.append(new Option('Complete backup','all'),...archiveChoices(remote).map(item=>new Option(item.label,item.key)));
  const status=dialog.querySelector('[role=status]'),apply=dialog.querySelector('[data-apply]'),cancel=dialog.querySelector('[data-cancel]');
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  dialog.addEventListener('cancel',event=>{if(apply.disabled)event.preventDefault();});
  cancel.onclick=()=>dialog.close();
  apply.onclick=async()=>{
   if(strategy.value==='keep'){
    dialog.close();recoveryStatus('Backup reviewed. Local workspace kept. Merge the complete backup before uploading over an existing manifest.');return;
   }
   if(!confirm('Apply the selected recovery? A verified local snapshot will be saved first.'))return;
   apply.disabled=cancel.disabled=true;status.textContent='Preparing recovery preview…';
   try{
    const initial=JSON.stringify(state);
    const {candidate,importedModels,importedProjects}=await reconcileArchive(state,remote,{mode:strategy.value,selection:selection.value});
    if(JSON.stringify(state)!==initial)throw Error('Local work changed during recovery. Review the backup again.');
    const key=RECOVERY_PREFIX+Date.now()+'-'+newId();
    if(JSON.stringify(candidate)!==initial){
     commitRecovery(localStorage,state,candidate,key);
     clearTimeout(saveTimer);dirty=false;$('smsSaveState').textContent='Saved locally';
     for(const field of ['library','savedProjects','organisation','legacyTemplates'])state[field]=candidate[field];
    }
    if(selection.value==='all')acknowledge();
    dialog.close();if(mode==='library'){renderLibraryCards();renderRecoveryList();}
    recoveryStatus('Recovery complete · '+importedModels+' Library records · '+importedProjects+' projects added.');
   }catch(error){status.textContent=error.message;apply.disabled=cancel.disabled=false;}
  };
  document.body.append(dialog);dialog.showModal();
 }
 async function syncStudio(pull){
  const buttons=[$('smsCloudPush'),$('smsCloudPull')];buttons.forEach(button=>{if(button)button.disabled=true;});
  try{
   const client=adapter.vault();
   if(!client?.connected)throw Error('Local only. Connect a private repository in a Crystal model’s saved-project controls.');
   if(client!==vaultClient){vaultClient=client;studioVault=new StudioVault(client);}
   const connection=studioVault;
   if(pull){
    recoveryStatus('Checking and verifying the private backup…');
    const {state:remote,sha}=await connection.pull({acknowledge:false});
    if(mode!=='library'){recoveryStatus('Private backup verified. Return to the Library and check it again to review.');return;}
    previewRecovery(remote,'Private GitHub backup · manifest v1 · '+sha.slice(0,12),()=>{connection.sha=sha;});
    recoveryStatus('Backup verified. Review the differences before applying.');
   }else{
    if(!confirm('Upload this workspace to the connected private backup repository?'))return;
    captureCrystal();validateArchive(state);saveImmediately();
    recoveryStatus('Uploading immutable assets, then committing the manifest…');
    const result=await connection.push(state);
    recoveryStatus('Backup saved · '+result.uploaded+' new assets · manifest '+result.sha.slice(0,12));
   }
  }catch(error){recoveryStatus(error.message);}
  finally{buttons.forEach(button=>{if(button)button.disabled=false;});}
 }
 function enqueue(id){return project.printJobs.find(job=>job.modelId===id)||queueModel(project,id);}
 function send(id){captureCrystal();enqueue(id);save();showPrint();}
 function showPrint(){if(shell)printExpanded=false;captureCrystal();mode='print';overlay.hidden=false;document.body.classList.add('sms-sidebar-mode');panel.hidden=false;
  const model=active();
  quickPrintThumbnail=model?.thumbnail||(model?.generator.typeId==='crystals'?thumbnail(adapter.previewGroup()):null);
  panel.innerHTML='<h2>Print Centre</h2><p class="sms-descriptor">Project printer defaults for jobs without overrides.</p><label>Printer<select id="smsPrinter"><option>Ultimaker 3 Extended</option><option>Ultimaker 2+</option><option>Custom / other</option></select></label><label>Nozzle / AA core<select id="smsNozzle">'+[.25,.4,.6,.8].map(n=>'<option>'+n+'</option>').join('')+'</select></label><label>Material<select id="smsMaterial"><option>PLA</option><option>PETG</option></select></label><label>Quality<input id="smsQuality" type="number" min="0" max="100" value="'+project.printer.curaQuality+'"></label><p class="sms-descriptor">Dual material uses the UM3. Confirm both AA cores, materials, extruder assignments and layer support in Cura.</p><button id="smsCura">Download Cura settings</button><button id="smsPrepareAll">Prepare queued jobs</button><button id="smsPrintBackup">Save project and jobs</button><p id="smsPrintStatus" role="status"></p>';
  $('smsPrinter').value=project.printer.printer;$('smsNozzle').value=project.printer.curaNozzle;$('smsMaterial').value=project.printer.curaMaterial;
  for(const [id,key] of [['smsPrinter','printer'],['smsNozzle','curaNozzle'],['smsMaterial','curaMaterial'],['smsQuality','curaQuality']]){
   $(id).onchange=e=>{
    const input=e.target,old=project.printer[key];
    if(!input.value||!input.checkValidity()){input.reportValidity();input.value=old;return;}
    const before=project.printJobs.map(job=>effectivePrinter(job));
    project.printer[key]=printSettingValue(key,input.value);
    project.printJobs.forEach((job,index)=>invalidateIfChanged(job,before[index]));
    save();renderJobs();
   };
  }
  $('smsCura').onclick=()=>{try{const p=createCuraProfile(curaOptions(project.printer));adapter.download(new Blob([p.bytes]),p.filename);}catch(error){$('smsPrintStatus').textContent=error.message;}};
  $('smsPrepareAll').onclick=()=>{for(const job of project.printJobs.filter(j=>!currentPrintResult(j)&&j.status!=='preparing'))prepare(job.id);};$('smsPrintBackup').onclick=backup;
  renderTabs();renderJobs();
 }
 function curaOptions(p){return {machine:p.printer,nozzle:p.curaNozzle,material:p.curaMaterial,quality:p.curaQuality,intent:p.curaIntent||'balanced',qualityType:'auto'};}
 const printSettings=[
  ['printer','Printer',['Ultimaker 3 Extended','Ultimaker 2+','Custom / other']],
  ['curaNozzle','Nozzle (mm)',[.25,.4,.6,.8]],
  ['curaMaterial','Material',['PLA','PETG']],
  ['curaQuality','Quality (0–100)',null]
 ];
 function effectivePrinter(job){return resolveJobPrinter(project,findModel(project,job.modelId),job);}
 function printSettingValue(key,value){return ['curaNozzle','curaQuality'].includes(key)?Number(value):value;}
 function discardPrintResult(id){
  const worker=workers.get(id);workers.delete(id);worker?.terminate();prepared.delete(id);
 }
 function invalidateIfChanged(job,before){
  const after=effectivePrinter(job);
  if(Object.keys({...before,...after}).some(key=>before[key]!==after[key])){
   if(job.status!=='queued')invalidatePrintJob(job);
   delete job.progress;discardPrintResult(job.id);
  }
 }
 function currentPrintResult(job){
  return canExport(project,job.id)?prepared.get(job.id):undefined;
 }
 function printExportBlock(job,result,settings){
  if(!result){
   if(job.status==='preparing')return 'Preparation is in progress.';
   if(job.status==='failed')return 'Retry preparation before downloading.';
   if(job.status==='cancelled')return 'Preparation was cancelled. Retry to enable downloads.';
   if(job.status==='stale')return 'The previous preparation is stale. Prepare the current revision.';
   return 'Prepare this job to enable downloads.';
  }
  const model=findModel(project,job.modelId);
  const block=model?.generator.typeId==='crystals'&&lightPassageExportBlock(model.parameters.requireAccessiblePassages,result.report.lightPassageInspection);
  if(block)return block;
  if(result.bodies.length>1&&settings.printer!=='Ultimaker 3 Extended')
   return 'Choose Ultimaker 3 Extended for two materials, or switch the model to one material and prepare again.';
  return '';
 }
 function printEnvelope(result,settings){
  if(!result)return '';
  let size=printSizes.get(result);
  if(!size){
   const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const {mesh} of result.bodies){
   const points=mesh.vertProperties||mesh.points,stride=mesh.numProp||3;
   for(let i=0;i<points.length;i+=stride)for(let axis=0;axis<3;axis++){
    min[axis]=Math.min(min[axis],points[i+axis]);max[axis]=Math.max(max[axis],points[i+axis]);
   }
  }
   size=[0,2,1].map(axis=>max[axis]-min[axis]);printSizes.set(result,size);
  }
  const bed=settings.printer==='Ultimaker 2+'?[223,223,205]:settings.printer==='Ultimaker 3 Extended'?[215,215,300]:null;
  const warning=bed&&size.some((n,i)=>n>bed[i])?' — Warning: exceeds printer envelope. Check scale and orientation in Cura.':'';
  return size.map(n=>n.toFixed(1)).join(' × ')+' mm'+warning;
 }
 function renderJobs(){
  if(mode!=='print')return;
  const focused=document.activeElement,focusJob=focused?.closest('[data-print-job]')?.dataset.printJob;
  const focusControl=focused?.getAttributeNames().find(name=>name.startsWith('data-job-'));
  overlay.innerHTML=(shell?'<h1>Quick Print</h1><div id="smsPrintCurrent" class="sms-tile"></div><div class="sms-actions"><button id="smsExpandPrint" aria-expanded="'+printExpanded+'">'+(printExpanded?'Show current model only':'Add more models')+'</button></div>':'<h1>Print jobs</h1>')+'<div id="smsPrintModels" class="sms-actions"></div><div id="smsJobs" class="sms-grid"></div>';
  if(shell){
   const model=active(),card=$('smsPrintCurrent');
   if(model){
    const name=document.createElement('strong');name.textContent=model.name;
    card.append(modelPicture(quickPrintThumbnail),name);
    if(!project.printJobs.some(job=>job.modelId===model.id)){
     const start=document.createElement('button');start.textContent='Prepare current model';
     start.onclick=()=>prepare(enqueue(model.id).id);card.append(start);
    }
   }
   $('smsExpandPrint').onclick=()=>{printExpanded=!printExpanded;renderJobs();$('smsExpandPrint').focus();};
   $('smsPrepareAll').hidden=!printExpanded;
  }
  if(!shell||printExpanded)for(const model of project.models.filter(item=>!project.printJobs.some(job=>job.modelId===item.id))){
   const button=document.createElement('button');button.textContent='Add '+model.name;
   button.onclick=()=>{enqueue(model.id);save();renderJobs();};$('smsPrintModels').append(button);
  }
  for(const [index,job] of project.printJobs.entries()){
   if(shell&&!printExpanded&&job.modelId!==currentId)continue;
   const model=findModel(project,job.modelId),tile=document.createElement('article');
   tile.className='sms-tile';tile.dataset.printJob=job.id;
   const result=currentPrintResult(job),settings=effectivePrinter(job),block=printExportBlock(job,result,settings);
   const preparing=job.status==='preparing';
   const state=job.status[0].toUpperCase()+job.status.slice(1);
   const family=registry.get(model.generator.typeId)?.displayName||model.generator.typeId;
   const advisory=settings.printer==='Custom / other'?'Custom printer: enter settings manually in Cura.':
    settings.printer==='Ultimaker 3 Extended'&&settings.curaNozzle===.6?'UM3 has no standard AA 0.6 mm core. Select a supported core for a Cura profile.':'';
   tile.innerHTML='<h3>'+esc(model.name)+'</h3><p>'+esc(family)+' · source revision '+model.revision+
    (result?' · prepared revision '+job.preparedRevision:'')+'</p><p><strong>'+state+'</strong></p>'+
    '<p role="status" data-job-progress>'+esc(job.error||(preparing?job.progress:'')||'')+'</p>'+
    '<p class="sms-descriptor">'+esc(printEnvelope(result,settings))+'</p><p>'+esc(block||'Downloads available.')+'</p>'+
    (advisory?'<p>'+esc(advisory)+'</p>':'')+
    '<fieldset><legend>Job printer settings</legend><p class="sms-descriptor">Job overrides take precedence over model settings and project defaults.</p>'+
    printSettings.map(([key,label,options])=>{
     const own=Object.hasOwn(job.overrides||{},key),modelOwn=Object.hasOwn(model.printerOverrides||{},key);
     const input=options?'<select data-job-setting="'+key+'">'+[...new Set([...options,settings[key]])].map(v=>'<option>'+esc(v)+'</option>').join('')+'</select>':
      '<input data-job-setting="'+key+'" type="number" min="0" max="100" required>';
     return '<label>'+label+' · '+(own?'job override':modelOwn?'model setting':'project default')+input+'</label>';
    }).join('')+'<button data-job-reset>Use project defaults</button></fieldset>'+
    '<div class="sms-actions"><button data-job-up>Move up</button><button data-job-down>Move down</button>'+
    '<button data-job-prepare>'+(preparing?'Preparing…':['failed','cancelled'].includes(job.status)?'Retry':'Prepare')+'</button>'+
    '<button data-job-cancel>Cancel</button><button data-job-export>Download production ZIP</button><button data-job-3mf>Download 3MF</button><button data-job-remove>Remove</button></div>';
   tile.prepend(modelPicture(model.thumbnail||(model.id===currentId?quickPrintThumbnail:null)));
   const action=(name,disabled,run)=>{
    const button=tile.querySelector('[data-job-'+name+']');button.disabled=disabled;button.onclick=run;
   };
   for(const input of tile.querySelectorAll('[data-job-setting]')){
    const key=input.dataset.jobSetting;input.value=settings[key];
    input.onchange=()=>{
     if(!input.value||!input.checkValidity()){input.reportValidity();input.value=settings[key];return;}
     job.overrides={...job.overrides,[key]:printSettingValue(key,input.value)};
     invalidateIfChanged(job,settings);save();renderJobs();
    };
   }
   action('reset',!Object.keys(job.overrides||{}).length,()=>{
    job.overrides={};invalidateIfChanged(job,settings);save();renderJobs();
   });
   for(const [name,offset] of [['up',-1],['down',1]])
    action(name,index+offset<0||index+offset>=project.printJobs.length,()=>{if(movePrintJob(project,job.id,offset)){save();renderJobs();}});
   action('prepare',preparing,()=>prepare(job.id));
   action('cancel',!preparing,()=>{
    cancelPreparation(project,job.id);delete job.progress;discardPrintResult(job.id);save();renderJobs();
   });
   action('remove',false,()=>{
    cancelPreparation(project,job.id);discardPrintResult(job.id);
    project.printJobs=project.printJobs.filter(item=>item.id!==job.id);save();renderJobs();
   });
   action('export',!!block,()=>exportJob(job.id,false));
   action('3mf',!!block,()=>exportJob(job.id,true));
   $('smsJobs').append(tile);
   if(focusJob===job.id&&focusControl){
    const control=focusControl==='data-job-setting'?tile.querySelector('[data-job-setting="'+focused.dataset.jobSetting+'"]'):tile.querySelector('['+focusControl+']');
    control?.focus({preventScroll:true});
   }
  }
 }
 function prepare(id){
  const job=project.printJobs.find(item=>item.id===id);
  if(!job||job.status==='preparing'||workers.has(id))return;
  const ticket=beginPreparation(project,id);
  delete job.progress;prepared.delete(id);
  const redraw=()=>{save();renderJobs();renderTabs();};
  let worker;
  try{
   worker=new Worker(new URL('./studio-model-worker.js',import.meta.url),{type:'module'});
   workers.set(id,worker);
   const current=()=>workers.get(id)===worker&&job.requestId===ticket.requestId;
   const finish=(error,result)=>{
    if(!current())return;
    if(finishPreparation(project,ticket,{error})&&result)prepared.set(id,result);
    workers.delete(id);worker.terminate();delete job.progress;redraw();
   };
   worker.onmessage=({data})=>{
    if(!current()||data.ticket?.requestId!==ticket.requestId)return;
    if(data.type==='progress'){
     job.progress=data.stage;
     if(mode==='print'){
      const tile=[...$('smsJobs').children].find(card=>card.dataset.printJob===id);
      if(tile)tile.querySelector('[data-job-progress]').textContent=data.stage;
     }
    }else if(data.type==='complete'&&data.prepared?.bodies?.length)finish(null,data.prepared);
    else finish(data.message||'The worker did not return a prepared mesh.');
   };
   worker.onerror=event=>{event.preventDefault();finish(event.message||'Preparation worker failed.');};
   worker.onmessageerror=()=>finish('The preparation worker returned an unreadable result.');
   worker.postMessage({ticket});
  }catch(error){
   finishPreparation(project,ticket,{error:error.message});discardPrintResult(id);
  }
  redraw();
 }
 function printDownloadStem(model,job){
  const slug=model.name.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase()
   .replace(/[^a-z0-9]+/g,'-').slice(0,48).replace(/^-|-$/g,'')||'model';
  // Hash the whole ID so imported IDs with shared prefixes still get different suffixes.
  let suffix=0xcbf29ce484222325n;
  for(const byte of new TextEncoder().encode(job.id))suffix=BigInt.asUintN(64,(suffix^BigInt(byte))*0x100000001b3n);
  return slug+'-rev'+model.revision+'-'+suffix.toString(16).padStart(16,'0');
 }
 function exportJob(id,only3MF){
  try{
   const job=project.printJobs.find(j=>j.id===id);
   if(!job)throw Error('This print job was removed.');
   const model=findModel(project,job.modelId),result=currentPrintResult(job),settings=effectivePrinter(job);
   const block=printExportBlock(job,result,settings);if(block)throw Error(block);
   const exported=exportMaterialBodies(result,{name:model.name});
   const stem=printDownloadStem(model,job);
   if(only3MF){adapter.download(new Blob([exported.threeMF],{type:'model/3mf'}),stem+'.3mf');return;}
   const entries=exported.stls.map(s=>[s.name,s.bytes]);entries.push([exported.filename,exported.threeMF],['editable-model.json',JSON.stringify(model,null,2)],['material-roles.json',JSON.stringify(exported.assignments,null,2)],['print-report.json',JSON.stringify(result.report,null,2)]);
   entries.push(...lightPassageReportEntries(result.report.lightPassageInspection));
   let curaProfile='included';
   try{
    const profile=createCuraProfile(curaOptions(settings));
    entries.push([profile.filename,profile.bytes],['cura-manual-settings.txt',profile.fallbackText]);
   }catch(error){
    curaProfile='manual-review';
    entries.push(['cura-manual-review.txt',error.message+'\nJob settings: '+JSON.stringify(curaOptions(settings),null,2)]);
   }
   const manifestName='print-job-manifest.json';
   const manifest={
    schemaVersion:1,modelId:model.id,modelName:model.name,generatorType:model.generator.typeId,
    modelRevision:model.revision,jobId:job.id,preparedRevision:job.preparedRevision,
    printer:settings.printer,nozzleMm:settings.curaNozzle,material:settings.curaMaterial,quality:settings.curaQuality,
    curaProfile,...(result.report.nativeRouting?{routing:result.report.nativeRouting}:{}),files:[...entries.map(([name])=>name),'READ-ME.txt',manifestName]
   };
   const instructions=[
    'Model: '+model.name,'Revision: '+model.revision,'Job ID: '+job.id,
    'Printer: '+manifest.printer,'Nozzle: '+manifest.nozzleMm+' mm',
    'Material: '+manifest.material,'Quality: '+manifest.quality+' / 100','',
    exported.warnings.join('\n'),
    'The STL files share one origin. Import them together as parts, not independently auto-arranged objects.','',
    'In Cura, select the matching printer, nozzle or core, and material before importing the model.',
    curaProfile==='included'
     ?'Import the included Cura profile or use cura-manual-settings.txt to enter the settings manually.'
     :'See cura-manual-review.txt for the job settings and the reason a Cura profile was unavailable.',
    'For multiple materials, check each part’s extruder assignment and the installed cores.',
    'Inspect orientation, supports and every layer in installed Cura. Confirm physical fit and optics with a test print.'
   ].join('\n');
   entries.push(['READ-ME.txt',instructions],[manifestName,JSON.stringify(manifest,null,2)]);
   adapter.download(new Blob([zipProfileEntries(entries)],{type:'application/zip'}),stem+'.zip');
  }catch(error){adapter.status(error.message);if($('smsPrintStatus'))$('smsPrintStatus').textContent=error.message;}
 }
 function backup(){captureCrystal();adapter.download(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),'wonder-trunks-studio-backup.json');}
 function replaceProject(saved){
  for(const worker of workers.values())worker.terminate();workers.clear();prepared.clear();
  for(const c of cache.values())if(c.group)disposeGroup(c.group);else adapter.release(c);cache.clear();
  currentId=null;Object.assign(project,copy(saved));delete project.snapshotId;for(const job of project.printJobs){job.status='stale';job.requestId=null;job.preparedRevision=null;}
  $('smsProjectTitle').value=project.title;switchModel(project.activeTab||project.models[0]?.id);save();
 }
 async function importFile(event){
  const file=event.target.files[0];if(!file)return;event.target.value='';
  try{
   if(file.size>32*1024*1024)throw Error('Choose a JSON backup smaller than 32 MB.');
   const data=JSON.parse(await file.text());
   if(data?.schemaVersion===1&&data.project){
    previewRecovery({...data,savedProjects:data.savedProjects||[],library:data.library||[]},'JSON workspace backup');
    return;
   }
   let model;
   if(data?.schemaVersion===1&&data.generator)model=data;
   else if(data?.settings&&Array.isArray(data.crystals))model=createModel({
    name:data.settings.title||file.name,typeId:'crystals',parameters:data.settings,editableState:{crystals:data.crystals,selectedId:null}
   });
   else throw Error('Choose a supported Studio backup, model JSON or legacy Crystal project.');
   const recoveryProject=copy(project);
   recoveryProject.id=model.id;recoveryProject.title=model.name;
   recoveryProject.models=[model];recoveryProject.tabs=[model.id];recoveryProject.activeTab=model.id;recoveryProject.printJobs=[];
   previewRecovery({schemaVersion:1,project:recoveryProject,savedProjects:[],library:[]},'Editable model JSON');
  }catch(error){recoveryStatus('Could not read backup. '+error.message);}
 }
 function demo(){
  const entries=[['tactile-tiles','Grass tile',{pattern:'grass'}],['characters','Goat silhouette',{character:'Goat'}],['tactile-tiles','Wool tile',{pattern:'wool'}],['waves','Thawmor river',{}],['tactile-tiles','River ripple tile',{pattern:'river'}],['light-pods','River light pod',{}],['crystals','McDigger crystal mine',null],['tactile-tiles','Mineral tile',{pattern:'mineral'}],['light-pods','Faceted pebble',{facets:12}],['gears','Weather cog',{}],['control-caps','Weather button',{}],['tactile-tiles','Raindrop tile',{pattern:'rain',dualMaterial:true}]];
  for(const [type,name,p] of entries)add(type,p,name);project.title='The Snowsmith — Wonder Trunks';$('smsProjectTitle').value=project.title;save();showLibrary();
 }
 document.addEventListener('click',e=>{
  const button=e.target.closest('[data-tab]');if(!button)return;
  queueMicrotask(()=>{renderTabs();if(active()?.generator.typeId==='crystals')renderPalette();});
  if(button.dataset.tab==='print'){e.preventDefault();e.stopImmediatePropagation();showPrint();}
  else if(active()?.generator.typeId!=='crystals'){e.preventDefault();e.stopImmediatePropagation();stage=button.dataset.tab;mode='model';overlay.hidden=true;renderTabs();renderEditor();}
  else if(mode!=='model'){mode='model';overlay.hidden=true;document.body.classList.remove('sms-sidebar-mode');panel.hidden=true;renderTabs();}
 },true);
 document.addEventListener('keydown',e=>{
  if(e.target.closest('input,textarea,select,[contenteditable]'))return;
  if(active()?.link&&['g','r','s','Delete','Backspace'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();adapter.status('Make an independent variant before editing this pinned model.');return;}
  if(active()?.generator.typeId!=='crystals'&&(e.ctrlKey||e.metaKey)&&['z','y'].includes(e.key.toLowerCase())){e.preventDefault();e.stopImmediatePropagation();undo(e.key.toLowerCase()==='y'||e.shiftKey?1:-1);}
 },true);
 $('saveBtn').onclick=backup;
 // Preserve the established Crystal Open workflow; studio backups have their
 // own explicit import control in Library.
 const crystalTools=document.createElement('div');crystalTools.className='sms-actions';
 crystalTools.innerHTML='<button id="smsSaveCrystal">Save model to Library</button><button id="smsSendCrystal">Send model to Print Centre</button><button id="smsIndependentCrystal" hidden>Make independent to edit</button>';
 document.querySelector('.left').append(crystalTools);
 $('smsSaveCrystal').onclick=()=>saveModel(active());$('smsSendCrystal').onclick=()=>send(currentId);
 $('smsIndependentCrystal').onclick=()=>{breakLink(project,currentId);setCrystalReadonly(false);save();};
 function setCrystalReadonly(enabled){
  for(const section of document.querySelectorAll('.left>[data-workspace],.right'))section.inert=enabled;
  $('smsIndependentCrystal').hidden=!enabled;
 }
 const initial=project.activeTab||project.tabs[0];currentId=initial;
 if(findModel(project,initial).generator.typeId==='crystals'){
  switching=true;adapter.activate(findModel(project,initial),null);switching=false;renderTabs();
 }else{currentId=null;adapter.detach();switchModel(initial);}
 for(const job of project.printJobs)if(['preparing','prepared'].includes(job.status)){job.status='stale';job.requestId=null;job.preparedRevision=null;}
 if(shell)showHome();
 save();
 window.__sensoryStudio={project,registry,get currentModel(){return active();},get mode(){return mode;},switchModel,addModel:add,showLibrary,showPrint,send,prepare,saveImmediately,pixelMarkerScreen:id=>{const marker=pixelMarkers(active()).find(item=>item.userData.pixelId===id);return marker?projectMarker(marker):null;},get cacheSize(){return cache.size;},get metrics(){return {previewBuilds,geometries:renderer.info.memory.geometries,activeWorkers:workers.size};}};
 return {onCrystalChange:captureCrystal,backup};
}
