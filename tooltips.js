/* Crystal Forge control explanations. One accessible tooltip for the whole app. */
const SETTINGS={
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
 "pixelFit": [
  "LED fit allowance",
  "Adds or removes a small clearance from the nominal LED bore. Confirm with a test print."
 ],
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
function lookup(el){
 if(el.dataset.tooltipTitle&&el.dataset.tooltipBody)return [el.dataset.tooltipTitle,el.dataset.tooltipBody];
 if(el.dataset.state&&SETTINGS[el.dataset.state])return SETTINGS[el.dataset.state];
 if(el.id&&BUTTONS[el.id])return BUTTONS[el.id];
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
 if(el.matches('button'))return [heading,'Activate this control.'];
 if(el.matches('input,select'))return [heading,'Adjust this setting; some edits require preparing a new print mesh.'];
 return null;
}
export function installTooltips(doc=document){
 const node=doc.createElement('div');
 node.id='controlTooltip';node.className='control-tooltip';node.setAttribute('role','tooltip');node.hidden=true;
 const heading=doc.createElement('strong'),description=doc.createElement('span');
 node.append(heading,description);doc.body.append(node);
 let target=null,timer=0,enabled=true,lastPoint=null;
 const eligible='button, input:not([type=file]), select, [data-tooltip-body]';
 const clearTimer=()=>{if(timer){clearTimeout(timer);timer=0}};
 const hide=()=>{clearTimer();node.hidden=true;if(target?.getAttribute('aria-describedby')==='controlTooltip')target.removeAttribute('aria-describedby');target=null;lastPoint=null};
 const valid=el=>el&&!el.disabled&&!el.closest('[hidden]')&&el.getClientRects().length>0;
 const position=()=>{
  if(node.hidden||!target)return;
  const rect=target.getBoundingClientRect();
  const viewportWidth=doc.documentElement.clientWidth,viewportHeight=doc.documentElement.clientHeight;
  const width=Math.min(300,viewportWidth-22);node.style.maxWidth=width+'px';
  const box=node.getBoundingClientRect();
  let x=rect.left+rect.width/2-box.width/2;
  x=Math.max(11,Math.min(viewportWidth-box.width-11,x));
  let y=rect.bottom+11;
  if(y+box.height>viewportHeight-9)y=rect.top-box.height-11;
  y=Math.max(9,Math.min(viewportHeight-box.height-9,y));
  node.style.left=Math.round(x)+'px';node.style.top=Math.round(y)+'px';
 };
 const show=()=>{
  timer=0;if(!enabled||!valid(target))return;
  const content=lookup(target);if(!content)return;
  heading.textContent=content[0];description.textContent=content[1];
  node.hidden=false;target.setAttribute('aria-describedby','controlTooltip');position();
 };
 const prepare=(el,delay)=>{
  if(!enabled||!valid(el))return hide();
  if(target===el){if(!node.hidden)position();return}
  hide();target=el;timer=setTimeout(show,delay);
 };
 doc.addEventListener('pointerover',e=>{
  if(e.pointerType&&e.pointerType!=='mouse'&&e.pointerType!=='pen')return;
  const el=e.target.closest?.(eligible);
  if(el)prepare(el,440);
 });
 doc.addEventListener('pointerout',e=>{
  if(target&&e.target===target&&!target.contains(e.relatedTarget))hide();
 });
 doc.addEventListener('focusin',e=>{
  const el=e.target.closest?.(eligible);
  if(el)prepare(el,240);
 });
 doc.addEventListener('focusout',e=>{if(target&&(target===e.target||target.contains(e.target)))hide()});
 doc.addEventListener('pointerdown',()=>hide(),true);
 doc.addEventListener('keydown',e=>{if(e.key==='Escape')hide()},true);
 doc.addEventListener('scroll',()=>{if(target){if(!node.hidden)position();else hide()}},true);
 window.addEventListener('resize',()=>{if(target)position()});
 return {hide,enable(value){enabled=!!value;if(!enabled)hide()},get enabled(){return enabled}};
}
