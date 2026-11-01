import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN,key='theView.crmCommercial.v2',contexts=[],errors=[],results=[],posts=new Map();
if(!origin||new URL(origin).hostname!=='127.0.0.1'||!/^53\d{3}$/.test(new URL(origin).port))throw Error('Isolated fixture only');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
async function session(width=1440,context){context||=await browser.newContext({viewport:{width,height:900},acceptDownloads:true});if(!contexts.includes(context)){contexts.push(context);await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort())}const page=await context.newPage();posts.set(page,0);page.on('request',r=>{if(new URL(r.url()).pathname==='/api/commercial-data'&&r.method()==='POST')posts.set(page,posts.get(page)+1)});page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/commercial.html');if(await page.locator('#password').count()){await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click()}await page.locator('[data-open-profile="demo-0"]').waitFor();await page.waitForFunction(()=>window.__autoSyncTest.status().phase==='synced');return{page,context}}
const control=(p,body)=>p.evaluate(async body=>{const r=await fetch('/api/test-control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw Error('Fixture control failed')},body);
const tick=p=>p.evaluate(()=>window.__autoSyncTest.check());
try{
 let initialCommercial;
 for(const width of [1440,390]){
  const reader=await session(width),writer=await session(),p=reader.page,w=writer.page;
  const before=await p.evaluate(async()=>await(await fetch('/api/test-meta')).json());
  const localBeforeFilters=await p.evaluate(key=>localStorage.getItem(key),key);
  initialCommercial||=(await p.evaluate(async()=>await(await fetch('/api/commercial-data')).json())).data;
  for(const module of ['sales','prices','proposals','compare','history']){
   await p.evaluate(module=>document.querySelector('[data-tab="'+module+'"]').click(),module);
   await p.evaluate(()=>{for(const id of ['clientStageFilter','priceTypology','priceFloor','priceStatus','proposalTypology','proposalFloor','proposalStatus','compareA','compareB','historyFractionSelect']){const n=document.getElementById(id);if(n?.options.length>1){n.focus();n.selectedIndex=1;n.dispatchEvent(new Event('change',{bubbles:true}));n.selectedIndex=0;n.dispatchEvent(new Event('change',{bubbles:true}))}}});
   assert.equal(await p.evaluate(()=>window.__autoSyncTest.editing()),false);
  }
  await p.evaluate(()=>document.querySelector('[data-tab="sales"]').click());
  for(const subtab of ['fractions','agents','events','clients']){await p.evaluate(subtab=>document.querySelector('[data-sales-subtab="'+subtab+'"]').click(),subtab);await p.evaluate(()=>{for(const n of document.querySelectorAll('.filters-grid select,#clientListSort')){if(n.id!=='selectedClient'&&n.getClientRects().length&&n.options.length>1){const value=n.value;n.focus();n.selectedIndex=1;n.dispatchEvent(new Event('change',{bubbles:true}));n.value=value;n.dispatchEvent(new Event('change',{bubbles:true}))}}for(const n of document.querySelectorAll('.filters-grid input[type="search"]')){if(!n.getClientRects().length)continue;n.focus();n.value='Este';n.dispatchEvent(new Event('input',{bubbles:true}));n.value='';n.dispatchEvent(new Event('input',{bubbles:true}))}});assert.equal(await p.evaluate(()=>window.__autoSyncTest.editing()),false)}
  assert.equal(await p.evaluate(key=>localStorage.getItem(key),key),localBeforeFilters);assert.equal(await p.evaluate(key=>localStorage.getItem(key+'.pendingSync'),key),null);assert.equal(await p.evaluate(key=>localStorage.getItem(key+'.pendingWrite.v1'),key),null);
  await p.evaluate(()=>document.querySelector('[data-tab="sales"]').click());await p.locator('#clientSearch').fill('Fictitious');assert.equal(await p.locator('#clientSearch').inputValue(),'Fictitious','Search must remain set before the remote write');
  await w.evaluate(width=>window.__safeReconcileTest.clientField('demo-0','notes','Fictitious remote while filtering '+width),width);await w.waitForFunction(()=>window.__autoSyncTest.status().phase==='synced');await tick(p);
  await p.waitForFunction(({key,width})=>JSON.parse(localStorage.getItem(key)).clients[0].notes==='Fictitious remote while filtering '+width,{key,width});assert.equal(await p.locator('#clientSearch').inputValue(),'Fictitious');assert.equal(await p.evaluate(()=>window.__autoSyncTest.editing()),false);
  await p.locator('#clientSearch').fill('');await p.locator('[data-open-profile="demo-0"]').click();await p.getByRole('button',{name:'Editar cliente',exact:true}).click();await p.locator('#clientName').focus();assert.equal(await p.evaluate(()=>window.__autoSyncTest.editing()),false);assert.doesNotMatch(await p.locator('#commercialSyncBadge').textContent(),/Alterações por guardar/);
  await p.locator('#clientName').fill('Fictitious unsaved '+width);assert.equal(await p.evaluate(()=>window.__autoSyncTest.editing()),true);
  await w.evaluate(()=>window.__safeReconcileTest.clientField('demo-1','notes','Fictitious remote edit '+Date.now()));await w.waitForFunction(()=>window.__autoSyncTest.status().phase==='synced');await tick(p);assert.equal(await p.locator('#clientName').inputValue(),'Fictitious unsaved '+width);
  await p.locator('#cancelClient').click();await tick(p);await p.getByRole('tab',{name:'Procura',exact:true}).click();await p.locator('[data-preferences-edit]').click();await p.locator('#clientPreferencesEditor [name="budgetMin"]').focus();assert.equal(await p.evaluate(()=>window.__autoSyncTest.editing()),false);await p.locator('[data-preference-key="typology"][data-preference-value="T3"]').click();assert.equal(await p.evaluate(()=>window.__autoSyncTest.editing()),true);await p.locator('[data-preferences-cancel]').click();assert.equal(await p.evaluate(()=>window.__autoSyncTest.editing()),false);const after=await p.evaluate(async()=>await(await fetch('/api/test-meta')).json());assert.equal(after.writes-before.writes,2);results.push({width,allModuleFiltersClean:true,orientationSearchClean:true,orderingClean:true,noConsultationPendingMarker:true,remoteUpdateWithFilter:true,focusClean:true,pristinePreferencesClean:true,preferenceChipsProtected:true,realDraftPreserved:true});
  assert.equal(posts.get(p),0,'Consultations and uncommitted forms never send commercial POSTs');const finalCommercial=(await p.evaluate(async()=>await(await fetch('/api/commercial-data')).json())).data;for(const field of Object.keys(initialCommercial).filter(k=>k!=='clients'))assert.deepEqual(finalCommercial[field],initialCommercial[field]);assert.deepEqual(finalCommercial.clients.slice(2),initialCommercial.clients.slice(2));
  await reader.context.close();await writer.context.close();
 }

 assert.deepEqual(errors,[]);await fs.writeFile('consultation-results.json',JSON.stringify({results,errors,production:false},null,2));console.log(JSON.stringify({results,errors}));
}finally{for(const c of contexts)await c.close().catch(()=>{});await browser.close()}
