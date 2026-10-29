import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN,key='theView.crmCommercial.v2',errors=[],results=[];
if(!origin||new URL(origin).hostname!=='127.0.0.1'||!/^53\d{3}$/.test(new URL(origin).port))throw Error('Isolated loopback required');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
await context.route(origin+'/isolated-print-render',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
await context.addInitScript(()=>{window.print=()=>{};const open=window.open;window.open=function(...args){const p=open.apply(this,args);if(p)p.print=()=>{};return p}});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(origin+'/commercial.html');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.locator('[data-open-profile="demo-0"]').waitFor();
 const read=()=>page.evaluate(async()=>await(await fetch('/api/commercial-data')).json());
 const before=await read(),cached=await page.evaluate(key=>localStorage.getItem(key),key),writes=(await(await context.request.get(origin+'/api/test-meta')).json()).writes;
 await page.locator('#commercialSidebar [data-tab="proposals"]').click();await page.locator('#proposalIncludePlants').check();
 for(const count of [1,2])for(const language of ['pt-en','pt-fr'])for(const price of [true,false]){
  for(const n of [21,22])await page.locator('[data-proposal-select="'+n+'"]').setChecked(n===21||count===2);
  await page.locator('#exportClientPdf').click();const checkbox=page.getByRole('checkbox',{name:'Apresentar preço no PDF',exact:true});assert.equal(await checkbox.isChecked(),true);await checkbox.setChecked(price);await page.locator('#presentationPdfLanguage').selectOption(language);
  for(const n of count===1?[21]:[21,22])await page.locator('[data-presentation-price="'+n+'"]').fill(String(543210+n));
  await page.evaluate(()=>window.__loadingPersistenceTest.read());
  assert.equal(await checkbox.isChecked(),price);assert.equal(await page.locator('#presentationPdfLanguage').inputValue(),language);
  for(const n of count===1?[21]:[21,22])assert.equal(await page.locator('[data-presentation-price="'+n+'"]').inputValue(),String(543210+n));
  const opening=page.waitForEvent('popup');await page.locator('[data-generate-presentation-pdf]').click();const print=await opening;print.on('pageerror',e=>errors.push(e.message));
  const html=await print.content();await print.goto(origin+'/isolated-print-render');await print.setContent(html,{waitUntil:'load'});await print.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
  const title='Apresentação_Apt'+(count===1?'21':'21-22')+'_TheView';assert.equal(await print.title(),title);assert.equal(await print.locator('.pdf-page').count(),count);assert.equal(await print.locator('.pdf-price').count(),price?count:0);assert.equal(await print.locator('img.pdf-plant').count(),count);
  const text=await print.locator('body').innerText();assert.equal(text.toLowerCase().includes(language==='pt-fr'?'prix de présentation':'presentation price'),price);assert.equal(text.includes('543'),price);assert.match(text,/Documento meramente informativo/);
  const areas=await print.locator('.pdf-cards').allTextContents();assert.equal(areas.length,count);assert.ok(areas.every(t=>t.includes('m²')));
  if(!price)assert.equal(await print.locator('.pdf-header').first().evaluate(h=>getComputedStyle(h).gridTemplateColumns.split(' ').length),1,'No empty price track');
  await print.emulateMedia({media:'print'});await print.pdf({path:title+'-'+language+'-'+(price?'com-preco':'sem-preco')+'.pdf',preferCSSPageSize:true,printBackground:true});
  await print.setViewportSize({width:794,height:1123});await print.screenshot({path:'presentation-'+count+'-'+language+'-'+price+'.png',fullPage:true});
  results.push({title,language,price,count,plansLoaded:true,noEmptyPriceTrack:!price,optionsPreservedAcrossRemoteRead:true});await print.close();
 }
 await page.locator('#exportClientPdf').click();await page.setViewportSize({width:390,height:844});assert.equal(await page.getByRole('checkbox',{name:'Apresentar preço no PDF',exact:true}).isChecked(),true);await page.getByRole('checkbox',{name:'Apresentar preço no PDF',exact:true}).uncheck();await page.screenshot({path:'presentation-modal-mobile.png',fullPage:true});await page.locator('#presentationPriceModal [data-close-price-modal]').last().click();
 const after=await read();assert.equal(after.revision,before.revision);assert.deepEqual(after.data,before.data);assert.equal((await(await context.request.get(origin+'/api/test-meta')).json()).writes,writes);assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),cached);assert.deepEqual(errors,[]);
 await fs.writeFile('presentation-pdf-results.json',JSON.stringify({results,errors,commercialCacheUnchanged:true,remoteWrites:0,production:false},null,2));console.log(JSON.stringify({pdfs:results.length,errors,commercialDataUnchanged:true,remoteWrites:0}));
}finally{await context.close();await browser.close()}
