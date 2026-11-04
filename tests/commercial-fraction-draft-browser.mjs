import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN,key='theView.crmCommercial.v2',contexts=[],errors=[],results=[],versionRequests=[];
if(!origin||new URL(origin).hostname!=='127.0.0.1'||!/^53\d{3}$/.test(new URL(origin).port))throw Error('Isolated fixture required');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
async function session(width=1440){
 const context=await browser.newContext({viewport:{width,height:900}});contexts.push(context);context.setDefaultTimeout(15000);
 await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/deployment-version|deployment-guard/.test(r.url()))versionRequests.push(r.url())});await page.goto(origin+'/commercial.html');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.locator('[data-open-profile="demo-0"]').waitFor();await synced(page);return page;
}
const synced=p=>p.waitForFunction(()=>window.__autoSyncTest.status().phase==='synced');
const editing=p=>p.evaluate(()=>window.__autoSyncTest.editing());
const draft=p=>p.evaluate(()=>window.__fractionDraftTest.snapshot());
const remote=p=>p.evaluate(async()=>await(await fetch('/api/commercial-data')).json());
const meta=p=>p.evaluate(async()=>await(await fetch('/api/test-meta')).json());
const control=(p,body)=>p.evaluate(async body=>{const r=await fetch('/api/test-control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw Error('Fixture control failed')},body);
async function profile(p){if(!await p.locator('#clientProfileDialog:not(.hidden)').count())await p.locator('[data-open-profile="demo-0"]').click();await p.getByRole('tab',{name:'Procura',exact:true}).click();await p.locator('#clientFractionWorkspace').waitFor()}
async function select(p,n,approve=false){if(!await p.locator('#clientFractionManual').evaluate(n=>n.open))await p.locator('#clientFractionManual>summary').click();await p.locator('#clientFractionSearch').fill(String(n));await p.locator('#clientFractionManualResults [data-fraction-select="'+n+'"]').click();if(approve)await p.locator('[data-dialog-confirm]').first().click()}
const unloadProtected=p=>p.evaluate(()=>{const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented});
try{
 for(const width of [1440,390]){
  const p=await session(width);await profile(p);const before=(await remote(p)).data,writes=(await meta(p)).writes;
  await p.locator('[data-fraction-filter="main"]').click();await p.locator('#clientFractionManual>summary').click();await p.locator('#clientFractionSearch').fill('2');assert.equal(await editing(p),false);assert.equal(await unloadProtected(p),false);
  await select(p,30);assert.equal(await editing(p),true);assert.equal(await unloadProtected(p),true);assert.match(await p.locator('#clientFractionSelection strong').textContent(),/por guardar/);
  const leaving=p.waitForEvent('dialog'),navigation=p.reload().catch(()=>null);const dialog=await leaving;assert.equal(dialog.type(),'beforeunload');await dialog.dismiss();await navigation;assert.ok((await draft(p)).values.includes(30),'Cancelled navigation preserves selection');
  await p.locator('#clientFractionSelection [data-fraction-select="30"]').click();assert.equal(await editing(p),false);assert.equal(await unloadProtected(p),false);assert.doesNotMatch(await p.locator('#clientFractionSelection strong').textContent(),/por guardar/);
  await p.locator('#clientFractionSelection [data-fraction-select="9"]').click();assert.equal(await editing(p),true);await p.locator('[data-fraction-cancel]').click();assert.equal(await editing(p),false);
  await select(p,18,true);const originalDraft=await draft(p);assert.equal(originalDraft.approvals.length,1);assert.equal(originalDraft.approvals[0][0],18);assert.equal((await meta(p)).writes,writes,'Consultation and selection must not write');
  const writer=await session();await writer.evaluate(width=>window.__safeReconcileTest.clientField('demo-0','notes','Fictitious concurrent note '+width),width);await synced(writer);await p.evaluate(()=>window.__autoSyncTest.check());assert.equal(await editing(p),true);assert.deepEqual(await draft(p),originalDraft,'Concurrent same-client refresh preserves values, original and Map approvals');
  await p.screenshot({path:'fraction-draft-'+width+'.png'});await p.locator('[data-fraction-cancel]').click();await p.evaluate(()=>window.__autoSyncTest.check());await synced(p);assert.equal(await editing(p),false);assert.equal((await remote(p)).data.clients[0].notes,'Fictitious concurrent note '+width);
  await select(p,30);await p.locator('[data-fraction-save]').click();await p.locator('[data-fraction-save]').waitFor({state:'detached'});await synced(p);assert.equal(await editing(p),false);assert.equal(await draft(p),null);assert.deepEqual((await remote(p)).data.clients[0].presentationSelection,[9,24,30]);
  await p.reload();await p.locator('[data-open-profile="demo-0"]').waitFor();await synced(p);assert.equal(await editing(p),false);assert.deepEqual((await remote(p)).data.clients[0].presentationSelection,[9,24,30]);const after=(await remote(p)).data;for(const field of Object.keys(before).filter(k=>!['clients','events'].includes(k)))assert.deepEqual(after[field],before[field]);assert.deepEqual(after.clients.slice(1),before.clients.slice(1));assert.deepEqual(after.events.filter(e=>!e.opportunityVersion),before.events);
  // Failed writes still retain their exact request and recovery copies across refresh.
  await profile(p);await p.getByRole('button',{name:'Editar cliente',exact:true}).click();await p.locator('#clientName').fill('Fictitious pending '+width);await control(p,{failure:'write-failure'});await p.locator('#saveClient').click();await p.waitForFunction(()=>window.__autoSyncTest.status().phase==='offline');const pending=await p.evaluate(key=>localStorage.getItem(key+'.pendingWrite.v1'),key);assert.ok(JSON.parse(pending).requestId);const copies=await p.evaluate(()=>window.__safeReconcileTest.copies());assert.ok(copies.some(copy=>copy.raw.includes(JSON.parse(pending).requestId)));
  await p.reload();await p.locator('[data-open-profile="demo-0"]').waitFor();await p.waitForFunction(()=>window.__autoSyncTest.status().phase!=='loading');assert.equal(await p.evaluate(key=>localStorage.getItem(key+'.pendingWrite.v1'),key),pending);assert.notEqual(await p.evaluate(()=>window.__autoSyncTest.status().phase),'synced');
  await p.clock.install();await p.clock.fastForward(180000);await p.evaluate(()=>{window.dispatchEvent(new Event('online'));window.dispatchEvent(new Event('focus'))});assert.equal(await p.locator('.tv-update-dialog,.tv-update-banner').count(),0);assert.equal(await p.evaluate(()=>typeof window.THE_VIEW_DEPLOYMENT_GUARD),'undefined');
  results.push({width,consultationClean:true,addRemoveRevertCancelProtected:true,realBeforeUnloadPreservesDraft:true,noSelectionPost:true,sameClientUpdatePreservesApprovals:true,saveConfirmedAndReloaded:true,unrelatedDataPreserved:true,originalPendingAndArchivePreserved:true,noVersionUiOrNetwork:true});
  await p.context().close();await writer.context().close();const reset=await session();await control(reset,{reset:true});await reset.context().close();
 }
 // The same read/write ordering must remain coherent even when native checkpoint
 // I/O completes only after the write acknowledgement, with no longer timeout.
 for(const width of [1440,390]){
  const p=await session(width),before=(await remote(p)).data,posts=[];p.on('response',r=>{if(r.url()===origin+'/api/commercial-data'&&r.request().method()==='POST')posts.push(r.status())});
  await p.waitForFunction(()=>window.__readCommitOrderTest.begin());await p.waitForFunction(()=>window.__readCommitOrderTest.held());
  assert.equal(await p.evaluate(width=>window.__readCommitOrderTest.write('Fictitious ordered commit '+width),width),true);
  const confirmed=await p.evaluate(()=>window.__readCommitOrderTest.inspect());assert.equal(confirmed.phase,'synced');assert.equal(confirmed.pending,false);assert.equal(confirmed.cacheMatchesBase,true);
  const outcome=await p.evaluate(()=>window.__readCommitOrderTest.release());assert.equal(outcome.applied,false);assert.equal(outcome.revision,confirmed.revision);await synced(p);
  const flags=await p.evaluate(()=>window.__readCommitOrderTest.inspect());assert.deepEqual(flags,{phase:'synced',busy:false,dirty:false,verified:true,error:'',pending:false,marker:false,revision:confirmed.revision,revisionPreserved:true,metadataRevisionMatches:true,cacheMatchesState:true,cacheMatchesBase:true,metadataBaseMatches:true});assert.deepEqual(posts,[200]);
  const after=(await remote(p)).data;assert.equal(after.clients[0].notes,'Fictitious ordered commit '+width);for(const field of Object.keys(before).filter(field=>field!=='clients'))assert.deepEqual(after[field],before[field]);assert.deepEqual(after.clients.slice(1),before.clients.slice(1));
  await p.reload();await p.locator('[data-open-profile="demo-0"]').waitFor();await synced(p);const refreshed=await p.evaluate(()=>window.__readCommitOrderTest.inspect());assert.equal(refreshed.metadataRevisionMatches,true);assert.equal(refreshed.cacheMatchesBase,true);assert.equal(refreshed.pending,false);assert.equal(refreshed.dirty,false);assert.deepEqual(posts,[200],'Refresh must not duplicate an already acknowledged write');
  results.push({width,lateCheckpointReadIgnored:true,confirmedRevisionPreserved:true,cacheAndPendingCoherent:true,onePostOnly:true,refreshDoesNotDuplicate:true});await p.context().close();
 }
 assert.deepEqual(versionRequests,[]);assert.deepEqual(errors,[]);await fs.writeFile('fraction-draft-results.json',JSON.stringify({results,errors,versionRequests,production:false},null,2));console.log(JSON.stringify({results,errors}));
}finally{for(const context of contexts)await context.close().catch(()=>{});await browser.close()}
