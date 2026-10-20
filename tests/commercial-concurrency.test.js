const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),{createHmac}=require('node:crypto');
const api=require('../api/commercial-data.js'),makeStore=require('./helpers/apps-script-store.js');
const originalEnv={...process.env},originalFetch=global.fetch,KEY='theView.crmCommercial.v2';
const initial={clients:[{id:'test-client',name:'Fictitious concurrency client',phone:'original',email:'original@example.test',preferences:{},fractions:[]}],events:[],agents:[],finalPrices:{1:700000},statuses:{},salePrices:{},priceHistory:{},saleCommissions:{},unavailableReasons:{},statusEventIds:{},salePriceEventIds:{},unknown:{preserved:true}};
Object.assign(process.env,{COMMERCIAL_ACCESS_SECRET:'fictitious-concurrency-secret',CRM_GOOGLE_DEPLOYMENT_ID:'test-deployment',CRM_GOOGLE_SPREADSHEET_ID:'test-sheet',CRM_GOOGLE_CLIENT_ID:'fictitious-client',CRM_GOOGLE_CLIENT_SECRET:'fictitious-secret',CRM_GOOGLE_REFRESH_TOKEN:'fictitious-refresh',CRM_GOOGLE_WRITES_ENABLED:'true',CRM_GOOGLE_TEST_WRITES_ENABLED:'true',VERCEL_ENV:'preview'});
initial.unknown.padding='x'.repeat(160000);
const google=makeStore(initial);
global.fetch=async(url,options)=>{
  assert.ok(['https://oauth2.googleapis.com/token','https://script.googleapis.com/v1/scripts/test-deployment:run'].includes(url));
  if(url.includes('oauth2'))return Response.json({access_token:'fictitious-access-token'});
  const body=JSON.parse(options.body);return Response.json({done:true,response:{result:google.context[body.function](...body.parameters)}});
};
const source=fs.readFileSync(require.resolve('../commercial.js'),'utf8'),end=source.lastIndexOf('})();');
function browser(age){
  const issued=String(Date.now()-age),cookie='tv_commercial_access='+issued+'.'+createHmac('sha256',process.env.COMMERCIAL_ACCESS_SECRET).update(issued).digest('hex'),storage=new Map(),responses=[];
  async function bridge(url,options={}){
    if(url==='data.json')return Response.json(JSON.parse(fs.readFileSync(require.resolve('../data.json'),'utf8')));
    assert.equal(url,'/api/commercial-data');const request={method:options.method||'GET',body:options.body?JSON.parse(options.body):undefined,headers:{host:'example.test',origin:'https://example.test',cookie,'content-type':'application/json','x-crm-read-ticket':options.headers?.['X-CRM-Read-Ticket']||''}};
    const response={statusCode:200,setHeader(){},status(value){this.statusCode=value;return this},json(body){this.body=body;return this}};await api(request,response);responses.push({method:request.method,status:response.statusCode,code:response.body.code,revision:response.body.revision});return Response.json(response.body,{status:response.statusCode});
  }
  const context={console,Date,AbortController,fetch:bridge,document:{readyState:'loading',addEventListener(){},querySelector(){return null}},window:{THE_VIEW_CONFIG:{GOOGLE_SHEETS_WEBAPP_URL:'https://never-contact-google.invalid/exec'},addEventListener(){}},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},requestAnimationFrame(){},setTimeout(){return 1},clearTimeout(){}};
  vm.createContext(context);vm.runInContext(source.slice(0,end)+`el.dataStatus={textContent:''};el.globalErrorBox={textContent:'',classList:{remove(){}}};populate=()=>{};restoreCommercialContext=()=>{};renderAll=()=>{};activateCommercialView=()=>{};renderCommercialUx=()=>{};restoreCommercialScroll=()=>{};commercialUxToast=()=>{};globalThis.app={state,sharedSync,loadExcel,loadRemoteData,save,syncRemote,reconcileSharedData};`+source.slice(end),context);
  return{api:context.app,storage,responses,bridge};
}
async function main(){
  const a=browser(1000),b=browser(2000),observer=browser(3000);await Promise.all([a.api.loadExcel(),b.api.loadExcel(),observer.api.loadExcel()]);const revision=a.api.sharedSync.revision,oldTicket=a.api.sharedSync.ticket;
  assert.equal(revision,b.api.sharedSync.revision);assert.equal(revision,google.revision);assert.equal(a.api.sharedSync.verified,true);assert.equal(b.api.sharedSync.verified,true);
  b.api.state.data.clients[0].phone='first-user';b.api.save();assert.equal(await b.api.syncRemote(),true);assert.equal(b.responses.at(-1).status,200);const afterFirst=JSON.stringify(google.data);
  await observer.api.loadRemoteData();assert.equal(observer.api.sharedSync.phase,'synced');assert.equal(observer.api.sharedSync.verified,true);
  assert.equal(observer.api.state.data.clients[0].phone,'first-user');assert.equal(JSON.parse(observer.storage.get(KEY)).clients[0].phone,'first-user');
  assert.equal(observer.api.sharedSync.revision,google.revision);assert.equal(observer.responses.filter(r=>r.method==='POST').length,0);
  assert.equal(JSON.parse(observer.storage.get(KEY+'.backupBeforeRemoteLoad')).data.clients[0].phone,'original');
  assert.equal(observer.api.state.data.unknown.padding.length,160000);assert.equal(JSON.stringify(google.data),afterFirst);
  a.api.state.data.clients[0].email='second-user@example.test';a.api.save();assert.equal(await a.api.syncRemote(),false);assert.equal(a.responses.at(-1).status,409);assert.equal(JSON.stringify(google.data),afterFirst);assert.equal(a.api.state.data.clients[0].email,'second-user@example.test');assert.equal(JSON.parse(a.storage.get(KEY)).clients[0].email,'second-user@example.test');assert.ok(a.storage.has(KEY+'.pendingSync'));
  const manipulated=await a.bridge('/api/commercial-data',{method:'POST',headers:{'X-CRM-Read-Ticket':oldTicket},body:JSON.stringify({action:'save',requestId:'stale-reconciliation',baseRevision:google.revision,data:a.api.state.data})});assert.equal(manipulated.status,403);assert.equal(JSON.stringify(google.data),afterFirst);
  const base=a.api.sharedSync.base;await a.api.loadRemoteData();assert.equal(a.api.sharedSync.phase,'conflict');const remote=a.api.sharedSync.remote,merge=a.api.reconcileSharedData(base,a.api.state.data,remote.data);assert.equal(merge.conflicts.length,0);assert.equal(merge.data.clients[0].phone,'first-user');assert.equal(merge.data.clients[0].email,'second-user@example.test');assert.equal(JSON.stringify(google.data),afterFirst);
  a.api.state.data=merge.data;Object.assign(a.api.sharedSync,{base:remote.data,revision:remote.revision,ticket:remote.ticket,verified:true,canWrite:true,phase:'pending'});a.storage.delete(KEY+'.pendingWrite.v1');a.api.save();
  b.api.state.data.clients[0].phone='first-user-newer';b.api.save();assert.equal(await b.api.syncRemote(),true);const latest=JSON.stringify(google.data);
  assert.equal(await a.api.syncRemote(),false);assert.equal(a.responses.at(-1).status,409);assert.equal(JSON.stringify(google.data),latest);assert.equal(JSON.parse(a.storage.get(KEY)).clients[0].email,'second-user@example.test');
  assert.ok(google.trace.filter(item=>['write','rows','append'].includes(item.type)).every(item=>item.held),'Every durable mutation must hold the writer lock');
  assert.ok(google.trace.some(item=>item.type==='read'&&!item.held),'Snapshot reads must not serialize with writers');
  console.log(JSON.stringify({sameInitialRevision:revision,cleanBrowserReceivesRemoteEdit:true,observerWrites:0,firstStatus:200,staleStatus:409,firstDataIntact:true,secondLocalCachePreserved:true,revisionManipulationStatus:403,afterReconciliationRaceStatus:409,scriptLockChecked:true,visualSimulation:false,realGoogle:false}));
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>{global.fetch=originalFetch;for(const key of Object.keys(process.env))if(!(key in originalEnv))delete process.env[key];Object.assign(process.env,originalEnv)});
