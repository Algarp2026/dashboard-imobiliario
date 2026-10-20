import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN||'http://127.0.0.1:5201';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const errors=[],external=[],commercialPosts=[];
try{
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
    const context=await browser.newContext({viewport});
    context.setDefaultTimeout(12000);await context.route('**/*',route=>{
      const req=route.request();
      if(new URL(req.url()).origin!==origin){external.push(req.url());return route.abort()}
      if(req.method()!=='GET'&&!req.url().endsWith('/api/access')){commercialPosts.push(req.url());return route.abort()}
      return route.continue();
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/commercial.html');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();
    await page.locator('[data-client="demo-0"]').waitFor({state:'attached'});
    const before=await page.evaluate(()=>localStorage.getItem('theView.crmCommercial.v2'));
    for(const [id,stage] of [['demo-0','Reservado'],['demo-1','Vendido'],['demo-2','Em negociação'],['demo-3','Desistiu']]){
      await page.locator('#clientStageFilter').selectOption('all');
      await page.locator(`[data-client="${id}"]`).scrollIntoViewIfNeeded();
      assert.equal(await page.locator(`[data-client="${id}"] .badge`).innerText(),stage);
      await page.locator(`[data-client="${id}"]`).click();
      assert.equal(await page.locator('.client-detail-header .badge').innerText(),stage);
      await page.getByRole('tab',{name:'Dados',exact:true}).click();
      assert.ok((await page.locator('.ux-contact-controls').innerText()).includes(stage));
      await page.getByRole('tab',{name:'Frações',exact:true}).click();
      if(id==='demo-0')assert.ok((await page.locator('#clientRelatedDetails').innerText()).includes('Reservado'));
      await page.getByRole('tab',{name:'Negociação',exact:true}).click();
      if(id==='demo-0')assert.ok((await page.locator('[data-negotiation-unit="9"]').innerText()).includes('Reservado'));
      if(id==='demo-2'){
        await page.locator('[data-negotiation-unit="24"]>summary').click();await page.locator('[data-workflow="unit-movement"][data-number="24"]').click();
        const form=page.locator('[data-workflow-form="negotiation"]');
        assert.equal(await form.locator('[name="interest"]').count(),0);
        await form.locator('[name="type"]').selectOption('Aceitação');
        assert.ok((await form.innerText()).includes('Aceite'));assert.equal(await form.locator('[name="interest"]').count(),0);
        await form.locator('[name="type"]').selectOption('Acompanhamento da fração');
        assert.equal(await form.locator('[name="interest"] option').count(),7);
        assert.equal(await form.locator('[name="interest"]').inputValue(),'');
        await page.locator('[data-workflow="cancel-negotiation"]').click();await page.locator('[data-dialog-confirm]').click();
      }
      await page.locator('[data-profile-close]').click();
    }
    await page.locator('#clientStageFilter').selectOption('Reservado');
    assert.equal(await page.locator('[data-client="demo-0"]').count(),1);
    assert.equal(await page.locator('[data-client="demo-1"]').count(),0);
    await page.locator('#clientStageFilter').selectOption('all');await page.locator('[data-client="demo-0"]').click();
    await page.reload();await page.locator('.client-detail-header').waitFor();
    assert.equal(await page.locator('.client-detail-header .badge').innerText(),'Reservado');
    assert.equal(await page.evaluate(()=>localStorage.getItem('theView.crmCommercial.v2')),before);
    const meta=await(await context.request.get(origin+'/api/test-meta')).json();assert.equal(meta.writes,0);
    await context.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(commercialPosts,[]);
  // External icon/font requests may be blocked, but no Google/production endpoint may be attempted.
  assert.ok(external.every(url=>!url.includes('script.google')&&!url.includes('dashboard-imobiliario.vercel')));
  console.log('Desktop/mobile passed: list/profile/fractions/negotiation share projected stages; deterministic movement form, cancel, filters, reload, identical CRM cache and zero commercial writes.');
}finally{await browser.close()}
