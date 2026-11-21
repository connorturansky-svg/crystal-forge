/* Geometry reference only. Safe top-entry eligibility, stock margins,
 * overlapping cuts and affected face must be approved by production logic
 * BEFORE this cutter is ever used. This helper is not wired into Studio.
 */
export function topEntryLeadInSpec({x,z,surfaceY,diameter,amountMm=.5,overshootMm=.1}){
 const values={x,z,surfaceY,diameter,amountMm,overshootMm};
 if(!Object.values(values).every(Number.isFinite))
  throw Error('A top-entry lead-in requires finite mm dimensions.');
 if(diameter<2||diameter>30)throw Error('Lead-in through-hole diameter must be 2–30 mm.');
 if(amountMm<.1||amountMm>4)throw Error('Lead-in amount must be 0.1–4 mm.');
 if(overshootMm<.01||overshootMm>.3)throw Error('Cutter overshoot must be 0.01–0.3 mm.');
 const radius=diameter/2,height=amountMm+overshootMm;
 const lowerY=surfaceY-amountMm;
 return {kind:'cylinder',radius,topRadius:radius+height,height,
  position:[x,lowerY+height/2,z]};
}
export function intendedTopEntryRadius({diameter,amountMm,surfaceY},z){
 if(![diameter,amountMm,surfaceY,z].every(Number.isFinite))throw Error('Finite measurements required.');
 if(!(diameter>0)||!(amountMm>0))throw Error('Positive bore and chamfer dimensions required.');
 return diameter/2+Math.max(0,Math.min(amountMm,z-(surfaceY-amountMm)));
}
