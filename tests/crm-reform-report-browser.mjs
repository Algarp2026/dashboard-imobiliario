import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN||'http://127.0.0.1:53224',errors=[];
if(new URL(origin).hostname!=='127.0.0.1'||!/^53\d{3}$/.test(new URL(origin).port))throw Error('Isolated loopback test origin required');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const out=process.env.REFORM_ARTIFACTS||'docs/crm-opportunity-workflow';fs.mkdirSync(out,{recursive:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
try{
 const p=await context.newPage();p.setDefaultTimeout(12000);await p.goto(origin+'/commercial.html');await p.locator('#password').fill('View-Phase2A-Teste');await p.getByRole('button',{name:'Entrar',exact:true}).click();await p.locator('[data-open-profile="demo-0"]').waitFor();
 const before=await p.evaluate(async()=>await(await fetch('/api/commercial-data')).json()),writes=await p.evaluate(async()=>(await(await fetch('/api/test-meta')).json()).writes);
 await p.locator('#commercialSidebar [data-tab="reports"]').click();
 for(const model of ['portfolio','operational','listing','management']){
  await p.locator('#printClientsSummaryBtn').click();await p.locator(`[name="clientReportModel"][value="${model}"]`).check();await p.locator('#clientSummarySearch').fill('Cliente Exemplo Visual');
  const opened=p.waitForEvent('popup');await p.locator('[data-generate-clients-summary]').click();const report=await opened;await report.waitForFunction(()=>document.body.dataset.ready==='true'||!document.getElementById('report-error')?.hidden,{},{timeout:12000});assert.equal(await report.locator('body').getAttribute('data-ready'),'true',await report.locator('#report-error').innerText());
  const text=await report.locator('#report-pages').innerText();assert.match(text,/Cliente Exemplo Visual/);assert.match(text,/Em negociação/);
  if(model==='portfolio'){assert.match(text,/Apt\. 9: Em negociação/);assert.match(text,/Apt\. 24: Apresentada/);assert.match(text,/Apt\. 37: Reservada/);assert.match(text,/Apt\. 38: Vendida/);assert.doesNotMatch(text,/Dias sem contacto|Estado do Contacto/);await report.screenshot({path:out+'/desktop-relatorio.png'})}
  const fits=await report.locator('#report-pages .page-body').evaluateAll(items=>items.every(e=>e.scrollHeight<=e.clientHeight+1&&e.textContent.trim()));assert.equal(fits,true);await report.close();
 }
 const after=await p.evaluate(async()=>await(await fetch('/api/commercial-data')).json());assert.equal(after.revision,before.revision);assert.deepEqual(after.data,before.data);assert.equal(await p.evaluate(async()=>(await(await fetch('/api/test-meta')).json()).writes),writes);assert.deepEqual(errors,[]);
 console.log('Report browser PASS: actual modal -> print previews for four models, canonical opportunity states, pagination geometry, no personal production data and zero commercial writes. PDF binary/physical printer not exercised.');
}finally{await context.close();await browser.close()}
