'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {execFileSync}=require('node:child_process'),{createHash,createHmac}=require('node:crypto');
const makeStore=require('./helpers/apps-script-store.js');
const clone=value=>JSON.parse(JSON.stringify(value));
const base={clients:[{id:'fiction-client',name:'PRIVATE_FICTION_NAME'}],events:[{id:'fiction-reservation-8',clientId:'fiction-client',fractions:[8]},{id:'fiction-reservation-24',clientId:'fiction-client',fractions:[24]}],agents:[],finalPrices:{16:400000},statuses:{8:'Reservado',24:'Reservado'},salePrices:{8:100000,24:200000},priceHistory:{16:[{price:400000}]},saleCommissions:{},unavailableReasons:{},statusEventIds:{8:'fiction-reservation-8',24:'fiction-reservation-24'},salePriceEventIds:{8:'fiction-reservation-8',24:'fiction-reservation-24'},unknown:{padding:'x'.repeat(160000)}};
const cells=store=>JSON.stringify([...store.sheets].map(([name,sheet])=>[name,[...sheet.cells]]));
const candidate=()=>{const data=clone(base);data.finalPrices[16]=410000;data.priceHistory[16].push({price:410000});return data};
let cases=0;
function fixture(options={}){
  const store=makeStore(clone(base),options);
  assert.equal(store.write({requestId:'fiction-seed-version',baseRevision:store.revision,data:clone(base)}).persisted,true);
  assert.ok(store.sheets.get('Store').cells.get('6:2'));
  store.trace.length=0;
  return store;
}
function write(store,id='fiction-new-version'){return{requestId:id,baseRevision:store.revision,data:candidate()}}
function assertRead(read,data){
  assert.equal(read.ok,true);assert.deepEqual(clone(read.data),data);
  assert.equal(read.revision,createHash('sha256').update(storeJson(data)).digest('hex'));
}
function storeJson(value){if(Array.isArray(value))return '['+value.map(storeJson).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+storeJson(value[key])).join(',')+'}';return JSON.stringify(value)}

// A real source read executes while another caller owns the actual fake script lock.
const held=fixture(),lock=held.context.LockService.getScriptLock();lock.waitLock(10000);
const beforeHeld=cells(held),locks=held.trace.filter(item=>item.type==='lock').length;
try{assertRead(held.read(),base);assert.equal(held.trace.filter(item=>item.type==='lock').length,locks);assert.equal(cells(held),beforeHeld)}finally{lock.releaseLock()}
cases++;

// Legacy B2 remains readable, read-only and unchanged; no implicit migration.
const legacy=makeStore(clone(base)),legacyBefore=cells(legacy),legacyRead=legacy.read();
assert.equal(legacyRead.ok,true);assert.deepEqual(clone(legacyRead.data),base);
assert.equal(legacyRead.revision,createHash('sha256').update(JSON.stringify(base)).digest('hex'));
assert.equal(legacyRead.pendingWrite,null);assert.equal(cells(legacy),legacyBefore);assert.equal(legacy.sheets.has('StoreVersions'),false);
assert.equal(legacy.trace.filter(item=>item.type==='lock').length,0);cases++;

// Writer contention still fails without mutation; it cannot prevent safe reads.
const contended=fixture(),writerRequest=write(contended,'fiction-contended-writer'),writerLock=contended.context.LockService.getScriptLock();
writerLock.waitLock();const contendedBefore=cells(contended);
try{assert.throws(()=>contended.write(writerRequest),/Concurrent lock not serialized/);assertRead(contended.read(),base);assert.equal(cells(contended),contendedBefore)}finally{writerLock.releaseLock()}
assert.equal(contended.write(writerRequest).persisted,true);cases++;

// Two reentrant readers overlap at the Sheets boundary, using the same source/lock.
let nested=false,arm=false,nestedRead;
const readers=fixture({onStep(name){if(arm&&!nested&&name.startsWith('before:read:StoreVersions:')){nested=true;nestedRead=readers.read()}}});
arm=true;const readerBefore=cells(readers),first=readers.read();
assertRead(first,base);assertRead(nestedRead,base);assert.equal(cells(readers),readerBefore);
assert.equal(readers.trace.filter(item=>item.type==='lock').length,0);
assert.equal(readers.trace.filter(item=>item.type==='open').length,2,'One openById per read execution');
cases++;

// Commit during a read: never return old data with the new revision/diagnostics.
let commitNow=false,committed=false;
const race=fixture({onStep(name){if(commitNow&&name==='after:read:Store:2'){commitNow=false;committed=race.write(write(race)).persisted}}});
commitNow=true;const updated=race.read();assert.equal(committed,true);assertRead(updated,candidate());assert.equal(updated.pendingWrite,null);cases++;

// B5 changes without B6 changing: the read must retry and return the pending intent.
let interruptNow=false;
const pending=fixture({onStep(name){if(interruptNow&&name==='after:read:Store:2'){interruptNow=false;pending.failMirror('PrecosHistorico');assert.throws(()=>pending.write(write(pending,'fiction-partial-mirrors')))}}});
interruptNow=true;const pendingBefore=pending.sheets.get('Store').cells.get('6:2'),interrupted=pending.read();
assertRead(interrupted,base);assert.equal(interrupted.pendingWrite.state,'pending');
assert.equal(pending.sheets.get('Store').cells.get('6:2'),pendingBefore);
pending.failMirror('');assert.equal(pending.recover({...write(pending,'fiction-partial-mirrors')}).persisted,true);cases++;

// Stale committed B5 cleanup racing a read also requires a new coherent snapshot.
let failCleanup=false,clearNow=false,cleared=false,cleanupRequest;
const cleanup=fixture({onStep(name){
  if(failCleanup&&name==='before:value:Store:B5'&&JSON.parse(cleanup.sheets.get('Store').cells.get('6:2')).receipt.requestId==='fiction-cleanup')throw Error('Fiction cleanup interruption');
  if(clearNow&&name==='after:read:Store:2'){clearNow=false;cleared=cleanup.write(cleanupRequest).persisted}
}});
cleanupRequest=write(cleanup,'fiction-cleanup');failCleanup=true;assert.throws(()=>cleanup.write(cleanupRequest));failCleanup=false;
assert.equal(cleanup.read().pendingWrite.state,'committed');clearNow=true;
assert.equal(cleanup.read().pendingWrite,null);assert.equal(cleared,true);cases++;

// All control fields participate, not just the active pointer. No unbounded retry.
for(const key of ['3:2','4:2','5:2','6:2']){
  let changing=false,ticks=0;
  const busy=fixture({onStep(name){if(changing&&name==='after:read:Store:2'){
    const sheet=busy.sheets.get('Store'),value=sheet.cells.get(key)||'';
    if(key==='3:2')sheet.cells.set(key,'fiction-time-'+(++ticks));
    else if(key==='4:2')sheet.cells.set(key,JSON.stringify({fiction:++ticks}));
    else if(key==='5:2')sheet.cells.set(key,ticks++%2?'':JSON.stringify({format:2,requestId:'fiction-busy-intent',baseRevision:busy.context.storeRevision_(storeJson(base)),revision:'a'.repeat(64)}));
    else {const pointer=JSON.parse(value);pointer.receipt.note='fiction-'+(++ticks);sheet.cells.set(key,JSON.stringify(pointer))}
  }}});
  changing=true;const result=busy.read();changing=false;
  assert.equal(result.ok,false);assert.equal(result.code,'SOURCE_BUSY');assert.equal('data' in result,false);
  assert.equal(busy.trace.filter(item=>item.type==='read'&&item.name==='Store'&&item.key===2).length,4);
  assert.equal(busy.trace.filter(item=>item.type==='lock').length,0);cases++;
}

// A stalled read does not own the lock: a writer can finish while it is in flight.
let slow=false,clock=0,written=false;
const logs=[];
const timeout=fixture({console:{log:line=>logs.push(JSON.parse(line))},onStep(name){
  if(slow&&name.startsWith('before:read:StoreVersions:')){slow=false;written=timeout.write(write(timeout,'fiction-during-slow-read')).persisted;clock+=360000}
}});
timeout.context.Date=class extends Date{static now(){return clock}};
slow=true;const timed=timeout.read();assert.equal(written,true);assert.equal(timed.code,'SOURCE_TIMEOUT');assert.equal('data' in timed,false);
assertRead(timeout.read(),candidate());assert.deepEqual(clone(timeout.data.statuses),base.statuses);
assert.deepEqual(clone(timeout.data.events),base.events);assert.deepEqual(clone(timeout.data.saleCommissions),base.saleCommissions);
assert.ok(logs.some(line=>line.operation==='read'&&line.phase==='chunks'&&line.state==='error'&&line.durationMs>=360000));
assert.ok(logs.some(line=>line.operation==='write'&&line.phase==='mirrors'&&line.state==='ok'));
for(const phase of ['lock','backup','stage','archive','mirrors','activate','cleanup'])assert.ok(logs.some(line=>line.operation==='write'&&line.phase===phase&&line.state==='ok'),phase);
assert.ok(logs.every(line=>Object.keys(line).sort().join(',')==='component,correlationId,durationMs,elapsedMs,operation,phase,state'));
assert.doesNotMatch(JSON.stringify(logs),/PRIVATE_FICTION_NAME|fiction-client|fiction-new-version|400000|410000|checksum|revision/);cases++;

// Budget expires during openById: no further Sheets calls or writes are attempted.
let slowOpen=false,openClock=0;
const opening=fixture({onStep(name){if(slowOpen&&name==='open'){slowOpen=false;openClock+=13000}}});
opening.context.Date=class extends Date{static now(){return openClock}};
const openBefore=cells(opening);opening.trace.length=0;slowOpen=true;
assert.equal(opening.read().code,'SOURCE_TIMEOUT');assert.equal(cells(opening),openBefore);
assert.equal(opening.trace.filter(item=>item.type==='read').length,0);cases++;

// Corruption, legacy drift, malformed intent and RPC failures fail closed, without repair.
for(const defect of ['checksum','legacy','intent','rpc']){
  let failRead=false;
  const broken=fixture({onStep(name){if(failRead&&name.startsWith('before:read:StoreVersions:'))throw Error('PRIVATE_FICTION_NAME RPC failure')}});
  const control=broken.sheets.get('Store');
  if(defect==='checksum'){const pointer=JSON.parse(control.cells.get('6:2'));broken.sheets.get('StoreVersions').cells.set(pointer.version.start+':3',':corruption')}
  if(defect==='legacy')control.cells.set('2:2',JSON.stringify({...base,fictionChanged:true}));
  if(defect==='intent')control.cells.set('5:2',JSON.stringify({format:1}));
  if(defect==='rpc')failRead=true;
  const before=cells(broken);
  if(defect==='intent')assert.equal(broken.read().code,'WRITE_INCOMPLETE');else assert.throws(()=>broken.read());
  assert.equal(cells(broken),before);assert.equal(broken.trace.filter(item=>item.type==='lock').length,0);cases++;
}

// Observe every durable write boundary. Readers see the old/new complete version,
// never staged chunks or half-updated mirrors; all mutations remain locked.
let observing=false,observations=0;
const boundaries=fixture({onStep(name){if(observing&&/^(before|after):(value|rows|append|clear):|^flush$/.test(name)){
  observing=false;const read=boundaries.read();assert.equal(read.ok,true);
  assert.ok([storeJson(base),storeJson(candidate())].includes(storeJson(read.data)));
  if(read.pendingWrite)assert.ok(['pending','committed'].includes(read.pendingWrite.state));
  observations++;observing=true;
}}});
observing=true;assert.equal(boundaries.write(write(boundaries)).persisted,true);observing=false;
assert.ok(observations>20);assert.ok(boundaries.trace.filter(item=>['write','rows','append'].includes(item.type)).every(item=>item.held));cases++;

// The old source reproduces lock contention at exactly the same boundary.
const baseline=fixture();vm.runInContext(execFileSync('git',['show','def5085:google_apps_script.gs'],{encoding:'utf8'}),baseline.context);
const oldLock=baseline.context.LockService.getScriptLock();oldLock.waitLock();
try{assert.throws(()=>baseline.read(),/Concurrent lock not serialized/)}finally{oldLock.releaseLock()}cases++;

// Actual API preflight still prevents all mutation when the source cannot read safely.
async function apiChecks(){
  const api=require('../api/commercial-data.js'),savedEnv={...process.env},savedFetch=global.fetch;
  Object.assign(process.env,{COMMERCIAL_ACCESS_SECRET:'fiction-secret',CRM_GOOGLE_DEPLOYMENT_ID:'test-deployment',CRM_GOOGLE_SPREADSHEET_ID:'test-sheet',CRM_GOOGLE_CLIENT_ID:'fiction-client',CRM_GOOGLE_CLIENT_SECRET:'fiction-secret',CRM_GOOGLE_REFRESH_TOKEN:'fiction-refresh',CRM_GOOGLE_WRITES_ENABLED:'true',CRM_GOOGLE_TEST_WRITES_ENABLED:'true',VERCEL_ENV:'preview'});
  let errorCode='',mutations=0;
  const google=fixture(),sourceBefore=cells(google),sourceRequest=write(google,'fiction-preflight');
  global.fetch=async(url,options)=>{
    assert.ok(['https://oauth2.googleapis.com/token','https://script.googleapis.com/v1/scripts/test-deployment:run'].includes(url),'Real network forbidden');
    if(url.includes('oauth2'))return Response.json({access_token:'fiction-token'});
    const call=JSON.parse(options.body);if(call.function!=='crmRead')mutations++;
    return Response.json({done:true,response:{result:errorCode?google.context.storeResponse_({ok:false,code:errorCode}):google.context[call.function](...call.parameters)}});
  };
  const issued=String(Date.now()),cookie='tv_commercial_access='+issued+'.'+createHmac('sha256','fiction-secret').update(issued).digest('hex');
  const headers={host:'example.test',origin:'https://example.test',cookie,'content-type':'application/json'};
  async function invoke(method,body){
    const response={statusCode:200,setHeader(){},status(code){this.statusCode=code;return this},json(value){this.body=value;return this}};
    await api({method,body,headers},response);return response;
  }
  try{
    const loaded=await invoke('GET');headers['x-crm-read-ticket']=loaded.body.readTicket;
    for(errorCode of ['SOURCE_BUSY','SOURCE_TIMEOUT']){
      for(const action of ['save','recover']){const response=await invoke('POST',{action,...sourceRequest});assert.equal(response.statusCode,503);assert.equal(response.body.code,errorCode);assert.equal('data' in response.body,false);cases++}
      const read=await invoke('GET');assert.equal(read.statusCode,503);assert.equal(read.body.code,errorCode);
    }
    assert.equal(mutations,0);assert.equal(cells(google),sourceBefore);
  }finally{global.fetch=savedFetch;for(const key of Object.keys(process.env))if(!(key in savedEnv))delete process.env[key];Object.assign(process.env,savedEnv)}
}
apiChecks().then(()=>console.log(JSON.stringify({cases,overlappingReaders:true,readDuringSlowWrite:true,writeDuringStalledRead:true,writeBoundaryObservations:observations,boundedSnapshotRetries:true,metadataAndChecksumsPreserved:true,preflightPreserved:true,realNetwork:false}))).catch(error=>{console.error(error);process.exitCode=1});
