'use strict';
// Offline preparation only: no network, environment credentials or storage mutation.
const {createHash}=require('node:crypto');
const {validStore,serializedStore,pendingWriteState,REVISION}=require('../server/commercial-store.js');
const copy=value=>JSON.parse(JSON.stringify(value));
const hash=value=>createHash('sha256').update(serializedStore(value)).digest('hex');
const equal=(a,b)=>serializedStore(a)===serializedStore(b);
const fail=code=>{throw Object.assign(new Error(code),{code})};
const requireCondition=(condition,code)=>{if(!condition)fail(code)};
const validId=value=>typeof value==='string'&&/^[\w-]{8,100}$/.test(value);
const validRevision=value=>typeof value==='string'&&REVISION.test(value);

function inspectRead(read){
  requireCondition(read&&read.ok===true&&read.source==='shared'&&read.protocol==='tv-cas-v1'&&read.capabilities?.pendingWriteDiagnostics===1,'INCOMPATIBLE_AUTHENTICATED_READ');
  requireCondition(Object.hasOwn(read,'pendingWrite')&&validRevision(read.revision)&&Number.isFinite(Date.parse(read.confirmedAt))&&validStore(read.data,true),'INVALID_AUTHENTICATED_READ');
  const pending=pendingWriteState(read.pendingWrite);
  requireCondition(hash(read.data)===read.revision,'ACTIVE_CHECKSUM_MISMATCH');
  return{revision:read.revision,confirmedAt:read.confirmedAt,pendingWrite:pending};
}
function inspectBusinessData(data){
  requireCondition(validStore(data,true)&&data.clients.length===65&&data.events.length===105,'INCIDENT_COUNTS_OR_SCHEMA_MISMATCH');
  const clients=new Set(data.clients.map(client=>String(client.id)));
  requireCondition(data.events.every(event=>event.clientId==null||event.clientId===''||clients.has(String(event.clientId))),'INVALID_CLIENT_REFERENCE');
  const statuses=data.statuses,keys=Object.keys(statuses).sort((a,b)=>Number(a)-Number(b));
  requireCondition(keys.length===39&&keys.every((key,index)=>key===String(index+1)&&['Disponível','Reservado','Vendido','Indisponível'].includes(statuses[key])),'INVALID_FRACTION_STATUSES');
  requireCondition(statuses['8']==='Reservado'&&statuses['24']==='Reservado','RESERVATION_MISMATCH');
}
function inspectIncident(original,remote){
  inspectBusinessData(original);inspectBusinessData(remote);
  requireCondition(remote.finalPrices['16']===925000&&original.finalPrices['16']===950000,'UNEXPECTED_APARTMENT16_PRICE');
  const before=remote.priceHistory['16'],after=original.priceHistory['16'];
  requireCondition(Array.isArray(before)&&before.length===2&&Array.isArray(after)&&after.length===3&&before.every((entry,index)=>equal(entry,after[index])),'UNEXPECTED_APARTMENT16_HISTORY');
  const last=after[2];
  requireCondition(last&&last.price===950000&&last.oldPrice===925000&&typeof last.date==='string'&&/^(19\/10\/2026|2026-10-19)(?:$|[T ,])/.test(last.date),'UNEXPECTED_APARTMENT16_HISTORY_ENTRY');
  const unchanged=copy(original);unchanged.finalPrices['16']=remote.finalPrices['16'];unchanged.priceHistory['16']=copy(before);
  requireCondition(equal(unchanged,remote),'UNRELATED_COMMERCIAL_DIFFERENCE');
}
function planIdentity(plan){
  return hash({format:plan.format,originalPendingWrite:plan.originalPendingWrite,activeData:plan.activeData,activeRevision:plan.activeRevision,pendingWrite:plan.pendingWrite,recoveryRequest:plan.recoveryRequest,targetRevision:plan.targetRevision});
}
function createPlan(localExport,read){
  const observed=inspectRead(read),original=localExport?.pendingWrite;
  requireCondition(original&&['save','recover'].includes(original.action)&&validId(original.requestId)&&validRevision(original.baseRevision)&&validStore(original.data,true),'ORIGINAL_REQUEST_REQUIRED');
  requireCondition(Object.keys(original).every(key=>['action','requestId','baseRevision','data'].includes(key)),'UNEXPECTED_REQUEST_ENVELOPE');
  requireCondition(localExport.data&&equal(localExport.data,original.data),'LOCAL_REQUEST_CONTENT_MISMATCH');
  requireCondition(observed.pendingWrite?.state==='pending','PENDING_SOURCE_OPERATION_REQUIRED');
  requireCondition(observed.pendingWrite.baseRevision===observed.revision&&original.baseRevision===observed.revision,'BASE_REVISION_MISMATCH');
  const targetRevision=hash(original.data);
  // A matching base alone is insufficient. The target digest proves that the
  // original content, not merely the proposed price, belongs to the source ID.
  requireCondition(targetRevision===observed.pendingWrite.revision,'SOURCE_TARGET_CONTENT_MISMATCH');
  inspectIncident(original.data,read.data);
  const plan={format:'tv-apartment16-recovery-v1',originalPendingWrite:copy(original),activeData:copy(read.data),activeRevision:observed.revision,pendingWrite:copy(observed.pendingWrite),targetRevision,
    recoveryRequest:{action:'recover',requestId:observed.pendingWrite.requestId,baseRevision:observed.revision,data:copy(original.data)}};
  plan.planChecksum=planIdentity(plan);
  return plan;
}
function inspectPlan(plan){
  requireCondition(plan&&plan.format==='tv-apartment16-recovery-v1'&&validRevision(plan.planChecksum)&&plan.planChecksum===planIdentity(plan),'PLAN_INTEGRITY_MISMATCH');
  requireCondition(validRevision(plan.activeRevision)&&hash(plan.activeData)===plan.activeRevision,'PLAN_BASE_CHECKSUM_MISMATCH');
  const original=plan.originalPendingWrite,request=plan.recoveryRequest,pending=pendingWriteState(plan.pendingWrite);
  requireCondition(original&&validId(original.requestId)&&['save','recover'].includes(original.action)&&original.baseRevision===plan.activeRevision,'PLAN_ORIGINAL_IDENTITY_MISMATCH');
  requireCondition(pending?.state==='pending'&&pending.baseRevision===plan.activeRevision&&pending.revision===plan.targetRevision,'PLAN_SOURCE_IDENTITY_MISMATCH');
  requireCondition(request?.action==='recover'&&request.requestId===pending.requestId&&request.baseRevision===plan.activeRevision&&equal(request.data,original.data)&&hash(request.data)===plan.targetRevision,'PLAN_RECOVERY_CONTENT_MISMATCH');
  inspectIncident(request.data,plan.activeData);
}
function prepareApprovedRequest(plan,freshRead,approval){
  inspectPlan(plan);
  requireCondition(approval?.approved===true&&approval.planChecksum===plan.planChecksum&&approval.requestId===plan.pendingWrite.requestId&&approval.baseRevision===plan.activeRevision&&approval.targetRevision===plan.targetRevision,'EXPLICIT_APPROVAL_REQUIRED');
  const fresh=inspectRead(freshRead);
  requireCondition(fresh.revision===plan.activeRevision&&equal(freshRead.data,plan.activeData)&&equal(fresh.pendingWrite,plan.pendingWrite),'SOURCE_CHANGED_SINCE_APPROVAL');
  return copy(plan.recoveryRequest);
}
function verifyPersistence(plan,receipt,firstRead,secondRead){
  inspectPlan(plan);
  requireCondition(receipt&&receipt.ok===true&&receipt.persisted===true&&receipt.protocol==='tv-cas-v1'&&receipt.source==='shared'&&receipt.capabilities?.pendingWriteDiagnostics===1&&receipt.requestId===plan.pendingWrite.requestId&&receipt.revision===plan.targetRevision&&Number.isFinite(Date.parse(receipt.confirmedAt)),'RECOVERY_RECEIPT_MISMATCH');
  const first=inspectRead(firstRead),second=inspectRead(secondRead);
  requireCondition(first.revision===plan.targetRevision&&second.revision===plan.targetRevision&&equal(firstRead.data,plan.recoveryRequest.data)&&equal(secondRead.data,plan.recoveryRequest.data),'RECOVERY_PERSISTENCE_MISMATCH');
  const settled=pending=>pending===null||pending.state==='committed'&&pending.requestId===plan.pendingWrite.requestId&&pending.baseRevision===plan.activeRevision&&pending.revision===plan.targetRevision;
  requireCondition(settled(first.pendingWrite)&&settled(second.pendingWrite)&&equal(first.pendingWrite,second.pendingWrite),'RECOVERY_NOT_SETTLED');
  return{verified:true,revision:plan.targetRevision,clients:65,events:105,statuses:39,apartment16HistoryEntries:3,originalPendingWriteUntouched:true};
}
function summary(plan){
  inspectPlan(plan);
  return{readyForApproval:true,planChecksum:plan.planChecksum,originalRequestId:plan.originalPendingWrite.requestId,sourceRequestId:plan.pendingWrite.requestId,baseRevision:plan.activeRevision,targetRevision:plan.targetRevision,changedPaths:['finalPrices.16','priceHistory.16'],clients:65,events:105,statuses:39,networkOperations:0};
}
module.exports={createPlan,prepareApprovedRequest,verifyPersistence,summary};
