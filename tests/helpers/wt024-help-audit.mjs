// WT-024: read-only legacy help inventory for agent preflight. No DOM or network.
import {readFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const unique=items=>[...new Set(items)].sort();
const entries=(source,pattern)=>[...String(source||'').matchAll(pattern)].map(match=>match[1]);

export function inventoryFromSources({index='',tooltips='',catalogue='',studio=''}={}){
 const legacySettings=tooltips.split('const SETTINGS=')[1]?.split('const BUTTONS=')[0]||'';
 const mapped=unique(entries(legacySettings,/^\s*"([^"]+)"\s*:\s*\[/gm));
 const controls=unique(entries(index,/\bdata-state="([^"]+)"/g));
 const set=new Set(mapped);
 const missing=controls.filter(key=>!set.has(key));
 const declaredNative=unique(entries(catalogue,/\b(?:numeric|choice|boolean)\(\s*'([^']+)'\s*,\s*'[^']+'/g));
 // Candidate attributes are NOT a count of settings: e.g. remove-mount is an action.
 const candidates=unique(entries(studio,/\bdata-([a-z][a-z0-9-]+)/g))
  .filter(name=>/^(?:model-param|(?:build-wire|pixel|mount|fit|native-fit|print|cura|edge)[\w-]*)$/.test(name));
 return {
  schemaVersion:1,
  status:'research-inventory-only',
  classic:{
   controls:controls.length,
   exactLegacyDescriptions:controls.length-missing.length,
   unmapped:missing
  },
  legacyRegistry:{explicitSettingKeys:mapped.length},
  native:{literalParameterKeys:declaredNative.length,keys:declaredNative},
  dynamic:{candidateAttributeNames:candidates},
  limitations:[
   'Static literal keys only; native generators and conditional controls need real Chromium coverage.',
   'Fallback HTML title text does not count as verified human help.',
   'This report is not a test of the future two-level help feature or WCAG conformance.'
  ]
 };
}

export function inventoryFromCheckout(root){
 const read=path=>readFileSync(join(root,path),'utf8');
 return inventoryFromSources({
  index:read('index.html'),
  tooltips:read('tooltips.js'),
  catalogue:read('studio-catalogue.js'),
  studio:read('sensory-studio.js')
 });
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
 const result=inventoryFromCheckout(root);
 const json=JSON.stringify(result,null,2);
 process.stdout.write(json+'\n');
 // Intentionally opt-in: current main has known gaps; CI must not falsely fail
 // on the existence of known legacy gaps before the actual feature is built.
 if(process.argv.includes('--fail-on-legacy-gaps')&&result.classic.unmapped.length)process.exitCode=1;
}
