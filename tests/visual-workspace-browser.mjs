import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin='http://127.0.0.1:5210',out='docs/visual-workspace',errors=[],failures=[],writes=[];
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const baseline=Object.fromEntries(['commercial.js','commercial-client-workflow-ui.js'].map(name=>[name,execFileSync('git',['show','fb77666:'+name],{encoding:'utf8',maxBuffer:4000000})]));
// The baseline JS is sanitized in memory before it can enter the test browser.
const begin=baseline['commercial.js'].indexOf('const MAJUCA_IMPORT_RECORDS=['),end=baseline['commercial.js'].indexOf('\n];',begin);
assert.ok(begin>=0&&end>=0);baseline['commercial.js']=baseline['commercial.js'].slice(0,begin)+'const MAJUCA_IMPORT_RECORDS=[];'+baseline['commercial.js'].slice(end+3);
try{
  for(const [name,viewport,before] of [['before-desktop',{width:1440,height:900},true],['desktop',{width:1440,height:900},false],['laptop',{width:1366,height:768},false],['tablet',{width:820,height:1080},false],['mobile',{width:390,height:844},false]]){
    const context=await browser.newContext({viewport});
    await context.route('**/*',route=>{
      const req=route.request(),url=new URL(req.url());
      if(url.origin!==origin)return route.abort();
      if(req.method()!=='GET'&&!url.pathname.endsWith('/api/access')){writes.push(url.pathname);return route.abort()}
      const file=url.pathname.slice(1);
      if(before&&file==='view-theme.css')return route.fulfill({contentType:'text/css',body:''});
      if(before&&baseline[file])return route.fulfill({contentType:'text/javascript',body:baseline[file]});
      return route.continue();
    });
    const page=await context.newPage();page.on('pageerror',error=>errors.push(name+': '+error.message));page.on('response',r=>{if(r.status()>=400)failures.push(name+': '+r.status()+' '+new URL(r.url()).pathname)});
    await page.goto(origin+'/commercial.html');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();
    await page.locator('[data-client="demo-0"]').waitFor({state:'attached'});
    const cache=()=>page.evaluate(()=>localStorage.getItem('theView.crmCommercial.v2')),initial=await cache();
    const snap=async label=>{if(!['edit-client','movement','preferences'].includes(label))await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/'+name+'-'+label+'.png',fullPage:label==='negotiation'});const width=await page.evaluate(()=>({page:document.documentElement.scrollWidth,view:innerWidth}));assert.ok(width.page<=width.view+1,name+' '+label+' page overflow '+JSON.stringify(width))};
    await snap('clients');await page.locator('[data-client="demo-0"]').click();
    const tab=async label=>{await page.getByRole('tab',{name:label,exact:true}).click();await page.locator('[role=tabpanel]:visible').waitFor()};
    await tab('Dados');await snap('data');
    if(!before){
      assert.equal(await page.locator('[data-client-header-edit]:visible').count(),1);assert.equal(await page.locator('.ux-client-workspace__top>.ux-next-action').count(),1);
      assert.equal(await page.locator('#clientStickyActions:visible').count(),0);
      await page.locator('#commercialSyncBadge').click();assert.equal(await page.locator('#commercialSyncStatus').isVisible(),true);await page.locator('#commercialSyncBadge').click();assert.equal(await page.locator('#commercialSyncStatus').isVisible(),false);
      await page.locator('[data-client-header-edit]').click();await page.locator('#clientModal:not(.hidden)').waitFor();
      if(name==='mobile'||name==='desktop')await snap('edit-client');await page.locator('#clientModal [data-close="clientModal"]').count()?await page.locator('#clientModal [data-close="clientModal"]').click():await page.locator('#clientModal .modal-close').click();
      await tab('Preferências');await page.locator('[data-preferences-edit]').click();await page.locator('[data-preference-key="typology"]').first().waitFor();
      if(name==='mobile'||name==='desktop')await snap('preferences');await page.locator('[data-preferences-cancel]').click();
      await tab('Frações');await page.locator('#clientFractionManual>summary').click();await page.locator('#clientFractionSearch').fill('1');
      if(name==='mobile'||name==='desktop')await snap('fractions');
      await tab('Apresentação');if(name==='mobile'||name==='desktop')await snap('presentation');
    }
    await tab('Negociação');await snap('negotiation');
    if(!before){
      assert.equal(await page.locator('.ux-opportunity').count(),6);
      assert.equal(await page.locator('[data-negotiation-unit="1"]').count(),0);
      for(const [n,group]of [[9,'active'],[24,'presented'],[30,'interested'],[36,'closed'],[37,'completed'],[38,'completed']])assert.equal(await page.locator(`[data-negotiation-unit="${n}"]`).getAttribute('data-opportunity-group'),group);
      assert.equal(await page.locator('#clientClosedOpportunities').getAttribute('open'),null);
      const summary=page.locator('[data-negotiation-unit="9"]>summary');await summary.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('[data-negotiation-unit="9"]').getAttribute('open'),'');await page.keyboard.press('Enter');
      await page.evaluate(()=>scrollTo(0,700));const bounds=await page.evaluate(()=>({header:document.getElementById('commercialAppHeader').getBoundingClientRect().bottom,tabs:document.querySelector('.ux-client-tabs').getBoundingClientRect().top}));assert.ok(bounds.tabs>=bounds.header-1,name+' sticky tabs overlap header');
      await page.locator('[data-negotiation-unit="9"]>summary').click();await page.locator('[data-negotiation-unit="9"] [data-workflow="unit-movement"]').click();await page.locator('[data-workflow-form="negotiation"]').waitFor();
      if(name==='desktop'||name==='mobile')await snap('movement');
      await page.locator('[data-workflow="cancel-negotiation"]').click();await page.locator('[data-dialog-confirm]').click();
      await page.reload();await page.locator('.ux-client-tabs').waitFor();await tab('Negociação');assert.equal(await page.locator('.ux-opportunity').count(),6);
      await page.locator('[data-client-return]').click();await page.locator('#clientSearch').waitFor({state:'visible'});await snap('return');
      await page.locator('.ux-management-menu>summary').click();for(const id of ['quickNewClient','quickNewAgent','quickNewEvent','quickMaintenance'])assert.equal(await page.locator('#'+id).isVisible(),true);await page.locator('.ux-management-menu>summary').click();
      const nav=async(tab,view='')=>{await page.locator(`#commercialSidebar [data-tab="${tab}"]${view?`[data-view="${view}"]`:''}`).click();await page.locator('#tab-'+(tab==='history'?'sales':tab)+':visible').waitFor()};
      for(const [key,view,label]of [['dashboard','','dashboard'],['sales','fractions','sales'],['sales','agents','agents'],['proposals','','proposals'],['compare','','compare'],['prices','','prices'],['history','history','history'],['history','events','events'],['reports','','reports']]){
        await nav(key,view);if(name==='desktop'||name==='mobile')await snap(label);
      }
      await page.locator('[data-ux-export="price-list"]').click();await page.locator('#priceListModal').waitFor();if(name==='desktop'||name==='mobile')await snap('price-list-options');await page.locator('[data-close-price-list-modal]').last().click();
      await page.locator('[data-ux-export="clients"]').click();await page.locator('#clientsSummaryPdfModal').waitFor();if(name==='desktop'||name==='mobile')await snap('client-report-options');await page.locator('[data-close-clients-summary]').last().click();
      assert.equal(await cache(),initial,name+' consultation changed commercial cache');
      await page.goto(origin+'/comparador.html');await page.locator('#dataStatus').waitFor();await page.locator('#openCompareMode').click();await page.locator('#compareCardsGrid').waitFor();if(name==='desktop'||name==='mobile')await snap('comparator');
      await page.route('**/api/commercial-data',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({ok:false,code:'SOURCE_UNAVAILABLE'})}));
      await page.goto(origin+'/commercial.html');await page.waitForFunction(()=>document.getElementById('commercialSyncBadge')?.dataset.phase==='offline');assert.equal(await page.locator('#commercialSyncStatus').isVisible(),true);assert.equal(await cache(),initial);if(name==='desktop'||name==='mobile')await snap('offline');
      // A deliberately unavailable source is an expected UI state, not a load regression.
      for(let i=failures.length-1;i>=0;i--)if(failures[i]===name+': 503 /api/commercial-data')failures.splice(i,1);
    }
    await context.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);assert.deepEqual(writes,[]);
  console.log('Visual browser PASS: desktop 1440x900, laptop 1366x768, tablet 820x1080, mobile 390x844; all tabs/modules, inline preferences, editing/cancel, grouped opportunities, reload/return, no page overflow, JS/load errors or commercial writes.');
}finally{await browser.close()}
