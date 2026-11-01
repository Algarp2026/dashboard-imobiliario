const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),{createHmac}=require('node:crypto');
const api=require('../api/commercial-data.js');
const makeStore=require('./helpers/apps-script-store.js');
const clone=value=>JSON.parse(JSON.stringify(value)),KEY='theView.crmCommercial.v2';
const oldEnv={...process.env},oldFetch=global.fetch;
const base={clients:Array.from({length:65},(_,i)=>({id:'fiction-client-'+i,name:'Fictitious '+i,preferences:{},fractions:[]})),events:Array.from({length:90},(_,i)=>({id:'fiction-event-'+i,clientId:'fiction-client-'+(i%65),type:i<2?'Reserva efetuada':'Outro',fractions:i===0?[8]:i===1?[24]:[]})),agents:[],finalPrices:Object.fromEntries(Array.from({length:39},(_,i)=>[i+1,i===15?925000:400000])),statuses:{8:'Reservado',24:'Reservado'},salePrices:{8:100000,24:200000},priceHistory:{16:[{price:925000}]},saleCommissions:{},unavailableReasons:{},statusEventIds:{8:'fiction-event-0',24:'fiction-event-1'},salePriceEventIds:{8:'fiction-event-0',24:'fiction-event-1'},unknown:{padding:'x'.repeat(155000),keep:true}};
Object.assign(process.env,{COMMERCIAL_ACCESS_SECRET:'fiction-session-secret',CRM_GOOGLE_DEPLOYMENT_ID:'test-deployment',CRM_GOOGLE_SPREADSHEET_ID:'test-sheet',CRM_GOOGLE_CLIENT_ID:'fiction-client',CRM_GOOGLE_CLIENT_SECRET:'fiction-secret',CRM_GOOGLE_REFRESH_TOKEN:'fiction-refresh',CRM_GOOGLE_WRITES_ENABLED:'true',CRM_GOOGLE_TEST_WRITES_ENABLED:'true',VERCEL_ENV:'preview'});
let google,sourceTransform=result=>result,writeExecutions=0;
const sheets=()=>JSON.stringify([...google.sheets].map(([name,sheet])=>[name,[...sheet.cells]]));
function reset(){google=makeStore(clone(base));sourceTransform=result=>result;writeExecutions=0}
global.fetch=async(url,options)=>{
  assert.ok(['https://oauth2.googleapis.com/token','https://script.googleapis.com/v1/scripts/test-deployment:run'].includes(url),'External network is forbidden');
  if(url.includes('oauth2'))return Response.json({access_token:'fiction-token'});
  const call=JSON.parse(options.body);if(call.function!=='crmRead')writeExecutions++;
  // Emulate a pre-optimization source for this compatibility matrix. It ignores
  // capabilitiesOnly; malformed full diagnostics must still block every write.
  if(call.function==='crmRead')delete call.parameters[0].capabilitiesOnly;
  try{return Response.json({done:true,response:{result:sourceTransform(clone(google.context[call.function](...call.parameters)),call.function)}})}
  catch{return Response.json({done:true,error:{details:[{errorMessage:'Fictitious interruption'}]}})}
};
const code=fs.readFileSync(require.resolve('../commercial.js'),'utf8'),end=code.lastIndexOf('})();');
function browser(){
  const storage=new Map(),requests=[],downloads=[],messages=[],timers=[];
  let modal,apiTransform=body=>body,onRead=()=>{};
  const issued=String(Date.now()),cookie='tv_commercial_access='+issued+'.'+createHmac('sha256',process.env.COMMERCIAL_ACCESS_SECRET).update(issued).digest('hex');
  async function invoke(method='GET',body,ticket){
    const request={method,body,headers:{host:'example.test',origin:'https://example.test',cookie,'content-type':'application/json','x-crm-read-ticket':ticket||''}};
    const response={statusCode:200,setHeader(){},status(value){this.statusCode=value;return this},json(value){this.body=value;return this}};
    await api(request,response);return response;
  }
  const document={readyState:'loading',addEventListener(){},querySelector(){return null},getElementById(){return null},createElement(){const controls={};modal={style:{},remove(){},querySelector(key){return controls[key]||(controls[key]={})}};return modal},body:{style:{},appendChild(){}}};
  const context={console,Date,AbortController,document,window:{THE_VIEW_CONFIG:{GOOGLE_SHEETS_WEBAPP_URL:'https://no-google.invalid/exec'},addEventListener(){}},localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},requestAnimationFrame(){},setTimeout(fn){timers.push(fn);return timers.length},clearTimeout(){},fetch:async(url,options={})=>{
    if(url==='data.json')return Response.json(JSON.parse(fs.readFileSync(require.resolve('../data.json'),'utf8')));
    assert.equal(url,'/api/commercial-data');const method=options.method||'GET';
    const response=await invoke(method,options.body?JSON.parse(options.body):undefined,options.headers?.['X-CRM-Read-Ticket']);
    requests.push({method,status:response.statusCode});
    const result=apiTransform(clone(response.body),method);
    if(method==='GET')await onRead();
    return Response.json(result,{status:response.statusCode});
  }};
  vm.createContext(context);vm.runInContext(code.slice(0,end)+`el.dataStatus={textContent:''};el.globalErrorBox={textContent:'',classList:{remove(){}}};populate=()=>{};restoreCommercialContext=()=>{};renderAll=()=>{};activateCommercialView=()=>{};renderCommercialUx=()=>{};restoreCommercialScroll=()=>{};commercialUxToast=()=>{};renderSharedSyncStatus=()=>{};notifyUser=message=>globalThis.notify(message);confirmUser=async()=>true;downloadJson=showRecoveryDownload=(value,name)=>globalThis.download(value,name);globalThis.app={state,sharedSync,loadExcel,loadRemoteData,save,syncRemote,openSyncReconciliation,localRecoveryExport,exportLocalRecoveryCopy};`+code.slice(end),context);
  context.notify=message=>messages.push(message);context.download=(value,name)=>downloads.push({value:clone(value),name});
  return{app:context.app,storage,requests,downloads,messages,timers,invoke,get modal(){return modal},set apiTransform(fn){apiTransform=fn},set onRead(fn){onRead=fn}};
}
const saved=fixture=>JSON.stringify([...fixture.storage]);
function operation(fixture,id='fiction-pending-original'){
  const data=clone(fixture.app.state.data);data.finalPrices[16]=950000;data.priceHistory[16].push({price:950000});
  return{action:'save',requestId:id,baseRevision:fixture.app.sharedSync.revision,data};
}
async function prepare(chunked=false){
  reset();if(chunked)assert.equal(google.write({requestId:'fiction-initial-chunks',baseRevision:google.revision,data:clone(base)}).persisted,true);
  const fixture=browser();await fixture.app.loadExcel();
  fixture.app.state.data.finalPrices[16]=950000;fixture.app.state.data.priceHistory[16].push({price:950000});fixture.app.save();
  const pending={action:'save',requestId:'fiction-original-to-preserve',baseRevision:fixture.app.sharedSync.revision,data:clone(fixture.app.state.data)};
  fixture.storage.set(KEY+'.pendingWrite.v1',JSON.stringify(pending));
  await fixture.app.loadRemoteData();fixture.app.openSyncReconciliation();assert.ok(fixture.modal);
  return fixture;
}
async function main(){
  let cases=0;
  // Exact, private export with no authentication state or storage writes.
  for(const action of [null,'save','recover']){
    reset();const fixture=browser();await fixture.app.loadExcel();
    const pending=action?{...operation(fixture),action}:null;
    if(pending)fixture.storage.set(KEY+'.pendingWrite.v1',JSON.stringify(pending));
    const meta=JSON.parse(fixture.storage.get(KEY+'.syncMeta.v1'));meta.readTicket='AUTH_TICKET_MUST_NOT_EXPORT';meta.cookie='AUTH_COOKIE_MUST_NOT_EXPORT';fixture.storage.set(KEY+'.syncMeta.v1',JSON.stringify(meta));fixture.app.sharedSync.ticket='RUNTIME_TICKET_MUST_NOT_EXPORT';
    const before=saved(fixture),beforeSource=sheets(),requests=fixture.requests.length;
    const exported=clone(fixture.app.localRecoveryExport());fixture.app.exportLocalRecoveryCopy();
    assert.deepEqual(exported.pendingWrite,pending);assert.deepEqual(exported.data,clone(fixture.app.state.data));assert.deepEqual(exported.base,meta.base);
    assert.equal(exported.syncMeta.revision,meta.revision);assert.equal(fixture.downloads.length,1);assert.deepEqual(fixture.downloads[0].value.pendingWrite,pending);
    assert.equal(saved(fixture),before);assert.equal(sheets(),beforeSource);assert.equal(fixture.requests.length,requests);
    assert.doesNotMatch(JSON.stringify(exported),/AUTH_TICKET|AUTH_COOKIE|RUNTIME_TICKET|readTicket|"cookie"|fiction-session-secret|fiction-refresh/);
    // Existing consumers still receive data/base/createdAt without a new import schema requirement.
    assert.deepEqual(clone({data:exported.data,base:exported.base}).base,meta.base);assert.ok(exported.createdAt);
    cases++;
  }
  reset();const malformed=browser();await malformed.app.loadExcel();malformed.storage.set(KEY+'.pendingWrite.v1','{');
  const malformedBefore=saved(malformed);malformed.app.exportLocalRecoveryCopy();assert.equal(malformed.downloads.length,0);assert.equal(saved(malformed),malformedBefore);cases++;
  malformed.storage.set(KEY+'.pendingWrite.v1',JSON.stringify({...operation(malformed),readTicket:'must-not-export'}));
  malformed.app.exportLocalRecoveryCopy();assert.equal(malformed.downloads.length,0);cases++;

  const faults=[
    ['old-version',r=>{delete r.capabilities},'SYNC_DIAGNOSTICS_UNAVAILABLE'],
    ['missing-summary',r=>{delete r.pendingWrite},'SYNC_DIAGNOSTICS_UNAVAILABLE'],
    ['string-version',r=>{r.capabilities.pendingWriteDiagnostics='1'},'SYNC_DIAGNOSTICS_UNAVAILABLE'],
    ['future-version',r=>{r.capabilities.pendingWriteDiagnostics=2},'SYNC_DIAGNOSTICS_UNAVAILABLE'],
    ['null-capabilities',r=>{r.capabilities=null},'SYNC_DIAGNOSTICS_UNAVAILABLE'],
    ['undefined-summary',r=>{r.pendingWrite=undefined},'SYNC_DIAGNOSTICS_UNAVAILABLE'],
    ['empty-summary',r=>{r.pendingWrite={}},'INVALID_SYNC_DIAGNOSTICS'],
    ['array-summary',r=>{r.pendingWrite=[]},'INVALID_SYNC_DIAGNOSTICS'],
    ['unknown-state',r=>{r.pendingWrite={state:'unknown',requestId:'fiction-request',baseRevision:r.revision,revision:r.revision}},'INVALID_SYNC_DIAGNOSTICS'],
    ['bad-id',r=>{r.pendingWrite={state:'pending',requestId:'bad',baseRevision:r.revision,revision:r.revision}},'INVALID_SYNC_DIAGNOSTICS'],
    ['bad-revision',r=>{r.pendingWrite={state:'pending',requestId:'fiction-request',baseRevision:r.revision,revision:'bad'}},'INVALID_SYNC_DIAGNOSTICS'],
    ['wrong-base',r=>{r.pendingWrite={state:'pending',requestId:'fiction-request',baseRevision:'f'.repeat(64),revision:r.revision}},'INVALID_SYNC_DIAGNOSTICS'],
    ['wrong-commit',r=>{r.pendingWrite={state:'committed',requestId:'fiction-request',baseRevision:r.revision,revision:'f'.repeat(64)}},'INVALID_SYNC_DIAGNOSTICS'],
    ['extra-data',r=>{r.pendingWrite={state:'pending',requestId:'fiction-request',baseRevision:r.revision,revision:r.revision,data:{hidden:true}}},'INVALID_SYNC_DIAGNOSTICS']
  ];
  for(const [name,damage,code] of faults){
    // New frontend, old/incomplete API: no local replacement, no POST, even for recovery.
    reset();const fixture=browser();await fixture.app.loadExcel();const op=operation(fixture);fixture.storage.set(KEY+'.pendingWrite.v1',JSON.stringify(op));fixture.app.state.data=clone(op.data);fixture.app.save();
    fixture.apiTransform=(result,method)=>{if(method==='GET'&&result.ok)damage(result);return result};
    const local=saved(fixture),source=sheets();assert.equal(await fixture.app.syncRemote(),false,name);assert.equal(fixture.app.sharedSync.error,code);assert.equal(saved(fixture),local);assert.equal(fixture.requests.filter(r=>r.method==='POST').length,0);
    await assert.rejects(()=>fixture.app.loadRemoteData(),error=>error.code===code,name);
    assert.equal(saved(fixture),local);assert.equal(sheets(),source);assert.equal(fixture.app.sharedSync.verified,false);
    assert.equal(await fixture.app.syncRemote(true),false);assert.equal(fixture.requests.filter(r=>r.method==='POST').length,0);
    assert.equal(saved(fixture),local);assert.equal(writeExecutions,0);cases++;

    // New API, old/incomplete Apps Script: stop BEFORE invoking any write function.
    reset();const other=browser();await other.app.loadExcel();const req=operation(other);const ticket=other.app.sharedSync.ticket;
    sourceTransform=(result,fn)=>{if(fn==='crmRead'&&result.ok)damage(result);return result};
    const originalSource=sheets();
    for(const action of ['save','recover']){
      const reply=await other.invoke('POST',{...req,action},ticket);assert.equal(reply.body.code,code,name+' '+action);assert.ok(reply.statusCode>=500);
      assert.equal(writeExecutions,0);assert.equal(sheets(),originalSource);
    }
    cases++;
  }

  // A pending operation survives a source upgrade and resumes only with its original ID.
  reset();const upgrade=browser();await upgrade.app.loadExcel();const request=operation(upgrade);
  google.failWrite('pointer-before');assert.throws(()=>google.write(request));google.failWrite('');
  upgrade.storage.set(KEY+'.pendingWrite.v1',JSON.stringify(request));upgrade.app.state.data=clone(request.data);upgrade.app.save();
  sourceTransform=result=>{delete result.capabilities;return result};const original=saved(upgrade),unfinished=sheets();
  assert.equal(await upgrade.app.syncRemote(true),false);assert.equal(saved(upgrade),original);assert.equal(sheets(),unfinished);assert.equal(writeExecutions,0);
  sourceTransform=result=>result;upgrade.storage.delete(KEY+'.pendingSync');assert.equal(await upgrade.app.syncRemote(true),true);assert.deepEqual(google.data,request.data);assert.equal(google.data.events.length,90);assert.equal(google.data.clients.length,65);cases++;

  // Any change in revision OR intent since opening invalidates the review, for both actions.
  for(const action of ['[data-sync-merge]','[data-sync-use-remote]'])for(const change of ['revision','pending','capability']){
    const fixture=await prepare(),local=saved(fixture);
    if(change==='revision'){
      const changed=clone(google.data);changed.clients[1].notes='Another fictitious session';
      assert.equal(google.write({requestId:'fiction-other-session',baseRevision:google.revision,data:changed}).persisted,true);
    }else if(change==='pending'){
      google.failWrite('pointer-before');assert.throws(()=>google.write({requestId:'fiction-other-pending',baseRevision:google.revision,data:{...clone(google.data),another:true}}));google.failWrite('');
    }else sourceTransform=result=>{delete result.capabilities;return result};
    const remote=sheets(),before=fixture.requests.length;await fixture.modal.querySelector(action).onclick();
    assert.equal(saved(fixture),local);assert.equal(sheets(),remote);assert.equal(fixture.requests.length,before+1);assert.equal(fixture.requests.at(-1).method,'GET');assert.equal(fixture.requests.filter(r=>r.method==='POST').length,0);assert.equal(fixture.app.sharedSync.verified,false);assert.ok(fixture.messages.length);cases++;
  }
  const residual=await prepare(true),residualLocal=saved(residual);
  const pointer=JSON.parse(google.sheets.get('Store').cells.get('6:2'));
  google.sheets.get('Store').cells.set('5:2',JSON.stringify(pointer.receipt));const residualSource=sheets();
  await residual.modal.querySelector('[data-sync-merge]').onclick();assert.equal(saved(residual),residualLocal);assert.equal(sheets(),residualSource);assert.equal(residual.app.sharedSync.verified,false);cases++;
  // The local pending request can also change while the verification GET is in flight.
  const changedLocal=await prepare();let replacement;
  changedLocal.onRead=()=>{replacement=JSON.stringify({...operation(changedLocal),requestId:'fiction-new-local'});changedLocal.storage.set(KEY+'.pendingWrite.v1',replacement)};
  await changedLocal.modal.querySelector('[data-sync-merge]').onclick();assert.equal(changedLocal.storage.get(KEY+'.pendingWrite.v1'),replacement);assert.equal(changedLocal.app.sharedSync.verified,false);cases++;

  // A successful review does a GET only, archives the exact request, then waits for explicit sync.
  const fixture=await prepare(),pending=JSON.parse(fixture.storage.get(KEY+'.pendingWrite.v1')),before=fixture.requests.length,source=sheets();
  fixture.modal.querySelector('[data-sync-export]').onclick();assert.deepEqual(fixture.downloads[0].value.pendingWrite,pending);
  await fixture.modal.querySelector('[data-sync-merge]').onclick();assert.equal(fixture.requests.length,before+1);assert.equal(fixture.requests.at(-1).method,'GET');assert.equal(sheets(),source);assert.equal(fixture.app.sharedSync.phase,'pending');
  const backup=[...fixture.storage].find(([key])=>key.startsWith(KEY+'.conflictBackup.'));assert.deepEqual(JSON.parse(backup[1]).pendingWrite,pending);
  assert.equal(await fixture.app.syncRemote(),true);assert.equal(google.data.finalPrices[16],950000);assert.equal(google.data.priceHistory[16].length,2);
  for(const key of Object.keys(base).filter(key=>!['finalPrices','priceHistory'].includes(key)))assert.deepEqual(google.data[key],base[key]);
  for(let i=1;i<=39;i++)if(i!==16)assert.equal(google.data.finalPrices[i],base.finalPrices[i]);cases++;
  // CAS still catches another session writing after a successful fresh review.
  const race=await prepare();await race.modal.querySelector('[data-sync-merge]').onclick();
  const another=clone(google.data);another.clients[2].notes='Fictitious concurrent update';
  assert.equal(google.write({requestId:'fiction-after-review',baseRevision:google.revision,data:another}).persisted,true);
  const remoteBefore=sheets(),localBefore=race.storage.get(KEY);
  assert.equal(await race.app.syncRemote(),false);assert.equal(race.app.sharedSync.httpStatus,409);assert.equal(race.app.sharedSync.error,'CONFLICT');assert.equal(race.requests.filter(r=>r.method==='POST').length,0);
  assert.equal(sheets(),remoteBefore);assert.equal(race.storage.get(KEY),localBefore);assert.equal(race.storage.has(KEY+'.pendingWrite.v1'),false);cases++;
  // A request with a different original base is not silently replaced by a new ID.
  race.storage.set(KEY+'.pendingWrite.v1',JSON.stringify(operation(race)));
  const oldRequest=race.storage.get(KEY+'.pendingWrite.v1');race.app.sharedSync.revision='f'.repeat(64);race.app.sharedSync.phase='pending';race.app.sharedSync.verified=true;
  assert.equal(await race.app.syncRemote(),false);assert.equal(race.storage.get(KEY+'.pendingWrite.v1'),oldRequest);assert.equal(sheets(),remoteBefore);cases++;
  // Even a successful matching GET archives an outstanding request before retiring it.
  reset();const confirmed=browser();await confirmed.app.loadExcel();const originalRequest={...operation(confirmed),data:clone(confirmed.app.state.data)};
  confirmed.storage.set(KEY+'.pendingWrite.v1',JSON.stringify(originalRequest));
  const currentSource=sheets();await confirmed.app.loadRemoteData();
  const readBackup=[...confirmed.storage].find(([key])=>key.startsWith(KEY+'.confirmedReadBackup.'));
  assert.deepEqual(JSON.parse(readBackup[1]).pendingWrite,originalRequest);assert.equal(sheets(),currentSource);assert.equal(confirmed.requests.filter(r=>r.method==='POST').length,0);cases++;
  const divergent=operation(confirmed);confirmed.storage.set(KEY+'.pendingWrite.v1',JSON.stringify(divergent));const divergentStorage=saved(confirmed);
  await confirmed.app.loadRemoteData();assert.equal(confirmed.app.sharedSync.error,'UNCONFIRMED_PENDING_REQUEST');assert.equal(saved(confirmed),divergentStorage);assert.equal(sheets(),currentSource);cases++;
  console.log(JSON.stringify({targetedCases:cases,compatibilityFaults:faults.length,sourceWritePreflight:true,privateExports:true,revalidationRaces:true,syntheticClients:65,syntheticEvents:90,reservations8and24Preserved:true,realNetwork:false}));
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>{global.fetch=oldFetch;for(const key of Object.keys(process.env))if(!(key in oldEnv))delete process.env[key];Object.assign(process.env,oldEnv)});
