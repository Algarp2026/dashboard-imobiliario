import assert from 'node:assert/strict';import {closeProfile,contactSettings,reveal,openOpportunity,clientTab} from './helpers/current-client-ui.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN||'http://127.0.0.1:5197',out=path.resolve('docs/client-profile-routing');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const contexts=[],errors=[],external=[],failedModules=[],results=[];
async function session(viewport,blocked=''){
  const c=await browser.newContext({viewport});contexts.push(c);
  c.setDefaultTimeout(12000);await c.route('**/*',r=>{
    const url=new URL(r.request().url());
    if(url.origin!==origin){external.push(url.origin);return r.abort()}
    if(blocked==='invalid-factory'&&url.pathname==='/commercial-client-workflow-ui.js')return r.fulfill({contentType:'application/javascript',body:'window.createClientWorkflow=()=>({});'});
    if(blocked&&url.pathname==='/'+blocked)return r.abort();
    return r.continue();
  });
  assert.equal((await c.request.get(origin+'/api/commercial-data')).status(),401);
  const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  p.on('response',r=>{if(!blocked&&/commercial-(client|fraction|recommendations).*\.js$/.test(new URL(r.url()).pathname)&&!r.ok())failedModules.push(new URL(r.url()).pathname)});
  await p.goto(origin+'/commercial.html');await p.locator('#password').fill('View-Phase2A-Teste');await p.getByRole('button',{name:'Entrar',exact:true}).click();await ready(p);return p;
}
async function ready(p){await p.locator('[data-client="demo-0"]').waitFor({state:'attached'});await synced(p)}
async function synced(p){await p.waitForFunction(()=>document.getElementById('commercialSyncBadge')?.dataset.phase==='synced')}
const remote=p=>p.evaluate(async()=>await(await fetch('/api/commercial-data')).json());
const tab=(p,name)=>clientTab(p,name);
async function shot(p,name){await p.locator('.ux-toast').waitFor({state:'hidden',timeout:6000});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await p.evaluate(()=>scrollTo(0,0));await p.mouse.move(0,0);await p.screenshot({path:path.join(out,name+'.png'),fullPage:true})}
async function closePresentation(p){await p.locator('[data-workflow="cancel-presentation"]').click();await p.locator('[data-dialog-confirm]').click()}
async function savePresentation(p,state){const f=p.locator('[data-workflow-form="presentation"]');await f.locator('[name="state"]').selectOption(state);await f.locator('[type="submit"]').click();await f.locator('[name="state"]').waitFor({state:'detached'});await synced(p)}
async function closeMovement(p){await p.locator('[data-workflow="cancel-negotiation"]').click();await p.locator('[data-dialog-confirm]').click()}
try{
  const p=await session({width:1440,height:1000});
  await p.evaluate(async()=>{await fetch('/api/test-control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reset:true})});localStorage.clear();sessionStorage.clear()});await p.reload();await ready(p);
  const baseline=(await remote(p)).data;assert.equal(baseline.clients.length,64);
  let posts=0;p.on('request',r=>{if(r.method()==='POST'&&r.url()===origin+'/api/commercial-data')posts++});
  // Former failure: selected client preview exposed legacy preferences without opening the card.
  await p.locator('[data-client="demo-0"]').click();await tab(p,'Procura');await p.getByRole('button',{name:'Editar preferências',exact:true}).click();
  assert.equal(await p.locator('#clientPreferencesEditor').isVisible(),true);assert.equal(await p.locator('#clientModal').isVisible(),false);
  assert.equal(await p.locator('.ux-client-profile-active').count(),1);await p.locator('[data-preferences-cancel]').click();
  await p.reload();await ready(p);assert.equal(await p.getByRole('tab',{name:'Procura',exact:true}).getAttribute('aria-selected'),'true');
  await p.getByRole('button',{name:'Editar preferências',exact:true}).click();assert.equal(await p.locator('#clientPreferencesEditor').isVisible(),true);await p.locator('[data-preferences-cancel]').click();assert.equal(posts,0);
  await closeProfile(p);await shot(p,'desktop-listagem');
  await p.locator('[data-client="demo-0"]').click();await shot(p,'desktop-entrada-ficha');
  // Seed the demonstration through the approved UI using only this memory-backed fixture.
  await tab(p,'Procura');await p.locator('#clientFractionManual').evaluate(e=>e.open=true);
  await p.locator('#clientFractionSearch').fill('24');await p.locator('#clientFractionManualResults [data-fraction-select="24"]').click();await p.locator('[data-fraction-save]').click();await p.locator('[data-fraction-save]').waitFor({state:'detached'});await synced(p);
  await tab(p,'Oportunidades');let card=p.locator('[data-opportunity-unit="24"]');await card.locator('summary').first().click();await card.locator('[data-op-state]').selectOption('Apresentada');await card.locator('[name="price-24"]').fill('700000');await card.locator('[type=submit]').click();await synced(p);
  let data=(await remote(p)).data;const presentation=data.events.find(e=>e.clientId==='demo-0'&&e.opportunityAction==='present');
  await card.locator('[data-op-state]').selectOption('Em negociação');await card.locator('[name="amount"]').fill('680000');await card.locator('[name="terms"]').fill('Condições fictícias');await card.locator('[type=submit]').click();await synced(p);
  const prepared=(await remote(p)).data,readsBefore=(await p.evaluate(async()=>await(await fetch('/api/test-meta')).json())).writes;
  for(const [mode,page]of [['desktop',p],['mobile',await session({width:390,height:844})]]){
    if(mode==='mobile')await page.locator('[data-client="demo-0"]').click();
    await tab(page,'Dados');await contactSettings(page);assert.equal(await page.locator('[data-contact-settings]').isVisible(),true);
    await page.locator('[data-workflow="new-contact"]').click();await page.locator('[data-contact-form] [name="notes"]').fill('Fictitious cancelled contact');await shot(page,mode+'-dados');await page.locator('[data-workflow="cancel-contact"]').click();
    await page.locator('[data-client-header-edit]').click();assert.equal(await page.locator('#clientModal').isVisible(),true);await page.locator('#cancelClient').click();assert.equal(await page.locator('[data-contact-settings]').isVisible(),true);
    await tab(page,'Procura');await page.getByRole('button',{name:'Editar preferências',exact:true}).click();
    const editor=page.locator('#clientPreferencesEditor');assert.equal(await editor.isVisible(),true);
    await page.locator('[data-preference-key="typology"][data-preference-value="T2+1"]').click();
    assert.equal(await page.locator('[data-preference-key="typology"][data-preference-value="T2"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('[data-preference-key="typology"][data-preference-value="T2+1"]').getAttribute('aria-pressed'),'true');
    for(const key of ['floor','orientation']){
      await page.locator(`[data-preference-key="${key}"][data-preference-value="Indiferente"]`).click();assert.equal(await page.locator(`[data-preference-key="${key}"][data-preference-value="Indiferente"]`).getAttribute('aria-pressed'),'true');
    }
    assert.equal(await editor.locator('[name="budgetMin"]').count(),1);assert.equal(await editor.locator('[name="budgetMax"]').count(),1);await shot(page,mode+'-preferencias-multiplas');await page.locator('[data-preferences-cancel]').click();
    await tab(page,'Procura');assert.equal(await page.locator('#clientFractionWorkspace').isVisible(),true);assert.equal(await page.locator('[data-fraction-filter="plus5"]').isEnabled(),true);
    await page.locator('[data-fraction-filter="alternatives"]').click();await page.locator('[data-fraction-filter="all"]').click();await page.locator('#clientFractionManual').evaluate(e=>e.open=true);await page.locator('#clientFractionSearch').fill('');assert.match(await page.locator('#clientFractionManualCount').innerText(),/39/);
    await shot(page,mode+'-fracoes');await page.locator('#clientFractionSearch').fill('9');assert.equal(await page.locator('#clientFractionManualResults [data-fraction-select="9"]').count(),1);await page.locator('#clientFractionManualResults [data-fraction-select="9"]').click();await page.locator('[data-fraction-cancel]').click();
    await tab(page,'Oportunidades');card=page.locator('[data-opportunity-unit="24"]');assert.equal(await card.count(),1);assert.match(await card.innerText(),/680.000/);if(await card.getAttribute('open')===null)await card.locator('summary').first().click();if(await card.locator('.op-history').getAttribute('open')===null)await card.locator('.op-history>summary').click();await card.locator('[data-edit-client-event="'+presentation.id+'"]').click();assert.equal(await card.locator('[name="price-24"]').inputValue(),'700000');await shot(page,mode+'-apresentacao');await card.locator('[data-op-command="cancel"]').click();
    await card.locator('[data-op-command="round"]').click();await card.locator('[name="amount"]').fill('710000');await shot(page,mode+'-negociacao');await card.locator('[data-op-command="cancel"]').click();
    await page.reload();await ready(page);assert.equal(await page.locator('.ux-client-profile-active').count(),1);assert.equal(await page.getByRole('tab',{name:'Oportunidades',exact:true}).getAttribute('aria-selected'),'true');assert.equal(await page.locator('[data-opportunity-unit="24"]').count(),1);
    await closeProfile(page);assert.equal(await page.locator('[data-client="demo-0"]').isVisible(),true);await shot(page,mode+'-regresso-listagem');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);results.push({mode,threeCurrentComponents:true,multiSelect:true,cancel:true,reload:true,listReturn:true,overflow});
  }
  assert.equal((await p.evaluate(async()=>await(await fetch('/api/test-meta')).json())).writes,readsBefore);
  assert.deepEqual((await remote(p)).data,prepared);
  for(const file of ['commercial-client-preferences.js','commercial-fraction-recommendations.js','commercial-client-workflow.js','commercial-client-workflow-ui.js','commercial-opportunities.js','commercial-opportunity-ui.js','invalid-factory']){
    const blocked=await session({width:1440,height:1000},file);let blockedWrites=0;blocked.on('request',r=>{if(r.method()==='POST'&&r.url()===origin+'/api/commercial-data')blockedWrites++});
    await blocked.locator('[data-client="demo-0"]').click();await blocked.locator('[data-client-module-error]').waitFor();assert.equal(await blocked.locator('[role="tabpanel"]').count(),0);await closeProfile(blocked);await blocked.locator('#openClientModal').click();assert.equal(await blocked.locator('#clientModal').isVisible(),false);await blocked.locator('#openEventModalBtn').click();assert.equal(await blocked.locator('#eventModal').isVisible(),false);assert.equal(await blocked.locator('[data-contact-form]').count(),0);
    // Failed initialization can omit generated controls; every exposed entry must refuse editing.
    for(const selector of ['#quickNewEvent','#salesEventsNewEvent']){const control=blocked.locator(selector);if(await control.count()){const view=await control.evaluate(e=>e.closest('[data-sales-view]')?.dataset.salesView||'clients');await blocked.locator('#commercialSidebar [data-view="'+view+'"]').click();await(await reveal(blocked,selector)).click();assert.equal(await blocked.locator('#eventModal').isVisible(),false);assert.equal(await blocked.locator('[data-contact-form]').count(),0)}}await blocked.locator('#commercialSidebar [data-tab="sales"][data-view="clients"]').click();assert.equal(blockedWrites,0);
    await blocked.locator('[data-client="demo-0"]').click();await blocked.locator('[data-return-client-modules]').click();assert.equal(await blocked.locator('[data-client="demo-0"]').isVisible(),true);
    if(file==='commercial-client-preferences.js'){await blocked.locator('[data-client="demo-0"]').click();await shot(blocked,'desktop-modulo-indisponivel');await closeProfile(blocked)}results.push({blockedModule:file,explicitError:true,legacyFallback:false,writes:blockedWrites});
  }
  data=(await remote(p)).data;for(const field of ['finalPrices','statuses','salePrices','priceHistory','saleCommissions','agents','unknownRoot','majucaImportSummary'])assert.deepEqual(data[field],baseline[field]);assert.deepEqual(data.clients.slice(1),baseline.clients.slice(1));
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(failedModules,[]);
  const report={historicalFailures:['initial selection opens legacy preferences','refresh loses full-profile state'],results,normalModuleFailures:failedModules,pageErrors:errors,externalRequests:external,production:false};await fs.writeFile(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{for(const c of contexts)await c.close();await browser.close()}
