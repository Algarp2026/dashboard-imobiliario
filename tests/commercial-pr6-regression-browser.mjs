import assert from 'node:assert/strict';import {newClient as startNewClient,contactSettings,syncAction} from './helpers/current-client-ui.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN||'http://127.0.0.1:5197',key='theView.crmCommercial.v2';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const contexts=[],errors=[],external=[];
async function session(){
  const c=await browser.newContext();contexts.push(c);
  c.setDefaultTimeout(12000);await c.route('**/*',r=>{if(new URL(r.request().url()).origin===origin)return r.continue();external.push(r.request().url());return r.abort()});
  assert.equal((await c.request.get(origin+'/api/commercial-data')).status(),401);
  const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin+'/commercial.html');await p.locator('#password').fill('View-Phase2A-Teste');
  await p.getByRole('button',{name:'Entrar',exact:true}).click();await ready(p);return p;
}
async function ready(p){await p.locator('[data-client="demo-0"]').waitFor({state:'attached'});await synced(p)}
async function synced(p){await p.waitForFunction(()=>document.getElementById('commercialSyncBadge')?.dataset.phase==='synced')}
const remote=p=>p.evaluate(async()=>await(await fetch('/api/commercial-data')).json());
const cache=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
const tab=(p,name)=>p.getByRole('tab',{name,exact:true}).click();
async function profile(p,cid){if(await p.locator('.ux-client-profile-active:not(.sales-view-hidden)').count())await p.locator('[data-profile-close]').click();await p.locator(`[data-client="${cid}"]`).click()}
async function savePresentation(p,state){const f=p.locator('[data-workflow-form="presentation"]');await f.locator('[name="state"]').selectOption(state);await f.locator('[type="submit"]').click();await f.locator('[name="state"]').waitFor({state:'detached'});await synced(p)}
async function editPresentation(p,id){await p.locator(`#clientPanel-presentation [data-edit-client-event="${id}"]`).click()}
async function saveContact(p){const f=p.locator('[data-contact-form]');await f.locator('[type="submit"]').click();await f.waitFor({state:'detached'});await synced(p)}
async function communication(p,date,state,notes){
  await tab(p,'Dados');await p.locator('[data-workflow="new-contact"]').click();const f=p.locator('[data-contact-form]');
  await f.locator('[name="date"]').fill(date);await f.locator('[name="contactState"]').selectOption(state);await f.locator('[name="notes"]').fill(notes);await saveContact(p);
}
async function editContact(p,id,date,state){
  await tab(p,'Negociação');await p.locator('#clientFullHistory>summary').click();await p.locator(`#clientFullHistory [data-edit-client-event="${id}"]`).click();
  const f=p.locator('[data-contact-form]');await f.locator('[name="date"]').fill(date);await f.locator('[name="contactState"]').selectOption(state);
  await f.locator('[name="notes"]').fill('Fictitious historical correction '+date);await saveContact(p);
}
const contactState=p=>p.locator('[data-contact-settings] [name="contactState"]').inputValue();
try{
  const p=await session();await p.evaluate(async()=>{const r=await fetch('/api/test-control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reset:true})});if(!r.ok)throw Error('Isolated reset failed');localStorage.clear()});await p.reload();await ready(p);
  const baseline=(await remote(p)).data;assert.equal(baseline.clients.length,64);
  await startNewClient(p);await p.locator('#clientName').fill('PR6 fictitious client');await p.locator('#saveClient').click();await p.locator('#clientModal').waitFor({state:'hidden'});await synced(p);
  const cid=(await remote(p)).data.clients.find(c=>c.name==='PR6 fictitious client').id;
  await tab(p,'Apresentação');await p.locator('#clientPanel-presentation [data-ux-client-action="select-presentation"]').click();
  for(const n of [9,24,30]){await p.locator('#presentationSelectionSearch').fill(String(n));await p.locator(`[data-pick-fraction="${n}"]`).click()}
  await p.locator('[data-save-selection]').click();await p.locator('#presentationSelectionModal').waitFor({state:'hidden'});await synced(p);
  const selected=async()=> (await remote(p)).data.clients.find(c=>c.id===cid).presentationSelection;
  assert.deepEqual(await selected(),[9,24,30]);
  await tab(p,'Apresentação');await p.locator('[data-workflow="new-presentation"]').click();
  for(const n of [9,30])await p.locator(`[data-workflow="remove-unit"][data-number="${n}"]`).click();
  await p.locator('[data-present-price="24"]').fill('700000');await savePresentation(p,'draft');assert.deepEqual(await selected(),[9,24,30]);
  let data=(await remote(p)).data;const presentation=data.events.find(e=>e.clientId===cid&&e.presentationHistory);
  await editPresentation(p,presentation.id);await p.locator('[data-workflow-form="presentation"] [name="notes"]').fill('Fictitious draft edit');await savePresentation(p,'draft');assert.deepEqual(await selected(),[9,24,30]);
  await editPresentation(p,presentation.id);await savePresentation(p,'realized');assert.deepEqual(await selected(),[9,30]);
  await editPresentation(p,presentation.id);await p.locator('[data-present-price="24"]').fill('710000');await savePresentation(p,'realized');assert.deepEqual(await selected(),[9,30]);
  await p.reload();await ready(p);await profile(p,cid);assert.deepEqual(await selected(),[9,30]);
  await tab(p,'Apresentação');await editPresentation(p,presentation.id);await p.locator('[data-workflow-form="presentation"] [type="submit"]').click();
  await p.getByText('Sem alterações por guardar.',{exact:true}).waitFor();await p.locator('[data-workflow="cancel-presentation"]').click();await p.locator('[data-dialog-confirm]').click();
  data=(await remote(p)).data;assert.equal(data.events.filter(e=>e.id===presentation.id).length,1);assert.equal(data.events.find(e=>e.id===presentation.id).presentationHistory.length,4);assert.deepEqual(await selected(),[9,30]);
  await p.locator('[data-workflow="new-presentation"]').click();for(const n of [9,30])await p.locator(`[data-workflow="remove-unit"][data-number="${n}"]`).click();
  await p.locator('[data-workflow-form="presentation"] [name="addUnit"]').selectOption('24');await p.locator('[data-workflow="add-unit"]').click();await savePresentation(p,'realized');
  data=(await remote(p)).data;assert.equal(data.events.filter(e=>e.clientId===cid&&e.presentationHistory).length,2);assert.deepEqual(await selected(),[9,30]);
  await communication(p,'2026-08-03','A aguardar cliente','Fictitious first contact');
  const oldContact=(await remote(p)).data.events.find(e=>e.clientId===cid&&e.notes==='Fictitious first contact');
  const beforeBackdated=await p.locator('.ux-contact-controls').innerText();
  await communication(p,'2026-07-01','Resposta nossa pendente','Fictitious backdated contact');
  assert.equal(await contactState(p),'Resposta nossa pendente');
  const lastContact=text=>text.match(/Último contacto efetivo\s+([^\n]+)/)?.[1];
  assert.equal(lastContact(await p.locator('.ux-contact-controls').innerText()),lastContact(beforeBackdated));
  await contactSettings(p);const settings=p.locator('[data-contact-settings]');await settings.locator('[name="contactState"]').selectOption('Em acompanhamento');await settings.locator('[name="priority"]').check();await settings.locator('[type="submit"]').click();await synced(p);
  await p.waitForFunction(()=>!document.querySelector('[data-contact-settings] [type="submit"]')?.disabled);
  const manual=(await remote(p)).data.clients.find(c=>c.id===cid);assert.equal(manual.contactStateHistory.at(-1).source,'manual');
  const observer=await session();
  await editContact(p,oldContact.id,'2026-06-01','Sem contacto');assert.equal(await contactState(p),'Em acompanhamento');
  data=(await remote(p)).data;assert.deepEqual(data.clients.find(c=>c.id===cid).contactStateHistory,manual.contactStateHistory);assert.deepEqual(data.clients.find(c=>c.id===cid).priorityHistory,manual.priorityHistory);
  assert.equal(data.events.filter(e=>e.id===oldContact.id).length,1);assert.equal(data.events.find(e=>e.id===oldContact.id).communicationHistory.length,2);
  await syncAction(observer,'[data-sync-retry]');await synced(observer);await profile(observer,cid);assert.equal(await contactState(observer),'Em acompanhamento');
  assert.deepEqual((await cache(observer)).clients.find(c=>c.id===cid).contactStateHistory,manual.contactStateHistory);
  await p.reload();await ready(p);await profile(p,cid);assert.equal(await contactState(p),'Em acompanhamento');assert.deepEqual(await selected(),[9,30]);
  await editContact(p,oldContact.id,'2026-06-02','A aguardar cliente');assert.equal(await contactState(p),'Em acompanhamento');
  await communication(p,'2026-09-01','Resposta nossa pendente','Fictitious new explicit decision');assert.equal(await contactState(p),'Resposta nossa pendente');
  await syncAction(observer,'[data-sync-retry]');await synced(observer);assert.equal(await contactState(observer),'Resposta nossa pendente');
  await p.reload();await ready(p);await profile(p,cid);assert.equal(await contactState(p),'Resposta nossa pendente');
  data=(await remote(p)).data;assert.deepEqual(data.clients.find(c=>c.id===cid).priorityHistory,manual.priorityHistory);
  assert.deepEqual(data.clients.filter(c=>c.id!==cid),baseline.clients);assert.deepEqual(data.events.filter(e=>e.clientId!==cid),baseline.events);
  for(const field of ['finalPrices','statuses','salePrices','priceHistory','saleCommissions','agents','unknownRoot','majucaImportSummary'])assert.deepEqual(data[field],baseline[field]);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log(JSON.stringify({subset:[9,30],draftsPreserved:true,historicalEditsPreserved:true,repeatedHistory:true,noDuplicateOnEditOrRetry:true,backdatedContacts:true,manualStatePreserved:true,newExplicitDecision:true,reload:true,observerSync:true,unrelatedClientsAndCommercialDataUnchanged:true,javascriptErrors:errors,productionAccess:false}));
}finally{for(const c of contexts)await c.close();await browser.close()}
