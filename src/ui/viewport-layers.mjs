// View-only overlay preferences. Never write these into a model/project.
export const LAYERS_KEY='crystal-forge.viewport-layers.v1';
export const GROUPS=Object.freeze({pixels:Object.freeze(['pixelTags','pixelReplicas','socketPreviews']),wiring:Object.freeze(['wireRoutes','wireLengths','wirePorts','wireDirections']),mounting:Object.freeze(['mountTabs','mountHoles','mountTags']),guides:Object.freeze(['gridAxes','dimensions'])});
export const LAYER_IDS=Object.freeze(Object.values(GROUPS).flat());
export function normalizeLayers(value){
 const result={};
 for(const id of LAYER_IDS)result[id]=value?.[id]!==false;
 return result;
}
export function readLayers(storage){
 try{return normalizeLayers(JSON.parse(storage?.getItem(LAYERS_KEY)||'null'));}
 catch{return normalizeLayers(null);}
}
export function writeLayers(storage,value){
 const normalized=normalizeLayers(value);
 try{storage.setItem(LAYERS_KEY,JSON.stringify(normalized));}catch{}
 return normalized;
}
export function layerVisible(value,id,{baseline=true,supported=true,essential=false}={}){
 if(!LAYER_IDS.includes(id))throw Error('Unknown viewport layer: '+id);
 return Boolean(baseline&&supported&&(essential||value?.[id]!==false));
}
export function setLayerGroup(value,group,visible,supported=LAYER_IDS){
 if(!Object.hasOwn(GROUPS,group))throw Error('Unknown viewport layer group');
 const next=normalizeLayers(value);
 for(const id of GROUPS[group])if(supported.includes(id))next[id]=Boolean(visible);
 return next;
}
export function layerGroupState(value,group,supported=LAYER_IDS){
 if(!Object.hasOwn(GROUPS,group))throw Error('Unknown viewport layer group');
 const ids=GROUPS[group].filter(id=>supported.includes(id));
 const count=ids.filter(id=>value?.[id]!==false).length;
 return {disabled:ids.length===0,checked:ids.length>0&&count===ids.length,indeterminate:count>0&&count<ids.length};
}
const PRESETS=Object.freeze({clean:[],pixels:GROUPS.pixels,wiring:['pixelTags',...GROUPS.wiring],mounting:GROUPS.mounting,reset:LAYER_IDS});
export function layerPreset(name){
 if(!Object.hasOwn(PRESETS,name))throw Error('Unknown viewport layer preset');
 return Object.fromEntries(LAYER_IDS.map(id=>[id,PRESETS[name].includes(id)]));
}
export function visibleForPicking(object){
 for(let item=object;item;item=item.parent)if(item.visible===false)return false;
 return true;
}
