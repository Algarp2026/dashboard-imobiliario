const assert=require('node:assert/strict');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const makeStore=require('./helpers/apps-script-store.js');
const clone=value=>JSON.parse(JSON.stringify(value));
const base={clients:[{id:'synthetic-client',notes:'x'.repeat(160000)}],events:[{id:'synthetic-reservation-8',clientId:'synthetic-client',fractions:[8]},{id:'synthetic-reservation-24',clientId:'synthetic-client',fractions:[24]}],agents:[],finalPrices:{16:400000},statuses:{8:'Reservado',24:'Reservado'},salePrices:{8:100000,24:200000},priceHistory:{16:[{price:400000}]},saleCommissions:{},unavailableReasons:{},statusEventIds:{8:'synthetic-reservation-8',24:'synthetic-reservation-24'},salePriceEventIds:{8:'synthetic-reservation-8',24:'synthetic-reservation-24'},extra:{keep:true}};
base.extra.padding=base.clients[0].notes;base.clients[0].notes='Fictitious';
const next=clone(base);next.finalPrices[16]=410000;next.priceHistory[16].push({price:410000});
const prepare=(store,id='synthetic-interrupted')=>({requestId:id,baseRevision:store.revision,data:clone(next)});
const pending=store=>store.sheets.get('Store').cells.get('5:2')||'';
const active=store=>store.sheets.get('Store').cells.get('6:2')||'';
const backups=store=>store.sheets.get('BackupsVersions')?.getLastRow()||0;

// Reproduce the confirmed-commit/stale-intent defect independently of recovery.
let failCleanup=true;
const stuck=makeStore(base,{onStep(name){if(name==='before:value:Store:B5'&&active(stuck)&&failCleanup)throw new Error('Interrupted cleanup')}});
if(process.env.CHECK_BASELINE)vm.runInContext(execFileSync('git',['show','fa876dc:google_apps_script.gs'],{encoding:'utf8'}),stuck.context);
const first=prepare(stuck);
assert.throws(()=>stuck.write(first));assert.deepEqual(stuck.data,next);assert.ok(pending(stuck));
failCleanup=false;
const subsequent=clone(next);subsequent.extra.second=true;
const second={requestId:'synthetic-next-writer',baseRevision:stuck.revision,data:subsequent};
assert.equal(stuck.write(second).persisted,true,'A verified committed B5 must not block the next CAS write');
assert.deepEqual(stuck.data,subsequent);assert.equal(backups(stuck),2);
assert.equal(stuck.recover(first).code,'CONFLICT');assert.deepEqual(stuck.data,subsequent);

// Inject an interruption before/after every durable mutation and at every flush.
let recovered=0;
for(const chunked of [false,true]){
const phases=[];let probing=false;
const probe=makeStore(base,{onStep:name=>{if(probing)phases.push(name)}});
if(chunked)assert.equal(probe.write({...prepare(probe,'synthetic-seed'),data:clone(base)}).persisted,true);
const probeRequest=prepare(probe);probing=true;probe.write(probeRequest);
for(let target=0;target<phases.length;target++){
  let index=0,enabled=false;
  const store=makeStore(base,{onStep(name){if(enabled&&index++===target){enabled=false;throw new Error('Interruption at '+name)}}});
  if(chunked)assert.equal(store.write({...prepare(store,'synthetic-seed'),data:clone(base)}).persisted,true);
  const request=prepare(store),legacy=store.sheets.get('Store').cells.get('2:2');
  enabled=true;
  assert.throws(()=>store.write(request),undefined,phases[target]);
  const beforeRead=JSON.stringify([...store.sheets].map(([name,sheet])=>[name,[...sheet.cells]]));
  const read=store.read();assert.equal(read.ok,true);
  assert.equal(JSON.stringify([...store.sheets].map(([name,sheet])=>[name,[...sheet.cells]])),beforeRead,'GET must not clean or write');
  assert.deepEqual(store.data,store.revision===request.baseRevision?base:next);
  if(read.pendingWrite){
    assert.equal(read.pendingWrite.requestId,request.requestId);
    assert.equal(read.pendingWrite.state,store.revision===request.baseRevision?'pending':'committed');
    assert.equal(Object.keys(read.pendingWrite).sort().join(','),'baseRevision,requestId,revision,state');
  }
  const unchanged=JSON.stringify(store.data),intent=pending(store);
  assert.equal(store.recover({...request,requestId:'synthetic-unrelated'}).code,'CONFLICT');
  assert.equal(JSON.stringify(store.data),unchanged);assert.equal(pending(store),intent);
  if(read.pendingWrite?.state==='pending'){
    const foreign={...request,requestId:'synthetic-other-writer'};
    assert.equal(store.write(foreign).code,'WRITE_INCOMPLETE');assert.equal(pending(store),intent);
  }
  // Before the intent exists, recovery cannot invent it; a normal CAS retry is needed.
  const result=store.recover(request);
  if(!result.persisted){assert.equal(result.code,'CONFLICT');assert.equal(pending(store),'');assert.equal(store.write(request).persisted,true)}
  assert.deepEqual(store.data,next);assert.equal(pending(store),'');assert.equal(backups(store),chunked?2:1);
  const after=JSON.stringify([...store.sheets].map(([name,sheet])=>[name,[...sheet.cells]]));
  assert.equal(store.recover(request).persisted,true);assert.equal(store.write(request).persisted,true);
  assert.equal(JSON.stringify([...store.sheets].map(([name,sheet])=>[name,[...sheet.cells]])),after);
  assert.equal(store.sheets.get('Store').cells.get('2:2'),legacy);
  assert.deepEqual(store.data.statuses,base.statuses);assert.deepEqual(store.data.events,base.events);
  assert.deepEqual(store.data.salePrices,base.salePrices);assert.deepEqual(store.data.saleCommissions,base.saleCommissions);
  const pointer=JSON.parse(active(store));assert.deepEqual(JSON.parse(store.context.readVersion_(pointer.previous)),base);
  assert.equal(store.data.priceHistory[16].length,2);recovered++;
}
}

// Mirrors can advance while the authoritative pointer stays unchanged.
const mirrors=makeStore(base);const request=prepare(mirrors);mirrors.failWrite('pointer-before');
assert.throws(()=>mirrors.write(request));assert.deepEqual(mirrors.data,base);
assert.equal(mirrors.read().pendingWrite.state,'pending');assert.ok(mirrors.sheets.get('EstadosVendas'));
const intent=pending(mirrors);mirrors.failWrite('');
assert.equal(mirrors.recover({...request,data:base}).code,'CONFLICT');assert.equal(pending(mirrors),intent);
assert.equal(mirrors.recover(request).persisted,true);
const inconsistent=makeStore(base),bad=prepare(inconsistent);inconsistent.failWrite('pointer-before');
assert.throws(()=>inconsistent.write(bad));inconsistent.failWrite('');
const cell=inconsistent.sheets.get('Store').cells,metadata=JSON.parse(pending(inconsistent));metadata.baseRevision='f'.repeat(64);cell.set('5:2',JSON.stringify(metadata));
assert.equal(inconsistent.read().pendingWrite.state,'blocked');
assert.equal(inconsistent.write({...bad,requestId:'synthetic-new-request'}).code,'WRITE_INCOMPLETE');
assert.deepEqual(inconsistent.data,base);assert.equal(pending(inconsistent),JSON.stringify(metadata));
console.log(JSON.stringify({interruptionPoints:recovered,largeSyntheticBase:true,staleCommittedIntentUnblocked:true,readOnlyDiagnostics:true,wrongRecoveryRejected:true,backupsAndReservationsPreserved:true,realNetwork:false}));
