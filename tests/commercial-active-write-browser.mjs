import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
const verifier=createRequire(import.meta.url)('../scripts/verify-browser-archive.cjs');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN,key='theView.crmCommercial.v2',out=process.env.HOTFIX_ARTIFACTS||path.join(os.tmpdir(),'the-view-active-write');
if(!origin||new URL(origin).hostname!=='127.0.0.1'||!/^53\d{3}$/.test(new URL(origin).port))throw Error('Dedicated fictitious loopback source required');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE}),results=[],errors=[];
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const digest=v=>createHash('sha256').update(canonical(v)).digest('hex');
async function source(page){return page.evaluate(async()=>await(await fetch('/api/commercial-data')).json());}
async function summary(page){return page.evaluate(()=>({phase:__storageGrowthTest.sharedSync.phase,error:__storageGrowthTest.sharedSync.error,verified:__storageGrowthTest.sharedSync.verified}));}
async function historyHash(page){return page.evaluate(async()=>{const a=__storageGrowthTest;return __recoveryArchiveTest.recoveryChecksum(JSON.stringify((await a.raw()).filter(r=>r.id.startsWith('fiction-hotfix-history-'))));});}
async function allHash(page){return page.evaluate(async()=>__recoveryArchiveTest.recoveryChecksum(JSON.stringify(await __storageGrowthTest.raw())));}
async function seed(page){return page.evaluate(async()=>{
  const a=__storageGrowthTest,r=__recoveryArchiveTest;a.cancel();const total=Math.floor(14.84*1024*1024/2)*2,rows=[];let used=0;
  const bytes=copy=>{const {raw,signature='',rawChecksum='',...meta}=copy;return 2*(raw.length+signature.length+rawChecksum.length+JSON.stringify(meta).length);};
  const small={clients:[{id:'fiction-old-client'}],events:[],agents:[]};
  for(let i=0;i<15;i++){
    const v=i>=11?{unknownEnvelope:'',preserve:true}:{recoveryFormat:1,data:small,base:small,pendingWrite:i<8?{action:'save',requestId:'fiction-old-request-'+i,baseRevision:'a'.repeat(64),data:small}:null,pendingSync:true,syncMeta:{revision:'a'.repeat(64),lastConfirmedAt:'2026-10-21T10:00:00Z'},reason:''};
    const copy={id:'fiction-hotfix-history-'+i,kind:i<8?'write-request':'legacy',raw:JSON.stringify(v),signature:'0'.repeat(64),rawChecksum:'0'.repeat(64),createdAt:'2026-10-21T10:00:00Z',protected:true,needsReview:false};
    const target=i===14?total-used:Math.floor(total/15/2)*2,padding='x'.repeat(Math.max(0,(target-bytes(copy))/2));if(i>=11)v.unknownEnvelope=padding;else v.reason=padding;
    copy.raw=JSON.stringify(v);copy.signature=await r.recoveryChecksum(r.recoveryContent(v));copy.rawChecksum=await r.recoveryChecksum(copy.raw);rows.push(copy);used+=bytes(copy);
  }
  await r.localVaultTransaction('readwrite',(store,done)=>{store.clear();for(const copy of rows)store.add(copy);done(true);});return {records:rows.length,bytes:used};
});}
async function save(page,index,notes,recovery=false){return page.evaluate(async({index,notes,recovery})=>{const a=__storageGrowthTest;if(index!==null){a.state.data.clients[index].notes=notes;a.save();}const ok=await a.sync(recovery);a.cancel();return {ok,phase:a.sharedSync.phase,error:a.sharedSync.error,verified:a.sharedSync.verified};},{index,notes,recovery});}
async function download(page){const event=page.waitForEvent('download');await page.evaluate(()=>__recoveryArchiveTest.exportLocalBackupArchive());const file=await event;assert.equal(await file.failure(),null);const filename=await file.path(),parsed=JSON.parse(await fs.readFile(filename,'utf8'));assert.equal(verifier.inspect(filename).report.records,parsed.records.length);return parsed;}
try{
  for(const [viewport,width,height]of [['desktop',1440,1000],['mobile',390,844]]){
    const label=viewport+'-'+randomUUID();
    const context=await browser.newContext({viewport:{width,height},acceptDownloads:true});
    try{
      await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());const page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
      await page.goto(origin+'/commercial.html');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.waitForFunction(()=>window.__storageGrowthTest?.sharedSync.phase==='synced');await page.waitForFunction(()=>window.__autoSyncTest.idle());
      const base=await source(page),seeded=await seed(page),original=await historyHash(page);assert.equal(seeded.records,15);assert.ok(seeded.bytes>14.83*1024*1024&&seeded.bytes<=14.84*1024*1024);
      let loseAfter=false,loseBefore=false;const posts=[],guards=[];
      await page.route('**/api/commercial-data',async route=>{
        if(route.request().method()!=='POST')return route.continue();const payload=route.request().postDataJSON();posts.push(payload.requestId);
        guards.push(await page.evaluate(async expected=>{const rows=await __storageGrowthTest.raw(),record=rows.find(r=>r.id==='active-write.v1'),saved=record&&JSON.parse(record.raw).pendingWrite;return Boolean(saved&&saved.requestId===expected.requestId&&saved.baseRevision===expected.baseRevision&&JSON.stringify(saved.data)===JSON.stringify(expected.data));},payload));
        if(loseBefore){loseBefore=false;return route.abort('failed');}if(loseAfter){loseAfter=false;await route.fetch();return route.abort('failed');}return route.continue();
      });
      const large='Synthetic hotfix '+label;let result=await save(page,0,large);assert.equal(result.ok,true,JSON.stringify(result));assert.equal(result.phase,'synced');assert.equal(await historyHash(page),original);
      const first=await source(page),expected=structuredClone(base.data);expected.clients[0].notes=large;assert.equal(digest(first.data),digest(expected),'Only the intended synthetic client note may change');
      await page.reload();await page.waitForFunction(()=>window.__storageGrowthTest?.sharedSync.phase==='synced');assert.equal(await historyHash(page),original);assert.equal(await page.evaluate(()=>__storageGrowthTest.state.data.clients[0].notes),large);
      result=await save(page,1,'Synthetic second '+label);assert.equal(result.ok,true,JSON.stringify(result));assert.equal((await page.evaluate(()=>__storageGrowthTest.raw())).length,17);assert.equal(await historyHash(page),original);
      loseAfter=true;result=await save(page,2,'Synthetic lost response '+label);assert.equal(result.ok,false);assert.notEqual(result.phase,'synced');const pending=await page.evaluate(key=>localStorage.getItem(key+'.pendingWrite.v1'),key);assert.ok(pending);const committed=await source(page);assert.equal(committed.data.clients[2].notes,'Synthetic lost response '+label);
      const exported=await download(page);assert.equal(exported.records.length,17);assert.equal(exported.current.pendingWrite.requestId,JSON.parse(pending).requestId);
      await page.reload();await page.waitForFunction(()=>window.__storageGrowthTest?.sharedSync.initialized);assert.equal(await page.evaluate(key=>localStorage.getItem(key+'.pendingWrite.v1'),key),pending);
      result=await save(page,null,null,true);assert.equal(result.ok,true,JSON.stringify(result));assert.equal((await source(page)).revision,committed.revision);assert.equal((await source(page)).data.events.length,base.data.events.length);assert.equal(await page.evaluate(key=>localStorage.getItem(key+'.pendingWrite.v1'),key),null);assert.equal(await historyHash(page),original);
      const beforeQuota=await allHash(page),postCount=posts.length;
      await page.evaluate(()=>{const put=IDBObjectStore.prototype.put;window.__restoreHotfixPut=()=>IDBObjectStore.prototype.put=put;IDBObjectStore.prototype.put=function(value,...args){if(value?.id==='active-write.v1'&&!value.confirmationReceipt)throw new DOMException('Fictitious quota fault','QuotaExceededError');return put.call(this,value,...args);};});
      result=await save(page,3,'Synthetic local quota '+label);assert.equal(result.ok,false);assert.equal(result.error,'LOCAL_STORAGE_FAILED');assert.equal(result.verified,false);assert.notEqual(result.phase,'synced');assert.equal(posts.length,postCount);assert.equal(await allHash(page),beforeQuota);const quotaPending=await page.evaluate(key=>localStorage.getItem(key+'.pendingWrite.v1'),key);assert.ok(quotaPending);
      const quotaExport=await download(page);assert.equal(quotaExport.current.pendingWrite.requestId,JSON.parse(quotaPending).requestId);await page.evaluate(()=>__restoreHotfixPut());
      await page.reload();await page.waitForFunction(()=>window.__storageGrowthTest?.sharedSync.initialized);assert.equal(await page.evaluate(key=>localStorage.getItem(key+'.pendingWrite.v1'),key),quotaPending);result=await save(page,null,null);assert.equal(result.ok,true,JSON.stringify(result));assert.equal((await source(page)).data.clients[3].notes,'Synthetic local quota '+label);assert.equal(await historyHash(page),original);
      loseBefore=true;result=await save(page,4,'Synthetic uncertain original '+label);assert.equal(result.ok,false);const uncertain=await page.evaluate(key=>localStorage.getItem(key+'.pendingWrite.v1'),key),frozen=await allHash(page),uncertainPosts=posts.length;
      await page.evaluate(label=>{__storageGrowthTest.state.data.clients[4].notes='Synthetic newer unsent '+label;__storageGrowthTest.save();},label);result=await save(page,null,null,true);assert.equal(result.ok,false);assert.equal(result.error,'PENDING_REQUEST_REVIEW_REQUIRED');assert.equal(posts.length,uncertainPosts);assert.equal(await allHash(page),frozen);assert.equal(await page.evaluate(key=>localStorage.getItem(key+'.pendingWrite.v1'),key),uncertain);
      await page.reload();await page.waitForFunction(()=>window.__storageGrowthTest?.sharedSync.initialized);assert.equal(await page.evaluate(key=>localStorage.getItem(key+'.pendingWrite.v1'),key),uncertain);assert.equal(await page.evaluate(()=>__storageGrowthTest.state.data.clients[4].notes),'Synthetic newer unsent '+label);assert.notEqual((await summary(page)).phase,'synced');assert.equal(await historyHash(page),original);assert.ok(guards.length>=5&&guards.every(Boolean));
      const final=(await source(page)).data;for(const field of ['statuses','finalPrices','priceHistory','salePrices','saleCommissions','statusEventIds','salePriceEventIds','agents','events'])assert.equal(digest(final[field]),digest(base.data[field]),field);for(let i=5;i<base.data.clients.length;i++)assert.equal(digest(final.clients[i]),digest(base.data.clients[i]));
      results.push({viewport,historyRecords:15,historyMiB:seeded.bytes/1024/1024,historicalCopiesUnchanged:true,saveReload:true,proofBoundRotation:true,lostResponseIdempotentRecovery:true,quotaInjectedAtomicRollback:true,noPostWithoutDurableRequest:guards.every(Boolean),exportAfterStorageFailure:true,oldUncertainRequestAndNewerEditsPreserved:true,reservationsPricesEventsAndUnrelatedClientsUnchanged:true});
    }finally{await context.close();}
  }
  assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify({results,errors,realGoogle:false},null,2));console.log(JSON.stringify({results,errors}));
}finally{await browser.close();}
