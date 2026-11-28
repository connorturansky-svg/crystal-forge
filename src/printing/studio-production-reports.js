const csv=rows=>rows.map(row=>row.map(value=>'"'+String(value??'').replaceAll('"','""')+'"').join(',')).join('\r\n')+'\r\n';

export function studioProductionReports(report,parts){
 const hardware=report.hardware;
 const features=report.productionFeatures;
 const rows=[
  ['Component','Quantity','Notes'],
  ...parts.map(part=>[part.name,1,'Prepared printable part. Preserve the shared origin.'])
 ];
 if(hardware){
  rows.push(['Pixel sockets',report.socketsCut,'Check the actual profile and clearance.']);
  rows.push(['Mounting openings',report.mountingHolesCut,'Check physical fastener fit and the installation.']);
  rows.push(['Integral tabs',hardware.tabs.length,'Printed with the model.']);
 }else if(features){
  rows.push(['Pixel socket features',features.pixels,'Check the actual profile and clearance.']);
  rows.push(['Identified mounting features',features.mounts,'Includes labelled mounting pockets and tab openings.']);
 }
 const routes=[['Connection','Length mm','Limit mm']];
 if(report.nativeRouting){
  for(const channel of report.nativeRouting.channels)routes.push([channel.label,channel.lengthMm,channel.limitMm]);
 }else if(hardware?.wirePlan?.ready){
  for(const connection of hardware.wirePlan.connections??[]){
   const from=connection.from==null?'EDGE IN':'P'+(connection.from+1);
   const to=connection.to==null?'EDGE OUT':'P'+(connection.to+1);
   routes.push([from+' → '+to,connection.lengthMm,connection.allowedMm]);
  }
 }
 return {
  files:[['parts-list.csv',csv(rows)],...(routes.length>1?[['wiring-plan.csv',csv(routes)]]:[])],
  wiringIncluded:routes.length>1
 };
}
