import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN||'http://127.0.0.1:5210',out='docs/composition-d2-platform/routing-limit.json';
fs.mkdirSync('docs/composition-d2-platform',{recursive:true});
let previous=execFileSync('git',['show','125cba5:commercial.js'],{encoding:'utf8',maxBuffer:4000000});
const begin=previous.indexOf('const MAJUCA_IMPORT_RECORDS=['),end=previous.indexOf('\n];',begin);assert.ok(begin>=0&&end>=0);previous=previous.slice(0,begin)+'const MAJUCA_IMPORT_RECORDS=[];'+previous.slice(end+3);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE}),results=[];
try{
  for(const mode of ['before','after']){
    const context=await browser.newContext();context.setDefaultTimeout(12000);await context.route('**/*',route=>{const req=route.request(),url=new URL(req.url());if(url.origin!==origin)return route.abort();if(req.method()!=='GET'&&!url.pathname.endsWith('/api/access'))throw Error('Unexpected write');if(mode==='before'&&url.pathname==='/view-workspace.js')return route.fulfill({contentType:'text/javascript',body:''});if(mode==='before'&&url.pathname==='/commercial.js')return route.fulfill({contentType:'text/javascript',body:previous});return route.continue()});
    const page=await context.newPage();await page.goto(origin+'/commercial.html');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.locator('[data-client="demo-0"]').waitFor({state:'attached'});
    const initial=await page.evaluate(()=>localStorage.getItem('theView.crmCommercial.v2'));
    await page.locator('#commercialSidebar [data-tab="history"][data-view="history"]').click();await page.locator('[data-history-fraction="9"]').click();await page.locator('[data-edit-history-event="visual-present-9"]').click();
    const editorVisible=await page.locator('[data-workflow-form="presentation"]').isVisible();
    assert.equal(await page.evaluate(()=>localStorage.getItem('theView.crmCommercial.v2')),initial);
    results.push({mode,editorVisible,cacheUnchanged:true});await context.close();
  }
  assert.ok(!results[0].editorVisible||results[1].editorVisible,'D2 introduced a routing regression');
  const limitation=results.every(x=>!x.editorVisible)?'Existing in 125cba5 and unchanged: managed presentation opened from fraction history has no visible editor. Functional routing correction requires separate approval.':null;
  fs.writeFileSync(out,JSON.stringify({source:'fictitious in-memory only',results,limitation},null,2)+'\n');console.log(JSON.stringify({results,limitation}));
}finally{await browser.close()}
