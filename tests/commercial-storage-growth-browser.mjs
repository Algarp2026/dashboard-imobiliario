import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.COMMERCIAL_TEST_ORIGIN;
if(!origin||new URL(origin).hostname!=='127.0.0.1'||!/^53\d{3}$/.test(new URL(origin).port))throw Error('Isolated source only');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const context=await browser.newContext();await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
try{
 const page=await context.newPage();await page.goto(origin+'/commercial.html');await page.locator('#password').fill('View-Phase2A-Teste');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.waitForFunction(()=>window.__storageGrowthTest?.sharedSync.phase==='synced');
 const report=await page.evaluate(async()=>{
  const api=window.__storageGrowthTest,archive=window.__recoveryArchiveTest,base=JSON.parse(JSON.stringify(api.state.data)),started=performance.now();
  await archive.localVaultTransaction('readwrite',(store,done)=>{store.clear();done(true)});
  const unchangedBefore=(await api.localVaultCopies()).length;
  for(let i=0;i<400;i++)await api.backupLocalBeforeRemoteLoad(base,base);
  const unchangedAfter=(await api.localVaultCopies()).length;
  let completed=0,error='',peakCount=0,peakBytes=0,peakPhysicalBytes=0;
  const physicalBytes=records=>records.reduce((n,r)=>{const {raw,signature='',rawChecksum='',...metadata}=r;return n+2*(raw.length+signature.length+rawChecksum.length+JSON.stringify(metadata).length)},0);
  for(let i=0;i<400;i++){
   const data=JSON.parse(JSON.stringify(base));data.clients[0].notes='Fictitious revision '+i;data.syntheticPadding='x'.repeat(10000);
   const revision=await api.dataRevision(data);api.rememberConfirmedRecoveryBase(data,revision);
   const value={recoveryFormat:1,data,base:data,pendingWrite:null,pendingSync:false,syncMeta:{revision,lastConfirmedAt:'2026-11-03T10:00:00Z'}};
   try{await api.archiveRecoveryCopy('confirmed',value,{confirmed:true});completed++}catch(e){error=e.code;break}
   const copies=await api.localVaultCopies(),bytes=copies.reduce((n,r)=>n+2*(r.raw.length+(r.signature||'').length+(r.rawChecksum||'').length),0);peakCount=Math.max(peakCount,copies.length);peakBytes=Math.max(peakBytes,bytes);
   peakPhysicalBytes=Math.max(peakPhysicalBytes,physicalBytes(await api.raw()));
   // Model a reopened session: the durable archive remains, volatile proof cache does not.
   if(i%5===4)api.sharedSync.confirmedRecoveryBases=new Map();
  }
  await api.maintain();const diagnostics=await api.stats();return{simulation:'400 unchanged reads + 400 distinct confirmed revisions; volatile confirmation cache reset every 5 revisions; final idle maintenance',unchangedBefore,unchangedAfter,completed,error,peakCount,peakBytes,peakPhysicalBytes,finalPhysicalBytes:physicalBytes(await api.raw()),diagnostics,elapsedMs:Math.round(performance.now()-started),realGoogle:false};
 });
 assert.equal(report.unchangedBefore,report.unchangedAfter);await fs.writeFile('storage-growth-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await context.close();await browser.close()}
