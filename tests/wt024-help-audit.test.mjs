// WT-024 source-level inventory is characterization, not evidence of complete help.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {inventoryFromSources,inventoryFromCheckout} from '../scripts/wt024-help-audit.mjs';

test('inventory deduplicates keys and never treats a generic fallback as documented coverage',()=>{
 const report=inventoryFromSources({
  index:'<input data-state="known"><input data-state="missing"><input data-state="known">',
  tooltips:'const SETTINGS={\n "known": ["Known", "Something useful"],\n};\nconst BUTTONS={}',
  catalogue:"numeric('diameter','Diameter',2,1,4); choice('mode','Mode','A',['A']); numeric('diameter','Diameter',2,1,4)",
  studio:"data-model-param='diameter' data-pixel-field='width' data-remove-mount='1'"
 });
 assert.equal(report.schemaVersion,1);
 assert.equal(report.status,'research-inventory-only');
 assert.deepEqual(report.classic,{controls:2,exactLegacyDescriptions:1,unmapped:['missing']});
 assert.equal(report.legacyRegistry.explicitSettingKeys,1);
 assert.deepEqual(report.native.keys,['diameter','mode']);
 assert.deepEqual(report.dynamic.candidateAttributeNames,['model-param','pixel-field']); // remove-mount is an action, not a field candidate
 assert.match(report.limitations.join(' '),/Chromium/);
});

test('real source inventory is deterministic and reports gaps without mutating source',()=>{
 const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
 const first=inventoryFromCheckout(root),again=inventoryFromCheckout(root);
 assert.deepEqual(first,again);
 assert(first.classic.controls>0,'classic controls must be discovered');
 assert(first.legacyRegistry.explicitSettingKeys>0,'legacy help registry must be discovered');
 assert(first.native.literalParameterKeys>0,'native parameters must be discovered');
 assert(first.dynamic.candidateAttributeNames.includes('model-param'),'dynamic native renderer identified');
 assert.equal(first.classic.controls,first.classic.exactLegacyDescriptions+first.classic.unmapped.length);
 assert.equal(first.classic.unmapped.length,new Set(first.classic.unmapped).size,'stable missing names');
 console.log('WT-024 read-only help inventory:',JSON.stringify({
  classic:first.classic.controls,
  exactLegacy:first.classic.exactLegacyDescriptions,
  unmapped:first.classic.unmapped.length,
  nativeLiteralKeys:first.native.literalParameterKeys,
  dynamicCandidates:first.dynamic.candidateAttributeNames.length
 }));
});
