'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const makeStore=require('./helpers/apps-script-store.js'),ops=require('../commercial-opportunities.js'),{build}=require('../scripts/build-commercial-integrity.js');
const clone=x=>JSON.parse(JSON.stringify(x));
assert.equal(fs.readFileSync(require.resolve('../google_commercial_integrity.gs'),'utf8').replace(/\r\n/g,'\n'),build());
new vm.Script(build());
const base={clients:[{id:'fiction-a'},{id:'fiction-b'}],events:[{id:'fiction-reservation-8',clientId:'fiction-a',type:'Reserva efetuada',date:'2026-10-01',fractions:[8],amount:400000},{id:'fiction-reservation-24',clientId:'fiction-b',type:'Reserva efetuada',date:'2026-10-01',fractions:[24],amount:410000}],agents:[],statuses:{8:'Reservado',24:'Reservado',9:'Disponível'},salePrices:{8:400000,24:410000},statusEventIds:{8:'fiction-reservation-8',24:'fiction-reservation-24'},salePriceEventIds:{8:'fiction-reservation-8',24:'fiction-reservation-24'},saleCommissions:{},finalPrices:{9:500000},priceHistory:{9:[]},unavailableReasons:{},unknown:{padding:'x'.repeat(160000),keep:true}};
const snapshot=store=>JSON.stringify([...store.sheets].map(([name,sheet])=>[name,[...sheet.cells]]));
const operation=(store,data,id='fiction-operation')=>({requestId:id,baseRevision:store.revision,data});
let cases=0;
// Actual source gate: no Node API validator and no frontend can authorize these.
for(const field of ['statuses','salePrices','statusEventIds','salePriceEventIds','saleCommissions']){
  const store=makeStore(clone(base)),next=clone(base);next[field][8]=field==='statuses'?'Disponível':field==='salePrices'?1:field==='saleCommissions'?{eventId:'foreign',amount:1}:'foreign';
  const request=operation(store,next),before=snapshot(store);assert.equal(store.write(request).code,'COMMERCIAL_INTEGRITY');assert.equal(snapshot(store),before);cases++;
}
const store=makeStore(clone(base));let calls=0;
const original=store.context.THE_VIEW_COMMERCIAL_INTEGRITY.validate;
store.context.THE_VIEW_COMMERCIAL_INTEGRITY.validate=(previous,next)=>{
  calls++;
  const lastLock=store.trace.findLastIndex(row=>row.type==='lock'),lastUnlock=store.trace.findLastIndex(row=>row.type==='unlock');assert.ok(lastLock>lastUnlock,'Validation must execute inside the writer lock');
  assert.deepEqual(clone(previous),base,'Validate the actual authoritative CAS baseline');
  assert.equal(store.sheets.get('Store').cells.get('5:2')||'','','No intent before initial validation');
  return original(previous,next);
};
const selected=clone(base);selected.events.push(ops.build({id:'fiction-select',clientId:'fiction-a',action:'select',date:'2026-10-02',fractions:[9]},selected));selected.clients[0].presentationSelection=[9];
const request=operation(store,selected);assert.equal(store.write(request).persisted,true);assert.equal(calls,1);const committed=snapshot(store);
assert.equal(store.write(request).persisted,true);assert.equal(store.recover(request).persisted,true);assert.equal(calls,1,'Exact committed replays do not reinterpret history');assert.equal(snapshot(store),committed);cases++;
// An old revision cannot reach validation or create an intent, even with valid data.
const stale={...request,requestId:'fiction-stale',data:{...selected,unknown:{keep:true}}};assert.equal(store.write(stale).code,'CONFLICT');assert.equal(calls,1);assert.equal(snapshot(store),committed);cases++;
// The gate remains mandatory without the API capability request.
const missing=makeStore(clone(base)),kernel=missing.context.THE_VIEW_COMMERCIAL_INTEGRITY,next=clone(base);next.clients[0].notes='Fictitious edit';
missing.context.THE_VIEW_COMMERCIAL_INTEGRITY=null;
const notReady=operation(missing,next),beforeMissing=snapshot(missing);assert.equal(missing.read().capabilities.commercialIntegrity,0);assert.equal(missing.write(notReady).code,'COMMERCIAL_VALIDATION_UNAVAILABLE');assert.equal(snapshot(missing),beforeMissing);
missing.context.THE_VIEW_COMMERCIAL_INTEGRITY=kernel;assert.equal(missing.write(notReady).persisted,true);cases++;
// B5 resumes only the identical payload; no extra event or backup after commit.
const interrupted=makeStore(clone(base));const pending=operation(interrupted,selected,'fiction-resumable');interrupted.failWrite('pointer-before');assert.throws(()=>interrupted.write(pending));assert.deepEqual(interrupted.data,base);
const intent=interrupted.sheets.get('Store').cells.get('5:2');interrupted.failWrite('');assert.equal(interrupted.recover({...pending,data:next}).code,'CONFLICT');assert.equal(interrupted.sheets.get('Store').cells.get('5:2'),intent);
assert.equal(interrupted.recover(pending).persisted,true);const recovered=snapshot(interrupted);assert.equal(interrupted.recover(pending).persisted,true);assert.equal(snapshot(interrupted),recovered);assert.equal(interrupted.data.events.filter(e=>e.id==='fiction-select').length,1);cases++;
// New events on a >150k snapshot with over 100 rounds use the identical kernel.
const long=clone(base);for(let i=0;i<102;i++)long.events.push(ops.build({id:'fiction-round-'+i,clientId:'fiction-a',action:'round',date:'2026-10-02',fractions:[9],party:i%2?'empresa':'cliente',amount:450000+i,terms:'Fictitious terms'},long));
const large=makeStore(long),update=clone(long);update.clients[0].notes='Fictitious note';const started=performance.now();assert.equal(large.write(operation(large,update)).persisted,true);const localMs=performance.now()-started;assert.deepEqual(large.data,update);cases++;
const publishedSource=execFileSync('git',['show','9ba65b5:google_apps_script.gs'],{encoding:'utf8'}),samples={published:[],integrated:[]};
let expectedIo;
for(let i=0;i<5;i++)for(const mode of ['published','integrated']){
  const fixture=makeStore(clone(long));if(mode==='published')vm.runInContext(publishedSource,fixture.context);
  const seed=clone(long);seed.unknown.seed=true;assert.equal(fixture.write(operation(fixture,seed,'fiction-benchmark-seed')).persisted,true);
  const data=clone(seed);data.clients[0].notes='Fictitious benchmark';const op=operation(fixture,data,'fiction-benchmark-note');fixture.trace.length=0;
  const start=performance.now();assert.equal(fixture.write(op).persisted,true);samples[mode].push(Number((performance.now()-start).toFixed(2)));
  const counts=['open','read','write','rows','append','lock','unlock'].map(type=>[type,fixture.trace.filter(row=>row.type===type).length]);
  if(!expectedIo)expectedIo=counts;
  else {
    // The reviewed latency optimization reuses B5 from the locked snapshot and
    // writes mirror headers+rows in one batch. No security operation is removed.
    const expected=expectedIo.map(([type,count])=>[type,count-(mode==='integrated'&&['read','rows'].includes(type)?1:0)]);
    assert.deepEqual(counts,expected,'Only the two explicitly optimized RPCs may differ');
  }
  assert.deepEqual(fixture.data,data);
}
const median=values=>values.slice().sort((a,b)=>a-b)[Math.floor(values.length/2)];
console.log(JSON.stringify({cases,sharedKernelParity:true,sourceGateUnderLock:true,noReadWriteRace:true,originalIntentAndIdsPreserved:true,reservations8and24Preserved:true,longHistoryRounds:102,largeSyntheticBase:true,localWriteWallMs:Number(localMs.toFixed(2)),benchmark:{samples,medianMs:{published:median(samples.published),integrated:median(samples.integrated)},sheetOperations:expectedIo},googleTiming:false,realNetwork:false}));
