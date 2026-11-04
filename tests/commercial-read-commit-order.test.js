'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),{createHash}=require('node:crypto');
const {app,root,clone}=require('./commercial-sync-client.test.js');
const KEY='theView.crmCommercial.v2',META=KEY+'.syncMeta.v1',REQUEST=KEY+'.pendingWrite.v1';
const current=fs.readFileSync(require.resolve('../commercial.js'),'utf8'),previous=cp.execFileSync('git',['show','8148c67:commercial.js'],{encoding:'utf8'});
const deferred=()=>{let resolve;const promise=new Promise(done=>resolve=done);return{promise,resolve}};
function setup(source,point='checkpoint'){
 const end=source.lastIndexOf('})();'),bridge=`
 const orderingCheckpoint=latestLocalCheckpoint;
 latestLocalCheckpoint=async()=>{
   const copy=await orderingCheckpoint();
   if(!globalThis.orderingArmed||sharedSync.busy)return copy;
   globalThis.orderingArmed=false;
   if(globalThis.orderingPoint==='ack')return{raw:JSON.stringify({data:sharedSync.remote.data}),id:'synthetic-checkpoint'};
   globalThis.orderingArrived();await globalThis.orderingRelease;return copy;
 };
 acknowledgeLocalCheckpoint=async()=>{globalThis.orderingArrived();await globalThis.orderingRelease};
 `;
 const f=app(root(3),{upstream:root(3),auto:true,draftControl:true,sourceText:source.slice(0,end)+bridge+source.slice(end)}),arrived=deferred(),release=deferred();
 f.context.document.querySelectorAll=()=>[];
 Object.assign(f.context,{orderingPoint:point,orderingArrived:arrived.resolve,orderingRelease:release.promise,orderingArmed:false});
 return{f,arrived,release};
}
async function suspended(source,point='checkpoint',automatic=true){
 const fixture=setup(source,point);await fixture.f.api.loadExcel();fixture.f.context.orderingArmed=true;
 fixture.read=fixture.f.api.loadRemoteData({automatic});await fixture.arrived.promise;return fixture;
}
function coherent(f){
 const meta=JSON.parse(f.storage.get(META));assert.equal(f.api.sharedSync.phase,'synced');assert.equal(f.api.sharedSync.busy,false);assert.equal(f.api.sharedSync.dirty,false);assert.equal(f.api.sharedSync.verified,true);assert.equal(f.api.sharedSync.error,'');assert.equal(f.storage.has(REQUEST),false);assert.equal(f.storage.has(KEY+'.pendingSync'),false);
 assert.equal(meta.revision,f.api.sharedSync.revision);assert.deepEqual(clone(meta.base),clone(f.api.sharedSync.base));assert.deepEqual(JSON.parse(f.storage.get(KEY)),clone(f.api.state.data));assert.deepEqual(clone(f.api.state.data),clone(f.upstream));
}
(async()=>{
 let cases=0;
 // Prove the same defect on main, not merely a slower native storage benchmark.
 const old=await suspended(previous);old.f.api.state.data.clients[0].notes='Synthetic committed edit';old.f.api.save();assert.equal(await old.f.api.syncRemote(),true);const acknowledged=old.f.api.sharedSync.revision;coherent(old.f);old.release.resolve();await old.read;
 assert.equal(old.f.writes,1);assert.equal(old.f.api.sharedSync.phase,'pending');assert.equal(old.f.api.sharedSync.dirty,false);assert.equal(old.f.storage.has(REQUEST),false);assert.notEqual(old.f.api.sharedSync.revision,acknowledged);assert.equal(JSON.parse(old.f.storage.get(META)).revision,old.f.api.sharedSync.revision);cases++;
 for(const point of ['checkpoint','ack']){
  const {f,release,read}=await suspended(current,point),initial=clone(f.api.state.data);f.api.state.data.clients[0].notes='Synthetic committed edit '+point;f.api.save();assert.equal(await f.api.syncRemote(),true);coherent(f);const confirmedRevision=f.api.sharedSync.revision,cache=f.storage.get(KEY),metadata=f.storage.get(META);release.resolve();const outcome=await read;
  assert.equal(outcome.applied,false);assert.equal(outcome.revision,confirmedRevision);coherent(f);assert.equal(f.storage.get(KEY),cache);assert.equal(f.storage.get(META),metadata);assert.equal(f.writes,1);for(const key of Object.keys(initial).filter(key=>key!=='clients'))assert.deepEqual(clone(f.api.state.data[key]),initial[key]);assert.deepEqual(clone(f.api.state.data.clients.slice(1)),initial.clients.slice(1));cases++;
 }
 // A newer local save remains pending; the old read is not an acknowledgement.
 const local=await suspended(current);local.f.api.state.data.clients[0].notes='Synthetic unsent edit';local.f.api.save();const localCache=local.f.storage.get(KEY);local.release.resolve();await local.read;assert.equal(local.f.storage.get(KEY),localCache);assert.equal(local.f.api.sharedSync.phase,'pending');assert.equal(local.f.api.sharedSync.dirty,true);assert.equal(local.f.writes,0);assert.equal(await local.f.api.syncRemote(),true);coherent(local.f);cases++;
 for(const fault of ['timeout-before','timeout-after']){
  const {f,release,read}=await suspended(current);f.api.state.data.clients[0].notes='Synthetic interrupted write';f.api.save();f.writeFault=fault;assert.equal(await f.api.syncRemote(),false);const original=f.storage.get(REQUEST),cache=f.storage.get(KEY),error=f.api.sharedSync.error;assert.ok(original);release.resolve();await read;assert.equal(f.storage.get(REQUEST),original);assert.equal(f.storage.get(KEY),cache);assert.equal(f.api.sharedSync.phase,'offline');assert.equal(f.api.sharedSync.verified,false);assert.equal(f.api.sharedSync.error,error);assert.equal(f.writes,fault==='timeout-after'?1:0);cases++;
 }
 const newerEdit=await suspended(current);newerEdit.f.api.state.data.clients[0].notes='Synthetic first commit';newerEdit.f.api.save();assert.equal(await newerEdit.f.api.syncRemote(),true);const confirmedMeta=newerEdit.f.storage.get(META);newerEdit.f.api.state.data.clients[0].notes='Synthetic newer unsent edit';newerEdit.f.api.save();const unsentCache=newerEdit.f.storage.get(KEY);newerEdit.release.resolve();await newerEdit.read;assert.equal(newerEdit.f.storage.get(META),confirmedMeta);assert.equal(newerEdit.f.storage.get(KEY),unsentCache);assert.equal(newerEdit.f.api.sharedSync.phase,'pending');assert.equal(newerEdit.f.api.sharedSync.dirty,true);assert.equal(newerEdit.f.writes,1);assert.equal(await newerEdit.f.api.syncRemote(),true);coherent(newerEdit.f);assert.equal(newerEdit.f.writes,2);cases++;
 // A manual read can overlap explicit recovery even while ordinary writes are blocked.
 const recovery=setup(current);await recovery.f.api.loadExcel();recovery.f.api.state.data.clients[0].notes='Synthetic original recovery';recovery.f.api.save();recovery.f.writeFault='timeout-before';assert.equal(await recovery.f.api.syncRemote(),false);const originalRequest=JSON.parse(recovery.f.storage.get(REQUEST)).requestId;recovery.f.writeFault='';recovery.f.context.orderingArmed=true;const manualRead=recovery.f.api.loadRemoteData();await recovery.arrived.promise;assert.equal(await recovery.f.api.syncRemote(true),true);coherent(recovery.f);const recoveredRevision=recovery.f.api.sharedSync.revision;recovery.release.resolve();await manualRead;coherent(recovery.f);assert.equal(recovery.f.api.sharedSync.revision,recoveredRevision);assert.equal(recovery.f.writes,1);assert.ok(originalRequest);cases++;
 // A tab must not overwrite another tab's newer shared localStorage snapshot.
 const other=await suspended(current),newer=clone(other.f.api.state.data);newer.clients[1].notes='Synthetic other tab';const revision=createHash('sha256').update(JSON.stringify(newer)).digest('hex'),metadata={revision,base:newer,lastConfirmedAt:'2026-10-13T12:00:00.000Z'};other.f.upstream=newer;other.f.storage.set(KEY,JSON.stringify(newer));other.f.storage.set(META,JSON.stringify(metadata));other.release.resolve();await other.read;assert.equal(other.f.storage.get(KEY),JSON.stringify(newer));assert.equal(other.f.storage.get(META),JSON.stringify(metadata));assert.equal(other.f.writes,0);await other.f.api.loadRemoteData({automatic:true});coherent(other.f);cases++;
 console.log('Read/commit ordering: '+cases+' deterministic cases PASS; old-main reproduction, checkpoint/ack gates, coherent confirmed cache, pending request identities, timeout uncertainty and other-tab preservation; synthetic data only.');
})().catch(error=>{console.error(error);process.exitCode=1});
