import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN,out=process.env.REFORM_ARTIFACTS;
if(!origin||new URL(origin).hostname!=='127.0.0.1'||!/^53\d{3}$/.test(new URL(origin).port))throw Error('Isolated loopback required');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const errors=[],requests=[],report={productionNetwork:false,realCommercialData:false,viewports:[]};
const alignCategory=modal=>modal.locator('.comps-list--analysis>.comp-block').nth(2).evaluate(el=>{const box=el.closest('.modal');box.scrollTop+=el.getBoundingClientRect().top-box.getBoundingClientRect().top-16});
try{
 for(const [label,width,height]of [['desktop',1440,1000],['laptop',1366,768],['tablet',820,1080],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width,height}});
  try{
   await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
   const auth=await context.request.post(origin+'/api/access',{headers:{Origin:origin},data:{password:'View-Phase2A-Teste'}});assert.equal(auth.status(),200);
   const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.url()===origin+'/api/commercial-data')requests.push(r.method())});
   await p.goto(origin+'/comparador.html');await p.locator('#openCompareMode').click();await p.locator('[data-open-fraction="1"]').waitFor();
   assert.equal(await p.locator('[data-open-fraction]').count(),39);assert.match(await p.locator('#compareKpis').textContent(),/27.395.000/);
   const storage=await p.evaluate(()=>JSON.stringify({...localStorage}));
   for(const n of [1,9,23,36,37,38,39]){
    await p.locator('[data-open-fraction="'+n+'"]').click();const modal=p.locator('#fractionModal:not(.hidden)');await modal.waitFor();
    assert.equal(await modal.locator('.comps-list--analysis>.comp-block').count(),4);
    const ids=await modal.locator('[data-comparable]').evaluateAll(nodes=>nodes.map(n=>n.dataset.comparable));assert.equal(ids.length,new Set(ids).size);
    if(n===1){assert.match(await modal.locator('.comp-block').first().innerText(),/Sem comparável direto/);assert.equal(await modal.locator('.comp-block').first().locator('[data-comparable="BelaFormosa|RF108"]').count(),0)}
    if(n>=36){const expected={36:['LF504','RF504'],37:['LF507','RF507'],38:['RB503','RB504'],39:['LB507','RB507']}[n];for(const code of expected){const card=modal.locator('.comps-list--analysis>.comp-block').nth(2).locator('[data-comparable="BelaFormosa|'+code+'"]');assert.equal(await card.count(),1);assert.match(await card.textContent(),/Vista estimada/)}assert.match(await modal.locator('.comps-list--analysis>.comp-block').last().textContent(),/Rooftop/)}
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    if(n===36){await modal.locator('.modal').evaluate(el=>el.scrollTop=0);await p.screenshot({path:out+'/'+label+'-apt36-summary.png'});await alignCategory(modal);await p.screenshot({path:out+'/'+label+'-apt36-comparables.png'})}
    if(n===37&&label==='mobile'){await alignCategory(modal);await p.screenshot({path:out+'/mobile-apt37-comparables.png'})}
    await modal.locator('#compExteriorCoefficient').fill('50');await modal.locator('#compExteriorCoefficient').dispatchEvent('change');assert.equal(await modal.locator('#compExteriorCoefficient').inputValue(),'50');
    await modal.locator('#compExteriorCoefficient').fill('30');await modal.locator('#compExteriorCoefficient').dispatchEvent('change');
    await modal.locator('.modal-close').click();
   }
   await p.locator('#compareDevelopmentFilter').selectOption('BelaFormosa');await p.locator('[data-open-fraction="36"]').click();assert.ok((await p.locator('[data-comparable]').evaluateAll(nodes=>nodes.map(n=>n.dataset.comparable))).every(k=>k.startsWith('BelaFormosa|')));await p.locator('#fractionModal .modal-close').click();
   assert.equal(await p.evaluate(()=>JSON.stringify({...localStorage})),storage);report.viewports.push({label,width,height,fractionsChecked:[1,9,23,36,37,38,39],exclusiveLayers:true,fifthFloorReferences:true,uncertainViewsVisible:true,coefficientReadOnly:true,noHorizontalOverflow:true});
  }finally{await context.close()}
 }
 assert.deepEqual(errors,[]);assert.equal(requests.length,0);report.errors=errors;report.commercialApiRequests=0;fs.writeFileSync(out+'/validation-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close()}
