import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{script}=require('./helpers/persistence-p1-current.cjs');
const {fixture,clone,hash}=require('./helpers/persistence-p1-model.cjs');
const here=path.dirname(fileURLToPath(import.meta.url));
const engines=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const port=Number(process.env.P1_TEST_PORT||53452);
assert.ok(Number.isInteger(port)&&port>=53000&&port<=53999,'Dedicated loopback port required');
const output=path.resolve(process.env.P1_ARTIFACTS||path.join(os.tmpdir(),'the-view-p1-contracts'));
fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'){res.writeHead(405);res.end();return;}
  if(req.url==='/lab.js'||req.url==='/current.js'){
    res.setHeader('Content-Type','text/javascript');res.end(req.url==='/lab.js'?fs.readFileSync(path.join(here,'helpers/persistence-p1-lab.js')):script);return;
  }
  if(req.url!=='/'){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta charset="utf-8"><title>Synthetic P1 contract laboratory</title><script src="/lab.js"></script><script src="/current.js"></script>');
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
const origin='http://127.0.0.1:'+port,reports=[];
function representative(target){
  const data=fixture(65);data.events=Array.from({length:106},(_,i)=>({id:'fiction-event-'+i,clientId:'fiction-client-'+(i%65),notes:'Synthetic historical record '+i}));
  data.statuses=Object.fromEntries(Array.from({length:39},(_,i)=>[String(i+1),i===7||i===23?'Reservado':'Dispon\u00edvel']));
  data.finalPrices=Object.fromEntries(Array.from({length:39},(_,i)=>[String(i+1),400000+i*1000]));
  let seed=137,chars='';const remaining=Math.max(0,target-JSON.stringify(data).length);
  for(let i=0;i<remaining;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;chars+=String.fromCharCode(65+seed%26);}
  data.unknownRoot.syntheticPadding=chars;return data;
}
const summary=samples=>Object.fromEntries(['serializationMs','hashingMs','compressionMs','transactionMs','verificationMs'].map(key=>{
  const values=samples.map(x=>x[key]).filter(x=>x!==null).sort((a,b)=>a-b);
  return [key,values.length?{median:values[Math.floor(values.length/2)],p95:values[Math.ceil(values.length*.95)-1],mean:values.reduce((a,b)=>a+b,0)/values.length}:null];
}));
try{
  for(const name of (process.env.P1_BROWSER_ENGINES||'chromium,firefox,webkit').split(',')){
    assert.ok(['chromium','firefox','webkit'].includes(name));
    const report={engine:name,checks:[],benchmarks:[],errors:[],externalRequests:0,commercialWrites:0};
    const profile=fs.mkdtempSync(path.join(os.tmpdir(),'tv-p1-'+name+'-'));
    const options={headless:true,...(name==='chromium'&&process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})};let context;
    async function launch(){
      context=await engines[name].launchPersistentContext(profile,options);
      await context.route('**/*',route=>{if(new URL(route.request().url()).origin===origin)return route.continue();report.externalRequests++;return route.abort();});
      const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(origin);await page.evaluate(()=>P1Lab.open());return page;
    }
    try{
      let a=await launch();const b=await context.newPage();b.on('pageerror',e=>report.errors.push(e.message));await b.goto(origin);await b.evaluate(()=>P1Lab.open());
      const base=fixture();await a.evaluate(({base,rev})=>p1Current.init(base,rev),{base,rev:hash(base)});await b.evaluate(({base,rev})=>p1Current.init(base,rev),{base,rev:hash(base)});
      await b.evaluate(()=>{p1Current.edit(1,'Fictional B');p1Current.save();});await a.evaluate(()=>{p1Current.edit(0,'Fictional A');p1Current.save();});assert.notEqual(await a.evaluate(()=>p1Current.cache().clients[1].notes),'Fictional B');
      await a.reload();assert.notEqual(await a.evaluate(()=>p1Current.cache().clients[1].notes),'Fictional B');
      report.checks.push({id:'P1-CUR-01',status:'defect-reproduced-not-fixed'});
      await a.evaluate(({base,rev})=>p1Current.init(base,rev),{base,rev:hash(base)});const remote=clone(base);remote.clients[1].notes='Fictional confirmed B';await b.evaluate(({remote,rev})=>p1Current.replaceShared(remote,rev),{remote,rev:hash(remote)});await a.evaluate(()=>p1Current.edit(0,'Fictional local A'));
      const exp=await a.evaluate(()=>p1Current.export());assert.deepEqual(exp.base,remote);const mixed=await a.evaluate(({exp,remote})=>p1Current.merge(exp.base,exp.data,remote),{exp,remote});assert.equal(mixed.conflicts.length,0);assert.notEqual(mixed.data.clients[1].notes,'Fictional confirmed B');report.checks.push({id:'P1-CUR-02',status:'defect-reproduced-not-fixed'});
      await a.evaluate(()=>P1Lab.open());await a.evaluate(base=>P1Lab.seed(base),base);const da=clone(base),db=clone(base);da.clients[0].notes='Fictional A';db.clients[1].notes='Fictional B';
      const pa=await a.evaluate(({base,data})=>P1Lab.prepare('fiction-p1-a',base,data,0),{base,data:da}),pb=await b.evaluate(({base,data})=>P1Lab.prepare('fiction-p1-b',base,data,0),{base,data:db});
      const attempts=await Promise.all([a.evaluate(p=>P1Lab.propose(p),pa),b.evaluate(p=>P1Lab.propose(p),pb)]);assert.equal(attempts.filter(x=>x.branch).length,1);
      const ea=await a.evaluate(()=>P1Lab.exportOp('fiction-p1-a')),eb=await b.evaluate(()=>P1Lab.exportOp('fiction-p1-b'));assert.equal(ea.kind,'recoverable');assert.equal(eb.kind,'recoverable');assert.deepEqual(ea.base,base);assert.deepEqual(eb.base,base);assert.deepEqual(ea.data,da);assert.deepEqual(eb.data,db);
      const before=JSON.stringify(await a.evaluate(()=>P1Lab.snapshot()));for(const error of ['AbortError','QuotaExceededError']){
        assert.equal(await a.evaluate(async name=>{try{await P1Lab.abort(name);}catch(e){return e.name;}},error),error);assert.equal(JSON.stringify(await a.evaluate(()=>P1Lab.snapshot())),before);
      }
      assert.equal((await a.evaluate(()=>P1Lab.exportOp('missing'))).kind,'forensic');
      assert.deepEqual(await a.evaluate(p=>P1Lab.propose(p),pa),{replay:true});
      const changed=await a.evaluate(({base})=>P1Lab.prepare('fiction-p1-a',base,base,0),{base});assert.equal(await a.evaluate(async p=>{try{await P1Lab.propose(p);}catch(e){return e.message;}},changed),'IMMUTABLE_REQUEST_ID');
      report.checks.push({id:'P1-IDB-01',status:'reference-model-demonstrated',proposals:2,branches:1,exportsCoherent:true,originalRequestPreserved:true});
      report.checks.push({id:'P1-IDB-02',status:'reference-model-demonstrated',abortAtomic:true,quotaFailure:'injected-not-native'});
      const dc=clone(base),dd=clone(base);dc.clients[0].notes='Incompatible synthetic C';dd.clients[0].notes='Incompatible synthetic D';
      const pc=await a.evaluate(({base,data})=>P1Lab.prepare('fiction-p1-c',base,data,1),{base,data:dc}),pd=await b.evaluate(({base,data})=>P1Lab.prepare('fiction-p1-d',base,data,1),{base,data:dd});
      const incompatible=await Promise.all([a.evaluate(p=>P1Lab.propose(p),pc),b.evaluate(p=>P1Lab.propose(p),pd)]);assert.equal(incompatible.filter(x=>x.branch).length,1);assert.deepEqual((await a.evaluate(()=>P1Lab.exportOp('fiction-p1-c'))).data,dc);assert.deepEqual((await b.evaluate(()=>P1Lab.exportOp('fiction-p1-d'))).data,dd);
      report.checks.push({id:'P1-IDB-03',status:'reference-model-demonstrated',incompatibleProposalsPreserved:true});
      const legacy='Opaque fictitious legacy bytes\u0000\u00e1\ud800';await a.evaluate(raw=>P1Lab.addLegacy('unknown-one',raw),legacy);await a.evaluate(()=>P1Lab.migrate('unknown-one'));await a.evaluate(()=>P1Lab.addLegacy('unknown-two','Other fictitious bytes'));
      const migrationBefore=JSON.stringify(await a.evaluate(()=>P1Lab.snapshot()));assert.equal(await a.evaluate(async()=>{try{await P1Lab.abort('QuotaExceededError');}catch(e){return e.name;}}),'QuotaExceededError');assert.equal(JSON.stringify(await a.evaluate(()=>P1Lab.snapshot())),migrationBefore);
      const head=JSON.stringify((await a.evaluate(()=>P1Lab.snapshot())).workspace);
      await b.evaluate(({base,rev})=>p1Current.init(base,rev),{base,rev:hash(base)});await b.evaluate(()=>{p1Current.edit(0,'Old writer still runs');p1Current.save();});assert.equal(JSON.stringify((await a.evaluate(()=>P1Lab.snapshot())).workspace),head);
      report.checks.push({id:'P1-MIX-02',status:'reference-model-demonstrated',newHeadIsolated:true,oldCacheStillMutable:true,realApiOrSourceFenceImplemented:false});
      await context.close();a=await launch();const restored=await a.evaluate(()=>P1Lab.snapshot());assert.equal(restored.operations.length,4);assert.equal(restored.branches.length,2);assert.equal(restored.legacy.find(x=>x.id==='unknown-one').bytes,legacy);assert.ok(restored.migration.find(x=>x.id==='unknown-one'));assert.ok(!restored.migration.find(x=>x.id==='unknown-two'));await a.evaluate(()=>P1Lab.migrate('unknown-two'));
      report.checks.push({id:'P1-MIG-03',status:'reference-model-demonstrated',gracefulRestart:true,powerLossTested:false,unknownOriginalPreserved:true});
      assert.equal((await a.evaluate(()=>P1Lab.exportOp('fiction-p1-a'))).kind,'recoverable');
      for(const size of [180000,450000,850000]){
        const data=representative(size);await a.evaluate(data=>P1Lab.measure(data,2),data);
        const samples=await a.evaluate(data=>P1Lab.measure(data,8),data);assert.ok(samples.every(x=>x.durability==='strict'));
        report.benchmarks.push({syntheticClients:65,syntheticEvents:106,requestedCharacters:size,samples,summary:summary(samples),scope:'Local reference model, full synthetic snapshot puts; not application or Google latency'});
      }
      report.version=context.browser()?.version()||name;report.storageEstimateAvailable=await a.evaluate(()=>Boolean(navigator.storage?.estimate));assert.deepEqual(report.errors,[]);assert.equal(report.externalRequests,0);report.status='passed';
    }catch(e){report.status='failed';report.error=String(e.stack||e);}finally{
      if(context)await context.close();reports.push(report);fs.writeFileSync(path.join(output,'p1-browser-results.json'),JSON.stringify({referenceModelOnly:true,realGoogle:false,nativeQuotaTested:false,safariApplicationTested:false,reports},null,2));console.log(JSON.stringify({engine:name,status:report.status,checks:report.checks,error:report.error}));
    }
  }
}finally{await new Promise(resolve=>server.close(resolve));}
if(reports.some(x=>x.status!=='passed'))process.exitCode=1;
