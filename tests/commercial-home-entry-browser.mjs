import assert from 'node:assert/strict';import {closeProfile,contactSettings,reveal} from './helpers/current-client-ui.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN||'http://127.0.0.1:5199';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const errors=[],results=[];
try{
  for(const [mode,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]])for(const entry of ['/','/index','/index.html']){
    const context=await browser.newContext({viewport});
    try{
      context.setDefaultTimeout(12000);await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
      const direct=await context.request.get(origin+entry+'?entry=fictitious',{maxRedirects:0});assert.equal(direct.status(),307);assert.equal(direct.headers().location,'/commercial.html?entry=fictitious');
      assert.equal((await context.request.get(origin+'/api/commercial-data')).status(),401);
      const p=await context.newPage(),modules=new Set();let writes=0,documents=0;
      p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST'&&r.url()===origin+'/api/commercial-data')writes++;if(r.isNavigationRequest())documents++});
      p.on('response',r=>{const name=new URL(r.url()).pathname;if(['/commercial-client-preferences.js','/commercial-fraction-recommendations.js','/commercial-client-workflow.js','/commercial-client-workflow-ui.js','/commercial-opportunities.js','/commercial-opportunity-ui.js'].includes(name)){assert.equal(r.status(),200);modules.add(name)}});
      await p.goto(origin+entry+'?entry=fictitious');await p.locator('#password').waitFor();
      assert.equal(new URL(p.url()).pathname,'/access.html');assert.equal(new URL(p.url()).searchParams.get('next'),'/commercial.html?entry=fictitious');
      assert.equal(await p.locator('#clientDetail').count(),0);
      await p.locator('#password').fill('View-Phase2A-Teste');await p.getByRole('button',{name:'Entrar',exact:true}).click();
      await p.locator('[data-client="demo-0"]').waitFor();assert.equal(new URL(p.url()).pathname,'/commercial.html');assert.equal(new URL(p.url()).search,'?entry=fictitious');assert.equal(modules.size,6);
      const before=await p.evaluate(async()=>await(await fetch('/api/test-meta')).json());
      await p.locator('[data-client="demo-0"]').click();
      const tab=name=>p.getByRole('tab',{name,exact:true}).click();
      await tab('Dados');await contactSettings(p);assert.equal(await p.locator('[data-contact-settings]').isVisible(),true);
      await tab('Procura');await p.getByRole('button',{name:'Editar preferências',exact:true}).click();assert.equal(await p.locator('#clientPreferencesEditor').isVisible(),true);assert.ok(await p.locator('[data-preference-key="typology"]').count()>1);assert.equal(await p.locator('#clientModal').isVisible(),false);await p.locator('[data-preferences-cancel]').click();
      await tab('Procura');assert.equal(await p.locator('#clientFractionWorkspace').isVisible(),true);assert.equal(await p.locator('[data-fraction-filter="plus5"]').count(),1);
      await tab('Oportunidades');assert.equal(await p.locator('.opportunity-workspace').isVisible(),true);await p.locator('#clientFullHistory>summary').click();await p.locator('[data-ux-client-action="event"]').click();assert.equal(await p.locator('#eventClientId').inputValue(),'demo-0');await p.locator('#closeEventModal').click();
      await p.reload();await p.locator('[data-contact-settings]').waitFor({state:'attached'});assert.equal(new URL(p.url()).pathname,'/commercial.html');assert.equal(await p.getByRole('tab',{name:'Oportunidades',exact:true}).getAttribute('aria-selected'),'true');assert.equal(await p.locator('[data-client-module-error]').count(),0);
      await closeProfile(p);await p.getByRole('button',{name:'Dashboard',exact:true}).click();assert.equal(await p.locator('#tab-dashboard').isVisible(),true);
      await p.getByRole('button',{name:'Definição de Preços',exact:true}).click();assert.equal(await p.locator('#tab-prices').isVisible(),true);
      await p.getByRole('button',{name:'Clientes',exact:true}).click();assert.equal(await p.locator('#tab-sales').isVisible(),true);
      for(const authenticatedEntry of ['/','/index','/index.html']){await p.goto(origin+authenticatedEntry);await p.locator('[data-contact-settings]').waitFor({state:'attached'});assert.equal(new URL(p.url()).pathname,'/commercial.html');assert.equal(await p.locator('#password').count(),0)}
      await p.getByRole('link',{name:'Ir para Comparador',exact:true}).click();await p.waitForURL('**/comparador.html');assert.equal((await p.locator('script[src="app.js"]').count()),1);await p.reload();assert.equal(new URL(p.url()).pathname,'/comparador.html');
      await p.goto(origin+'/commercial.html');await p.locator('[data-contact-settings]').waitFor({state:'attached'});
      const after=await p.evaluate(async()=>await(await fetch('/api/test-meta')).json());assert.equal(after.writes,before.writes);assert.equal(after.revision,before.revision);assert.equal(writes,0);assert.ok(documents<25,'Possible redirect loop');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
      await context.clearCookies();await p.reload();await p.locator('#password').waitFor();assert.equal(new URL(p.url()).searchParams.get('next'),'/commercial.html');
      results.push({mode,entry,redirect:307,loginReturn:'/commercial.html',modules:6,newTabs:3,refresh:true,authenticatedAliases:true,comparator:true,otherModules:true,commercialWrites:0,revisionUnchanged:true});
    }finally{await context.close()}
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({results,javascriptErrors:errors,productionAccess:false}));
}finally{await browser.close()}
