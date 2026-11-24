# WT-024 candidate coverage

In this draft, Hover Notes and Detailed Explanations are independent toolbar checkboxes. Hover or focus a control to see its short note. Use its question-mark button on a touch screen. Press Escape to close a short note. Turn on Detailed Explanations to read longer guidance next to controls with authored copy. Choices apply to the browser and persist between visits when browser storage is available.

The shared renderer lives in [tooltips.js](../tooltips.js). Add authored entries in [contextual-help-copy.js](../contextual-help-copy.js), using the setting's semantic key or explicit generated attribute. Update the original tooltip registry for classic short text. The generated renderer decorates inserted controls when workspace content changes.

## Source inventory

| Surface | Detailed copy | Open coverage |
| --- | --- | --- |
| Classic Crystal settings | 21 of 112 distinct `data-state` keys | 91 detailed entries |
| Native builder parameters | 67 of 67 scanned literal parameter keys | 0 scanned keys |
| Dynamic setting groups | 12 explicit attribute selectors | Remaining generated inputs and per-field variants |

Classic keys pending detailed copy: `angleRandomness`, `baseDome`, `baseEdgeRadius`, `baseProfile`, `baseStyle`, `baseType`, `baseVault`, `baseWidth`, `bottomScale`, `cornerRadius`, `crystalSize`, `curaIntent`, `curaMaterial`, `curaNozzle`, `curaQuality`, `cutSockets`, `domeFalloff`, `edgeFinishScope`, `edgeFinishSteps`, `edgeFinishStyle`, `familyMix`, `fitCouponStyle`, `glowColour`, `glowPreview`, `hardwareSnap`, `hardwareSnapStep`, `hollowCrystals`, `leanAmount`, `leanMode`, `lightBoreDiameter`, `lightPortDiameter`, `lightPortReach`, `lightPorts`, `lightReach`, `lightingMode`, `mountHoleDepth`, `mountHoleDiameter`, `mountPlacement`, `mountPlateThickness`, `mountSpacing`, `overhang`, `pattern`, `pixelCount`, `pixelFit`, `pixelPlacement`, `pixelProfileId`, `pixelRetentionLip`, `pixelSnapMaxMove`, `pixelStringSpacing`, `plateThickness`, `preserveLocked`, `printerX`, `printerY`, `printerZ`, `roundSteps`, `shoulderRound`, `showPixels`, `sideWall`, `snap`, `socketShoulderAngle`, `socketSupportFreeShoulders`, `splitAlignment`, `splitParts`, `splitPinClearance`, `splitPinDepth`, `splitPinDiameter`, `splitX`, `studioBrightness`, `tabCount`, `tabHoleDiameter`, `tabHolesPerTab`, `tabThickness`, `tabWall`, `targetedLightPaths`, `tipLength`, `tipRound`, `topScale`, `undersideAccess`, `vaultSupportPitch`, `wallThickness`, `widthRandomness`, `wireChannels`, `wireDepth`, `wireExit`, `wireInputTailLength`, `wireMinBendRadius`, `wireMode`, `wireOutputTailLength`, `wirePairSpacing`, `wireSlack`, `wireWidth`.

Native literal keys pending: none in this lexical scan.

Continue discovery with `node tests/helpers/wt024-help-audit.mjs`. Review live controls across all eight workspaces, including profile editors, hardware coordinates, advanced manufacturing controls, Library actions, print jobs and modal editors. Check native copy against each family and mode before counting shared keys as complete coverage. This source inventory is a starting point for that runtime review.
