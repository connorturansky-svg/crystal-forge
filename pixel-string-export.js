/* Pixel order / WS2811 channel mapping: indexing only, NOT an FPP controller
 * configuration or electrical wiring / power-injection design.
 */
import {pixelStringPort} from './pixel-string-routing.js';
const csvRow=values=>values.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',');
export function buildPixelStringMap(hardware){
 const pixels=hardware?.sockets||[],rows=[['Pixel','Stable ID','LED profile','Centre X mm','Centre Z mm','IN X mm','IN Z mm','OUT X mm','OUT Z mm','RGB start channel (1 based)','RGB end channel','Next physical pixel']];
 for(let i=0;i<pixels.length;i++){
  const p=pixels[i],input=pixelStringPort(p,'input'),output=pixelStringPort(p,'output');
  rows.push(['P'+(i+1),p.id||'auto-pixel-'+i,p.profileId||'unknown',p.x.toFixed(2),p.z.toFixed(2),
   input.x.toFixed(2),input.z.toFixed(2),output.x.toFixed(2),output.z.toFixed(2),
   i*3+1,i*3+3,i<pixels.length-1?'P'+(i+2):'EDGE OUT']);
 }
 return rows.map(csvRow).join('\r\n')+'\r\n';
}
