import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN||'http://127.0.0.1:5210',out='docs/composition-d2-platform',errors=[],failures=[],writes=[],results=[];
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
try{
  for(const [size,viewport]of [['desktop',{width:1440,height:900}],['laptop',{width:1366,height:768}],['tablet',{width:820,height:1080}],['mobile',{width:390,height:844}]].filter(([name])=>!process.env.TEST_VIEWPORT||name===process.env.TEST_VIEWPORT))for(const mode of ['after']){
    const context=await browser.newContext({viewport});
    context.setDefaultTimeout(12000);await context.route('**/*',route=>{const req=route.request(),url=new URL(req.url());if(url.origin!==origin)return route.abort();if(req.method()!=='GET'&&!url.pathname.endsWith('/api/access')){writes.push(url.pathname);return route.abort()}return route.continue()});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(`${size}-${mode}: ${e.message}`));page.on('response',r=>{if(r.status()>=400)failures.push(`${r.status()} ${new URL(r.url()).pathname}`)});
    await page.goto(origin+'/commercial.html');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.locator('[data-client="demo-0"]').waitFor({state:'attached'});
    const cache=()=>page.evaluate(()=>localStorage.getItem('theView.crmCommercial.v2')),before=await cache(),meta=await(await context.request.get(origin+'/api/test-meta')).json();
    const shot=async(label,focus)=>{await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));if(focus)await page.locator(focus).scrollIntoViewIfNeeded();else await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${out}/${mode}-${size}-${label}.png`});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1?[...document.querySelectorAll('body *')].filter(e=>e.getClientRects().length&&e.getBoundingClientRect().right>innerWidth+1).slice(-20).map(e=>({tag:e.tagName,id:e.id,class:e.className,parent:e.parentElement?.id||e.parentElement?.className,ancestors:[e.parentElement?.parentElement?.id,e.parentElement?.parentElement?.className],width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right})):[]);assert.deepEqual(overflow,[],`${size}-${mode}-${label} overflow: `+JSON.stringify(overflow))};
    const nav=async(tab,view='')=>{await page.locator(`#commercialSidebar [data-tab="${tab}"]${view?`[data-view="${view}"]`:''}`).click();await page.locator('#tab-'+(tab==='history'?'sales':tab)+':visible').waitFor();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))};
    await nav('dashboard');await shot('dashboard');assert.equal(await page.locator('.d2-metric').count(),4);assert.equal((await page.locator('.d2-pipeline button>strong').allTextContents()).reduce((sum,n)=>sum+Number(n),0),64);await page.locator('[data-d2-stage="Qualificado"]').click();assert.equal(await page.locator('#clientStageFilter').inputValue(),'Qualificado');await page.locator('#clientStageFilter').selectOption('all');await nav('sales','fractions');assert.equal(await page.locator('.d2-inventory-metrics>div').count(),4);await page.locator('[data-ux-sales-filter="search"]').fill('9');assert.equal(await page.locator('#salesTableBody [data-status="9"]').count(),1);await page.locator('[data-ux-sales-filter="search"]').fill('');await page.locator('.ux-column-menu>summary').click();assert.ok(await page.locator('[data-ux-column]').count()>10);await page.locator('.ux-column-menu>summary').click();
    await nav('sales','agents');await shot('agents');
    if(mode==='after'){
      await page.locator('.d2-agent-directory').waitFor();assert.equal(await page.locator('.d2-agent-contacts .metric-box').count(),2);
      const search=page.locator('#agentsPanel .d2-list-search');await search.fill('does-not-exist');assert.equal(await page.locator('[data-agent-card]:visible').count(),0);await search.fill('');await page.locator('[data-agent-card]').first().focus();await page.keyboard.press('Enter');
    }
    await page.locator('[data-edit-agent-detail]').click();await page.locator('#agentModal:not(.hidden)').waitFor();await shot('agent-editor','#agentModal h2');await page.locator('#closeAgentModal').click();
    await nav('prices');await shot('prices');
    if(mode==='after'){
      await page.locator('#priceSearch').fill('9');assert.ok(await page.locator('#pricesTableBody [data-price]').count()>0);await page.locator('#priceSearch').fill('');
      await page.locator('.d2-price-history>summary').click();await shot('price-history','.d2-price-history h2');await page.locator('.d2-price-history>summary').click();
    }else await shot('price-history','#priceHistoryChart');
    await nav('proposals');await shot('proposals');
    await page.locator('#proposalSearch').fill('9');await page.locator('#selectProposalVisible').click();assert.match(await page.locator('#proposalSelectedInfo').innerText(),/[1-9]/);await page.locator('#clearProposalSelected').click();await page.locator('#proposalSearch').fill('');
    await nav('history','history');await page.locator('[data-history-fraction="9"]').click();await shot('history');
    if(mode==='after'){
      const observation=page.locator('.d2-record-observation').first();if(await observation.count()){await observation.locator('summary').click();assert.equal(await observation.locator('p').isVisible(),true)}
      assert.equal(await page.locator('.d2-history-overview').count(),1);
    }
    assert.ok(await page.locator('[data-edit-history-event]').count()>0);
    await nav('history','events');await shot('events');await page.locator('#salesEventsNewEvent').click();await page.locator('#eventModal:not(.hidden)').waitFor();await shot('event-editor','#eventModal h2');await page.locator('#cancelEvent').click();
    if(mode==='after'){
      const count=await page.locator('#salesEventsList>.event-item').count();await page.locator('#salesEventsPanel .d2-list-search').fill('does-not-exist');assert.equal(await page.locator('#salesEventsList>.event-item:visible').count(),0);await page.locator('#salesEventsPanel .d2-list-search').fill('');assert.equal(await page.locator('#salesEventsList>.event-item:visible').count(),count);
      await page.locator('.d2-event-detail>summary').first().click();await shot('event-detail','.d2-event-detail[open]');
    }else await shot('event-detail','#salesEventsList>.event-item:first-child');
    await nav('reports');await shot('reports');if(mode==='after')assert.equal(await page.locator('.d2-report-card').count(),5);
    await page.locator('[data-ux-export="clients"]').click();await page.locator('#clientsSummaryPdfModal').waitFor();await shot('client-report','#clientsSummaryPdfModal h2');await page.locator('[data-close-clients-summary]').last().click();
    await page.locator('[data-ux-export="price-list"]').click();await page.locator('#priceListModal').waitFor();await shot('price-list','#priceListModal h2');await page.locator('[data-close-price-list-modal]').last().click();
    const maintenance=page.locator('.ux-report-maintenance>summary');await maintenance.click();await shot('administration','.ux-report-maintenance');await maintenance.click();
    await nav('compare');await shot('internal-comparator');
    await nav('sales','clients');await page.locator('[data-client="demo-0"]').click();await page.locator('[data-client-header-edit]').click();await page.locator('#clientModal:not(.hidden)').waitFor();await shot('client-editor','#clientModal h2');await page.locator('#cancelClient').click();await page.getByRole('tab',{name:'Procura',exact:true}).click();await shot('preferences');await page.locator('[data-preferences-edit]').click();await shot('preferences-editor','#clientPreferencesEditor');
    if(mode==='after')assert.equal(await page.locator('.d2-preference-choices .ux-preference-selector').count(),3);
    await page.locator('[data-preference-key="typology"]').first().click();await page.locator('[data-preferences-cancel]').click();
    await page.getByRole('tab',{name:'Procura',exact:true}).click();await shot('client-fractions');
    await page.getByRole('tab',{name:'Oportunidades',exact:true}).click();const card=page.locator('[data-opportunity-unit="1"]');await card.locator('summary').first().click();await card.locator('[data-op-state]').selectOption('Apresentada');await shot('presentation-editor','[data-op-form]');await card.locator('[data-op-command="cancel"]').click();await shot('opportunities');assert.equal(await page.locator('.opportunity-workspace').count(),1);
    await page.reload();await page.locator('.ux-client-tabs').waitFor();await page.locator('[data-profile-close]:visible, [data-client-return]:visible').first().click();
    assert.equal(await cache(),before);const after=await(await context.request.get(origin+'/api/test-meta')).json();assert.equal(after.revision,meta.revision);assert.equal(after.writes,0);
    await page.goto(origin+'/comparador.html');await page.locator('#openCompareMode').click();await page.locator('#compareCardsGrid').waitFor();await shot('comparator');
    if(mode==='after'){
      assert.equal(await page.locator('.d2-comparator-filters #compareTypologyFilter').count(),1);await page.locator('#compareTypologyFilter').selectOption({index:1});assert.ok(await page.locator('#compareCardsGrid').innerText());await page.locator('#resetCompareFilters').click();
    }
    await page.locator('#compareCardsGrid button').first().click();await page.locator('#fractionModal:not(.hidden)').waitFor();await shot('comparator-detail','#fractionModal');await page.locator('#closeFractionModal').click();
    results.push({size,mode,viewport,cacheUnchanged:true,revisionUnchanged:true,writes:0});await context.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);assert.deepEqual(writes,[]);
  fs.writeFileSync(`${out}/results.json`,JSON.stringify({results,errors,failures,writes,source:'fictitious in-memory only'},null,2)+'\n');
  console.log('D2 platform PASS: current modules at four resolutions; filters, editors, cancellation, refresh, selection, original handlers, no JS/load errors, page overflow or commercial writes.');
}finally{await browser.close()}
