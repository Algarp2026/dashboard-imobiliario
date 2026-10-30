import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN,phase=process.env.D2_REVIEW_PHASE||'after',output=path.resolve(process.env.D2_REVIEW_OUTPUT||'../d2-final-review'),errors=[],results=[];
if(!origin||new URL(origin).hostname!=='127.0.0.1'||!/^53\d{3}$/.test(new URL(origin).port))throw Error('Isolated loopback required');
await fs.mkdir(path.join(output,phase),{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const previous=new Map();if(phase==='before')for(const file of ['commercial.js','commercial-opportunity-ui.js','view-workspace.js','view-theme.css']){let source=execFileSync('git',['show','54dfd0a:'+file],{encoding:'utf8'});if(file==='commercial.js'){const start=source.indexOf('const MAJUCA_IMPORT_RECORDS=['),end=source.indexOf('\n];',start);assert.ok(start>=0&&end>start);source=source.slice(0,start)+'const MAJUCA_IMPORT_RECORDS=[];'+source.slice(end+3)}previous.set('/'+file,source)}
try{
 for(const [size,width,height]of [['desktop',1440,900],['laptop',1366,768],['tablet',820,1080],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width,height}}),posts=[];
  await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.abort();if(r.request().method()!=='GET'&&u.pathname!=='/api/access'){posts.push(u.pathname);return r.abort()}if(previous.has(u.pathname))return r.fulfill({contentType:u.pathname.endsWith('.css')?'text/css':'text/javascript',body:previous.get(u.pathname)});return r.continue()});
  const page=await context.newPage();page.on('pageerror',e=>errors.push({size,message:e.message}));await page.goto(origin+'/commercial.html');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.locator('[data-open-profile="demo-0"]').waitFor();
  const cache=()=>page.evaluate(()=>localStorage.getItem('theView.crmCommercial.v2')),before=await cache(),meta=await(await context.request.get(origin+'/api/test-meta')).json();
  const shot=async name=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:path.join(output,phase,size+'-'+name+'.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,size+' '+name+' page overflow')};
  const nav=async(tab,view='')=>{await page.locator('#commercialSidebar [data-tab="'+tab+'"]'+(view?'[data-view="'+view+'"]':'')).click();await page.locator('#tab-'+(tab==='history'?'sales':tab)+':visible').waitFor()};
  await nav('dashboard');await shot('dashboard');assert.equal(await page.locator('.d2-metric').count(),4);
  await nav('sales','clients');await shot('clientes');await page.locator('[data-open-profile="demo-0"]').click();await page.getByRole('tab',{name:'Dados',exact:true}).click();await shot('dados');
  assert.deepEqual(await page.locator('[data-contact-settings] [name="contactState"] option').evaluateAll(options=>options.map(option=>option.value)),['Resposta nossa pendente','A aguardar cliente','Em acompanhamento','Sem contacto'],'Visual labels must never change submitted commercial values');
  await page.getByRole('tab',{name:'Procura',exact:true}).click();await shot('procura');await page.locator('[data-preferences-edit]').click();await shot('preferencias-editor');await page.locator('[data-preferences-cancel]').click();
  await page.getByRole('tab',{name:'Oportunidades',exact:true}).click();await shot('oportunidades');await page.locator('[data-opportunity-unit="9"]>summary').click();await shot('oportunidade-detalhe');
  if(phase==='after')await page.locator('[data-opportunity-unit="9"] [data-d2-close-opportunity]').click();
  await page.locator('[data-profile-close]').click();await nav('sales','fractions');await shot('inventario');await nav('prices');await shot('precos');
  await nav('sales','agents');await shot('agentes');await nav('history','history');await page.locator('[data-history-fraction="9"]').click();await shot('historico');await nav('history','events');await shot('eventos');
  await nav('compare');await shot('comparador-interno');await nav('reports');await shot('relatorios');await page.locator('[data-ux-export="price-list"]').click();await shot('modal-lista-precos');await page.locator('[data-close-price-list-modal]').last().click();
  if(phase==='after'){
   await nav('sales','clients');await page.locator('[data-open-profile="demo-0"]').click();await page.getByRole('tab',{name:'Procura',exact:true}).click();await page.locator('#clientFractionSearch').waitFor({state:'attached'});
   await page.locator('[data-preferences-edit]').click();const input=page.locator('#clientPreferencesEditor input').first();const old=await input.inputValue();await input.fill('123456');await input.focus();
   const selection=await page.locator('#clientFractionSelection').textContent();await page.evaluate(()=>window.__loadingPersistenceTest.read());assert.equal(await input.inputValue(),'123456');assert.equal(await input.evaluate(e=>document.activeElement===e),true);assert.equal(await page.locator('#clientFractionSelection').textContent(),selection);await page.locator('[data-preferences-cancel]').click();await page.locator('[data-profile-close]').click();
  }
  assert.equal(await cache(),before);const after=await(await context.request.get(origin+'/api/test-meta')).json();assert.equal(after.revision,meta.revision);assert.equal(after.writes,meta.writes);assert.deepEqual(posts,[]);
  await page.goto(origin+'/comparador.html');await page.locator('#openCompareMode').click();await page.locator('#compareCardsGrid').waitFor();await shot('comparador-publico');
  assert.equal(await page.locator('#commercialSyncBadge').count(),0);await page.locator('#compareDevelopmentFilter').selectOption({label:'BelaFormosa'});await shot('belaformosa');await page.locator('#compareCardsGrid button').first().click();await page.locator('#fractionModal:not(.hidden)').waitFor();await shot('comparador-detalhe');await page.locator('#closeFractionModal').click();
  results.push({size,width,height,cacheUnchanged:true,revisionUnchanged:true,writes:0});await context.close();
 }
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(output,phase,'results.json'),JSON.stringify({phase,results,errors,production:false},null,2));console.log(JSON.stringify({phase,viewports:results.length,errors}));
}finally{await browser.close()}
