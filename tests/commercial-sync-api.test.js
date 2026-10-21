const assert=require('node:assert/strict');
const {createHmac}=require('node:crypto');
const api=require('../api/commercial-data.js'),access=require('../api/access.js');
const makeStore=require('./helpers/apps-script-store.js');
const clone=value=>JSON.parse(JSON.stringify(value));
const initial={clients:[{id:'c',name:'Synthetic client',extra:{preserved:true}}],events:[],agents:[],finalPrices:{1:700000},statuses:{},salePrices:{},priceHistory:{},saleCommissions:{},unavailableReasons:{},statusEventIds:{},salePriceEventIds:{},unknownRoot:{retained:true}};
const google=makeStore(initial),realFetch=global.fetch,originalEnv={...process.env};
Object.assign(process.env,{COMMERCIAL_ACCESS_PASSWORD:'test-password',COMMERCIAL_ACCESS_SECRET:'test-session-secret',CRM_GOOGLE_DEPLOYMENT_ID:'test-deployment',CRM_GOOGLE_SPREADSHEET_ID:'test-sheet',CRM_GOOGLE_CLIENT_ID:'test-client',CRM_GOOGLE_CLIENT_SECRET:'test-secret',CRM_GOOGLE_REFRESH_TOKEN:'test-refresh',CRM_GOOGLE_WRITES_ENABLED:'true',CRM_GOOGLE_TEST_WRITES_ENABLED:'true',VERCEL_ENV:'preview'});
let mode='',calls=0;
global.fetch=async(url,options)=>{
  calls++;assert.equal(options.redirect,'manual');
  assert.ok(['https://oauth2.googleapis.com/token','https://script.googleapis.com/v1/scripts/test-deployment:run'].includes(url),'No other network allowed');
  if(mode==='timeout')throw Object.assign(new Error('Timeout'),{name:'TimeoutError'});
  if(mode==='offline')throw new Error('Unavailable');
  if(mode==='redirect')return new Response('',{status:302,headers:{Location:'https://accounts.google.com/login'}});
  if(mode==='html')return new Response('<html>Login</html>',{headers:{'Content-Type':'text/html'}});
  if(mode==='invalid')return new Response('{',{headers:{'Content-Type':'application/json'}});
  if(mode==='auth')return new Response('{}',{status:403,headers:{'Content-Type':'application/json'}});
  if(url.includes('oauth2'))return Response.json({access_token:'test-access-token'});
  assert.equal(options.headers.Authorization,'Bearer test-access-token');const request=JSON.parse(options.body);assert.equal(request.devMode,false);
  const reorder=value=>Array.isArray(value)?value.map(reorder):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).reverse().map(key=>[key,reorder(value[key])])):value;
  request.parameters=request.parameters.map(reorder);
  try{const result=google.context[request.function](...request.parameters);if(mode==='unknown-version')delete result.revision;if(mode==='wrong-protocol')result.protocol='unsupported';if(mode==='invalid-data')result.data={clients:[{id:'duplicate'},{id:'duplicate'}]};return Response.json({done:true,response:{result}})}catch{return Response.json({done:true,error:{details:[{errorMessage:'Not returned to browser'}]}})}
};
function cookie(issued=Date.now()){const timestamp=String(issued);return'tv_commercial_access='+timestamp+'.'+createHmac('sha256',process.env.COMMERCIAL_ACCESS_SECRET).update(timestamp).digest('hex')}
const session=cookie();
function request(method='GET',body,c=session){return{method,body,headers:{host:'example.test',origin:'https://example.test',cookie:c,'content-type':'application/json','sec-fetch-site':'same-origin'}}}
async function invoke(handler,req){const response={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.statusCode=n;return this},json(body){this.body=body;return this}};await handler(req,response);return response}
async function main(){
  const start=JSON.stringify(google.data);
  for(const c of ['',session+'x',cookie(Date.now()-9*3600000),cookie(Date.now()+3600000),session+'; '+session]){
    const before=calls;for(const method of ['GET','POST']){const response=await invoke(api,request(method,{},c));assert.equal(response.statusCode,401);assert.ok(!response.body.data)}assert.equal(calls,before);
  }
  assert.equal((await invoke(access,{...request('POST',{password:'test-password'}),headers:{host:'example.test',origin:'https://evil.test'}})).statusCode,403);
  assert.equal((await invoke(access,request('POST',{password:'wrong'}))).statusCode,401);
  const login=await invoke(access,request('POST',{password:'test-password'}));assert.equal(login.statusCode,200);assert.match(login.headers['Set-Cookie'],/HttpOnly; SameSite=Strict; Secure/);
  const load=await invoke(api,request());assert.equal(load.statusCode,200);assert.deepEqual(load.body.data,initial);assert.equal(load.body.canWrite,true);assert.ok(load.body.readTicket);assert.equal(JSON.stringify(google.data),start);assert.equal(google.sheets.has('Backups'),false);
  const candidate=clone(initial);candidate.clients[0].phone='910000001';
  const payload={action:'save',data:candidate,baseRevision:load.body.revision,requestId:'request-test-0001'};
  const post=request('POST',payload);post.headers['x-crm-read-ticket']=load.body.readTicket;
  assert.equal((await invoke(api,{...post,headers:{...post.headers,origin:'https://evil.test'}})).statusCode,403);
  assert.equal((await invoke(api,request('POST',payload))).body.code,'READ_REQUIRED');
  const otherSession=cookie(Date.now()-1000);assert.equal((await invoke(api,{...post,headers:{...post.headers,cookie:otherSession}})).body.code,'READ_REQUIRED');
  process.env.CRM_GOOGLE_WRITES_ENABLED='false';assert.equal((await invoke(api,post)).body.code,'WRITES_DISABLED');process.env.CRM_GOOGLE_WRITES_ENABLED='true';
  const saved=await invoke(api,post);assert.equal(saved.statusCode,200);assert.deepEqual(google.data,candidate);assert.equal(google.sheets.get('BackupsVersions').rows.length,1);
  const backupLock=google.context.LockService.getScriptLock();backupLock.waitLock();
  try{assert.equal(google.context.readVersion_(JSON.parse(google.sheets.get('BackupsVersions').rows[0][1])),start)}finally{backupLock.releaseLock()}
  for(const name of ['Clientes','Eventos','Agentes','EstadosVendas','PrecosHistorico','VendasComissoes'])assert.ok(google.sheets.has(name));
  assert.ok(google.trace.filter(item=>item.type==='write'||item.type==='rows'||item.type==='append').every(item=>item.held),'All durable mutations retain the script lock');
  assert.ok(google.trace.some(item=>item.type==='read'&&!item.held),'Verified immutable snapshot reads must not take the writer lock');
  const repeated=await invoke(api,post);assert.equal(repeated.statusCode,200);assert.equal(google.sheets.get('BackupsVersions').rows.length,1);
  const stale={...payload,requestId:'request-test-stale',data:{...initial,clients:[{...initial.clients[0],email:'stale@example.test'}]}};
  const old=await invoke(api,{...post,body:stale});assert.equal(old.statusCode,409);assert.ok(!old.body.data);assert.deepEqual(google.data,candidate);
  const current=await invoke(api,request()),next=clone(candidate);next.clients[0].email='new@example.test';
  const interrupted={action:'save',data:next,baseRevision:current.body.revision,requestId:'request-test-interrupted'};
  google.failMirror('Clientes');const failure=await invoke(api,{...request('POST',interrupted),headers:{...request().headers,'x-crm-read-ticket':current.body.readTicket}});assert.equal(failure.statusCode,502);
  assert.deepEqual(google.data,candidate);assert.equal((await invoke(api,request())).statusCode,200);
  const backupCount=google.sheets.get('BackupsVersions').rows.length;google.failMirror('');
  const recovery=await invoke(api,request('POST',{...interrupted,action:'recover'}));assert.equal(recovery.statusCode,200);assert.equal(google.sheets.get('BackupsVersions').rows.length,backupCount);
  assert.equal((await invoke(api,request('POST',{...payload,action:'recover',requestId:'never-authorized'}))).statusCode,409);
  assert.deepEqual(google.data,next);
  const previewBase=await invoke(api,request());google.properties.CRM_ENVIRONMENT='production';const wrong=await invoke(api,{...request('POST',{...payload,baseRevision:previewBase.body.revision}),headers:{...request().headers,'x-crm-read-ticket':previewBase.body.readTicket}});assert.equal(wrong.statusCode,503);assert.deepEqual(google.data,next);google.properties.CRM_ENVIRONMENT='test';
  const backendBefore=JSON.stringify(google.data);
  assert.equal(JSON.parse(google.context.doGet(undefined).body).code,'SERVER_ACCESS_REQUIRED');
  assert.equal(JSON.parse(google.context.doPost({parameter:{payload:JSON.stringify(payload)}}).body).ok,false);
  assert.equal(JSON.parse(google.context.doPost({postData:{contents:JSON.stringify(payload)}}).body).ok,false);
  assert.equal(JSON.stringify(google.data),backendBefore);
  for(const failureMode of ['offline','timeout','redirect','html','invalid','auth','unknown-version','wrong-protocol','invalid-data']){
    mode=failureMode;const failed=await invoke(api,request());assert.ok(failed.statusCode>=500);assert.ok(!failed.body.data);assert.ok(!JSON.stringify(failed.body).includes('test-secret'));assert.equal(JSON.stringify(google.data),backendBefore);
  }
  mode='';google.setCaller('not-authorized@example.test');assert.ok((await invoke(api,request())).statusCode>=500);google.setCaller('owner@example.test');
  delete process.env.CRM_GOOGLE_REFRESH_TOKEN;const unavailable=await invoke(api,request());assert.equal(unavailable.body.code,'SOURCE_NOT_CONFIGURED');
  console.log('secure sync API tests passed: sessions, CSRF, server OAuth, direct endpoint denial, CAS conflicts, idempotency, mirror recovery, backups, preview isolation and upstream failures');
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>{global.fetch=realFetch;for(const key of Object.keys(process.env))if(!(key in originalEnv))delete process.env[key];Object.assign(process.env,originalEnv)});
