'use strict';
const assert=require('node:assert/strict');
const {app,root,clone}=require('./commercial-sync-client.test.js');
const KEY='theView.crmCommercial.v2',PENDING=KEY+'.pendingWrite.v1';
require('./helpers/loading-persistence-source.cjs')();
const make=async()=>{const f=app(root(3),{upstream:root(3),auto:true,draftControl:true});await f.api.loadExcel();return f};
const queued=f=>f.context.testTimers.filter(fn=>fn.name==='syncRemote');
(async()=>{
 let cases=0;
 const baseline=require('node:child_process').execFileSync('git',['show','e2c041dc:commercial.js'],{encoding:'utf8'});
 const old=app(root(3),{upstream:root(3),draftControl:true,sourceText:baseline});await old.api.loadExcel();old.context.testEditing=true;await old.api.loadRemoteData();assert.equal(old.api.sharedSync.phase,'loading');assert.equal(old.api.sharedSync.verified,false);old.context.testEditing=false;old.api.state.data.clients[0].phone='Synthetic blocked save';old.api.save();assert.equal(old.api.sharedSync.phase,'loading');assert.equal(queued(old).length,0);cases++;
 // The production incident: a completed manual read during an open editor must
 // not strand subsequent saves in loading/unverified.
 const f=await make(),original=clone(f.api.state.data);f.context.testEditing=true;
 await f.api.loadRemoteData();assert.equal(f.api.sharedSync.phase,'synced');assert.equal(f.api.sharedSync.verified,true);assert.deepEqual(clone(f.api.state.data),original);assert.equal(f.writes,0);cases++;
 f.context.testEditing=false;f.api.state.data.clients[0].phone='Synthetic local phone';f.api.save();
 const count=queued(f).length;await f.api.loadRemoteData();assert.equal(f.api.sharedSync.phase,'pending');assert.ok(queued(f).length>count);await queued(f).at(-1)();assert.equal(f.writes,1);assert.equal(f.upstream.clients[0].phone,'Synthetic local phone');cases++;
 const reload=app(undefined,{storage:f.storage,upstream:f.upstream,auto:true,draftControl:true});await reload.api.loadExcel();assert.equal(reload.api.sharedSync.phase,'synced');assert.equal(reload.api.state.data.clients[0].phone,'Synthetic local phone');assert.equal(reload.writes,0);cases++;
 const during=await make();during.context.testEditing=true;during.api.state.data.clients[0].notes='Synthetic draft';during.api.save();const before=queued(during).length;
 await during.api.loadRemoteData();assert.equal(during.api.sharedSync.phase,'pending');assert.equal(queued(during).length,before);assert.equal(during.writes,0);cases++;
 const waiting=await make();let release;const gate=new Promise(r=>release=r),transport=waiting.context.fetch;waiting.context.fetch=async(...args)=>{await gate;return transport(...args)};
 const read=waiting.api.loadRemoteData();waiting.api.state.data.clients[0].phone='Synthetic edit during read';waiting.api.save();assert.equal(await waiting.api.syncRemote(),false);assert.equal(waiting.writes,0);release();await read;await queued(waiting).at(-1)();assert.equal(waiting.writes,1);assert.equal(waiting.upstream.clients[0].phone,'Synthetic edit during read');cases++;
 for(const error of ['timeout','offline','UNAUTHENTICATED']){const x=await make();x.context.testEditing=true;x.failure=error;await assert.rejects(x.api.loadRemoteData());assert.equal(x.api.sharedSync.phase,'offline');assert.equal(x.api.sharedSync.verified,false);assert.equal(x.writes,0);x.failure='';await x.api.loadRemoteData();assert.equal(x.api.sharedSync.phase,'synced');cases++}
 const blocked=await make();blocked.context.testEditing=true;blocked.context.setSourcePending({state:'pending',requestId:'synthetic-original',baseRevision:blocked.api.sharedSync.revision,revision:'a'.repeat(64)});await blocked.api.loadRemoteData();assert.equal(blocked.api.sharedSync.phase,'offline');assert.equal(blocked.api.sharedSync.error,'WRITE_INCOMPLETE');assert.equal(blocked.api.sharedSync.verified,false);assert.equal(blocked.writes,0);cases++;
 for(const reason of ['LOCAL_STORAGE_FAILED','POSSIBLE_SHARED_ROLLBACK','PENDING_REQUEST_REVIEW_REQUIRED']){const x=await make();x.api.sharedSync.phase='conflict';x.api.sharedSync.error=reason;x.context.testEditing=true;await x.api.loadRemoteData();assert.equal(x.api.sharedSync.phase,'conflict');assert.equal(x.api.sharedSync.error,reason);assert.equal(x.api.sharedSync.verified,false);cases++}
 const changed=await make();changed.context.testEditing=true;const newer=clone(changed.upstream);newer.clients[1].phone='Synthetic other user';changed.upstream=newer;await changed.api.loadRemoteData();assert.equal(changed.api.sharedSync.error,'REMOTE_UPDATE_DURING_EDIT');assert.equal(changed.api.sharedSync.verified,false);assert.equal(changed.api.state.data.clients[1].phone,undefined);cases++;
 for(const fault of ['timeout-before','timeout-after']){const x=await make();x.api.state.data.clients[0].phone='Synthetic pending';x.api.save();x.writeFault=fault;assert.equal(await x.api.syncRemote(),false);const pending=x.storage.get(PENDING);assert.ok(pending);x.api.state.data.clients[0].phone='Synthetic newer local';x.api.save();x.writeFault='';await x.api.loadRemoteData();assert.equal(x.storage.get(PENDING),pending);assert.equal(x.api.state.data.clients[0].phone,'Synthetic newer local');assert.equal(x.api.sharedSync.phase,'conflict');assert.equal(x.writes,fault==='timeout-after'?1:0);cases++}
 const rollback=await make();rollback.upstream=root(1);await rollback.api.loadRemoteData();assert.equal(rollback.api.sharedSync.error,'POSSIBLE_SHARED_ROLLBACK');assert.equal(rollback.api.state.data.clients.length,3);assert.equal(rollback.writes,0);cases++;
 const readonly=await make();readonly.api.sharedSync.autoBlock='AUTO_RETRY_LIMIT';readonly.context.testEditing=true;await readonly.api.loadRemoteData();assert.equal(readonly.api.sharedSync.verified,false);assert.equal(readonly.writes,0);cases++;
 console.log('Loading persistence: '+cases+' targeted cases passed; synthetic data only, no Google access');
})().catch(e=>{console.error(e);process.exitCode=1});
