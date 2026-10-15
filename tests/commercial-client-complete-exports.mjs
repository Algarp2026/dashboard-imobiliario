import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin='http://127.0.0.1:5197',output=process.env.COMPLETE_ARTIFACTS||path.resolve('docs/client-profile-complete');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),errors=[];
await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
await context.route(origin+'/isolated-print-render',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
await context.addInitScript(()=>{window.print=()=>{};const open=window.open;window.open=function(...args){const popup=open.apply(this,args);if(popup)popup.print=()=>{};return popup}});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
const remote=()=>page.evaluate(async()=>await(await fetch('/api/commercial-data')).json());
const meta=()=>page.evaluate(async()=>await(await fetch('/api/test-meta')).json());
async function popup(trigger){
  const pending=page.waitForEvent('popup');await trigger();const p=await pending;p.on('pageerror',e=>errors.push(e.message));
  // Chrome's headless about:blank popup can defer document.write subresources indefinitely.
  // Render the exact generated document in a settled local document; never alter the app PDF code.
  const html=await p.content();await p.goto(origin+'/isolated-print-render');await p.setContent(html,{waitUntil:'load'});return p;
}
try{
  await page.goto(origin+'/commercial.html');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.locator('[data-client="demo-0"]').click();
  const before=(await remote()).data,posts=(await meta()).writes;assert.ok(before.events.some(e=>e.clientId==='demo-0'&&e.presentationHistory));
  await page.getByRole('tab',{name:'Apresentação',exact:true}).click();await page.locator('[data-workflow="pdf"]').click();await page.locator('[data-presentation-price="26"]').fill('543210');
  assert.equal(await page.locator('#presentationPdfLanguage').inputValue(),'pt-en');let print=await popup(()=>page.locator('[data-generate-presentation-pdf]').click());assert.match(await print.locator('body').innerText(),/543.210/);assert.match(await print.locator('body').innerText(),/Presentation Price/i);await print.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));assert.ok(await print.locator('img').count());await print.close();
  await page.getByRole('tab',{name:'Apresentação',exact:true}).click();await page.locator('[data-workflow="pdf"]').click();await page.locator('#presentationPdfLanguage').selectOption('pt-fr');print=await popup(()=>page.locator('[data-generate-presentation-pdf]').click());assert.match(await print.locator('body').innerText(),/Prix de présentation/i);await print.close();
  await page.locator('#printClientsSummaryBtn').click();assert.equal(await page.locator('[name="clientReportModel"]:checked').inputValue(),'portfolio');print=await popup(()=>page.locator('[data-generate-clients-summary]').click());await print.locator('#report-pages .page').first().waitFor();assert.match(await print.locator('body').innerText(),/Carteira Comercial por Estado/);assert.match(await print.locator('body').innerText(),/Estado do Contacto/);await print.close();
  await page.locator('#printClientsSummaryBtn').click();await page.locator('[name="clientReportModel"][value="listing"]').check();await page.locator('[data-client-summary-column][value="informedPrices"]').check();await page.locator('#clientSummarySearch').fill(before.clients[0].name);print=await popup(()=>page.locator('[data-generate-clients-summary]').click());await print.locator('#report-pages .page').first().waitFor();assert.match(await print.locator('body').innerText(),/630.000/);await print.close();
  await page.locator('#commercialSidebar [data-tab="reports"]').click();await page.locator('[data-ux-export="price-list"]').click();print=await popup(()=>page.locator('[data-generate-price-list-pdf]').click());assert.match(await print.content(),/A4 portrait/);assert.match(await print.locator('body').innerText(),/Price List/i);await print.close();
  assert.deepEqual((await remote()).data,before);assert.equal((await meta()).writes,posts);assert.deepEqual(errors,[]);
  const report={proposalPTEN:true,proposalPTFR:true,presentationPriceUsed:true,plantsLoaded:true,clientReportIncludesManagedPresentationPrice:true,priceListA4Portrait:true,noBusinessWrites:true,errors,production:false};await fs.writeFile(path.join(output,'exports-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await context.close();await browser.close()}
