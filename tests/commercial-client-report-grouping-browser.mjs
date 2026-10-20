import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{loadReportApp,fictitiousRows}=require('./helpers/client-report-grouping.cjs');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const {PDFDocument}=require(process.env.PDF_LIB_MODULE||'pdf-lib');
const workspace=require('../commercial-client-workspace.js'),model=require('../commercial-client-workflow.js'),app=loadReportApp(),origin=process.env.COMMERCIAL_TEST_ORIGIN||'http://127.0.0.1:5200',out=path.resolve('docs/client-list-report-grouping');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),errors=[],results=[];
context.setDefaultTimeout(12000);await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
async function report(input,options,filename=''){
  const rows=app.filterClientReportRows(input,options);app.generateClientsSummaryPdf(rows,options.columns,options);
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.setContent(app.html());
  await p.waitForFunction(()=>document.body.dataset.ready==='true'||!document.getElementById('report-error').hidden);
  assert.equal(await p.locator('body').getAttribute('data-ready'),'true',await p.locator('#report-error').innerText());
  const groups=app.clientReportStageGroups(rows),blocks=options.model==='listing'?app.clientReportColumnGroups(options.columns).groups.length:1;
  const source=await p.locator('#report-source [data-report-table]').evaluateAll(sections=>sections.map(s=>({stage:s.dataset.reportStage,block:Number(s.dataset.reportColumnBlock||1),count:s.querySelectorAll('tbody tr').length,title:s.querySelector('h2').textContent})));
  assert.equal(source.length,groups.length*blocks);for(let b=1;b<=blocks;b++)assert.deepEqual(source.filter(s=>s.block===b).map(s=>[s.stage,s.count]),JSON.parse(JSON.stringify(groups.map(g=>[g.stage,g.rows.length]))));
  const actual=await p.locator('#report-pages [data-report-table]').evaluateAll(sections=>sections.flatMap(s=>[...s.querySelectorAll('tbody tr')].map(tr=>({block:Number(s.dataset.reportColumnBlock||1),name:tr.cells[0].textContent,continued:tr.cells[0].textContent.includes('(continuação)')}))));
  for(let b=1;b<=blocks;b++)for(const row of rows)assert.equal(actual.filter(r=>r.block===b&&!r.continued&&r.name.startsWith(row.client)).length,1,'Missing/duplicate '+row.id+' block '+b);
  const geometry=await p.locator('#report-pages .page-body').evaluateAll(bodies=>bodies.map(body=>({fits:body.scrollHeight<=body.clientHeight&&[...body.children].every(c=>c.getBoundingClientRect().bottom<=body.getBoundingClientRect().bottom+.5),empty:!body.textContent.trim(),orphan:[...body.querySelectorAll('[data-report-table]')].some(s=>!s.querySelector('tbody tr'))})));
  assert.ok(geometry.every(g=>g.fits&&!g.empty&&!g.orphan),JSON.stringify(geometry));
  if(rows.some(row=>row.nextStep.includes('FIM-DADOS-FICTICIOS')))assert.match(await p.locator('#report-pages').textContent(),/FIM-DADOS-FICTICIOS/,'Long action text was lost');
  const pdf=await p.pdf({preferCSSPageSize:true,printBackground:true}),parsed=await PDFDocument.load(pdf);assert.equal(parsed.getPageCount(),geometry.length,'Extra/blank printed page');
  if(filename)await fs.writeFile(path.join(out,filename+'.pdf'),pdf);
  const result={model:options.model,clients:rows.length,groups:groups.length,blocks,pages:geometry.length,allRowsOncePerBlock:true,noOrphanHeadings:true,noBlankOrOverflowPages:true};results.push(result);await p.close();return result;
}
try{
  await page.goto(origin+'/commercial.html');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.locator('[data-client="demo-0"]').waitFor();
  const before=await page.evaluate(async()=>await(await fetch('/api/commercial-data')).json()),meta=await page.evaluate(async()=>await(await fetch('/api/test-meta')).json());
  await page.locator('#clientListSort').selectOption('stage');await page.locator('.client-advanced-filters>summary').click();
  const projected=before.data.clients.map(c=>({...c,stage:model.clientProjection(before.data,c).stage}));
  const expectedRows=model.portfolio(projected,before.data.events,new Date().toISOString().slice(0,10)).map(r=>r.client);
  const expected=workspace.sortClients(expectedRows,{mode:'stage',source:before.data.clients,stages:app.STAGES}).map(c=>c.id);assert.deepEqual(await page.locator('#clientsList [data-client]').evaluateAll(els=>els.map(e=>e.dataset.client)),expected);
  assert.equal(await page.locator('.ux-portfolio-heading,.ux-portfolio-counts').count(),0);assert.match(await page.locator('#clientFilterSummary').innerText(),/64 de 64/);
  assert.ok(await page.locator('.ux-client-priority').count());assert.ok(await page.locator('.ux-contact-pending').count());
  await page.locator('#clientsList').evaluate(e=>window.scrollTo(0,e.getBoundingClientRect().top+scrollY-250));await page.screenshot({path:path.join(out,'dashboard-lista-continua.png')});
  await page.locator('#clientStageFilter').selectOption('Qualificado');assert.ok(await page.locator('#clientsList [data-client]').count());assert.ok((await page.locator('#clientsList [data-client] .badge').allTextContents()).every(s=>s==='Qualificado'));
  await page.locator('#clientStageFilter').selectOption('all');await page.locator('#clientContactFilter').selectOption('Resposta nossa pendente');await page.locator('#clientPriorityFilter').selectOption('yes');assert.ok(await page.locator('#clientsList [data-client]').count());
  const filteredRows=model.portfolio(projected,before.data.events,new Date().toISOString().slice(0,10),{contact:'Resposta nossa pendente',priority:'yes'}).map(r=>r.client);assert.deepEqual(await page.locator('#clientsList [data-client]').evaluateAll(els=>els.map(e=>e.dataset.client)),workspace.sortClients(filteredRows,{mode:'stage',source:before.data.clients,stages:app.STAGES}).map(c=>c.id));
  await page.locator('#clientSearch').fill('no fictitious match');assert.equal(await page.locator('#clientsList [data-client]').count(),0);await page.locator('#clientSearch').fill('');await page.locator('#clientContactFilter').selectOption('all');await page.locator('#clientPriorityFilter').selectOption('all');
  await page.locator('[data-edit-client-card="demo-0"]').click();await page.locator('#clientModal').waitFor();await page.locator('#cancelClient').click();await page.locator('[data-client="demo-0"]').click();await page.getByRole('tab',{name:'Preferências',exact:true}).click();await page.getByRole('button',{name:'Editar preferências',exact:true}).click();await page.locator('#clientPreferencesEditor').waitFor();await page.locator('[data-preferences-cancel]').click();await page.locator('[data-profile-close]').click();
  // Exercise the actual modal -> popup path with the filtered fictitious CRM.
  for(const type of ['operational','listing']){
    await page.locator('#commercialSidebar [data-tab="reports"]').click();await page.locator('#printClientsSummaryBtn').click();await page.locator(`[name="clientReportModel"][value="${type}"]`).check();await page.locator('#clientSummarySearch').fill('Cliente demonstração 01');
    const popup=page.waitForEvent('popup');await page.locator('[data-generate-clients-summary]').click();const p=await popup;const html=await p.content();await p.close();const print=await context.newPage();await print.setContent(html);await print.waitForFunction(()=>document.body.dataset.ready==='true');assert.equal(await print.locator('#report-source [data-report-stage]').count(),1);assert.match(await print.locator('.preview-toolbar').innerText(),/1 clientes/);await print.close();
  }
  await page.setViewportSize({width:390,height:844});await page.locator('.ux-toast').waitFor({state:'hidden',timeout:6000});await page.locator('#clientsList').evaluate(e=>{e.scrollTop=0;window.scrollTo(0,e.getBoundingClientRect().top+scrollY-250)});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.screenshot({path:path.join(out,'dashboard-lista-mobile.png')});
  const base={statuses:app.STAGES,sort:'name',includeContacts:true},rows=fictitiousRows(app.STAGES,14);
  await report(rows,{...base,model:'operational'},'acompanhamento-comercial');
  await report(rows,{...base,model:'listing',columns:['client','status','phone','email','budget','related','lastContactLabel','nextStep','followupState']},'listagem-clientes');
  const small=await report(fictitiousRows(app.STAGES,7),{...base,model:'listing',columns:['client','status']});assert.equal(small.pages,1,'Stage groups must share a page');
  await report(rows,{...base,model:'operational',statuses:[app.STAGES[0],app.STAGES[2]],agentId:'agent-b',priorityClient:'yes'});
  for(const type of ['operational','listing'])await report(rows,{...base,model:type,search:'does not exist',columns:['client','status']});
  const long=fictitiousRows(app.STAGES,98);await report(long,{...base,model:'listing',columns:app.CLIENT_REPORT_COLUMNS.map(c=>c[0])});
  const oversized=fictitiousRows(app.STAGES,1);oversized[0].nextStep='Texto fictício preservado '.repeat(450)+'FIM-DADOS-FICTICIOS';
  await report(oversized,{...base,model:'operational'});
  const after=await page.evaluate(async()=>await(await fetch('/api/commercial-data')).json());assert.deepEqual(after.data,before.data);assert.equal(after.revision,before.revision);assert.equal((await page.evaluate(async()=>await(await fetch('/api/test-meta')).json())).writes,meta.writes);assert.deepEqual(errors,[]);
  const output={continuousDashboard:true,commercialSortPreserved:true,filters:true,priorityAndContactVisible:true,profileAndEdit:true,actualModalFilters:true,results,errors,commercialWrites:0,productionAccess:false};await fs.writeFile(path.join(out,'results.json'),JSON.stringify(output,null,2));console.log(JSON.stringify(output));
}finally{await context.close();await browser.close()}
