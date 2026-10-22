import assert from 'node:assert/strict';
import {syncAction} from './helpers/current-client-ui.mjs';
import {hasArchivedPending} from './helpers/local-backups.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.PHASE2A_TEST_ORIGIN,key='theView.crmCommercial.v2';
if(!origin||new URL(origin).hostname!=='127.0.0.1'||!/^53\d{3}$/.test(new URL(origin).port))throw Error('Isolated loopback fixture required');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const errors=[],results=[];
try{
  for(const width of [1440,390]){
    const context=await browser.newContext({viewport:{width,height:900}});
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    const posts=[];page.on('request',request=>{if(request.url()===origin+'/api/commercial-data'&&request.method()==='POST')posts.push(JSON.parse(request.postData()))});
    await page.goto(origin+'/commercial.html');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();
    await page.locator('[data-client="demo-0"]').waitFor();
    const remote=()=>page.evaluate(async()=>await(await fetch('/api/commercial-data')).json());
    const original=(await remote()).data;
    const phase=expected=>page.waitForFunction(expected=>document.getElementById('commercialSyncBadge')?.dataset.phase===expected,expected);
    await phase('synced');
    await page.evaluate(({key,width})=>{
      const data=JSON.parse(localStorage.getItem(key));data.clients[0].notes='Fictitious pending '+width;
      data.events.push({id:'fiction-browser-pending-'+width,clientId:data.clients[0].id,type:'Outro',fractions:[],date:'2026-10-21',notes:'Fictitious'});
      localStorage.setItem(key,JSON.stringify(data));localStorage.setItem(key+'.pendingSync','{}');
    },{key,width});
    await page.reload();await phase('pending');assert.equal(posts.length,0,'Refresh must not write');
    await page.evaluate(async()=>{const response=await fetch('/api/test-control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({delay:700})});if(!response.ok)throw Error('Isolated delay failed')});
    if(await page.locator('#commercialSyncBadge').getAttribute('aria-expanded')!=='true')await page.locator('#commercialSyncBadge').click();
    await page.locator('[data-sync-retry]').click();
    await page.waitForFunction(()=>document.getElementById('commercialSyncBadge')?.textContent.includes('A aguardar confirmação'));
    assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).clients[0].notes,key),'Fictitious pending '+width,'Local edits survive while awaiting remote confirmation');
    assert.equal(await page.locator('#commercialSyncBadge').getAttribute('data-phase'),'pending');
    await phase('synced');
    await page.evaluate(async()=>{await fetch('/api/test-control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({delay:0})})});
    assert.equal(posts.length,1);let data=(await remote()).data;
    assert.equal(data.clients[0].notes,'Fictitious pending '+width);
    assert.equal(data.events.filter(event=>event.id==='fiction-browser-pending-'+width).length,1);
    for(const field of ['statuses','finalPrices','priceHistory','salePrices','saleCommissions','statusEventIds','salePriceEventIds','agents'])assert.deepEqual(data[field],original[field]);
    const pendingRaw=await page.evaluate(({key,width})=>{
      const data=JSON.parse(localStorage.getItem(key)),meta=JSON.parse(localStorage.getItem(key+'.syncMeta.v1'));
      const request=JSON.stringify({action:'save',requestId:'fiction-old-browser-'+width,baseRevision:meta.revision,data});
      localStorage.setItem(key+'.pendingWrite.v1',request);
      data.clients[0].notes='Fictitious newer '+width;
      data.events.push({id:'fiction-browser-newer-'+width,clientId:data.clients[0].id,type:'Outro',fractions:[],date:'2026-10-21',notes:'Fictitious'});
      localStorage.setItem(key,JSON.stringify(data));localStorage.setItem(key+'.pendingSync','{}');return request;
    },{key,width});
    await page.reload();await phase('conflict');assert.equal(posts.length,1);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key+'.pendingWrite.v1'),key),pendingRaw);
    await syncAction(page,'[data-sync-recover]');await page.locator('#appDialogModal [data-dialog-confirm]').click();await page.locator('#appDialogModal').waitFor({state:'detached'});await phase('conflict');assert.equal(posts.length,1,'Do not replay an older request');
    await syncAction(page);await phase('conflict');
    await syncAction(page,'[data-sync-review]');await page.locator('#syncReviewModal').waitFor();
    await page.locator('[data-sync-merge]').click();await page.locator('#syncReviewModal').waitFor({state:'detached'});await phase('pending');
    assert.equal(await hasArchivedPending(page,pendingRaw),true);
    assert.equal(posts.length,1,'Review itself must not write');
    await syncAction(page);await phase('synced');assert.equal(posts.length,2);
    assert.notEqual(posts[1].requestId,JSON.parse(pendingRaw).requestId);
    await page.reload();await phase('synced');assert.equal(posts.length,2);
    data=(await remote()).data;assert.equal(data.clients[0].notes,'Fictitious newer '+width);
    assert.equal(new Set(data.events.map(event=>event.id)).size,data.events.length);
    assert.equal(data.events.filter(event=>event.id==='fiction-browser-newer-'+width).length,1);
    for(const field of ['statuses','finalPrices','priceHistory','salePrices','saleCommissions','statusEventIds','salePriceEventIds','agents'])assert.deepEqual(data[field],original[field]);
    results.push({width,refreshWithoutWrites:true,explicitSync:true,slowConfirmationDistinguished:true,olderRequestBlocked:true,archivedBeforeNewRequest:true,eventsUnique:true,commercialDataPreserved:true});
    await context.close();
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({results,errors,productionNetwork:false}));
}finally{await browser.close()}
