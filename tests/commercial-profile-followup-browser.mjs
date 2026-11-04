import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const ops=createRequire(import.meta.url)('../commercial-opportunities.js');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN||'http://127.0.0.1:53396',out=process.env.REFORM_ARTIFACTS||'outputs/client-followup';
assert.equal(new URL(origin).hostname,'127.0.0.1');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE}),results=[],errors=[];
try{
 for(const [name,width,height]of [['desktop',1440,1000],['laptop',1366,768],['tablet',820,1080],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width,height}});await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin+'/commercial.html');await p.locator('#password').fill('View-Phase2A-Teste');await p.getByRole('button',{name:'Entrar',exact:true}).click();
  await p.locator('[data-open-profile="demo-0"]').click();await p.locator('[data-client-followup]').waitFor();
  if(name==='desktop'){
    const source=await p.evaluate(async()=>await(await fetch('/api/commercial-data')).json());
    if(!source.data.events.some(e=>e.id==='synthetic-ux-refusal')||!source.data.events.some(e=>e.id==='synthetic-ux-visit')){
      if(!source.data.events.some(e=>e.id==='synthetic-ux-refusal'))source.data.events.push(ops.build({id:'synthetic-ux-refusal',clientId:'demo-0',action:'refuse',date:'2026-10-17',fractions:[2],reason:ops.reasons[0],notes:'Recusa inteiramente fictícia'},source.data));
      if(!source.data.events.some(e=>e.id==='synthetic-ux-visit'))source.data.events.push({id:'synthetic-ux-visit',clientId:'demo-0',type:'Visita',date:'2026-10-20',fractions:[9],notes:'Visita inteiramente fictícia'});
      const status=await p.evaluate(async source=>(await fetch('/api/commercial-data',{method:'POST',headers:{'Content-Type':'application/json','X-CRM-Read-Ticket':source.readTicket},body:JSON.stringify({action:'save',baseRevision:source.revision,requestId:'synthetic-ux-fixture-'+crypto.randomUUID(),data:source.data})})).status,source);assert.equal(status,200);
      await p.reload();await p.locator('[data-open-profile="demo-0"]').waitFor();if(!await p.locator('#clientProfileDialog:not(.hidden)').count())await p.locator('[data-open-profile="demo-0"]').click();await p.locator('[data-client-followup]').waitFor();
    }
  }
  assert.equal(await p.getByRole('tab',{name:'Dados',exact:true}).getAttribute('aria-selected'),'true');
  const snapshot=()=>p.evaluate(async()=>await(await fetch('/api/commercial-data')).json());
  const before=(await snapshot()).data,form=p.locator('[data-client-followup]');
  await form.locator('[name="response"]').selectOption('client');await form.locator('[name="pendingDescription"]').fill('Pendência inteiramente fictícia');
  await form.locator('[name="lastInteraction"]').fill('2026-10-15');await form.locator('[name="waitingSince"]').fill('2026-10-16');await form.locator('[name="observation"]').fill('Observação fictícia '+name);
  if(await form.locator('[data-followup-add]').count())await form.locator('[data-followup-add]').click();
  await form.locator('[name="reminderDate"]').fill(await p.evaluate(()=>new Date().toISOString().slice(0,10)));await form.locator('[name="reminderState"]').selectOption('open');
  await form.getByRole('button',{name:'Guardar seguimento',exact:true}).click();
  await p.waitForFunction(()=>document.getElementById('commercialSyncBadge')?.dataset.phase==='synced',null,{timeout:15000});
  const after=(await snapshot()).data;assert.equal(after.clients[0].followupV1.observation,'Observação fictícia '+name);assert.deepEqual(after.events,before.events);
  for(const key of Object.keys(before).filter(key=>key!=='clients'))assert.deepEqual(after[key],before[key]);assert.deepEqual(after.clients.slice(1),before.clients.slice(1));
  if(name==='desktop'){
    let previous=after.clients[0].followupV1;
    for(const state of ['done','open','removed','open']){
      const current=p.locator('[data-client-followup]');await current.locator('[name="reminderState"]').selectOption(state);await current.getByRole('button',{name:'Guardar seguimento',exact:true}).click();
      await p.waitForFunction(()=>document.getElementById('commercialSyncBadge')?.dataset.phase==='synced');
      const data=(await snapshot()).data,next=data.clients[0].followupV1;assert.equal(next.reminder.state,state);assert.equal(next.lastInteraction,previous.lastInteraction);assert.equal(next.waitingSince,previous.waitingSince);assert.equal(next.history.length,previous.history.length+1);assert.deepEqual(data.events,before.events);previous=next;
    }
  }
  await p.reload();await p.locator('[data-open-profile="demo-0"]').waitFor();if(!await p.locator('#clientProfileDialog:not(.hidden)').count())await p.locator('[data-open-profile="demo-0"]').click();await p.locator('[data-client-followup]').waitFor();assert.equal(await p.locator('[data-client-followup] [name="observation"]').inputValue(),'Observação fictícia '+name);
  const unchanged=await snapshot();await p.locator('[data-client-followup] [type="submit"]').click();assert.match(await p.locator('[data-followup-status]').innerText(),/Sem alterações/);assert.equal((await snapshot()).revision,unchanged.revision);
  await p.screenshot({path:out+'/'+name+'-dados.png'});
  await p.getByRole('tab',{name:'Procura',exact:true}).click();await p.locator('.client-preference-strip').waitFor();
  assert.equal(await p.locator('.client-search-selection #clientFractionSelection').count(),1);
  assert.equal(await p.locator('.client-search-selection .ux-client-facts').count(),0);
  await p.screenshot({path:out+'/'+name+'-procura.png'});
  await p.locator('.ux-client-workspace__content').evaluate(node=>node.scrollTop=600);
  const sticky=await p.locator('.client-preference-strip').evaluate(node=>{const content=node.closest('.ux-client-workspace__content'),button=content.querySelector('.client-search-selection [data-ux-client-action="select-presentation"]'),r=node.getBoundingClientRect(),c=content.getBoundingClientRect(),b=button.getBoundingClientRect();return{top:r.top,contentTop:c.top+parseFloat(getComputedStyle(content).paddingTop),bottom:r.bottom,buttonTop:b.top,buttonBottom:b.bottom,contentBottom:c.bottom,scroll:content.scrollTop}});
  assert.ok(sticky.scroll>0);assert.ok(Math.abs(sticky.top-sticky.contentTop)<=2,JSON.stringify(sticky));assert.ok(sticky.buttonTop>=sticky.bottom-1&&sticky.buttonBottom<=sticky.contentBottom,JSON.stringify(sticky));
  await p.screenshot({path:out+'/'+name+'-procura-scroll.png'});await p.locator('.ux-client-workspace__content').evaluate(node=>node.scrollTop=0);
  await p.getByRole('tab',{name:'Oportunidades',exact:true}).click();
  const opener=p.locator('[data-opportunity-open="9"]');await opener.click();
  const dialog=p.locator('[data-opportunity-unit="9"] dialog');await dialog.waitFor();assert.equal(await dialog.evaluate(n=>n.open),true);
  await dialog.locator('.op-history > summary').click();await dialog.locator('[data-edit-client-event="synthetic-ux-visit"]').click();
  await p.locator('#eventModal:not(.hidden)').waitFor();await p.waitForFunction(()=>!document.getElementById('clientOpportunityDialog-9').open);assert.equal(await p.locator('#eventNotes').inputValue(),'Visita inteiramente fictícia');
  await p.locator('#closeEventModal').click();await dialog.waitFor();assert.equal(await dialog.evaluate(n=>n.open),true);
  await dialog.locator('[data-op-command="pdf"]').click();await p.locator('#presentationPriceModal').waitFor();assert.equal(await dialog.evaluate(n=>n.open),false);
  await p.locator('#presentationPriceModal').getByRole('button',{name:'Cancelar',exact:true}).click();await dialog.waitFor();assert.equal(await dialog.evaluate(n=>n.open),true);
  if(name==='desktop'){
    const original=(await snapshot()).data;
    await dialog.locator('[data-op-state]').selectOption('Reservada');await dialog.locator('[name="amount"]').fill('500000');await dialog.locator('[data-op-form] [type="submit"]').click();
    await p.locator('[data-dialog-confirm]').waitFor();assert.equal(await dialog.evaluate(n=>n.open),false);await p.locator('[data-dialog-cancel]').last().click();
    await p.locator('[data-opportunity-unit="9"] dialog').waitFor();assert.deepEqual((await snapshot()).data,original);
    await p.locator('[data-opportunity-unit="9"] [data-op-command="cancel"]').click();
    await p.locator('[data-opportunity-unit="9"] [data-op-form]').waitFor({state:'detached'});
  }
  await p.screenshot({path:out+'/'+name+'-oportunidade.png'});
  await dialog.evaluate(node=>{const controls=[...node.querySelectorAll('button,input,select,textarea,a[href],summary')].filter(control=>!control.disabled&&control.getClientRects().length);controls.at(-1).focus()});
  await p.keyboard.press('Tab');assert.equal(await dialog.locator('[data-opportunity-close]').evaluate(node=>document.activeElement===node),true,'Tab must wrap to the first opportunity control');
  await p.keyboard.press('Shift+Tab');assert.equal(await dialog.evaluate(node=>node.contains(document.activeElement)),true);
  await p.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.equal(await opener.evaluate(n=>document.activeElement===n),true);
  assert.equal(await p.locator('.opportunity-group--refused').count(),1);assert.equal(await p.locator('.opportunity-group--refused').evaluateAll(nodes=>nodes.every(n=>!n.open)),true);assert.match(await p.locator('.opportunity-group--refused > summary').innerText(),/Recusadas \(1\)/);
  await p.screenshot({path:out+'/'+name+'-oportunidades.png'});
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await p.locator('[data-profile-close]').click();await p.locator('[data-client="demo-0"] .client-reminder-due').waitFor();
  results.push({name,width,threeTabs:true,selectionSidebar:true,nativeDialog:true,escapeAndFocus:true,noPageOverflow:true,followupPersistedAndReloaded:true,noUnrelatedMutations:true,pdfModalAccessible:true,reminderDueVisible:true});await context.close();
 }
 // Two genuinely isolated browser sessions: edit protection, CAS and recovery.
 const peers=[];
 for(let i=0;i<2;i++){
  const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/commercial.html');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.locator('[data-open-profile="demo-0"]').click();await page.locator('[data-client-followup]').waitFor();peers.push({page,context});
 }
 const a=peers[0].page,b=peers[1].page,key='theView.crmCommercial.v2';
 const base=await a.evaluate(async()=>await(await fetch('/api/commercial-data')).json());
 await a.locator('[data-client-followup] [name="observation"]').fill('Fictitious unsaved device A');
 await b.locator('[data-client-followup] [name="observation"]').fill('Fictitious confirmed device B');await b.locator('[data-client-followup] [type="submit"]').click();await b.waitForFunction(()=>document.getElementById('commercialSyncBadge')?.dataset.phase==='synced');
 await a.bringToFront();await a.clock.install();await a.clock.fastForward(70000);await a.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await a.waitForFunction(()=>window.__autoSyncTest.status().incoming);assert.equal(await a.locator('[data-client-followup] [name="observation"]').inputValue(),'Fictitious unsaved device A');
 await a.locator('[data-client-followup] [type="submit"]').click();await a.waitForFunction(()=>!document.querySelector('[data-client-followup] fieldset').disabled);assert.notEqual(await a.locator('#commercialSyncBadge').getAttribute('data-phase'),'synced');
 const local=await a.evaluate(key=>localStorage.getItem(key),key),pending=await a.evaluate(key=>localStorage.getItem(key+'.pendingWrite.v1'),key);
 assert.equal(JSON.parse(local).clients[0].followupV1.observation,'Fictitious unsaved device A');
 const stale=await a.evaluate(async({base,data})=>(await fetch('/api/commercial-data',{method:'POST',headers:{'Content-Type':'application/json','X-CRM-Read-Ticket':base.readTicket},body:JSON.stringify({action:'save',baseRevision:base.revision,requestId:'synthetic-followup-cas-'+crypto.randomUUID(),data})})).status,{base,data:JSON.parse(local)});assert.equal(stale,409);
 assert.equal((await b.evaluate(async()=>await(await fetch('/api/commercial-data')).json())).data.clients[0].followupV1.observation,'Fictitious confirmed device B');
 a.once('dialog',dialog=>{assert.equal(dialog.type(),'beforeunload');dialog.accept()});await a.reload();await a.waitForFunction(()=>document.getElementById('commercialSyncBadge')?.dataset.phase!=='loading');
 assert.equal(await a.evaluate(key=>JSON.parse(localStorage.getItem(key)).clients[0].followupV1.observation,key),'Fictitious unsaved device A');assert.equal(await a.evaluate(key=>localStorage.getItem(key+'.pendingWrite.v1'),key),pending);
 results.push({twoIndependentSessions:true,automaticReadKeepsFollowingDraft:true,cas409:true,remoteWinnerPreserved:true,localPendingReloadPreserved:true});for(const peer of peers)await peer.context.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/results.json',JSON.stringify({results,errors,production:false},null,2));console.log(JSON.stringify({results,errors}));
}finally{await browser.close()}
