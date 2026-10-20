'use strict';
const assert=require('node:assert/strict');
const {createHmac,createHash}=require('node:crypto');
const {serializedStore}=require('../server/commercial-store.js');
const makeStore=require('./helpers/apps-script-store.js');
const recovery=require('../scripts/prepare-apartment16-recovery.js');
const api=require('../api/commercial-data.js');
const clone=value=>JSON.parse(JSON.stringify(value));
const initial={clients:Array.from({length:65},(_,i)=>({id:'fiction-'+i,name:'Fictitious client '+i})),events:Array.from({length:105},(_,i)=>({id:'event-'+i,clientId:'fiction-'+(i%65),type:i<2?'Reserva efetuada':i===104?'Venda concluída':'Outro',fractions:i===0?[8]:i===1?[24]:i===104?[39]:[]})),agents:[{id:'fiction-agent',name:'Fictitious agent'}],statuses:Object.fromEntries(Array.from({length:39},(_,i)=>[i+1,[8,24].includes(i+1)?'Reservado':i===38?'Vendido':'Disponível'])),finalPrices:Object.fromEntries(Array.from({length:39},(_,i)=>[i+1,i===15?925000:400000])),priceHistory:{16:[{date:'01/10/2026',price:900000},{date:'10/10/2026',oldPrice:900000,price:925000}]},salePrices:{8:410000,24:420000,39:500000},saleCommissions:{39:{eventId:'event-104',agentId:'fiction-agent',amount:10000}},unavailableReasons:{},statusEventIds:{8:'event-0',24:'event-1',39:'event-104'},salePriceEventIds:{8:'event-0',24:'event-1',39:'event-104'},majucaImportKey:'fiction-import',majucaImportSummary:{keep:true},future:{padding:'x'.repeat(160000),keep:[1,2]}};
const candidate=clone(initial);candidate.finalPrices['16']=950000;candidate.priceHistory['16'].push({date:'19/10/2026',oldPrice:925000,price:950000,reason:'Fictitious approved correction'});
const snapshot=store=>JSON.stringify([...store.sheets].map(([name,sheet])=>[name,[...sheet.cells]]));
const cells=store=>store.sheets.get('Store').cells;
const read=store=>({...clone(store.read()),source:'shared'});
function incident(fault='pointer-before'){
  const store=makeStore(clone(initial));
  assert.equal(store.write({requestId:'fiction-initialize',baseRevision:store.revision,data:clone(initial)}).persisted,true);
  const baseRevision=store.revision;
  const sourceRequest={action:'save',requestId:'fiction-b5-original',baseRevision,data:clone(candidate)};
  store.failWrite(fault);assert.throws(()=>store.write(sourceRequest));store.failWrite('');
  const browserRequest={...clone(sourceRequest),requestId:'fiction-chrome-original'};
  const localExport={data:clone(candidate),base:clone(initial),pendingWrite:browserRequest};
  return{store,localExport,sourceRequest};
}
const approve=plan=>({approved:true,planChecksum:plan.planChecksum,requestId:plan.pendingWrite.requestId,baseRevision:plan.activeRevision,targetRevision:plan.targetRevision});
function reject(fn,code){assert.throws(fn,error=>error.code===code)}
let assertions=0;
const i=incident(),localBefore=JSON.stringify(i.localExport),sheetBefore=snapshot(i.store),pendingBefore=cells(i.store).get('5:2');
const sourceRead=read(i.store),plan=recovery.createPlan(i.localExport,sourceRead);
assert.notEqual(plan.originalPendingWrite.requestId,plan.recoveryRequest.requestId);
assert.equal(plan.recoveryRequest.requestId,i.sourceRequest.requestId);
assert.deepEqual(plan.recoveryRequest.data,i.localExport.pendingWrite.data);
assert.equal(plan.recoveryRequest.baseRevision,i.sourceRequest.baseRevision);
assert.equal(recovery.summary(plan).readyForApproval,true);
assert.equal(JSON.stringify(i.localExport),localBefore);assert.equal(snapshot(i.store),sheetBefore);assert.equal(cells(i.store).get('5:2'),pendingBefore);assertions++;

for(const mutate of [p=>{p.approved=false},p=>{p.requestId='fiction-other-id'},p=>{p.baseRevision='f'.repeat(64)},p=>{p.targetRevision='f'.repeat(64)},p=>{p.planChecksum='f'.repeat(64)}]){
  const approval=approve(plan);mutate(approval);reject(()=>recovery.prepareApprovedRequest(plan,sourceRead,approval),'EXPLICIT_APPROVAL_REQUIRED');assert.equal(snapshot(i.store),sheetBefore);assertions++;
}
const correct=recovery.prepareApprovedRequest(plan,sourceRead,approve(plan));assert.deepEqual(correct,{...i.sourceRequest,action:'recover'});assertions++;
for(const mutate of [p=>{p.recoveryRequest.data.finalPrices['16']=1},p=>{p.recoveryRequest.requestId='fiction-other-id'},p=>{p.originalPendingWrite.requestId='fiction-other-id'},p=>{p.activeData.future.keep=[]}]){
  const altered=clone(plan);mutate(altered);reject(()=>recovery.prepareApprovedRequest(altered,sourceRead,approve(altered)),'PLAN_INTEGRITY_MISMATCH');assertions++;
}
for(const mutate of [r=>{r.pendingWrite.requestId='fiction-other-pending'},r=>{r.pendingWrite=null}]){
  const changed=clone(sourceRead);mutate(changed);reject(()=>recovery.prepareApprovedRequest(plan,changed,approve(plan)),'SOURCE_CHANGED_SINCE_APPROVAL');assertions++;
}
for(const [mutate,code] of [
  [r=>{delete r.capabilities},'INCOMPATIBLE_AUTHENTICATED_READ'],
  [r=>{delete r.pendingWrite},'INVALID_AUTHENTICATED_READ'],
  [r=>{r.data.future.keep=[]},'ACTIVE_CHECKSUM_MISMATCH'],
  [r=>{r.pendingWrite.state='blocked'},'PENDING_SOURCE_OPERATION_REQUIRED'],
  [r=>{r.pendingWrite.revision='f'.repeat(64)},'SOURCE_TARGET_CONTENT_MISMATCH'],
  [r=>{r.pendingWrite.baseRevision='f'.repeat(64)},'BASE_REVISION_MISMATCH']
]){const changed=clone(sourceRead);mutate(changed);reject(()=>recovery.createPlan(i.localExport,changed),code);assertions++}
const noOriginal=clone(i.localExport);delete noOriginal.pendingWrite;reject(()=>recovery.createPlan(noOriginal,sourceRead),'ORIGINAL_REQUEST_REQUIRED');assertions++;
const wrongOriginal=clone(i.localExport);wrongOriginal.pendingWrite.data.future.keep=[];
reject(()=>recovery.createPlan(wrongOriginal,sourceRead),'LOCAL_REQUEST_CONTENT_MISMATCH');assertions++;
const wrongBase=clone(i.localExport);wrongBase.pendingWrite.baseRevision='f'.repeat(64);reject(()=>recovery.createPlan(wrongBase,sourceRead),'BASE_REVISION_MISMATCH');assertions++;

// Even identical source/candidate hashes do not authorize unrelated changes.
for(const mutate of [d=>{d.clients[0].name='Different fictional name'},d=>{d.statuses['8']='Disponível'},d=>{d.saleCommissions['39'].amount=1},d=>{d.finalPrices['17']=1},d=>{d.future.keep=[]},d=>{d.priceHistory['16'][2].date='20/10/2026'},d=>{d.priceHistory['16'][0].price=1}]){
  const data=clone(candidate);mutate(data);
  const advertised=clone(sourceRead);advertised.pendingWrite.revision=createHash('sha256').update(serializedStore(data)).digest('hex');
  const exported={data:clone(data),pendingWrite:{...clone(i.localExport.pendingWrite),data:clone(data)}};
  assert.throws(()=>recovery.createPlan(exported,advertised));assertions++;
}

// An unchanged base does not prove that a different ID can be used with new content.
const originalConflict=i.store.recover({...i.localExport.pendingWrite,action:'recover'});
assert.equal(originalConflict.code,'CONFLICT');assert.equal(snapshot(i.store),sheetBefore);assertions++;
const changedBody=clone(correct);changedBody.data.finalPrices['16']=955000;
assert.equal(i.store.recover(changedBody).code,'CONFLICT');assert.equal(snapshot(i.store),sheetBefore);assertions++;

const oldEnv={...process.env},oldFetch=global.fetch;
Object.assign(process.env,{COMMERCIAL_ACCESS_SECRET:'fiction-session',CRM_GOOGLE_DEPLOYMENT_ID:'test-deployment',CRM_GOOGLE_SPREADSHEET_ID:'test-sheet',CRM_GOOGLE_CLIENT_ID:'fiction-client',CRM_GOOGLE_CLIENT_SECRET:'fiction-secret',CRM_GOOGLE_REFRESH_TOKEN:'fiction-refresh',CRM_GOOGLE_WRITES_ENABLED:'true',CRM_GOOGLE_TEST_WRITES_ENABLED:'true',VERCEL_ENV:'preview'});
let store=i.store;
global.fetch=async(url,options)=>{
  assert.ok(['https://oauth2.googleapis.com/token','https://script.googleapis.com/v1/scripts/test-deployment:run'].includes(url),'Real network forbidden');
  if(url.includes('oauth2'))return Response.json({access_token:'fiction-token'});
  const call=JSON.parse(options.body);
  try{return Response.json({done:true,response:{result:store.context[call.function](...call.parameters)}})}catch{return Response.json({done:true,error:{details:[{errorMessage:'Synthetic failure'}]}})}
};
async function invoke(method,body){
  const issued=String(Date.now()),cookie='tv_commercial_access='+issued+'.'+createHmac('sha256',process.env.COMMERCIAL_ACCESS_SECRET).update(issued).digest('hex');
  const request={method,body,headers:{host:'example.test',origin:'https://example.test',cookie,'content-type':'application/json'}};
  const response={statusCode:200,setHeader(){},status(value){this.statusCode=value;return this},json(value){this.body=value;return this}};
  await api(request,response);return response;
}
async function main(){
  const authenticated=await invoke('GET');assert.equal(authenticated.statusCode,200);
  const prepared=recovery.prepareApprovedRequest(plan,authenticated.body,approve(plan));
  const recovered=await invoke('POST',prepared);assert.equal(recovered.statusCode,200);
  const afterFirst=snapshot(store),backupCount=store.sheets.get('BackupsVersions').getLastRow();
  assert.equal((await invoke('POST',prepared)).statusCode,200);assert.equal(snapshot(store),afterFirst);assert.equal(store.sheets.get('BackupsVersions').getLastRow(),backupCount);
  const first=await invoke('GET'),second=await invoke('GET');
  assert.equal(recovery.verifyPersistence(plan,recovered.body,first.body,second.body).verified,true);
  assert.deepEqual(store.data,candidate);assert.equal(store.data.priceHistory['16'].length,3);assert.equal(JSON.stringify(i.localExport),localBefore);assertions++;
  const falseReceipt={...recovered.body,requestId:plan.originalPendingWrite.requestId};
  reject(()=>recovery.verifyPersistence(plan,falseReceipt,first.body,second.body),'RECOVERY_RECEIPT_MISMATCH');assertions++;
  const later=clone(first.body);later.pendingWrite={state:'pending',requestId:'fiction-later-write',baseRevision:later.revision,revision:'f'.repeat(64)};
  reject(()=>recovery.verifyPersistence(plan,recovered.body,first.body,later),'RECOVERY_NOT_SETTLED');assertions++;
  for(const fault of ['chunks-before','mirror','pointer-before','pointer-after']){
    const fixture=incident(fault==='mirror'?'pointer-before':fault);store=fixture.store;
    if(fault==='pointer-after'){
      assert.equal(store.recover(fixture.sourceRequest).persisted,true);assert.equal(store.recover(fixture.sourceRequest).persisted,true);assert.deepEqual(store.data,candidate);assertions++;continue;
    }
    const pendingPlan=recovery.createPlan(fixture.localExport,read(store));
    const request=recovery.prepareApprovedRequest(pendingPlan,read(store),approve(pendingPlan));
    if(fault==='mirror'){store.failMirror('Eventos');assert.equal((await invoke('POST',request)).statusCode,502);store.failMirror('')}
    assert.equal((await invoke('POST',request)).statusCode,200);assert.deepEqual(store.data,candidate);assert.equal(store.data.priceHistory['16'].length,3);assertions++;
  }
  // A changed identity/revision after preparation is still rejected by server CAS.
  const race=incident();store=race.store;const racedPlan=recovery.createPlan(race.localExport,read(store));
  const racedRequest=recovery.prepareApprovedRequest(racedPlan,read(store),approve(racedPlan));
  assert.equal(store.recover(race.sourceRequest).persisted,true);
  const laterData=clone(candidate);laterData.future.updatedByOtherSession=true;
  assert.equal(store.write({requestId:'fiction-next-session',baseRevision:store.revision,data:laterData}).persisted,true);
  const racedBefore=snapshot(store);assert.equal((await invoke('POST',racedRequest)).statusCode,409);assert.equal(snapshot(store),racedBefore);assertions++;
  console.log(JSON.stringify({cases:assertions,differentIdsIdenticalContentRecovered:true,wrongContentRejected:true,explicitApprovalRequired:true,sourceIdentityRevalidated:true,syntheticClients:65,syntheticEvents:105,states:39,priceHistoryEntries:3,originalChromeRequestUnchanged:true,idempotentApiRecovery:true,realNetwork:false}));
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>{global.fetch=oldFetch;for(const key of Object.keys(process.env))if(!(key in oldEnv))delete process.env[key];Object.assign(process.env,oldEnv)});
