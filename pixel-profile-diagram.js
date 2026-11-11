/* Live 2D annotated pixel profile diagram.
 * Shows user-measured nominal plastic package, not the final printed cavity;
 * actual hole clearance and fit adjustment are applied separately.
 */
import {normalisePixelProfile} from './pixel-profiles.js';
export const PIXEL_DIMENSIONS=[
 {letter:'A',field:'pixelBodyDiameter',key:'bodyDiameter',title:'Body diameter',help:'Nominal outside diameter of the long straight LED housing, excluding its wider flange.'},
 {letter:'B',field:'pixelBodyHeight',key:'bodyHeight',title:'Body length',help:'Overall length from the flange underside to the top of the rounded LED cap; includes E.'},
 {letter:'C',field:'pixelFlangeDiameter',key:'flangeDiameter',title:'Flange diameter',help:'Outside diameter of the wider collar or lip at the cable end.'},
 {letter:'D',field:'pixelFlangeHeight',key:'flangeHeight',title:'Flange thickness',help:'Axial thickness of the collar around the bottom of the LED.'},
 {letter:'E',field:'pixelCapHeight',key:'capHeight',title:'Cap height',help:'Height of the curved upper tip, included within the total body length B.'},
 {letter:'F',field:'pixelWireWidth',key:'wireWidth',title:'Wire exit width',help:'Total width of the wire bundle/recess exiting sideways below the pixel.'},
 {letter:'G',field:'pixelWireDepth',key:'wireDepth',title:'Wire exit depth',help:'Depth of the shallow underside recess accommodating the wire bundle.'}
];
const decimal=v=>Number(v).toFixed(1);
export function renderPixelProfileDiagram(values={}){
 const p=normalisePixelProfile(values);
 const svgSafe=value=>Number.isFinite(value)?Number(value.toFixed(2)):0;
 const scale=Math.min(5.2,198/p.bodyHeight,150/Math.max(p.flangeDiameter,p.bodyDiameter,2));
 const cx=210,base=292,top=base-p.bodyHeight*scale;
 const bodyR=p.bodyDiameter*scale/2,collarR=p.flangeDiameter*scale/2;
 const flangeH=Math.min(p.bodyHeight*.42,p.flangeHeight)*scale;
 const capH=Math.min(p.bodyHeight*.38,p.capHeight)*scale;
 const neck=top+capH,collar=base-flangeH;
 const path=[
  'M',svgSafe(cx-collarR),svgSafe(base),
  'L',svgSafe(cx+collarR),svgSafe(base),
  'L',svgSafe(cx+collarR),svgSafe(collar),
  'L',svgSafe(cx+bodyR),svgSafe(collar),
  'L',svgSafe(cx+bodyR),svgSafe(neck),
  'Q',svgSafe(cx+bodyR*.75),svgSafe(top),svgSafe(cx),svgSafe(top),
  'Q',svgSafe(cx-bodyR*.75),svgSafe(top),svgSafe(cx-bodyR),svgSafe(neck),
  'L',svgSafe(cx-bodyR),svgSafe(collar),
  'L',svgSafe(cx-collarR),svgSafe(collar),'Z'
 ].join(' ');
 const dims=Object.fromEntries(PIXEL_DIMENSIONS.map(d=>[d.letter,decimal(p[d.key])]));
 const arrow=(a,b,c,d,label,field,posX,posY)=>
  '<line class="pixel-dimension" x1="'+svgSafe(a)+'" y1="'+svgSafe(b)+'" x2="'+svgSafe(c)+'" y2="'+svgSafe(d)+'" marker-start="url(#pixelArrow)" marker-end="url(#pixelArrow)"/>'+
  '<text class="pixel-dimension-label" data-profile-field="'+field+'" x="'+svgSafe(posX)+'" y="'+svgSafe(posY)+'">'+label+'</text>';
 const key=(letter)=>letter+' '+dims[letter]+' mm';
 const guide='<g stroke="#5e8caa" opacity=".58" stroke-dasharray="4 5" stroke-width="1">'+
  '<path d="M'+(cx-collarR-10)+' '+base+' H'+(cx+collarR+24)+' M'+(cx-collarR-10)+' '+top+' H'+(cx+collarR+20)+'"/>'+
  '<path d="M'+(cx-bodyR-12)+' '+neck+' H'+(cx+bodyR+23)+' M'+(cx-collarR-12)+' '+collar+' H'+(cx+collarR+25)+'"/></g>';
 const wireX=460,wireY=235,wireW=Math.max(12,p.wireWidth*7),wireD=Math.max(3,p.wireDepth*8);
 return '<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Annotated LED side profile and wire channel cross-section" viewBox="0 0 610 365">'+
 '<defs><marker id="pixelArrow" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto-start-reverse"><path d="M0 0 L7 3.5 L0 7 Z" fill="#4ddad7"/></marker>'+
 '<linearGradient id="pixelMetal" x1="0" y1="0" x2="1" y2=".3"><stop stop-color="#5c7796"/><stop offset=".45" stop-color="#bcd5ea"/><stop offset="1" stop-color="#7197b6"/></linearGradient></defs>'+
 '<rect x="2" y="2" width="606" height="361" rx="14" fill="#10263c"/>'+
 '<text x="20" y="27" fill="#9cbcd5" font-size="13" font-weight="700">SIDE PROFILE</text>'+
 '<text x="380" y="27" fill="#9cbcd5" font-size="13" font-weight="700">WIRE RELIEF CROSS-SECTION</text>'+
 '<path d="'+path+'" fill="url(#pixelMetal)" stroke="#e5f5ff" stroke-width="1.5"/>'+
 '<path d="M'+(cx-bodyR*.58)+' '+(neck+7)+' V'+(collar-6)+'" stroke="#ffffff" stroke-width="3" opacity=".18"/>'+
 '<path d="M'+(cx-collarR)+' '+base+' v18 m-4 0 h8" stroke="#3bb4c5" stroke-width="3"/>'+
 guide+
 arrow(cx-bodyR,neck+28,cx+bodyR,neck+28,key('A'),'pixelBodyDiameter',cx,neck+21)+
 arrow(cx-collarR,base+34,cx+collarR,base+34,key('C'),'pixelFlangeDiameter',cx,base+51)+
 arrow(72,top,72,base,key('B'),'pixelBodyHeight',69,(top+base)/2)+
 arrow(cx+collarR+26,collar,cx+collarR+26,base,key('D'),'pixelFlangeHeight',cx+collarR+58,base-3)+
 arrow(cx+bodyR+31,top,cx+bodyR+31,neck,key('E'),'pixelCapHeight',cx+bodyR+66,top+capH/2)+
 '<rect x="385" y="'+(wireY-43)+'" width="160" height="43" rx="7" fill="#789bb3" stroke="#d7eaff"/>'+
 '<rect x="'+(wireX-wireW/2)+'" y="'+(wireY-43)+'" width="'+wireW+'" height="'+wireD+'" rx="2" fill="#10263c" stroke="#ffd391" stroke-width="2"/>'+
 '<path d="M385 '+(wireY-43)+' h160" stroke="#d6e6fa" stroke-width="1.5"/>'+
 arrow(wireX-wireW/2,wireY+14,wireX+wireW/2,wireY+14,key('F'),'pixelWireWidth',wireX,wireY+32)+
 arrow(wireX+wireW/2+21,wireY-43,wireX+wireW/2+21,wireY-43+wireD,key('G'),'pixelWireDepth',wireX+wireW/2+58,wireY-21)+
 '<text x="385" y="292" font-size="12" fill="#a9c9df">Two opposed wire slots below the body</text>'+
 '<text x="20" y="344" fill="#84b6d2" font-size="12">Select a letter to edit its measurement • profile outline updates live</text>'+
 '</svg>';
}
