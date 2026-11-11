/* Physical manufacturing geometry signature. Visual guides do not invalidate exports. */
export const relevantManufacturingKeys=[
 'count','height','width','crystalSize','widthRandomness','seed','pattern','spacing','leanMode','leanAmount','angleRandomness','familyMix','familyWeights','bottomScale','topScale',
 'cornerRadius','shoulderRound','tipFlat','tipRound','tipLength','roundSteps',
 'baseType','baseHeight','baseDome','baseEdgeRadius','baseProfile','domeFalloff','sideWall','baseWidth','baseStyle','undersideAccess','baseVault','vaultSupportPitch','wallThickness','lightPorts','lightPortDiameter','lightPortReach','lightingMode','pixelCount','pixelDiameter',
 'pixelFit','pixelRetentionLip','pixelProfileId','pixelProfiles','wireChannels','wireExit','wireMode','wirePairSpacing','wireWidth','wireDepth','wireSlack','pixelStringSpacing','wireMinBendRadius','wireInputTailLength','wireOutputTailLength','cutSockets','hollowCrystals','targetedLightPaths','lightBoreDiameter','lightReach','pixelPlacement','manualPixelHoles','mountPlacement','manualMountHoles','overhang','printer','printerX','printerY','printerZ','mount','mountHoleDiameter','mountHoleDepth','mountSpacing','manualEdgeTabs','tabCount','tabHolesPerTab','tabHoleDiameter','tabThickness','tabWall'
];
export function manufacturingFingerprint(s,crystals){
 return JSON.stringify({settings:Object.fromEntries(relevantManufacturingKeys.map(k=>[k,s[k]])),
 crystals:crystals.map(c=>({id:c.id,shape:c.shape||{},family:c.family,x:c.x,y:c.y,z:c.z,h:c.h,r:c.r,rx:c.rx,rz:c.rz,
 rotation:c.rotation,sx:c.sx,sy:c.sy,sz:c.sz,hidden:c.hidden,leanX:c.leanX,leanZ:c.leanZ}))});
}
