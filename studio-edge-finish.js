/* #119 safety chamfer settings. The former triangle-midpoint deformation
 * has been retired: it can create crinkled Manifold meshes on openwork parts.
 * Use studio-top-bevel.js for the measured, subtractive top-rim operation.
 */
export const EDGE_FINISH_DEFAULTS=Object.freeze({
 enabled:false,style:'Chamfer',scope:'Top edges',amountMm:0.5,steps:1
});
export const EDGE_FINISH_STYLES=['Rounded','Chamfer'];
export const EDGE_FINISH_SCOPES=['All exterior','Top edges','Side edges','Bottom edges'];
export function normaliseEdgeFinish(input={}){
 const value={...EDGE_FINISH_DEFAULTS,...(input||{})};
 if(typeof value.enabled!=='boolean')throw Error('Edge finishing must be enabled or disabled.');
 if(!EDGE_FINISH_STYLES.includes(value.style))throw Error('Choose Rounded or Chamfer edges.');
 if(!EDGE_FINISH_SCOPES.includes(value.scope))throw Error('Choose an available edge group.');
 for(const [name,min,max] of [['amountMm',.1,4],['steps',1,3]]){
  if(!Number.isFinite(value[name])||value[name]<min||value[name]>max)
   throw Error('Edge finish '+name+' must be between '+min+' and '+max+'.');
 }
 if(!Number.isInteger(value.steps))throw Error('Edge finish steps must be a whole number.');
 // Migrate older #117 selections to the one verified touch-safe operation.
 // Do not silently keep offering all-surface rounded vertex deformation.
 if(value.enabled){value.style='Chamfer';value.scope='Top edges';value.steps=1;}
 return value;
}
export function crystalEdgeFinish(settings){
 return normaliseEdgeFinish({enabled:settings.edgeFinishEnabled===true,
  style:settings.edgeFinishStyle??EDGE_FINISH_DEFAULTS.style,
  scope:settings.edgeFinishScope??EDGE_FINISH_DEFAULTS.scope,
  amountMm:Number(settings.edgeFinishAmount??EDGE_FINISH_DEFAULTS.amountMm),
  steps:Number(settings.edgeFinishSteps??EDGE_FINISH_DEFAULTS.steps)});
}
export function finishEdgeGeometry(THREE,geometry,settings){
 normaliseEdgeFinish(settings);
 // Non-planar surfaces without a proved boundary bevel do not get an
 // invented mesh ripple. Keep their true original geometry unchanged.
 return geometry;
}
