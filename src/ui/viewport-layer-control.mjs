import {GROUPS,LAYER_IDS,layerGroupState,layerPreset,layerVisible,readLayers,setLayerGroup,writeLayers} from './viewport-layers.mjs';

const labels={
 pixelTags:'Pixel tags',pixelReplicas:'Physical pixel replicas',socketPreviews:'Socket guides',
 wireRoutes:'Route guides',wireLengths:'Length labels',wirePorts:'IN/OUT markers',wireDirections:'Direction arrows',
 mountTabs:'Tab outlines',mountHoles:'Mount hole guides',mountTags:'Mount tags',
 gridAxes:'Grid and axes',dimensions:'Model dimensions'
};

export function mountViewportLayers(host,{onChange}){
 const doc=host.ownerDocument;
 const make=(tag,text)=>{const el=doc.createElement(tag);if(text)el.textContent=text;return el;};
 let storage;
 try{storage=doc.defaultView.localStorage;}catch{}
 let preferences=readLayers(storage), supported=LAYER_IDS;
 const root=make('div'),toggle=make('button','Layers'),panel=make('section');
 root.className='viewport-layers';
 toggle.type='button';toggle.dataset.viewportLayers='';
 panel.id='viewport-layer-controls';panel.hidden=true;panel.setAttribute('aria-label','Viewport layers');
 toggle.setAttribute('aria-controls',panel.id);toggle.setAttribute('aria-expanded','false');
 const note=make('p','View only. These settings hide guides without changing your model or print. Guides follow the workspace and active previews.');
 const presets=make('select');presets.dataset.viewportLayerPreset='';
 const presetLabel=make('label','Display preset ');presetLabel.append(presets);
 for(const [key,label] of Object.entries({choose:'Choose a preset',clean:'Clean model',pixels:'Pixel placement',wiring:'Wire routing',mounting:'Mounting',reset:'Reset layers'})){
  const item=make('option',label);item.value=key;presets.append(item);
 }
 presets.addEventListener('change',()=>{if(presets.value!=='choose')change(layerPreset(presets.value));presets.value='choose';});
 panel.append(note,presetLabel);
 const groups=new Map(), inputs=new Map();
 function checkbox(text,callback){
  const label=make('label'),input=make('input');input.type='checkbox';input.dataset.viewportLayer='';
  input.addEventListener('change',()=>callback(input.checked));label.append(input,doc.createTextNode(text));
  return {label,input};
 }
 for(const [group,ids] of Object.entries(GROUPS)){
  const fieldset=make('fieldset');fieldset.append(make('legend',group[0].toUpperCase()+group.slice(1)));
  const all=checkbox('All '+group,checked=>change(setLayerGroup(preferences,group,checked,supported)));
  groups.set(group,all.input);fieldset.append(all.label);
  for(const id of ids){
   const option=checkbox(labels[id],checked=>change({...preferences,[id]:checked}));
   option.input.dataset.layerId=id;inputs.set(id,option);fieldset.append(option.label);
  }
  panel.append(fieldset);
 }
 function update(){
  for(const [id,{input,label}] of inputs){
   input.checked=preferences[id];input.disabled=!supported.includes(id);
   const reason=label.querySelector('small');
   if(input.disabled&&!reason)label.append(make('small','Unavailable in this builder'));
   if(!input.disabled)reason?.remove();
  }
  for(const [group,input] of groups)Object.assign(input,layerGroupState(preferences,group,supported));
 }
 function change(value){preferences=writeLayers(storage,value);update();onChange();}
 function setOpen(open,restore=false){
  panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));
  if(restore)toggle.focus();
 }
 toggle.addEventListener('click',()=>setOpen(panel.hidden));
 root.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!panel.hidden){event.stopPropagation();event.preventDefault();setOpen(false,true);}
 });
 doc.addEventListener('pointerdown',event=>{if(!panel.hidden&&!root.contains(event.target))setOpen(false);});
 root.append(toggle,panel);host.append(root);update();
 return {
  visible:(id,options)=>layerVisible(preferences,id,options),
  context(ids,available){supported=ids;root.hidden=!available;if(!available)setOpen(false);update();}
 };
}
