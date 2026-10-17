import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin='http://127.0.0.1:5210',out=process.env.WORKSPACE_ARTIFACTS||'docs/client-agent-workspace',errors=[],writes=[],failures=[];
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const baseline=Object.fromEntries(['commercial.js'].map(name=>[name,execFileSync('git',['show','5d2c91f:'+name],{encoding:'utf8',maxBuffer:4000000})]));
const begin=baseline['commercial.js'].indexOf('const MAJUCA_IMPORT_RECORDS=['),end=baseline['commercial.js'].indexOf('\n];',begin);
assert.ok(begin>=0&&end>=0);baseline['commercial.js']=baseline['commercial.js'].slice(0,begin)+'const MAJUCA_IMPORT_RECORDS=[];'+baseline['commercial.js'].slice(end+3);
try{
  for(const [name,viewport,before] of [['before-desktop',{width:1440,height:900},true],['before-mobile',{width:390,height:844},true],['desktop',{width:1440,height:900},false],['laptop',{width:1366,height:768},false],['tablet',{width:820,height:1080},false],['mobile',{width:390,height:844},false]]){
    console.log('Checking '+name);
    const context=await browser.newContext({viewport});
    await context.route('**/*',route=>{const req=route.request(),url=new URL(req.url());if(url.origin!==origin)return route.abort();if(req.method()!=='GET'&&!url.pathname.endsWith('/api/access')){writes.push(url.pathname);return route.abort()}const file=url.pathname.slice(1);if(before&&baseline[file])return route.fulfill({contentType:file.endsWith('.html')?'text/html':'text/javascript',body:baseline[file]});return route.continue()});
    const p=await context.newPage();p.on('pageerror',e=>errors.push(name+': '+e.message));p.on('response',r=>{if(r.status()>=400)failures.push(name+': '+r.status()+' '+new URL(r.url()).pathname)});
    p.setDefaultTimeout(12000);
    await p.goto(origin+'/commercial.html');await p.locator('#password').fill('View-Phase2A-Teste');await p.getByRole('button',{name:'Entrar',exact:true}).click();await p.locator('[data-client="demo-0"]').waitFor({state:'attached'});
    const cache=()=>p.evaluate(()=>localStorage.getItem('theView.crmCommercial.v2')),initial=await cache();
    const snap=async label=>{await p.screenshot({path:out+'/'+name+'-'+label+'.png'});const size=await p.evaluate(()=>({width:document.documentElement.scrollWidth,view:innerWidth}));assert.ok(size.width<=size.view+1,name+' '+label+' horizontal overflow')};
    await snap('portfolio');
    if(before){await p.locator('[data-client="demo-0"]').click();await snap('profile');await context.close();continue}
    assert.equal(await p.locator('.client-portfolio-row').count(),64);assert.match(await p.locator('#clientFilterSummary').innerText(),/64 de 64/);assert.equal(await p.locator('#clientListSort').inputValue(),'newest');
    assert.equal(await p.locator('#openEventModalBtn').innerText(),'Novo Evento');await p.locator('#openEventModalBtn').click();await p.locator('#eventModal:not(.hidden)').waitFor();assert.equal(await p.locator('#eventClientId').isVisible(),true);await p.keyboard.press('Escape');await p.locator('#eventModal.hidden').waitFor({state:'attached'});
    await p.locator('#openClientModal').click();await p.locator('#clientModal:not(.hidden)').waitFor();assert.equal(await p.locator('#clientName').inputValue(),'');assert.equal(await p.locator('#clientId').inputValue(),'');await p.keyboard.press('Escape');await p.locator('#clientModal.hidden').waitFor({state:'attached'});
    assert.equal(await p.locator('[data-open-profile]').first().getAttribute('data-open-profile'),'demo-0');
    for(const mode of ['stage','contact-recent','contact-oldest','next-action','newest']){await p.locator('#clientListSort').selectOption(mode);assert.equal(await p.locator('.client-portfolio-row').count(),64)}
    await p.locator('#clientListSort').selectOption('oldest');await p.locator('#clientSearch').fill('Cliente Exemplo');assert.equal(await p.locator('.client-portfolio-row').count(),1);
    await p.locator('[data-open-profile="demo-0"]').click();await p.locator('#clientProfileDialog:not(.hidden)').waitFor();
    assert.match(p.url(),/client=demo-0/);
    const tab=label=>p.getByRole('tab',{name:label,exact:true}).click();
    await tab('Dados');await snap('data');
    await p.locator('[data-client-header-edit]').click();await p.locator('#clientModal:not(.hidden)').waitFor();
    assert.equal(await p.locator('#clientProfileDialog').evaluate(e=>e.inert),true);
    await p.keyboard.press('Escape');await p.locator('#clientModal.hidden').waitFor({state:'attached'});assert.equal(await p.locator('#clientProfileDialog').evaluate(e=>e.inert),false);
    await tab('Preferências');await p.locator('[data-preferences-edit]').click();await p.locator('[data-preference-key="typology"]').first().waitFor();await snap('preferences');await p.locator('[data-preferences-cancel]').click();
    await tab('Frações');await p.locator('#clientFractionManual>summary').click();await p.locator('#clientFractionSearch').fill('1');await snap('fractions');
    await tab('Apresentação');await snap('presentation');
    await p.locator('[data-workflow="new-presentation"]').click();const form=p.locator('[data-workflow-form="presentation"]');await form.waitFor();await form.locator('[name="notes"]').fill('Rascunho ficticio preservado');
    await tab('Dados');await tab('Apresentação');assert.equal(await form.locator('[name="notes"]').inputValue(),'Rascunho ficticio preservado');
    await tab('Negociação');await snap('negotiation');
    await p.reload();await p.locator('#clientProfileDialog:not(.hidden)').waitFor();assert.equal(await p.getByRole('tab',{name:'Negociação',exact:true}).getAttribute('aria-selected'),'true');
    await p.locator('[data-profile-close]').click();await p.locator('#clientProfileDialog.hidden').waitFor({state:'attached'});assert.equal(await p.locator('#clientSearch').inputValue(),'Cliente Exemplo');assert.equal(await p.locator('#clientListSort').inputValue(),'oldest');await snap('return');
    await p.waitForFunction(()=>document.activeElement?.dataset.openProfile==='demo-0');
    await p.locator('#clientSearch').fill('');await p.locator('#clientListSort').selectOption('newest');
    await p.locator('.client-advanced-filters>summary').click();await p.locator('#clientAgentFilter').selectOption('demo-agent');assert.equal(await p.locator('.client-portfolio-row').count(),1);
    await p.locator('#clientContactFilter').selectOption('Em acompanhamento');await p.locator('#clientPriorityFilter').selectOption('no');assert.equal(await p.locator('.client-portfolio-row').count(),1);
    await p.locator('#clientStageFilter').selectOption('Novo Lead');assert.equal(await p.locator('.client-portfolio-row').count(),0);await p.locator('#clientFilterSummary [data-ux-client-list="clear"]').click();assert.equal(await p.locator('.client-portfolio-row').count(),64);
    const nav=async(tab,view='')=>{await p.locator(`#commercialSidebar [data-tab="${tab}"]${view?`[data-view="${view}"]`:''}`).click()};
    await nav('sales','agents');await p.locator('.agent-associated-row').waitFor();await snap('agents');
    await p.locator('.agent-associated-row [data-ux-client="demo-0"]').click();await p.locator('#clientProfileDialog:not(.hidden)').waitFor();await p.keyboard.press('Escape');await p.locator('#clientProfileDialog.hidden').waitFor({state:'attached'});assert.equal(await p.locator('#agentsPanel').count()?await p.locator('#agentsPanel').isVisible():await p.locator('.agent-associated-row').isVisible(),true);
    await p.locator('[data-agent-portfolio]').click();assert.equal(await p.locator('#clientAgentFilter').inputValue(),'demo-agent');assert.equal(await p.locator('.client-portfolio-row').count(),1);
    await nav('dashboard');await p.locator('#globalCommercialSearch').fill('Cliente Exemplo');const shortcut=p.locator('#globalCommercialResults [data-ux-client="demo-0"]');await shortcut.click();await p.locator('#clientProfileDialog:not(.hidden)').waitFor();assert.equal(new URL(p.url()).searchParams.get('client'),'demo-0');await p.locator('[data-profile-close]').click();assert.equal(await p.locator('#tab-dashboard').isVisible(),true);
    await p.goto(origin+'/commercial.html?client=demo-0&clientTab=preferences');await p.locator('#clientProfileDialog:not(.hidden)').waitFor();assert.equal(await p.getByRole('tab',{name:'Preferências',exact:true}).getAttribute('aria-selected'),'true');
    await p.locator('[data-profile-close]').click();await p.locator('#clientProfileDialog.hidden').waitFor({state:'attached'});
    assert.equal(await cache(),initial,name+' consultation changed CRM cache');
    await context.close();
  }
  const direct=await browser.newContext();await direct.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());const page=await direct.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/commercial.html?client=demo-0&clientTab=preferences');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.locator('#clientProfileDialog:not(.hidden)').waitFor();assert.equal(await page.getByRole('tab',{name:'Preferências',exact:true}).getAttribute('aria-selected'),'true');await direct.close();
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);assert.deepEqual(writes,[]);
  console.log('Workspace browser PASS: before/after, four responsive sizes, filters/sort, five functional tabs, editing/Escape, draft retention, refresh/deep links, agents and dashboard origins, return focus and zero business writes.');
}finally{await browser.close()}
