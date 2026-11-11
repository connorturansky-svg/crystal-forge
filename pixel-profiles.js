/* Nominal pixel dimensions; measure physical samples before fabrication. */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const PIXEL_PRESETS=[
 {id:'gumdrop',name:'Generic gumdrop 12 mm',kind:'gumdrop',bodyDiameter:12,bodyHeight:22,flangeDiameter:12.5,flangeHeight:2,capHeight:2.5,wireWidth:3,wireDepth:2},
 {id:'bullet',name:'Generic bullet 12 mm',kind:'bullet',bodyDiameter:12,bodyHeight:18,flangeDiameter:13,flangeHeight:1.5,capHeight:2,wireWidth:3,wireDepth:2},
 {id:'seed',name:'Generic seed 5 mm',kind:'seed',bodyDiameter:5,bodyHeight:9,flangeDiameter:5,flangeHeight:0,capHeight:1,wireWidth:2,wireDepth:1.5}
];
export function normalisePixelProfile(p){
 const name=String(p?.name||'Custom pixel').trim().slice(0,70)||'Custom pixel';
 const id=String(p?.id||'custom-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-')).slice(0,90);
 const kind=['seed','bullet','gumdrop'].includes(p?.kind)?p.kind:'gumdrop';
 const bodyDiameter=clamp(Number(p?.bodyDiameter)||12,2,30);
 const bodyHeight=clamp(Number(p?.bodyHeight)||22,3,50);
 return {id,name,kind,bodyDiameter,bodyHeight,
  flangeDiameter:clamp(Number(p?.flangeDiameter??bodyDiameter)||bodyDiameter,bodyDiameter,38),
  flangeHeight:clamp(Number(p?.flangeHeight??0)||0,0,10),
  capHeight:clamp(Number(p?.capHeight??2)||0,0,12),
  wireWidth:clamp(Number(p?.wireWidth??3)||0,0,12),
  wireDepth:clamp(Number(p?.wireDepth??2)||0,0,8)};
}
export function allPixelProfiles(s){
 return [...PIXEL_PRESETS,...(Array.isArray(s?.pixelProfiles)?s.pixelProfiles.slice(0,30).map(normalisePixelProfile).filter(p=>!PIXEL_PRESETS.some(q=>q.id===p.id)):[])];
}
export function resolvePixelProfile(s){
 const p=allPixelProfiles(s).find(p=>p.id===s?.pixelProfileId)||PIXEL_PRESETS[0];
 const diameter=Number(s?.pixelDiameter)>0?Number(s.pixelDiameter):p.bodyDiameter;
 const fit=clamp(Number(s?.pixelFit)||0,-.5,.8);
 return {...p,bodyDiameter:diameter,clearance:fit,boreDiameter:diameter+fit,
  maxDiameter:Math.max(diameter,p.flangeDiameter)+fit};
}
