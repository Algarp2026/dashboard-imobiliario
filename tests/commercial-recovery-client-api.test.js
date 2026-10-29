const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),{createHmac}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const api=require('../api/commercial-data.js'),makeStore=require('./helpers/apps-script-store.js');
const originalEnv={...process.env},originalFetch=global.fetch,KEY='theView.crmCommercial.v2';
const clone=value=>JSON.parse(JSON.stringify(value));
const base={clients:[{id:'synthetic-client',name:'Fictitious client',preferences:{},fractions:[]}],events:[{id:'reservation-8',clientId:'synthetic-client',type:'Reserva efetuada',fractions:[8]},{id:'reservation-24',clientId:'synthetic-client',type:'Reserva efetuada',fractions:[24]}],agents:[],finalPrices:{16:400000},statuses:{8:'Reservado',24:'Reservado'},salePrices:{8:100000,24:200000},priceHistory:{16:[{price:400000}]},saleCommissions:{},unavailableReasons:{},statusEventIds:{8:'reservation-8',24:'reservation-24'},salePriceEventIds:{8:'reservation-8',24:'reservation-24'},unknown:{keep:true,padding:'x'.repeat(160000)}};
Object.assign(process.env,{COMMERCIAL_ACCESS_SECRET:'fictitious-recovery-secret',CRM_GOOGLE_DEPLOYMENT_ID:'test-deployment',CRM_GOOGLE_SPREADSHEET_ID:'test-sheet',CRM_GOOGLE_CLIENT_ID:'fictitious-client',CRM_GOOGLE_CLIENT_SECRET:'fictitious-secret',CRM_GOOGLE_REFRESH_TOKEN:'fictitious-refresh',CRM_GOOGLE_WRITES_ENABLED:'true',CRM_GOOGLE_TEST_WRITES_ENABLED:'true',VERCEL_ENV:'preview'});
let google=makeStore(base),loseResponse=false,readFailure='';
global.fetch=async(url,options)=>{
  assert.ok(['https://oauth2.googleapis.com/token','https://script.googleapis.com/v1/scripts/test-deployment:run'].includes(url),'External calls forbidden');
  if(url.includes('oauth2'))return Response.json({access_token:'fictitious-access-token'});
  const body=JSON.parse(options.body);
  if(readFailure&&body.function==='crmRead')return Response.json({done:true,response:{result:google.context.storeResponse_({ok:false,code:readFailure})}});
  try{return Response.json({done:true,response:{result:google.context[body.function](...body.parameters)}})}
  catch{return Response.json({done:true,error:{details:[{errorMessage:'Synthetic interruption'}]}})}
};
const source=process.env.CHECK_CLIENT_BASELINE?execFileSync('git',['show','fa876dc:commercial.js'],{encoding:'utf8'}):fs.readFileSync(require.resolve('../commercial.js'),'utf8');
const end=source.lastIndexOf('})();');
function browser(storage=new Map()){
  const issued=String(Date.now()),cookie='tv_commercial_access='+issued+'.'+createHmac('sha256',process.env.COMMERCIAL_ACCESS_SECRET).update(issued).digest('hex');
  const responses=[],messages=[];let modal;
  async function bridge(url,options={}){
    if(url==='data.json')return Response.json(JSON.parse(fs.readFileSync(require.resolve('../data.json'),'utf8')));
    assert.equal(url,'/api/commercial-data');
    const request={method:options.method||'GET',body:options.body?JSON.parse(options.body):undefined,headers:{host:'example.test',origin:'https://example.test',cookie,'content-type':'application/json','x-crm-read-ticket':options.headers?.['X-CRM-Read-Ticket']||''}};
    const response={statusCode:200,setHeader(){},status(value){this.statusCode=value;return this},json(body){this.body=body;return this}};
    await api(request,response);responses.push({method:request.method,status:response.statusCode,body:clone(response.body)});
    if(loseResponse&&request.method==='POST'){loseResponse=false;throw Object.assign(new Error('Lost HTTP acknowledgement'),{name:'AbortError'})}
    return Response.json(response.body,{status:response.statusCode});
  }
  const document={readyState:'loading',addEventListener(){},querySelector(){return null},getElementById(){return null},createElement(){const controls={};modal={style:{},remove(){},querySelector(key){return controls[key]||(controls[key]={})}};return modal},body:{style:{},appendChild(){}}};
  const context={console,Date,AbortController,fetch:bridge,document,window:{THE_VIEW_CONFIG:{GOOGLE_SHEETS_WEBAPP_URL:'https://never-contact-google.invalid/exec'},addEventListener(){}},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},requestAnimationFrame(){},setTimeout(){return 1},clearTimeout(){}};
  vm.createContext(context);vm.runInContext(source.slice(0,end)+`el.dataStatus={textContent:''};el.globalErrorBox={textContent:'',classList:{remove(){}}};populate=()=>{};restoreCommercialContext=()=>{};renderAll=()=>{};activateCommercialView=()=>{};renderCommercialUx=()=>{};restoreCommercialScroll=()=>{};commercialUxToast=()=>{};renderSharedSyncStatus=()=>{};notifyUser=message=>globalThis.message(message);confirmUser=async()=>true;globalThis.app={state,sharedSync,loadExcel,loadRemoteData,save,syncRemote,openSyncReconciliation};`+source.slice(end),context);
  context.message=message=>messages.push(message);
  return{app:context.app,storage,responses,messages,get modal(){return modal}};
}
async function main(){
  const a=browser();await a.app.loadExcel();
  a.app.state.data.finalPrices[16]=410000;a.app.state.data.priceHistory[16].push({price:410000});a.app.save();
  google.failWrite('pointer-before');assert.equal(await a.app.syncRemote(),false);
  assert.equal(a.responses.at(-1).status,502);if(!process.env.CHECK_CLIENT_BASELINE)assert.equal(a.app.sharedSync.httpStatus,502);
  const original=a.storage.get(KEY+'.pendingWrite.v1'),local=a.storage.get(KEY);
  assert.ok(original);assert.equal(google.data.finalPrices[16],400000);
  await a.app.loadRemoteData();assert.equal(a.responses.at(-1).status,200);
  assert.equal(a.responses.at(-1).body.pendingWrite.state,'pending');
  assert.equal(a.app.sharedSync.verified,false,'Incomplete remote writes must block automatic reconciliation');
  if(process.env.CHECK_CLIENT_BASELINE){
    a.app.openSyncReconciliation();await a.modal.querySelector('[data-sync-merge]').onclick();
    assert.equal(a.storage.get(KEY+'.pendingWrite.v1'),original,'Reconciliation must retain the request needed by an incomplete source write');return;
  }
  assert.equal(a.app.sharedSync.error,'WRITE_INCOMPLETE');
  assert.equal(a.storage.get(KEY+'.pendingWrite.v1'),original);assert.equal(a.storage.get(KEY),local);
  const count=a.responses.length;a.app.openSyncReconciliation();assert.ok(a.messages.at(-1).includes('gravação incompleta'));assert.equal(a.responses.length,count);

  // Refresh retains the exact original recovery ID and data; no automatic POST.
  const refreshed=browser(a.storage);await refreshed.app.loadExcel();
  assert.equal(refreshed.responses.filter(r=>r.method==='POST').length,0);
  assert.equal(refreshed.storage.get(KEY+'.pendingWrite.v1'),original);
  const operation=JSON.parse(original);
  const foreign=await apiCall({action:'save',data:operation.data,baseRevision:operation.baseRevision,requestId:'foreign-request-id'},a.responses.at(-1).body.readTicket);
  assert.equal(foreign.statusCode,503);assert.equal(foreign.body.code,'WRITE_INCOMPLETE');
  const wrong=await apiCall({...operation,action:'recover',requestId:'wrong-recovery-id'});
  assert.equal(wrong.statusCode,409);assert.equal(wrong.body.code,'CONFLICT');
  assert.equal(refreshed.storage.get(KEY+'.pendingWrite.v1'),original);
  google.failWrite('');assert.equal(await refreshed.app.syncRemote(true),true);
  assert.equal(refreshed.responses.at(-1).status,200);assert.equal(refreshed.storage.has(KEY+'.pendingWrite.v1'),false);
  assert.equal(google.data.finalPrices[16],410000);assert.equal(google.data.priceHistory[16].length,2);
  assert.deepEqual(google.data.statuses,base.statuses);assert.deepEqual(google.data.events,base.events);
  assert.deepEqual(google.data.salePrices,base.salePrices);assert.deepEqual(google.data.saleCommissions,base.saleCommissions);

  // A committed write with a lost HTTP response is confirmed by the same request.
  refreshed.app.state.data.clients[0].phone='synthetic';refreshed.app.save();loseResponse=true;
  assert.equal(await refreshed.app.syncRemote(),false);const receipt=refreshed.storage.get(KEY+'.pendingWrite.v1');
  const backups=google.sheets.get('BackupsVersions').getLastRow();assert.ok(receipt);
  assert.equal(await refreshed.app.syncRemote(true),true);assert.equal(google.sheets.get('BackupsVersions').getLastRow(),backups);

  // A local-only reconciliation archives the obsolete request before replacing it.
  refreshed.app.state.data.clients[0].email='synthetic@example.test';refreshed.app.save();
  loseResponse=true;google.properties.CRM_API_WRITES_ENABLED='false';assert.equal(await refreshed.app.syncRemote(),false);google.properties.CRM_API_WRITES_ENABLED='true';loseResponse=false;
  const rejected=refreshed.storage.get(KEY+'.pendingWrite.v1');assert.ok(rejected);
  await refreshed.app.loadRemoteData();refreshed.app.openSyncReconciliation();
  await refreshed.modal.querySelector('[data-sync-merge]').onclick();
  const backup=[...refreshed.storage].filter(([key])=>key.startsWith(KEY+'.conflictBackup.')).at(-1);
  assert.deepEqual(JSON.parse(backup[1]).pendingWrite,JSON.parse(rejected));
  assert.equal(refreshed.storage.has(KEY+'.pendingWrite.v1'),false);
  assert.equal(await refreshed.app.syncRemote(),true);
  assert.equal(google.data.clients[0].email,'synthetic@example.test');
  const final=browser(refreshed.storage);await final.app.loadExcel();assert.equal(final.app.sharedSync.phase,'synced');
  // New retryable source failures preserve the exact local data and pending request,
  // including refresh, without an automatic retry or recovery.
  const originalPending=JSON.stringify({action:'save',requestId:'fiction-original-different-local',baseRevision:final.app.sharedSync.revision,data:clone(final.app.state.data)});
  final.storage.set(KEY+'.pendingWrite.v1',originalPending);
  final.app.state.data.clients[0].notes='Fictitious pending local change';final.app.save();
  for(readFailure of ['SOURCE_BUSY','SOURCE_TIMEOUT']){
    const sourceBefore=JSON.stringify(google.data);
    assert.equal(await final.app.syncRemote(true),false);
    const pending=final.storage.get(KEY+'.pendingWrite.v1'),local=final.storage.get(KEY);
    assert.equal(pending,originalPending);assert.equal(final.responses.at(-1).status,503);assert.equal(final.responses.at(-1).body.code,readFailure);
    const reload=browser(final.storage);await reload.app.loadExcel();
    assert.equal(reload.responses.filter(response=>response.method==='POST').length,0);
    assert.equal(reload.storage.get(KEY+'.pendingWrite.v1'),pending);assert.equal(reload.storage.get(KEY),local);
    assert.equal(JSON.stringify(google.data),sourceBefore);
  }
  readFailure='';
  console.log(JSON.stringify({httpStatuses:[200,409,503,502],refreshRecovery:true,exactRequestPreserved:true,reconciliationBlockedUntilRecovery:true,reconciledRequestArchived:true,lostAcknowledgementIdempotent:true,reservations8and24Preserved:true,busyAndTimeoutPreserveLocalAndPending:true,realNetwork:false}));
}
async function apiCall(body,ticket){
  const issued=String(Date.now()),cookie='tv_commercial_access='+issued+'.'+createHmac('sha256',process.env.COMMERCIAL_ACCESS_SECRET).update(issued).digest('hex');
  const request={method:'POST',body,headers:{host:'example.test',origin:'https://example.test',cookie,'content-type':'application/json','x-crm-read-ticket':ticket||''}};
  const response={statusCode:200,setHeader(){},status(value){this.statusCode=value;return this},json(body){this.body=body;return this}};
  if(body.action==='save'){
    const store=require('../server/commercial-store.js');request.headers['x-crm-read-ticket']=store.ticket(request,body.baseRevision);
  }
  await api(request,response);return response;
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>{global.fetch=originalFetch;for(const key of Object.keys(process.env))if(!(key in originalEnv))delete process.env[key];Object.assign(process.env,originalEnv)});
