import assert from "node:assert/strict";
import {searchStudioTools,searchTokens,withinOneEdit} from "./helpers/studio-tool-search-core.mjs";

// Contract fixtures, deliberately NOT live DOM/action IDs. WT-022 C must connect
// these intents to real routed controls and then verify focus in Chromium.
const fixtures=[
 {id:"magnet-ring",label:"Circular magnet pockets",workspace:"Mounting",aliases:["magnets in a circle","Hall effect","Hall sensor","radial magnet pattern","8 blind magnetic pockets"],keywords:["radial ring magnets sensor offset"]},
 {id:"mount-grid",label:"Mounting grid",workspace:"Mounting",aliases:["4 mounting holes grid","four mounting holes","grid of screw holes"],keywords:["grid mount hole pitch"]},
 {id:"mount-line",label:"Screw spacing",workspace:"Mounting",aliases:["screw spacing","straight line of mounting holes"],keywords:["line hole pitch fixing"]},
 {id:"mount-tabs",label:"Edge fixing tabs",workspace:"Mounting",aliases:["edge tabs","fixing ears","external mounting tabs"],keywords:["fixing tab ear attachment"]},
 {id:"pixel-coupon",label:"Pixel test coupon",workspace:"Pixels",aliases:["pixel test coupon","LED fitting test strip"],keywords:["socket fit calibration"]},
 {id:"pixel-socket",label:"LED socket",workspace:"Pixels",aliases:["LED socket","pixel fitting","LED hole"],keywords:["socket light fitting"]},
 {id:"support-shoulder",label:"Support-free shoulder",workspace:"Build",aliases:["support-free shoulder","printable roof over light hole"],keywords:["support free crystal shoulder"]},
 {id:"wire-ports",label:"Wire IN OUT",workspace:"Wiring",aliases:["wire IN OUT","cable input output","serial led connector"],keywords:["entry exit direction"]},
 {id:"wire-pitch",label:"Cable pitch",workspace:"Wiring",aliases:["cable pitch","pixel wire spacing"],keywords:["wire length spacing snap"]},
 {id:"edge-finish",label:"Edge chamfer",workspace:"Build",aliases:["chamfer","bevel","smooth edges"],keywords:["finishing safety radius"]},
 {id:"cura-profile",label:"Cura profile",workspace:"Print Centre",aliases:["cura profile","printer material settings"],keywords:["slicer preset nozzle"]},
 {id:"export",label:"STL export",workspace:"Print Centre",aliases:["STL export","download 3MF","production ZIP"],keywords:["export geometry mesh"]},
 {id:"print-preview",label:"Print preview",workspace:"Print Centre",aliases:["print preview","prepared model inspection"],keywords:["real mesh section"]},
 {id:"library-save",label:"Save to library",workspace:"Library",aliases:["save to library","store model in project library"],keywords:["save model local"]},
 {id:"unavailable",label:"Unsupported feature example",workspace:"Mounting",aliases:["unavailable sample"],available:false}
];

const expected=new Map([
 ["magnets in a circle","magnet-ring"],["Hall effect","magnet-ring"],
 ["4 mounting holes grid","mount-grid"],["screw spacing","mount-line"],
 ["edge tabs","mount-tabs"],["fixing ears","mount-tabs"],
 ["pixel test coupon","pixel-coupon"],["LED socket","pixel-socket"],
 ["support-free shoulder","support-shoulder"],["wire IN OUT","wire-ports"],
 ["cable pitch","wire-pitch"],["chamfer","edge-finish"],
 ["bevel","edge-finish"],["Cura profile","cura-profile"],
 ["STL export","export"],["print preview","print-preview"],
 ["save to library","library-save"],["magnets circle","magnet-ring"],
 ["BEVEL","edge-finish"],["chmfer","edge-finish"]
]);

for(const [query,id] of expected){
 const top=searchStudioTools(fixtures,query)[0];
 assert.equal(top?.item.id,id,`Expected ${JSON.stringify(query)} to rank ${id} first, received ${top?.item.id}`);
 assert.equal(typeof top.score,"number");
}
assert.deepEqual(searchTokens("LEDs & cables"),["pixel","wire"]);
assert.deepEqual(searchTokens("  Fixing  EARS  "),["fixing","tab"]);
assert.equal(withinOneEdit("chmfer","chamfer"),true);
assert.equal(withinOneEdit("cable","magnet"),false);
assert.deepEqual(searchStudioTools(fixtures,"quantum laser banana"),[]);
assert.deepEqual(searchStudioTools(fixtures,""),[]);
assert.deepEqual(searchStudioTools(fixtures,"the and for"),[]);
assert.equal(searchStudioTools(fixtures,"unavailable sample")[0].available,false);
assert.equal(searchStudioTools(fixtures,"chmfer",{fuzzy:false}).length,0);
assert.equal(searchStudioTools(fixtures,"bevel",{limit:1}).length,1);
assert.throws(()=>searchStudioTools(null,"pixel"),TypeError);
assert.equal(searchStudioTools([...fixtures,{label:"no id"}],"pixel").some(x=>!x.item.id),false);
console.log(`WT-022 search core: ${expected.size} intent rankings and defensive checks passed`);
