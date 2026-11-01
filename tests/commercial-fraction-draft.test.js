'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
const source=fs.readFileSync(require.resolve('../commercial.js'),'utf8'),end=source.lastIndexOf('})();');
const entries=new Map(),storage={getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,String(value)),removeItem:key=>entries.delete(key)};
const context={console,Date,Map,TextEncoder,crypto:webcrypto,AbortController,setTimeout,clearTimeout,requestAnimationFrame(){},localStorage:storage,window:{addEventListener(){},THE_VIEW_CONFIG:{}},document:{readyState:'loading',addEventListener(){},getElementById(){return null},querySelector(){return null}}};
vm.createContext(context);vm.runInContext(source.slice(0,end)+'globalThis.api={modifiedFractionSelection,fractionSelectionRecovery,commercialOriginCanBeLeft,normalizeData,rememberConfirmedRecoveryBase,recoveryContent,recoveryChecksum,setArchive:copies=>{localVaultCopies=async()=>copies},commercialUx,state,sharedSync};'+source.slice(end),context);
const {api}=context,clone=x=>JSON.parse(JSON.stringify(x));
assert.equal(api.modifiedFractionSelection(),false);
const draft={clientId:'fiction-client',original:'[9,24]',values:[24,'9',9],approvals:new Map([[18,'["Indisponível",true,"fiction-revision"]']])};
api.commercialUx.fractionSelectionDraft=draft;assert.equal(api.modifiedFractionSelection(),false,'Normalize order, numeric IDs and duplicates');
draft.values.push(30);assert.equal(api.modifiedFractionSelection(),true);
draft.values=[9];assert.equal(api.modifiedFractionSelection(),true);
draft.values=['24',9];assert.equal(api.modifiedFractionSelection(),false,'Revert is clean');
draft.values=[9,24,18];api.sharedSync.revision='a'.repeat(64);api.state.selectedClientId='fiction-client';api.state.tab='sales';
const before=JSON.stringify(draft.values),snapshot=clone(api.fractionSelectionRecovery());
assert.equal(snapshot.clientId,'fiction-client');assert.deepEqual(snapshot.originalValues,[9,24]);assert.deepEqual(snapshot.values,[9,24,18]);assert.deepEqual(snapshot.approvals,[[18,'["Indisponível",true,"fiction-revision"]']]);assert.equal(snapshot.baseRevision,'a'.repeat(64));assert.equal(snapshot.context.selectedClientId,'fiction-client');assert.equal(JSON.stringify(draft.values),before);
draft.values.push(30);assert.notDeepEqual(clone(api.fractionSelectionRecovery()),snapshot,'A changed draft invalidates the prior export');
for(const invalid of [null,{},[0],[null],[''],[1.5],['unknown']]){draft.values=invalid;assert.equal(api.modifiedFractionSelection(),true);assert.throws(()=>api.fractionSelectionRecovery())}
draft.values=[9,24];draft.approvals={};assert.throws(()=>api.fractionSelectionRecovery());
api.commercialUx.fractionSelectionDraft=null;assert.equal(api.modifiedFractionSelection(),false);assert.equal(api.fractionSelectionRecovery(),null);
console.log('Fraction draft: normalized add/remove/revert/cancel, explicit Map recovery, source revisions, stale export and unknown structures PASS; fictitious data only.');
(async()=>{
 const key='theView.crmCommercial.v2',revision='a'.repeat(64),data=api.normalizeData({clients:[{id:'fiction',name:'Fictitious'}],events:[],agents:[],finalPrices:{9:500000},statuses:{9:'Disponível'}}),meta={revision,base:data,lastConfirmedAt:'2026-11-01T10:00:00Z'};
 api.state.data=data;Object.assign(api.sharedSync,{revision,base:data,verified:true,busy:false,dirty:false});api.setArchive([]);storage.setItem(key,JSON.stringify(data));storage.setItem(key+'.syncMeta.v1',JSON.stringify(meta));
 assert.equal(await api.commercialOriginCanBeLeft(),true,'Confirmed data with no unresolved archive may leave');
 storage.setItem(key+'.pendingWrite.v1',JSON.stringify({requestId:'fiction-original'}));assert.equal(await api.commercialOriginCanBeLeft(),false);assert.match(storage.getItem(key+'.pendingWrite.v1'),/fiction-original/);storage.removeItem(key+'.pendingWrite.v1');
 storage.setItem(key,JSON.stringify({...clone(data),unknownUnconfirmed:true}));assert.equal(await api.commercialOriginCanBeLeft(),false,'Inconsistent cache is not silently abandoned');storage.setItem(key,JSON.stringify(data));
 const payload={recoveryFormat:1,data,base:data,pendingWrite:null,pendingSync:false,syncMeta:{revision,lastConfirmedAt:meta.lastConfirmedAt}},raw=JSON.stringify(payload);api.rememberConfirmedRecoveryBase(data,revision);
 const copy={id:'fiction-copy',raw,kind:'confirmed',signature:await api.recoveryChecksum(api.recoveryContent(payload)),rawChecksum:await api.recoveryChecksum(raw),protected:false};
 api.setArchive([copy]);assert.equal(await api.commercialOriginCanBeLeft(),true);
 for(const changed of [{...copy,rawChecksum:'b'.repeat(64)},{...copy,needsReview:true},{...copy,unknownMetadata:true},{...copy,protected:true}]){api.setArchive([changed]);assert.equal(await api.commercialOriginCanBeLeft(),false)}
 const pending={...payload,pendingSync:true},pendingRaw=JSON.stringify(pending);api.setArchive([{...copy,raw:pendingRaw,rawChecksum:await api.recoveryChecksum(pendingRaw),signature:await api.recoveryChecksum(api.recoveryContent(pending)),confirmation:{requestId:'fiction',baseRevision:revision,method:'exact-request'}}]);assert.equal(await api.commercialOriginCanBeLeft(),false,'Confirmation metadata cannot bypass unresolved pending payloads');
 console.log('Origin exit: confirmed cache/archive, unresolved pending IDs, corrupt checksum, unknown metadata and unconfirmed copies PASS; no storage writes by the exit check.');
})().catch(error=>{console.error(error);process.exitCode=1});
