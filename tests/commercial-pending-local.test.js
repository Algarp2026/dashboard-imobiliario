'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createHmac}=require('node:crypto');
const makeStore=require('./helpers/apps-script-store.js'),api=require('../api/commercial-data.js');
const KEY='theView.crmCommercial.v2',clone=value=>JSON.parse(JSON.stringify(value));
const base=(count=65)=>({clients:Array.from({length:count},(_,i)=>({id:'fiction-client-'+i,name:'Fictitious '+i,preferences:{},fractions:[]})),events:[{id:'fiction-reservation-8',clientId:'fiction-client-0',type:'Reserva efetuada',fractions:[8]},{id:'fiction-reservation-24',clientId:'fiction-client-1',type:'Reserva efetuada',fractions:[24]}],agents:[],finalPrices:{16:400000},priceHistory:{16:[{price:400000}]},statuses:{8:'Reservado',24:'Reservado'},salePrices:{8:100000,24:200000},saleCommissions:{},unavailableReasons:{},statusEventIds:{8:'fiction-reservation-8',24:'fiction-reservation-24'},salePriceEventIds:{8:'fiction-reservation-8',24:'fiction-reservation-24'},majucaImportKey:'fiction-import',majucaImportSummary:{preserved:true},futureMetadata:{preserved:true}});
const source=fs.readFileSync(require.resolve('../commercial.js'),'utf8'),end=source.lastIndexOf('})();');
const originalEnv={...process.env},originalFetch=global.fetch;
Object.assign(process.env,{COMMERCIAL_ACCESS_SECRET:'fiction-session-secret',CRM_GOOGLE_DEPLOYMENT_ID:'test-deployment',CRM_GOOGLE_SPREADSHEET_ID:'test-sheet',CRM_GOOGLE_CLIENT_ID:'fiction-client',CRM_GOOGLE_CLIENT_SECRET:'fiction-secret',CRM_GOOGLE_REFRESH_TOKEN:'fiction-refresh',CRM_GOOGLE_WRITES_ENABLED:'true',CRM_GOOGLE_TEST_WRITES_ENABLED:'true',VERCEL_ENV:'preview'});
let google,sourceCalls=[];
global.fetch=async(url,options)=>{
  assert.ok(['https://oauth2.googleapis.com/token','https://script.googleapis.com/v1/scripts/test-deployment:run'].includes(url),'Real network forbidden');
  if(url.includes('oauth2'))return Response.json({access_token:'fiction-token'});
  const call=JSON.parse(options.body);sourceCalls.push(call.function);
  try{return Response.json({done:true,response:{result:google.context[call.function](...call.parameters)}})}
  catch{return Response.json({done:true,error:{details:[{errorMessage:'Fictitious failure'}]}})}
};
function reset(data=base()){google=makeStore(clone(data));sourceCalls=[]}
function browser(storage=new Map()){
  const requests=[],messages=[],timers=[],issued=String(Date.now());
  const cookie='tv_commercial_access='+issued+'.'+createHmac('sha256',process.env.COMMERCIAL_ACCESS_SECRET).update(issued).digest('hex');
  let fault='',modal,onRead=()=>{};
  const document={readyState:'loading',addEventListener(){},getElementById(){return null},querySelector(){return null},body:{style:{},appendChild(){}},createElement(){const controls={};modal={style:{},remove(){},querySelector(key){return controls[key]||(controls[key]={})}};return modal}};
  const context={console,Date,AbortController,document,window:{THE_VIEW_CONFIG:{GOOGLE_SHEETS_WEBAPP_URL:'https://no-production.invalid/exec'},addEventListener(){}},localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},requestAnimationFrame(){},setTimeout(fn){timers.push(fn);return timers.length},clearTimeout(){},fetch:async(url,options={})=>{
    if(url==='data.json')return Response.json(JSON.parse(fs.readFileSync(require.resolve('../data.json'),'utf8')));
    assert.equal(url,'/api/commercial-data');
    const method=options.method||'GET',body=options.body?JSON.parse(options.body):undefined;
    if(method==='POST'&&fault==='timeout-before'){requests.push({method,body,status:0});throw Object.assign(Error('Fictitious timeout'),{name:'AbortError'})}
    const response={statusCode:200,setHeader(){},status(code){this.statusCode=code;return this},json(value){this.body=value;return this}};
    await api({method,body,headers:{host:'example.test',origin:'https://example.test',cookie,'content-type':'application/json','x-crm-read-ticket':options.headers?.['X-CRM-Read-Ticket']||''}},response);
    requests.push({method,body,status:response.statusCode});
    if(method==='GET')await onRead();
    if(method==='POST'&&fault==='timeout-after')throw Object.assign(Error('Fictitious lost acknowledgement'),{name:'AbortError'});
    return Response.json(response.body,{status:response.statusCode});
  }};
  vm.createContext(context);vm.runInContext(source.slice(0,end)+`el.dataStatus={textContent:''};el.globalErrorBox={textContent:'',classList:{remove(){}}};populate=()=>{};restoreCommercialContext=()=>{};renderAll=()=>{};activateCommercialView=()=>{};renderCommercialUx=()=>{};restoreCommercialScroll=()=>{};commercialUxToast=()=>{};renderSharedSyncStatus=()=>{};notifyUser=message=>globalThis.notify(message);confirmUser=async()=>true;globalThis.app={state,sharedSync,loadExcel,loadRemoteData,syncRemote,save,openSyncReconciliation,sharedStoreMayRegress};`+source.slice(end),context);
  context.notify=message=>messages.push(message);
  return{app:context.app,storage,requests,messages,timers,get modal(){return modal},set fault(value){fault=value},set onRead(fn){onRead=fn}};
}
function edit(fixture,suffix='local'){
  fixture.app.state.data.clients[0].notes='Fictitious '+suffix;
  fixture.app.state.data.events.push({id:'fiction-event-'+suffix,clientId:'fiction-client-0',type:'Outro',fractions:[],notes:'Fictitious'});
  fixture.app.save();
}
function protectedData(data){return clone({statuses:data.statuses,salePrices:data.salePrices,saleCommissions:data.saleCommissions,statusEventIds:data.statusEventIds,salePriceEventIds:data.salePriceEventIds,finalPrices:data.finalPrices,priceHistory:data.priceHistory,agents:data.agents,majucaImportKey:data.majucaImportKey,majucaImportSummary:data.majucaImportSummary,futureMetadata:data.futureMetadata})}
function assertUnique(data){assert.equal(new Set(data.events.map(item=>item.id)).size,data.events.length);assert.equal(new Set(data.clients.map(item=>item.id)).size,data.clients.length)}
let cases=0;
async function main(){
  // Exact incident: authenticated remote == confirmed base/revision; only local edits differ.
  reset();const first=browser();await first.app.loadExcel();const protectedBefore=protectedData(google.data);
  edit(first);const local=first.storage.get(KEY),revision=first.app.sharedSync.revision;
  const refreshed=browser(first.storage);await refreshed.app.loadExcel();
  assert.equal(refreshed.app.sharedSync.phase,'pending','Local pending edits are not a shared rollback');
  assert.equal(refreshed.app.sharedSync.verified,true);assert.equal(refreshed.app.sharedSync.revision,revision);
  assert.equal(refreshed.storage.get(KEY),local);assert.equal(refreshed.requests.filter(item=>item.method==='POST').length,0);
  assert.equal(await refreshed.app.syncRemote(),true);assert.equal(google.data.events.length,3);assertUnique(google.data);
  assert.deepEqual(protectedData(google.data),protectedBefore);
  const final=browser(refreshed.storage);await final.app.loadExcel();assert.equal(final.app.sharedSync.phase,'synced');assert.equal(final.requests.filter(item=>item.method==='POST').length,0);cases++;

  // Timeouts before/after persistence retain the exact request ID across refresh.
  for(const fault of ['timeout-before','timeout-after']){
    reset();const a=browser();await a.app.loadExcel();edit(a,fault);a.fault=fault;
    assert.equal(await a.app.syncRemote(),false);const pending=a.storage.get(KEY+'.pendingWrite.v1');assert.ok(pending);
    const b=browser(a.storage);await b.app.loadExcel();assert.equal(b.requests.filter(item=>item.method==='POST').length,0);
    if(fault==='timeout-before'){assert.equal(b.app.sharedSync.phase,'pending');assert.equal(b.storage.get(KEY+'.pendingWrite.v1'),pending);assert.equal(await b.app.syncRemote(),true);assert.equal(b.requests.at(-1).body.requestId,JSON.parse(pending).requestId)}
    else {assert.equal(b.app.sharedSync.phase,'synced');assert.ok([...b.storage].some(([key,value])=>key.startsWith(KEY+'.confirmedReadBackup.')&&JSON.parse(value).pendingWrite.requestId===JSON.parse(pending).requestId))}
    assertUnique(google.data);assert.equal(google.data.events.length,3);assert.deepEqual(protectedData(google.data),protectedBefore);cases++;
  }

  // Older request differs from newer local data: neither normal sync nor recovery may replay it.
  for(const fault of ['timeout-before','timeout-after']){
    reset();const a=browser();await a.app.loadExcel();edit(a,'older');a.fault=fault;assert.equal(await a.app.syncRemote(),false);
    const original=a.storage.get(KEY+'.pendingWrite.v1');edit(a,'newer');
    const local=a.storage.get(KEY),sourceBefore=JSON.stringify(google.data);
    const b=browser(a.storage);await b.app.loadExcel();
    assert.notEqual(b.app.sharedSync.error,'POSSIBLE_SHARED_ROLLBACK');assert.equal(b.app.sharedSync.phase,'conflict');
    assert.equal(b.app.sharedSync.error,'PENDING_REQUEST_REVIEW_REQUIRED');assert.equal(b.storage.get(KEY),local);
    const posts=b.requests.filter(item=>item.method==='POST').length;
    assert.equal(await b.app.syncRemote(),false);assert.equal(await b.app.syncRemote(true),false);
    assert.equal(b.requests.filter(item=>item.method==='POST').length,posts);assert.equal(b.storage.get(KEY+'.pendingWrite.v1'),original);assert.equal(JSON.stringify(google.data),sourceBefore);
    // A fresh read and explicit three-way reconciliation archive, never discard, the original.
    await b.app.loadRemoteData();b.app.openSyncReconciliation();assert.ok(b.modal);
    await b.modal.querySelector('[data-sync-merge]').onclick();
    assert.ok([...b.storage].some(([key,value])=>key.startsWith(KEY+'.conflictBackup.')&&JSON.parse(value).pendingWrite.requestId===JSON.parse(original).requestId));
    assert.equal(b.app.sharedSync.phase,'pending');assert.equal(await b.app.syncRemote(),true);
    assert.notEqual(b.requests.at(-1).body.requestId,JSON.parse(original).requestId);
    assert.equal(google.data.events.length,4);assert.equal(google.data.clients[0].notes,'Fictitious newer');
    assertUnique(google.data);assert.deepEqual(protectedData(google.data),protectedBefore);cases++;
  }

  // Real rollback and contradictory same-revision metadata remain blocked.
  reset(base(63));const rollback=browser();await rollback.app.loadExcel();const cached=rollback.storage.get(KEY);
  const old=clone(google.data);old.clients=old.clients.slice(0,24);
  google.sheets.get('Store').cells.set('2:2',JSON.stringify(old));
  await rollback.app.loadRemoteData();assert.equal(rollback.app.sharedSync.error,'POSSIBLE_SHARED_ROLLBACK');assert.equal(rollback.storage.get(KEY),cached);cases++;
  const meta=JSON.parse(rollback.storage.get(KEY+'.syncMeta.v1')),inconsistent=clone(meta.base);inconsistent.clients[0].notes='Fictitious inconsistency';
  assert.equal(rollback.app.sharedStoreMayRegress(meta.base,inconsistent,meta,meta.revision),true);cases++;

  // Two users, disjoint edits: stale CAS rejects, explicit merge preserves both.
  reset();const a=browser(),b=browser();await a.app.loadExcel();await b.app.loadExcel();
  edit(a,'user-a');b.app.state.data.clients[1].notes='Fictitious user B';b.app.save();
  assert.equal(await a.app.syncRemote(),true);assert.equal(await b.app.syncRemote(),false);
  assert.equal(b.app.sharedSync.error,'CONFLICT');assert.equal(b.app.sharedSync.httpStatus,409);
  assert.equal(b.requests.filter(item=>item.method==='POST').length,0,'A changed preflight revision blocks stale data before POST');
  await b.app.loadRemoteData();assert.equal(b.app.sharedSync.phase,'conflict');
  b.app.openSyncReconciliation();await b.modal.querySelector('[data-sync-merge]').onclick();
  assert.equal(await b.app.syncRemote(),true);assert.equal(google.data.clients[0].notes,'Fictitious user-a');assert.equal(google.data.clients[1].notes,'Fictitious user B');assertUnique(google.data);assert.deepEqual(protectedData(google.data),protectedBefore);cases++;

  // A change in source revision while the review is open blocks applying that review.
  reset();const reviewing=browser();await reviewing.app.loadExcel();edit(reviewing,'review-local');
  const remote=clone(google.data);remote.clients[1].notes='Fictitious remote';google.write({requestId:'fiction-review-remote',baseRevision:google.revision,data:remote});
  await reviewing.app.loadRemoteData();reviewing.app.openSyncReconciliation();const pendingAtOpen=reviewing.storage.get(KEY+'.pendingWrite.v1'),localAtOpen=reviewing.storage.get(KEY);
  const changed=clone(google.data);changed.clients[2].notes='Fictitious concurrent';google.write({requestId:'fiction-review-race',baseRevision:google.revision,data:changed});
  await reviewing.modal.querySelector('[data-sync-merge]').onclick();assert.equal(reviewing.app.sharedSync.verified,false);assert.equal(reviewing.storage.get(KEY),localAtOpen);assert.equal(reviewing.storage.get(KEY+'.pendingWrite.v1'),pendingAtOpen);cases++;
  console.log(JSON.stringify({cases,sameRevisionPending:true,olderRequestNeverReplayed:true,refreshWithoutWrites:true,timeoutsBeforeAndAfter:true,rollback63to24Blocked:true,casAndExplicitReconciliation:true,eventsUnique:true,reservationsPricesHistoryPreserved:true,realNetwork:false}));
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>{global.fetch=originalFetch;for(const key of Object.keys(process.env))if(!(key in originalEnv))delete process.env[key];Object.assign(process.env,originalEnv)});
