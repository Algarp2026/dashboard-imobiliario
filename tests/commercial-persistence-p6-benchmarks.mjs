import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {memoryBackend} from '../experimental/persistence-p5/backend.mjs';
const require=createRequire(import.meta.url),{setup}=require('./helpers/persistence-p6-lab.cjs'),fixture=require('./helpers/persistence-p2-fixture.cjs'),out=process.env.P6_BENCHMARK_OUTPUT||path.join(os.tmpdir(),'the-view-p6-benchmarks.json'),results=[];
function counted(domain){const b=memoryBackend(),counts={reads:0,writes:0};return {...b,failureDomain:domain,counts,load:async()=>{counts.reads++;return b.load();},compareExchange:async(g,s)=>{counts.writes++;return b.compareExchange(g,s);}};}
for(const scenario of ['small','representative-65','history-100','extended-events-prices','protected-14.84-MiB','partial-mirrors','corrupt-independent']){
 const primary=counted('bench:primary'),secondary=counted('bench:independent'),l=await setup({primary,secondary});
 if(['representative-65','extended-events-prices'].includes(scenario)){
  const s=await l.primary.load(),{createSource}=await import('../experimental/persistence-p5/source.mjs');let d=fixture.base();for(let i=0;i<63;i++)d.clients.push({id:'fiction-extra-'+i,name:'Synthetic '+i,notes:'Synthetic context '.repeat(25)});for(let i=0;i<104;i++)d.events.push({id:'fiction-extra-event-'+i,clientId:d.clients[i%65].id,type:'Outro',fractions:[],notes:'Synthetic event '.repeat(15)});
  if(scenario==='extended-events-prices')for(let u=1;u<=39;u++){d.finalPrices[u]=250000+u;d.priceHistory[u]=Array.from({length:80},(_,i)=>({date:'2026-01-01',price:250000+u+i,oldPrice:250000+u+i-1,reason:'Synthetic history'}));}
  // A fresh synthetic source, not a mutation/import of an operational source.
  const b=memoryBackend();primary.load=async()=>{primary.counts.reads++;return b.load();};primary.compareExchange=async(g,x)=>{primary.counts.writes++;return b.compareExchange(g,x);};
  const fresh=await createSource({...l.options,backend:primary,data:d,authorize:l.sessions.resolve,validateTransition:(old,next)=>l.vmStore.context.validateCommercialTransition_(old,next)});l.source=fresh;
 }
 if(scenario==='history-100')for(let i=0;i<100;i++){const r=await l.request('history-'+i);await l.send(r);}
 await l.seed();
 if(scenario==='protected-14.84-MiB'){const s=await secondary.load(),g=s.generation,total=Math.floor(14.84*1024*1024/2);s.protectedHistory=Array.from({length:15},(_,i)=>({id:'fiction-protected-'+i,kind:i<8?'write-request':'legacy',pendingSync:true,protected:true,raw:'x'.repeat(Math.floor(total/15)+(i===14?total%15:0))}));s.generation++;await secondary.compareExchange(g,s);}
 const protectedBefore=(await secondary.load()).protectedHistory?await l.c.commercialHash((await secondary.load()).protectedHistory):null;
 if(scenario==='partial-mirrors')await l.mutate(s=>{s.Derived.tables.Clientes=s.Derived.tables.Clientes.slice(0,1);delete s.Derived.tables.Agentes;});
 primary.counts.reads=0;primary.counts.writes=0;const heapBefore=process.memoryUsage().heapUsed,t=performance.now(),diagnostic=await l.mirrors.diagnose(l.credential),verifyMs=performance.now()-t,verifyIO={...primary.counts};
 await l.mutate(s=>{s.Derived.tables.Clientes[0][0]='Synthetic incorrect header';});const one=await l.mirrors.plan(l.credential);primary.counts.reads=0;primary.counts.writes=0;const r=performance.now(),oneResult=await l.mirrors.execute(l.credential,one),repairOneMs=performance.now()-r,oneIO={...primary.counts};assert.equal(oneResult.status,'REPAIRED');
 await l.mutate(s=>{s.Derived.tables={};s.Derived.claims={};});const all=await l.mirrors.plan(l.credential);primary.counts.reads=0;primary.counts.writes=0;const a=performance.now(),allResult=await l.mirrors.execute(l.credential,all),repairAllMs=performance.now()-a,allIO={...primary.counts};assert.equal(allResult.status,'REPAIRED');
 secondary.counts.reads=0;secondary.counts.writes=0;const c=performance.now(),saved=await l.vault.create(l.credential,'bench-copy'),createCopyMs=performance.now()-c,copyIO={...secondary.counts};assert.equal(saved.status,'RECOVERABLE_COPY');
 if(scenario==='corrupt-independent'){const s=await secondary.load(),g=s.generation;s.bodies[s.copies['bench-copy'].bodyRef].bytes[0]^=1;s.generation++;await secondary.compareExchange(g,s);}
 const v=performance.now(),read=await l.vault.read(l.credential,'bench-copy'),copyVerifyMs=performance.now()-v;assert.equal(read.status,scenario==='corrupt-independent'?'FORENSIC':'RECOVERABLE_COPY');
 const stats=scenario==='corrupt-independent'?null:await l.vault.statistics(l.credential),parallelStart=performance.now(),parallel=await Promise.all([l.mirrors.diagnose(l.credential),l.mirrors.diagnose(l.credential)]),parallelVerifyMs=performance.now()-parallelStart;assert.ok(parallel.every(x=>x.status==='CONSISTENT'));
 const movingStart=performance.now(),moving=await l.mirrors.diagnose(l.credential,{onCaptured:async()=>{const current=await l.source.read(l.credential),data=structuredClone(current.data);data.clients[0].notes='Synthetic concurrent update';const r={action:'save',requestId:'fiction-benchmark-concurrent',baseRevision:current.revision,data},p=await l.source.preflight(l.credential,r,2);await l.source.write(l.credential,r,p.ticket,2);}}),concurrentCaptureMs=performance.now()-movingStart;assert.equal(moving.status,'SOURCE_CHANGED');
 const source=await primary.load();if(protectedBefore)assert.equal(await l.c.commercialHash((await secondary.load()).protectedHistory),protectedBefore);
 results.push({scenario,verifyMs,perSheetComparisonMs:diagnostic.sheets.map(x=>({name:x.name,durationMs:x.durationMs,status:x.status})),verifyIO,repairOneMs,firstRepairSheets:one.names,oneIO,repairAllMs,allRepairSheets:all.names,allIO,createCopyMs,copyIO,copyVerifyMs,copyStatus:read.status,stats,parallelVerifyMs,concurrentCaptureMs,concurrentCaptureStatus:moving.status,sourceSnapshotCharacters:JSON.stringify(source).length,heapUsedBefore:heapBefore,heapUsedAfter:process.memoryUsage().heapUsed,protectedHistoryUnchanged:!!protectedBefore,realGoogle:false});
}
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({version:1,scope:'synthetic VM and memory backends, not Google latency',results,notes:['Per-sheet comparison excludes common VM projection and source capture cost','IO counts are backend calls, not Google RPCs','Header/body byte measures are not native disk allocation','Independent backends are not separate physical devices','Protected legacy archive uses a 14.84 MiB UTF-16 logical measure and is never compacted or removed']},null,2));console.log(JSON.stringify(results.map(r=>({scenario:r.scenario,verifyMs:r.verifyMs,repairAllMs:r.repairAllMs,createCopyMs:r.createCopyMs,copyStatus:r.copyStatus}))));
