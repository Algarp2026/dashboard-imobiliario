import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN,key='theView.crmCommercial.v2';
if(!origin||new URL(origin).hostname!=='127.0.0.1'||!/^53\d{3}$/.test(new URL(origin).port))throw Error('Isolated loopback required');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const errors=[],posts=[],report={realGoogle:false,productionNetwork:false};
const contexts=[];
async function pageIn(context){
  const page=await context.newPage();await page.clock.install();page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url()===origin+'/api/commercial-data'&&r.request().method()==='POST')posts.push({status:r.status(),body:r.request().postDataJSON()})});
  await page.goto(origin+'/commercial.html');
  if(await page.locator('#password').count()){await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click()}
  await page.locator('[data-open-profile="demo-0"]').waitFor();return page;
}
async function session(width){const c=await browser.newContext({viewport:{width,height:900}});contexts.push(c);await c.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());return pageIn(c)}
const data=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
async function profile(page,id='demo-0'){
  if(await page.locator('#clientProfileDialog:not(.hidden)').count())await page.locator('[data-profile-close]').click();
  await page.locator('[data-open-profile="'+id+'"]').click();await page.getByRole('tab',{name:'Dados',exact:true}).click();
}
async function edit(page,id,name){await profile(page,id);await page.getByRole('button',{name:'Editar cliente',exact:true}).click();await page.locator('#clientName').fill(name)}
async function save(page){await page.locator('#saveClient').click();await page.locator('#clientModal.hidden').waitFor({state:'attached'})}
async function until(page,predicate,arg){const deadline=Date.now()+45000;while(Date.now()<deadline){if(await page.evaluate(predicate,arg))return;await new Promise(r=>setTimeout(r,40))}throw Error('Isolated condition timed out: '+JSON.stringify(await page.evaluate(()=>({...window.__autoSyncTest.status(),metrics:window.__autoSyncTest.metrics(),visibility:document.visibilityState}))))}
async function tick(page){await page.clock.fastForward(34000);await page.evaluate(()=>window.__autoSyncTest.check());await until(page,()=>window.__autoSyncTest.idle())}
async function named(page,id,name){await until(page,({key,id,name})=>JSON.parse(localStorage.getItem(key)).clients.find(c=>c.id===id)?.name===name,{key,id,name})}
async function control(page,body){await page.evaluate(async body=>{const r=await fetch('/api/test-control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw Error('Fixture control failed')},body)}
try{
  const a=await session(1440),b=await session(390),initial=await data(a);
  const samples=[];for(let i=0;i<3;i++){
    const name='Fictitious automatic A '+i;await edit(a,'demo-0',name);await save(a);const started=performance.now();
    if(process.env.AUTO_SYNC_DIAGNOSTIC==='true')await tick(b);
    await named(b,'demo-0',name);samples.push(Math.round(performance.now()-started));
  }
  report.localDetectionSamplesMs=samples;report.localMeanDetectionMs=Math.round(samples.reduce((a,b)=>a+b,0)/samples.length);report.acceleratedFirstCheck=process.env.AUTO_SYNC_DIAGNOSTIC==='true';
  assert.ok(Math.max(...samples)<45000);assert.equal(posts.length,3);report.timerWithoutF5=true;
  await edit(b,'demo-1','Fictitious automatic B');await save(b);await tick(a);await named(a,'demo-1','Fictitious automatic B');report.bidirectional=true;
  await a.locator('[data-profile-close]').click();await a.locator('#openClientModal').click();await a.locator('#clientName').fill('Fictitious remote new client');await save(a);
  const created=(await data(a)).clients.find(c=>c.name==='Fictitious remote new client');assert.ok(created);await tick(b);await named(b,created.id,created.name);
  assert.match(await b.locator('#clientFilterSummary').textContent(),new RegExp('de '+(initial.clients.length+1)+' clientes'));assert.match(await b.locator('[data-client="'+created.id+'"] strong').textContent(),/Fictitious remote new client/);
  await profile(b,created.id);assert.match(await b.locator('#clientProfileTitle').textContent(),/Fictitious remote new client/);report.newClientListCountAndDetail=true;
  await edit(b,'demo-0','Fictitious unsaved text');await b.locator('#clientModal .modal').evaluate(n=>n.scrollTop=80);
  const scroll=await b.locator('#clientModal .modal').evaluate(n=>n.scrollTop);
  await edit(a,'demo-2','Fictitious remote while editing');await save(a);await tick(b);
  assert.equal(await b.locator('#clientName').inputValue(),'Fictitious unsaved text');assert.equal(await b.locator('#clientModal .modal').evaluate(n=>n.scrollTop),scroll);
  assert.match(await b.locator('#commercialSyncBadge').textContent(),/Edição preservada|Alterações por guardar/);
  await b.evaluate(()=>document.querySelector('[data-sync-retry]').click());await until(b,()=>window.__autoSyncTest.idle());assert.equal(await b.locator('#clientName').inputValue(),'Fictitious unsaved text');assert.equal(await b.locator('#clientModal .modal').evaluate(n=>n.scrollTop),scroll);report.manualCheckDraftPreserved=true;
  await b.locator('#cancelClient').click();await tick(b);await named(b,'demo-2','Fictitious remote while editing');report.unsavedModalPreserved=true;
  await b.evaluate(()=>{const field=document.createElement('input');field.id='fictitious-unsaved-inline';document.body.appendChild(field);field.focus()});await b.locator('#fictitious-unsaved-inline').fill('Fictitious retained draft');
  await b.evaluate(()=>{document.activeElement.blur();window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
  assert.equal(await b.evaluate(()=>window.__autoSyncTest.editing()),true);assert.equal(await b.locator('#fictitious-unsaved-inline').inputValue(),'Fictitious retained draft');await b.locator('#fictitious-unsaved-inline').evaluate(n=>n.remove());report.cachedPageDraftGuardPreserved=true;
  await profile(b);await b.getByRole('tab',{name:'Oportunidades',exact:true}).click();const card=b.locator('[data-opportunity-unit="9"]');await card.locator('summary').first().click();await card.locator('[data-op-command="round"]').click();await card.locator('[name="notes"]').fill('Fictitious negotiation draft');
  await edit(a,'demo-3','Fictitious remote negotiation guard');await save(a);await tick(b);assert.equal(await card.locator('[name="notes"]').inputValue(),'Fictitious negotiation draft');await card.locator('[data-op-command="cancel"]').click();await tick(b);await named(b,'demo-3','Fictitious remote negotiation guard');report.negotiationDraftPreserved=true;
  await control(a,{clockOffsetMs:3600001});await edit(a,'demo-4','Fictitious hour-long session');await save(a);assert.equal(posts.at(-1).status,200);await control(a,{clockOffsetMs:0});report.expiredTicketRenewed=true;
  await control(a,{readRequired:1});await edit(a,'demo-5','Fictitious bounded retry');const before=posts.length;await save(a);const retry=posts.slice(before);assert.deepEqual(retry.map(x=>x.status),[403,200]);assert.equal(retry[0].body.requestId,retry[1].body.requestId);report.boundedReadRequiredRetry=true;
  // Same-origin tabs share only revision hints, not customer payloads.
  const other=await pageIn(contexts[0]);await edit(a,'demo-6','Fictitious same browser');await save(a);await other.bringToFront();await named(other,'demo-6','Fictitious same browser');await until(other,()=>document.querySelector('[data-client="demo-6"] strong')?.textContent.includes('Fictitious same browser'));report.sameOriginTabs=true;
  const sourceBefore=await a.evaluate(async()=>await(await fetch('/api/commercial-data')).json());const postCount=posts.length;
  await a.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'))});
  const readsBefore=(await a.evaluate(()=>window.__autoSyncTest.metrics())).reads;await a.clock.fastForward(600000);assert.equal((await a.evaluate(()=>window.__autoSyncTest.metrics())).reads,readsBefore);
  await a.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'))});await tick(a);assert.equal(posts.length,postCount);report.hiddenReadsAvoided=true;
  await control(a,{failure:'offline'});await a.clock.fastForward(70000);await tick(a);await until(a,()=>document.getElementById('commercialSyncBadge')?.dataset.phase==='offline');assert.equal(posts.length,postCount);assert.match(await a.locator('#commercialSyncBadge').textContent(),/Sem ligação/);
  await control(a,{failure:''});await a.clock.fastForward(70000);await a.evaluate(()=>window.dispatchEvent(new Event('online')));await tick(a);await until(a,()=>document.getElementById('commercialSyncBadge')?.dataset.phase==='synced');report.onlineRecovery=true;
  const sourceAfter=await a.evaluate(async()=>await(await fetch('/api/commercial-data')).json());assert.deepEqual(sourceAfter.data,sourceBefore.data);report.readOnlyPolls=true;
  // Hold a real POST after its fresh GET, let another session commit, then
  // release it: server-side CAS must still return an actual HTTP 409.
  const racer=await session(820);await edit(racer,'demo-8','Fictitious losing race');
  let release,arrived;const held=new Promise(r=>arrived=r),gate=new Promise(r=>release=r);
  await racer.route('**/api/commercial-data',async route=>{if(route.request().method()==='POST'){arrived();await gate}await route.continue()});
  const saving=racer.locator('#saveClient').click();await held;await edit(a,'demo-9','Fictitious winning race');await save(a);release();await saving;
  await until(racer,()=>document.getElementById('commercialSyncBadge')?.dataset.phase==='conflict');assert.equal(posts.at(-1).status,409);
  assert.equal((await data(racer)).clients.find(c=>c.id==='demo-8').name,'Fictitious losing race');
  const pending=await racer.evaluate(key=>localStorage.getItem(key+'.pendingWrite.v1'),key);assert.ok(pending);await racer.reload();await racer.locator('[data-open-profile="demo-0"]').waitFor();assert.equal(await racer.evaluate(key=>localStorage.getItem(key+'.pendingWrite.v1'),key),pending);report.actualHttp409=true;
  const invalid=await session(390);await invalid.route('**/api/commercial-data',async route=>{if(route.request().method()!=='POST')return route.continue();const response=await route.fetch({headers:{...route.request().headers(),origin:'https://foreign.invalid'}});await route.fulfill({response})});
  await edit(invalid,'demo-10','Fictitious rejected origin');const invalidCount=posts.length;await save(invalid);assert.equal(posts.length,invalidCount+1);assert.equal(posts.at(-1).status,403);assert.match(await invalid.locator('#commercialSyncStatus').textContent(),/INVALID_ORIGIN/);report.invalidOriginUnchanged=true;
  const finalSource=await a.evaluate(async()=>await(await fetch('/api/commercial-data')).json());
  assert.equal(finalSource.data.clients.find(c=>c.id==='demo-8').name,initial.clients.find(c=>c.id==='demo-8').name);assert.equal(finalSource.data.clients.find(c=>c.id==='demo-10').name,initial.clients.find(c=>c.id==='demo-10').name);assert.equal(finalSource.data.clients.find(c=>c.id==='demo-9').name,'Fictitious winning race');
  for(const field of ['statuses','finalPrices','salePrices','saleCommissions','priceHistory','statusEventIds','salePriceEventIds','events','agents','unknownRoot','majucaImportSummary'])assert.deepEqual(finalSource.data[field],initial[field]);
  await control(a,{clockOffsetMs:9*3600000});await edit(a,'demo-7','Fictitious expired auth');const count=posts.length;await save(a);assert.equal(posts.length,count);assert.equal((await data(a)).clients.find(c=>c.id==='demo-7').name,'Fictitious expired auth');assert.match(await a.locator('#commercialSyncStatus').textContent(),/UNAUTHENTICATED/);report.expiredSessionPreserved=true;
  assert.deepEqual(errors,[]);report.errors=errors;report.metrics=await b.evaluate(()=>window.__autoSyncTest.metrics());
  fs.writeFileSync('auto-sync-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{for(const c of contexts)await c.close();await browser.close()}
