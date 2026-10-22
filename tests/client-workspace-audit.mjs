import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN||'http://127.0.0.1:5210',out=process.env.WORKSPACE_ARTIFACTS||'docs/client-agent-workspace',errors=[];
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
try{
  for(const [name,viewport]of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
    const context=await browser.newContext({viewport});context.setDefaultTimeout(12000);await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const p=await context.newPage();let posts=0;p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(new URL(r.url()).pathname==='/api/commercial-data'&&r.method()==='POST')posts++});
    await p.goto(origin+'/commercial.html');await p.locator('#password').fill('View-Phase2A-Teste');await p.getByRole('button',{name:'Entrar',exact:true}).click();await p.locator('[data-open-profile="demo-0"]').waitFor();
    const remote=()=>p.evaluate(async()=>await(await fetch('/api/commercial-data')).json()),before=(await remote()).data;
    await p.locator('[data-open-profile="demo-0"]').click();await p.locator('#clientProfileDialog:not(.hidden)').waitFor();
    await p.getByRole('tab',{name:'Oportunidades',exact:true}).click();await p.locator('#clientFullHistory>summary').click();await p.locator('[data-ux-client-action="event"]').click();await p.locator('#eventModal:not(.hidden)').waitFor();assert.equal(await p.locator('#eventClientId').inputValue(),'demo-0');await p.keyboard.press('Escape');await p.locator('#eventModal.hidden').waitFor({state:'attached'});await p.locator('[data-profile-close]').click();
    const row=p.locator('[data-client="demo-0"]');await row.scrollIntoViewIfNeeded();assert.equal(await row.locator('.client-portfolio-contacts a').count(),2);assert.equal(await row.locator('a[href^="tel:"]').getAttribute('href'),'tel:+351000000000');assert.equal(await row.locator('a[href^="mailto:"]').getAttribute('href'),'mailto:cliente@example.invalid');
    assert.equal(await p.locator('[data-client="demo-1"] .client-portfolio-contacts').count(),0);
    await row.locator('a').evaluateAll(links=>links.forEach(link=>link.addEventListener('click',event=>event.preventDefault())));await row.locator('a[href^="mailto:"]').click();await row.locator('a[href^="tel:"]').click();assert.equal(await p.locator('#clientProfileDialog').isVisible(),false);
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:out+'/'+name+'-portfolio-contacts.png'});
    await p.locator('#openEventModalBtn').click();await p.locator('#eventModal:not(.hidden)').waitFor();assert.equal(await p.locator('#eventClientId').inputValue(),'');assert.equal(await p.locator('#eventClientId option:checked').innerText(),'Selecione um cliente');await p.screenshot({path:out+'/'+name+'-new-event-unassigned.png'});
    await p.locator('#saveEvent').click();await p.locator('#appDialogModal').waitFor();assert.match(await p.locator('#appDialogModal').innerText(),/Escolha um cliente/);await p.locator('[data-dialog-confirm]').click();assert.deepEqual((await remote()).data,before);assert.equal(posts,0);
    await p.locator('#eventClientId').selectOption('demo-1');await p.locator('#eventType').selectOption('Outro');const note='Auditoria PR13 '+name+' exclusivamente ficticia';await p.locator('#eventNotes').fill(note);await p.locator('#saveEvent').click();await p.locator('#eventModal.hidden').waitFor({state:'attached'});await p.waitForFunction(()=>document.getElementById('commercialSyncBadge')?.dataset.phase==='synced');
    const saved=(await remote()).data,created=saved.events.filter(e=>!before.events.some(old=>old.id===e.id));assert.equal(posts,1);assert.equal(created.length,1);assert.equal(created[0].clientId,'demo-1');assert.equal(created[0].notes,note);
    assert.deepEqual(saved.clients.find(c=>c.id==='demo-0'),before.clients.find(c=>c.id==='demo-0'));assert.deepEqual(saved.events.filter(e=>e.clientId==='demo-0'),before.events.filter(e=>e.clientId==='demo-0'));
    for(const key of Object.keys(before))if(!['clients','events'].includes(key))assert.deepEqual(saved[key],before[key],key+' changed');
    assert.deepEqual(saved.clients.filter(c=>c.id!=='demo-1'),before.clients.filter(c=>c.id!=='demo-1'));
    await p.reload();await p.locator('[data-open-profile="demo-0"]').waitFor();const reloaded=(await remote()).data;assert.equal(reloaded.events.filter(e=>e.id===created[0].id).length,1);assert.equal(reloaded.events.find(e=>e.id===created[0].id).clientId,'demo-1');
    await context.close();
  }
  assert.deepEqual(errors,[]);console.log('PR13 audit PASS desktop/mobile: close A -> global event unassigned, required-client validation without writes, explicit B only, reload persistence, client-context A preserved; compact contacts, safe links, no horizontal overflow, protected commercial data unchanged. Fictional memory store only.');
}finally{await browser.close()}
