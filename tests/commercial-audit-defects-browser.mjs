import {reveal} from './helpers/current-client-ui.mjs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN||'http://127.0.0.1:5201',errors=[],writes=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
try{
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
    const context=await browser.newContext({viewport});
    context.setDefaultTimeout(12000);await context.route('**/*',route=>{const req=route.request();if(new URL(req.url()).origin!==origin)return route.abort();if(req.method()!=='GET'&&!req.url().endsWith('/api/access')){writes.push(req.url());return route.abort()}return route.continue()});
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin+'/commercial.html');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();
    await page.locator('[data-client="demo-0"]').waitFor({state:'attached'});
    const cache=()=>page.evaluate(()=>localStorage.getItem('theView.crmCommercial.v2')),before=await cache();
    await page.locator('#commercialSidebar [data-tab="sales"][data-view="fractions"]').click();
    for(const [number,status] of [[9,'Reservado'],[30,'Vendido']]){
      const select=page.locator(`#salesTableBody [data-status="${number}"]`);await select.selectOption('Disponível');
      await page.getByText(/Reservas e vendas não podem ser alteradas por ajuste manual/).waitFor();await page.locator('[data-dialog-confirm]').click();assert.equal(await select.inputValue(),status);
    }
    await page.locator('#salesTableBody [data-status="24"]').selectOption('Indisponível');await page.locator('[data-dialog-cancel]').last().click();assert.equal(await page.locator('#salesTableBody [data-status="24"]').inputValue(),'Disponível');
    await page.locator('#commercialSidebar [data-tab="sales"][data-view="clients"]').click();await page.locator('[data-client="demo-2"]').click();await page.getByRole('tab',{name:'Dados',exact:true}).click();
    await (await reveal(page,'#clientPanel-data [data-ux-client-action="stage"]')).click();await page.locator('#clientStage').selectOption('Desistiu');await page.locator('#saveClient').click();
    await page.getByText(/Encerra interesses não concluídos/).waitFor();await page.locator('[data-dialog-cancel]').last().click();assert.equal(await cache(),before);
    await page.reload();await page.locator('.client-detail-header').waitFor();assert.equal(await page.locator('.client-detail-header .badge').innerText(),'Em negociação');assert.equal(await cache(),before);
    await page.locator('[data-profile-close]').click();await page.locator('[data-client="demo-3"]').click();await page.getByRole('tab',{name:'Dados',exact:true}).click();await (await reveal(page,'#clientPanel-data [data-ux-client-action="stage"]')).click();await page.locator('#clientStage').selectOption('Qualificado');await page.locator('#saveClient').click();await page.getByText(/Inicia um novo ciclo como Qualificado/).waitFor();await page.locator('[data-dialog-cancel]').last().click();assert.equal(await cache(),before);
    const meta=await(await context.request.get(origin+'/api/test-meta')).json();assert.equal(meta.writes,0);await context.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
  console.log('Audit dialogs passed on desktop/mobile: reserved/sold adjustments blocked, administrative prompt and global withdrawal cancelled without cache changes, reload preserved, zero commercial POSTs and JS errors.');
}finally{await browser.close()}
