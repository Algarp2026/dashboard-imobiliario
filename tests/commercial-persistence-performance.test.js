'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),Module=require('node:module');
const {execFileSync}=require('node:child_process'),{createHmac}=require('node:crypto');
const makeStore=require('./helpers/apps-script-store.js'),api=require('../api/commercial-data.js');
const adapter=require('../server/commercial-store.js');
const clone=x=>JSON.parse(JSON.stringify(x)),BASE='c323ce9';
const base={clients:Array.from({length:65},(_,i)=>({id:'fiction-'+i,name:'PRIVATE_FICTION_NAME',notes:'x'.repeat(2400)})),events:[{id:'fiction-reservation-8',clientId:'fiction-0',fractions:[8]},{id:'fiction-reservation-24',clientId:'fiction-1',fractions:[24]}],agents:[{id:'fiction-agent'}],finalPrices:{16:400000},statuses:{8:'Reservado',24:'Reservado'},salePrices:{8:100000,24:200000},priceHistory:{16:[{price:400000}]},saleCommissions:{},unavailableReasons:{},statusEventIds:{8:'fiction-reservation-8',24:'fiction-reservation-24'},salePriceEventIds:{8:'fiction-reservation-8',24:'fiction-reservation-24'},unknown:{keep:true}};
assert.ok(JSON.stringify(base).length>150000);
const next=clone(base);next.clients[0].notes='Fictitious edit';
const savedEnv={...process.env},savedFetch=global.fetch,savedLog=console.log;
Object.assign(process.env,{COMMERCIAL_ACCESS_SECRET:'fixture-session',CRM_GOOGLE_DEPLOYMENT_ID:'test-deployment',CRM_GOOGLE_SPREADSHEET_ID:'test-sheet',CRM_GOOGLE_CLIENT_ID:'fixture-client',CRM_GOOGLE_CLIENT_SECRET:'PRIVATE_OAUTH_SECRET',CRM_GOOGLE_REFRESH_TOKEN:'PRIVATE_REFRESH_TOKEN',CRM_GOOGLE_WRITES_ENABLED:'true',CRM_GOOGLE_TEST_WRITES_ENABLED:'true',VERCEL_ENV:'preview'});
const logs=[],allLogs=[];const record=line=>{const value=JSON.parse(line);logs.push(value);allLogs.push(value)};console.log=record;
let google,mode='',oauth=0,executions=[],virtualMs=0,observe=false,flushes=0;
const sheets=()=>JSON.stringify([...google.sheets].map(([name,sheet])=>[name,[...sheet.cells]]));
const sourceCode=execFileSync('git',['show',BASE+':google_apps_script.gs'],{encoding:'utf8'});
function reset(old=false){
  virtualMs=0;observe=false;mode='';oauth=0;executions=[];flushes=0;
  google=makeStore(clone(base),{console:{log:record},onStep(name){if(observe&&name==='flush')flushes++;if(observe&&(/^(before):(read|value|rows|clear|append):/.test(name)||name==='flush'||name==='open'))virtualMs+=5}});
  if(old)vm.runInContext(sourceCode,google.context);
  const clock=class extends Date{constructor(...args){super(...(args.length?args:[Date.UTC(2026,9,1)+virtualMs]))}static now(){return Date.UTC(2026,9,1)+virtualMs}};
  google.context.Date=clock;
  assert.equal(google.write({requestId:'fiction-seed',baseRevision:google.revision,data:clone(base)}).persisted,true);
  google.trace.length=0;logs.length=0;virtualMs=0;observe=true;
}
global.fetch=async(url,options)=>{
  assert.ok(['https://oauth2.googleapis.com/token','https://script.googleapis.com/v1/scripts/test-deployment:run'].includes(url),'No external network allowed');
  assert.equal(options.redirect,'manual');
  if(url.includes('oauth2')){
    oauth++;virtualMs+=20;
    if(mode==='oauth-400')return Response.json({error:'invalid_grant',private:'PRIVATE_OAUTH_SECRET'},{status:400});
    if(mode==='oauth-timeout')throw Object.assign(Error('PRIVATE_OAUTH_SECRET'),{name:'TimeoutError'});
    return Response.json({access_token:'PRIVATE_ACCESS_TOKEN'});
  }
  const call=JSON.parse(options.body),writing=call.function!=='crmRead';
  executions.push({function:call.function,probe:call.parameters[0].capabilitiesOnly===true});virtualMs+=30;
  if(mode==='execution-502')return Response.json({error:{message:'PRIVATE_FICTION_NAME'}},{status:502});
  if(mode==='execution-403')return Response.json({error:{}},{status:403});
  if(mode==='body-timeout')return {ok:true,status:200,headers:new Headers({'content-type':'application/json'}),json:async()=>{throw Object.assign(Error('PRIVATE_FICTION_NAME'),{name:'TimeoutError'})}};
  if(mode==='execution-error')return Response.json({done:true,error:{message:'PRIVATE_FICTION_NAME'}});
  if(mode==='script-error')return Response.json({done:true,error:{details:[{'@type':'type.googleapis.com/google.apps.script.v1.ExecutionError',errorMessage:'PRIVATE_FICTION_NAME'}]}});
  if(writing&&mode==='before-write-timeout')throw Object.assign(Error('Lost'),{name:'TimeoutError'});
  try{
    const result=google.context[call.function](...call.parameters);
    if(mode==='bad-probe'&&call.parameters[0].capabilitiesOnly)result.capabilities.pendingWriteDiagnostics=0;
    if(writing&&mode==='after-write-timeout')throw Object.assign(Error('Lost confirmation'),{name:'TimeoutError'});
    return Response.json({done:true,response:{result}});
  }catch(error){if(error.name==='TimeoutError')throw error;return Response.json({done:true,error:{details:[{'@type':'type.googleapis.com/google.apps.script.v1.ExecutionError',errorMessage:'PRIVATE_FICTION_NAME'}]}})}
};
const issued=String(Date.now()),cookie='tv_commercial_access='+issued+'.'+createHmac('sha256','fixture-session').update(issued).digest('hex');
async function invoke(method='GET',body,ticket,handler=api){
  const response={statusCode:200,headers:{},setHeader(key,value){this.headers[key]=value},status(code){this.statusCode=code;return this},json(value){this.body=value;return this}};
  await handler({method,body,headers:{host:'fixture.test',origin:'https://fixture.test',cookie,'content-type':'application/json','x-crm-read-ticket':ticket||''}},response);return response;
}
const op=read=>({action:'save',requestId:'fiction-operation',baseRevision:read.body.revision,data:clone(next)});
function oldModule(path,store){
  const filename=require.resolve('../'+path),instance=new Module(filename,module);instance.filename=filename;instance.paths=module.paths;
  const normal=instance.require.bind(instance);instance.require=name=>name==='../server/commercial-store.js'?store:normal(name);
  instance._compile(execFileSync('git',['show',BASE+':'+path],{encoding:'utf8'}),filename);return instance.exports;
}
async function benchmark(old){
  reset(old);const handler=old?oldModule('api/commercial-data.js',oldModule('server/commercial-store.js')):api;
  const timings=[];const measured=async(method,body,ticket)=>{const started=performance.now(),modeled=virtualMs;const reply=await invoke(method,body,ticket,handler);assert.equal(reply.statusCode,200);timings.push({stage:method==='GET'?'read':'post',wallMs:Number((performance.now()-started).toFixed(2)),modeledRpcMs:virtualMs-modeled});return reply};
  const load=await measured('GET');google.trace.length=0;logs.length=0;oauth=0;executions=[];flushes=0;
  await measured('POST',op(load),load.body.readTicket);
  const trace=google.trace.slice(),metrics={timings,postOAuth:oauth,postExecutions:executions.length,postFullReads:executions.filter(x=>x.function==='crmRead'&&(!x.probe||old)).length,opens:trace.filter(x=>x.type==='open').length,mirrorRows:trace.filter(x=>x.type==='rows'&&!['Store','StoreVersions'].includes(x.name)).length,chunkReads:trace.filter(x=>x.type==='read'&&x.name==='StoreVersions').length,flushes,phases:logs.filter(x=>x.component==='crm-store'&&x.state==='ok').map(x=>({phase:x.phase,durationMs:x.durationMs}))};
  assert.deepEqual(google.data,next);return metrics;
}
async function main(){
  const before=await benchmark(true),after=await benchmark(false);
  assert.equal(before.postOAuth,2);assert.equal(after.postOAuth,1);
  assert.equal(before.postFullReads,1);assert.equal(after.postFullReads,0);
  assert.ok(after.opens<before.opens);assert.ok(after.mirrorRows<before.mirrorRows);assert.ok(after.chunkReads<before.chunkReads);
  assert.equal(after.flushes,before.flushes,'Durable phase barriers are preserved');
  assert.ok(after.timings[1].modeledRpcMs<before.timings[1].modeledRpcMs);
  let scenarios=0;
  for(const failure of ['oauth-400','oauth-timeout','execution-502','execution-403','execution-error','script-error','body-timeout','bad-probe']){
    reset();const load=await invoke(),request=op(load),source=sheets();mode=failure;
    const failed=await invoke('POST',request,load.body.readTicket);assert.ok(failed.statusCode>=500,failure);assert.equal(sheets(),source);assert.equal(executions.filter(x=>x.function!=='crmRead').length,0);
    assert.match(failed.headers['X-CRM-Correlation-Id'],/^[a-f0-9-]{36}$/);
    assert.ok(!JSON.stringify(failed.body).includes('PRIVATE_'));scenarios++;
  }
  for(const failure of ['before-write-timeout','after-write-timeout']){
    reset();const load=await invoke(),request=op(load);mode=failure;
    const failed=await invoke('POST',request,load.body.readTicket);assert.equal(failed.body.code,'SOURCE_TIMEOUT');
    assert.deepEqual(google.data,failure==='after-write-timeout'?next:base);
    assert.ok(logs.some(x=>x.writeOutcome==='unconfirmed'));
    mode='';assert.equal((await invoke('POST',request,load.body.readTicket)).statusCode,200);
    assert.equal((await invoke('POST',{...request,action:'recover'})).statusCode,200);
    assert.equal(google.sheets.get('BackupsVersions').getLastRow(),2);assert.deepEqual(google.data,next);scenarios++;
  }
  // Two users hold the same confirmed revision; a lightweight probe does not bypass CAS.
  reset();const a=await invoke(),b=await invoke();assert.equal(a.body.revision,b.body.revision);
  assert.equal((await invoke('POST',op(a),a.body.readTicket)).statusCode,200);
  const stale=op(b);stale.requestId='fiction-other-user';stale.data.clients[1].notes='Other pending edit';
  assert.equal((await invoke('POST',stale,b.body.readTicket)).statusCode,409);assert.deepEqual(google.data,next);assert.equal(stale.data.clients[1].notes,'Other pending edit');scenarios++;
  // Updated API safely falls back to the old complete source reader; old frontend
  // response/ticket/payload contracts are unchanged.
  reset(true);const legacy=await invoke();assert.equal((await invoke('POST',op(legacy),legacy.body.readTicket)).statusCode,200);scenarios++;
  reset();const oldApi=oldModule('api/commercial-data.js',oldModule('server/commercial-store.js'));
  const published=await invoke('GET',undefined,undefined,oldApi);assert.equal(published.statusCode,200);
  assert.equal((await invoke('POST',op(published),published.body.readTicket,oldApi)).statusCode,200);scenarios++;
  reset();const start=await invoke(),request=op(start);google.failWrite('pointer-before');
  assert.equal((await invoke('POST',request,start.body.readTicket)).statusCode,502);assert.deepEqual(google.data,base);
  const intent=google.sheets.get('Store').cells.get('5:2');google.failWrite('');
  assert.equal((await invoke('POST',{...request,action:'recover',requestId:'fiction-wrong-id'})).statusCode,409);assert.equal(google.sheets.get('Store').cells.get('5:2'),intent);
  assert.equal((await invoke('POST',{...request,action:'recover'})).statusCode,200);assert.deepEqual(google.data,next);scenarios++;
  // Only Clientes changes. Other mirrors stay byte-identical; a failed selected
  // mirror cannot activate B6 and its retry does not duplicate events or backups.
  reset();const initial=await invoke(),mirrorSnapshot=Object.fromEntries([...google.sheets].filter(([name])=>!['Store','StoreVersions','BackupsVersions','Clientes'].includes(name)).map(([name,sheet])=>[name,JSON.stringify([...sheet.cells])]));
  google.failMirror('Clientes');assert.equal((await invoke('POST',op(initial),initial.body.readTicket)).statusCode,502);assert.deepEqual(google.data,base);
  google.failMirror('');assert.equal((await invoke('POST',{...op(initial),action:'recover'})).statusCode,200);
  for(const [name,raw]of Object.entries(mirrorSnapshot))assert.equal(JSON.stringify([...google.sheets.get(name).cells]),raw);
  assert.deepEqual(google.data.events,base.events);assert.deepEqual(google.data.statuses,base.statuses);assert.deepEqual(google.data.finalPrices,base.finalPrices);assert.deepEqual(google.data.priceHistory,base.priceHistory);scenarios++;
  // Probe never opens Sheets, takes a lock, or returns personal data, even with a
  // writer already holding the lock. Real writes still fail safely on corruption.
  reset();const lock=google.context.LockService.getScriptLock();lock.waitLock();google.trace.length=0;
  const probe=google.context.crmRead({sourceId:'test-sheet',environment:'test',capabilitiesOnly:true});lock.releaseLock();
  assert.equal(probe.preflight,true);assert.ok(!('data'in probe));assert.equal(google.trace.filter(x=>x.type==='open').length,0);scenarios++;
  // Source corruption is checked under the write lock, even though the cheap
  // compatibility probe itself deliberately does not inspect the payload.
  reset();const verified=await invoke(),corruptRequest=op(verified),active=JSON.parse(google.sheets.get('Store').cells.get('6:2'));
  google.sheets.get('StoreVersions').cells.set(active.version.start+':3',':corrupt');
  const corruptBefore=sheets();assert.equal((await invoke('POST',corruptRequest,verified.body.readTicket)).statusCode,502);assert.equal(sheets(),corruptBefore);scenarios++;
  // Every projection dependency is covered; unknown root fields remain in B6
  // without forcing unrelated mirror rewrites. No manual mirror edits are made.
  for(const [key,expected,value]of [
    ['clients','Clientes',[{id:'fiction-new-client',unknown:true}]],
    ['events','Eventos',[...base.events,{id:'fiction-extra-event',clientId:'fiction-0'}]],
    ['agents','Agentes',[{id:'fiction-other-agent'}]],
    ['statuses','EstadosVendas',{...base.statuses,9:'Indisponivel'}],
    ['salePrices','EstadosVendas',{...base.salePrices,8:100001}],
    ['unavailableReasons','EstadosVendas',{9:'Fictitious reason'}],
    ['priceHistory','PrecosHistorico',{16:[{price:400001}]}],
    ['saleCommissions','VendasComissoes',{8:{eventId:'fiction-reservation-8'}}],
    ['unknown',null,{keep:true,more:'Fictitious metadata'}]
  ]){
    reset();const data=clone(base);data[key]=value;const request={requestId:'fiction-projection-'+key,baseRevision:google.revision,data};google.trace.length=0;
    assert.equal(google.write(request).persisted,true);assert.deepEqual(google.data,data);
    const touched=[...new Set(google.trace.filter(x=>x.type==='rows'&&!['Store','StoreVersions'].includes(x.name)).map(x=>x.name))];
    assert.deepEqual(touched,expected?[expected]:[]);scenarios++;
  }
  reset();google.sheets.delete('Agentes');assert.equal(google.write({requestId:'fiction-missing-mirror',baseRevision:google.revision,data:clone(next)}).persisted,true);assert.ok(google.sheets.has('Agentes'));scenarios++;
  // Preserve privacy across both layers, including deliberately sensitive errors.
  for(const line of allLogs){assert.ok(!JSON.stringify(line).includes('PRIVATE_'));assert.ok(!('data'in line));assert.ok(!('requestId'in line));assert.ok(!('revision'in line))}
  assert.ok(allLogs.some(x=>x.layer==='oauth'&&x.outcome==='SOURCE_UNAVAILABLE'));
  assert.ok(allLogs.some(x=>x.layer==='execution-api'&&x.outcome==='SOURCE_UNAVAILABLE'));
  assert.ok(allLogs.some(x=>x.layer==='apps-script'&&x.outcome==='operation-error'));
  assert.ok(allLogs.some(x=>x.phase==='mirror-Clientes'&&x.state==='error'));
  assert.ok(allLogs.some(x=>x.component==='crm-api'&&x.layer==='google-sheets'&&x.sourcePhase==='mirror-Clientes'));
  assert.ok(allLogs.some(x=>x.component==='crm-api'&&x.layer==='apps-script'&&x.sourcePhase==='chunk-validation'));
  savedLog(JSON.stringify({scenarios,metrics:{before,after},modeledRpcCostMs:5,modeledOAuthMs:20,modeledExecutionMs:30,productionTimings:false,realNetwork:false}));
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>{console.log=savedLog;global.fetch=savedFetch;for(const key of Object.keys(process.env))if(!(key in savedEnv))delete process.env[key];Object.assign(process.env,savedEnv)});
