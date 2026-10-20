import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN||'http://127.0.0.1:5210',errors=[],writes=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
try{
  const context=await browser.newContext();context.setDefaultTimeout(12000);await context.route('**/*',route=>{const r=route.request(),url=new URL(r.url());if(url.origin!==origin)return route.abort();if(r.method()!=='GET'&&!url.pathname.endsWith('/api/access')){writes.push(url.pathname);return route.abort()}return route.continue()});
  const p=await context.newPage();p.setDefaultTimeout(12000);p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin+'/commercial.html');await p.locator('#password').fill('View-Phase2A-Teste');await p.getByRole('button',{name:'Entrar',exact:true}).click();await p.locator('[data-open-profile="demo-0"]').waitFor();
  const cache=()=>p.evaluate(()=>localStorage.getItem('theView.crmCommercial.v2')),initial=await cache();
  await p.locator('[data-open-profile="demo-40"]').scrollIntoViewIfNeeded();const y=await p.evaluate(()=>scrollY);await p.locator('[data-open-profile="demo-40"]').click();await p.locator('#clientProfileDialog:not(.hidden)').waitFor();
  const ids=await p.locator('[data-open-profile]').evaluateAll(nodes=>nodes.map(e=>e.dataset.openProfile));await p.locator('[data-profile-next]').click();assert.equal(new URL(p.url()).searchParams.get('client'),ids[ids.indexOf('demo-40')+1]);await p.locator('[data-profile-prev]').click();assert.equal(new URL(p.url()).searchParams.get('client'),'demo-40');
  await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>!!document.activeElement.closest('#clientProfileDialog')),true);
  await p.locator('[data-profile-close]').focus();await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>!!document.activeElement.closest('#clientProfileDialog')),true);
  await p.goBack();await p.locator('#clientProfileDialog.hidden').waitFor({state:'attached'});await p.waitForFunction(y=>Math.abs(scrollY-y)<3,y);
  await p.goForward();await p.locator('#clientProfileDialog:not(.hidden)').waitFor();assert.equal(new URL(p.url()).searchParams.get('client'),'demo-40');await p.locator('[data-profile-close]').click();
  await p.locator('[data-open-profile="demo-0"]').click();await p.locator('[data-client-header-edit]').click();await p.locator('#clientModal:not(.hidden)').waitFor();await p.locator('#clientOrigin').selectOption('Agente');
  const extra=p.locator('#clientAdditionalFields');if(await extra.count()&&!await extra.getAttribute('open'))await extra.locator('summary').click();
  await p.locator('#createAgentFromClientBtn').click();await p.locator('#agentModal:not(.hidden)').waitFor();
  await p.waitForFunction(()=>document.getElementById('clientModal').inert&&document.getElementById('clientProfileDialog').inert&&!document.getElementById('agentModal').inert);
  await p.keyboard.press('Escape');await p.locator('#agentModal.hidden').waitFor({state:'attached'});assert.equal(await p.locator('#clientModal').isVisible(),true);assert.equal(await p.locator('#clientOrigin').inputValue(),'Agente');
  await p.keyboard.press('Escape');await p.locator('#clientModal.hidden').waitFor({state:'attached'});assert.equal(await p.locator('#clientProfileDialog').isVisible(),true);
  await p.getByRole('tab',{name:'Apresentação',exact:true}).click();await p.locator('[data-ux-client-action="documentation"]').click();await p.locator('#eventModal:not(.hidden)').waitFor();await p.keyboard.press('Escape');await p.locator('#eventModal.hidden').waitFor({state:'attached'});assert.equal(await p.locator('#clientProfileDialog').isVisible(),true);
  await p.locator('[data-workflow="pdf"]').click();await p.locator('#presentationPriceModal').waitFor();await p.keyboard.press('Escape');await p.locator('#presentationPriceModal').waitFor({state:'detached'});assert.equal(await p.locator('#clientProfileDialog').isVisible(),true);
  await p.locator('[data-workflow="new-presentation"]').click();const form=p.locator('[data-workflow-form="presentation"]');await form.locator('[name="notes"]').fill('Preservar rascunho apos fechar ficha');
  await form.locator('fieldset').evaluate(e=>e.disabled=true);await p.locator('[data-profile-close]').click();assert.equal(await p.locator('#clientProfileDialog').isVisible(),true);await p.keyboard.press('Escape');assert.equal(await p.locator('#clientProfileDialog').isVisible(),true);await form.locator('fieldset').evaluate(e=>e.disabled=false);
  await p.locator('[data-profile-close]').click();await p.locator('[data-open-profile="demo-0"]').click();await p.getByRole('tab',{name:'Apresentação',exact:true}).click();assert.equal(await form.locator('[name="notes"]').inputValue(),'Preservar rascunho apos fechar ficha');
  await p.locator('[data-workflow="cancel-presentation"]').click();await p.locator('[data-dialog-confirm]').waitFor();await p.keyboard.press('Escape');await p.locator('#appDialogModal').waitFor({state:'detached'});assert.equal(await form.locator('[name="notes"]').inputValue(),'Preservar rascunho apos fechar ficha');
  await p.locator('[data-workflow="cancel-presentation"]').click();await p.locator('[data-dialog-confirm]').click();
  await p.locator('[data-profile-close]').click();await p.locator('#commercialSidebar [data-tab="history"][data-view="history"]').click();await p.locator('#fractionHistoryList [data-history-fraction="9"]').click();
  await p.locator('#fractionHistoryDetail [data-edit-history-event="visual-present-9"]').click();await p.locator('#clientProfileDialog:not(.hidden)').waitFor();assert.equal(await p.locator('[data-workflow-form="presentation"] [name="date"]').inputValue(),'2026-10-01');
  await p.locator('[data-profile-close]').click();assert.equal(await p.locator('#fractionHistoryDetail').isVisible(),true);
  await p.locator('#commercialSidebar [data-tab="sales"][data-view="clients"]').click();
  for(const [id,note]of [['demo-0','Preferencias ficticias A'],['demo-1','Preferencias ficticias B']]){await p.locator(`[data-open-profile="${id}"]`).click();await p.getByRole('tab',{name:'Preferências',exact:true}).click();await p.locator('[data-preferences-edit]').click();await p.locator('#clientPreferencesEditor [name="summary"]').fill(note);await p.locator('[data-profile-close]').click()}
  await p.locator('[data-open-profile="demo-0"]').click();await p.getByRole('tab',{name:'Preferências',exact:true}).click();assert.equal(await p.locator('#clientPreferencesEditor [name="summary"]').inputValue(),'Preferencias ficticias A');await p.locator('[data-preferences-cancel]').click();
  assert.equal(await cache(),initial);assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  console.log('Dialog browser PASS: list scroll, Back/Forward, Tab containment, nested client/agent Escape, proposal PDF, confirmation cancel, busy-close guard and draft retention; zero commercial writes.');
}finally{await browser.close()}
