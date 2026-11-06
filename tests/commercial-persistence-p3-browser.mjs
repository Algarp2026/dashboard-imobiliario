import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createSimulator} from '../experimental/persistence-p3/simulator.mjs';
const require=createRequire(import.meta.url),fixture=require('./helpers/persistence-p2-fixture.cjs');
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),playwright=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const port=Number(process.env.P3_TEST_PORT||53520),legacyPort=port+1;
assert.ok(Number.isInteger(port)&&port>=53000&&legacyPort<=53999);
const origin='http://127.0.0.1:'+port,legacyOrigin='http://127.0.0.1:'+legacyPort,out=process.env.P3_ARTIFACTS||path.join(os.tmpdir(),'the-view-p3');
fs.mkdirSync(out,{recursive:true});const results=[],servers=[];
for(const p of [port,legacyPort]){
  const server=http.createServer((req,res)=>{
    if(req.method!=='GET'){res.writeHead(405);res.end();return;}
    const file=req.url?.split('?')[0];res.setHeader('Cache-Control','no-store');
    if(/^\/experimental\/persistence-p[23]\/(codec|reader|contracts|store|simulator)\.mjs$/.test(file)){const target=path.join(repo,file.slice(1));if(!fs.existsSync(target)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(target));return;}
    if(file!=='/'){res.writeHead(404);res.end();return;}res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta charset="utf-8"><title>P3 synthetic laboratory</title>');
  });await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(p,'127.0.0.1',resolve);});servers.push(server);
}
const call=async(page,method,...args)=>{const result=await page.evaluate(async({method,args})=>{try{return {ok:true,value:await p3Store[method](...args)};}catch(e){return {ok:false,code:e.code||e.message?.match(/\bP3_[A-Z_]+\b/)?.[0]||'P3_TEST_CALL_FAILED'};}},{method,args});if(!result.ok)throw Error(result.code);return result.value;};
async function fault(page,{phase=null,store='operations',quota=true}){
  await page.evaluate(({phase,store,quota})=>{
    const put=IDBObjectStore.prototype.put,add=IDBObjectStore.prototype.add;let fired=false;
    window.undoP3Fault=()=>{IDBObjectStore.prototype.put=put;IDBObjectStore.prototype.add=add;};
    function wrap(native){return function(value,...args){if(!fired&&this.name===store&&(!phase||value.phase===phase)){fired=true;if(!quota)this.transaction.abort();throw new DOMException('Injected storage failure',quota?'QuotaExceededError':'AbortError');}return native.call(this,value,...args);};}
    IDBObjectStore.prototype.put=wrap(put);IDBObjectStore.prototype.add=wrap(add);
  },{phase,store,quota});
}
async function rejected(promise,code){let actual;try{await promise;}catch(e){actual=String(e.message);}assert.ok(actual?.includes(code),'Expected '+code+', received '+actual);}
async function blockHash(page){await page.evaluate(()=>{const native=crypto.subtle.digest.bind(crypto.subtle);let first=true;window.p3HashReached=false;crypto.subtle.digest=async(...args)=>{if(first){first=false;window.p3HashReached=true;await new Promise(r=>window.p3ResumeHash=r);}return native(...args);};window.p3UndoHash=()=>crypto.subtle.digest=native;});}
try{
for(const engine of (process.env.P3_BROWSER_ENGINES||'chromium,firefox,webkit').split(','))for(const viewport of ['desktop','mobile']){
  const report={engine,viewport,checks:[],errors:[],nativeQuota:'not-tested-injected-only',abruptCrash:'not-exercised'};let context;
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'tv-p3-'+engine+'-')),options={headless:true,viewport:viewport==='desktop'?{width:1440,height:1000}:{width:390,height:844},...(engine==='chromium'&&process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})};
  const remotes=new Map();let hold=null;
  async function launch(){context=await playwright[engine].launchPersistentContext(profile,options);await context.route('**/*',r=>[origin,legacyOrigin].includes(new URL(r.request().url()).origin)?r.continue():r.abort());context.on('page',p=>p.on('pageerror',e=>report.errors.push(e.message)));}
  async function boot(page,sourceId){
    await page.goto(origin);
    if(!page.p3Bridge){await page.exposeFunction('p3Source',async(sourceId,method,args)=>{
      if(!['preflight','write','inspect','verifyReceipt','read'].includes(method)||!remotes.has(sourceId))throw Error('Unknown fictional source');
      const result=await remotes.get(sourceId)[method](...args);
      if(method==='write'&&hold){const h=hold;hold=null;h.committed();await h.release;}
      return result;
    });page.p3Bridge=true;}
    await page.evaluate(async sourceId=>{
      const module=await import('/experimental/persistence-p3/store.mjs');
      const remote={labOnly:true,sourceId};for(const method of ['preflight','write','inspect','verifyReceipt','read'])remote[method]=(...args)=>p3Source(sourceId,method,args);
      window.p3Store=await module.openLocal({factory:indexedDB,origin:location.origin,name:'the-view-p3-lab.integration',synthetic:true,remote});
      window.p3Codec=await import('/experimental/persistence-p2/codec.mjs');
    },sourceId);
  }
  async function init(name,initialLocalRevision=0){
    const sourceId='fiction-p3-'+name,base=fixture.base(),source=await createSimulator({data:base,sourceId});remotes.set(sourceId,source);
    const a=await context.newPage(),b=await context.newPage();await boot(a,sourceId);await boot(b,sourceId);
    await call(a,'createWorkspace',{workspaceId:name,data:base,initialLocalRevision});
    const A=await call(a,'createInstance',name),B=await call(b,'createInstance',name);return {a,b,A,B,base,source,sourceId,name};
  }
  const check=(id,fields={})=>{report.checks.push({id,status:'passed',...fields});console.log('P3 PASS',engine,viewport,id);};
  try{
    await launch();
    const c=await init('cas',10),x=structuredClone(c.base),y=structuredClone(c.base);x.clients[0].notes='Synthetic X edit';y.clients[1].notes='Synthetic Y edit';
    const operations=await Promise.all([call(c.a,'save',c.A,x,{expectedLocalRevision:10,requestId:'fiction-cas-a'}),call(c.b,'save',c.B,y,{expectedLocalRevision:10,requestId:'fiction-cas-b'})]);
    assert.equal(operations.filter(o=>o.phase==='LOCAL_DURABLE').length,1);assert.equal(operations.filter(o=>o.phase==='CONFLICT').length,1);
    const all=await call(c.a,'snapshot');assert.equal(all.workspaces.find(w=>w.workspaceId==='cas').localRevision,11);assert.equal(all.branches.length,1);
    await boot(c.a,c.sourceId);await boot(c.b,c.sourceId);
    const exA=await call(c.a,'exportInstance',c.A),exB=await call(c.b,'exportInstance',c.B);assert.equal(exA.data.clients[0].notes,x.clients[0].notes);assert.equal(exB.data.clients[1].notes,y.clients[1].notes);assert.equal(exA.kind,'RECOVERABLE');assert.equal(exB.kind,'RECOVERABLE');assert.notEqual(exA.instanceId,exB.instanceId);assert.equal(exA.operations.length,1);assert.equal(exB.operations.length,1);
    assert.deepEqual(exA.data,x);assert.deepEqual(exB.data,y);
    for(const [index,exported]of [exA,exB].entries()){const {checksum,...envelope}=exported;assert.equal(fixture.hash(envelope),checksum);assert.equal(exported.operations[0].phase,operations[index].phase);}
    check('P3-CAS-01',{expected:10,sharedRevision:11,bothProposalsRecovered:true,realTabs:2});
    const repeated=await call(c.a,'save',c.A,x,{expectedLocalRevision:10,requestId:'fiction-cas-a'});assert.equal(repeated.operationId,operations[0].operationId);
    await rejected(call(c.a,'save',c.A,y,{expectedLocalRevision:10,requestId:'fiction-cas-a'}),'P3_REQUEST_ID_COLLISION');assert.equal((await call(c.a,'snapshot')).operations.length,2);check('P3-IMMUTABLE-01');

    const d=await init('draft');const staged=await call(d.a,'stage',d.A,x,{expectedLocalRevision:0,requestId:'fiction-draft'});assert.equal(staged.phase,'UI_DIRTY');await rejected(call(d.a,'send',d.A,staged.operationId),'P3_SEND_STATE');
    await boot(d.a,d.sourceId);assert.equal((await call(d.a,'getOperation',d.A,staged.operationId)).phase,'UI_DIRTY');await call(d.a,'commit',d.A,staged.operationId);await boot(d.a,d.sourceId);assert.equal((await call(d.a,'getOperation',d.A,staged.operationId)).phase,'LOCAL_DURABLE');
    const forged={version:1,status:'COMMITTED',laboratoryOnly:true};await rejected(call(d.a,'acceptReceipt',d.A,staged.operationId,forged),'P3_UNANCHORED_RECEIPT');check('P3-STATES-01');

    const lost=await init('lost'),lo=await call(lost.a,'save',lost.A,x,{expectedLocalRevision:0,requestId:'fiction-lost'});lost.source.setFault('after-commit');const lr=await call(lost.a,'send',lost.A,lo.operationId);assert.equal(lr.phase,'REMOTE_UNKNOWN');assert.equal((await lost.source.read()).writes,1);
    await boot(lost.a,lost.sourceId);assert.equal((await call(lost.a,'getOperation',lost.A,lo.operationId)).phase,'REMOTE_UNKNOWN');assert.equal((await call(lost.a,'recover',lost.A,lo.operationId)).headSynced,true);assert.equal((await lost.source.read()).writes,1);await boot(lost.a,lost.sourceId);assert.equal((await call(lost.a,'getOperation',lost.A,lo.operationId)).phase,'SYNCED');assert.equal((await call(lost.a,'recover',lost.A,lo.operationId)).headSynced,true);check('P3-LOSS-01',{noDuplicateWrite:true});

    const late=await init('late'),first=await call(late.a,'save',late.A,x,{expectedLocalRevision:0,requestId:'fiction-late-a'});
    let release,committed;const received=new Promise(r=>committed=r);hold={committed,release:new Promise(r=>release=r)};const sending=call(late.a,'send',late.A,first.operationId);await received;
    const later=await call(late.a,'save',late.A,y,{expectedLocalRevision:1,requestId:'fiction-late-b'});release();const ack=await sending;assert.equal(ack.headSynced,false);assert.equal((await call(late.a,'read',late.A)).data.clients[1].notes,y.clients[1].notes);assert.equal((await call(late.a,'getOperation',late.A,later.operationId)).phase,'LOCAL_DURABLE');check('P3-LATER-EDIT-01');
    await rejected(call(late.a,'send',late.A,later.operationId),'P3_REMOTE_CONFLICT');assert.equal((await late.source.read()).writes,1);
    const currentLost=await call(lost.a,'read',lost.A);await call(lost.a,'save',lost.A,y,{expectedLocalRevision:currentLost.view.localRevision,requestId:'fiction-after-synced'});assert.equal((await call(lost.a,'send',lost.A,lo.operationId)).headSynced,false);check('P3-HISTORICAL-ACK-01');

    const quota=await init('quota'),before=await call(quota.a,'snapshot');await fault(quota.a,{quota:true});await rejected(call(quota.a,'stage',quota.A,x,{expectedLocalRevision:0,requestId:'fiction-quota'}),'P3_QUOTA');await quota.a.evaluate(()=>undoP3Fault());assert.deepEqual(await call(quota.a,'snapshot'),before);
    const qo=await call(quota.a,'stage',quota.A,x,{expectedLocalRevision:0,requestId:'fiction-quota'});await fault(quota.a,{phase:'LOCAL_DURABLE',quota:false});await rejected(call(quota.a,'commit',quota.A,qo.operationId),'P3_ABORT');await quota.a.evaluate(()=>undoP3Fault());assert.equal((await call(quota.a,'getOperation',quota.A,qo.operationId)).phase,'UI_DIRTY');await call(quota.a,'commit',quota.A,qo.operationId);
    await fault(quota.a,{phase:'SYNCED',quota:true});await rejected(call(quota.a,'send',quota.A,qo.operationId),'P3_QUOTA');await quota.a.evaluate(()=>undoP3Fault());assert.equal((await call(quota.a,'getOperation',quota.A,qo.operationId)).phase,'LOCAL_ACK_PENDING');await boot(quota.a,quota.sourceId);assert.equal((await call(quota.a,'recover',quota.A,qo.operationId)).headSynced,true);assert.equal((await quota.source.read()).writes,1);check('P3-QUOTA-01',{injected:true,ackRecovered:true});

    const network=await init('network'),no=await call(network.a,'save',network.A,x,{expectedLocalRevision:0,requestId:'fiction-network'});network.source.setFault('before-send');assert.equal((await call(network.a,'send',network.A,no.operationId)).phase,'REMOTE_UNKNOWN');assert.equal((await network.source.read()).writes,0);assert.equal((await call(network.a,'recover',network.A,no.operationId)).sourceStatus,'UNKNOWN');await rejected(call(network.a,'send',network.A,no.operationId),'P3_SEND_STATE');assert.equal((await call(network.a,'send',network.A,no.operationId,{retryOriginal:true})).headSynced,true);check('P3-NETWORK-01');
    const prepared=await init('prepared'),pendingOriginal=await call(prepared.a,'save',prepared.A,x,{expectedLocalRevision:0,requestId:'fiction-prepared'});prepared.source.setFault('after-prepare');assert.equal((await call(prepared.a,'send',prepared.A,pendingOriginal.operationId)).phase,'REMOTE_UNKNOWN');assert.equal((await call(prepared.a,'recover',prepared.A,pendingOriginal.operationId)).sourceStatus,'PENDING');await rejected(call(prepared.a,'send',prepared.A,pendingOriginal.operationId,{retryOriginal:true}),'P3_SOURCE_PENDING');assert.equal((await prepared.source.read()).writes,0);assert.equal((await call(prepared.a,'getOperation',prepared.A,pendingOriginal.operationId)).requestHash,pendingOriginal.requestHash);check('P3-PREPARED-01');

    const blocked=await init('blocked');await fault(blocked.a,{phase:'LOCAL_DURABLE',quota:true});await rejected(call(blocked.a,'save',blocked.A,x,{expectedLocalRevision:0,requestId:'fiction-blocked'}),'P3_QUOTA');await blocked.a.evaluate(()=>undoP3Fault());const blockedOp=(await call(blocked.a,'snapshot')).operations.find(o=>o.requestId==='fiction-blocked');assert.equal(blockedOp.phase,'STORAGE_BLOCKED');await boot(blocked.a,blocked.sourceId);assert.equal((await call(blocked.a,'getOperation',blocked.A,blockedOp.operationId)).phase,'STORAGE_BLOCKED');assert.equal((await call(blocked.a,'commit',blocked.A,blockedOp.operationId)).phase,'LOCAL_DURABLE');check('P3-STORAGE-STATE-01');

    const race=await init('hash-race');await blockHash(race.a);const racing=call(race.a,'save',race.A,x,{expectedLocalRevision:0,requestId:'fiction-hash-a'});await race.a.waitForFunction(()=>p3HashReached);await call(race.b,'save',race.B,y,{expectedLocalRevision:0,requestId:'fiction-hash-b'});await race.a.evaluate(()=>{p3ResumeHash();p3UndoHash();});assert.equal((await racing).phase,'CONFLICT');await rejected(call(race.a,'read',{...race.A,token:race.B.token}),'P3_INSTANCE');check('P3-HASH-RACE-01');

    const branchQuota=await init('branch-quota');await call(branchQuota.a,'save',branchQuota.A,x,{expectedLocalRevision:0,requestId:'fiction-branch-a'});await fault(branchQuota.b,{store:'branches',quota:true});await rejected(call(branchQuota.b,'save',branchQuota.B,y,{expectedLocalRevision:0,requestId:'fiction-branch-b'}),'P3_QUOTA');await branchQuota.b.evaluate(()=>undoP3Fault());const bq=await call(branchQuota.a,'snapshot');assert.equal(bq.branches.filter(b=>b.workspaceId==='branch-quota').length,0);assert.equal((await call(branchQuota.a,'read',branchQuota.A)).data.clients[0].notes,x.clients[0].notes);const bqo=bq.operations.find(o=>o.requestId==='fiction-branch-b');assert.equal((await call(branchQuota.b,'getOperation',branchQuota.B,bqo.operationId)).originalRequest.data.clients[1].notes,y.clients[1].notes);assert.equal((await call(branchQuota.b,'commit',branchQuota.B,bqo.operationId)).phase,'CONFLICT');check('P3-BRANCH-QUOTA-01');

    for(const wanted of ['SENDING','REMOTE_COMMITTED']){
      const pending=await init('reopen-'+wanted.toLowerCase().replaceAll('_','-')),po=await call(pending.a,'save',pending.A,x,{expectedLocalRevision:0,requestId:'fiction-reopen-'+wanted});
      let release,arrived;const reached=new Promise(r=>arrived=r);hold={committed:arrived,release:new Promise(r=>release=r)};const p=call(pending.a,'send',pending.A,po.operationId).catch(()=>null);await reached;
      if(wanted==='REMOTE_COMMITTED'){const original=await call(pending.a,'getOperation',pending.A,po.operationId),proof=await pending.source.inspect(original.originalRequest);await call(pending.a,'acceptReceipt',pending.A,po.operationId,proof);}
      await boot(pending.a,pending.sourceId);release();await p;assert.equal((await call(pending.a,'getOperation',pending.A,po.operationId)).phase,wanted);assert.equal((await call(pending.a,'recover',pending.A,po.operationId)).headSynced,true);assert.equal((await pending.source.read()).writes,1);
    }check('P3-REOPEN-STATES-01');

    const collision=await init('collision'),co=await call(collision.a,'save',collision.A,x,{expectedLocalRevision:0,requestId:'fiction-collision-a'}),countBefore=(await call(collision.a,'snapshot')).bodies.length;
    await collision.a.evaluate(operationId=>{const native=crypto.randomUUID.bind(crypto);window.restoreUuid=()=>crypto.randomUUID=native;crypto.randomUUID=()=>operationId;},co.operationId);
    await rejected(call(collision.a,'stage',collision.A,y,{expectedLocalRevision:1,requestId:'fiction-collision-b'}),'P3_ID_COLLISION');await collision.a.evaluate(()=>restoreUuid());
    await call(collision.a,'stage',collision.A,x,{expectedLocalRevision:1,requestId:'fiction-same-body'});assert.equal((await call(collision.a,'snapshot')).bodies.length,countBefore);assert.equal((await call(collision.a,'getOperation',collision.A,co.operationId)).requestHash,co.requestHash);check('P3-ID-AND-DEDUP-01');

    const distinct=await init('distinct');await rejected(call(distinct.b,'createWorkspace',{workspaceId:'invalid-base',data:y}),'P3_BASE_UNVERIFIED');assert.equal((await call(distinct.b,'snapshot')).workspaces.some(w=>w.workspaceId==='invalid-base'),false);
    const alternateId='fiction-p3-distinct-alt';remotes.set(alternateId,await createSimulator({data:y,sourceId:alternateId}));await boot(distinct.b,alternateId);await call(distinct.b,'createWorkspace',{workspaceId:'distinct-base',data:y});const other=await call(distinct.b,'createInstance','distinct-base'),ownExport=await call(distinct.a,'exportInstance',distinct.A),otherExport=await call(distinct.b,'exportInstance',other);assert.notEqual(ownExport.baseRevision,otherExport.baseRevision);assert.deepEqual(ownExport.base,distinct.base);assert.deepEqual(otherExport.base,y);check('P3-BASES-01',{unverifiedBaseRejected:true});

    const originalBase=await init('original-base'),accepted=await call(originalBase.a,'save',originalBase.A,x,{expectedLocalRevision:0,requestId:'fiction-base-a'}),proposal=await call(originalBase.a,'stage',originalBase.A,y,{expectedLocalRevision:1,requestId:'fiction-base-b'});
    assert.equal((await call(originalBase.a,'send',originalBase.A,accepted.operationId)).headSynced,false);assert.equal((await call(originalBase.a,'commit',originalBase.A,proposal.operationId)).phase,'CONFLICT');await boot(originalBase.a,originalBase.sourceId);const originalExport=await call(originalBase.a,'exportInstance',originalBase.A);assert.deepEqual(originalExport.data,y);assert.deepEqual(originalExport.base,originalBase.base);assert.equal(originalExport.baseRevision,proposal.baseRemoteRevision);assert.equal(originalExport.operation.originalRequest.baseRevision,originalExport.baseRevision);check('P3-ORIGINAL-BASE-01');
    assert.equal(originalExport.snapshotRevision,2);await rejected(call(originalBase.a,'stage',originalBase.A,y,{expectedLocalRevision:2,requestId:'fiction-unreviewed-branch'}),'P3_BRANCH_REVIEW_REQUIRED');

    const brokenIndex=await init('broken-index');await call(brokenIndex.a,'save',brokenIndex.A,x,{expectedLocalRevision:0,requestId:'fiction-broken-index'});
    await brokenIndex.a.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open(p3Store.name,1);r.onsuccess=()=>resolve(r.result);});await new Promise(resolve=>{const t=db.transaction('requests','readwrite');t.objectStore('requests').delete('fiction-broken-index');t.oncomplete=resolve;});db.close();});
    assert.equal((await call(brokenIndex.a,'exportInstance',brokenIndex.A)).kind,'FORENSIC');await rejected(call(brokenIndex.a,'stage',brokenIndex.A,y,{expectedLocalRevision:1,requestId:'fiction-broken-index'}),'P3_REQUEST_REFERENCE');assert.equal((await call(brokenIndex.a,'snapshot')).operations.filter(o=>o.workspaceId==='broken-index').length,1);check('P3-INDEX-INTEGRITY-01');

    const exp=await init('export'),old=await call(exp.a,'exportInstance',exp.A);await blockHash(exp.a);const exporting=call(exp.a,'exportInstance',exp.A);await exp.a.waitForFunction(()=>p3HashReached);await call(exp.b,'save',exp.B,y,{expectedLocalRevision:0,requestId:'fiction-export'});await exp.a.evaluate(()=>{p3ResumeHash();p3UndoHash();});const exported=await exporting;assert.deepEqual(exported.data,old.data);assert.deepEqual(exported.base,old.base);assert.equal(exported.snapshotRevision,0);assert.equal(exported.operations.length,0);
    assert.equal((await call(exp.a,'exportInstance',exp.A,{memoryDraft:x})).kind,'FORENSIC');
    await exp.a.evaluate(async handle=>{const state=await p3Store.read(handle),db=await new Promise(resolve=>{const r=indexedDB.open(p3Store.name,1);r.onsuccess=()=>resolve(r.result);});await new Promise(resolve=>{const t=db.transaction('bodies','readwrite');t.objectStore('bodies').delete(state.view.baseRef);t.oncomplete=resolve;});db.close();},exp.A);
    const forensic=await call(exp.a,'exportInstance',exp.A);assert.equal(forensic.kind,'FORENSIC');assert.ok(forensic.integrity.issues.includes('P3_MISSING_BODY'));check('P3-EXPORT-01',{coherentConcurrentSnapshot:true,missingReferenceForensic:true});

    const legacy=await context.newPage();await legacy.goto(legacyOrigin);const oldCapture=await fixture.capture({large:true,sourceOrigin:legacyOrigin});
    await legacy.evaluate(async capture=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('theView.crmCommercial.v2.recovery.v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('copies',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});await new Promise((resolve,reject)=>{const t=db.transaction('copies','readwrite',{durability:'strict'});for(const f of capture.fragments){if(f.kind==='recovery')t.objectStore('copies').add(f.value);else localStorage.setItem(f.id.slice(3),f.value);}t.oncomplete=resolve;t.onabort=()=>reject(t.error);});window.oldDb=db;},oldCapture);
    const legacyHash=()=>legacy.evaluate(async()=>{const {encodeOriginal}=await import('/experimental/persistence-p2/codec.mjs'),rows=await new Promise(resolve=>{const t=oldDb.transaction('copies','readonly'),r=t.objectStore('copies').getAll();r.onsuccess=()=>resolve(r.result);});return (await encodeOriginal({rows,local:Array.from({length:localStorage.length},(_,i)=>{const k=localStorage.key(i);return [k,localStorage.getItem(k)];})})).rawHash;});
    const originalLegacy=await legacyHash(),isolated=await init('isolation');await call(isolated.a,'save',isolated.A,x,{expectedLocalRevision:0,requestId:'fiction-isolation'});assert.equal(await legacyHash(),originalLegacy);check('P3-LEGACY-01',{historyMiB:14.84,operationalSourceUntouched:true});
    const corruptData=structuredClone(isolated.base);corruptData.unknownRoot.syntheticCorruptionCase=true;const corruptSource='fiction-p3-corrupt-body';remotes.set(corruptSource,await createSimulator({data:corruptData,sourceId:corruptSource}));await boot(isolated.a,corruptSource);await call(isolated.a,'createWorkspace',{workspaceId:'corrupt-body',data:corruptData});const corruptHandle=await call(isolated.a,'createInstance','corrupt-body');
    await isolated.a.evaluate(async handle=>{const selected=await p3Store.read(handle),snapshot=await p3Store.snapshot(),body=snapshot.bodies.find(b=>b.bodyRef===selected.view.headRef),db=await new Promise(resolve=>{const r=indexedDB.open(p3Store.name,1);r.onsuccess=()=>resolve(r.result);});body.version=2;await new Promise(resolve=>{const t=db.transaction('bodies','readwrite');t.objectStore('bodies').put(body);t.oncomplete=resolve;});db.close();},corruptHandle);
    assert.equal((await call(isolated.a,'exportInstance',corruptHandle)).kind,'FORENSIC');await rejected(call(isolated.a,'stage',corruptHandle,x,{expectedLocalRevision:0,requestId:'fiction-corrupt'}),'P2_BODY_INTEGRITY');check('P3-BODY-INTEGRITY-01');

    if(engine==='chromium'&&viewport==='desktop'){
      const terminated=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',`$p='${path.basename(profile)}'; $targets=@(Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'chrome.exe' -and $_.CommandLine -and $_.CommandLine.Contains($p) }); if (!$targets.Count) { exit 2 }; foreach ($target in $targets) { Stop-Process -Id $target.ProcessId -Force -ErrorAction SilentlyContinue }; Write-Output $targets.Count; exit 0`],{encoding:'utf8',timeout:15000,windowsHide:true});assert.ok(Number(terminated.trim())>0);
      await Promise.race([context.close().catch(()=>{}),new Promise(r=>setTimeout(r,1000))]);context=null;await launch();const a=await context.newPage();await boot(a,c.sourceId);const recovered=await call(a,'exportInstance',c.A);assert.equal(recovered.data.clients[0].notes,x.clients[0].notes);assert.equal(recovered.kind,'RECOVERABLE');report.abruptCrash='chromium-process-terminated-and-reopened';
    }
    assert.deepEqual(report.errors,[]);report.status='passed';report.version=context.browser()?.version();
  }catch(e){report.status='failed';report.failure=String(e.stack||e).slice(0,2600);}
  finally{if(context)await context.close().catch(()=>{});results.push(report);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,realGoogle:false,productionActivated:false,safariReal:false},null,2));console.log(JSON.stringify(report));}
}
}finally{for(const s of servers)await new Promise(resolve=>s.close(resolve));}
if(results.some(r=>r.status!=='passed'))process.exitCode=1;
