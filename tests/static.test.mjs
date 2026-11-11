// Dependency-free repository wiring and JavaScript parsing smoke test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const local=p=>path.join(root,p);
const jsPaths=fs.readdirSync(root).filter(p=>p.endsWith('.js'));
for(const p of fs.readdirSync(local('tests')).filter(p=>p.endsWith('.mjs')))jsPaths.push('tests/'+p);
assert(jsPaths.includes('studio-v3.js')&&jsPaths.includes('fabrication-v1.js')&&jsPaths.includes('hardware-editor.js')&&jsPaths.includes('pixel-profiles.js')&&jsPaths.includes('wire-routing.js')&&jsPaths.includes('print-advisor.js')&&jsPaths.includes('cura-profiles.js')&&jsPaths.includes('print-quality.js')&&jsPaths.includes('optical-audit.js')&&jsPaths.includes('split-joints.js')&&jsPaths.includes('design-workflows.js')&&jsPaths.includes('production-pack.js')&&jsPaths.includes('targeted-light-paths.js')&&jsPaths.includes('light-port-plan.js')&&jsPaths.includes('pixel-profile-diagram.js')&&jsPaths.includes('cura-model-advisor.js')&&jsPaths.includes('detachable-plate.js'));
for(const p of jsPaths){
 // node --check parses ESM without importing CDN modules or starting WebGL.
 try{execFileSync(process.execPath,['--check',local(p)],{stdio:'pipe'})}
 catch(err){throw new Error('JavaScript syntax check failed for '+p+'\n'+String(err.stderr||err.message))}
}
let checkedImports=0;
for(const p of jsPaths){
 const src=read(p);
 const imports=[
  ...src.matchAll(/\bfrom\s*['"](\.[^'"]+)['"]/g),
  ...src.matchAll(/\bimport\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g)
 ];
 for(const m of imports){
  const target=path.resolve(path.dirname(local(p)),m[1]);
  assert(target.startsWith(root+path.sep),'Local import must stay inside repository: '+p+' '+m[1]);
  assert(fs.existsSync(target),'Missing local module: '+p+' -> '+m[1]);
  checkedImports++;
 }
}
const index=read('index.html');
assert.match(index,/<script\s+type="module"\s+src="\.\/studio-v3\.js"><\/script>/,'Active app is bootstrapped from studio-v3.js');
assert.match(index,/type="importmap"/,'The browser import map is declared');
for(const id of ['viewport','prepareBtn','prepareStatus','prepareReport','showManufacturing',
 'stlBtn','threeMfBtn','placePixelBtn','placeMountBtn','placeTabBtn','pickWireExitBtn','resetTabsBtn','reportVault','reportLEDVents','pixelProfileSelect','pixelProfileOverlay','descriptionsBtn','contextHelp','wiringCsvBtn','reportWireChannels','reportRoofSpan','customPrinterSettings','shapePresetSelect','applyShapePresetBtn','printChecklistBtn','opticalCsvBtn','productionPackBtn','detachablePlateBtn','exportMountPlateBtn','singleWireExitBtn','wireRouteStatus','pixelProfileDiagram','curaModelAdvice','curaRecommendedNozzleBtn','steppedPixelCouponBtn','reportTargeted','reportDirectPorts','reportSkippedPorts','reportSkippedLight','printFlowEstimate']){
 assert(index.includes('id="'+id+'"'),'Missing essential UI element #'+id);
}
const defaults=read('studio-v3.js');
const first=defaults.indexOf('const defaults={'),last=defaults.indexOf('\n};',first);
assert(first>=0&&last>first,'Cannot locate active default settings object');
const keys=new Set([...defaults.slice(first,last).matchAll(/(?:^|[,\s])([A-Za-z]\w*):/g)].map(m=>m[1]));
const controls=new Set([...index.matchAll(/\bdata-state="([^"]+)"/g)].map(m=>m[1]));
for(const key of controls)assert(keys.has(key),'Missing default value for Build/Design control '+key);
const packageJSON=JSON.parse(read('package.json'));
for(const script of ['test','test:browser','test:static','test:benchmark'])
 assert(typeof packageJSON.scripts?.[script]==='string','Missing npm script '+script);
for(const required of ['AGENTS.md','docs/AI_HANDOVER.md','docs/ARCHITECTURE.md',
 'docs/FEATURE_SPECIFICATIONS.md','docs/PROJECT_VISION.md','docs/DESIGN_DECISIONS.md',
 'docs/DEVELOPMENT_HISTORY.md','docs/ROADMAP.md','docs/TESTING.md','docs/COLLABORATION.md',
 '.github/workflows/pages.yml','.github/workflows/browser-tests.yml',
 '.github/workflows/fabrication-tests.yml','.github/workflows/static-checks.yml']){
 assert(fs.existsSync(local(required)),'Missing documented workflow resource '+required);
}
console.log(JSON.stringify({result:'STATIC CHECKS PASSED',scriptsParsed:jsPaths.length,relativeImports:checkedImports,uiControls:controls.size,docsChecked:10},null,2));
