import assert from 'node:assert/strict';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {inventoryFromCheckout} from './helpers/wt024-help-audit.mjs';
import {classicDetails,nativeHelp,nativeFamilyHelp,dynamicHelp} from '../contextual-help-copy.js';
import {studioGenerators} from '../studio-catalogue.js';
import {HELP_PREFERENCES_KEY,readHelpPreferences,describeControl} from '../tooltips.js';

test('contextual help preferences default and migrate independently',()=>{
 const storage=entries=>({getItem:key=>entries[key]??null});
 assert.deepEqual(readHelpPreferences(storage({})),{hover:false,detailed:false});
 assert.deepEqual(readHelpPreferences(storage({'crystal-forge-descriptions':'on'})),{hover:true,detailed:true});
 assert.deepEqual(readHelpPreferences(storage({'crystal-forge-descriptions':'off'})),{hover:true,detailed:false});
 for(const hover of [false,true])for(const detailed of [false,true]){
  const saved={hover,detailed};
  assert.deepEqual(readHelpPreferences(storage({[HELP_PREFERENCES_KEY]:JSON.stringify(saved)})),saved);
 }
 assert.deepEqual(readHelpPreferences(storage({[HELP_PREFERENCES_KEY]:'invalid'})),{hover:false,detailed:false});
 assert.deepEqual(readHelpPreferences(undefined),{hover:false,detailed:false});
});

test('classic and native control copy uses explicit registry entries',()=>{
 const report=inventoryFromCheckout(fileURLToPath(new URL('..',import.meta.url)));
 assert.deepEqual(report.classic.unmapped,[]);
 for(const key of report.native.keys){
  assert(nativeHelp[key]?.[0]&&nativeHelp[key]?.[1],key);
 }
 for(const generator of studioGenerators)for(const {key} of generator.parameterSchema){
  const copy=nativeFamilyHelp[generator.typeId]?.[key]||nativeHelp[key];
  assert(copy?.[0]&&copy?.[1],generator.typeId+' / '+key);
 }
 assert.match(classicDetails.count,/few crystals/);
 assert.match(nativeHelp.teeth[1],/mating gear/);
 assert.match(describeControl({dataset:{modelFamily:'control-caps',modelParam:'diameter'}})[1],/width of the control cap/);
 assert.match(dynamicHelp['[data-pixel-field=rotation]'][1],/cable/);
 assert.equal(describeControl({dataset:{},id:'uncatalogued',closest:()=>null,getAttribute:()=>null}),null);
});
