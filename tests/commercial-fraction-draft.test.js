'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
const source=fs.readFileSync(require.resolve('../commercial.js'),'utf8'),end=source.lastIndexOf('})();');
const entries=new Map(),storage={getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,String(value)),removeItem:key=>entries.delete(key)};
const context={console,Date,Map,TextEncoder,crypto:webcrypto,AbortController,setTimeout,clearTimeout,requestAnimationFrame(){},localStorage:storage,window:{addEventListener(){},THE_VIEW_CONFIG:{}},document:{readyState:'loading',addEventListener(){},getElementById(){return null},querySelector(){return null}}};
vm.createContext(context);vm.runInContext(source.slice(0,end)+'globalThis.api={modifiedFractionSelection,protectedCommercialEdit,commercialUx,state,sharedSync};'+source.slice(end),context);
const {api}=context;
assert.equal(api.modifiedFractionSelection(),false);
const draft={clientId:'fiction-client',original:'[9,24]',values:[24,'9',9],approvals:new Map([[18,'["Indisponível",true,"fiction-revision"]']])};
api.commercialUx.fractionSelectionDraft=draft;assert.equal(api.modifiedFractionSelection(),false,'Normalize order, numeric IDs and duplicates');
draft.values.push(30);assert.equal(api.modifiedFractionSelection(),true);
draft.values=[9];assert.equal(api.modifiedFractionSelection(),true);
draft.values=['24',9];assert.equal(api.modifiedFractionSelection(),false,'Revert is clean');
draft.values=[9,24,18];const approvals=JSON.stringify([...draft.approvals]);assert.equal(api.protectedCommercialEdit(),true);assert.equal(JSON.stringify([...draft.approvals]),approvals);
for(const invalid of [null,{},[0],[null],[''],[1.5],['unknown']]){draft.values=invalid;assert.equal(api.modifiedFractionSelection(),true);assert.equal(api.protectedCommercialEdit(),true)}
draft.values=[24,9];assert.equal(api.protectedCommercialEdit(),false);
api.commercialUx.fractionSelectionDraft=null;assert.equal(api.modifiedFractionSelection(),false);assert.equal(api.protectedCommercialEdit(),false);
assert.equal(entries.size,0,'Draft checks never persist commercial data');
console.log('Fraction draft: normalized add/remove/revert/cancel, genuine edits protected, approvals preserved, unknown structures protected and no storage writes PASS; fictitious data only.');
