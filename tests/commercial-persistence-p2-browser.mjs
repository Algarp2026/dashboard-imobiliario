import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),fixture=require('./helpers/persistence-p2-fixture.cjs'),here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'..');
const playwright=await import(process.env.PLAYWRIGHT_MODULE||'playwright'),sourcePort=Number(process.env.P2_SOURCE_PORT||53472),destPort=Number(process.env.P2_DEST_PORT||53473);
for(const p of [sourcePort,destPort])assert.ok(Number.isInteger(p)&&p>=53000&&p<=53999);assert.notEqual(sourcePort,destPort);
const sourceOrigin='http://127.0.0.1:'+sourcePort,destOrigin='http://127.0.0.1:'+destPort,out=path.resolve(process.env.P2_ARTIFACTS||path.join(os.tmpdir(),'the-view-p2'));
fs.mkdirSync(out,{recursive:true});const servers=[],results=[];let deniedMethods=0;
for(const port of [sourcePort,destPort]){
  const server=http.createServer((req,res)=>{
    res.setHeader('Cache-Control','no-store');if(req.method!=='GET'){deniedMethods++;res.writeHead(405);res.end();return;}
    const name=req.url?.split('?')[0];
    if(['/experimental/persistence-p2/codec.mjs','/experimental/persistence-p2/reader.mjs','/experimental/persistence-p2/shadow.mjs'].includes(name)){res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(path.join(repo,name.slice(1))));return;}
    if(name!=='/'&&name!=='/frame'){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta charset="utf-8"><title>P2 synthetic laboratory</title>');
  });await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});servers.push(server);
}
async function modules(page){await page.evaluate(async()=>{window.p2Codec=await import('/experimental/persistence-p2/codec.mjs');window.p2Reader=await import('/experimental/persistence-p2/reader.mjs');window.p2Shadow=await import('/experimental/persistence-p2/shadow.mjs');});}
async function setup(context,{seed,viewport}){
  const source=await context.newPage();await source.goto(sourceOrigin);await modules(source);
  if(seed)await source.evaluate(async capture=>{
    localStorage.clear();const key='theView.crmCommercial.v2',db=await new Promise((resolve,reject)=>{const r=indexedDB.open(key+'.recovery.v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('copies',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    await new Promise((resolve,reject)=>{const tx=db.transaction('copies','readwrite',{durability:'strict'});const store=tx.objectStore('copies');store.clear();for(const f of capture.fragments){if(f.id.startsWith('ls:'))localStorage.setItem(f.id.slice(3),f.value);else store.add(f.value);}tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();
  },seed);
  await source.evaluate(async()=>{
    const key='theView.crmCommercial.v2';window.p2Db=await new Promise((resolve,reject)=>{const r=indexedDB.open(key+'.recovery.v1',1);r.onupgradeneeded=()=>{r.transaction.abort();reject(Error('No source'));};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    window.p2SourceWrites=0;window.p2SourceVersionChanges=0;window.p2Db.onversionchange=()=>p2SourceVersionChanges++;
    const native=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(names,mode,options){if(this.name===key+'.recovery.v1'&&mode==='readwrite')p2SourceWrites++;return native.call(this,names,mode,options);};
    window.p2Read=()=>p2Reader.readExisting({storage:localStorage,recoveryDb:p2Db,sourceOrigin:location.origin});
    window.p2SourceHash=async()=>{const capture=await p2Read();return (await p2Codec.encodeOriginal(capture.fragments)).rawHash;};
  });
  const dest=await context.newPage();await dest.goto(destOrigin);await modules(dest);
  // Test-only bridge between top-level origins; avoids third-party storage partitioning.
  await dest.exposeFunction('p2FixtureRead',()=>source.evaluate(()=>p2Read()));
  await dest.evaluate(({sourceOrigin,viewport})=>{
    window.p2ReadSource=()=>p2FixtureRead();
    window.p2Name='the-view-p2-shadow-lab.'+viewport;
    window.p2Open=async()=>window.p2Store=await p2Shadow.openShadow({factory:indexedDB,origin:location.origin,sourceOrigin,synthetic:true,name:p2Name});
  },{sourceOrigin,viewport});await dest.evaluate(()=>p2Open());return {source,dest};
}
async function copyAll(dest,id){
  for(let i=0;i<30;i++){const before=await dest.evaluate(id=>p2Store.diagnose(id),id),after=await dest.evaluate(id=>p2Store.copyBatch(id,{readSource:p2ReadSource,maxItems:4,maxBytes:3*1024*1024}),id);if(after.cursor===before.cursor&&after.revision===undefined)throw Error('Missing revision');if(after.cursor===before.cursor){const now=await dest.evaluate(id=>p2Store.diagnose(id),id);if(now.bodies===before.bodies)return;} }
  throw Error('P2 bounded copy did not finish');
}
async function fingerprint(dest){return dest.evaluate(async()=>{const s=await p2Store.snapshot(),bodies=[];for(const b of s.bodies)bodies.push({ref:b.bodyRef,hash:await p2Codec.sha(b.bytes)});return p2Codec.commercialHash({...s,bodies});});}
async function state(dest,id){return dest.evaluate(id=>p2Store.diagnose(id),id);}
async function fault(dest,type,fn){
  await dest.evaluate(type=>{const put=IDBObjectStore.prototype.put,add=IDBObjectStore.prototype.add;window.p2UndoFault=()=>{IDBObjectStore.prototype.put=put;IDBObjectStore.prototype.add=add;};function wrap(native){return function(value,...args){if(this.name==='migration'){if(type==='quota')throw new DOMException('Synthetic quota','QuotaExceededError');this.transaction.abort();throw new DOMException('Synthetic abort','AbortError');}return native.call(this,value,...args);};}IDBObjectStore.prototype.put=wrap(put);IDBObjectStore.prototype.add=wrap(add);},type);
  try{return await fn();}finally{await dest.evaluate(()=>p2UndoFault());}
}
try{
  for(const engine of (process.env.P2_BROWSER_ENGINES||'chromium,firefox,webkit').split(','))for(const viewport of ['desktop','mobile']){
    const report={engine,viewport,checks:[],errors:[],nativeQuota:'pending-not-portable',abruptCrash:'pending-not-portable'};let context;
    const profile=fs.mkdtempSync(path.join(os.tmpdir(),'tv-p2-'+engine+'-')),options={headless:true,viewport:viewport==='desktop'?{width:1440,height:1000}:{width:390,height:844},...(engine==='chromium'&&process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})};
    async function launch(){context=await playwright[engine].launchPersistentContext(profile,options);await context.route('**/*',r=>[sourceOrigin,destOrigin].includes(new URL(r.request().url()).origin)?r.continue():r.abort());context.on('page',p=>p.on('pageerror',e=>report.errors.push(e.message)));}
    try{
      console.log('P2 stage',engine,viewport,'launch');await launch();let {source,dest}=await setup(context,{seed:await fixture.capture({large:viewport==='desktop',sourceOrigin}),viewport});console.log('P2 stage',engine,viewport,'seeded');const original=await source.evaluate(()=>p2SourceHash());
      await dest.evaluate(()=>p2Store.begin('main'));const empty=await fingerprint(dest);
      for(const type of ['abort','quota']){const code=await fault(dest,type,()=>dest.evaluate(async()=>{try{await p2Store.copyBatch('main',{readSource:p2ReadSource,maxItems:4});return '';}catch(e){return e.code;}}));assert.equal(code,type==='quota'?'P2_QUOTA':'P2_ABORT');assert.equal(await fingerprint(dest),empty);}
      report.checks.push({id:'P2-TX-01',status:'implemented-tested',abortAndInjectedQuotaAtomic:true});
      await dest.evaluate(()=>p2Store.copyBatch('main',{readSource:p2ReadSource,maxItems:4}));const checkpoint=await state(dest,'main');assert.ok(checkpoint.cursor>0);
      await context.close();await launch();({source,dest}=await setup(context,{viewport}));assert.equal((await state(dest,'main')).cursor,checkpoint.cursor);assert.equal(await source.evaluate(()=>p2SourceHash()),original);
      console.log('P2 stage',engine,viewport,'resume');await copyAll(dest,'main');console.log('P2 stage',engine,viewport,'copied');const copied=await fingerprint(dest);await copyAll(dest,'main');assert.equal(await fingerprint(dest),copied);
      await dest.evaluate(()=>p2Store.verify('main'));const ready=await dest.evaluate(()=>p2Store.ready('main',{readSource:p2ReadSource}));assert.equal(ready.phase,'READY');assert.equal(ready.activationAllowed,false);assert.equal(await dest.evaluate(()=>typeof p2Store.activate),'undefined');
      const exact=await dest.evaluate(async()=>{const capture=await p2ReadSource(),analysis=await p2Reader.inspectCapture(capture);for(const e of analysis.entries){const decoded=await p2Store.reconstruct(e.body.bodyRef),again=await p2Codec.encodeOriginal(decoded);if(again.bodyRef!==e.body.bodyRef)return false;}return true;});assert.equal(exact,true);assert.equal(await source.evaluate(()=>p2SourceHash()),original);assert.equal(await source.evaluate(()=>p2SourceWrites),0);assert.equal(await source.evaluate(()=>p2SourceVersionChanges),0);
      report.checks.push({id:'P2-MIG-01',status:'implemented-tested',normalRestart:true,idempotentBatches:true,byteExactReconstruction:true,noSourceWrites:true,noSourceVersionChange:true,activationUnavailable:true,largeHistoricalFixture:viewport==='desktop'});
      const beforeOldWriter=await fingerprint(dest);await source.evaluate(async name=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore('old-only');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});await new Promise((resolve,reject)=>{const tx=db.transaction('old-only','readwrite');tx.objectStore('old-only').put('Cannot affect destination',1);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();},'the-view-p2-shadow-lab.'+viewport);assert.equal(await fingerprint(dest),beforeOldWriter);
      report.checks.push({id:'P2-MIX-01',status:'implemented-tested',oldOriginCannotAlterDestination:true,oldWriterNotCooperative:true});
      const mutation=await dest.evaluate(async()=>{const s=await p2Store.snapshot(),ref=s.migration.find(x=>x.id==='main').bodyRefs[0],body=s.bodies.find(x=>x.bodyRef===ref),db=await new Promise(resolve=>{const r=indexedDB.open(p2Name,1);r.onsuccess=()=>resolve(r.result);});await new Promise(resolve=>{const t=db.transaction('bodies','readwrite');t.objectStore('bodies').delete(ref);t.oncomplete=resolve;});let code;try{await p2Store.verify('main');}catch(e){code=e.code;}await new Promise(resolve=>{const t=db.transaction('bodies','readwrite');t.objectStore('bodies').put(body);t.oncomplete=resolve;});db.close();return code;});assert.equal(mutation,'P2_MISSING_REFERENCE');await dest.evaluate(()=>p2Store.verify('main'));
      report.checks.push({id:'P2-REF-03',status:'implemented-tested',readyFlagDoesNotHideMissingBody:true});
      await dest.evaluate(async()=>{
        const read=async()=>{const capture=await p2ReadSource();return {...capture,fragments:capture.fragments.filter(x=>x.id.startsWith('ls:'))};};
        await p2Store.begin('phases');
        for(const phase of ['DISCOVERED','COPYING','VERIFIED','READY']){
          if(phase==='COPYING')await p2Store.copyBatch('phases',{readSource:read});
          if(phase==='VERIFIED')await p2Store.verify('phases');
          if(phase==='READY')await p2Store.ready('phases',{readSource:read});
          const before=await p2Store.diagnose('phases');if(before.phase!==phase)throw Error('P2_PHASE');
          p2Store.close();await p2Open();const after=await p2Store.diagnose('phases');
          if(JSON.stringify(before)!==JSON.stringify(after))throw Error('P2_CHECKPOINT_RESUME');
        }
      });
      const verifiedBefore=await fingerprint(dest);
      const verifyAbort=await fault(dest,'abort',()=>dest.evaluate(async()=>{try{await p2Store.verify('phases');await p2Store.verify('main');await p2Store.begin('fail-begin');return '';}catch(e){return e.code;}}));assert.equal(verifyAbort,'P2_ABORT');assert.equal(await fingerprint(dest),verifiedBefore);
      report.checks.push({id:'P2-CHECKPOINT-01',status:'implemented-tested',everyPhaseReopen:true,failedCheckpointAtomic:true});
      await dest.evaluate(async()=>{
        await p2Store.begin('during-copy');let reads=0;
        const read=async()=>{const c=await p2ReadSource();c.fragments=c.fragments.filter(x=>x.id.startsWith('ls:'));if(++reads>1){const f=c.fragments.find(x=>x.kind==='cache'),data=JSON.parse(f.value);data.clients[0].notes='Synthetic between captures';f.value=JSON.stringify(data);}return c;};
        await p2Store.copyBatch('during-copy',{readSource:read,maxItems:8});const s=await p2Store.snapshot(),item=s.migration.find(x=>x.id==='during-copy').items.find(x=>x.kind==='cache');
        if(item.refs.length!==2)throw Error('P2_VARIANTS_NOT_PRESERVED');await p2Store.verify('during-copy');
        try{await p2Store.ready('during-copy',{readSource:read});throw Error('P2_UNEXPECTED_READY');}catch(e){if(e.code!=='P2_REVIEW_REQUIRED')throw e;}
      });report.checks.push({id:'P2-MIG-03',status:'implemented-tested',twoCaptureVariantsRetained:true,completionBlocked:true});
      if(engine==='chromium'&&viewport==='desktop'){
        console.log('P2 stage',engine,viewport,'crash');
        const killed=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',`$p='${profile.replaceAll("'","''")}'; $targets=@(Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'chrome.exe' -and $_.CommandLine -and $_.CommandLine.Contains($p) }); if (!$targets.Count) { exit 2 }; foreach ($target in $targets) { Stop-Process -Id $target.ProcessId -Force -ErrorAction SilentlyContinue }; Write-Output $targets.Count`],{encoding:'utf8',timeout:15000,windowsHide:true});assert.ok(Number(killed.trim())>0);
        await Promise.race([context.close().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,1000))]);context=null;
        await launch();({source,dest}=await setup(context,{viewport}));assert.equal(await source.evaluate(()=>p2SourceHash()),original);await dest.evaluate(()=>p2Store.verify('main'));assert.ok((await state(dest,'main')).cursor>0);report.abruptCrash='browser-process-crash-and-reopen-passed';
      }
      await source.evaluate(()=>{const key='theView.crmCommercial.v2',d=JSON.parse(localStorage.getItem(key));d.clients[0].notes='Synthetic old-tab divergence';localStorage.setItem(key,JSON.stringify(d));});
      const divergent=await dest.evaluate(async()=>{try{await p2Store.ready('main',{readSource:p2ReadSource});return '';}catch(e){return e.code;}});assert.equal(divergent,'P2_SOURCE_DIVERGED');const variants=await dest.evaluate(async()=>{const s=await p2Store.snapshot();return s.branches.filter(x=>x.kind==='shadow-source-variants').length;});assert.ok(variants>0);
      report.checks.push({id:'P2-MIG-02',status:'implemented-tested',oldAndNewVariantsRetained:true,readyBlockedOnSourceChange:true});
      await dest.evaluate(()=>p2Store.begin('quota'));const beforeNative=await state(dest,'quota');
      if(engine==='chromium'&&viewport==='desktop'){
        const cdp=await context.newCDPSession(dest);await cdp.send('Storage.overrideQuotaForOrigin',{origin:destOrigin,quotaSize:1024*1024});
        const filled=await dest.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('p2-bounded-quota-filler',1);r.onupgradeneeded=()=>r.result.createObjectStore('filler');r.onsuccess=()=>resolve(r.result);});try{for(let i=0;i<100;i++){const bytes=new Uint8Array(128*1024);for(let k=0;k<bytes.length;k+=65536)crypto.getRandomValues(bytes.subarray(k,k+65536));await new Promise((resolve,reject)=>{const t=db.transaction('filler','readwrite');t.objectStore('filler').put(new Blob([bytes]),i);t.oncomplete=resolve;t.onabort=()=>reject(t.error);});}return false;}catch(e){if(e.name!=='QuotaExceededError')throw e;return true;}finally{db.close();}});
        if(filled){const code=await dest.evaluate(async()=>{try{await p2Store.copyBatch('quota',{readSource:p2ReadSource});return '';}catch(e){return e.code;}});assert.equal(code,'P2_QUOTA');assert.deepEqual(await state(dest,'quota'),beforeNative);report.nativeQuota='browser-enforced-passed';}else report.nativeQuota='not-demonstrated-with-bounded-allocation';
        await cdp.send('Storage.overrideQuotaForOrigin',{origin:destOrigin});
      }
      await dest.evaluate(()=>p2Store.copyBatch('quota',{readSource:p2ReadSource}));assert.ok((await state(dest,'quota')).cursor>beforeNative.cursor);
      assert.equal(await source.evaluate(()=>p2SourceVersionChanges),0);assert.deepEqual(report.errors,[]);report.version=context.browser()?.version()||engine;report.status='passed';
    }catch(e){report.status='failed';report.failure=typeof e.code==='string'&&e.code.startsWith('P2_')?e.code:String(e.stack||e).slice(0,1800);}
    finally{if(context)await context.close().catch(()=>{});results.push(report);fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({results,deniedMethods,realGoogle:false,safariReal:false},null,2));console.log(JSON.stringify(report));}
  }
}finally{for(const server of servers)await new Promise(resolve=>server.close(resolve));}
if(results.some(x=>x.status!=='passed'))process.exitCode=1;
