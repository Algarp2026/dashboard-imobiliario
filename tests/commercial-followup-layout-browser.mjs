import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const css=(await Promise.all(['style.css','commercial.css','view-theme.css'].map(file=>fs.readFile(new URL('../'+file,import.meta.url),'utf8')))).join('\n');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
await fs.mkdir('docs/pr14-validation',{recursive:true});
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:900}});await context.route('**/*',route=>route.abort());const page=await context.newPage();
  await page.setContent('<!doctype html><html><head><style>'+css+'</style></head><body><main><section class="ux-next-action" id="general"><div><i aria-hidden="true"></i><span>Proxima acao definida</span><strong>Texto geral ficticio</strong></div></section><div class="op-client-data"><section class="ux-next-action"><div><i aria-hidden="true"></i><span>Acompanhamento do cliente</span><strong>Telefonar ao cliente ficticio para confirmar interesse na apresentacao</strong></div><button type="button">Concluir acao</button></section></div></main></body></html>');
  const geometry=await page.locator('.op-client-data .ux-next-action>div').evaluate(e=>{const label=e.querySelector('span').getBoundingClientRect(),text=e.querySelector('strong').getBoundingClientRect(),box=e.getBoundingClientRect();return{separateRows:text.top>=label.bottom,inside:text.right<=box.right+1&&text.left>=box.left-1}});
  assert.deepEqual(geometry,{separateRows:true,inside:true});assert.equal(await page.locator('#general strong').evaluate(e=>getComputedStyle(e).gridColumnStart),'2');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.screenshot({path:'docs/pr14-validation/followup-'+width+'.png'});await context.close();
 }
 console.log('Follow-up layout PASS: real CSS at 1440/390/320px, separate label/action rows, no overflow, general action grid preserved; fictitious content, no network.');
}finally{await browser.close()}
