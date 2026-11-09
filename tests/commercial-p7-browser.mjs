import assert from 'node:assert/strict';
import fs from 'node:fs';
import {changeClientTab,closeProfile,openOpportunity} from './helpers/current-client-ui.mjs';

const origin=process.env.COMMERCIAL_TEST_ORIGIN;
assert.match(origin||'',/^http:\/\/127\.0\.0\.1:53\d{3}$/);
const out=process.env.REFORM_ARTIFACTS;
assert.ok(out);
const playwright=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const sizes=[['desktop',1440,900],['laptop',1366,768],['tablet',820,1080],['mobile',390,844]];
const engines=(process.env.P7_ENGINES||'chromium,firefox,webkit').split(',');
const results=[];

for(const engine of engines){
  const executablePath=engine==='chromium'?process.env.CHROME_EXECUTABLE:undefined;
  const browser=await playwright[engine].launch({headless:true,executablePath});
  try{
    for(const [name,width,height] of sizes){
      const context=await browser.newContext({viewport:{width,height}});
      try{
        let posts=0;
        const errors=[];
        await context.route('**/*',route=>{
          const url=new URL(route.request().url());
          if(url.origin!==origin)return route.abort();
          if(url.pathname==='/api/commercial-data'&&route.request().method()==='POST')posts++;
          return route.continue();
        });
        const page=await context.newPage();
        page.on('pageerror',error=>errors.push(error.message));
        const access=await page.request.post(origin+'/api/access',{headers:{Origin:origin},data:{password:'View-Phase2A-Teste'}});
        assert.ok(access.ok());
        const reset=await page.request.post(origin+'/api/test-control',{headers:{Origin:origin},data:{reset:true}});
        assert.ok(reset.ok());
        await page.goto(origin+'/commercial.html');
        const opener=page.locator('[data-open-profile="demo-0"]');
        await opener.click();
        const form=page.locator('[data-client-followup]'),status=form.locator('[data-followup-status]');
        const snapshot=async()=>{
          const response=await page.request.get(origin+'/api/commercial-data');
          assert.ok(response.ok());
          return response.json();
        };
        const before=await snapshot(),beforeClient=before.data.clients[0];
        assert.equal(beforeClient.followupV1,undefined);
        const date=await form.locator('[name="lastInteraction"]').inputValue();
        assert.notEqual(date,'','The legacy fixture has effective presentation dates');
        const observation=form.locator('[name="observation"]');
        const save=()=>form.getByRole('button',{name:'Guardar seguimento',exact:true}).click();
        const sync=async()=>{
          await page.waitForFunction(()=>document.getElementById('commercialSyncBadge')?.dataset.phase==='synced');
          await page.waitForFunction(()=>!document.querySelector('[data-client-followup] fieldset')?.disabled);
        };
        await observation.fill('Texto temporário fictício');
        await observation.fill('');
        await save();
        await sync();
        assert.equal(posts,0,'A reverted draft must not POST or initialize followupV1');
        assert.equal((await snapshot()).revision,before.revision);
        assert.match(await status.innerText(),/Sem alterações/);

        const priority=form.locator('[name="priority"]');
        await priority.setChecked(!await priority.isChecked());
        await save();await sync();
        const prioritized=(await snapshot()).data;
        assert.equal(prioritized.clients[0].followupV1,undefined,'Priority is a separate decision');
        assert.notDeepEqual(prioritized.clients[0].priorityHistory,beforeClient.priorityHistory);
        assert.deepEqual(prioritized.events,before.data.events);

        await observation.fill('Observação P7 inteiramente fictícia');
        await save();await sync();
        const observed=(await snapshot()).data;
        assert.equal(observed.clients[0].followupV1.observation,'Observação P7 inteiramente fictícia');
        assert.equal(observed.clients[0].followupV1.lastInteraction,'','A derived date is not a manual decision');
        assert.equal(await form.locator('[name="lastInteraction"]').inputValue(),date);
        assert.equal(observed.clients[0].followupV1.history.length,1);
        for(const key of Object.keys(before.data).filter(key=>key!=='clients')){
          assert.deepEqual(observed[key],before.data[key],key);
        }
        assert.deepEqual(observed.clients.slice(1),before.data.clients.slice(1));
        assert.equal(posts,2);
        await page.reload();await form.waitFor();
        assert.equal(await observation.inputValue(),'Observação P7 inteiramente fictícia');
        assert.equal(await form.locator('[name="lastInteraction"]').inputValue(),date);

        const dataTab=page.getByRole('tab',{name:'Dados',exact:true});
        await dataTab.focus();await page.keyboard.press('ArrowRight');
        assert.equal(await page.getByRole('tab',{name:'Procura',exact:true}).getAttribute('aria-selected'),'true');
        await page.keyboard.press('End');
        const card=page.locator('[data-opportunity-unit="9"]');
        await openOpportunity(page,card);
        await page.keyboard.press('Escape');
        await card.locator('dialog').waitFor({state:'hidden'});
        assert.ok(await card.locator('[data-opportunity-open]').evaluate(button=>document.activeElement===button));
        await closeProfile(page);
        const portfolio=page.locator('[data-client="demo-2"]');
        assert.equal(await portfolio.locator('.client-portfolio-state .badge').innerText(),'Reservado');
        await portfolio.locator('[data-open-profile]').click();
        await changeClientTab(page,'Oportunidades');
        for(const [fraction,state] of [[9,'Reservada'],[24,'Não concretizada'],[30,'Em negociação']]){
          const button=page.locator(`[data-opportunity-open="${fraction}"]`);
          assert.equal(await button.locator(':scope > strong').innerText(),state);
        }
        const closed=page.locator('[data-opportunity-unit="24"]');
        await openOpportunity(page,closed);
        assert.match(await closed.locator('.opportunity-origin').innerText(),/2026-10-12.*p7-close-24/);
        await closeProfile(page);
        assert.equal(await portfolio.locator('.client-portfolio-state .badge').innerText(),'Reservado');
        await page.locator('#commercialSidebar [data-tab="dashboard"]').click();
        await page.getByText('Vendas, receitas e indicadores financeiros',{exact:true}).click();
        const expectedPresentations=8; // Six fixture presentations plus two effective presentations of Apt. 7.
        assert.match(await page.locator('#commercialActivitySummary').innerText(),new RegExp('^'+expectedPresentations+' apresentações'),
          'The original and the new presentation count, but the historical correction does not');
        assert.deepEqual((await snapshot()).data,observed);
        assert.equal(posts,2,'Navigation and reopening are read-only');
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        assert.deepEqual(errors,[]);
        results.push({engine,viewport:name,width,height,status:'passed'});
        console.log(`P7 ${engine} ${name} PASS`);
      }finally{await context.close()}
    }
  }finally{await browser.close()}
}
fs.writeFileSync(out+'/p7-engines.json',JSON.stringify(results,null,2));
