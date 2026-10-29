import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN,key='theView.crmCommercial.v2',errors=[],results=[];
if(!origin||new URL(origin).hostname!=='127.0.0.1'||!/^53\d{3}$/.test(new URL(origin).port))throw Error('Isolated loopback required');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:900}});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const remote=()=>page.evaluate(async()=>await(await fetch('/api/commercial-data')).json());
  const synced=()=>page.waitForFunction(()=>window.__safeReconcileTest.details().phase==='synced'&&!window.__safeReconcileTest.details().busy);
  await page.goto(origin+'/commercial.html');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.locator('[data-open-profile="demo-0"]').waitFor();await synced();
  const before=(await remote()).data;
  await page.locator('[data-open-profile="demo-0"]').click();await page.getByRole('button',{name:'Editar cliente',exact:true}).click();
  await page.locator('#clientPhone').fill('+351 000 000 '+width);
  await page.evaluate(()=>window.__loadingPersistenceTest.read());
  assert.equal(await page.evaluate(()=>window.__safeReconcileTest.details().phase),'synced');
  assert.equal(await page.locator('#clientPhone').inputValue(),'+351 000 000 '+width);
  assert.equal(await page.locator('#clientModal').isVisible(),true);
  const posted=page.waitForResponse(r=>r.url()===origin+'/api/commercial-data'&&r.request().method()==='POST'&&r.ok());
  await page.locator('#saveClient').click();await posted;await synced();
  const after=(await remote()).data;assert.equal(after.clients[0].phone,'+351 000 000 '+width);
  for(const name of ['events','agents','finalPrices','priceHistory','statuses','salePrices','saleCommissions','statusEventIds','salePriceEventIds'])assert.deepEqual(after[name],before[name],name);
  assert.deepEqual(after.clients.slice(1),before.clients.slice(1));
  await page.reload();await page.locator('[data-open-profile="demo-0"]').waitFor();await synced();assert.equal((await page.evaluate(()=>window.__safeReconcileTest.snapshot())).clients[0].phone,'+351 000 000 '+width);
  // Hold a fresh read: save locally during it, without transmitting until the
  // read completes and supplies a fresh ticket. The scheduled write must follow.
  let release,started;const gate=new Promise(r=>release=r),ready=new Promise(r=>started=r);let held=false;
  await page.route('**/api/commercial-data',async route=>{if(route.request().method()==='GET'&&!held){held=true;started();await gate}await route.continue()});
  const writesBefore=(await(await context.request.get(origin+'/api/test-meta')).json()).writes;
  const reading=page.evaluate(()=>window.__loadingPersistenceTest.read());await ready;
  await page.evaluate(width=>window.__safeReconcileTest.clientField('demo-1','phone','Synthetic pending read '+width),width);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key+'.pendingWrite.v1'),key),null);
  assert.equal((await(await context.request.get(origin+'/api/test-meta')).json()).writes,writesBefore);
  release();await reading;
  try{await synced()}catch(error){console.error('Pending read diagnostics',await page.evaluate(()=>window.__autoSyncTest.status()),await page.evaluate(()=>window.__safeReconcileTest.details()));throw error}
  assert.equal((await remote()).data.clients[1].phone,'Synthetic pending read '+width);
  await page.unroute('**/api/commercial-data');
  await page.screenshot({path:'loading-persistence-'+width+'.png',fullPage:true});
  results.push({width,manualReadDuringEditor:true,realUiSaveConfirmed:true,reloadPreserved:true,pendingReadAutomaticallyResumed:true,unrelatedDataPreserved:true});
  await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('loading-persistence-results.json',JSON.stringify({realGoogle:false,results,errors},null,2));console.log(JSON.stringify({results,errors}));
}finally{await browser.close()}
