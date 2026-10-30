import {closeProfile,openOpportunity,clientTab,reveal} from './helpers/current-client-ui.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const artifacts=process.env.VISUAL_AUDIT_ARTIFACTS||'docs/visual-workspace';
fs.mkdirSync(artifacts,{recursive:true});
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN||'http://127.0.0.1:5210',errors=[],writes=[],ratios=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
async function contrast(page,selector){
  const colors=await page.locator(selector).evaluate(e=>{const s=getComputedStyle(e);return[s.color,s.backgroundColor]});
  const luminance=color=>{const rgb=color.match(/[\d.]+/g).map(Number);assert.ok(rgb.length===3||rgb[3]===1,'Contrast background must be opaque');return rgb.slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0)};
  const a=luminance(colors[0]),b=luminance(colors[1]),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert.ok(ratio>=4.5,selector+' contrast '+ratio);ratios.push(Number(ratio.toFixed(2)));
}
try{
  for(const [size,viewport]of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
    const context=await browser.newContext({viewport});context.setDefaultTimeout(12000);await context.route('**/*',route=>{const req=route.request();if(new URL(req.url()).origin!==origin)return route.abort();if(req.method()!=='GET'&&!req.url().endsWith('/api/access')){writes.push(req.url());return route.abort()}return route.continue()});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/commercial.html');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.locator('[data-client="demo-4"]').waitFor({state:'attached'});
    const cache=()=>page.evaluate(()=>localStorage.getItem('theView.crmCommercial.v2')),before=await cache();
    const open=async cid=>{if(await page.locator('.ux-client-profile-active:not(.sales-view-hidden)').count())await closeProfile(page);await page.locator(`[data-client="${cid}"]`).click();await page.getByRole('tab',{name:'Oportunidades',exact:true}).click()};
    const shot=async label=>{await page.evaluate(()=>scrollTo(0,0));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.screenshot({path:`${artifacts}/audit-${size}-${label}.png`,fullPage:true})};
    await open('demo-4');await reveal(page,'[data-opportunity-unit="9"]');const third=page.locator('[data-opportunity-unit="9"]');assert.match(await third.locator('summary').first().innerText(),/Não concretizada/);await openOpportunity(page,9);assert.match(await third.innerText(),/Vendido|terceir|outro cliente/i);assert.equal(await third.locator('[data-op-state] option[value="Em negociação"]').evaluate(e=>e.disabled),true);assert.match(await third.locator('.opportunity-origin').textContent(),/audit-sale-9/);await shot('third-party');
    await open('demo-6');assert.equal(await page.locator('[data-opportunity-unit="18"]').count(),0);assert.match(await page.locator('[data-opportunity-unit="19"]>summary').innerText(),/Em negociação/);await shot('unpriced-visit');
    await open('demo-7');const reopened=page.locator('[data-opportunity-unit="24"]');assert.match(await reopened.locator('summary').first().innerText(),/Apresentada/);await openOpportunity(page,24);await reopened.locator('.op-history>summary').click();assert.match(await reopened.innerText(),/Sem interesse/);await shot('reopening');
    await open('demo-8');const closed=page.locator('[data-opportunity-unit="30"]');await openOpportunity(page,30);assert.match(await closed.locator('.opportunity-origin').innerText(),/Desistência global.*2026-10-05/);await closed.locator('.op-history>summary').click();assert.ok(await closed.locator('[data-edit-client-event="audit-global-close"]').count());await shot('global-withdrawal');
    await clientTab(page,'Dados');await contrast(page,'[data-client-header-edit]');
    await closeProfile(page);await page.locator('#commercialSidebar [data-tab="reports"]').click();await contrast(page,'[data-ux-export="clients"]');assert.equal(await cache(),before);
    await page.goto(origin+'/comparador.html');await page.locator('#openCompareMode').click();await page.locator('#compareCardsGrid').waitFor();await contrast(page,'#backToHomeTop');await page.locator('#backToHomeTop').hover();await contrast(page,'#backToHomeTop');await page.mouse.move(0,0);await page.screenshot({path:`${artifacts}/${size}-comparator.png`});
    assert.equal((await(await context.request.get(origin+'/api/test-meta')).json()).writes,0);await context.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);console.log('Audit browser PASS: four card scenarios desktop/mobile, global provenance editable through original event, no JS errors/writes/cache changes; contrast ratios '+ratios.join(', '));
}finally{await browser.close()}
