import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {syncAction} from './helpers/current-client-ui.mjs';
import {recoveryCopies,hasArchivedPending} from './helpers/local-backups.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.PHASE2A_TEST_ORIGIN,key='theView.crmCommercial.v2';
if(!origin||new URL(origin).hostname!=='127.0.0.1'||!/^53\d{3}$/.test(new URL(origin).port))throw Error('Isolated fixture required');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const errors=[],results=[];
async function session(width=1440){
  const context=await browser.newContext({viewport:{width,height:1000},acceptDownloads:true});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  page.on('dialog',dialog=>dialog.accept());
  await page.goto(origin+'/commercial.html');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.locator('[data-client="demo-0"]').waitFor();
  return{context,page};
}
const phase=(page,value)=>page.waitForFunction(value=>document.getElementById('commercialSyncBadge')?.dataset.phase===value,value);
async function download(page,name){
  const pending=page.waitForEvent('download');await page.getByRole('button',{name,exact:true}).click();const file=await pending;
  return JSON.parse(await fs.readFile(await file.path(),'utf8'));
}
async function dismiss(page){const node=await page.locator('#appDialogModal').elementHandle();await page.locator('#appDialogModal [data-dialog-confirm]').click();await page.waitForFunction(node=>!node.isConnected,node);await node.dispose()}
async function move(page){await page.getByRole('button',{name:'Transferir backups antigos',exact:true}).click();await dismiss(page);await page.locator('#appDialogModal').waitFor()}
try{
  for(const reserve of [4096,0]){
    const {page,context}=await session(reserve?1440:390),posts=[];
    page.on('request',request=>{if(request.url()===origin+'/api/commercial-data'&&request.method()==='POST')posts.push(JSON.parse(request.postData()))});
    const initial=await page.evaluate(async()=>await(await fetch('/api/commercial-data')).json());
    const setup=await page.evaluate(({key,reserve})=>{
      const data=JSON.parse(localStorage.getItem(key)),meta=JSON.parse(localStorage.getItem(key+'.syncMeta.v1'));
      const pending=JSON.stringify({action:'save',requestId:'fiction-quota-original-'+reserve,baseRevision:meta.revision,data});
      localStorage.setItem(key+'.pendingWrite.v1',pending);
      data.clients[0].manualNextStep='Fictitious quota next action '+reserve;data.clients[0].notes='Fictitious quota edit';
      data.events.push({id:'fiction-quota-event-'+reserve,clientId:data.clients[0].id,type:'Outro',fractions:[],date:'2026-10-21',notes:'Fictitious quota'});
      localStorage.setItem(key,JSON.stringify(data));localStorage.setItem(key+'.pendingSync','{}');
      const raw=size=>JSON.stringify({data:{fixturePadding:'x'.repeat(size)},createdAt:'2026-10-21T12:00:00Z'});
      let full=0,quotaHit=false;
      for(;full<32;full++){try{localStorage.setItem(key+'.conflictBackup.legacy-'+full,raw(512*1024))}catch(error){if(error.name!=='QuotaExceededError')throw error;quotaHit=true;break}}
      if(!quotaHit)throw Error('Browser quota not reached');
      let low=0,high=512*1024;
      while(low<high){const middle=Math.ceil((low+high)/2);try{localStorage.setItem(key+'.conflictBackup.legacy-tail',raw(middle));low=middle}catch(error){if(error.name!=='QuotaExceededError')throw error;high=middle-1}}
      localStorage.setItem(key+'.conflictBackup.legacy-tail',raw(low));
      if(reserve)localStorage.setItem(key+'.conflictBackup.legacy-0',raw(512*1024-reserve));
      let oldBackupFailed=false;
      try{localStorage.setItem(key+'.conflictBackup.native-probe',JSON.stringify({data,base:meta.base,pendingWrite:JSON.parse(pending)}))}catch(error){if(error.name!=='QuotaExceededError')throw error;oldBackupFailed=true}
      localStorage.removeItem(key+'.conflictBackup.native-probe');
      return{pending,quotaHit,oldBackupFailed,full,local:localStorage.getItem(key),legacy:Object.keys(localStorage).filter(k=>k.startsWith(key+'.conflictBackup.legacy-')).map(k=>[k,localStorage.getItem(k)])};
    },{key,reserve});
    assert.equal(setup.quotaHit,true);assert.equal(setup.oldBackupFailed,true);
    await page.reload();await phase(page,'conflict');assert.equal(posts.length,0);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),setup.local);
    await syncAction(page,'[data-sync-review]');await page.locator('[data-sync-merge]').click();
    if(!reserve){
      await page.locator('#appDialogModal').waitFor();assert.ok((await page.locator('#commercialSyncStatus').innerText()).includes('LOCAL_STORAGE_FAILED'));
      assert.equal(await page.evaluate(key=>localStorage.getItem(key+'.pendingWrite.v1'),key),setup.pending);
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),setup.local);
      await dismiss(page);await page.locator('[data-sync-close]').click();
    }else{
      await page.locator('#syncReviewModal').waitFor({state:'detached'});await phase(page,'pending');
      assert.equal(await hasArchivedPending(page,setup.pending),true);
    }
    assert.equal(posts.length,0,'Quota must not cause a blind POST');
    const exported=await download(page,'Exportar cópia local');
    assert.equal(exported.data.clients[0].manualNextStep,'Fictitious quota next action '+reserve);
    assert.equal(exported.data.events.filter(event=>event.id==='fiction-quota-event-'+reserve).length,1);
    const archive=await download(page,'Exportar arquivo local');assert.ok(archive.records.length);
    assert.ok(archive.records.some(record=>JSON.parse(record.raw).pendingWrite?.requestId===JSON.parse(setup.pending).requestId));
    if(reserve){await syncAction(page);await phase(page,'synced');assert.equal(posts.length,1)}
    // Abort an IndexedDB write, proving migration never removes an uncommitted legacy copy.
    const vaultBefore=(await recoveryCopies(page)).length;
    await page.evaluate(()=>{const original=IDBObjectStore.prototype.add;IDBObjectStore.prototype.add=function(...args){IDBObjectStore.prototype.add=original;const request=original.apply(this,args);this.transaction.abort();return request}});
    await move(page);await dismiss(page);
    assert.equal((await recoveryCopies(page)).length,vaultBefore);
    assert.deepEqual(await page.evaluate(key=>Object.keys(localStorage).filter(k=>k.startsWith(key+'.conflictBackup.legacy-')).map(k=>[k,localStorage.getItem(k)]),key),setup.legacy);
    // Explicit migration commits/verifies each record before freeing localStorage.
    await move(page);await dismiss(page);
    const copies=await recoveryCopies(page);
    for(const [legacyKey,legacyRaw] of setup.legacy)assert.ok(copies.some(record=>{const value=JSON.parse(record.raw);return value.legacyKey===legacyKey&&value.legacyRaw===legacyRaw}));
    assert.equal(await page.evaluate(key=>Object.keys(localStorage).filter(k=>k.startsWith(key+'.conflictBackup.legacy-')).length,key),0);
    await page.reload();await page.locator('[data-client="demo-0"]').waitFor();
    assert.equal((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)).clients[0].manualNextStep,'Fictitious quota next action '+reserve);
    if(!reserve){await phase(page,'conflict');await syncAction(page,'[data-sync-review]');await page.locator('[data-sync-merge]').click();await page.locator('#syncReviewModal').waitFor({state:'detached'});await phase(page,'pending');await syncAction(page)}
    await phase(page,'synced');assert.equal(posts.length,1);
    assert.notEqual(posts[0].requestId,JSON.parse(setup.pending).requestId);
    const final=(await page.evaluate(async()=>await(await fetch('/api/commercial-data')).json())).data;
    assert.equal(final.events.filter(event=>event.id==='fiction-quota-event-'+reserve).length,1);
    assert.equal(new Set(final.events.map(event=>event.id)).size,final.events.length);
    for(const field of ['finalPrices','priceHistory','statuses','salePrices','saleCommissions','statusEventIds','salePriceEventIds','agents'])assert.deepEqual(final[field],initial.data[field]);
    await page.reload();await phase(page,'synced');assert.equal(posts.length,1);
    results.push({reserve,nativeQuotaReached:true,oldBackupWouldFail:true,indexedDbBackupVerified:true,falseSynced:false,exportWithoutSpace:true,abortedMigrationPreserved:true,explicitMigrationVerified:true,refreshAndRecovery:true,posts:posts.length});
    await context.close();
  }
  // A failed primary cache write survives refresh in IndexedDB, never as "synced".
  const emergency=await session(),ep=emergency.page,emergencyPosts=[];
  ep.on('request',request=>{if(request.url()===origin+'/api/commercial-data'&&request.method()==='POST')emergencyPosts.push(request.postData())});
  await ep.evaluate(key=>{
    const raw=size=>JSON.stringify({data:{fixturePadding:'y'.repeat(size)}});
    for(let i=0;i<32;i++){try{localStorage.setItem(key+'.conflictBackup.emergency-'+i,raw(512*1024))}catch(error){if(error.name!=='QuotaExceededError')throw error;break}}
    let low=0,high=512*1024;
    while(low<high){const middle=Math.ceil((low+high)/2);try{localStorage.setItem(key+'.conflictBackup.emergency-tail',raw(middle));low=middle}catch(error){if(error.name!=='QuotaExceededError')throw error;high=middle-1}}
    const api=window.__localBackupTest;api.state.data.clients[0].manualNextStep='Fictitious emergency next action';
    api.state.data.events.push({id:'fiction-emergency-event',clientId:api.state.data.clients[0].id,type:'Outro',fractions:[],notes:'Fictitious emergency'});
    api.save();
  },key);
  await phase(ep,'offline');
  await ep.waitForFunction(async()=>{const copies=await window.__localBackupTest.localVaultCopies();return copies.some(copy=>copy.needsReview&&JSON.parse(copy.raw).data.clients[0].manualNextStep==='Fictitious emergency next action')});
  await ep.locator('#commercialSyncBadge').click();
  const emergencyExport=await download(ep,'Exportar cópia local');assert.equal(emergencyExport.data.clients[0].manualNextStep,'Fictitious emergency next action');
  await ep.reload();await phase(ep,'conflict');assert.ok((await ep.locator('#commercialSyncStatus').innerText()).includes('LOCAL_RECOVERY_AVAILABLE'));assert.equal(emergencyPosts.length,0);
  await ep.locator('#commercialSyncBadge').click();
  await move(ep);await dismiss(ep);
  await ep.getByRole('button',{name:'Recuperar última cópia local',exact:true}).click();await dismiss(ep);
  await ep.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).clients[0].manualNextStep==='Fictitious emergency next action',key);
  assert.equal(emergencyPosts.length,0);await syncAction(ep);await phase(ep,'pending');await syncAction(ep);await phase(ep,'synced');
  assert.equal(emergencyPosts.length,1);await ep.reload();await phase(ep,'synced');assert.equal(emergencyPosts.length,1);
  const recovered=await ep.evaluate(async()=>await(await fetch('/api/commercial-data')).json());
  assert.equal(recovered.data.events.filter(event=>event.id==='fiction-emergency-event').length,1);
  results.push({emergencyCacheQuota:true,reloadBlockedFalseSync:true,explicitLocalRestore:true,noAutomaticPost:true,recoveryEventUnique:true});
  await emergency.context.close();
  // Retention is transactional: confirmed records rotate, unique protected records never do.
  const {page,context}=await session();
  const retention=await page.evaluate(async()=>{
    const api=window.__localBackupTest;
    await api.archiveRecoveryCopy('protected',{data:{fiction:'unique unconfirmed'},pendingWrite:{requestId:'fiction-protected'}});
    for(let i=0;i<9;i++)await api.archiveRecoveryCopy('confirmed',{data:{fiction:i}},{confirmed:true});
    const first=await api.localVaultCopies();
    for(let i=0;i<58;i++)await api.archiveRecoveryCopy('protected',{data:{fiction:'pending-'+i}});
    let blocked=false;
    try{for(let i=0;i<10;i++)await api.archiveRecoveryCopy('protected',{data:{fiction:'overflow-'+i}})}catch(error){blocked=error.code==='LOCAL_BACKUP_CAPACITY'}
    const final=await api.localVaultCopies();
    return{confirmed:first.filter(record=>!record.protected).length,protectedPreserved:final.some(record=>JSON.parse(record.raw).pendingWrite?.requestId==='fiction-protected'),blocked,total:final.length};
  });
  assert.equal(retention.confirmed,5);assert.equal(retention.protectedPreserved,true);assert.equal(retention.blocked,true);assert.equal(retention.total,64);
  await context.close();assert.deepEqual(errors,[]);console.log(JSON.stringify({results,retention,errors,productionNetwork:false}));
}finally{await browser.close()}
