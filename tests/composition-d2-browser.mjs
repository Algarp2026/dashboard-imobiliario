import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN||'http://127.0.0.1:5210',out='docs/composition-d2',errors=[],failures=[],writes=[];
fs.mkdirSync(out,{recursive:true});
const previous=Object.fromEntries(['commercial.js','commercial-client-workflow-ui.js','view-theme.css'].map(file=>[file,execFileSync('git',['show','8ba9038:'+file],{encoding:'utf8',maxBuffer:4000000})]));
const begin=previous['commercial.js'].indexOf('const MAJUCA_IMPORT_RECORDS=['),end=previous['commercial.js'].indexOf('\n];',begin);assert.ok(begin>=0&&end>=0);previous['commercial.js']=previous['commercial.js'].slice(0,begin)+'const MAJUCA_IMPORT_RECORDS=[];'+previous['commercial.js'].slice(end+3);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const results=[];
try{
  for(const [size,viewport]of [['desktop',{width:1440,height:900}],['laptop',{width:1366,height:768}],['tablet',{width:820,height:1080}],['mobile',{width:390,height:844}]])for(const mode of ['before','after']){
    const context=await browser.newContext({viewport});context.setDefaultTimeout(12000);await context.route('**/*',route=>{const req=route.request(),url=new URL(req.url());if(url.origin!==origin)return route.abort();if(req.method()!=='GET'&&!url.pathname.endsWith('/api/access')){writes.push(url.pathname);return route.abort()}const file=url.pathname.slice(1);return mode==='before'&&previous[file]?route.fulfill({contentType:file.endsWith('.css')?'text/css':'text/javascript',body:previous[file]}):route.continue()});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(`${mode}-${size}: ${e.message}`));page.on('response',r=>{if(r.status()>=400)failures.push(`${mode}-${size}: ${r.status()} ${new URL(r.url()).pathname}`)});
    await page.goto(origin+'/commercial.html');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.locator('[data-client="demo-0"]').waitFor({state:'attached'});
    const cache=()=>page.evaluate(()=>localStorage.getItem('theView.crmCommercial.v2')),initial=await cache(),meta=await(await context.request.get(origin+'/api/test-meta')).json();
    const full=size==='desktop'||size==='mobile';
    const shot=async(label,focus)=>{if(focus)await page.locator(focus).scrollIntoViewIfNeeded();else await page.evaluate(()=>scrollTo(0,0));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${mode}-${size}-${label} overflow`);await page.screenshot({path:`${out}/${mode}-${size}-${label}.png`})};
    const nav=async(tab,view='')=>{await page.locator(`#commercialSidebar [data-tab="${tab}"]${view?`[data-view="${view}"]`:''}`).click();await page.locator('#tab-'+(tab==='history'?'sales':tab)+':visible').waitFor()};
    await nav('dashboard');await shot('dashboard');
    if(mode==='after'){
      assert.equal(await page.locator('.d2-metric').count(),4);assert.equal(await page.locator('.d2-metric').first().locator('strong').innerText(),'37');
      const counts=await page.locator('.d2-pipeline button>strong').allTextContents();assert.equal(counts.reduce((s,x)=>s+Number(x),0),64);
      await page.locator('[data-d2-stage="Qualificado"]').click();assert.equal(await page.locator('#clientStageFilter').inputValue(),'Qualificado');await page.locator('#clientStageFilter').selectOption('all');
    }
    await nav('sales','clients');await page.locator('[data-client="demo-0"]').click();await page.getByRole('tab',{name:'Dados',exact:true}).click();await shot('profile');
    if(mode==='after'){
      assert.equal(await page.locator('.d2-profile-overview>.ux-next-action').count(),1);assert.equal(await page.locator('[data-client-header-edit]:visible').count(),1);
      assert.equal(await page.locator('[data-contact-settings]').isVisible(),false);await page.locator('#clientContactSettings>summary').click();assert.equal(await page.locator('[data-contact-settings]').isVisible(),true);await page.locator('#clientContactSettings>summary').click();
    }
    if(full){
      await page.locator('[data-client-header-edit]').click();await page.locator('#clientModal:not(.hidden)').waitFor();await shot('edit-client','#clientModal h2');await page.locator('#cancelClient').click();
      await page.getByRole('tab',{name:'Preferências',exact:true}).click();await page.locator('[data-preferences-edit]').click();await shot('preferences','#clientPreferencesEditor');await page.locator('[data-preferences-cancel]').click();
      await page.getByRole('tab',{name:'Frações',exact:true}).click();await shot('fractions');
      await page.getByRole('tab',{name:'Apresentação',exact:true}).click();await shot('presentation');
    }
    await page.getByRole('tab',{name:'Negociação',exact:true}).click();await shot('negotiation');
    if(mode==='after'){
      assert.equal(await page.locator('.ux-opportunity').count(),6);
      assert.equal(await page.locator('[data-negotiation-unit="24"]>summary .ux-opportunity-prices>span').count(),1);
      assert.equal(await page.locator('[data-negotiation-unit="9"]>summary .ux-opportunity-prices>span').count(),2);
      assert.equal(await page.locator('[data-negotiation-unit="36"]>summary .ux-opportunity-prices').count(),0);
      await page.locator('[data-negotiation-unit="9"]>summary').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('[data-negotiation-unit="9"]').getAttribute('open'),'');await page.keyboard.press('Enter');
    }
    if(full){
      await page.locator('[data-negotiation-unit="9"]>summary').click();await shot('negotiation-expanded','[data-negotiation-unit="9"]');await page.locator('[data-negotiation-unit="9"]>summary').click();
      await page.locator('#clientClosedOpportunities>summary').click();await page.locator('[data-negotiation-unit="36"]>summary').click();await shot('negotiation-closed','[data-negotiation-unit="36"]');
    }
    await page.reload();await page.locator('.ux-client-tabs').waitFor();await page.locator('[data-profile-close]:visible, [data-client-return]:visible').first().click();await page.locator('#clientSearch').waitFor({state:'visible'});if(full)await shot('clients');
    await nav('sales','fractions');await shot('sales');
    if(mode==='after'){
      assert.equal(await page.locator('.d2-inventory-metrics>div').count(),4);await page.locator('[data-ux-sales-filter="search"]').fill('9');assert.equal(await page.locator('#salesTableBody [data-status="9"]').count(),1);await page.locator('[data-ux-sales-filter="search"]').fill('');
      await page.locator('.ux-column-menu>summary').click();assert.ok(await page.locator('[data-ux-column]').count()>10);await page.locator('.ux-column-menu>summary').click();
    }
    if(full){
      for(const [tab,view,label]of [['proposals','','proposals'],['sales','agents','agents'],['prices','','prices'],['history','history','history'],['history','events','events'],['reports','','reports']]){await nav(tab,view);await shot(label)}
      await page.locator('[data-ux-export="price-list"]').click();await page.locator('#priceListModal').waitFor();await shot('price-list','#priceListModal h2');await page.locator('[data-close-price-list-modal]').last().click();
      await page.goto(origin+'/comparador.html');await page.locator('#openCompareMode').click();await page.locator('#compareCardsGrid').waitFor();await shot('comparator');
    }
    assert.equal(await cache(),initial,`${mode}-${size} changed business cache`);const afterMeta=await(await context.request.get(origin+'/api/test-meta')).json();assert.equal(afterMeta.revision,meta.revision);assert.equal(afterMeta.writes,0);
    results.push({mode,size,viewport,cacheUnchanged:true,sourceRevisionUnchanged:true,writes:0});await context.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);assert.deepEqual(writes,[]);fs.writeFileSync(out+'/results.json',JSON.stringify({results,errors,failures,writes,source:'fictitious in-memory only',productionNetwork:false},null,2));console.log('D2 before/after PASS: same fictitious source, four resolutions, dashboard/pipeline, compact client/forms/cards, inventory controls, keyboard, refresh and modules; zero JS errors, overflow or business writes.');
}finally{await browser.close()}
