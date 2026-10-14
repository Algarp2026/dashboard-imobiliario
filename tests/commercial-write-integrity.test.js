const assert=require('node:assert/strict');
const {createHmac,createHash}=require('node:crypto');
const api=require('../api/commercial-data.js');
const makeStore=require('./helpers/apps-script-store.js');
const clone=value=>JSON.parse(JSON.stringify(value));
const initial={clients:[{id:'existing-client',name:'Synthetic existing client',preferences:{typology:'T1'},unknown:{keep:true}}],events:[{id:'existing-event',clientId:'existing-client',type:'Outro',fractions:[],notes:'Synthetic history'}],agents:[],finalPrices:{1:555000},statuses:{},salePrices:{},priceHistory:{},saleCommissions:{},unavailableReasons:{},statusEventIds:{},salePriceEventIds:{},unknownRoot:{keep:true}};
const originalEnv={...process.env},originalFetch=global.fetch;
Object.assign(process.env,{COMMERCIAL_ACCESS_SECRET:'test-integrity-session',COMMERCIAL_ACCESS_PASSWORD:'test-integrity-password',CRM_GOOGLE_DEPLOYMENT_ID:'test-deployment',CRM_GOOGLE_SPREADSHEET_ID:'test-sheet',CRM_GOOGLE_CLIENT_ID:'test-client',CRM_GOOGLE_CLIENT_SECRET:'test-secret',CRM_GOOGLE_REFRESH_TOKEN:'test-refresh',CRM_GOOGLE_WRITES_ENABLED:'true',CRM_GOOGLE_TEST_WRITES_ENABLED:'true',VERCEL_ENV:'preview'});
let google,mode='',calls=0,executions=0;
global.fetch=async(url,options)=>{
  calls++;
  assert.ok(['https://oauth2.googleapis.com/token','https://script.googleapis.com/v1/scripts/test-deployment:run'].includes(url));
  if(url.includes('oauth2'))return Response.json({access_token:'fictitious-token'});
  const call=JSON.parse(options.body),writing=call.function!=='crmRead';
  if(writing&&mode==='offline')throw new Error('Unavailable');
  if(writing&&mode==='timeout-before')throw Object.assign(new Error('Timeout'),{name:'TimeoutError'});
  if(writing&&['401','403','500'].includes(mode))return Response.json({error:'Simulated rejection'},{status:Number(mode)});
  if(writing&&mode==='invalid-before')return new Response('{',{headers:{'Content-Type':'application/json'}});
  if(writing&&mode==='false-success')return Response.json({done:true,response:{result:{ok:true,sourceId:'test-sheet',environment:'test',protocol:'tv-cas-v1',revision:createHash('sha256').update(require('../server/commercial-store.js').serializedStore(call.parameters[0].data)).digest('hex'),requestId:call.parameters[0].requestId,confirmedAt:new Date().toISOString()}}});
  let result;
  try{if(writing)executions++;result=google.context[call.function](...call.parameters)}
  catch{return Response.json({done:true,error:{details:[{errorMessage:'Not exposed'}]}})}
  if(writing&&mode==='timeout-after')throw Object.assign(new Error('Lost acknowledgement'),{name:'TimeoutError'});
  if(writing&&mode==='invalid-after')return new Response('{',{headers:{'Content-Type':'application/json'}});
  if(writing&&mode==='wrong-receipt')result.requestId='different-request';
  return Response.json({done:true,response:{result}});
};
function cookie(age=1000){const issued=String(Date.now()-age);return 'tv_commercial_access='+issued+'.'+createHmac('sha256',process.env.COMMERCIAL_ACCESS_SECRET).update(issued).digest('hex')}
function request(method='GET',body,session=cookie(),ticket=''){return {method,body,headers:{host:'example.test',origin:'https://example.test','content-type':'application/json',cookie:session,'x-crm-read-ticket':ticket}}}
async function invoke(req){const response={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.statusCode=n;return this},json(body){this.body=body;return this}};await api(req,response);return response}
const read=session=>invoke(request('GET',undefined,session));
const post=(payload,session,ticket)=>invoke(request('POST',payload,session,ticket));
const reset=()=>{google=makeStore(clone(initial));mode='';calls=0;executions=0};
const cell=address=>google.sheets.get('Store').cells.get(address)||'';
const backups=()=>google.sheets.get('BackupsVersions')?.rows.length||0;

async function main(){
  reset();const session=cookie(),original=clone(initial);let loaded=await read(session);
  const created=clone(initial);created.clients.push({id:'new-client',name:'Synthetic new client',preferences:{},notes:'Fictitious only'});
  let operation={action:'save',requestId:'create-client-0001',baseRevision:loaded.body.revision,data:created};
  let reply=await post(operation,session,loaded.body.readTicket);assert.equal(reply.statusCode,200);assert.equal(reply.body.persisted,true);assert.equal(reply.body.requestId,operation.requestId);
  const second=cookie(2000);loaded=await read(second);assert.deepEqual(loaded.body.data,created);assert.equal(loaded.body.data.clients.filter(c=>c.id==='new-client').length,1);
  const preferred=clone(created);preferred.clients[1].preferences={typology:'T2',floor:'3',orientation:'Sul',objective:'Investimento',decisionTime:'30 dias',summary:'Synthetic preferences'};
  operation={action:'save',requestId:'edit-preferences-0002',baseRevision:loaded.body.revision,data:preferred};reply=await post(operation,second,loaded.body.readTicket);assert.equal(reply.statusCode,200);
  const third=cookie(3000);loaded=await read(third);assert.deepEqual(loaded.body.data.clients[1].preferences,preferred.clients[1].preferences);
  const withEvent=clone(preferred);withEvent.events.push({id:'new-event',clientId:'new-client',type:'Apresentação comercial',date:'2026-10-13',fractions:[18],channel:'Telefone',notes:'Synthetic presentation'});
  operation={action:'save',requestId:'create-event-0003',baseRevision:loaded.body.revision,data:withEvent};assert.equal((await post(operation,third,loaded.body.readTicket)).statusCode,200);
  loaded=await read(cookie(4000));assert.deepEqual(loaded.body.data,withEvent);assert.deepEqual(loaded.body.data.events[0],original.events[0]);assert.deepEqual(loaded.body.data.clients[0],original.clients[0]);
  for(const key of ['finalPrices','statuses','salePrices','priceHistory','saleCommissions','agents','unknownRoot'])assert.deepEqual(loaded.body.data[key],initial[key]);

  reset();const a=cookie(1000),b=cookie(2000),loadA=await read(a),loadB=await read(b),dataB=clone(initial);dataB.clients[0].phone='Synthetic B';
  const opB={action:'save',requestId:'session-b-change',baseRevision:loadB.body.revision,data:dataB};assert.equal((await post(opB,b,loadB.body.readTicket)).statusCode,200);
  const dataA=clone(initial);dataA.clients[0].phone='Synthetic A';const opA={action:'save',requestId:'session-a-stale',baseRevision:loadA.body.revision,data:dataA};assert.equal((await post(opA,a,loadA.body.readTicket)).statusCode,409);assert.deepEqual(google.data,dataB);
  const before=calls;assert.equal((await post({...opA,baseRevision:google.revision},a,loadA.body.readTicket)).statusCode,403);assert.equal(calls,before);
  assert.equal((await post(opB,a,loadB.body.readTicket)).statusCode,403);
  reset();const concurrentA=await read(a),concurrentB=await read(b);
  const simultaneous=await Promise.all([post({...opA,baseRevision:concurrentA.body.revision},a,concurrentA.body.readTicket),post({...opB,baseRevision:concurrentB.body.revision},b,concurrentB.body.readTicket)]);
  assert.deepEqual(simultaneous.map(r=>r.statusCode).sort(),[200,409]);assert.equal(backups(),1);assert.ok(google.trace.filter(item=>['read','write','rows','append'].includes(item.type)).every(item=>item.held));

  for(const fault of ['offline','timeout-before','401','403','500','invalid-before','false-success']){
    reset();const live=cookie(),base=await read(live),time=cell('3:2');mode=fault;
    const result=await post({action:'save',requestId:'before-fault-'+fault,baseRevision:base.body.revision,data:created},live,base.body.readTicket);
    assert.ok(result.statusCode>=500,fault);assert.notEqual(result.body.persisted,true);assert.deepEqual(google.data,initial);assert.equal(cell('3:2'),time);assert.equal(cell('5:2'),'');assert.equal(backups(),0);
  }
  for(const fault of ['timeout-after','invalid-after','wrong-receipt']){
    reset();const live=cookie(),base=await read(live),op={action:'save',requestId:'after-fault-'+fault,baseRevision:base.body.revision,data:created};mode=fault;
    assert.ok((await post(op,live,base.body.readTicket)).statusCode>=500);assert.deepEqual(google.data,created);assert.equal(backups(),1);mode='';
    const proof=await read(live);assert.deepEqual(proof.body.data,created);assert.equal(cell('5:2'),'');
    const recovered=await post({...op,action:'recover'},live);assert.equal(recovered.statusCode,200);assert.equal(backups(),1);assert.equal(google.data.clients.length,2);
  }

  for(const fault of ['chunks-before','chunks-partial','archive-before','archive-after','pointer-before','pointer-after','mirror']){
    reset();const live=cookie(),base=await read(live),oldTime=cell('3:2'),op={action:'save',requestId:'partial-fault-'+fault,baseRevision:base.body.revision,data:created};
    fault==='mirror'?google.failMirror('Eventos'):google.failWrite(fault);
    assert.equal((await post(op,live,base.body.readTicket)).statusCode,502);assert.equal((await read(live)).statusCode,200);
    const intent=JSON.parse(cell('5:2'));assert.equal(intent.requestId,op.requestId);assert.ok(Number.isFinite(Date.parse(intent.updatedAt)));
    if(fault==='pointer-after')assert.deepEqual(google.data,created);else assert.deepEqual(google.data,initial);
    assert.equal(cell('3:2'),oldTime);
    const savedBefore=clone(google.data),intentBefore=cell('5:2');assert.equal((await post({...op,action:'recover',requestId:'unrelated-operation'},live)).statusCode,409);assert.deepEqual(google.data,savedBefore);assert.equal(cell('5:2'),intentBefore);
    const oldCalls=calls;assert.equal((await post({...op,action:'recover'},cookie(9*3600000))).statusCode,401);assert.equal(calls,oldCalls);assert.equal(cell('5:2'),intentBefore);
    google.failWrite('');google.failMirror('');const restored=await post({...op,action:'recover'},live);assert.equal(restored.statusCode,200,fault);assert.equal(restored.body.persisted,true);assert.deepEqual(google.data,created);assert.equal((await read(live)).body.updatedAt,intent.updatedAt);assert.equal(cell('5:2'),'');assert.equal(backups(),1,fault+' duplicated backup');
    for(const name of ['Clientes','Eventos','Agentes','EstadosVendas','PrecosHistorico','VendasComissoes'])assert.ok(google.sheets.has(name));
    assert.equal((await read(live)).statusCode,200);assert.equal((await post({...op,action:'recover'},live)).statusCode,200);assert.equal(backups(),1);
  }
  reset();const sizeSession=cookie(),sizeBase=await read(sizeSession),oversized=clone(created);oversized.clients[1].notes='x'.repeat(900000);
  const sizeReply=await post({action:'save',requestId:'oversized-store',baseRevision:sizeBase.body.revision,data:oversized},sizeSession,sizeBase.body.readTicket);
  assert.equal(sizeReply.statusCode,413);assert.equal(sizeReply.body.code,'STORE_SIZE_LIMIT');assert.deepEqual(google.data,initial);assert.equal(backups(),0);assert.equal(cell('5:2'),'');assert.equal(cell('4:2'),'');
  reset();const readonly=cookie(),base=await read(readonly);google.properties.CRM_API_WRITES_ENABLED='false';assert.equal((await read(readonly)).body.canWrite,false);
  assert.equal((await post({action:'save',requestId:'readonly-write',baseRevision:base.body.revision,data:created},readonly,base.body.readTicket)).body.code,'WRITES_DISABLED');assert.equal(google.context.testWrite().ok,true);assert.deepEqual(google.data,initial);assert.equal(backups(),0);
  console.log('write integrity tests passed: create/preferences/event reload, simultaneous CAS, revision manipulation, expired real session, invalid/false acknowledgements, seven partial-write recovery stages, preserved legacy B3, backup deduplication and source read-only mode');
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>{global.fetch=originalFetch;for(const key of Object.keys(process.env))if(!(key in originalEnv))delete process.env[key];Object.assign(process.env,originalEnv)});
