'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createHmac}=require('node:crypto'),{execFileSync}=require('node:child_process');
const makeStore=require('./helpers/apps-script-store.js'),api=require('../api/commercial-data.js');
const clone=x=>JSON.parse(JSON.stringify(x)),KEY='theView.crmCommercial.v2';
const base={clients:[{id:'fiction-a',name:'Fictitious A'},{id:'fiction-b',name:'Fictitious B'}],events:[],agents:[],finalPrices:{8:400000,24:410000},priceHistory:{8:[{price:400000}]},statuses:{8:'Reservado',24:'Reservado'},salePrices:{},saleCommissions:{},unavailableReasons:{},statusEventIds:{},salePriceEventIds:{},unknown:{keep:true}};
const savedEnv={...process.env},savedFetch=global.fetch,savedNow=Date.now,savedLog=console.log;
Object.assign(process.env,{COMMERCIAL_ACCESS_SECRET:'fiction-secret',CRM_GOOGLE_DEPLOYMENT_ID:'test-deployment',CRM_GOOGLE_SPREADSHEET_ID:'test-sheet',CRM_GOOGLE_CLIENT_ID:'fiction-client',CRM_GOOGLE_CLIENT_SECRET:'fiction-secret',CRM_GOOGLE_REFRESH_TOKEN:'fiction-token',CRM_GOOGLE_WRITES_ENABLED:'true',CRM_GOOGLE_TEST_WRITES_ENABLED:'true',VERCEL_ENV:'preview'});
let now=savedNow(),google;Date.now=()=>now;console.log=()=>{};
global.fetch=async(url,options)=>{
  if(url==='https://oauth2.googleapis.com/token')return Response.json({access_token:'fiction-token'});
  assert.equal(url,'https://script.googleapis.com/v1/scripts/test-deployment:run','No real network');
  const call=JSON.parse(options.body);return Response.json({done:true,response:{result:google.context[call.function](...call.parameters)}});
};
const current=fs.readFileSync(require.resolve('../commercial.js'),'utf8');
const previous=execFileSync('git',['show','658da6f:commercial.js'],{encoding:'utf8'});
function browser(source=current,resetStore=true,sharedStorage=null){
  if(resetStore)google=makeStore(clone(base));const storage=sharedStorage||new Map(),requests=[];
  let issued=now,fault='',afterRead=()=>{},afterWrite=()=>{};
  const cookie=()=>issued+'.'+createHmac('sha256','fiction-secret').update(String(issued)).digest('hex');
  const document={readyState:'loading',addEventListener(){},getElementById(){return null},querySelector(){return null}};
  const context={console,Date,AbortController,document,window:{THE_VIEW_CONFIG:{GOOGLE_SHEETS_WEBAPP_URL:'https://isolated.invalid/exec'},addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){},fetch:async(url,options={})=>{
    if(url==='data.json')return Response.json([]);
    assert.equal(url,'/api/commercial-data');const method=options.method||'GET',body=options.body?JSON.parse(options.body):undefined;
    const response={statusCode:200,setHeader(){},status(x){this.statusCode=x;return this},json(x){this.body=x;return this}};
    if(method==='POST'&&fault==='READ_REQUIRED'){response.statusCode=403;response.body={ok:false,code:'READ_REQUIRED'}}
    else await api({method,body,headers:{host:'fixture.test',origin:fault==='INVALID_ORIGIN'?'https://foreign.invalid':'https://fixture.test',cookie:'tv_commercial_access='+cookie(),'content-type':'application/json','x-crm-read-ticket':options.headers?.['X-CRM-Read-Ticket']||''}},response);
    requests.push({method,status:response.statusCode,code:response.body.code,body,ticket:options.headers?.['X-CRM-Read-Ticket']});
    if(method==='GET')await afterRead();
    if(method==='POST')await afterWrite();
    if(method==='POST'&&fault==='lost-response')throw Object.assign(Error('Fictitious lost response'),{name:'AbortError'});
    return Response.json(response.body,{status:response.statusCode});
  }};
  vm.createContext(context);const end=source.lastIndexOf('})();');
  vm.runInContext(source.slice(0,end)+`renderSharedSyncStatus=()=>{};renderCommercialRemoteUpdate=()=>{};globalThis.app={state,sharedSync,loadRemoteData,syncRemote,save,requestCommercialData,reconcileSharedData,draft(flag){commercialDraftGuard={editing:()=>flag,modified:()=>flag,version:()=>flag?1:0}}};`+source.slice(end),context);
  const app=context.app;
  return{app,storage,requests,async init(){await app.loadRemoteData();app.sharedSync.initialized=true},edit(){app.state.data.clients[0].notes='Fictitious edit';app.save()},session(value=now){issued=value},set fault(value){fault=value},set afterRead(fn){afterRead=fn},set afterWrite(fn){afterWrite=fn}};
}
async function main(){
  const old=browser(previous);await old.init();old.edit();now+=3600001;
  assert.equal(await old.app.syncRemote(),false);assert.equal(old.requests.at(-1).code,'READ_REQUIRED');
  let cases=1;
  for(const scenario of ['fresh','expired','invalid','new-session']){
    const b=browser();await b.init();b.edit();
    if(scenario==='expired')now+=3600001;
    if(scenario==='invalid')b.app.sharedSync.ticket='0.invalid';
    if(scenario==='new-session'){now+=1;b.session()}
    assert.equal(await b.app.syncRemote(),true,scenario);assert.equal(b.requests.at(-1).status,200);
    assert.equal(google.data.clients[0].notes,'Fictitious edit');assert.deepEqual(google.data.statuses,base.statuses);cases++;
  }
  {
    const b=browser();await b.init();b.edit();b.afterRead=()=>{const data=google.data;data.clients[1].notes='Other user';google.write({requestId:'fiction-other-user',baseRevision:google.revision,data})};
    assert.equal(await b.app.syncRemote(),false);assert.equal(b.app.sharedSync.phase,'conflict');assert.equal(b.requests.at(-1).status,409,'A source change after the fresh read still reaches real API CAS');assert.equal(google.data.clients[0].notes,undefined);assert.equal(b.app.state.data.clients[0].notes,'Fictitious edit');cases++;
  }
  for(const fault of ['READ_REQUIRED','INVALID_ORIGIN']){
    const b=browser();await b.init();b.edit();b.fault=fault;assert.equal(await b.app.syncRemote(),false);
    const posts=b.requests.filter(x=>x.method==='POST');assert.equal(posts.length,fault==='READ_REQUIRED'?2:1);
    assert.equal(new Set(posts.map(x=>x.body.requestId)).size,1);assert.ok(b.storage.has(KEY+'.pendingWrite.v1'));assert.deepEqual(google.data,base);cases++;
  }
  {
    const b=browser();await b.init();b.edit();b.session(now-9*3600000);assert.equal(await b.app.syncRemote(),false);assert.equal(b.app.sharedSync.error,'UNAUTHENTICATED');assert.equal(b.requests.filter(x=>x.method==='POST').length,0);cases++;
  }
  {
    const b=browser();await b.init();b.edit();b.fault='lost-response';assert.equal(await b.app.syncRemote(),false);const original=b.storage.get(KEY+'.pendingWrite.v1');assert.ok(original);
    b.fault='';assert.equal(await b.app.syncRemote(true),true);assert.equal(b.requests.at(-1).body.requestId,JSON.parse(original).requestId);assert.equal(google.data.clients[0].notes,'Fictitious edit');cases++;
  }
  {
    const a=browser();await a.init();const b=browser(current,false);await b.init();a.edit();assert.equal(await a.app.syncRemote(),true);
    const before=b.requests.filter(x=>x.method==='POST').length;await b.app.loadRemoteData({automatic:true});
    assert.equal(b.app.state.data.clients[0].notes,'Fictitious edit');assert.equal(b.requests.filter(x=>x.method==='POST').length,before);
    b.app.state.data.clients[1].notes='Fictitious reverse';b.app.save();assert.equal(await b.app.syncRemote(),true);await a.app.loadRemoteData({automatic:true});assert.equal(a.app.state.data.clients[1].notes,'Fictitious reverse');cases++;
  }
  for(const [source,expected]of [[previous,'pending'],[current,'synced']]){
    const a=browser(source);await a.init();const b=browser(source,false,a.storage);
    a.edit();assert.equal(await a.app.syncRemote(),true);await b.init();
    assert.equal(b.app.sharedSync.phase,expected,'Each tab must retain its own confirmed baseline');
    if(source===current){assert.equal(b.app.state.data.clients[0].notes,'Fictitious edit');assert.equal(b.requests.filter(r=>r.method==='POST').length,0)}cases++;
  }
  {
    const a=browser();await a.init();const b=browser(current,false);await b.init();const before=clone(b.app.state.data);b.app.draft(true);a.edit();assert.equal(await a.app.syncRemote(),true);
    await b.app.loadRemoteData({automatic:true});assert.deepEqual(clone(b.app.state.data),before);assert.equal(b.app.sharedSync.incoming,true);
    b.app.draft(false);await b.app.loadRemoteData({automatic:true});assert.equal(b.app.state.data.clients[0].notes,'Fictitious edit');cases++;
  }
  {
    const a=browser();await a.init();const b=browser(current,false);await b.init();a.edit();b.app.state.data.clients[1].notes='Independent local';b.app.save();assert.equal(await a.app.syncRemote(),true);
    const local=clone(b.app.state.data);await b.app.loadRemoteData({automatic:true});assert.deepEqual(clone(b.app.state.data),local);assert.equal(b.app.sharedSync.phase,'conflict');assert.equal(b.requests.filter(x=>x.method==='POST').length,0);
    const merged=b.app.reconcileSharedData(b.app.sharedSync.base,b.app.state.data,b.app.sharedSync.remote.data);assert.equal(merged.conflicts.length,0);assert.equal(merged.data.clients[0].notes,'Fictitious edit');assert.equal(merged.data.clients[1].notes,'Independent local');cases++;
  }
  {
    const b=browser();await b.init();const before=b.requests.length;await Promise.all([b.app.requestCommercialData(),b.app.requestCommercialData(),b.app.requestCommercialData()]);assert.equal(b.requests.length,before+1);cases++;
  }
  {
    const a=browser();await a.init();const b=browser(current,false);await b.init();a.edit();a.fault='lost-response';assert.equal(await a.app.syncRemote(),false);const original=a.storage.get(KEY+'.pendingWrite.v1');
    await a.app.loadRemoteData({automatic:true});assert.equal(a.storage.get(KEY+'.pendingWrite.v1'),original);assert.equal(a.requests.filter(x=>x.method==='POST').length,1);cases++;
  }
  {
    const b=browser();await b.init();b.edit();const newer=clone(b.app.state.data);newer.clients[1].notes='Fictitious other tab draft';
    b.afterWrite=()=>b.storage.set(KEY,JSON.stringify(newer));
    assert.equal(await b.app.syncRemote(),false);assert.equal(b.app.sharedSync.error,'PENDING_REQUEST_REVIEW_REQUIRED');
    assert.deepEqual(JSON.parse(b.storage.get(KEY)),newer);assert.ok(b.storage.get(KEY+'.pendingWrite.v1'));
    assert.equal(google.data.clients[0].notes,'Fictitious edit');assert.equal(google.data.clients[1].notes,undefined);cases++;
  }
  savedLog(JSON.stringify({cases,baselineReadRequiredReproduced:true,actualLocalApi:true,realGoogle:false}));
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{Date.now=savedNow;console.log=savedLog;global.fetch=savedFetch;for(const key of Object.keys(process.env))if(!(key in savedEnv))delete process.env[key];Object.assign(process.env,savedEnv)});
