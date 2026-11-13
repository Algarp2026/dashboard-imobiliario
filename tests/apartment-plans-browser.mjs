import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),records=require('./fixtures/apartment-plan-assets.json');
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin=process.env.COMMERCIAL_TEST_ORIGIN,out=process.env.PLANS_ARTIFACTS;
assert.match(origin||'',/^http:\/\/127\.0\.0\.1:53\d{3}$/);
assert.ok(out);fs.mkdirSync(out,{recursive:true});
const code=file=>fs.readFileSync(path.join(repo,file),'utf8');
const commercial=code('commercial.js'),comparator=code('app.js');
const planMap=text=>JSON.parse(text.match(/^\s*const PLANT_MAP\s*=([^\n]+);/m)[1]);
const maps=[planMap(commercial),planMap(comparator)];
const fractions=Array.from({length:39},(_,i)=>({number:i+1,name:'Apartamento '+(i+1),typology:'T2',floorLabel:'3',orientation:'Sul',abp:100,terrace:20,totalArea:120,price:500000}));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function documentFor(file,numbers){
  let html='';
  const text=file==='commercial'?commercial:comparator;
  const name=file==='commercial'?'generateClientPresentationPdf':'exportClientPdf';
  const end=file==='commercial'?'function fractionPriceSummary(':'  function exportCommercialExcel(';
  const context={window:{open:()=>({document:{open(){},write:value=>html=value,close(){}}})},
    PLANT_MAP:maps[file==='commercial'?0:1],esc,selectedFractions:()=>numbers.map(n=>fractions[n-1]),
    finalPrice:f=>f.price,money:n=>n+' €',area:n=>n+' m²',argumentText:()=>'',alert(){throw Error('Unexpected alert')},
    notifyUser(){throw Error('Unexpected notification')},commercialUxToast(){},
    pdfCard:(label,value)=>'<div class="pdf-card"><span>'+label+'</span><strong>'+value+'</strong></div>'};
  vm.createContext(context);
  vm.runInContext(text.slice(text.indexOf('function '+name+'('),text.indexOf(end))+'\nglobalThis.generate='+name,context);
  if(file==='commercial')context.generate(numbers.map(n=>fractions[n-1]),true,{},'pt-en',false);
  else context.generate();
  return html;
}
// Every mapping is exercised through both real renderers, without using commercial data.
for(let n=1;n<=39;n++)for(const file of ['commercial','comparator']){
  const html=documentFor(file,[n]);
  assert.ok(html.includes('src="'+maps[file==='commercial'?0:1][n].image+'"'));
  assert.ok(!html.includes('.jpg'));
}
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const errors=[],results=[];
try{
 for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width,height}});
  try{
   await context.addInitScript(()=>{window.print=()=>{}});
   let writes=0;const seen=new Set();
   await context.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin!==origin)return route.abort();
    if(url.pathname==='/api/commercial-data'&&request.method()!=='GET'){writes++;return route.abort()}
    return route.continue();
   });
   await context.route(origin+'/isolated-plans-test',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
   const auth=await context.request.post(origin+'/api/access',{headers:{Origin:origin},data:{password:'View-Phase2A-Teste'}});
   assert.equal(auth.status(),200);
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   const read=async()=>{const r=await context.request.get(origin+'/api/commercial-data');assert.equal(r.status(),200);return r.json()};
   const before=await read();
   await page.goto(origin+'/commercial.html');
   await page.locator('[data-open-profile="demo-0"]').click();
   for(const tab of ['Dados','Procura','Oportunidades']){
    await page.getByRole('tab',{name:tab,exact:true}).click();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   }
   await page.screenshot({path:path.join(out,name+'-commercial.png')});
   await page.goto(origin+'/comparador.html');await page.locator('#openCompareMode').click();
   assert.equal(await page.locator('[data-open-fraction]').count(),39);
   for(let n=1;n<=39;n++){
    await page.locator('[data-open-fraction="'+n+'"]').click();
    await page.locator('#fractionModal:not(.hidden)').waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    const close=page.locator('#fractionModal [data-close-modal],#closeFractionModal');
    if(n===39)await page.screenshot({path:path.join(out,name+'-detail.png')});
    await close.first().click();
   }
   await page.goto(origin+'/isolated-plans-test');
   await page.evaluate(()=>{window.print=()=>{}});
   // Decode the files as actually served, one at a time to avoid retaining 39 large bitmaps.
   await page.setContent('<!doctype html><html><body><img id="asset" style="max-width:100%;height:auto" alt="Planta de teste"></body></html>');
   for(let n=1;n<=39;n++){
    const image=maps[0][n].image,record=records.find(record=>record.path===image);
    const response=await context.request.get(origin+'/'+image);assert.equal(response.status(),200);
    assert.equal(createHash('sha256').update(await response.body()).digest('hex'),record.sha256);
    const dimensions=await page.locator('#asset').evaluate(async(img,src)=>{img.src=src;await img.decode();return[img.naturalWidth,img.naturalHeight]},origin+'/'+image);
    assert.deepEqual(dimensions,[3000,2222]);seen.add(image);
   }
   assert.equal(seen.size,32);
   if(name==='desktop'){
    for(const [kind,numbers] of [['commercial',[2,10]],['commercial',[36,39]],['comparator',[21]]]){
     const html=documentFor(kind,numbers);
     await page.goto(origin+'/isolated-plans-test');
     await page.setContent(html,{waitUntil:'load'});
     await page.waitForFunction(()=>[...document.images].every(img=>img.complete&&img.naturalWidth===3000));
     await page.emulateMedia({media:'print'});
     for(const img of await page.locator('img').all()){
      const style=await img.evaluate(n=>getComputedStyle(n).objectFit);
      assert.equal(style,'contain');
     }
     const basename=kind+'-'+numbers.join('-');
     await page.pdf({path:path.join(out,basename+'.pdf'),preferCSSPageSize:true,printBackground:true});
     await page.screenshot({path:path.join(out,basename+'.png'),fullPage:true});
    }
   }
   assert.equal(writes,0);const after=await read();assert.equal(after.revision,before.revision);assert.deepEqual(after.data,before.data);
   results.push({viewport:name,mappingsDecoded:39,distinctFiles:32,detailsOpened:39,commercialWrites:0});
  }finally{await context.close()}
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,errors,renderedMappings:78,realGoogle:false},null,2));
 console.log(JSON.stringify({results,errors,realGoogle:false}));
}finally{await browser.close()}
