import {listProjectFolders} from './studio-project-index.js';
import {libraryCard} from './src/ui/library-card.mjs';
import {createModelDrawer,createPreviewQueue} from './src/ui/model-drawer.mjs';
import {archiveSummary,archiveChoices,reconcileArchive,commitRecovery,RECOVERY_PREFIX,validateArchive,assertWorkspaceVersion,projectWorkspaceCandidate} from './studio-sync-plan.js';
import {readMeshFile,importedMeshRecipe,MAX_MESH_BYTES} from './studio-mesh-import.js';
import {parseSvgArtwork,createSvgImport,MAX_SVG_BYTES} from './svg-import/index.js';
import {readOrganisation,organisationName,ensureSnapshotIds,templateProject} from './studio-organisation.js';
import {createLightInspector} from './studio-light-inspector.js';
import {lightPassageExportBlock,lightPassageReportEntries} from './light-passage-inspection.js';
import {renderPixelProfileDiagram} from './pixel-profile-diagram.js';
import {applyPixelFittingProfile,resolvePixelFitting,withMeasuredPixelFit,saveablePixelFit} from './studio-pixel-fit.js';
import {GEAR_TOP_PRESETS,TOP_PROFILES,TOP_SURFACES,TOP_JOINS,newGearTopControl,gearTopPlacementIssue,gearTopSafeHost,findGearTopStart} from './studio-gear-top-controls.js';
import {pixelBuilderMarkup,pixelHoleMarkup,bindPixelBuilder,pixelProfiles,stablePixels,findPixelPosition,checkedPixelBore,newPixel} from './studio-pixel-builder.js';
import {stableMounts,newMount,mountHoleIssue,mountProfiles,manualMountProfiles,blindMountProfile,recessDimensions,MAX_NATIVE_MOUNTS,patternMountIssues} from './studio-mount-builder.js';
import {mountPatternEditor} from './mounting-pattern-editor.js';
import {mountPatternViewport} from './mounting-pattern-viewport.js';
import {createModel,addModel,findModel,openTab,closeTab,reorderTabs,duplicateModel,editModel,
 queueModel,beginPreparation,finishPreparation,cancelPreparation,canExport,resolveJobPrinter,movePrintJob,invalidatePrintJob,saveLibraryRevision,
 insertLibraryModel,availableLinkedUpdate,acceptLinkedUpdate,breakLink,modelFingerprint,validateProject,WORKSPACE_KEY,newId} from './studio-documents.js';
import {makeCatalogue,applyBuildModules,generators} from './studio-catalogue.js';
import {normaliseEdgeFinish,EDGE_FINISH_DEFAULTS} from './studio-edge-finish.js';
import {previewRecipe,disposeGroup,nativeFittingPreviews,prepareRecipe} from './studio-geometry.js';
import {loadManifold} from './fabrication-v1.js';
import {exportMaterialBodies,preparedDimensionsMm} from './studio-material-export.js';
import {installExactValueEditors} from './exact-value-editors.js';
import {renderPrecisionRange} from './native-precision-controls.js';
import {createToolFinder} from './studio-tool-finder.js';
import {createCuraProfile,zipProfileEntries,curaFallbackText,calculateCuraSettings} from './cura-profiles.js';
import {StudioVault} from './studio-vault.js';
import {profileReferencedInModel} from './studio-profile-safety.js';
import {crystalStartingPoints,crystalStartingPointPreview} from './studio-crystal-presets.js';
const copy=x=>JSON.parse(JSON.stringify(x));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
const isUndersidePixel=hole=>hole.surface?hole.surface.normal?.[1]<=-.9999:hole.entryFace==='underside';
export function installSensoryStudio({THREE,scene,camera,orbit,renderer,bootstrap,adapter}){
 const state=bootstrap,project=state.project;
 let savedWorkspace=localStorage.getItem(WORKSPACE_KEY);
 function writeWorkspace(workspace){
  const serialized=JSON.stringify(workspace);
  assertWorkspaceVersion(localStorage,savedWorkspace);
  localStorage.setItem(WORKSPACE_KEY,serialized);
  savedWorkspace=serialized;
 }
 delete project.snapshotId; // Snapshot identity belongs only to the saved Library copy.
 renderer.localClippingEnabled=true;
 const unified=new URLSearchParams(location.search).get('layout')!=='legacy';
 let printExpanded=false;
 const printSizes=new WeakMap();
 state.savedProjects??=[];
 ensureSnapshotIds(state.savedProjects);
 // Mirror the full measured library into Studio archives, without truncation.
 state.pixelProfiles=copy(adapter.pixelFitProfiles?.()||state.pixelProfiles||[]);
 state.organisation=readOrganisation(state.organisation);
 let collectionFilter='',favouritesOnly=false,templatesOnly=false;
 project.printer={printer:'Ultimaker 3 Extended',curaNozzle:.4,curaMaterial:'PLA',curaQuality:60,curaIntent:'balanced',...project.printer};
 const crystalAdapter={typeId:'crystals',typeVersion:1,displayName:'Crystal Clusters',category:'Lighting',defaultParameters:adapter.formationDefaults(),
  parameterSchema:[],presets:crystalStartingPoints(adapter.formationDefaults()),capabilities:{supportsBase:true,supportsLEDs:true,supportsMounting:true,supportsTactileSurfaces:false,supportsMechanisms:false,supportsDualMaterial:false,supportsPartSplitting:true},
  validateParameters:p=>({valid:!!p,errors:[],parameters:p}),generatePreview:()=>adapter.capture(),
  generateManufacturingGeometry:()=>adapter.capture(),estimateBounds:()=>adapter.bounds(),migrateParameters:(_,p)=>p};
 const registry=makeCatalogue(crystalAdapter),cache=new Map(),histories=new Map(),prepared=new Map(),workers=new Map();
 const nativeFitPreviewChoices=new Map(),nativeFitPreviewMessages=new Map();
 let currentId=null,mode='model',stage='design',switching=false,saveTimer=null,dirty=false,search='',filter='all',studioVault=null,vaultClient=null,previewBuilds=0;
 let buildWorkspace='build',openingBuildWorkspace=false;
 const link=document.createElement('link');link.rel='stylesheet';link.href='./sensory-studio.css';document.head.append(link);
 const bar=document.createElement('nav');bar.className='studio-modelbar';bar.setAttribute('aria-label','Project and model workspaces');
 bar.innerHTML='<input id="smsProjectTitle" class="sms-project-input project-title" aria-label="Project name"><button id="smsLibrary">Library</button><div id="smsTabs" class="studio-modeltabs" role="tablist" aria-label="Open models"></div><button id="smsNew" aria-label="Add a model">＋ New model</button><button id="smsPrint">Print Centre</button><button id="smsReload" title="Save your project and load the latest published Studio">↻ Reload Studio</button><span id="smsSaveState" role="status"></span>';
 document.querySelector('.topbar').before(bar);
 const modelDimensions=document.createElement('output');
 modelDimensions.id='smsModelDimensions';
 modelDimensions.setAttribute('aria-label','Model dimensions in export orientation');
 modelDimensions.hidden=true;
 bar.append(modelDimensions);
 const panel=document.createElement('div');panel.id='smsEditor';panel.className='sms-controls';panel.hidden=true;document.querySelector('.left').prepend(panel);
 const overlay=document.createElement('div');overlay.className='sms-overlay';overlay.hidden=true;overlay.id='smsOverlay';document.querySelector('.viewarea').style.position='relative';document.querySelector('.viewarea').append(overlay);
 const newModelControl=$('smsNew');
 const shell=unified?setupShell():null;
 const savedPreviewQueue=createPreviewQueue(renderSavedPreview);
 const modelDrawer=shell?createModelDrawer(document.querySelector('.viewarea'),{
  getProject:()=>project,select:switchModel,close:closeModel,newControl:newModelControl,
  rename:renameDrawerModel,info:showModelInfo,previewQueue:savedPreviewQueue,
  reorder:ids=>{reorderTabs(project,ids);renderTabs();save();},
  previewKey:(owner,row)=>savedPreviewKey(owner.id,findModel(owner,row.id))
 }):null;
 if(modelDrawer){
  modelDrawer.root.id='smsModelsDrawer';
  modelDrawer.grid.id='smsTabs';
  const drawerResize=new ResizeObserver(()=>{
   overlay.style.setProperty('--library-drawer-height',modelDrawer.root.getBoundingClientRect().height+'px');
  });
  drawerResize.observe(modelDrawer.root);
  const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='./src/ui/model-drawer.css';document.head.append(stylesheet);
 }
 const inspection=shell?createLightInspector({THREE,scene,camera,
  prepare:modelId=>{if(active()?.id===modelId)captureCrystal();prepare(enqueue(modelId).id);},
  cancel:modelId=>{const job=project.printJobs.find(item=>item.modelId===modelId);if(job?.status==='preparing'){cancelPreparation(project,job.id);delete job.progress;discardPrintResult(job.id);save();renderJobs();renderTabs();}}}):null;
 const renderActualModel=inspection?document.createElement('button'):null;
 if(inspection){
  renderActualModel.type='button';
  renderActualModel.className='primary sms-render-model';
  renderActualModel.textContent='Render actual model';
  renderActualModel.dataset.featureInspect='';
  renderActualModel.hidden=true;
  renderActualModel.onclick=()=>inspection.openManufacturingMesh();
  document.querySelector('.viewarea .vcolumn').append(renderActualModel);
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
  // Left-hand search indexes ACTIONS, not only parameter labels.
  // Preserve existing physically validated coupon exporter, saved profile and
  // per-model print preparation instead of maintaining duplicate download logic.
  const focusControl=selectors=>{
    for(const selector of selectors){
     for(const element of document.querySelectorAll(selector)){
      if(element.closest('[hidden],[inert]')||element.matches(':disabled'))continue;
      const opened=[];
      for(let node=element.parentElement;node;node=node.parentElement){
       if(node.tagName==='DETAILS'&&!node.open){node.open=true;opened.push(node);}
      }
      if(!element.getClientRects().length){for(const section of opened)section.open=false;continue;}
      if(!element.matches('button,input,select,summary,[tabindex]'))element.tabIndex=-1;
      element.scrollIntoView({block:'nearest'});
      element.focus({preventScroll:true});
      if(document.activeElement===element)return true;
     }
    }
    return false;
  };
  const focusAfterNavigation=selectors=>requestAnimationFrame(()=>focusControl(selectors));
  const chooseTool=action=>{
   const model=active();
   if(!model){showHome();return;}
   if(action==='coupon'){
    if(model.generator.typeId==='crystals'){
     const button=$('calibrationBtn');
     if(button)button.click();
    }else{
     const fitting=pixelHoles(model).find(hole=>hole.id===selectedPixels.get(model.id))||newPixel(chosenProfile(model));
     downloadPixelCoupon(model,fitting,{},null);
    }
    return;
   }
   if(action==='cura'||action==='export'||action==='manufacturing'){
    showPrint();
    focusAfterNavigation(action==='cura'?['#smsCura']:
     action==='manufacturing'?['#smsJobs [data-job-prepare]','#smsPrepareAll']:
      ['#smsJobs [data-job-export]','#smsPrintCurrent']);
    return;
   }
   openBuildWorkspace(action==='mounts'?'mounting':action==='pixels'?'pixels':'wiring');
   focusAfterNavigation(action==='pixels'?
    ['.sms-palette [data-pixel-profile-editor]','.sms-palette [data-fit-profile]','.sms-palette [data-fit-print]','#placePixelBtn']:
    action==='mounts'?
    ['.sms-palette [data-new-mount-profile]','.sms-palette [data-place-mount]','.sms-palette [data-select-mount]','#mountType','#mountPlacement','[data-state="mount"]']:
    ['#wireRouteStatus','.sms-palette [data-native-route]','#wireSpacingPreset']);
  };
  const modelAvailability=item=>{
   const model=active();
   if(!model&&!item.noModel)return 'Open a model to use this tool.';
   if(model?.link&&(item.editing||item.routing))return 'Make an independent variant to edit this linked model.';
   if(item.id==='pixel-shoulders'&&model?.generator.typeId!=='crystals'){
    const hole=pixelHoles(model).find(hole=>hole.id===selectedPixels.get(model.id));
    if(!hole?.socketProfile||!isUndersidePixel(hole))
     return 'Select a shaped underside socket in Pixels, or place one on the underside.';
   }
   if(item.id==='wire-channel'&&model?.generator.typeId!=='crystals'&&!model?.build.serialRouting?.enabled)
    return cache.get(model?.id)?.routing?.reason||'';
   return '';
  };
  const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
  const openSearchResult=async item=>{
   const reason=modelAvailability(item);
   if(!active()&&!item.noModel)return reason;
   const crystal=active()?.generator.typeId==='crystals';
   if(item.workspace==='Print Centre')showPrint();
   else if(item.workspace==='Library')showLibrary();
   else openBuildWorkspace(item.workspace.toLowerCase());
   const selector=crystal&&item.crystal?item.crystal:item.control;
   if(view.smsPrecision.collapsed&&[selector,item.panel,item.crystalSetup].some(target=>target&&precision.region.querySelector(target))){
    view.smsPrecision.collapsed=false;applyPanels();
   }
   search.value='';searchSettings();
   if(crystal&&item.advanced&&!document.body.classList.contains('advanced'))$('advancedBtn').click();
   await nextFrame();
   if(item.panel&&!reason){
    const sections=[...document.querySelectorAll(item.panel)];
    const section=sections.find(node=>!node.closest('[hidden],[inert]')&&node.getClientRects().length)||
     sections.find(node=>!node.closest('[hidden],[inert]'));
    if(section){
     focusControl([item.panel+' > summary']);
     section.open=true;
     await nextFrame();
     await nextFrame();
    }
   }
   if(!reason&&focusControl([selector]))return '';
   if(!reason&&crystal&&item.crystalSetup&&focusControl([item.crystalSetup]))return item.setupMessage;
   if(item.prepare&&focusControl(['#smsPrintCurrent [data-prepare-current]','#smsJobs [data-job-prepare]']))
    return 'Prepare the current model to enable '+item.label+'.';
   const nav=Array.from(document.querySelectorAll('.workspace-tabs button')).find(button=>button.textContent===item.workspace);
   nav?.focus();
   return reason||'This control is unavailable for the current model or settings.';
  };
  const finder=createToolFinder(openSearchResult,modelAvailability);
  tools.body.prepend(finder);
  const searchSettings=()=>{
   const query=search.value.trim().toLowerCase();
   for(const item of precision.body.querySelectorAll('.sms-panel-details,.collapsible-section')){
    item.toggleAttribute('data-filtered',!!query&&!item.textContent.toLowerCase().includes(query));
    if(query&&!item.hasAttribute('data-filtered')&&item.tagName==='DETAILS')item.open=true;
   }
  };
  search.oninput=searchSettings;
  const styleNav=document.querySelector('.workspace-tabs'),top=document.querySelector('.topbar');
  home.setAttribute('aria-label','Home');
  styleNav.prepend(home,$('smsLibrary'));styleNav.setAttribute('aria-label','Workspaces');
  const print=styleNav.querySelector('[data-tab=print]');
  for(const [destination,label] of [['pixels','Pixels'],['wiring','Wiring'],['mounting','Mounting']]){
   const control=button(label,()=>openBuildWorkspace(destination));
   control.dataset.workspace=destination;
   print.before(control);
  }
  top.after(styleNav);styleNav.classList.add('sms-workspace-nav');styleNav.append(modelDimensions);
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
  layout.prepend(tools.region,grips[0],centre,grips[1],precision.region);
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
  return {palette,home,searchSettings,search,focus,chooseTool,focusAfterNavigation};
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
   button.append(preset?presetPicture(family,preset):startingPointPicture(family),label);
   button.onclick=()=>{
    picker.close();
    if(!shell){add(family.typeId,preset?.parameters,preset?.name);return;}
    requestModelName('Name new model',preset?.name||family.displayName,name=>add(family.typeId,preset?.parameters,name));
   };
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
   for(const family of registry.list())if(!['svg-artwork','imported-mesh'].includes(family.typeId))appendCard(family,null);
   const artwork=document.createElement('button');artwork.type='button';artwork.textContent='Import SVG';
   artwork.onclick=()=>{picker.close();openSvgImport();};grid.append(artwork);
   const mesh=document.createElement('button');mesh.type='button';mesh.textContent='Import 3D model';
   mesh.onclick=()=>{picker.close();openMeshImport();};grid.append(mesh);
  }
 }
 function openSvgImport(){
  const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','Import SVG artwork');
  dialog.innerHTML='<h2>Import SVG artwork</h2><label>Local SVG file <input type="file" accept=".svg,image/svg+xml"></label><figure data-artwork-preview></figure><label>Width (mm) <input type="number" min=".5" max="500" step="any" value="60" data-width></label><label>Extrusion depth (mm) <input type="number" min=".5" max="500" step="any" value="5" data-depth></label><p role="status" aria-live="polite"></p><div class="sms-actions"><button type="button" data-import disabled>Create artwork model</button><button type="button" data-cancel>Cancel</button></div>';
  const fileInput=dialog.querySelector('[type=file]'),width=dialog.querySelector('[data-width]'),depth=dialog.querySelector('[data-depth]');
  const status=dialog.querySelector('[role=status]'),preview=dialog.querySelector('figure'),commit=dialog.querySelector('[data-import]');
  let artwork=null,record=null,version=0;
  const inspect=()=>{
   record=null;commit.disabled=true;
   if(!artwork)return;
   try{
    record=createSvgImport(artwork,{widthMm:width.valueAsNumber,depthMm:depth.valueAsNumber});
    const size=record.dimensions;
    status.textContent=[size.widthMm,size.heightMm,size.depthMm].map(n=>n.toFixed(2)).join(' × ')+' mm. '+artwork.warnings.join(' ');
    commit.disabled=false;
   }catch(error){status.textContent=error.message;}
  };
  fileInput.onchange=async()=>{
   const request=++version,file=fileInput.files[0];
   artwork=null;record=null;commit.disabled=true;preview.replaceChildren();status.textContent='';
   if(!file)return;
   try{
    if(file.size>MAX_SVG_BYTES)throw Error('SVG is larger than 256 KiB. Simplify the artwork and try again.');
    status.textContent='Reading local artwork…';
    const parsed=await parseSvgArtwork(await file.text(),{name:file.name});
    if(request!==version||!dialog.open)return;
    artwork=parsed;
    const d=artwork.source.dimensions;
    if(Number.isFinite(d?.widthMm)&&d.widthMm>=.5&&d.widthMm<=500)width.value=d.widthMm;
    const {minX,minY,width:w,height:h}=artwork.bounds;
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');
    svg.setAttribute('viewBox',[minX,minY,w,h].join(' '));svg.setAttribute('width','240');svg.setAttribute('height','160');
    svg.setAttribute('role','img');svg.setAttribute('aria-label','Filled artwork preview');
    path.setAttribute('fill','currentColor');path.setAttribute('fill-rule','evenodd');
    path.setAttribute('d',artwork.loops.map(loop=>'M '+loop.points.map(point=>point.join(' ')).join(' L ')+' Z').join(' '));
    svg.append(path);preview.append(svg);inspect();
   }catch(error){if(request===version&&dialog.open)status.textContent=error.message;}
  };
  width.oninput=depth.oninput=inspect;
  commit.onclick=()=>{
   if(!record)return;
   const name=record.source.name.replace(/\.svg$/i,'')||'Imported artwork';
   try{add('svg-artwork',{artwork:record},name);dialog.close();}catch(error){status.textContent=error.message;}
  };
  dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{version++;dialog.remove();},{once:true});
  document.body.append(dialog);dialog.showModal();
 }
 function openMeshImport(){
  const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','Import 3D model');
  dialog.innerHTML='<h2>Import STL or OBJ</h2><label>Local mesh file <input type="file" accept=".stl,.obj"></label><label>Source units <select name="unit"><option value="">Choose units</option><option>mm</option><option>cm</option><option>in</option></select></label><label>Source up-axis <select name="up"><option>Z</option><option>Y</option></select></label><label>Scale <input name="scale" type="number" min=".001" max="100" step="any" value="1"></label><label>Bed rotation (degrees) <input name="rotation" type="number" min="-180" max="180" step="1" value="0"></label><label>Bed X (mm) <input name="x" type="number" min="-250" max="250" step="any" value="0"></label><label>Bed Y (mm) <input name="z" type="number" min="-250" max="250" step="any" value="0"></label><figure></figure><p role="status" aria-live="polite"></p><div class="sms-actions"><button type="button" data-create disabled>Add model</button><button type="button" data-cancel>Cancel</button></div>';
  const input=dialog.querySelector('[type=file]'),status=dialog.querySelector('[role=status]');
  const figure=dialog.querySelector('figure'),commit=dialog.querySelector('[data-create]');
  let source=null,parameters=null,sequence=0;
  const inspect=()=>{
   figure.replaceChildren();parameters=null;commit.disabled=true;
   if(!source)return;
   try{
    for(const field of dialog.querySelectorAll('input[type=number]'))if(!field.checkValidity()||!Number.isFinite(field.valueAsNumber))throw Error('Check scale, rotation and bed position.');
    const next=Object.fromEntries([...dialog.querySelectorAll('[name]')].map(field=>[field.name,field.type==='number'?field.valueAsNumber:field.value]));
    if(!next.unit)throw Error('Confirm the units used by this mesh.');
    const recipe=importedMeshRecipe(source,{...next,previewOnly:true});
    const {width,height,depth}=recipe.bounds;
    status.textContent=[width,depth,height].map(n=>n.toFixed(2)).join(' × ')+' mm. '+(recipe.meshIssue?'Preview only: '+recipe.meshIssue:'Closed mesh. Prepare a print job for final Manifold validation.');
    const {points,triangles}=recipe.positive[0].mesh;
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');
    const span=Math.max(20,width+2*Math.abs(next.x),depth+2*Math.abs(next.z))*1.05;
    svg.setAttribute('viewBox',[-span/2,-span/2,span,span].join(' '));svg.setAttribute('width','220');svg.setAttribute('height','160');
    svg.setAttribute('role','img');svg.setAttribute('aria-label','Top view of mesh on the print bed');
    const faces=[],stride=Math.max(1,Math.ceil(triangles.length/900))*3;
    for(let i=0;i<triangles.length;i+=stride){
     const corners=triangles.slice(i,i+3).map(id=>[points[id*3],points[id*3+2]].join(' '));
     faces.push('M '+corners.join(' L ')+' Z');
    }
    path.setAttribute('d',faces.join(' '));path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width',span/500);
    svg.append(path);figure.append(svg);
    parameters={...next,source};commit.disabled=false;commit.textContent=recipe.meshIssue?'Add preview-only model':'Add model';
   }catch(error){status.textContent=error.message;}
  };
  input.onchange=async()=>{
   const request=++sequence,file=input.files[0];source=null;inspect();status.textContent='';
   if(!file)return;
   try{
    if(file.size>MAX_MESH_BYTES)throw Error('Choose an STL or OBJ smaller than 4 MiB.');
    const data=await file.arrayBuffer();if(request!==sequence||!dialog.open)return;
    source=readMeshFile(file.name,data);
    dialog.querySelector('[name=up]').value=source.format==='obj'?'Y':'Z';inspect();
   }catch(error){if(request===sequence&&dialog.open)status.textContent=error.message;}
  };
  for(const field of dialog.querySelectorAll('[name]'))field.oninput=inspect;
  commit.onclick=()=>{
   if(!parameters)return;
   try{add('imported-mesh',parameters,source.name.replace(/\.(stl|obj)$/i,'')||'Imported model');dialog.close();}
   catch(error){status.textContent=error.message;}
  };
  dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{sequence++;dialog.remove();},{once:true});
  document.body.append(dialog);dialog.showModal();
 }
 const snapshot=adapter.capture();
 if(!project.models.length)addModel(project,createModel({name:snapshot.settings.title||'Crystal Mine',typeId:'crystals',parameters:snapshot.settings,editableState:{crystals:snapshot.crystals,selectedId:snapshot.selectedId}}));
 if(!project.tabs.length)openTab(project,project.models[0].id);
 $('smsProjectTitle').value=project.title;
 $('smsProjectTitle').onchange=()=>{project.title=$('smsProjectTitle').value.trim()||'Untitled project';modelDrawer?.update();save();};
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
   try{validateProject(project);writeWorkspace(state);dirty=false;$('smsSaveState').textContent='Saved locally';}
   catch(error){$('smsSaveState').textContent='Save failed — download a backup';adapter.status('Your work is still in memory. '+error.message);}
  },120);
 }
 function saveImmediately(){clearTimeout(saveTimer);validateProject(project);writeWorkspace(state);dirty=false;}
 window.addEventListener('beforeunload',event=>{try{if(dirty)saveImmediately();}catch{event.preventDefault();event.returnValue='';}});
 function remember({capture=true}={}){
  if(!currentId)return;const model=active();
  if(model.generator.typeId==='crystals'){
   if(capture)captureCrystal();
   cache.set(currentId,{...adapter.detach(),kind:'crystals',fingerprint:modelFingerprint(model)});
  }else{
   const c=cache.get(currentId);if(c?.group)c.group.removeFromParent();if(c)c.view={camera:camera.position.toArray(),target:orbit.target.toArray()};
  }
 }
 function switchModel(id){
  if(id===currentId&&mode==='model'){renderEditor();return;}
  cancelPixelGesture();endPixelPlacement();editors.cancel();remember();switching=true;
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
   const group=previewRecipe(THREE,recipe,[model.materials.primary?.colour||0x88bbff,model.materials.secondary?.colour||0xffcf70]);previewBuilds++;c={kind:'generic',group,fingerprint,view:c?.view,routing:recipe.nativeRouting,recipe};cache.set(model.id,c);
   if(!shell)model.thumbnail=thumbnail(group);
   if(recipe.edgeFinish?.enabled)refreshChamferPreview(model,c);
  }
  scene.add(c.group);
  if(c.view){camera.position.fromArray(c.view.camera);orbit.target.fromArray(c.view.target);camera.lookAt(orbit.target);}
  else frame(c.group);
  adapter.status(c.chamferStatus||'Ready — '+generator.displayName+'. Preview is editable geometry; prepare the print job before exporting.');
  refreshNativeFittingPreview(model);
 }
 async function refreshChamferPreview(model,c){
  const report=message=>{
   c.chamferStatus=message;
   if(active()?.id===model.id&&mode==='model')adapter.status(message);
  };
  report('Preparing the chamfer preview…');
  try{
   const wasm=await loadManifold();
   if(cache.get(model.id)!==c)return;
   const generator=registry.get(model.generator.typeId);
   const recipe=applyBuildModules(generator.recipe(model.parameters),model.build,generator.capabilities);
   const result=prepareRecipe(THREE,wasm,recipe);
   const surfaces=result.bodies.map(({role,mesh})=>{
    const colour=role==='primary'?(model.materials.primary?.colour||0x88bbff):(model.materials.secondary?.colour||0xffcf70);
    const surface=new THREE.Mesh(nativeFitMesh(mesh),new THREE.MeshStandardMaterial({color:colour,roughness:.55}));
    surface.userData.materialRole=role;
    surface.userData.chamferPreview=true;
    return surface;
   });
   for(const child of c.group.children)if(child.isMesh&&!child.userData.previewOnly)child.visible=false;
   c.group.add(...surfaces);
   if(!shell)model.thumbnail=thumbnail(c.group);
   report(result.report.warnings.find(message=>/^(No top rim|Some top rims|Top chamfer skipped)/.test(message))||'Showing prepared chamfer geometry.');
  }catch(error){
   if(cache.get(model.id)===c)report('Chamfer preview unavailable. '+error.message);
  }
 }
 // Build-only physical overlays derive their solids from the exact same
 // Manifold cutter and placement transform as the manufacturing worker.
 // They are excluded from picking, saved state and all exported geometry.
 function nativeFitMesh(mesh){
  const vertices=mesh.vertProperties||mesh.points,triangles=mesh.triVerts||mesh.triangles,stride=mesh.numProp||3;
  if(!vertices?.length||!triangles?.length||stride<3)throw Error('No valid physical fitting preview geometry.');
  const positions=new Float32Array(triangles.length*3);
  for(let i=0;i<triangles.length;i++){
   const offset=triangles[i]*stride;
   for(let axis=0;axis<3;axis++)positions[i*3+axis]=vertices[offset+axis];
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.computeVertexNormals();
  return geometry;
 }
 function refreshNativeFittingPreview(model){
  if(model?.generator.typeId==='crystals')return;
  const c=cache.get(model.id);
  if(!c?.group||!c.recipe)return;
  const enabled=stage==='build'&&nativeFitPreviewChoices.get(model.id)===true;
  const token=c.fingerprint+':'+(enabled?'on':'off');
  if(c.fitToken===token)return;
  c.fitToken=token;
  for(const overlay of c.group.children.filter(child=>child.userData.nativeFittingPreview)){
   c.group.remove(overlay);overlay.geometry?.dispose();overlay.material?.dispose();
  }
  nativeFitPreviewMessages.set(model.id,enabled?'Preparing physical fitting preview…':'');
  const report=message=>{
   nativeFitPreviewMessages.set(model.id,message);
   if(active()?.id===model.id)for(const output of document.querySelectorAll('[data-native-fit-preview-status]'))
    output.textContent=message;
  };
  if(!enabled){report('');return;}
  (async()=>{
   try{
    const wasm=await loadManifold();
    if(cache.get(model.id)!==c||c.fitToken!==token)return;
    const results=nativeFittingPreviews(THREE,wasm,c.recipe);
    if(cache.get(model.id)!==c||c.fitToken!==token)return;
    const messages=[];
    for(const [index,fit] of results.entries()){
     for(const [kind,shape,color,opacity] of [
      ['negative',fit.negative,0x46beff,.16],
      ['positive',fit.positive,(fit.collisionVolume>.01||fit.warnings.length)?0xff6161:0xffdc58,.42]
     ]){
      const overlay=new THREE.Mesh(nativeFitMesh(shape),new THREE.MeshBasicMaterial({
       color,opacity,transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide
      }));
      overlay.userData.nativeFittingPreview=kind;
      overlay.userData.previewOnly=true;
      overlay.name='native-fitting-'+kind+'-'+fit.pixelId;
      overlay.renderOrder=kind==='positive'?96:95;
      c.group.add(overlay);
     }
     messages.push('P'+(index+1)+' · insertion '+fit.insertionDepth.toFixed(2)+' mm · nominal cutter roof allowance '+fit.nominalRoofAllowance.toFixed(2)+' mm · '+fit.exposedVolume.toFixed(2)+' mm³ outside stock · '+fit.collisionVolume.toFixed(2)+' mm³ stock interference; '+fit.wireOverlap.toFixed(2)+' mm³ overlap with wire cuts · '+fit.missingStockVolume.toFixed(2)+' mm³ missing from required surrounding stock',...fit.warnings);
    }
    report(messages.join(' | ')||'Select a measured shaped socket to preview its physical fit.');
   }catch(error){if(cache.get(model.id)===c&&c.fitToken===token)report('Physical fitting preview unavailable: '+error.message);}
  })();
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
 function startingPointPicture(family){
  const key=family.typeId+':default';
  if(!presetThumbnails.has(key))presetThumbnails.set(key,family.typeId==='crystals'?
   crystalPresetThumbnail(family.defaultParameters):recipeThumbnail(family,family.defaultParameters));
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
 function savedPreviewKey(projectId,model){
  return JSON.stringify(['saved-design-v1',projectId,model.id,model.revision,model.link,modelFingerprint(model)]);
 }
 function renderSavedPreview({model,revision}){
  if(!model||model.revision!==revision)throw Error('Model changed. Retry preview.');
  const generator=registry.get(model.generator.typeId);
  if(!generator)throw Error('This model source is unsupported.');
  let group;
  try{
   if(model.generator.typeId==='crystals'){
    const crystals=model.editableState?.crystals;
    if(!Array.isArray(crystals)||!crystals.length)throw Error('Saved Crystal geometry is missing.');
    group=crystalStartingPointPreview(THREE,{...generator.defaultParameters,...model.parameters},crystals);
   }else{
    const recipe=applyBuildModules(generator.recipe(model.parameters),model.build,generator.capabilities,{preview:true});
    group=previewRecipe(THREE,recipe,[model.materials?.primary?.colour||0x88bbff,model.materials?.secondary?.colour||0xffcf70]);
   }
   const src=thumbnail(group);
   if(!src)throw Error('3D preview could not render. Retry when graphics are available.');
   return {src};
  }finally{if(group)disposeGroup(group);}
 }
 function savedModelPicture(model,ownerId,{allowRetry=true}={}){
  const root=document.createElement('div');
  root.className='sms-saved-preview';
  const status=modelPicture(null),retry=document.createElement('button');
  status.textContent='Preview pending';retry.type='button';retry.textContent='Retry preview';retry.hidden=true;
  root.append(status);
  if(allowRetry)root.append(retry);
  const load=async()=>{
   retry.hidden=true;status.textContent='Loading preview';
   try{
    const revision=model.revision,key=savedPreviewKey(ownerId,model);
    const current=()=>root.isConnected&&model.revision===revision;
    const result=await savedPreviewQueue.request(key,{model,revision},current);
    if(!current())return;
    if(!result)throw Error('Preview deferred. Retry when ready.');
    const img=modelPicture(result.src);
    img.onerror=()=>{savedPreviewQueue.invalidate(key);img.replaceWith(status);status.textContent='Preview image invalid';retry.hidden=false;};
    status.replaceWith(img);
   }catch(error){if(root.isConnected){status.hidden=false;status.textContent=error.message||'Preview unavailable';retry.hidden=false;}}
  };
  retry.onclick=load;
  let observer;
  if(typeof IntersectionObserver==='function'){
   observer=new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();load();}
   });
   observer.observe(root);
  }else setTimeout(load,0);
  return root;
 }
 function renameDrawerModel(id){
  const model=findModel(project,id);
  if(model.link){adapter.status('Make an independent variant before renaming a linked model.');return;}
  requestModelName('Rename model',model.name,name=>{editModel(project,id,{name});renderTabs();save();},
   ()=>document.getElementById('model-tab-'+id));
 }
 function requestModelName(title,suggestion,accept,focusAfter=()=>newModelControl){
  const dialog=document.createElement('dialog'),form=document.createElement('form');
  dialog.dataset.modelNaming='';
  const heading=document.createElement('h2');heading.textContent=title;
  const label=document.createElement('label');label.textContent='Model name ';
  const input=document.createElement('input');input.required=true;input.maxLength=100;input.value=suggestion;
  const create=document.createElement('button');create.textContent=title==='Rename model'?'Save name':'Create model';
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';cancel.onclick=()=>dialog.close();
  input.oninput=()=>input.setCustomValidity('');
  form.onsubmit=event=>{
   event.preventDefault();
   const name=input.value.trim();
   if(!name){input.setCustomValidity('Enter a model name.');input.reportValidity();return;}
   accept(name);dialog.close();
  };
  label.append(input);form.append(heading,label,create,cancel);dialog.append(form);
  dialog.setAttribute('aria-label',title);document.body.append(dialog);
  dialog.addEventListener('close',()=>{
   dialog.remove();
   if(document.activeElement===document.body)focusAfter()?.focus({preventScroll:true});
  },{once:true});
  dialog.showModal();input.select();
 }
 function showModelInfo(id,preview){
  const model=findModel(project,id),dialog=document.createElement('dialog');
  const profileIds=new Set([model.build.activePixelProfileId,
   ...((model.build.pixelHoles||[]).flatMap(hole=>[hole.profileId,hole.socketProfile?.id]))]);
  if(model.generator.typeId==='crystals'){
   profileIds.add(model.parameters.pixelProfileId);
   for(const hole of model.parameters.manualPixelHoles||[])profileIds.add(hole.profileId);
  }
  const names=new Map(fittingProfiles().map(profile=>[profile.id,profile.name]));
  const pixelProfiles=[...profileIds].filter(Boolean).map(id=>names.get(id)||id);
  const fields={
   Project:project.title,Family:registry.get(model.generator.typeId)?.displayName||model.generator.typeId,
   Source:model.link?'Linked model '+model.link.sourceId+' · revision '+model.link.revision:'Independent model · revision '+model.revision,
   Created:model.createdAt,Modified:model.updatedAt,
   'Pixel profiles':pixelProfiles.join(', ')||'No explicit profile dependencies',
   Printer:model.printerOverrides?.printer||project.printer?.printer||'Project default',
   'Preview status':preview
  };
  const title=document.createElement('h2');title.textContent=model.name||'Unnamed model';
  const list=document.createElement('dl');
  for(const [label,value] of Object.entries(fields)){
   const term=document.createElement('dt'),description=document.createElement('dd');
   term.textContent=label;description.textContent=value||'Unknown';list.append(term,description);
  }
  const close=document.createElement('button');close.type='button';close.textContent='Close model information';close.onclick=()=>dialog.close();
  dialog.setAttribute('aria-label','Model information');dialog.append(title,list,close);document.body.append(dialog);
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();close.focus();
 }
 const isModelThumbnail=src=>typeof src==='string'&&/^data:image\/(png|jpeg|webp);base64,/.test(src);
 function modelPicture(src){
  if(isModelThumbnail(src)){
   const img=document.createElement('img');img.alt='';img.src=src;img.loading='lazy';img.decoding='async';return img;
  }
  const placeholder=document.createElement('span');placeholder.className='sms-picture-empty';placeholder.textContent='Preview unavailable';return placeholder;
 }
 function updateModelDimensions(model,printResult){
  modelDimensions.hidden=true;
  if(!model)return;
  let dimensions;
  if(printResult)dimensions=preparedSize(printResult);
  else if(model.generator.typeId==='crystals'){
   const {width,depth,height}=adapter.bounds();
   dimensions=[width,depth,height];
  }else{
   const meshes=fittingMeshes(model),bounds=new THREE.Box3();
   for(const mesh of meshes)bounds.expandByObject(mesh);
   if(bounds.isEmpty())return;
   const size=bounds.getSize(new THREE.Vector3());
   dimensions=[size.x,size.z,size.y];
  }
  if(!dimensions.every(n=>Number.isFinite(n)&&n>0))return;
  modelDimensions.textContent=(printResult?'Prepared':'Design preview')+' X × Y × Z: '+
   dimensions.map(value=>value.toFixed(1)).join(' × ')+' mm';
  modelDimensions.hidden=false;
 }
 function renderTabs(){
  if((placementModel||mountingModel)&&(!canEditPixels(active())||(placementModel&&placementModel!==active()?.id)||(mountingModel&&mountingModel!==active()?.id)))endPixelPlacement();
  for(const job of project.printJobs)if(job.status==='stale')discardPrintResult(job.id);
  if(inspection){
   if(!inspection.root.isConnected)$('smsPrecisionContent').prepend(inspection.root);
   const model=active(),job=project.printJobs.find(item=>item.modelId===currentId);
   const type=model?.generator.typeId;
   const supported=mode==='model'&&!!model;
   const build=type==='crystals'?document.querySelector('.workspace-tabs [data-tab=build]').classList.contains('active'):stage==='build';
   renderActualModel.hidden=!(supported&&build);
   const printResult=supported&&job?currentPrintResult(job):undefined;
   inspection.update(supported?currentId:null,printResult,supported?job?.status:undefined,type,supported?job?.error:undefined);
   updateModelDimensions(supported?model:null,printResult);
  }
  if(shell){const history=histories.get(currentId),crystal=active()?.generator.typeId==='crystals';const blocked=mode!=='model'||!!active()?.link;$('smsGlobalUndo').disabled=blocked||!(crystal?adapter.canUndo(-1):history?.index>0);$('smsGlobalRedo').disabled=blocked||!(crystal?adapter.canUndo(1):history?.index<history?.items.length-1);document.body.dataset.studioView=mode;for(const [control,view] of [[shell.home,'home'],[$('smsLibrary'),'library']]){if(mode===view)control.setAttribute('aria-current','step');else control.removeAttribute('aria-current');}if(mode!=='model'&&document.body.classList.contains('sms-focused'))shell.focus.click();}
  const type=mode==='model'?active()?.generator.typeId:null;
  document.body.dataset.modelTheme=type||'workspace';
  document.body.classList.add('sms-workspace');
  for(const button of document.querySelectorAll('.workspace-tabs [data-tab]')){
   const step=button.dataset.tab;
   button.textContent=shell?{design:'Design',build:'Build',print:'Print Centre'}[step]:{design:'1 · Design',build:'2 · Build',print:'3 · Print Centre'}[step];
   const selected=mode==='print'?step==='print':mode==='model'&&!(step==='build'&&buildWorkspace!=='build')&&step===(type==='crystals'?document.querySelector('.workspace-tabs [data-tab].active')?.dataset.tab:stage);
   if(selected)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
  }
  for(const control of document.querySelectorAll('.workspace-tabs [data-workspace]')){
   if(mode==='model'&&stage==='build'&&control.dataset.workspace===buildWorkspace)control.setAttribute('aria-current','step');
   else control.removeAttribute('aria-current');
  }
  if(modelDrawer){
   if(modelDrawer.root.dataset.mode!==mode&&mode!=='model'&&modelDrawer.open)modelDrawer.setOpen(false,false);
   modelDrawer.root.dataset.mode=mode;
   modelDrawer.update();
   return;
  }
  const root=$('smsTabs');root.replaceChildren();
  for(const id of project.tabs){const model=findModel(project,id),button=document.createElement('button');button.role='tab';button.dataset.modelTheme=model.generator.typeId;button.id='model-tab-'+id;button.setAttribute('aria-selected',String(currentId===id&&mode==='model'));button.tabIndex=currentId===id?0:-1;
   button.textContent=model.name+(project.printJobs.some(j=>j.modelId===id&&j.status==='preparing')?' ⏳':'');button.draggable=true;
   button.setAttribute('aria-label',model.name);
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
 function control(schema,p,family){
  const key=esc(schema.key),label=esc(schema.label||schema.key),value=p[schema.key];
  const helpScope=' data-model-family="'+esc(family)+'"';
  if(schema.type==='select')return '<label>'+label+'<select data-model-param="'+key+'"'+helpScope+'>'+schema.options.map(o=>'<option '+(o===value?'selected':'')+'>'+esc(o)+'</option>').join('')+'</select></label>';
  if(schema.type==='boolean')return '<label><input type="checkbox" data-model-param="'+key+'"'+helpScope+' '+(value?'checked':'')+'> '+label+'</label>';
  return '<div class="sms-model-control"><label>'+label+'<output data-value-for="'+key+'">'+esc(value)+' '+esc(schema.unit||'')+'</output></label><input type="range" data-model-param="'+key+'"'+helpScope+' min="'+schema.min+'" max="'+schema.max+'" step="'+(schema.step||.1)+'" value="'+value+'"></div>';
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
   rotaryTop:['Rotary knob'],rotaryMark:['Rotary knob'],knobInstallation:['Rotary knob','Rotary selector'],
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
   return controls.length?details(title,description,controls.map(field=>control(field,model.parameters,generator.typeId)).join('')):'';
  });
  if(remaining.size)output.push(details('Fine adjustments','Adjust the seed or other generator settings.',[...remaining].map(field=>control(field,model.parameters,generator.typeId)).join('')));
  return (family?control(family,model.parameters):'')+output.join('');
 }
 const nativeGuideChoices=new Map();
 const showNativeGuide=model=>nativeGuideChoices.get(model.id)??!!cache.get(model.id)?.routing?.links.some(link=>link.path.length>1);
 const selectedPixels=new Map(),selectedMounts=new Map(),pixelMessages=new Map();
 // Newly saved measured profiles are shared across all families, but never
 // silently alter dimensions on existing fittings.
 document.addEventListener('studio-pixel-profile-saved',event=>{
  const model=active(),id=event.detail?.profileId;
  // Only the model which explicitly opened the shared native editor should
  // select the newly saved profile; Crystal-only edits must not retarget it.
  if(!model||!id||event.detail?.origin!=='native')return;
  if(model.generator.typeId!=='crystals'&&!model.link)editModel(project,model.id,{build:{...model.build,activePixelProfileId:id}});
  save();
  if(mode==='model'&&stage==='build'){renderPalette();if(model.generator.typeId!=='crystals')renderEditor();}
 });
 const mountPlacementProfiles=new Map();
 let placementModel=null,mountingModel=null,pixelGesture=null,pendingDuplicate=null,placeShaped=false,seatCheck=null;
 const pixelHoles=model=>stablePixels(model.build.pixelHoles||[]);
 const mountHoles=model=>stableMounts(model.build.manualMountHoles||[]);
 const fittingProfiles=()=>pixelProfiles(adapter.pixelFitProfiles?.()||[]);
 const chosenProfile=model=>fittingProfiles().find(profile=>profile.id===(model.build.activePixelProfileId||'seed'));
 function renderActivePixelProfile(root,model){
  const crystal=model.generator.typeId==='crystals';
  const id=crystal?adapter.activeCrystalPixelProfile():model.build.activePixelProfileId||'seed';
  const profiles=fittingProfiles().filter(profile=>profile.bodyHeight);
  const field=document.createElement('fieldset');field.innerHTML='<legend>Pixel Profile Library</legend>';
  const label=document.createElement('label');label.textContent='Active Pixel Profile ';
  const select=document.createElement('select');select.dataset.activePixelProfile='';
  for(const profile of profiles)select.add(new Option(profile.name,profile.id));
  if(!profiles.some(profile=>profile.id===id))select.add(new Option('Unavailable profile — import its library',id));
  select.value=id;select.disabled=!!model.link;
  select.onchange=()=>{
   if(crystal)adapter.selectCrystalPixelProfile(select.value);
   else commit({build:{...model.build,activePixelProfileId:select.value}});
   renderPalette();
  };
  label.append(select);field.append(label);
  for(const [title,action] of [
   ['Create pixel profile',()=>adapter.openPixelProfileEditor(select.value,true,undefined,crystal?'crystal':'native')],
   ['Edit active profile',()=>adapter.openPixelProfileEditor(select.value,false,undefined,crystal?'crystal':'native')],
   ['Duplicate profile',()=>adapter.openPixelProfileEditor(select.value,true,undefined,crystal?'crystal':'native')],
   ['Export pixel profiles',()=>adapter.exportPixelProfiles()]
  ]){
   const button=document.createElement('button');button.type='button';button.textContent=title;
   button.onclick=action;field.append(button);
  }
  const upload=document.createElement('label');upload.textContent='Import pixel profiles ';
  const file=document.createElement('input');file.type='file';file.accept='.json,application/json';
  file.onchange=async()=>{
   const selected=file.files[0];if(!selected)return;
   try{await adapter.importPixelProfiles(selected);renderPalette();}
   catch(error){adapter.status(error.message);}
   finally{file.value='';}
  };
  upload.append(file);field.append(upload);root.append(field);
 }
 function planPixelProfileClearance(profile){
  const fit=profile.measuredFit;
  if(!fit)return ()=>{};
  const clearance=Math.round((fit.printedBoreDiameter-fit.bodyDiameter)*100)/100;
  const updates=[];
  for(const model of project.models){
   if(model.link||model.generator.typeId==='crystals')continue;
   const holes=pixelHoles(model);
   if(!holes.some(hole=>hole.followProfileClearance===true&&hole.profileId===profile.id&&hole.clearance!==clearance))continue;
   const build={...model.build,pixelHoles:holes.map(hole=>
    hole.followProfileClearance===true&&hole.profileId===profile.id?{...hole,clearance}:hole)};
   const family=registry.get(model.generator.typeId);
   try{applyBuildModules(family.recipe(model.parameters),build,family.capabilities);}
   catch(error){throw Error(model.name+': '+error.message+' No linked clearances were changed.');}
   updates.push({model,build});
  }
  return ()=>{
   for(const {model,build} of updates){
    const previous={parameters:copy(model.parameters),build:copy(model.build)};
    let h=histories.get(model.id);
    if(!h){h={items:[previous],index:0};histories.set(model.id,h);}
    editModel(project,model.id,{build});
    h.items.splice(h.index+1);h.items.push({parameters:copy(model.parameters),build:copy(build)});h.index=h.items.length-1;
   }
   if(updates.some(({model})=>model.id===active()?.id)&&mode==='model')showGeneric(active());
   if(updates.length){renderTabs();save();}
  };
 }
 function pixelMarkers(model){
  return (cache.get(model.id)?.group?.children||[]).filter(mesh=>mesh.userData.pixelId);
 }
 function mountMarkers(model){
  return (cache.get(model.id)?.group?.children||[]).filter(mesh=>mesh.userData.mountId);
 }
 function refreshPixelMarkers(model){
  if(model.generator.typeId==='crystals')return;
  for(const guide of cache.get(model.id)?.group?.children||[])if(guide.userData.nativeRoute)
   guide.visible=stage==='build'&&showNativeGuide(model);
  for(const marker of pixelMarkers(model)){
   marker.visible=stage==='build';
   marker.material.color.setHex(marker.userData.pixelId===selectedPixels.get(model.id)?0x48e4f1:0xffbe47);
  }
  for(const marker of mountMarkers(model)){
   marker.visible=stage==='build';
   marker.material.color.setHex(marker.userData.mountId===selectedMounts.get(model.id)?0x48e4f1:0xb783ff);
  }
  for(const label of cache.get(model.id)?.group?.children||[])if(label.userData.mountLabel)
   label.visible=stage==='build';
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
 function mountSource(model){
  const family=registry.get(model.generator.typeId);
  return applyBuildModules(family.recipe(model.parameters),
   {...model.build,pixelHoles:[],manualMountHoles:[],serialRouting:null},family.capabilities,{preview:true});
 }
 function mountIssue(model,mount,others){
  try{
   const family=registry.get(model.generator.typeId);
   if(!['tactile-tiles','gears','waves','control-caps','characters','light-pods'].includes(family.typeId))return 'This generator cannot certify a physical mounting through-hole.';
   const issue=mountHoleIssue(mountSource(model),mount,others,pixelHoles(model));
   if(issue)return issue;
   // Verify full manufacturing eligibility, including routes that would otherwise
   // be blocked by this new mounting cut. Never persist a silently invalid route.
   applyBuildModules(family.recipe(model.parameters),
    {...model.build,manualMountHoles:[...others,mount]},family.capabilities);
   return null;
  }catch(error){return error.message;}
 }
 function redrawPixelEditor(focus){
  const open=$('smsPixelAdd')?.closest('details')?.open;
  renderEditor();
  if(open)$('smsPixelAdd').closest('details').open=true;
  if(focus?.selector)focus.root.querySelector(focus.selector)?.focus({preventScroll:true});
 }
 function selectPixel(model,id){
  selectedMounts.delete(model.id);
  selectedPixels.set(model.id,id);
  refreshPixelMarkers(model);
  renderPalette();
 }
 function savePixels(model,holes,id,focus,serialRouting=model.build.serialRouting){
  const build={...model.build,pixelHoles:holes,pixelBuilderVersion:1,...(serialRouting?{serialRouting}:{})};
  if(!commit({build}))return false;
  selectedPixels.set(model.id,id);
  pixelMessages.delete(model.id);
  redrawPixelEditor(focus);
  return true;
 }
 function reorderPixels(model,holes,id,serialRouting=model.build.serialRouting){
  const save=()=>savePixels(model,holes,id,undefined,serialRouting);
  if(serialRouting?.enabled){
   checkFittingBuild(model,{...model.build,pixelHoles:holes,pixelBuilderVersion:1,serialRouting},save,
    {pending:'Checking the new cable order and openings…'});
  }else save();
 }
 function editPixel(model,index,hole,focus,onSaved,beforeCommit){
  const holes=pixelHoles(model),previous=holes[index];
  if(!previous||model.link)return false;
  const moved=hole.x!==previous.x||hole.z!==previous.z;
  if(hole.socketProfile&&moved){
   const updated=relocateShapedSocket(model,previous,hole);
   if(!updated){pixelStatus(model,'Move along the current installation face, or drag the socket onto another solid face.');return false;}
   hole=updated;
  }
  const issue=pixelIssue(model,hole,holes.filter((_,i)=>i!==index));
  if(issue){pixelStatus(model,pixelPlacementAdvice(model,issue));return false;}
  holes[index]={...hole,checked:true};
  const save=()=>{
   let rollback;
   try{
    // Geometry has already been checked. Persist the calibration before the
    // model can reference its custom ID, including on asynchronous workers.
    rollback=beforeCommit?.();
   }catch(error){
    pixelStatus(model,'Measured profile not saved. '+error.message);
    return false;
   }
   let saved=false;
   try{saved=savePixels(model,holes,hole.id,focus);}
   catch(error){
    try{rollback?.();}catch(recoveryError){pixelStatus(model,'Profile rollback needs attention. '+recoveryError.message);}
    pixelStatus(model,'Fitting was not committed. '+error.message);
    return false;
   }
   if(!saved){
    try{rollback?.();}catch(error){pixelStatus(model,'Profile rollback needs attention. '+error.message);}
    return false;
   }
   try{onSaved?.();}catch(error){pixelStatus(model,'Fitting saved, but the profile sync needs attention: '+error.message);}
   return true;
  };
  const routeRotation=model.build.serialRouting?.enabled&&hole.rotation!==previous.rotation;
  if(hole.socketProfile&&(moved||routeRotation||hole.socketProfile!==previous.socketProfile||
     hole.diameter!==previous.diameter||hole.clearance!==previous.clearance)){
   checkFittingBuild(model,{...model.build,pixelHoles:holes,pixelBuilderVersion:1},save);
   return false;
  }
  return save();
 }
 function removePixel(model,index){
  const holes=pixelHoles(model);
  if(!holes[index]||model.link)return;
  holes.splice(index,1);savePixels(model,holes,holes[Math.min(index,holes.length-1)]?.id);
 }
 function selectMount(model,id){
  selectedPixels.delete(model.id);
  selectedMounts.set(model.id,id);
  refreshPixelMarkers(model);renderPalette();
 }
 function saveMounts(model,mounts,id){
  if(!commit({build:{...model.build,manualMountHoles:mounts}}))return false;
  selectedMounts.set(model.id,id);selectedPixels.delete(model.id);
  pixelMessages.delete(model.id);redrawPixelEditor();return true;
 }
 function editMount(model,index,mount){
  const mounts=mountHoles(model);if(!mounts[index]||model.link)return false;
  if(model.build.mountingPatterns?.some(pattern=>pattern.members.includes(mounts[index].id))){
   pixelStatus(model,'Edit the whole mounting pattern or ungroup it first.');return false;
  }
  const issue=mountIssue(model,mount,mounts.filter((_,i)=>i!==index));
  if(issue){pixelStatus(model,issue);return false;}
  mounts[index]=mount;
  if(mount.profile&&mount.profile!==mountProfiles[0]){
   checkFittingBuild(model,{...model.build,manualMountHoles:mounts},()=>saveMounts(model,mounts,mount.id),{
    pending:'Checking material around the recessed fixing…'
   });
   return false; // Keep the accepted field values visible until the worker approves.
  }
  return saveMounts(model,mounts,mount.id);
 }
 function removeMount(model,index){
  const mounts=mountHoles(model);if(!mounts[index]||model.link)return;
  if(model.build.mountingPatterns?.some(pattern=>pattern.members.includes(mounts[index].id))){
   pixelStatus(model,'Ungroup the mounting pattern before removing an individual hole.');return;
  }
  mounts.splice(index,1);saveMounts(model,mounts,mounts[Math.min(index,mounts.length-1)]?.id);
 }
 function pixelPlacementAdvice(model,reason){
  const tips=' Try a smaller profile or move the fitting into a wider solid area.';
  const backing=model.build.pixelBacking?' Inspect the backing and existing cavities.':
   ' If no safe material exists, explicitly enable Add fitting backing (12 mm extra each side).';
  return reason+tips+backing;
 }
 function addAutomaticPixel(model){
  try{
   const holes=pixelHoles(model),recipe=pixelSource(model);
   if(!chosenProfile(model)){pixelStatus(model,'Import the missing pixel profile or select another before placing a fitting.');return;}
   if(holes.length>=16){pixelStatus(model,'Use up to 16 fittings per model.');return;}
   const hole=findPixelPosition(recipe,holes,chosenProfile(model));
   if(hole)savePixels(model,[...holes,{...hole,checked:true}],hole.id);
   else pixelStatus(model,pixelPlacementAdvice(model,'No verified clear material for this pixel bore. '+(checkedPixelBore(recipe,newPixel(chosenProfile(model)),holes)||'')));
  }catch(error){pixelStatus(model,pixelPlacementAdvice(model,error.message));}
 }
 function pixelRay(event){
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
  partRay.setFromCamera(pointer,camera);
 }
 function projectPoint(point){
  camera.updateMatrixWorld();
  const rect=viewport.getBoundingClientRect(),p=point.clone().project(camera);
  return {x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};
 }
 function projectMarker(marker){return projectPoint(marker.position);}
 function markerAt(model,event){
  return [...pixelMarkers(model),...mountMarkers(model)].map(marker=>{
   const p=projectMarker(marker);
   return {marker,distance:Math.hypot(p.x-event.clientX,p.y-event.clientY)};
  }).filter(hit=>hit.distance<=14).sort((a,b)=>a.distance-b.distance)[0]?.marker;
 }
 const viewport=renderer.domElement;
 const patternViewport=mountPatternViewport({THREE,canvas:viewport,camera,
  visible:()=>mode==='model'&&stage==='build'&&active()?.generator.typeId!=='crystals'});
 function fittingMeshes(model){
  return cache.get(model.id)?.group?.children.filter(mesh=>mesh.visible&&mesh.isMesh&&!mesh.userData.previewOnly)||[];
 }
 function fittingSurface(model,event){
  pixelRay(event);
  const hit=partRay.intersectObjects(fittingMeshes(model),false)[0];
  if(!hit?.face)return null;
  const normal=hit.face.normal.clone().applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld));
  return {point:hit.point,normal};
 }
 function nativeModelBounds(meshes){
  const model=active();
  if(mode!=='model'||!model||model.generator.typeId==='crystals')return null;
  const bounds=new THREE.Box3();
  for(const mesh of meshes??fittingMeshes(model))bounds.expandByObject(mesh);
  return bounds;
 }
 function relocateShapedSocket(model,previous,desired){
  const meshes=fittingMeshes(model),bounds=nativeModelBounds(meshes);
  if(!bounds||bounds.isEmpty())return null;
  const normal=new THREE.Vector3(...(previous.surface?.normal??[0,-1,0]));
  const axis=Math.abs(normal.y)>=.5?'y':Math.abs(normal.x)>=Math.abs(normal.z)?'x':'z';
  const origin=new THREE.Vector3(desired.x,previous.surface?.y??0,desired.z),direction=new THREE.Vector3();
  const positive=normal[axis]>0;
  origin[axis]=positive?bounds.max[axis]+1:bounds.min[axis]-1;
  direction[axis]=positive?-1:1;
  const hit=new THREE.Raycaster(origin,direction).intersectObjects(meshes,false)[0];
  if(!hit?.face||Math.abs(hit.point.x-desired.x)>.02||Math.abs(hit.point.z-desired.z)>.02)return null;
  const hitNormal=hit.face.normal.clone().applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld));
  if(normal.dot(hitNormal)<.7)return null;
  return {...desired,surface:socketSurface(hit.point,hitNormal),entryFace:hitNormal.y<0?'underside':'top'};
 }
 function fittingPointScreen(x,z,face){
  const model=active(), meshes=model?fittingMeshes(model):[];
  const bounds=nativeModelBounds(meshes);
  if(!bounds)return null;
  if(bounds.isEmpty())return null;
  const underside=face==='underside';
  const origin=new THREE.Vector3(x,underside?bounds.min.y-1:bounds.max.y+1,z);
  const ray=new THREE.Raycaster(origin,new THREE.Vector3(0,underside?1:-1,0));
  const hit=ray.intersectObjects(meshes,false)[0];
  return hit?projectPoint(hit.point):null;
 }
 function fittingFaceIssue({normal}){
  return Math.abs(normal.y)<.7?'This face cannot take a vertical through-bore. Choose a top or underside surface with solid material.':'';
 }
 const placementGhost=new THREE.Mesh(new THREE.RingGeometry(.82,1,40),
  new THREE.MeshBasicMaterial({side:THREE.DoubleSide,depthTest:false}));
 placementGhost.rotation.x=-Math.PI/2;
 placementGhost.renderOrder=8;
 placementGhost.visible=false;
 scene.add(placementGhost);
 function endPixelPlacement(){
  seatCheck?.terminate();seatCheck=null;placeShaped=false;
  placementModel=null;mountingModel=null;pendingDuplicate=null;placementGhost.visible=false;
  delete viewport.dataset.nativePlacement;
 }
 function fittingCandidate(model,point,duplicate=null){
  const fresh=newPixel(chosenProfile(model),Math.round(point.x*10)/10,Math.round(point.z*10)/10);
  return duplicate?{...duplicate,id:fresh.id,x:fresh.x,z:fresh.z}:fresh;
 }
 function updatePlacementGhost(model,event){
  const hit=fittingSurface(model,event);
  if(!hit){placementGhost.visible=false;viewport.dataset.nativePlacement='outside';return;}
  const {point}=hit,placingMount=mountingModel===model.id;
  const hole=placingMount?mountAtPoint(point,hit.normal,mountPlacementProfiles.get(model.id)):fittingCandidate(model,point,pendingDuplicate);
  const holes=placingMount?mountHoles(model):pixelHoles(model);
  const shaped=!placingMount&&(placeShaped||pendingDuplicate?.socketProfile);
  const issue=(!shaped&&fittingFaceIssue(hit))||(holes.length>=16?'Maximum 16 fittings per model.':
   shaped?null:placingMount?mountIssue(model,{...hole,entryFace:hit.normal.y<0?'underside':'top'},holes):pixelIssue(model,hole,holes));
  placementGhost.position.copy(point).addScaledVector(hit.normal,.3);
  placementGhost.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),hit.normal);
  const needsStockCheck=shaped||(placingMount&&hole.profile&&hole.profile!==mountProfiles[0]);
  placementGhost.scale.setScalar((placingMount&&blindMountProfile(hole.profile)?recessDimensions(hole).diameter:hole.diameter+(hole.clearance||0))/2);
  placementGhost.material.color.setHex(issue?0xff3c59:needsStockCheck?0xffbe47:0x48e4f1);
  placementGhost.visible=true;
  viewport.dataset.nativePlacement=issue?'invalid':needsStockCheck?'unverified':'valid';
 }
 function socketSurface(point,normal){
  if(normal.y<-.999&&Math.abs(point.y)<.01)return undefined;
  return {y:point.y,normal:normal.toArray()};
 }
 function checkFittingBuild(model,build,onValidated,{
  report=message=>pixelStatus(model,message),pending='Checking socket walls, insertion opening and collisions…',
  onSettled=()=>{}
 }={}){
  if(seatCheck||model.link){onSettled();return;}
  const revision=model.revision;
  const worker=new Worker(new URL('./studio-model-worker.js',import.meta.url),{type:'module'});
  seatCheck=worker;
  const finish=message=>{
   worker.terminate();
   if(seatCheck!==worker){onSettled();return;}
   seatCheck=null;
   try{
    if(active()?.id!==model.id||active().revision!==revision||!canEditPixels(model))return;
    if(message){report(message);return;}
    onValidated();
   }finally{onSettled();}
  };
  worker.onmessage=({data})=>{
   if(data.type==='complete')finish();
   if(data.type==='error')finish(data.message);
  };
  worker.onerror=event=>{event.preventDefault();finish(event.message||'Geometry validation could not start.');};
  worker.onmessageerror=()=>finish('Geometry validation returned an unreadable result.');
  report(pending);
  worker.postMessage({ticket:{model:{...model,build}}});
 }
 function checkAndSaveSeat(model,holes,hole,onSaved){
  checkFittingBuild(model,{...model.build,pixelHoles:holes,pixelBuilderVersion:1},()=>{
   if(savePixels(model,holes,hole.id))onSaved?.();
  });
 }
 function placeFittingAt(model,{point,normal},duplicate=null,onSaved){
  const holes=pixelHoles(model);
  if(holes.length>=16){pixelStatus(model,'Use up to 16 fittings per model.');return false;}
  if(!duplicate&&!chosenProfile(model)){pixelStatus(model,'Import the missing profile or select another before placing.');return false;}
  const hole={...fittingCandidate(model,point,duplicate),entryFace:normal.y<0?'underside':'top'};
  hole.hitSurface=socketSurface(point,normal);
  if(placeShaped&&!duplicate){
   const profile=chosenProfile(model);
   if(!profile?.bodyHeight){pixelStatus(model,'Select a measured pixel profile for a shaped socket.');return false;}
   hole.socketProfile={...profile,retentionLip:profile.retentionLip??0};
  }
  if(hole.socketProfile){
   hole.x=point.x;hole.z=point.z;
   hole.surface=hole.hitSurface;
  }
  const issue=pixelIssue(model,hole,holes);
  if(issue){pixelStatus(model,pixelPlacementAdvice(model,issue));return false;}
  const next=[...holes,{...hole,checked:true}];
  if(hole.socketProfile){checkAndSaveSeat(model,next,hole,onSaved);return false;}
  return savePixels(model,next,hole.id);
 }
 function mountAtPoint(point,normal,profile=mountProfiles[0]){
  return {...newMount(Math.round(point.x*10)/10,Math.round(point.z*10)/10),...(profile===mountProfiles[0]?{}:{profile}),
   entryFace:normal.y<0?'underside':'top'};
 }
 function placeMountAt(model,{point,normal},profile,onSaved){
  const mounts=mountHoles(model);
  if(mounts.length>=16){pixelStatus(model,'Use up to 16 mounting holes per model.');return false;}
  const mount=mountAtPoint(point,normal,profile);
  const issue=fittingFaceIssue({normal})||mountIssue(model,mount,mounts);
  if(issue){pixelStatus(model,issue);return false;}
  const next=[...mounts,mount];
  const save=()=>{if(!saveMounts(model,next,mount.id))return false;onSaved?.();return true;};
  if(mount.profile&&mount.profile!==mountProfiles[0]){
   checkFittingBuild(model,{...model.build,manualMountHoles:next},save,{pending:'Checking material around the mounting feature…'});
   return false;
  }
  return save();
 }
 const fittingActions=document.createElement('dialog');
 fittingActions.setAttribute('aria-label','Hardware at this point');
 fittingActions.innerHTML='<p data-fitting-message></p><button type="button" data-add-point-pixel>Add pixel</button> <button type="button" data-add-point-mount>Add mounting feature</button> <button type="button" data-cancel-point>Cancel</button>';
 document.body.append(fittingActions);
 fittingActions.querySelector('[data-cancel-point]').onclick=()=>fittingActions.close();
 viewport.addEventListener('dblclick',event=>{
   const model=active();
   if(event.button!==0||!canEditPixels(model)||model.link||placementModel===model.id||mountingModel===model.id)return;
   const marker=markerAt(model,event);
   if(marker){consume(event);if(marker.userData.mountId)selectMount(model,marker.userData.mountId);else selectPixel(model,marker.userData.pixelId);return;}
   const hit=fittingSurface(model,event);
   if(!hit)return;
   const {point}=hit;
   consume(event);
   const add=fittingActions.querySelector('[data-add-point-pixel]');
   const holes=pixelHoles(model), candidate=fittingCandidate(model,point);
   const issue=fittingFaceIssue(hit)||(holes.length>=16?'Use up to 16 fittings per model.':pixelIssue(model,candidate,holes));
   fittingActions.querySelector('[data-fitting-message]').textContent=issue?pixelPlacementAdvice(model,issue):'Place a vertical through-bore here. The bore opens on both faces; cable cuts are on the underside.';
   const holeMount=newMount(Math.round(point.x*10)/10,Math.round(point.z*10)/10);
   holeMount.entryFace=hit.normal.y<0?'underside':'top';
   const mounts=mountHoles(model),mountButton=fittingActions.querySelector('[data-add-point-mount]');
   const mountProblem=fittingFaceIssue(hit)||(mounts.length>=16?'Use up to 16 mounting holes per model.':mountIssue(model,holeMount,mounts));
   mountButton.disabled=!!mountProblem;
   mountButton.title=mountProblem||'Cut a measured 3.4 mm vertical through-hole on verified solid material';
   mountButton.onclick=()=>{
    fittingActions.close();
    if(active()?.id===model.id&&canEditPixels(model))placeMountAt(model,hit);
   };
   if(mountProblem&&!issue)fittingActions.querySelector('[data-fitting-message]').textContent+=
    ' Mount: '+mountProblem;
   add.disabled=!!issue;
   add.onclick=()=>{
    fittingActions.close();
    if(active()?.id===model.id&&canEditPixels(model))placeFittingAt(model,hit);
   };
   fittingActions.style.position='fixed';fittingActions.style.margin='0';fittingActions.style.inset='0 auto auto 0';
   fittingActions.showModal();
   const bounds=fittingActions.getBoundingClientRect();
   fittingActions.style.left=Math.max(0,Math.min(event.clientX,window.innerWidth-bounds.width))+'px';
   fittingActions.style.top=Math.max(0,Math.min(event.clientY,window.innerHeight-bounds.height))+'px';
  },true);
 const consume=event=>{event.preventDefault();event.stopImmediatePropagation();};
 const canEditPixels=model=>mode==='model'&&stage==='build'&&model&&model.generator.typeId!=='crystals';
 viewport.addEventListener('pointerdown',event=>{
  const model=active();
  if(event.button!==0||!canEditPixels(model))return;
  const marker=markerAt(model,event),placing=(placementModel===model.id||mountingModel===model.id)&&!model.link;
  if(!marker&&!placing)return;
  consume(event);viewport.focus({preventScroll:true});viewport.setPointerCapture(event.pointerId);
  const kind=marker?.userData.mountId?'mount':'pixel';
  const canDrag=kind==='mount'?marker?.userData.mountId===selectedMounts.get(model.id):
   marker?.userData.pixelId===selectedPixels.get(model.id);
  pixelGesture={model,marker,placing,kind,canDrag,id:event.pointerId,time:performance.now(),start:[event.clientX,event.clientY]};
  if(marker){if(kind==='mount')selectMount(model,marker.userData.mountId);else selectPixel(model,marker.userData.pixelId);}
 },true);
 viewport.addEventListener('pointermove',event=>{
  const gesture=pixelGesture;
  if(!gesture){
   const model=active();
   if(canEditPixels(model)&&(placementModel===model.id||mountingModel===model.id))updatePlacementGhost(model,event);
   return;
  }
  if(gesture.id!==event.pointerId)return;
  consume(event);
  if(!gesture.marker||!gesture.canDrag||gesture.model.link||gesture.placing)return;
  const [x,y]=gesture.start;
  if(!gesture.origin&&Math.hypot(event.clientX-x,event.clientY-y)<4)return;
  if(!gesture.origin&&performance.now()-gesture.time<180)return;
  if(!gesture.origin){
   gesture.origin=gesture.marker.position.clone();
   try{gesture.recipe=pixelSource(gesture.model);}catch(error){pixelStatus(gesture.model,pixelPlacementAdvice(gesture.model,error.message));cancelPixelGesture();return;}
  }
  const mounts=gesture.kind==='mount',holes=mounts?mountHoles(gesture.model):pixelHoles(gesture.model);
  const id=mounts?gesture.marker.userData.mountId:gesture.marker.userData.pixelId;
  const current=holes.find(hole=>hole.id===id);
  if(!current)return;
  const hit=fittingSurface(gesture.model,event);
  const underside=current.entryFace==='underside';
  gesture.candidate=null;
  gesture.issue=!hit?'Move onto the original solid fitting face.':current.socketProfile?'':fittingFaceIssue(hit);
  const originalNormal=current.surface?.normal;
  if(hit&&!gesture.issue&&(originalNormal?hit.normal.dot(new THREE.Vector3(...originalNormal))<.5:(hit.normal.y<0)!==underside))
   gesture.issue='Move onto the original fitting face. A drag cannot switch installation sides.';
  if(hit&&!gesture.issue){
   const candidate={...current,x:Math.round(hit.point.x*10)/10,z:Math.round(hit.point.z*10)/10};
   if(!mounts){
    candidate.hitSurface=socketSurface(hit.point,hit.normal);
    if(current.socketProfile){candidate.x=hit.point.x;candidate.z=hit.point.z;candidate.surface=candidate.hitSurface;}
   }
   const others=holes.filter(hole=>hole.id!==id);
   gesture.issue=mounts?mountIssue(gesture.model,candidate,others):pixelIssue(gesture.model,candidate,others,gesture.recipe);
   if(!gesture.issue)gesture.candidate=candidate;
   const markerPoint=new THREE.Vector3(candidate.x,hit.point.y,candidate.z);
   if(current.socketProfile)markerPoint.addScaledVector(hit.normal,.3);
   else markerPoint.y+=underside?-.3:.3;
   movePixelMarker(gesture.model,gesture.marker,markerPoint);
  }
  gesture.marker.material.color.setHex(gesture.issue?0xff3c59:0x48e4f1);
 },true);
 function movePixelMarker(model,marker,position){
  const delta=position.clone().sub(marker.position);
  marker.position.copy(position);
  const id=marker.userData.pixelId||marker.userData.mountId;
  for(const part of cache.get(model.id)?.group?.children||[]){
   if(part.userData.pixelPort===id||part.userData.pixelLabel===id||part.userData.mountLabel===id)part.position.add(delta);
  }
 }
 function cancelPixelGesture(){
  const gesture=pixelGesture;pixelGesture=null;
  if(!gesture)return;
  if(gesture.origin)movePixelMarker(gesture.model,gesture.marker,gesture.origin);
  refreshPixelMarkers(gesture.model);
  if(viewport.hasPointerCapture(gesture.id))viewport.releasePointerCapture(gesture.id);
 }
 viewport.addEventListener('pointerleave',()=>{placementGhost.visible=false;});
 viewport.addEventListener('pointercancel',cancelPixelGesture,true);
 viewport.addEventListener('lostpointercapture',cancelPixelGesture,true);
 viewport.addEventListener('pointerup',event=>{
  const gesture=pixelGesture;
  if(!gesture||gesture.id!==event.pointerId)return;
  consume(event);cancelPixelGesture();
  const model=gesture.model;
  if(active()?.id!==model.id||!canEditPixels(model))return;
  if(gesture.candidate){
   if(gesture.kind==='mount'){
    const index=mountHoles(model).findIndex(hole=>hole.id===gesture.candidate.id);
    editMount(model,index,gesture.candidate);
   }else{
    const index=pixelHoles(model).findIndex(hole=>hole.id===gesture.candidate.id);
    if(gesture.candidate.socketProfile){
     const holes=pixelHoles(model);
     if(index>=0){holes[index]=gesture.candidate;checkAndSaveSeat(model,holes,gesture.candidate);}
    }else editPixel(model,index,gesture.candidate);
   }return;
  }
  if(gesture.issue){pixelStatus(model,gesture.issue);return;}
  if(!gesture.placing||gesture.marker)return;
  const hit=fittingSurface(model,event);
  if(!hit){pixelStatus(model,'Click a solid model surface to place this fitting.');return;}
  const faceIssue=placeShaped||pendingDuplicate?.socketProfile?'':fittingFaceIssue(hit);
  if(faceIssue){pixelStatus(model,faceIssue);return;}
  if(mountingModel===model.id){
   placeMountAt(model,hit,mountPlacementProfiles.get(model.id),()=>{
    if(mountHoles(model).length>=16){endPixelPlacement();renderPalette();}
    else updatePlacementGhost(model,event);
   });
  }else{
   const onSaved=()=>{
    if(pendingDuplicate||pixelHoles(model).length>=16){endPixelPlacement();renderPalette();}
    else updatePlacementGhost(model,event);
   };
   if(placeFittingAt(model,hit,pendingDuplicate,onSaved))onSaved();
  }
 },true);
 viewport.addEventListener('keydown',event=>{
  const model=active();
  if(!canEditPixels(model))return;
  if(event.key==='Escape'&&(pixelGesture||placementModel===model.id||mountingModel===model.id)){
   consume(event);cancelPixelGesture();endPixelPlacement();pixelStatus(model,'Placement ended.');renderPalette();return;
  }
  if(model.link)return;
  const mounts=mountHoles(model),mountIndex=mounts.findIndex(hole=>hole.id===selectedMounts.get(model.id));
  const arrows={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
  if(mountIndex>=0){
   const direction=arrows[event.key];
   if(event.key==='Delete'){consume(event);removeMount(model,mountIndex);return;}
   if(direction){
    consume(event);const n=event.shiftKey?5:1,hole=mounts[mountIndex];
    editMount(model,mountIndex,{...hole,x:hole.x+direction[0]*n,z:hole.z+direction[1]*n});
    return;
   }
  }
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
 function renderCrystalWirePalette(root){
  // Small controls mirror existing authoritative Crystal wiring settings.
  // They never maintain a second route plan or alter a stored pixel location.
  const length=document.querySelector('[data-state="pixelStringSpacing"]');
  const channels=document.querySelector('[data-state="wireChannels"]');
  const arrows=document.querySelector('[data-state="wireDirectionArrows"]');
  const width=document.querySelector('[data-state="wireWidth"]');
  const vaulted=document.querySelector('[data-state="wireVaulted"]');
  const allowOverLength=document.querySelector('[data-state="wireAllowOverLength"]');
  if(!length||!channels||!arrows||!width||!vaulted||!allowOverLength)return;
  const field=document.createElement('fieldset');
  field.innerHTML='<legend>Wire routing and cable lengths</legend>'+
   '<label>Available pixel-to-pixel cable length<select data-build-wire-pitch>'+
   '<option value="25">25 mm</option><option value="50">50 mm</option><option value="100">100 mm</option><option value="custom">Custom</option></select></label>'+
   '<label data-build-wire-custom-row>Custom length (mm)<input data-build-wire-custom type="number" min="5" max="1000" step="1"></label>'+
   '<label>Wire-track width (mm)<input data-build-wire-width type="number" min="1.5" max="9" step=".25" required></label>'+
   '<label><input data-build-wire-channels type="checkbox"> Cut underside wiring channels</label>'+
   '<label><input data-build-wire-vaulted type="checkbox"> Vault wire-track roofs</label>'+
   '<label><input data-build-wire-over-length type="checkbox"> Allow over-length cables</label>'+
   '<label><input data-build-wire-arrows type="checkbox"> Show direction arrows</label>'+
   '<div class="sms-actions"><button type="button" data-build-wire-snap>Snap pixels to cable length</button>'+
   '<button type="button" data-build-wire-reverse>Reverse pixel order</button></div>'+
   '<p>Red routes need longer wires. Allow over-length cables to place and prepare those routes while keeping the length warning. Thin or blocked paths still need to be fixed.</p>';
  const trackWidth=field.querySelector('[data-build-wire-width]');
  trackWidth.value=width.value;
  trackWidth.onchange=()=>{
   if(!trackWidth.checkValidity()){trackWidth.reportValidity();trackWidth.value=width.value;return;}
   width.value=trackWidth.value;
   width.dispatchEvent(new Event('input',{bubbles:true}));
   trackWidth.value=width.value;
  };
  const pitch=field.querySelector('[data-build-wire-pitch]');
  const custom=field.querySelector('[data-build-wire-custom]');
  const chosen=Number(length.value);
  pitch.value=[25,50,100].includes(chosen)?String(chosen):'custom';
  custom.value=length.value;
  custom.parentElement.hidden=pitch.value!=='custom';
  pitch.onchange=()=>{
   if(pitch.value==='custom'){custom.parentElement.hidden=false;custom.focus();return;}
   const origin=document.getElementById('wireSpacingPreset');
   origin.value=pitch.value;origin.dispatchEvent(new Event('change',{bubbles:true}));
   custom.value=pitch.value;custom.parentElement.hidden=true;
  };
  custom.onchange=()=>{
   if(!custom.checkValidity()){custom.reportValidity();custom.value=length.value;return;}
   length.value=custom.value;
   length.dispatchEvent(new Event('input',{bubbles:true}));
   length.dispatchEvent(new Event('change',{bubbles:true}));
  };
  for(const [selector,origin] of [['[data-build-wire-channels]',channels],['[data-build-wire-vaulted]',vaulted],
   ['[data-build-wire-arrows]',arrows],['[data-build-wire-over-length]',allowOverLength]]){
   const control=field.querySelector(selector);control.checked=origin.checked;
   control.onchange=()=>{origin.click();control.checked=origin.checked;};
  }
  field.querySelector('[data-build-wire-snap]').onclick=()=>document.getElementById('snapPixelSpacingBtn')?.click();
  field.querySelector('[data-build-wire-reverse]').onclick=()=>document.getElementById('reversePixelStringBtn')?.click();
  root.append(field);
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
   const serialRouting={...settings,...fields},build={...model.build,serialRouting};
   const apply=()=>{
    if(!commit({build}))return false;
    redrawPixelEditor();return true;
   };
   if(serialRouting.enabled&&(serialRouting.vaulted||Object.hasOwn(fields,'minBendRadius'))){
    checkFittingBuild(model,build,apply,{pending:'Checking the cable path and surrounding material…'});
    return false;
   }
   return apply();
  };
  const note=document.createElement('p');
  note.setAttribute('role','status');
  note.textContent=plan.reason?(!settings.enabled?'Bore-only — '+plan.reason:plan.reason):settings.enabled?'Channels ready for preparation.':'Guide only until Cut serial channels is enabled.';
  block.append(note);
  block.insertAdjacentHTML('beforeend','<label><input type="checkbox" data-native-route'+(settings.enabled?' checked':'')+
   (model.link||(!settings.enabled&&plan.reason)?' disabled':'')+'> Cut serial channels</label>');
  if(pixelHoles(model).length>1){
   const reverse=document.createElement('button');
   reverse.type='button';reverse.textContent='Reverse pixel order and wiring';reverse.disabled=!!model.link;
   reverse.onclick=()=>{
    const holes=pixelHoles(model).reverse().map(hole=>({...hole,rotation:(hole.rotation+180)%360}));
    const serialRouting={...settings,inTail:settings.outTail,outTail:settings.inTail,
     inEdgePercent:settings.outEdgePercent??null,outEdgePercent:settings.inEdgePercent??null};
    reorderPixels(model,holes,selectedPixels.get(model.id),serialRouting);
   };
   block.append(reverse);
  }
  block.querySelector('[data-native-route]').onchange=event=>{
   const input=event.target,enabled=input.checked;
   input.checked=!!settings.enabled;
   change({enabled});
  };
  block.insertAdjacentHTML('beforeend','<label><input type="checkbox" data-vaulted-route'+
   (settings.vaulted?' checked':'')+disabled+'> Vault wire-track roofs for underside-down printing</label>');
  block.querySelector('[data-vaulted-route]').onchange=event=>{
   const input=event.target,vaulted=input.checked;
   input.checked=!!settings.vaulted;
   change({vaulted});
  };
  const widthLabel=document.createElement('label'),widthInput=document.createElement('input');
  widthLabel.textContent='Requested wire-track width (mm) ';
  widthInput.type='number';widthInput.min='1.5';widthInput.max='12';widthInput.step='any';
  widthInput.value=settings.channelWidthMm??3.2;
  widthInput.required=true;widthInput.disabled=!!model.link;
  widthInput.dataset.nativeChannelWidth='';
  widthInput.onchange=()=>{
   if(!widthInput.checkValidity()){widthInput.reportValidity();widthInput.value=settings.channelWidthMm??3.2;return;}
   if(!change({channelWidthMm:widthInput.valueAsNumber}))widthInput.value=settings.channelWidthMm??3.2;
  };
  widthLabel.append(widthInput);block.append(widthLabel);
  const widthNote=document.createElement('p');
  widthNote.textContent='Planned usable width: '+plan.channelWidthMm.toFixed(2)+' mm. Fitting relief may require a wider track.';
  block.append(widthNote);
  const guide=document.createElement('label'),show=document.createElement('input');
  show.type='checkbox';show.dataset.nativePreview='';show.checked=showNativeGuide(model);
  show.onchange=()=>{nativeGuideChoices.set(model.id,show.checked);refreshPixelMarkers(model);};
  const hasPaths=plan.links.some(link=>link.path.length>1);
  show.disabled=!hasPaths;
  if(!hasPaths)show.checked=false;
  guide.append(show,' Show routes and arrows');block.append(guide);
  if(!hasPaths&&plan.reason&&pixelHoles(model).length){
   const explanation=document.createElement('p');
   explanation.dataset.nativeGuideBlocked='';
   explanation.textContent='No wiring guide is available for these fittings. '+plan.reason;
   block.append(explanation);
  }
  block.insertAdjacentHTML('beforeend','<label>Physical pixel pitch<select data-native-pitch'+disabled+
   '><option value="25">25 mm</option><option value="50">50 mm</option><option value="100">100 mm</option><option value="custom">Custom</option></select></label>'+
   '<label>IN tail limit (mm)<input data-native-in-tail type="number" min="5" max="250" value="'+esc(settings.inTail)+'"'+disabled+'></label>'+
   '<label>OUT tail limit (mm)<input data-native-out-tail type="number" min="5" max="250" value="'+esc(settings.outTail)+'"'+disabled+'></label>');
  const edgeControls=document.createElement('fieldset');
  edgeControls.innerHTML='<legend>Physical cable openings</legend><p>Set a perimeter position from 0 to less than 100%, or leave blank for automatic.</p>';
  for(const [end,key] of [['in','inEdgePercent'],['out','outEdgePercent']]){
   const label=document.createElement('label'),input=document.createElement('input');
   label.textContent=end.toUpperCase()+' perimeter position (%) ';
   input.type='number';input.min='0';input.max='99.99999999999999';input.step='any';
   input.dataset.nativeEdge=end;input.disabled=!!model.link;
   input.value=settings[key]??'';
   input.onchange=()=>{
    if(!input.checkValidity()){input.reportValidity();input.value=settings[key]??'';return;}
    if(!change({[key]:input.value===''?null:input.valueAsNumber}))input.value=settings[key]??'';
   };
   label.append(input);edgeControls.append(label);
   const resolved=plan.edgePositions?.[end];
   if(Number.isFinite(resolved)&&settings[key]==null){
    const pin=document.createElement('button');
    pin.type='button';pin.textContent='Pin automatic '+end.toUpperCase()+' opening';
    pin.dataset.nativePin=end;pin.disabled=!!model.link;
    pin.onclick=()=>change({[key]:resolved});
    edgeControls.append(pin);
   }
  }
  block.append(edgeControls);
  const pitch=block.querySelector('[data-native-pitch]');
  pitch.value=settings.customPitch||![25,50,100].includes(settings.pitch)?'custom':settings.pitch;
  pitch.onchange=()=>{
   if(!change(pitch.value==='custom'?{customPitch:true}:{pitch:Number(pitch.value),customPitch:false}))
    pitch.value=settings.customPitch||![25,50,100].includes(settings.pitch)?'custom':settings.pitch;
  };
  const bindNumber=(input,key)=>input.onchange=()=>{
   if(!input.value||!input.checkValidity()){input.reportValidity();input.value=settings[key];return;}
   if(!change({[key]:input.valueAsNumber}))input.value=settings[key];
  };
  bindNumber(block.querySelector('[data-native-in-tail]'),'inTail');
  bindNumber(block.querySelector('[data-native-out-tail]'),'outTail');
  const bend=document.createElement('label');
  bend.textContent='Minimum bend radius (mm) ';
  const bendInput=document.createElement('input');
  bendInput.dataset.nativeBendRadius='';
  bendInput.type='number';bendInput.min='1';bendInput.max='60';bendInput.step='any';
  bendInput.value=settings.minBendRadius??5;bendInput.disabled=!!model.link;
  bendInput.onchange=()=>{
   if(!bendInput.value||!bendInput.checkValidity()){bendInput.reportValidity();bendInput.value=settings.minBendRadius??5;return;}
   if(!change({minBendRadius:bendInput.valueAsNumber}))bendInput.value=settings.minBendRadius??5;
  };
  bend.append(bendInput);block.append(bend);
  if(pitch.value==='custom'){
   pitch.parentElement.insertAdjacentHTML('afterend','<label>Custom pitch (mm)<input data-native-custom type="number" min="5" max="250" value="'+esc(settings.pitch)+'"'+disabled+'></label>');
   bindNumber(block.querySelector('[data-native-custom]'),'pitch');
  }
  for(const link of plan.links){
   const line=document.createElement('p');
   line.textContent=link.label+(Number.isFinite(link.measure)?' · '+link.measure.toFixed(1)+' / '+link.budget+' mm':'')+(link.reason?' · '+link.reason:'');
   if(link.reason)line.className='sms-error';
   block.append(line);
  }
 }
 function renderMountPalette(root,model){
  const family=registry.get(model.generator.typeId);
  if(!['tactile-tiles','gears','waves','control-caps','characters','light-pods'].includes(family.typeId))return;
  const mounts=mountHoles(model),selected=mounts.findIndex(hole=>hole.id===selectedMounts.get(model.id));
  if(!model.link){
   const patterns=model.build.mountingPatterns??[];
   const section=document.createElement('details');
   section.dataset.toolMountPattern='';
   const summary=document.createElement('summary');summary.textContent='Uniform mounting patterns';
   section.append(summary);
   section.addEventListener('toggle',()=>{
    if(!section.open){patternViewport.clear();return;}
    if(section.children.length>1){section.querySelector('[data-pattern-select]')?.dispatchEvent(new Event('change'));return;}
    try{
     const source=mountSource(model),{width,depth}=source.bounds;
     const footprint=source.serialSupport?.outline??source.pixelBoreSupport?.outline??
      [[-width/2,-depth/2],[width/2,depth/2]];
     section.append(mountPatternEditor({patterns,mounts,footprint,limit:MAX_NATIVE_MOUNTS,profiles:manualMountProfiles,
      onPreview:patternViewport.preview,
      validate:transaction=>patternMountIssues(source,transaction,pixelHoles(model)),
      apply:transaction=>new Promise(resolve=>{
       const build={...model.build,manualMountHoles:transaction.mounts,mountingPatterns:transaction.patterns};
       checkFittingBuild(model,build,()=>{if(commit({build}))renderPalette();},{
        report:message=>section.querySelector('[data-pattern-status]').textContent=message,
        pending:'Checking all pattern holes against the manufactured model…',onSettled:resolve
       });
      }),
      ungroup:id=>{
       if(commit({build:{...model.build,mountingPatterns:patterns.filter(pattern=>pattern.id!==id)}}))renderPalette();
      }
     }));
    }catch(error){
     const message=document.createElement('p');message.textContent=error.message;section.append(message);
    }
   });
   root.append(section);
  }
  const locked=!!model.link,disabled=locked?' disabled':'';
  const placementProfile=mountPlacementProfiles.get(model.id)??mountProfiles[0];
  const mount=mounts[selected],profile=mount?.profile??mountProfiles[0],blind=blindMountProfile(profile);
  const block=document.createElement('fieldset');block.setAttribute('aria-label','Mounting holes');
  block.innerHTML='<legend>Mounting &amp; attachments</legend>'+
   '<p>Place vertical 2–8 mm through-holes on a solid top or underside. Choose a screw recess, magnet pocket or threaded insert pilot on an underside or supported planar top mount.</p>'+
   '<label>New mounting profile<select data-new-mount-profile'+disabled+'>'+manualMountProfiles.map(option=>
    '<option'+(option===placementProfile?' selected':'')+'>'+option+'</option>').join('')+'</select></label>'+
   '<div class="sms-actions"><button type="button" data-place-mount'+(locked||mounts.length>=16?' disabled':'')+'>Place mounting hole in 3D</button>'+
   (mountingModel===model.id?'<button type="button" data-done-mount>Done placing mounts</button>':'')+'</div>'+
   '<div class="sms-actions" aria-label="Select mount">'+mounts.map((mount,i)=>'<button type="button" data-select-mount="'+i+'" aria-pressed="'+(i===selected)+'">M'+(i+1)+'</button>').join('')+'</div>'+
   (selected<0?'':('<fieldset><legend>M'+(selected+1)+' · '+esc(profile)+'</legend>'+
    [['x','X (mm)','-200','200'],['z','Z (mm)','-200','200'],...(blind?[]:[['diameter','Hole diameter (mm)','2','8']])].map(([field,label,min,max])=>
     '<label>'+label+'<input type="number" data-mount-field="'+field+'" min="'+min+'" max="'+max+'" step=".1" value="'+esc(mounts[selected][field])+'"'+disabled+'></label>').join('')+
    (mount.entryFace==='underside'||profile!==mountProfiles[0]||Number.isFinite(family.recipe(model.parameters).serialSupport?.topY)?'<label>Mount profile<select data-mount-profile'+disabled+'>'+manualMountProfiles.map(option=>
     '<option'+(option===profile?' selected':'')+'>'+option+'</option>').join('')+'</select></label>':'')+
    (profile!==mountProfiles[0]?[['recessDiameter',blind?'Pocket diameter (mm)':'Recess diameter (mm)',12],['recessDepth',blind?'Pocket depth (mm)':'Recess depth (mm)',8]].map(([key,label,max])=>
     '<label>'+label+'<input type="number" required min=".5" max="'+max+'" step="any" data-mount-recess="'+key+
     '" value="'+esc(recessDimensions(mount)[key==='recessDiameter'?'diameter':'depth'])+'"'+disabled+'></label>').join(''):'')+
    '<button type="button" data-remove-mount'+disabled+'>Remove M'+(selected+1)+'</button></fieldset>'));
  root.append(block);
  block.querySelector('[data-new-mount-profile]').onchange=event=>mountPlacementProfiles.set(model.id,event.target.value);
  block.querySelector('[data-place-mount]').onclick=()=>{
   endPixelPlacement();mountingModel=model.id;viewport.dataset.nativePlacement='outside';
   renderPalette();viewport.tabIndex=0;viewport.focus({preventScroll:true});
   pixelStatus(model,'Click or tap a solid top or underside to place the selected mounting profile. Use Done or Escape to exit.');
  };
  const done=block.querySelector('[data-done-mount]');
  if(done)done.onclick=()=>{endPixelPlacement();renderPalette();};
  block.querySelectorAll('[data-select-mount]').forEach(button=>button.onclick=()=>selectMount(model,mounts[Number(button.dataset.selectMount)].id));
  block.querySelectorAll('[data-mount-field]').forEach(input=>input.onchange=()=>{
   if(!input.checkValidity()){input.reportValidity();input.value=mounts[selected][input.dataset.mountField];return;}
   const hole={...mounts[selected],[input.dataset.mountField]:Number(input.value)};
   if(!editMount(model,selected,hole))input.value=mounts[selected][input.dataset.mountField];
  });
  const selectProfile=block.querySelector('[data-mount-profile]');
  if(selectProfile)selectProfile.onchange=()=>{
   const next={...mount,profile:selectProfile.value};
   if(blind!==blindMountProfile(next.profile)){delete next.recessDiameter;delete next.recessDepth;}
   if(!editMount(model,selected,next))selectProfile.value=profile;
  };
  block.querySelectorAll('[data-mount-recess]').forEach(input=>{
   const key=input.dataset.mountRecess,accepted=recessDimensions(mount)[key==='recessDiameter'?'diameter':'depth'];
   input.onchange=()=>{
    if(!input.checkValidity()){input.reportValidity();input.value=accepted;return;}
    if(!editMount(model,selected,{...mount,[key]:input.valueAsNumber}))input.value=accepted;
   };
  });
  const remove=block.querySelector('[data-remove-mount]');
  if(remove)remove.onclick=()=>removeMount(model,selected);
  const tabList=model.build.backingTabs||[],tabDiameter=model.build.backingTabDiameter??3.4;
  const tabs=document.createElement('fieldset');
  tabs.innerHTML='<legend>External backing tabs</legend>'+
   '<p>Add screw tabs to a stationary design using the fitting backing. Adjust each position along the perimeter.</p>'+
   '<label>Tab hole diameter (mm)<input type="number" data-tab-diameter min="2" max="8" step=".1" value="'+esc(tabDiameter)+'"'+disabled+'></label>'+
   '<button type="button" data-add-backing-tab'+(locked||tabList.length>=24?' disabled':'')+'>Add external tab</button>'+
   tabList.map((tab,i)=>{
    const profile=tab.profile??mountProfiles[0],recess=recessDimensions({...tab,diameter:tabDiameter});
    return '<fieldset><legend>T'+(i+1)+'</legend><label>Perimeter (%)<input type="number" data-backing-tab="'+i+
     '" min="0" max="99.9" step=".1" value="'+esc((tab.u*100).toFixed(1))+'"'+disabled+'></label>'+
     '<label>Underside fixing profile<select data-tab-profile="'+i+'"'+disabled+'>'+mountProfiles.map(option=>
      '<option'+(option===profile?' selected':'')+'>'+option+'</option>').join('')+'</select></label>'+
     (profile!==mountProfiles[0]?[['recessDiameter','Recess diameter (mm)',12,recess.diameter],['recessDepth','Recess depth (mm)',8,recess.depth]]
      .map(([field,label,max,value])=>'<label>'+label+'<input type="number" required min=".5" max="'+max+
       '" step="any" data-tab-index="'+i+'" data-tab-recess="'+field+'" value="'+esc(value)+'"'+disabled+'></label>').join(''):'')+
     '<button type="button" data-remove-backing-tab="'+i+'"'+disabled+'>Remove T'+(i+1)+'</button></fieldset>';
   }).join('');
  block.append(tabs);
  const saveTabs=(backingTabs,backingTabDiameter)=>{
   const build={...model.build,backingTabs,backingTabDiameter};
   const save=()=>{
    if(commit({build})){pixelMessages.delete(model.id);redrawPixelEditor();return true;}
    pixelStatus(model,$('smsModelError')?.textContent||'Could not attach the external tab.');
    return false;
   };
   if(backingTabs.some(tab=>tab.profile&&tab.profile!==mountProfiles[0])){
    checkFittingBuild(model,build,save,{pending:'Checking material around the recessed tab fixings…'});
    return false;
   }
   return save();
  };
  const diameterInput=tabs.querySelector('[data-tab-diameter]');
  diameterInput.onchange=()=>{
   if(!diameterInput.value||!diameterInput.checkValidity()||!saveTabs(tabList,diameterInput.valueAsNumber))
    diameterInput.value=tabDiameter;
  };
  tabs.querySelector('[data-add-backing-tab]').onclick=()=>{
   if(!model.build.pixelBacking){pixelStatus(model,'Enable Add fitting backing on a stationary single-material design before adding external tabs.');return;}
   const positions=[.125,.625,.375,.875,...Array.from({length:32},(_,i)=>(i+.5)/32)];
   const family=registry.get(model.generator.typeId),source=family.recipe(model.parameters);
   let reason='There is no clear attachment location along this backing edge.';
   for(const u of positions){
    const next=[...tabList,{u}];
    try{applyBuildModules(source,{...model.build,backingTabs:next},family.capabilities,{preview:true});}
    catch(error){reason=error.message;continue;}
    saveTabs(next,tabDiameter);return;
   }
   pixelStatus(model,reason);
  };
  tabs.querySelectorAll('[data-backing-tab]').forEach(input=>input.onchange=()=>{
   const i=Number(input.dataset.backingTab);
   if(input.value&&input.checkValidity()&&saveTabs(tabList.map((tab,index)=>index===i?{...tab,u:input.valueAsNumber/100}:tab),tabDiameter))return;
   input.value=(tabList[i].u*100).toFixed(1);
  });
  const editTab=(index,patch)=>saveTabs(tabList.map((tab,i)=>i===index?{...tab,...patch}:tab),tabDiameter);
  tabs.querySelectorAll('[data-tab-profile]').forEach(select=>select.onchange=()=>{
   const index=Number(select.dataset.tabProfile);
   if(!editTab(index,{profile:select.value}))select.value=tabList[index].profile??mountProfiles[0];
  });
  tabs.querySelectorAll('[data-tab-recess]').forEach(input=>input.onchange=()=>{
   const index=Number(input.dataset.tabIndex),field=input.dataset.tabRecess;
   const accepted=recessDimensions({...tabList[index],diameter:tabDiameter})[field==='recessDepth'?'depth':'diameter'];
   if(!input.checkValidity()){input.reportValidity();input.value=accepted;return;}
   if(!editTab(index,{[field]:input.valueAsNumber}))input.value=accepted;
  });
  tabs.querySelectorAll('[data-remove-backing-tab]').forEach(button=>button.onclick=()=>
   saveTabs(tabList.filter((_,i)=>i!==Number(button.dataset.removeBackingTab)),tabDiameter));
 }
 function renderFittingBacking(container,model){
  const root=document.createElement('fieldset');
  const disabled=model.link?' disabled':'',holes=pixelHoles(model);
  root.innerHTML='<legend>Fitting backing</legend>'+
   '<label><input type="checkbox" data-pixel-backing'+(model.build.pixelBacking?' checked':'')+disabled+'> Add fitting backing (12 mm of additional material around each edge)</label>'+
   (model.build.pixelBacking?'<label>Fitting backing thickness (mm)<input type="number" min="3" max="10" step="0.1" data-pixel-backing-thickness value="'+
    esc(model.build.pixelBackingThickness??4)+'"'+disabled+'></label><button type="button" data-reset-pixel-backing-thickness'+disabled+'>Reset backing thickness</button>':'');
  container.append(root);
  const status=document.createElement('p');status.dataset.pixelStatus='';status.setAttribute('role','status');
  status.textContent=pixelMessages.get(model.id)||'';root.append(status);
  root.querySelector('[data-pixel-backing]').onchange=event=>{
   if(!commit({build:{...model.build,pixelBacking:event.target.checked}})){
    event.target.checked=!!model.build.pixelBacking;return;
   }
   renderEditor();
  };
  const backingThickness=root.querySelector('[data-pixel-backing-thickness]');
  if(backingThickness){
   const changeThickness=value=>{
    const previous=model.build.pixelBackingThickness??4;
    backingThickness.value=previous;
    if(!Number.isFinite(value)||value<3||value>10){
     pixelStatus(model,'Choose 3–10 mm fitting backing thickness.');
     return;
    }
    if(value===previous)return;
    const build={...model.build,pixelBackingThickness:value};
    const apply=()=>{if(commit({build}))renderEditor();};
    const hasRecess=build.mounting&&['Underside countersinks','Underside counterbores'].includes(build.mountStyle)||
     [...(build.backingTabs||[]),...mountHoles(model)].some(fixing=>fixing.profile&&fixing.profile!==mountProfiles[0]);
    if(holes.some(hole=>hole.socketProfile)||build.serialRouting?.enabled||hasRecess)checkFittingBuild(model,build,apply);
    else apply();
   };
   backingThickness.onchange=()=>changeThickness(backingThickness.valueAsNumber);
   root.querySelector('[data-reset-pixel-backing-thickness]').onclick=()=>changeThickness(4);
  }
 }
 function renderPixelPalette(root,model){
  const holes=pixelHoles(model),profiles=fittingProfiles(),selected=holes.findIndex(hole=>hole.id===selectedPixels.get(model.id));
  const disabled=model.link?' disabled':'',noAdd=holes.length>=16?' disabled':disabled;
  const hole=holes[selected]||newPixel(chosenProfile(model));
  const fit=resolvePixelFitting(hole,adapter.pixelFitProfiles());
  const underside=isUndersidePixel(hole);
  root.innerHTML='<h3>Pixel fittings</h3><div class="sms-actions"><button type="button" data-pixel-profile-editor>Create / edit pixel profile</button></div>'+
   '<p>Choose a saved measured profile before placing. A profile selection with P1/P2 selected updates <strong>only that fitting</strong>; otherwise it chooses the next fitting. Plain bores open on both faces. Select a fitting to enable a measured blind socket on its installation face. Cable cuts open on the underside. Print a coupon to check fit.</p>'+
   '<p>Fitting bores need continuous solid material. Thin walls, cavities and narrow rims can block placement.</p>'+
   '<label><input type="checkbox" data-native-fit-preview'+(nativeFitPreviewChoices.get(model.id)?' checked':'')+'> Show physical pixels and socket cutters</label>'+
   '<output role="status" data-native-fit-preview-status>'+esc(nativeFitPreviewMessages.get(model.id)||'')+'</output>'+
   '<div class="sms-actions" aria-label="Hardware library">'+profiles.map(profile=>
    '<button type="button" data-fit-profile="'+esc(profile.id)+'" aria-pressed="'+(chosenProfile(model)?.id===profile.id)+'"'+disabled+
    '>◉ '+esc(profile.name)+' · '+profile.bodyDiameter+' mm</button>').join('')+'</div>'+
   '<div class="sms-actions"><button type="button" data-place-pixel'+noAdd+'>Place LED fitting in 3D</button>'+
   '<button type="button" data-place-shaped'+noAdd+'>Place shaped socket in 3D</button>'+
   '<button type="button" data-auto-pixel'+noAdd+'>Add pixel automatically</button>'+
   (placementModel===model.id?'<button type="button" data-done-pixel>Done placing pixels</button>':'')+'</div>'+
   '<div class="sms-actions" aria-label="Select pixel">'+holes.map((hole,i)=>'<button type="button" data-select-pixel="'+i+'" aria-pressed="'+(i===selected)+'">P'+(i+1)+'</button>').join('')+'</div>'+
   '<p role="status" data-pixel-status>'+esc(pixelMessages.get(model.id)||'Click a marker to select. Hold then drag to move. Arrow keys nudge 1 mm, or 5 mm with Shift.')+'</p>'+
   (selected<0?'':pixelHoleMarkup(holes[selected],selected,esc,disabled,profiles)+
    '<label><input type="checkbox" data-shaped-socket'+(hole.socketProfile?' checked':'')+disabled+'> Shape a socket on the selected face from the measured profile</label>'+
    (hole.socketProfile?'<label>Retention lip (mm)<input type="number" data-seat-retention min="0" max=".7" step=".05" value="'+esc(hole.socketProfile.retentionLip)+'"'+disabled+'></label>'+
     (hole.conical||underside?
      '<label><input type="checkbox" data-seat-conical'+(hole.conical?' checked':'')+disabled+'> Conical socket roof</label>':'')+
     (underside?'<label><input type="checkbox" data-seat-shoulders'+(hole.supportFreeShoulders?' checked':'')+disabled+'> Support-Free Shoulders</label>':'')+
     (hole.supportFreeShoulders?'<label>Shoulder angle from horizontal (°)<input type="number" data-seat-shoulder-angle min="30" max="60" step="any" required value="'+
      esc(hole.shoulderAngle??45)+'"'+disabled+'></label>':''):'')+
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
  root.querySelector('[data-native-fit-preview]').onchange=event=>{
   nativeFitPreviewChoices.set(model.id,event.target.checked);
   refreshNativeFittingPreview(model);
  };
  root.querySelector('[data-pixel-profile-editor]').onclick=()=>{
   const seat=selected>=0&&hole.socketProfile;
   adapter.openPixelProfileEditor(seat?hole.profileId:chosenProfile(model)?.id,false,seat?{
    measurements:{...seat,bodyDiameter:hole.diameter},clearance:hole.clearance,retentionLip:seat.retentionLip,conical:!!hole.conical,
    shoulderAngle:hole.supportFreeShoulders?hole.shoulderAngle??45:null
   }:{shoulderAngle:null});
  };
  root.querySelectorAll('[data-fit-profile]').forEach(button=>button.onclick=()=>{
   const profileId=button.dataset.fitProfile;
   if(selected>=0&&!editPixel(model,selected,applyPixelFittingProfile(holes[selected],profileId,adapter.pixelFitProfiles())))return;
   if(!model.link)commit({build:{...model.build,activePixelProfileId:profileId}});
   renderPalette();
   root.querySelectorAll('[data-fit-profile]').forEach(control=>{if(control.dataset.fitProfile===profileId)control.focus({preventScroll:true});});
  });
  const shaped=root.querySelector('[data-shaped-socket]');
  if(shaped)shaped.onchange=()=>{
   const enabled=shaped.checked;
   if(enabled&&((hole.entryFace!=='underside'&&!hole.hitSurface)||!fit.profile?.bodyHeight)){
    shaped.checked=false;pixelStatus(model,'Place a fitting on its intended installation face and choose a measured profile first.');return;
   }
   const next={...hole};
   if(enabled){
    next.socketProfile={...fit.profile,retentionLip:0};
    next.surface=hole.hitSurface;
   }else{
    delete next.socketProfile;delete next.conical;
    delete next.supportFreeShoulders;delete next.shoulderAngle;
    delete next.surface;
   }
   if(!editPixel(model,selected,next))shaped.checked=!!hole.socketProfile;
  };
  const conical=root.querySelector('[data-seat-conical]');
  if(conical)conical.onchange=()=>{
   const next={...hole,conical:conical.checked};
   conical.checked=!!hole.conical;
   checkAndSaveSeat(model,holes.map((item,index)=>index===selected?next:item),next);
  };
  const shoulders=root.querySelector('[data-seat-shoulders]');
  if(shoulders)shoulders.onchange=()=>{
   const next={...hole,supportFreeShoulders:shoulders.checked};
   shoulders.checked=!!hole.supportFreeShoulders;
   checkAndSaveSeat(model,holes.map((item,index)=>index===selected?next:item),next);
  };
  const angle=root.querySelector('[data-seat-shoulder-angle]');
  if(angle)angle.onchange=()=>{
   const value=angle.valueAsNumber,valid=angle.checkValidity();
   angle.value=hole.shoulderAngle??45;
   if(!valid||!Number.isFinite(value)){
    pixelStatus(model,'Choose a shoulder angle from 30 to 60 degrees from horizontal.');return;
   }
   if(value===Number(angle.value))return;
   const next={...hole,shoulderAngle:value};
   checkAndSaveSeat(model,holes.map((item,index)=>index===selected?next:item),next);
  };
  const lip=root.querySelector('[data-seat-retention]');
  if(lip)lip.onchange=()=>{
   const value=lip.valueAsNumber;
   const valid=lip.checkValidity()&&Number.isFinite(value);
   lip.value=hole.socketProfile.retentionLip;
   if(!valid||value===hole.socketProfile.retentionLip)return;
   const next={...hole,socketProfile:{...hole.socketProfile,retentionLip:value}};
   const candidates=holes.map((item,index)=>index===selected?next:item);
   checkAndSaveSeat(model,candidates,next);
  };
  const armPlacement=(duplicate,shaped=false)=>{
   if(!duplicate&&!chosenProfile(model)){pixelStatus(model,'Import the missing profile or select another before placing.');return;}
   placementModel=model.id;pendingDuplicate=duplicate;placeShaped=shaped;viewport.dataset.nativePlacement='outside';
   renderPalette();viewport.tabIndex=0;viewport.focus({preventScroll:true});
   pixelStatus(model,duplicate?'Click a solid surface to place the duplicate. Escape ends placement.':'Click or tap solid surfaces to place fittings. Use Done or Escape to end placement.');
  };
  root.querySelector('[data-place-pixel]').onclick=()=>armPlacement(null);
  root.querySelector('[data-place-shaped]').onclick=()=>armPlacement(null,true);
  const done=root.querySelector('[data-done-pixel]');
  if(done)done.onclick=()=>{endPixelPlacement();renderPalette();};
  const duplicate=root.querySelector('[data-duplicate-pixel]');
  if(duplicate)duplicate.onclick=()=>armPlacement(holes[selected]);
  root.querySelector('[data-auto-pixel]').onclick=()=>addAutomaticPixel(model);
  root.querySelectorAll('[data-select-pixel]').forEach(button=>button.onclick=()=>selectPixel(model,holes[Number(button.dataset.selectPixel)].id));
  for(const [button,step] of [['[data-pixel-previous]',-1],['[data-pixel-next]',1]]){
   const control=root.querySelector(button);
   if(control)control.onclick=()=>{
    const next=holes.slice();[next[selected+step],next[selected]]=[next[selected],next[selected+step]];
    reorderPixels(model,next,holes[selected].id);
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
    editPixel(model,selected,calibrated.hole,undefined,()=>{
     adapter.notifyPixelProfileLibrary?.();
     redrawPixelEditor();pixelStatus(model,'Saved measured fit to the profile library.');
    },()=>adapter.savePixelFitProfile(calibrated.profile));
   }catch(error){pixelStatus(model,error.message);}
  };
  bindPixelEditor(root,model,holes,profiles);
 }
 async function downloadPixelCoupon(model,hole,options,button){
  if(button)button.disabled=true;
  try{
   const sizes=await adapter.pixelFitCoupon(hole,options);
   if(active()?.id===model.id)pixelStatus(model,'Fit test downloaded. Bore diameters: '+sizes.map(size=>size.toFixed(2)).join(', ')+' mm.');
  }catch(error){if(active()?.id===model.id)pixelStatus(model,error.message);}
  finally{if(button)button.disabled=false;}
 }
 function bindPixelEditor(root,model,holes,profiles){
  bindPixelBuilder(root,{holes,profiles,onAdd:()=>addAutomaticPixel(model),onRemove:index=>removePixel(model,index),
   onEdit:(index,hole)=>{
    const node=document.activeElement,field=node?.dataset.pixelField;
    const selector=field?'[data-pixel-index="'+index+'"][data-pixel-field="'+field+'"]':null;
    return editPixel(model,index,hole,{root,selector});
   }});
 }
 const selectedGearTops=new Map(),gearTopPresetChoices=new Map(),gearTopMessages=new Map();
 function gearTopMessage(model,message){
  gearTopMessages.set(model.id,message);
  const status=$('smsGearTopStatus');
  if(status)status.textContent=message;
  adapter.status(message);
 }
 const gearTops=model=>model.build.gearTopControls||[];
 function gearTopMarkup(model){
  const controls=gearTops(model),selectedId=selectedGearTops.get(model.id)||controls[0]?.id;
  const current=controls.find(item=>item.id===selectedId)||controls[0];
  const disabled=model.link?' disabled':'';
  const opts=(values,currentValue)=>values.map(value=>'<option'+(value===currentValue?' selected':'')+'>'+esc(value)+'</option>').join('');
  const preset=gearTopPresetChoices.get(model.id)||'offset-spindle';
  const names={x:'X position',z:'Z position',width:'Width',depth:'Depth',height:'Height',rotation:'Rotation',joinMm:'Join shoulder size'};
  const help={
   x:'Moves the grip left or right across the gear top in millimetres. Keep the full base on solid material and away from openings.',
   z:'Moves the grip forward or backwards across the gear top in millimetres. Position an offset handle away from the centre shaft.',
   width:'Changes the grip width independently of depth and height. Wider grips give more hand contact but require clear gear stock.',
   depth:'Changes the grip depth independently of width and height. Narrower grips can clear windows, spokes and adjacent fittings.',
   height:'Changes the grip height. A taller lever can increase twisting force at the base, so test actual printed strength.',
   rotation:'Turns an asymmetric wing or rectangular grip around its vertical axis, without rotating the Gear itself.',
   joinMm:'Sets the real added shoulder around the handle root. More shoulder can spread force but needs clear surrounding material.',
   profile:'Shapes the handle along its height: flat, straight, two-thirds bulbous, hourglass, mushroom or rounded top.',
   surface:'Creates actual ribs, scallops, knurl or grooves for more tactile feedback. The nozzle must reproduce their detail.',
   join:'Choose no extra flare, a 45-degree chamfer, or a multi-ring rounded shoulder. Inspect print supports and load direction.',
   add:'Adds a new independently editable top grip. The final connected solid is produced at manufacturing preparation.',
   remove:'Deletes this grip while keeping the underlying cog and its original measured shaft hole.'
  };
  const tip=key=>' data-tooltip-title="'+esc(names[key]||key[0].toUpperCase()+key.slice(1))+'" data-tooltip-body="'+esc(help[key]||'')+'"';
  const numeric=[['x',-150,150,.1],['z',-150,150,.1],['width',8,100,.1],
   ['depth',8,100,.1],['height',6,80,.1],['rotation',-360,360,1],['joinMm',0,5,.1]];
  const fields=current?'<fieldset><legend>Selected grip — exact dimensions</legend>'+
   '<label>Grip<select id="smsGearTopSelect"'+disabled+'>'+controls.map(c=>'<option value="'+esc(c.id)+'"'+(c.id===current.id?' selected':'')+'>'+esc(GEAR_TOP_PRESETS.find(p=>p.id===c.presetId)?.name||c.kind)+' · '+esc(c.id.slice(0,6))+'</option>').join('')+'</select></label>'+
   numeric.map(([key,min,max,step])=>'<label>'+names[key]+' ('+(key==='rotation'?'degrees':'mm')+')<input data-gear-top-field="'+key+'"'+tip(key)+' type="number" min="'+min+'" max="'+max+'" step="'+step+'" value="'+esc(current[key])+'"'+disabled+' title="'+esc(key==='joinMm'?'Widen the joint where grip meets wheel. The shoulder is real printed geometry.':'Edit this dimension independently. Values outside the solid gear are rejected.')+'"></label>').join('')+
   '<label>Profile<select data-gear-top-field="profile"'+tip('profile')+disabled+'>'+opts(TOP_PROFILES,current.profile)+'</select></label>'+
   '<label>Surface texture<select data-gear-top-field="surface"'+tip('surface')+disabled+'>'+opts(TOP_SURFACES,current.surface)+'</select></label>'+
   '<label>Base join<select data-gear-top-field="join"'+tip('join')+disabled+'>'+opts(TOP_JOINS,current.join)+'</select></label>'+
   '<p class="sms-descriptor" id="smsGearTopFieldHelp">Width, depth and height are separate. A round base strengthens the connection; a chamfer can be easier to print. Horizontal grooves, ribs, scallops and diamond texture are real geometry, not visual-only shading. Check their size against your nozzle.</p>'+
   '<details class="sms-panel-details"><summary>Detailed explanations for every grip setting</summary><div>'+Object.entries(help).filter(([key])=>key!=='add'&&key!=='remove').map(([key,description])=>'<p><strong>'+esc(names[key]||key[0].toUpperCase()+key.slice(1))+'</strong> — '+esc(description)+'</p>').join('')+'</div></details>'+
   '<button type="button" id="smsRemoveGearTop"'+tip('remove')+disabled+'>Remove selected grip</button></fieldset>':
   '<p class="sms-descriptor">No grips yet. Select a starting point and add one, or double-click the solid top face in the viewport.</p>';
  return '<details class="sms-panel-details" id="smsGearTopEditor" open><summary>Top handles & tactile knobs<small>Place a grip on your cog, then move it and adjust its shape.</small></summary><div>'+
   '<p class="sms-descriptor" id="smsGearTopHelp">Double-click the flat top of your cog to place the chosen grip. Click a grip to select it; drag it across the top or use the exact X and Z fields. A red preview means the strengthened base would cover a hole, window or outside edge. The original shaft bore remains open through a centred knob after manufacturing preparation.</p>'+
   '<label>New grip preset<select id="smsGearTopPreset"'+disabled+'>'+GEAR_TOP_PRESETS.map(p=>'<option value="'+p.id+'"'+(p.id===preset?' selected':'')+'>'+esc(p.name)+'</option>').join('')+'</select></label>'+
   '<button type="button" id="smsAddGearTop"'+tip('add')+disabled+'>＋ Add selected grip</button>'+
   '<p id="smsGearTopStatus" role="status" aria-live="polite" style="overflow-wrap:anywhere">'+esc(gearTopMessages.get(model.id)||'')+'</p>'+
   '<p class="sms-descriptor">For an off-centre spindle, start away from the shaft. For a centred dial, use X = 0 and Z = 0. These are integral printed grips, not mechanically free-spinning bearings.</p>'+fields+
   '</div></details>';
 }
 function updateGearTop(model,id,change){
  const controls=gearTops(model).map(c=>c.id===id?{...c,...change}:c);
  if(!commit({build:{...model.build,gearTopControls:controls}})){
   gearTopMessage(model,$('smsModelError')?.textContent||'Grip could not be changed.');return false;
  }
  gearTopMessages.delete(model.id);
  selectedGearTops.set(model.id,id);renderEditor();return true;
 }
 function addGearTop(model,point){
  const preset=gearTopPresetChoices.get(model.id)||'offset-spindle';
  const initial=GEAR_TOP_PRESETS.find(p=>p.id===preset);
  const diameter=model.parameters.mode==='Mechanical'
   ?(Math.round(model.parameters.teeth)+2)*model.parameters.module:model.parameters.diameter;
  if(active()?.id!==model.id||model.link)return false;
  if(gearTops(model).length>=8){gearTopMessage(model,'Use up to eight grips per cog. Remove a grip first.');return false;}
  const at=point||{x:initial.kind==='spindle'?Math.round(diameter*.26*10)/10:0,z:0};
  let c=newGearTopControl(newId(),preset,{x:at.x,z:at.z});
  try{
   const recipe=cache.get(model.id)?.recipe;
   if(recipe?.nativeRouting?.enabled)throw Error('Turn off serial routing before adding a tactile top handle.');
   const host=gearTopSafeHost(recipe);
   const issue=gearTopPlacementIssue(c,host,gearTops(model));
   if(issue&&point){gearTopMessage(model,issue+' No grip added.');return false;}
   if(issue){
    c=findGearTopStart(c,host,gearTops(model),at);
    if(!c){gearTopMessage(model,issue+' No suitable automatic position found for this preset. Try a smaller preset or change the cog.');return false;}
   }
   if(!commit({build:{...model.build,gearTopControls:[...gearTops(model),c]}})){
    gearTopMessage(model,($('smsModelError')?.textContent||'Grip could not be added.')+' No grip added.');return false;
   }
   selectedGearTops.set(model.id,c.id);
   gearTopMessages.set(model.id,'Grip added at X '+c.x+' mm, Z '+c.z+' mm.');
   renderEditor();return true;
  }catch(error){gearTopMessage(model,error.message+' No grip added.');return false;}
 }
 function bindGearTopEditor(model){
  const root=$('smsGearTopEditor');if(!root)return;
  const preset=$('smsGearTopPreset');
  preset.onchange=()=>{gearTopPresetChoices.set(model.id,preset.value);gearTopMessages.delete(model.id);if($('smsGearTopStatus'))$('smsGearTopStatus').textContent='';};
  $('smsAddGearTop').onclick=()=>addGearTop(model);
  const selected=$('smsGearTopSelect');
  if(!selected)return;
  selected.onchange=()=>{selectedGearTops.set(model.id,selected.value);renderEditor();};
  const chosen=gearTops(model).find(c=>c.id===selected.value);
  for(const input of root.querySelectorAll('[data-gear-top-field]')){
   input.setAttribute('aria-describedby','smsGearTopFieldHelp');
   input.onchange=()=>{
    if(!chosen)return;
    const key=input.dataset.gearTopField;
    const value=input.type==='number'?input.valueAsNumber:input.value;
    if(input.type==='number'&&!input.reportValidity()){input.value=chosen[key];return;}
    const change={[key]:value};
    if(key==='join'&&value==='None')change.joinMm=0;
    if(!updateGearTop(model,chosen.id,change))input.value=chosen[key];
   };
  }
  $('smsRemoveGearTop').onclick=()=>{
   const controls=gearTops(model).filter(c=>c.id!==chosen.id);
   if(commit({build:{...model.build,gearTopControls:controls}})){
    gearTopMessages.delete(model.id);selectedGearTops.set(model.id,controls[0]?.id);renderEditor();
   }
  };
 }
 let gearTopGesture=null;
 const gearPointer=(event)=>{
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
  partRay.setFromCamera(pointer,camera);
 };
 const activeGearForPointer=()=>{
  const model=active();
  return mode==='model'&&stage==='design'&&model?.generator.typeId==='gears'&&!model.link?model:null;
 };
 renderer.domElement.addEventListener('dblclick',event=>{
  const model=activeGearForPointer();
  if(!model||event.button!==0)return;
  gearPointer(event);
  const group=cache.get(model.id)?.group;
  if(!group)return;
  const hit=partRay.intersectObjects(group.children.filter(mesh=>mesh.isMesh&&mesh.visible&&!mesh.userData.previewOnly),false)[0];
  if(!hit){gearTopMessage(model,'Double-click solid material on the flat cog top, not a hole or empty space.');return;}
  event.preventDefault();event.stopImmediatePropagation();
  if(hit.object.userData.gearTopId){
   selectedGearTops.set(model.id,hit.object.userData.gearTopId);renderEditor();return;
  }
  if(Math.abs(hit.point.y-model.parameters.thickness)>1.2||hit.face?.normal.y<.7){
   gearTopMessage(model,'Double-click an exposed, flat gear top; raised rails and side faces are not yet supported.');return;
  }
  addGearTop(model,{x:Math.round(hit.point.x*10)/10,z:Math.round(hit.point.z*10)/10});
 },true);
 renderer.domElement.addEventListener('pointerdown',event=>{
  const model=activeGearForPointer();
  if(!model||event.button!==0)return;
  gearPointer(event);
  const mesh=partRay.intersectObjects(cache.get(model.id)?.group?.children||[],false)
   .find(hit=>hit.object.visible&&hit.object.userData.gearTopId)?.object;
  if(!mesh)return;
  const control=gearTops(model).find(c=>c.id===mesh.userData.gearTopId);
  if(!control)return;
  event.preventDefault();event.stopImmediatePropagation();
  selectedGearTops.set(model.id,control.id);renderEditor();
  gearTopGesture={id:event.pointerId,model,control,mesh,candidate:null,issue:null,
   start:[event.clientX,event.clientY]};
  renderer.domElement.setPointerCapture(event.pointerId);
 },true);
 renderer.domElement.addEventListener('pointermove',event=>{
  const gesture=gearTopGesture;
  if(!gesture||gesture.id!==event.pointerId)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(Math.hypot(event.clientX-gesture.start[0],event.clientY-gesture.start[1])<3)return;
  gearPointer(event);
  const point=partRay.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),
   -gesture.model.parameters.thickness),new THREE.Vector3());
  if(!point)return;
  const candidate={...gesture.control,x:Math.round(point.x*10)/10,z:Math.round(point.z*10)/10};
  const issue=gearTopPlacementIssue(candidate,cache.get(gesture.model.id)?.recipe?.gearHost,
   gearTops(gesture.model).filter(c=>c.id!==gesture.control.id));
  gesture.candidate=issue?null:candidate;gesture.issue=issue;
  gesture.mesh.position.set(candidate.x-gesture.control.x,0,candidate.z-gesture.control.z);
  gesture.mesh.material.emissive?.setHex(issue?0x9b1528:0x075b43);
  adapter.status(issue||'Valid grip position. Release to place.');
 },true);
 function finishGearDrag(event){
  const gesture=gearTopGesture;
  if(!gesture||gesture.id!==event.pointerId)return;
  gearTopGesture=null;
  event.preventDefault();event.stopImmediatePropagation();
  if(renderer.domElement.hasPointerCapture(event.pointerId))renderer.domElement.releasePointerCapture(event.pointerId);
  gesture.mesh.position.set(0,0,0);gesture.mesh.material.emissive?.setHex(0);
  if(event.type==='pointercancel'){adapter.status('Grip move cancelled; previous position preserved.');return;}
  if(gesture.candidate&&active()?.id===gesture.model.id)
   updateGearTop(gesture.model,gesture.control.id,{x:gesture.candidate.x,z:gesture.candidate.z});
  else if(gesture.issue)adapter.status(gesture.issue+' No change saved.');
 }
 renderer.domElement.addEventListener('pointerup',finishGearDrag,true);
 renderer.domElement.addEventListener('pointercancel',finishGearDrag,true);

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
    const item=document.createElement('button');item.className='sms-tile';
    item.setAttribute('aria-label',model.name);
    item.append(savedModelPicture(model,project.id,{allowRetry:false}),model.name);
    item.onclick=()=>switchModel(model.id);root.append(item);
   }
   for(const saved of state.savedProjects.filter(item=>item.title.toLowerCase().includes(query))){
    const item=document.createElement('button');item.textContent='Open project: '+saved.title;item.onclick=()=>{if(!confirm('Open this project and save a copy of the current project?'))return;saveProjectSnapshot(saved);};root.append(item);
   }
   if(!root.children.length)root.textContent='No matching work. Clear search or create a model.';
  };
  $('smsHomeSearch').oninput=render;render();
 }
 function renderPalette(){
  patternViewport.clear();
  if(!shell||mode!=='model')return;
  const model=active(),family=registry.get(model.generator.typeId);
  const build=model.generator.typeId==='crystals'?document.querySelector('.workspace-tabs [data-tab=build]').classList.contains('active'):stage==='build';
  document.body.dataset.studioBuildHome=buildWorkspace;
  const root=shell.palette;root.replaceChildren();
  if(model.generator.typeId!=='crystals')refreshNativeFittingPreview(model);
  const heading=document.createElement('h2');
  heading.textContent=build?({build:'Build tools',pixels:'Pixels',wiring:'Wiring',mounting:'Mounting'}[buildWorkspace]):'Design choices';root.append(heading);
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
    visualRange(region,{key,label,min:axis===1?0:-50,max:50,step:.1,unit:'mm',default:0},offset[axis],value=>{
     const next=[...offset];next[axis]=Number(value);
     if(!applyPartOffset(model,id,next))return false;
     shell.palette.querySelector('[data-palette-key="'+key+'"]')?.focus({preventScroll:true});
     return true;
    },!!model.link);
   }
  }
  const addAction=(label,target,after)=>{
   if(!target)return;
   const button=document.createElement('button');button.type='button';button.textContent=label;button.disabled=target.disabled||!!model.link;
   button.dataset.toolAction=target.id;
   button.onclick=()=>{target.click();after?.();};controls.append(button);
  };
  if(build&&buildWorkspace==='build'){
   if(model.generator.typeId!=='crystals')renderFittingBacking(controls,model);
   else{
    const baseHeight=document.querySelector('[data-state=baseHeight]');
    visualRange(controls,{key:'crystal-base-height',label:'Base height',min:Number(baseHeight.min),
     max:Number(baseHeight.max),step:Number(baseHeight.step),unit:'mm',default:Number(adapter.formationDefaults().baseHeight)},Number(baseHeight.value),value=>{
     baseHeight.value=value;
     baseHeight.dispatchEvent(new Event('input',{bubbles:true}));
     baseHeight.dispatchEvent(new Event('change',{bubbles:true}));
     return true;
    },!!model.link);
    addAction('Fit base to pixel sockets',$('fitPixelBaseBtn'),renderPalette);
   }
   const destinations=document.createElement('div');destinations.className='sms-actions';
   for(const [id,label] of [['pixels','Pixels'],['wiring','Wiring'],['mounting','Mounting']]){
    const button=document.createElement('button');button.type='button';button.textContent=label;
    button.onclick=()=>openBuildWorkspace(id);destinations.append(button);
   }
   controls.append(destinations);
  }else if(build&&model.generator.typeId==='crystals'&&buildWorkspace==='wiring'){
   renderCrystalWirePalette(controls);
  }else if(build&&model.generator.typeId==='crystals'&&buildWorkspace==='mounting'){
   addAction('Place mounting hole',$('placeMountBtn'));
  }else if(build&&model.generator.typeId!=='crystals'&&buildWorkspace==='mounting'){
   renderMountPalette(controls,model);
   const status=document.createElement('p');status.dataset.pixelStatus='';status.setAttribute('role','status');
   status.textContent=pixelMessages.get(model.id)||'';controls.append(status);
  }else if(build&&model.generator.typeId!=='crystals'&&buildWorkspace==='wiring'){
   appendNativeRouting(controls,model);
  }else if(build){
   if(model.generator.typeId==='crystals'){
    addAction('Create / edit pixel profile',$('editPixelProfileBtn'));
    addAction('Add pixel',$('placePixelBtn'));
    addAction('Print a pixel fit test',$('calibrationBtn'));
    renderActivePixelProfile(controls,model);
    const origin=document.querySelector('[data-state="showPixels"]');
    const label=document.createElement('label'),toggle=document.createElement('input'),status=document.createElement('output');
    toggle.type='checkbox';toggle.dataset.crystalFitPreview='';toggle.checked=origin.checked;toggle.disabled=!!model.link;
    toggle.onchange=()=>origin.click();
    label.append(toggle,' Show physical pixels and socket cutters');
    status.dataset.buildFitPreviewStatus='';status.setAttribute('aria-live','polite');
    status.textContent=$('pixelFittingPreviewStatus')?.textContent||'';
    controls.append(label,status);
    const shoulderSetting=document.querySelector('[data-state="socketSupportFreeShoulders"]');
    const shoulderLabel=document.createElement('label'),shoulderToggle=document.createElement('input');
    shoulderToggle.type='checkbox';shoulderToggle.checked=shoulderSetting.checked;shoulderToggle.disabled=!!model.link;
    shoulderToggle.onchange=()=>{
     shoulderSetting.click();
     renderPalette();
     shell.palette.querySelector('[data-crystal-shoulders]')?.focus({preventScroll:true});
    };
    shoulderToggle.dataset.crystalShoulders='';
    shoulderLabel.append(shoulderToggle,' Support-Free Shoulders');
    controls.append(shoulderLabel);
    if(shoulderSetting.checked){
     const angle=document.querySelector('[data-state="socketShoulderAngle"]');
     visualRange(controls,{key:'socketShoulderAngle',label:'Shoulder angle from horizontal',min:30,max:60,step:1,unit:'°',default:45},angle.value,value=>{
      angle.value=value;
      angle.dispatchEvent(new Event('input',{bubbles:true}));angle.dispatchEvent(new Event('change',{bubbles:true}));
     },!!model.link);
    }
    renderCrystalPixelPalette(controls,model);
   }else{
    renderPixelPalette(controls,model);
    renderActivePixelProfile(controls,model);
   }
  }else if(model.generator.typeId==='crystals'){
   for(const [key,label] of [['count','Crystal count'],['spacing','Crystal spacing'],['width','Cluster width']]){
    const original=document.querySelector('input[data-state="'+key+'"]');
    if(original)visualRange(controls,{key,label,min:original.min,max:original.max,step:original.step,default:adapter.formationDefaults()[key]},original.value,value=>{
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
     ...(['Rotary knob','Rotary selector'].includes(style)?['knobInstallation','gripProfile','gripCount','gripDepth']:[]),
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
     visualRange(controls,{...field,helpFamily:model.generator.typeId},parameters[key],value=>apply(key,Number(value)),!!model.link);
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
  if(build&&buildWorkspace==='build'){
   const crystal=family.typeId==='crystals';
   const readCrystal=key=>{
    const node=document.querySelector('[data-state="'+key+'"]');
    return node?.type==='checkbox'?node.checked:node?.type==='range'?Number(node.value):node?.value;
   };
   const settings=crystal
    ?normaliseEdgeFinish({enabled:!!readCrystal('edgeFinishEnabled'),
      style:readCrystal('edgeFinishStyle'),scope:readCrystal('edgeFinishScope'),
      amountMm:readCrystal('edgeFinishAmount'),steps:readCrystal('edgeFinishSteps')})
    :normaliseEdgeFinish(model.build.edgeFinish);
   const section=document.createElement('fieldset');section.className='sms-edge-finishing';
   section.setAttribute('aria-label','Edge finishing');
   const legend=document.createElement('legend');legend.textContent='Edge finishing';
   const help=document.createElement('p');help.className='sms-descriptor';
   help.textContent='Apply a small 45° chamfer to exposed flat upper rims, including spoke windows and shaft holes. Undersides and separate pixel/wiring/fixing cutters stay unchanged; nonplanar ridges are left alone. Check Cura.';
   section.append(legend,help);
   const applyFinish=(key,value)=>{
    if(crystal){
     const mapped={enabled:'edgeFinishEnabled',style:'edgeFinishStyle',scope:'edgeFinishScope',
      amountMm:'edgeFinishAmount',steps:'edgeFinishSteps'}[key];
     const node=document.querySelector('[data-state="'+mapped+'"]');
     if(!node)return false;
     if(node.type==='checkbox')node.checked=!!value;else node.value=value;
     node.dispatchEvent(new Event('input',{bubbles:true}));
     node.dispatchEvent(new Event('change',{bubbles:true}));
     renderPalette();return true;
    }
    const next=normaliseEdgeFinish({...settings,[key]:value});
    if(!commit({build:{...model.build,edgeFinish:next}}))return false;
    renderEditor();renderPalette();return true;
   };
   const toggleLabel=document.createElement('label');
   const toggle=document.createElement('input');toggle.type='checkbox';toggle.dataset.edgeFinish='enabled';
   toggle.checked=settings.enabled;toggle.disabled=!!model.link;
   toggle.onchange=()=>{if(!applyFinish('enabled',toggle.checked))toggle.checked=settings.enabled;};
   toggleLabel.append(toggle,' Bevel touchable top edges');section.append(toggleLabel);
   visualRange(section,{key:'edge-finish-amount',label:'Edge amount',min:.1,max:4,step:.1,unit:'mm',default:EDGE_FINISH_DEFAULTS.amountMm},
    settings.amountMm,value=>applyFinish('amountMm',Number(value)),!!model.link);
   controls.append(section);
  }
  shell.searchSettings();
 }
 function visualRange(root,field,value,apply,disabled){
  return renderPrecisionRange(root,field,value,apply,disabled);
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
   '<div class="sms-actions"><button id="smsUndo">Undo</button><button id="smsRedo">Redo</button><button id="smsDuplicate">Duplicate</button><button id="smsSaveModel">Save to Library</button><button id="smsSaveModelAs">Save as new model…</button></div>'+
   (stage==='design'?'<label>Starting point<select id="smsPreset"><option value="">Choose a preset…</option>'+g.presets.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('')+'</select></label>'+designSections(g,model)+(g.typeId==='gears'?gearTopMarkup(model):'')+partEditor(model):
    ((!shell||buildWorkspace==='build')&&g.capabilities.supportsBase?details('Base and backing','Add a flat backing and set its thickness.','<label><input type="checkbox" data-build="base" '+(model.build.base?'checked':'')+'> Integrated flat base</label><label>Base thickness (mm)<input type="number" data-build="baseThickness" value="'+(model.build.baseThickness||3)+'" min="2" max="15"></label>'):'')+((!shell||buildWorkspace==='mounting')&&g.capabilities.supportsMounting?details('Automatic screw pair','Set the separate two-hole preset.','<label><input type="checkbox" data-build="mounting" '+(model.build.mounting?'checked':'')+'> Two mounting holes</label><label>Fixing profile<select data-build="mountStyle">'+['Through holes','Underside counterbores','Underside countersinks'].map(value=>'<option'+(model.build.mountStyle===value?' selected':'')+'>'+value+'</option>').join('')+'</select></label><label>Hole diameter (mm)<input type="number" data-build="holeDiameter" value="'+(model.build.holeDiameter||3.4)+'" min="2" max="8" step=".1"></label>'):'')+((!shell||buildWorkspace==='build')&&g.capabilities.supportsLEDs?details('Lighting and cable access','Set the cavity and opening in Design.','<p>Use the Light and materials and Holes and fittings sections to size the cavity and cable exit.</p>'):'')+(!shell?details('Pixel holes','Place and size holes to fit real pixels.',pixelBuilderMarkup(model,esc,fittingProfiles())):'') )+
   '<div id="smsModelError" class="sms-descriptor" role="status"></div>';
  $('smsModelName').onchange=e=>commit({name:e.target.value.trim()||g.displayName});
  if($('smsDesign'))$('smsDesign').onclick=()=>{stage='design';renderTabs();renderEditor();};if($('smsBuild'))$('smsBuild').onclick=()=>{stage='build';renderTabs();renderEditor();};if($('smsSend'))$('smsSend').onclick=()=>send(model.id);
  $('smsDuplicate').onclick=()=>{const duplicate=duplicateModel(project,model.id);switchModel(duplicate.id);};$('smsSaveModel').onclick=()=>saveModel(model);
  $('smsSaveModelAs').onclick=()=>saveModelAs(model);
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
  panel.querySelectorAll('[data-build]').forEach(input=>{
   const checkbox=input.type==='checkbox';
   let accepted=checkbox?input.checked:input.value;
   const restore=()=>{if(checkbox)input.checked=accepted;else input.value=accepted;};
   input.onchange=()=>{
    const value=checkbox?input.checked:input.value;
    const valid=input.type!=='number'||(Number.isFinite(input.valueAsNumber)&&
     !input.validity.rangeUnderflow&&!input.validity.rangeOverflow);
    if(!valid){
     $('smsModelError').textContent=input.validationMessage||'Enter a number within the allowed range.';
     restore();return;
    }
    const build={...model.build,[input.dataset.build]:input.type==='number'?input.valueAsNumber:value};
    const apply=()=>{if(commit({build}))accepted=value;restore();};
    if(build.mounting&&g.capabilities.supportsMounting&&['Underside counterbores','Underside countersinks'].includes(build.mountStyle)){
     restore();
     checkFittingBuild(model,build,apply,{
      report:message=>{$('smsModelError').textContent=message;},
      pending:'Checking material around the recessed fixings…'
     });
    }else apply();
   };
  });
  bindPartEditor(model);
  if(g.typeId==='gears'&&stage==='design')bindGearTopEditor(model);
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
  try{if(model.generator.typeId==='crystals'&&model.id===currentId&&mode==='model')captureCrystal();
   const record=state.library.find(r=>r.id===model.id);saveLibraryRevision(state.library,model,{expectedRevision:record?.versions.at(-1)?.revision||0});save();adapter.status('Saved '+model.name+' to your reusable library.');
  }catch(error){adapter.status(error.message);}
 }
 function saveModelAs(model){
  const name=prompt('Name the new saved model',model.name)?.trim();
  if(!name)return false;
  try{
   if(model.generator.typeId==='crystals'&&model.id===currentId&&mode==='model')captureCrystal();
   const now=new Date().toISOString();
   const saved={...model,id:newId(),name,revision:1,createdAt:now,updatedAt:now,link:null};
   saveLibraryRevision(state.library,saved);
   save();adapter.status('Saved '+name+' as a new model.');
   return true;
  }catch(error){adapter.status(error.message);return false;}
 }
 function showLibrary(){captureCrystal();mode='library';overlay.hidden=false;document.body.classList.add('sms-sidebar-mode');panel.hidden=false;
  panel.innerHTML='<h2>Library</h2><p class="sms-descriptor">Your models, starting points and complete projects.</p><label>Search<input id="smsSearch" value="'+esc(search)+'"></label><label>Model type<select id="smsFilter"><option value="all">All types</option>'+registry.list().map(g=>'<option value="'+g.typeId+'" '+(filter===g.typeId?'selected':'')+'>'+esc(g.displayName)+'</option>').join('')+'</select></label><button id="smsBrowseModels">Browse model starting points</button><button id="smsDemo">Open Wonder Trunks examples</button><button id="smsSaveProject">Save project to Library</button><button id="smsBackup">Download complete backup</button><label>Restore backup or old Crystal JSON<input id="smsImport" type="file" accept=".json"></label><p class="sms-descriptor">Connect your private GitHub repository in a Crystal model’s saved-project controls. Your token stays in memory.</p>';
  const syncActions=document.createElement('details');syncActions.innerHTML='<summary>Backups &amp; Recovery</summary>';syncActions.open=true;syncActions.insertAdjacentHTML('beforeend','<div class="sms-actions"><button id="smsCloudPush">Upload studio backup</button><button id="smsCloudPull">Check private backup</button></div><p id="smsSyncState" role="status">Saved locally</p><p>On another computer, connect the same private repository through a Crystal model’s saved-project controls. Check the backup, review the differences and choose what to recover. For offline recovery, download a complete backup and restore its JSON file.</p><div id="smsRecoveryList"></div>');panel.append(syncActions);
  syncActions.append($('smsBackup'),$('smsImport').parentElement);
  renderRecoveryList();
  recoveryStatus(adapter.vault()?.connected?'Private repository connected. Check the backup before recovering or uploading.':'Local only. Connect a private repository to use cross-device backup.');
  $('smsCloudPush').onclick=()=>syncStudio(false);$('smsCloudPull').onclick=()=>syncStudio(true);
  $('smsSearch').oninput=e=>{search=e.target.value;renderLibraryCards();};$('smsFilter').onchange=e=>{filter=e.target.value;renderLibraryCards();};
  $('smsBrowseModels').onclick=openPicker;$('smsDemo').onclick=demo;$('smsSaveProject').onclick=()=>{if(saveProjectSnapshot())renderLibraryCards();};$('smsBackup').onclick=backup;$('smsImport').onchange=importFile;
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
   writeWorkspace({...state,organisation:valid});
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
  overlay.innerHTML='<h1>Your model library</h1><section id="smsTemplateSection" aria-labelledby="smsTemplateHeading"><h2 id="smsTemplateHeading">Templates</h2><section id="smsBuiltInTemplates"></section><h3>Reusable templates</h3><div id="smsReusableTemplates" class="sms-grid"></div></section><section id="smsProjectsSection" aria-labelledby="smsProjectsHeading"><h2 id="smsProjectsHeading">Projects</h2><div id="smsSavedProjects"></div></section><section id="smsSavedModelsSection" aria-labelledby="smsSavedModelsHeading"><h2 id="smsSavedModelsHeading">Saved models</h2><div id="smsSavedModels" class="sms-grid"></div></section>';
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
  $('smsTemplateSection').hidden=!templatesOnly&&(favouritesOnly||!!collectionFilter);
  $('smsProjectsSection').hidden=$('smsSavedModelsSection').hidden=templatesOnly;
  if(!$('smsTemplateSection').hidden){
   renderBuiltInTemplates($('smsBuiltInTemplates'));
   renderTemplates(org,$('smsReusableTemplates'));
  }
  if(templatesOnly)return;
  const matches=m=>(filter==='all'||m.generator.typeId===filter)&&(!search||m.name.toLowerCase().includes(search.toLowerCase()));
  function card(model,root,libraryRecord=null){
   const tile=document.createElement('article');tile.className='sms-tile';
   const generator=registry.list().find(g=>g.typeId===model.generator.typeId);
   const current=!libraryRecord&&model.id===project.activeTab;
   const status=[current?'Current model':'',!libraryRecord&&model.link?'Linked copy':''].filter(Boolean).join(' · ');
   if(current)tile.setAttribute('aria-current','true');
   tile.dataset.modelTheme=model.generator.typeId;
   tile.innerHTML='<h3>'+esc(model.name)+'</h3><p class="sms-descriptor">'+esc(generator?.displayName||model.generator.typeId)+' · revision '+(libraryRecord?.versions.at(-1).revision||model.revision)+(status?' · '+status:'')+'</p><div class="sms-actions"></div>';
   const preview=savedModelPicture(model,libraryRecord?'library':project.id);
   const actions=tile.querySelector('.sms-actions');
   const action=(name,fn)=>{const b=document.createElement('button');b.textContent=name;b.onclick=fn;actions.append(b);};
   if(!libraryRecord){action('Open',()=>switchModel(model.id));action('Save to library',()=>{saveModel(model);renderLibraryCards();});
    action('Save as new model…',()=>{if(saveModelAs(model))renderLibraryCards();});
    action('Duplicate',()=>{const m=duplicateModel(project,model.id);switchModel(m.id);});}
   else{
    action('Independent copy',()=>{const m=insertLibraryModel(project,state.library,libraryRecord.id);switchModel(m.id);});
    action('Linked copy',()=>{const m=insertLibraryModel(project,state.library,libraryRecord.id,{linked:true});switchModel(m.id);});
    organisationActions(actions,'model',libraryRecord.id,libraryRecord.versions.at(-1).revision);
    if(libraryRecord.versions.length>1)action('Older revision',()=>{const versions=libraryRecord.versions;const chosen=prompt('Revision to open ('+versions.map(v=>v.revision).join(', ')+')',String(versions.at(-2).revision));if(chosen){const m=insertLibraryModel(project,state.library,libraryRecord.id,{revision:Number(chosen)});switchModel(m.id);}});
   }
   action('Export editable JSON',()=>adapter.download(new Blob([JSON.stringify(model,null,2)],{type:'application/json'}),model.generator.typeId+'-model.json'));
   libraryCard(overlay,tile,preview,actions,tile.querySelector('h3'));
   root.append(tile);
  }
  state.library.filter(r=>includesItem('model',r.id)&&matches(r.versions.at(-1).model)).forEach(r=>card(r.versions.at(-1).model,$('smsSavedModels'),r));
  if(!$('smsSavedModels').childElementCount)$('smsSavedModels').textContent='No matching items.';
  const snapshots=new Map(state.savedProjects.map(saved=>[saved.snapshotId,saved]));
  const activeModels=!favouritesOnly&&!collectionFilter?project.models.filter(matches):null;
  for(const folder of listProjectFolders(state)){
   const versions=folder.snapshots.filter(saved=>includesItem('project',saved.snapshotId)&&saved.title.toLowerCase().includes(search.toLowerCase())&&
    (filter==='all'||saved.models.some(model=>model.family===filter)));
   if(!versions.length&&!(folder.current&&activeModels))continue;
   const details=document.createElement('details');
   details.className='sms-project-folder';details.dataset.projectId=folder.id;
   const viewKey='sms-project-folder:'+folder.id;
   try{details.open=sessionStorage.getItem(viewKey)!=='closed';}catch{details.open=true;}
   const summary=document.createElement('summary');
   summary.textContent=folder.title+(folder.current?' · Active project':'')+' · '+versions.length+' saved '+(versions.length===1?'version':'versions');
   summary.onclick=()=>{
    try{sessionStorage.setItem(viewKey,details.open?'closed':'open');}catch{/* The folder still opens in this view. */}
   };
   details.append(summary);
   if(folder.current&&activeModels){
    const heading=document.createElement('h3');heading.textContent='Models in '+folder.title;
    const grid=document.createElement('div');grid.id='smsProjectModels';grid.className='sms-grid';
    activeModels.forEach(model=>card(model,grid));
    if(!activeModels.length)grid.textContent='No matching models.';
    details.append(heading,grid);
   }
   if(versions.length){
    const heading=document.createElement('h3');heading.textContent='Saved versions';
    const grid=document.createElement('div');grid.className='sms-grid';
    versions.forEach(version=>savedProjectCard(snapshots.get(version.snapshotId),grid,folder.snapshots.indexOf(version)+1));
    details.append(heading,grid);
   }
   $('smsSavedProjects').append(details);
  }
  if(!$('smsSavedProjects').childElementCount)$('smsSavedProjects').textContent='No matching projects.';
 }
 function savedProjectCard(saved,root,version){
   const tile=document.createElement('article');tile.className='sms-tile';tile.dataset.snapshotId=saved.snapshotId;
   const cover=saved.models[0];
   const count=saved.models.length;
   tile.innerHTML='<h3>'+esc(saved.title)+'</h3><p class="sms-descriptor">'+'Saved version '+version+' · '+count+' '+(count===1?'model':'models')+'</p><div class="sms-actions"><button type="button">Open project</button></div>';
   const preview=cover?savedModelPicture(cover,saved.snapshotId):modelPicture(null);
   const button=tile.querySelector('.sms-actions button');
   button.setAttribute('aria-label','Open project '+saved.title);
   button.onclick=()=>{
    if(!confirm('Open this saved project? Your current project will be kept as a saved copy.'))return;
    saveProjectSnapshot(saved);
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
   libraryCard(overlay,tile,preview,tile.querySelector('.sms-actions'),tile.querySelector('h3'));
   root.append(tile);
 }
 function renderBuiltInTemplates(section){
  const grid=document.createElement('div');grid.className='sms-grid';
  for(const family of registry.list()){
   if(['svg-artwork','imported-mesh'].includes(family.typeId)||(filter!=='all'&&family.typeId!==filter)||
      (search&&!family.displayName.toLowerCase().includes(search.toLowerCase())))continue;
   const tile=document.createElement('article');tile.className='sms-tile sms-picker-tile';tile.dataset.modelTheme=family.typeId;
   const button=document.createElement('button');button.type='button';button.className='sms-picker-choice';
   button.setAttribute('aria-label','New '+family.displayName+' from template');
   button.textContent='Create model';
   button.onclick=()=>{
    const create=name=>{add(family.typeId,null,name);document.querySelector('.workspace-tabs [data-tab=design]').click();};
    if(shell)requestModelName('Name new model',family.displayName,create);else create(family.displayName);
   };
   const title=document.createElement('h3');title.textContent=family.displayName;
   const actions=document.createElement('div');actions.className='sms-actions';actions.append(button);
   tile.append(title,actions);
   libraryCard(overlay,tile,startingPointPicture(family),actions,title);grid.append(tile);
  }
  if(!grid.childElementCount)return;
  const heading=document.createElement('h2');heading.textContent='Built-in templates';
  const description=document.createElement('p');description.textContent='Choose a template to start a fresh model.';
  section.append(heading,description,grid);
 }
 function renderTemplates(org,grid){
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
   const cover=template.kind==='model'?source:source?.models[0];
   const preview=cover?savedModelPicture(cover,template.sourceId):modelPicture(null);
   tile.append(title,status);
   const controls=document.createElement('div');controls.className='sms-actions';tile.append(controls);
   const action=(name,handler)=>{
    const button=document.createElement('button');button.type='button';button.textContent=name;button.onclick=handler;controls.append(button);
   };
   if(source&&template.kind==='model')for(const [name,linked] of [['Independent copy',false],['Linked copy',true]])action(name,()=>{
    const model=insertLibraryModel(project,state.library,template.sourceId,{revision:template.revision,linked});switchModel(model.id);
   });
   if(source&&template.kind==='project')action('Create project from template',()=>{
    if(!confirm('Create a new project from this template? Your current project will be saved as a recoverable copy.'))return;
    saveProjectSnapshot(templateProject(source));
   });
   action('Remove template',()=>{if(confirm('Remove this template? Its source stays in the Library.'))editOrganisation(next=>{next.templates=next.templates.filter(t=>t.id!==template.id);});});
   libraryCard(overlay,tile,preview,controls,title);
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
   const choice={mode:strategy.value,selection:selection.value};
   apply.disabled=cancel.disabled=selection.disabled=strategy.disabled=true;
   status.textContent='Preparing recovery preview…';
   try{
    const initial=JSON.stringify(state);
    const {candidate,importedModels,importedProjects}=await reconcileArchive(state,remote,choice);
    if(JSON.stringify(state)!==initial)throw Error('Local work changed during recovery. Review the backup again.');
    assertWorkspaceVersion(localStorage,savedWorkspace);
    const key=RECOVERY_PREFIX+Date.now()+'-'+newId();
    if(JSON.stringify(candidate)!==initial){
     let restoreProfileLibrary;
     try{
      // The browser library must be durable before any recovered model can
      // reference the restored custom IDs. A failed workspace write rolls it back.
      if(candidate.pixelProfiles)restoreProfileLibrary=adapter.installPixelProfileLibrary?.(candidate.pixelProfiles);
      commitRecovery(localStorage,state,candidate,key,savedWorkspace);
     }catch(error){
      try{restoreProfileLibrary?.();}catch(rollbackError){
       throw Error('Recovery needs attention: '+rollbackError.message+'. Original backup unchanged.',{cause:error});
      }
      throw error;
     }
     savedWorkspace=JSON.stringify(candidate);
     clearTimeout(saveTimer);dirty=false;$('smsSaveState').textContent='Saved locally';
     for(const field of ['library','savedProjects','organisation','legacyTemplates','pixelProfiles'])
      if(candidate[field]!==undefined)state[field]=candidate[field];
    }
    if(choice.selection==='all')acknowledge();
    dialog.close();if(mode==='library'){renderLibraryCards();renderRecoveryList();}
    recoveryStatus('Recovery complete · '+importedModels+' Library records · '+importedProjects+' projects added.');
   }catch(error){status.textContent=error.message;apply.disabled=cancel.disabled=selection.disabled=strategy.disabled=false;}
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
    captureCrystal();state.pixelProfiles=copy(adapter.pixelFitProfiles?.()||state.pixelProfiles||[]);
    validateArchive(state);saveImmediately();
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
  $('smsCura').onclick=()=>downloadCuraSettings(printJobCura(project.printer));
  $('smsPrepareAll').onclick=()=>{for(const job of project.printJobs.filter(j=>!currentPrintResult(j)&&j.status!=='preparing'))prepare(job.id);};$('smsPrintBackup').onclick=backup;
  renderTabs();renderJobs();
 }
 function curaOptions(p){return {machine:p.printer,nozzle:p.curaNozzle,material:p.curaMaterial,quality:p.curaQuality,intent:p.curaIntent||'balanced',qualityType:'auto'};}
 const stockCuraNeedsManualSettings=p=>p.printer==='Ultimaker 2+'&&p.curaMaterial==='PETG';
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
 function preparedSizes(result){
  if(!printSizes.has(result))printSizes.set(result,{
   combined:preparedDimensionsMm(result),
   perBody:result.bodies.length>1?
    result.bodies.map(({role})=>({role,size:preparedDimensionsMm(result,role)})):[]
  });
  return printSizes.get(result);
 }
 const preparedSize=result=>preparedSizes(result).combined;
 function printEnvelope(result,settings){
  if(!result)return '';
  const size=preparedSize(result);
  const bed=settings.printer==='Ultimaker 2+'?[223,223,205]:settings.printer==='Ultimaker 3 Extended'?[215,215,300]:null;
  const warning=bed&&size.some((n,i)=>n>bed[i])?' — Warning: exceeds printer envelope. Check scale and orientation in Cura.':'';
  return 'Prepared X × Y × Z: '+size.map(n=>n.toFixed(1)).join(' × ')+' mm'+warning;
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
    card.append(savedModelPicture(model,project.id),name);
    if(!project.printJobs.some(job=>job.modelId===model.id)){
     const start=document.createElement('button');start.textContent='Prepare current model';start.dataset.prepareCurrent='';
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
   const advisory=stockCuraNeedsManualSettings(settings)?'Stock Cura has no Generic PETG profile for the Ultimaker 2+. Use the manual settings with a compatible material definition.':
    settings.printer==='Custom / other'?'Custom printer: enter settings manually in Cura.':
    settings.printer==='Ultimaker 3 Extended'&&settings.curaNozzle===.6?'UM3 has no standard AA 0.6 mm core. Select a supported core for a Cura profile.':'';
   tile.innerHTML='<h3>'+esc(model.name)+'</h3><p>'+esc(family)+' · source revision '+model.revision+
    (result?' · prepared revision '+job.preparedRevision:'')+'</p><p><strong>'+state+'</strong></p>'+
    '<p role="status" data-job-progress>'+esc(job.error||(preparing?job.progress:'')||'')+'</p>'+
    '<p class="sms-descriptor">'+esc(printEnvelope(result,settings))+'</p>'+
    (result?preparedSizes(result).perBody.map(({role,size})=>
     '<p class="sms-descriptor">Prepared '+esc(role)+' STL X × Y × Z: '+size.map(n=>n.toFixed(2)).join(' × ')+' mm</p>').join(''):'')+
    (result?.report.wireOverLengthCount?'<p>Some cable runs need longer wires. Check the route measurements in Build.</p>':'')+
    '<p>'+esc(block||'Downloads available.')+'</p>'+
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
    '<button data-job-cancel>Cancel</button><button data-job-export>Download production ZIP</button><button data-job-stl>Download STL</button><button data-job-3mf>Download 3MF</button><button data-job-cura>'+
    (advisory?'Download Cura settings':'Download Cura profile')+'</button><button data-job-remove>Remove</button></div>';
   tile.prepend(savedModelPicture(model,project.id));
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
   action('export',!!block,()=>exportJob(job.id,'pack'));
   action('stl',!!block,()=>exportJob(job.id,'stl'));
   action('3mf',!!block,()=>exportJob(job.id,'3mf'));
   action('cura',!!block,()=>exportJob(job.id,'cura'));
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
   worker.onerror=event=>{
    event.preventDefault();
    finish(event.message||(job.progress?'Preparation worker stopped during: '+job.progress+'.':'Preparation worker failed to start. Reload Studio and retry.'));
   };
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
 function printJobCura(settings){
  try{
   const profile=createCuraProfile(curaOptions(settings));
   const manual=['cura-manual-settings.txt',profile.fallbackText];
   if(stockCuraNeedsManualSettings(settings))return {manual};
   return {profile:[profile.filename,profile.bytes],manual};
  }catch(error){
   return {manual:['cura-manual-review.txt',error.message+'\nJob settings: '+JSON.stringify(curaOptions(settings),null,2)]};
  }
 }
 function downloadCuraSettings(cura,stem=''){
  const [name,data]=cura.profile||cura.manual;
  adapter.download(new Blob([data],{type:cura.profile?'application/zip':'text/plain'}),stem+name);
 }
 function exportJob(id,format){
  try{
   const job=project.printJobs.find(j=>j.id===id);
   if(!job)throw Error('This print job was removed.');
   const model=findModel(project,job.modelId),result=currentPrintResult(job),settings=effectivePrinter(job);
   const block=printExportBlock(job,result,settings);if(block)throw Error(block);
   const stem=printDownloadStem(model,job);
   if(format==='cura'){
    downloadCuraSettings(printJobCura(settings),stem+'-');
    return;
   }
   const exported=exportMaterialBodies(result,{name:model.name});
   if(format==='3mf'){adapter.download(new Blob([exported.threeMF],{type:'model/3mf'}),stem+'.3mf');return;}
   if(format==='stl'){
    if(exported.stls.length===1){
     adapter.download(new Blob([exported.stls[0].bytes],{type:'model/stl'}),stem+'.stl');
    }else{
     const files=exported.stls.map(part=>[part.name,part.bytes]);
     files.push(['material-roles.json',JSON.stringify(exported.assignments,null,2)],
      ['READ-ME.txt','Import these STL files together as parts sharing one origin. Keep their positions and assign each material in Cura.']);
     adapter.download(new Blob([zipProfileEntries(files)],{type:'application/zip'}),stem+'-stls.zip');
    }
    return;
   }
   const entries=exported.stls.map(s=>[s.name,s.bytes]);entries.push([exported.filename,exported.threeMF],['editable-model.json',JSON.stringify(model,null,2)],['material-roles.json',JSON.stringify(exported.assignments,null,2)],['print-report.json',JSON.stringify(result.report,null,2)]);
   entries.push(...lightPassageReportEntries(result.report.lightPassageInspection));
   const cura=printJobCura(settings),curaProfile=cura.profile?'included':'manual-review';
   if(cura.profile)entries.push(cura.profile);
   entries.push(cura.manual);
   const manifestName='print-job-manifest.json';
   const manifest={
    schemaVersion:1,modelId:model.id,modelName:model.name,generatorType:model.generator.typeId,
    modelRevision:model.revision,jobId:job.id,preparedRevision:job.preparedRevision,
    printer:settings.printer,nozzleMm:settings.curaNozzle,material:settings.curaMaterial,quality:settings.curaQuality,
    units:'mm',coordinateFrame:'Z-up',dimensionsMm:preparedSize(result),
    curaProfile,...(result.report.nativeRouting?{routing:result.report.nativeRouting}:{}),files:[...entries.map(([name])=>name),'READ-ME.txt',manifestName]
   };
   const instructions=[
    'Model: '+model.name,'Revision: '+model.revision,'Job ID: '+job.id,
    'Prepared dimensions (X × Y × Z): '+manifest.dimensionsMm.map(n=>n.toFixed(2)).join(' × ')+' mm',
    'Printer: '+manifest.printer,'Nozzle: '+manifest.nozzleMm+' mm',
    'Material: '+manifest.material,'Quality: '+manifest.quality+' / 100','',
    exported.warnings.join('\n'),
    'The STL files share one origin. Import them together as parts, not independently auto-arranged objects.','',
    'In Cura, select the matching printer, nozzle or core, and material before importing the model.',
    curaProfile==='included'
     ?'Import the included Cura profile or use cura-manual-settings.txt to enter the settings manually.'
     :'See '+cura.manual[0]+' for settings to enter manually in Cura.',
    'For multiple materials, check each part’s extruder assignment and the installed cores.',
    'Inspect orientation, supports and every layer in installed Cura. Confirm physical fit and optics with a test print.'
   ].join('\n');
   entries.push(['READ-ME.txt',instructions],[manifestName,JSON.stringify(manifest,null,2)]);
   adapter.download(new Blob([zipProfileEntries(entries)],{type:'application/zip'}),stem+'.zip');
  }catch(error){adapter.status(error.message);if($('smsPrintStatus'))$('smsPrintStatus').textContent=error.message;}
 }
 function backup(){
  captureCrystal();state.pixelProfiles=copy(adapter.pixelFitProfiles?.()||state.pixelProfiles||[]);
  validateArchive(state);
  adapter.download(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),'wonder-trunks-studio-backup.json');
 }
 function saveProjectSnapshot(target){
  let candidate;
  try{
   candidate=projectWorkspaceCandidate(state,target);
   writeWorkspace(candidate);
  }catch(error){
   $('smsSaveState').textContent='Project not saved';
   adapter.status(error.message);
   return false;
  }
  clearTimeout(saveTimer);dirty=false;$('smsSaveState').textContent='Saved locally';
  state.savedProjects=candidate.savedProjects;
  if(target)replaceProject(candidate.project);
  return true;
 }
 function replaceProject(next){
  if(modelDrawer?.open)modelDrawer.setOpen(false,false);
  cancelPixelGesture();endPixelPlacement();editors.cancel();remember({capture:false});
  for(const worker of workers.values())worker.terminate();workers.clear();prepared.clear();histories.clear();
  for(const c of cache.values())if(c.group)disposeGroup(c.group);else adapter.release(c);cache.clear();
  for(const map of [nativeFitPreviewChoices,nativeFitPreviewMessages,nativeGuideChoices,selectedPixels,
   selectedMounts,pixelMessages,mountPlacementProfiles,selectedParts])map.clear();
  currentId=null;
  for(const field of Object.keys(project))delete project[field];
  Object.assign(project,next);
  $('smsProjectTitle').value=project.title;
  const modelId=project.activeTab||project.models[0]?.id;
  if(modelId)switchModel(modelId);else showHome();
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
 function setBuildWorkspace(destination){
  if(buildWorkspace===destination)return;
  if(placementModel||mountingModel)endPixelPlacement();
  if(viewport.dataset.hardwarePlacement)$('stopHolePlacementBtn')?.click();
  buildWorkspace=destination;
 }
 function openBuildWorkspace(destination){
  setBuildWorkspace(destination);openingBuildWorkspace=true;
  try{document.querySelector('.workspace-tabs [data-tab=build]').click();}
  finally{openingBuildWorkspace=false;}
 }
 document.addEventListener('click',e=>{
  const button=e.target.closest('[data-tab]');if(!button)return;
  if(button.dataset.tab==='build'&&!openingBuildWorkspace)setBuildWorkspace('build');
  // Ensure Crystal Build/Design is authoritative before palette refresh.
  // A queued rerender can otherwise observe the previous native tab state.
  if(active()?.generator.typeId==='crystals'&&['design','build'].includes(button.dataset.tab)){
   stage=button.dataset.tab;
   for(const item of document.querySelectorAll('.workspace-tabs [data-tab]'))
    item.classList.toggle('active',item===button);
  }
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
 if(!initial){adapter.detach();if(!shell)showLibrary();}
 else if(findModel(project,initial).generator.typeId==='crystals'){
  switching=true;adapter.activate(findModel(project,initial),null);switching=false;renderTabs();
 }else{currentId=null;adapter.detach();switchModel(initial);}
 for(const job of project.printJobs)if(['preparing','prepared'].includes(job.status)){job.status='stale';job.requestId=null;job.preparedRevision=null;}
 if(shell)showHome();
 save();
 function canOpenFeature({action,family}){
  if(!shell)return false;
  if(action==='family')return !!registry.get(family);
  if(action==='library'||action==='print')return true;
  return !!active()&&['design','build','pixels','wires','mounts','inspect','search'].includes(action);
 }
 function openFeature(feature){
  if(!canOpenFeature(feature))return;
  const {action,family}=feature;
  if(action==='family'){renderPicker(registry.get(family));picker.showModal();return;}
  if(action==='library'){showLibrary();$('smsSearch')?.focus();return;}
  if(action==='print'){showPrint();shell.focusAfterNavigation(['#smsPrintCurrent [data-prepare-current]','#smsExpandPrint']);return;}
  if(action==='search'){
   document.querySelector('.workspace-tabs [data-tab=design]').click();
   shell.focusAfterNavigation(['#smsFindTools']);return;
  }
  if(['pixels','wires','mounts'].includes(action)){shell.chooseTool(action);return;}
  const tab=document.querySelector('.workspace-tabs [data-tab="'+(action==='design'?'design':'build')+'"]');
  tab?.click();
  if(action==='inspect')shell.focusAfterNavigation(['[data-feature-inspect]']);
  else tab?.focus();
 }
 window.__sensoryStudio={project,registry,canOpenFeature,openFeature,get currentModel(){return active();},get mode(){return mode;},switchModel,addModel:add,showLibrary,showPrint,send,prepare,saveImmediately,fittingPointScreen,pixelMarkerScreen:id=>{const marker=pixelMarkers(active()).find(item=>item.userData.pixelId===id);return marker?projectMarker(marker):null;},get cacheSize(){return cache.size;},get metrics(){return {previewBuilds,geometries:renderer.info.memory.geometries,activeWorkers:workers.size};}};
 return {onCrystalChange:captureCrystal,backup,nativeModelBounds,planPixelProfileClearance,
  onPixelProfileLibraryChange:profiles=>{state.pixelProfiles=copy(profiles);save();},
  pixelProfileReferenced:id=>[
   ...project.models,
   ...state.savedProjects.flatMap(project=>project.models),
   ...state.library.flatMap(record=>record.versions.map(version=>version.model))
  ].some(model=>profileReferencedInModel(model,id))
 };
}
