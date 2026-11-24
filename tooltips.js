/* Crystal Forge control explanations. One accessible tooltip for the whole app. */
import {classicDetails,nativeHelp,nativeFamilyHelp,dynamicHelp} from './contextual-help-copy.js';
const SETTINGS={
 "curaQualityType": ["curaQualityType","Choose the Cura base quality family needed for an imported profile to appear."],
 "autoBedSplit": ["autoBedSplit","Split models exceeding the selected printer bed into straight-cut printable pieces."],
 "edgeManualMounts": ["edgeManualMounts","Include eligible manual through-holes while generating perimeter fixing tabs."],
 "socketConical": ["socketConical","Give eligible underside LED sockets a conical ceiling for base-down printing."],
 "wireAllowOverLength": ["wireAllowOverLength","Keep an over-length cable route as an explicitly warned exception instead of automatically refusing it."],
 "wireVaulted": ["wireVaulted","Request a roofed wire-track cross-section where enough surrounding material exists."],
 "wireShowLengths": ["wireShowLengths","Show calculated cable lengths on the model next to the planned links."],
 "edgeFinishSteps": ["edgeFinishSteps","Legacy setting: the verified chamfer currently uses one step."],
 "edgeFinishScope": ["edgeFinishScope","Legacy setting: the current supported finish is limited to eligible top edges."],
 "edgeFinishStyle": ["edgeFinishStyle","Legacy setting: current edge finishing uses the supported chamfer, not arbitrary rounding."],
 "tipStyle": ["Tip style","Choose rounded, blunt or flat ends for the printed crystals."],
 "edgeFinishEnabled": ["Edge finishing","Bevel supported exposed top rims."],
 "edgeFinishAmount": ["Bevel amount","Set how much plastic the bevel takes off an eligible top rim."],
 "requireAccessiblePassages": ["Require light passages","Check for a clear route from fitted LEDs into the crystal before export."],
 "wireDirectionArrows": ["Cable direction arrows","Show the order in which the cable reaches the pixels."],
 "count": [
  "Crystal count",
  "How many crystals generate in the formation. Increasing the number can affect print size and preparation time."
 ],
 "height": [
  "Formation height",
  "Sets the overall generated crystal heights. Existing individually edited positions stay independent."
 ],
 "width": [
  "Formation spread",
  "Sets how far the crystals are laid out. This is separate from individual crystal thickness."
 ],
 "crystalSize": [
  "Crystal starting size",
  "Multiplies each crystal's diameter without changing its height. Existing designs are unchanged at 100%; extreme sizes can cause overlaps."
 ],
 "spacing": [
  "Crystal spacing",
  "0% tightly clusters roots; 100% attempts to separate generated crystal envelopes. Enlarge the base or regenerate after resizing."
 ],
 "pattern": [
  "Formation pattern",
  "Changes the overall growth arrangement. Regenerating may move existing crystals; preserve locked objects if required."
 ],
 "leanMode": [
  "Lean pattern",
  "Controls the common direction of growth: natural, one-way, criss-cross, radially inward or outward."
 ],
 "leanAmount": [
  "Lean strength",
  "Sets the amount of tilt. Rigid rotation should lean the whole crystal without stretching its body."
 ],
 "angleRandomness": [
  "Direction variation",
  "Controls how far crystal leaning directions deviate from the chosen preset."
 ],
 "widthRandomness": [
  "End-width variation",
  "Applies repeatable variation to each crystal's top and bottom diameters independently."
 ],
 "seed": [
  "Generation seed",
  "Reuse the same seed and settings to reproduce a formation. Randomise chooses a new seed."
 ],
 "preserveLocked": [
  "Preserve locked crystals",
  "Keeps locked crystals while regenerating other parts of the formation."
 ],
 "familyMix": [
  "Crystal family",
  "Selects the faceted crystal silhouette. When a crystal is selected, this can apply to that crystal only."
 ],
 "bottomScale": [
  "Bottom width adjustment",
  "Changes the root diameter relative to Crystal starting size. Positive widens; negative narrows. Changes may affect base, sockets and printability."
 ],
 "topScale": [
  "Shoulder width adjustment",
  "Changes the width near the peak independently of the root. Extreme values make dramatic tapered or inverted shapes."
 ],
 "cornerRadius": [
  "Side corner rounding",
  "Rounds vertical facet edges, retaining large flat crystal faces. Also influences the shoulder blend."
 ],
 "studioBrightness": [
  "Viewport brightness",
  "Only adjusts preview lighting. It does not change STL/3MF files, pigment or LED power."
 ],
 "tipLength": [
  "Tip length",
  "Changes the fraction of the crystal height occupied by its taper or pointed section."
 ],
 "tipRound": [
  "Tip rounding",
  "Rounds the crystal's top in the actual geometry, rather than merely changing shading."
 ],
 "shoulderRound": [
  "Shoulder blending",
  "Adds curved geometry between the vertical faces and the top taper."
 ],
 "roundSteps": [
  "Rounding detail",
  "Controls the number of segments along rounded surfaces. More segments can increase mesh complexity."
 ],
 "snap": [
  "Snap to increments",
  "Snaps move, rotate and scale tools to predictable increments."
 ],
 "baseStyle": [
  "Base outline",
  "Choose a fitted, square, circular, rounded or organic base footprint."
 ],
 "baseWidth": [
  "Base margin",
  "Adds perimeter room beyond crystal roots. Increase it if LED holes or mounting features approach the edge."
 ],
 "baseType": [
  "Base type",
  "Controls whether the model includes a common integrated base or a different base arrangement."
 ],
 "baseHeight": [
  "Base depth",
  "Sets the main base thickness, which must accommodate any LED housing and mounting hardware."
 ],
 "baseProfile": ["Base profile","Flat plinth is level; Plinth + dome merges a mound into the rounded rim; Full dome / hill rises gradually from near the floor."],
 "domeFalloff": ["Hill spread","Adjusts how broadly the surface rises. The top joins the rim without a separate lip."],
 "sideWall": ["Side wall amount","Full hill: 0% nearly reaches the floor, 100% preserves the plinth depth. Check thin outer edges in Cura."],
 "baseDome": [
  "Mound height",
  "Adds a rising mound under the crystals. Keep crystal roots embedded in this curved surface."
 ],
 "baseEdgeRadius": [
  "Base edge rounding",
  "Softens the perimeter where the base wall meets its top face."
 ],
 "undersideAccess": [
  "Underside access",
  "Creates additional access below the base. It may conflict with the optional zero-infill vault."
 ],
 "baseVault": [
  "Zero-infill base vault",
  "Carves an open underside with permanent internal roof supports and LED collars. This reduces bridging but still needs Cura inspection."
 ],
 "vaultSupportPitch": [
  "Roof support spacing",
  "Sets spacing between permanent internal buttresses. Smaller gaps add support but may use more material."
 ],
 "hollowCrystals": [
  "Experimental full hollowing",
  "Cuts explicit internal cavities and light paths. Much slower than Cura-first solid export; check minimum walls."
 ],
 "wallThickness": [
  "Hollow wall target",
  "Target wall thickness for experimental internal hollowing. This is approximate, not a certified uniform wall."
 ],
 "lightingMode": [
  "Illumination layout",
  "Choose one shared LED, multiple LEDs or no lighting. Actual channels need inspecting in Cura."
 ],
 "pixelProfileId": ["Pixel profile","Choose a seed, bullet, gumdrop or saved custom profile. Dimensions change the actual manufacturing cut."],
 "wireMode": ["Physical cable layout","Pixel string connects the base edge to the first pixel, then each pixel in order, then the last pixel to an output edge. Each pixel has two opposite cable ports. Legacy options are retained only for older saved projects."],
 "pixelStringSpacing": ["Available pixel-to-pixel cable length","The maximum distance your real cable can cover from the centre of one pixel to the next, following the curved groove. Choose 25, 50 or 100 mm, or type your measured length. A shorter route is allowed; a longer route blocks printing."],
 "wireMinBendRadius": ["Minimum cable bend radius","Sets how gently the cable must turn. A larger number makes wider curves and can require more room. Use a value your real cable can bend around without strain; do not lower it just to silence a routing warning."],
 "wireInputTailLength": ["First pixel’s input cable length","The available cable from the first pixel centre to the opening at the base edge. The curved route must fit inside this distance. Zero retains the old unlimited-length setting; enter your measured tail length to enforce a limit."],
 "wireOutputTailLength": ["Last pixel’s output cable length","The available cable from the last pixel centre to the output opening at the base edge. This is separate from the cable between pixels. Enter the real tail length to prevent an opening being placed too far away."],
 "pixelSnapMaxMove": ["Maximum movement during exact-length snapping","Limits how far the snap tool may shift each pixel while trying to match the selected cable length. The first pixel stays anchored. A short but valid cable route does not need to be stretched just because exact-length snapping cannot move it."],
 "wirePairSpacing": ["Parallel wire separation","Centre-to-centre distance of the two grooves. It must exceed groove width with extra printed material between tracks."],
 "pickWireExitBtn": ["Pick paired cable exit","Click near the base perimeter to choose the exit centre for both wires. Their relative spacing and heading remain coupled to the pixel rotation."],
 "placeTabBtn": ["Place a fixing tab on the base edge","Adds a small semicircular tab with holes for bolts or cable ties. Click the base edge to place a tab, or Shift-drag an existing tab around the edge. The tab becomes part of the printed model; test its strength before using it to support anything."],
 "resetTabsBtn": ["Space fixing tabs evenly","Replaces your manually positioned fixing tabs with a fresh, evenly spaced arrangement around the base. Hole size and tab thickness stay as set below."],
 "wireChannels": ["Carve underside wire grooves","When enabled, cut actual shallow channels joining multiple accepted LED sockets. Not continuous optical channels or guaranteed strain relief."],
 "wireExit": ["Cable exit","Attempt to route one groove to the nearest safe perimeter edge; may be skipped if the wall is too thin."],
 "wireWidth": ["Wire channel width","Width of each open-bottom cable groove. Measure actual cable insulation and keep material around nearby holes."],
 "wireDepth": ["Wire channel depth","Depth of the underside cable groove. Increasing it leaves less plastic above the cable."],
 "wireSlack": ["Extra routing slack","Try a bend in the routing groove for additional cable slack. Fallback to a direct path when a bent route would cross an obstacle."],
 "socketSupportFreeShoulders": ["Support-Free Shoulders","Tapers the flange-to-bore step inside base-down pixel sockets. Adds socket height where needed."],
 "socketShoulderAngle": ["Pixel shoulder angle from horizontal","Choose 30–60°. A steeper angle needs more stock above the socket."],
 "pixelRetentionLip": ["Experimental pixel retaining ridge","Adds an internal narrow compression band. Not a validated snap fit. Test real LED insertion and print strength."],
 "printChecklistBtn": ["Cura review checklist","Download model-aware checks for thin features, printer configuration, roof and wiring. Not proof of printable geometry."],
 "opticalCsvBtn": ["Crystal optical audit","Download per-crystal source distance and light-channel uncertainty. Not an optical simulation or verified shared lumen."],
 "splitAlignment": ["Experimental alignment dowels","Cut mating pockets in solid split halves and export separate pegs. Real assembly fit and joint strength require testing."],
 "splitPinDiameter": ["Dowel diameter","Nominal printable peg diameter."],
 "splitPinDepth": ["Dowel depth","Length of the socket in each split half."],
 "splitPinClearance": ["Dowel clearance","Extra diameter around the peg in the socket. Test for your machine/filament."],
 "shapePresetSelect": ["Crystal shaping preset","Pick a reusable parameter set and apply globally or to an unlocked selected crystal."],
 "applyShapePresetBtn": ["Apply crystal preset","Apply the selected shape only to the selected unlocked crystal, or to global shape parameters when none is selected."],
 "hardwareSnap": ["Snap hardware coordinates","Applies grid snapping when adding/moving LED or mounting holes and when editing numeric coordinates."],
 "hardwareSnapStep": ["Hardware snap spacing","Grid increment in millimetres for hardware hole placement; can be disabled without changing existing holes."],
 "fitCouponStyle": ["Calibration strip option","Stepped measures the LED body and flange with real wire relief; plain checks hole diameters only. Test the actual LED physically."],
 "mountPlateThickness": ["Mating plate thickness","Thickness of the independent M3-style mounting plate. Confirm your bolts, insert lengths and material strength."],
 "lightPorts": ["Roof-to-crystal light passages","Cut tapered direct channels from an open underside vault into eligible crystals. Not optical or structural certification."],
 "lightPortDiameter": ["Vault passage diameter","Size of each opening, limited to preserve estimated printed walls."],
 "lightPortReach": ["Vault passage reach","Fraction of crystal length targeted by the vault light bore. Slice to check complete openness."],
 "singleWireExitBtn": ["Quick outside cable exit","Turn on underside routing and an exterior exit, then inspect in the bottom view and prepare the mesh."],
 "exportMountPlateBtn": ["Registered mounting plate","Export a separate plate with matching M3-style hole locations; real installation strength is not certified."],
  "targetedLightPaths": ["Targeted LED-to-crystal openings","Cuts real narrow bores from accepted LED socket roofs, through the base and into sufficiently wide crystal roots. Alternative to slow balloon hollowing; Cura and real light tests still required."],
 "lightBoreDiameter": ["Targeted light passage diameter","Nominal through-hole width; skip roots too narrow for minimum surrounding wall margin."],
 "lightReach": ["Maximum LED reach","Limit the distance from an LED socket to a crystal to avoid long weak tunnels."],
 "plateThickness": ["Mount plate thickness","Thickness of independently printed detachable plate, secured by actual bolts and installed M3 inserts."],
 "detachablePlateBtn": ["Export detachable mounting plate","Generate a separate registered plate with M3 through-holes after preparing a solid base with a matching insert pattern."],
 "steppedPixelCouponBtn": ["Stepped LED profile test strip","Print three shaped profile pockets with stepped flange, internal nose, optional retention band and cable relief. Physical insertion and extraction testing required."],
 "pixelCount": [
  "Pixel count",
  "Number of LEDs requested in multi-pixel mode. The planner can reject holes without sufficient clearance."
 ],
 "showPixels": [
  "Show pixel centres",
  "Displays planned LED locations in Build/preview. Markers alone do not create a hole in exported geometry."
 ],
 "pixelPlacement": [
  "Pixel positioning",
  "Automatic tries usable positions; Manual uses your placed X/Z coordinates. Invalid positions are shown red."
 ],
 "pixelDiameter": [
  "LED bore diameter",
  "Nominal body diameter of the LED opening before adding the fit allowance."
 ],
 "pixelFit": ["LED socket fit clearance","Global fit tolerance. After a physical coupon print, select the best-fitting hole and apply its measured allowance to all LED socket types."],
 "fitOverrideToolBtn": ["Calibrated LED fit","The current clearance came from a printed test coupon; click to review the matching hole."],
 "resetFitOverrideBtn": ["Reset fit override","Restore the global allowance in use before the coupon calibration was applied."],
 "fitResultSelect": ["Physical fit result","Select a labelled hole from the printed left-to-right fit test sample."],
 "applyFitResultBtn": ["Apply measured clearance","Applies the chosen coupon clearance to all LED socket cutters and invalidates the prepared model."],
 "cutSockets": [
  "Cut LED holes",
  "Physically subtracts valid LED bores from the prepared print model. Disable if no bores are wanted."
 ],
 "glowPreview": [
  "Glow preview",
  "A visual lighting approximation only. It does not predict real brightness through printed plastic."
 ],
 "glowColour": [
  "LED preview colour",
  "Changes simulated LED colour in the viewport. It doesn't change exported geometry."
 ],
 "mount": [
  "Mounting preset",
  "Selects screw, magnet, insert, custom or edge-tab fixing styles. All fixing features need mechanical inspection."
 ],
 "mountPlacement": [
  "Mount positioning",
  "Automatic chooses separated holes; Manual uses the X/Z positions you specify."
 ],
 "tabCount": ["Number of edge tabs","Choose 1–24 equally spaced semicircular ears around the base. Crowded positions may be skipped."],
 "tabHolesPerTab": ["Holes per tab","Choose 1–6 through-holes per ear for zip ties or bolts. The ear scales to fit them."],
 "tabHoleDiameter": ["Tab hole diameter","Choose the through-hole diameter and allow extra clearance for the real fixing."],
 "tabThickness": ["Tab thickness","How thick each printable perimeter ear is."],
 "tabWall": ["Material around tab holes","Requested plastic web around fastening holes; strength must be physically checked."],
 "mountHoleDiameter": [
  "Mount hole diameter",
  "Sets bore diameter for custom mounting holes, subject to material clearance."
 ],
 "mountHoleDepth": [
  "Mount hole depth",
  "Controls how far custom mounting holes or pockets cut into the base."
 ],
 "mountSpacing": [
  "Mount-hole spacing",
  "Desired separation between automatic fixing holes, subject to the base footprint."
 ],
 "printerX": ["Custom printer width","Usable horizontal X build volume (mm), not including clips or nozzle clearance."],
 "printerY": ["Custom printer depth","Usable horizontal Y build volume (mm). Confirm with the printer's Cura profile."],
 "printerZ": ["Custom printer height","Maximum vertical printable height (mm). Check gantry and head clearance."],
 "curaNozzle": ["Cura nozzle / AA print core","Select the physically installed nozzle. The Ultimaker 3 Extended has AA 0.25, 0.4 or 0.8 mm print cores; 0.6 is unsupported in standard AA format."],
 "curaMaterial": ["Cura filament material","Choose PLA or PETG and configure the matching filament profile in Cura. Temperatures remain inherited from Cura's selected material."],
 "curaQuality": ["Quality vs time","Moving toward Fine reduces layer height and speed, and increases shells/top skins. It does not automatically improve optical transparency or guarantee a safe print."],
 "curaIntent": ["Print strategy","Light transmission sets 0% infill, Balanced 10–15%, Durable 25–30%; these settings do not guarantee open cavities or sufficient structural strength."],
 "curaProfileBtn": ["Download Cura print profile","Export a ZIP-based .curaprofile containing compatible custom quality overrides for the selected printer, nozzle and material."],
 "printer": [
  "Printer profile",
  "Used for print-volume warnings. It does not automatically change Cura machine settings."
 ],
 "overhang": [
  "Overhang threshold",
  "Sets the heuristic angle for potential support warnings. It does not measure long horizontal bridges."
 ],
 "splitX": [
  "Split position",
  "Moves the model's optional splitting plane. Split pieces currently do not include alignment keys."
 ],
 "splitParts": [
  "Split export mode",
  "Enables exporting pieces cut along the selected plane. Confirm joinery before printing."
 ]
};
const BUTTONS={
 "simpleBtn": [
  "Simple mode",
  "Shows the main controls without deleting advanced settings or individual edits."
 ],
 "advancedBtn": [
  "Advanced mode",
  "Reveals detailed fabrication and editing controls on the same design."
 ],
 "themeBtn": [
  "Colour theme",
  "Switches between light and dark application themes."
 ],
 "helpBtn": [
  "Help",
  "Opens the full help guide and keyboard shortcuts."
 ],
 "changelogBtn": [
  "What’s new",
  "Shows version history and recent development changes."
 ],
 "saveBtn": [
  "Save project",
  "Downloads editable JSON containing settings and individual crystals, not an STL."
 ],
 "loadBtn": [
  "Open project",
  "Loads an editable Crystal Forge JSON project."
 ],
 "randomBtn": [
  "Randomise",
  "Choose a different seed and regenerate a variation."
 ],
 "regenBtn": [
  "Regenerate",
  "Rebuild the arrangement using the current settings and seed. Preserve-locked controls can protect selected crystals."
 ],
 "clearCrystalSelection": [
  "Clear selection",
  "Return shape controls to the entire cluster instead of one crystal."
 ],
 "resetCrystalShape": [
  "Reset selected shape",
  "Remove the selected crystal's shape overrides and return to global defaults."
 ],
 "duplicateBtn": [
  "Duplicate crystal",
  "Make a separate editable copy of the selected crystal."
 ],
 "deleteBtn": [
  "Delete crystal",
  "Remove the selected crystal from this design. Save a project first if unsure."
 ],
 "lockBtn": [
  "Lock crystal",
  "Protect a crystal from accidental changes and supported regeneration operations."
 ],
 "editPixelProfileBtn": ["Pixel profile editor","Define measured body, flange, dome and wire-relief dimensions and save a reusable profile."],
 "fitPixelBaseBtn": [
  "Fit base for pixel",
  "Sets base depth to 25 mm for the nominal 22 mm gumdrop body. Test actual housing fit."
 ],
 "placePixelBtn": [
  "Place LEDs",
  "Select the pixel placement tool. Move the pointer to preview a hole; click repeatedly to add LEDs. Escape exits."
 ],
 "placeMountBtn": [
  "Place mounting holes",
  "Position fixing bores directly on the model or enter exact coordinates. Check material clearance."
 ],
 "stopHolePlacementBtn": [
  "Stop placing",
  "Exit hardware placement and restore ordinary model selection and orbiting."
 ],
 "prepareBtn": [
  "Prepare printable mesh",
  "Boolean-join the crystals and base, cut requested holes and validate representative mesh topology off the main UI thread."
 ],
 "cancelPrepareBtn": [
  "Cancel preparation",
  "Stop the active print-preparation worker; the previous result may be invalidated."
 ],
 "stlBtn": [
  "Download STL",
  "Exports the prepared, joined, Z-up print geometry. Always inspect in Cura."
 ],
 "threeMfBtn": [
  "Download 3MF",
  "Exports the prepared print geometry as a 3MF project model for slicing."
 ],
 "wiringCsvBtn": ["Export wiring plan CSV","Download accepted underside channel segments and lengths, including skipped-route counts. These are estimates; check your wiring physically."],
 "productionPackBtn": ["Complete production pack","Export a ZIP containing the prepared STL, editable project, Cura candidate profile, hardware CSVs and inspection/safety notes. Requires a current manufacturing mesh."],
 "bomBtn": [
  "Parts list",
  "Downloads a CSV estimate of LEDs, crystals and mounting features."
 ],
 "projectExportBtn": [
  "Editable project JSON",
  "Downloads a project you can reopen later without losing individual edits."
 ],
 "calibrationBtn": [
  "Pixel-fit sample",
  "Downloads a small calibration model to test the correct LED-hole diameter."
 ],
 "splitExportBtn": [
  "Export split sections",
  "Exports pieces separated by the split plane. Alignment keys are not generated yet."
 ],
 "centreViewBtn": [
  "Centre model",
  "Move camera and orbit pivot to the actual crystal cluster centre."
 ],
 "floatBtn": [
  "Floating view",
  "Hide the grid for a cleaner floating-object inspection."
 ],
 "studioLightBtn": [
  "Even lighting",
  "Switch between balanced all-round studio illumination and more directional illumination."
 ],
 "gridBtn": [
  "Grid",
  "Show or hide the ground grid in the viewport."
 ],
 "hardwareColoursBtn": [
  "Hardware overlays",
  "Highlight planned LED holes and mounting features with colours for inspection."
 ],
 "closeInfo": [
  "Close window",
  "Close the Help or What’s New panel."
 ]
};
const TABS={
 design:['Design','Create crystal shapes, spacing, growth and individual edits.'],
 build:['Build','Set base geometry, lighting, fixing holes and manufacturing structure.'],
 print:['Print','Prepare a validated mesh, inspect print warnings and export to a slicer.']
};
const VIEWS={
 iso:['Isometric view','Orbit to a three-quarter overview of the full cluster.'],
 front:['Front view','Inspect the front of the crystal formation.'],
 back:['Back view','Inspect the reverse side.'],
 left:['Left view','Inspect from the left.'],
 right:['Right view','Inspect from the right.'],
 top:['Top view','Look directly down onto the cluster and its footprint.'],
 bottom:['Bottom view','Inspect LED entrances, mounting bores and the underside.']
};
const TOOLS={
 select:['Select','Click a crystal to edit it separately. Shortcut V.'],
 translate:['Move','Move a selected crystal in the scene. Shortcut G.'],
 rotate:['Rotate','Rotate the selected crystal with the 3D gizmo. Shortcut R.'],
 scale:['Scale','Resize the selected crystal. Shortcut S.']
};
const LOOKS={
 solid:['Solid view','Show shaded crystal surfaces.'],
 wire:['Wireframe','Reveal triangle edges and facet structure.'],
 xray:['X-ray view','Inspect overlapping parts and internal/hidden construction.']
};
const OTHER={
 showManufacturing:['Prepared model','Switch between live editable preview and Boolean-manufactured print geometry.'],
 printHeatmap:['Overhang heatmap','Highlight potentially unsupported surfaces. Bridge-length and Cura slicing still need separate checks.'],
 featureOverlay:['Show hardware annotations','Outline actual planned LED and mounting features on the prepared mesh.']
};
const titleFrom=el=>el.closest('.control')?.querySelector('label')?.textContent?.trim().replace(/\s+/g,' ').replace(/\d+(?:\.\d+)?(?:%|mm|°)?$/,'').trim()||
 el.closest('.checks')?.textContent?.trim().replace(/\s+/g,' ')||
 el.textContent?.trim().replace(/\s+/g,' ')||'Control';
const dynamicSelectors=Object.keys(dynamicHelp);
const dynamicSelector=dynamicSelectors.join(',');
const helpTriggerOwners=new WeakMap();
function dynamicEntry(el){
 if(el.nodeType!==1||!el.matches(dynamicSelector))return undefined;
 const key=dynamicSelectors.find(selector=>el.matches(selector));
 return dynamicHelp[key];
}
function settingLabel(el){
 const label=el.closest?.('label')||el.parentElement?.querySelector('label');
 const caption=label&&Array.from(label.childNodes).filter(node=>node.nodeType===3).map(node=>node.textContent.trim()).filter(Boolean).join(' ');
 return caption||el.getAttribute?.('aria-label');
}
function nativeEntry(el){
 const {modelFamily,modelParam,paletteKey}=el.dataset;
 const key=modelParam||(modelFamily?paletteKey:undefined);
 return nativeFamilyHelp[modelFamily]?.[key]||nativeHelp[key];
}
const paletteClassicKeys={'crystal-base-height':'baseHeight',count:'count',spacing:'spacing',width:'width',socketShoulderAngle:'socketShoulderAngle'};
function classicKey(el){return el.dataset.state||(!el.dataset.modelFamily?paletteClassicKeys[el.dataset.paletteKey]:undefined)}
function lookup(el){
 if(el.dataset.precisionInput){
  const slider=el.closest('.sms-visual-range')?.querySelector('[data-palette-key]');
  if(slider)return lookup(slider);
 }
 if(el.dataset.tooltipTitle&&el.dataset.tooltipBody)return [el.dataset.tooltipTitle,el.dataset.tooltipBody];
 const nativeParameter=nativeEntry(el);
 if(nativeParameter)return [settingLabel(el)||el.dataset.modelParam,nativeParameter[0]];
 const dynamic=dynamicEntry(el);
 if(dynamic)return [settingLabel(el)||'Setting',dynamic[0]];
 const key=classicKey(el);
 if(key&&SETTINGS[key])return SETTINGS[key];
 if(el.id&&BUTTONS[el.id])return BUTTONS[el.id];
 if(el.id&&SETTINGS[el.id])return SETTINGS[el.id];
 if(el.id&&OTHER[el.id])return OTHER[el.id];
 if(el.dataset.tab)return TABS[el.dataset.tab];
 if(el.dataset.view)return VIEWS[el.dataset.view];
 if(el.dataset.tool)return TOOLS[el.dataset.tool];
 if(el.dataset.look)return LOOKS[el.dataset.look];
 if(el.dataset.colour)return ['Crystal colour','Changes the preview crystal material colour, not the colour of your printed filament.'];
 if(el.dataset.info)return [el.dataset.info==='help'?'Help':'Version history','Switch the currently displayed information panel.'];
 if(el.dataset.holeAxis)return ['Hole '+el.dataset.holeAxis.toUpperCase()+' position','Set a physical LED or mounting-hole position in millimetres. Invalid entries are flagged red.'];
 if(el.dataset.removeHole)return ['Remove hole','Delete this manually placed hardware hole.'];
 if(el.id==='loadFile')return null;
 const heading=titleFrom(el);
 const native=el.getAttribute('title');
 if(native)return [heading,native];
 return null;
}
const MOUNT_EXPLANATIONS={
 'None':'Adds no fixing holes; suitable for freestanding parts or externally designed mounts.',
 'Wall screws':'Two nominal through-bores for screws when there is enough base perimeter and spacing.',
 'Magnet inserts':'Two shallow blind pockets for magnets. Check polarity, retention, size and depth.',
 'Threaded insert M3':'Blind pockets for M3 inserts. Match dimensions to the exact heat-set or press-fit insert.',
 'Custom dual holes':'Two holes at the chosen size, spacing and depth subject to base material clearance.',
 'Edge fixing tabs':'Semicircular perimeter ears with configurable through-holes for ties or bolts. Physical tensile/load testing required.',
 'Detachable plate':'Makes matching M3 insert pockets in the base and a separate printable plate with through-holes. Test your actual inserts, bolts and printed plate before mounting.',
 'Ceiling mount':'Nominal fixing features, not a load-rated suspension system. Use certified hardware and independent safety retention.'
};
export function describeControl(el){
 if(helpTriggerOwners.has(el))return describeControl(helpTriggerOwners.get(el));
 const info=lookup(el);
 if(el?.dataset?.state==='mount')return ['Mount: '+el.value,MOUNT_EXPLANATIONS[el.value]||info?.[1]];
 return info;
}
export function installTooltips(doc=document){
 const node=doc.createElement('div');
 node.id='controlTooltip';node.className='control-tooltip';node.setAttribute('role','tooltip');node.hidden=true;
 const heading=doc.createElement('strong'),description=doc.createElement('span');
 node.append(heading,description);doc.body.append(node);
 let target=null,timer=0,leaveTimer=0,enabled=true;
 const eligible=['button','input:not([type=file])','select','[data-tooltip-body]',...dynamicSelectors].join(',');
 const descriptionIds=el=>el.getAttribute('aria-describedby')?.match(/[^\t\n\f\r ]+/g)||[];
 const clearTimer=()=>{if(timer){clearTimeout(timer);timer=0}};
 const hide=()=>{
  clearTimer();clearTimeout(leaveTimer);
  if(!node.hidden&&target){
   const ids=descriptionIds(target),remaining=ids.filter(id=>id!==node.id);
   if(remaining.length!==ids.length){
    if(remaining.length)target.setAttribute('aria-describedby',remaining.join(' '));
    else target.removeAttribute('aria-describedby');
   }
  }
  node.hidden=true;target=null;
  if(node.parentNode!==doc.body)doc.body.append(node);
 };
 const valid=el=>el&&!el.disabled&&!el.closest('[hidden]')&&el.getClientRects().length>0;
 const position=()=>{
  if(node.hidden||!target)return;
  if(!valid(target)){hide();return}
  const rect=target.getBoundingClientRect();
  const viewportWidth=doc.documentElement.clientWidth,viewportHeight=doc.documentElement.clientHeight;
  const width=Math.min(300,viewportWidth-22);node.style.maxWidth=width+'px';
  const box=node.getBoundingClientRect();
  let x=rect.left+rect.width/2-box.width/2;
  const above=rect.top-box.height-8;
  const workspace=target.closest('.sms-workspace-nav');
  let y=workspace&&above>=9?above:rect.bottom+8;
  const panel=target.closest('.left,.right,.sms-controls');
  if(panel){
   const bounds=panel.getBoundingClientRect();
   if(bounds.right+box.width+18<viewportWidth){x=bounds.right+8;y=rect.top}
   else if(bounds.left-box.width-18>0){x=bounds.left-box.width-8;y=rect.top}
  }
  if(y===rect.bottom+8&&y+box.height>viewportHeight-9)y=above;
  x=Math.max(9,Math.min(viewportWidth-box.width-9,x));
  y=Math.max(9,Math.min(viewportHeight-box.height-9,y));
  node.style.left=Math.round(x)+'px';node.style.top=Math.round(y)+'px';
 };
 const show=()=>{
  timer=0;if(!enabled||!valid(target))return;
  const content=describeControl(target);if(!content)return;
  const host=target.closest('dialog[open]')||doc.body;
  if(node.parentNode!==host)host.append(node);
  heading.textContent=content[0];description.textContent=content[1];
  node.hidden=false;
  const ids=descriptionIds(target);
  if(!ids.includes(node.id))target.setAttribute('aria-describedby',[...ids,node.id].join(' '));
  position();
 };
 const prepare=(el,delay)=>{
  if(!enabled||!valid(el))return hide();
  if(target===el){clearTimeout(leaveTimer);if(!node.hidden)position();return}
  hide();target=el;timer=setTimeout(show,delay);
 };
 doc.addEventListener('pointerover',e=>{
  if(e.pointerType&&e.pointerType!=='mouse'&&e.pointerType!=='pen')return;
  const el=e.target.closest?.(eligible);
  if(el)prepare(el,440);
 });
 doc.addEventListener('pointerout',e=>{
  if(target&&target.contains(e.target)&&!target.contains(e.relatedTarget)&&target!==doc.activeElement){
   if(node.hidden)hide();
   else if(!node.contains(e.relatedTarget))leaveTimer=setTimeout(hide,300);
  }
 });
 node.addEventListener('pointerenter',()=>clearTimeout(leaveTimer));
 node.addEventListener('pointerleave',e=>{
  if(target!==doc.activeElement&&!target?.contains(e.relatedTarget))hide();
 });
 doc.addEventListener('focusin',e=>{
  const el=e.target.closest?.(eligible);
  if(el)prepare(el,240);
 });
 doc.addEventListener('focusout',e=>{if(target&&(target===e.target||target.contains(e.target)))hide()});
 doc.addEventListener('pointerdown',e=>{if(!node.contains(e.target)&&!e.target.closest?.('.contextual-help-trigger'))hide()},true);
 doc.addEventListener('click',e=>{
  const trigger=e.target.closest?.('.contextual-help-trigger');
  if(!trigger||!enabled)return;
  if(target!==trigger){hide();target=trigger}
  clearTimer();show();
 });
 doc.addEventListener('keydown',e=>{if(e.key==='Escape')hide()},true);
 doc.addEventListener('close',e=>{if(e.target.contains?.(target))hide()},true);
 doc.addEventListener('scroll',()=>{if(target&&!node.hidden)position()},true);
 doc.defaultView.addEventListener('resize',hide);
 return {hide,enable(value){enabled=!!value;if(!enabled)hide()},get enabled(){return enabled}};
}


export const HELP_PREFERENCES_KEY='crystal-forge-contextual-help-v1';

export function readHelpPreferences(storage){
 const defaults={hover:true,detailed:false};
 try{
  const value=storage.getItem(HELP_PREFERENCES_KEY);
  if(value===null)return {...defaults,detailed:storage.getItem('crystal-forge-descriptions')==='on'};
  const saved=JSON.parse(value);
  return {
   hover:typeof saved?.hover==='boolean'?saved.hover:defaults.hover,
   detailed:typeof saved?.detailed==='boolean'?saved.detailed:defaults.detailed
  };
 }catch{return defaults}
}

export function installContextualHelp(doc=document){
 const hover=doc.getElementById('hoverNotes');
 const detailed=doc.getElementById('detailedExplanations');
 const tooltip=installTooltips(doc);
 let storage;
 try{storage=doc.defaultView.localStorage}catch{}
 const settings=readHelpPreferences(storage);
 const selector=['[data-state]','[data-model-param]','[data-palette-key]',...dynamicSelectors].join(',');
 const controls=new Map();
 let nextDetailId=0;

 function associateDetail(control,id,enabled){
  if(!id)return;
  const before=control.getAttribute('aria-describedby')?.split(/\s+/).filter(Boolean)||[];
  const after=before.filter(value=>value!==id);
  if(enabled)after.push(id);
  if(before.join(' ')===after.join(' '))return;
  if(after.length)control.setAttribute('aria-describedby',after.join(' '));
  else control.removeAttribute('aria-describedby');
 }

 function decorate(control){
  const anchor=control.closest('label,.control,.sms-model-control,.sms-visual-range')||control;
  const existing=controls.get(control);
  if(existing?.anchor===anchor&&existing.help.parentElement===anchor.parentElement)return;
  if(existing){associateDetail(control,existing.id,false);existing.help.remove()}
  const info=describeControl(control);
  if(!info?.[1])return;
  const help=doc.createElement('div');
  help.className='contextual-help';
  const trigger=doc.createElement('button');
  trigger.className='contextual-help-trigger';
  trigger.type='button';
  trigger.textContent='?';
  trigger.setAttribute('aria-label','Show setting help');
  trigger.setAttribute('aria-description',info[0]);
  helpTriggerOwners.set(trigger,control);
  help.append(trigger);
  const copy=classicDetails[classicKey(control)]||nativeEntry(control)?.[1]||dynamicEntry(control)?.[1];
  let id;
  if(copy){
   id='contextualHelpDetail'+(++nextDetailId);
   const explanation=doc.createElement('p');
   explanation.id=id;
   explanation.className='contextual-help-detail';
   explanation.textContent=copy;
   help.append(explanation);
  }
  anchor.after(help);
  controls.set(control,{anchor,help,id});
  associateDetail(control,id,detailed.checked);
 }

 function prune(){
  for(const [control,{help,id}] of controls){
   if(!control.isConnected){associateDetail(control,id,false);help.remove();controls.delete(control)}
  }
 }
 function decorateWithin(root){
  if(root.matches?.(selector))decorate(root);
  for(const control of root.querySelectorAll(selector))decorate(control);
 }
 function apply(){
  tooltip.enable(hover.checked);
  doc.body.classList.toggle('show-hover-notes',hover.checked);
  doc.body.classList.toggle('show-detailed-explanations',detailed.checked);
  for(const [control,{id}] of controls)associateDetail(control,id,detailed.checked);
 }
 function save(){
  apply();
  try{storage.setItem(HELP_PREFERENCES_KEY,JSON.stringify({hover:hover.checked,detailed:detailed.checked}))}catch{}
 }
 hover.checked=settings.hover;
 detailed.checked=settings.detailed;
 hover.addEventListener('change',save);
 detailed.addEventListener('change',save);
 apply();
 decorateWithin(doc.body);
 const observer=new doc.defaultView.MutationObserver(records=>{
  let removed=false;
  const added=new Set();
  for(const {addedNodes,removedNodes} of records){
   if([...removedNodes].some(node=>node.nodeType===1&&!node.closest('.contextual-help')))removed=true;
   for(const node of addedNodes){
    if(node.nodeType===1&&node.isConnected&&!node.closest('.contextual-help'))added.add(node);
   }
  }
  if(removed)prune();
  for(const node of added)decorateWithin(node);
 });
 observer.observe(doc.body,{childList:true,subtree:true});
}
