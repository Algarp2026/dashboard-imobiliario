'use strict';

// P1 executable specification only. No storage, HTTP, timers or production imports.
const assert=require('node:assert/strict');
const {createHash,randomUUID}=require('node:crypto');
const contract=require('../../docs/persistence-p1/contracts.v1.json');
const clone=value=>structuredClone(value);
const canonical=value=>Array.isArray(value)?'['+value.map(canonical).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}':JSON.stringify(value);
const hash=value=>createHash('sha256').update(typeof value==='string'?value:canonical(value)).digest('hex');
const legacyBytes=value=>Buffer.from(value,'utf16le');
const legacyHash=value=>createHash('sha256').update(legacyBytes(value)).digest('hex');
function requireFields(kind,value){
  assert.equal(value?.version,1,'Unsupported record version');
  for(const key of contract.records[kind].required)assert.ok(Object.hasOwn(value,key),kind+' missing '+key);
}
function fixture(count=3,padding=0){
  return {clients:Array.from({length:count},(_,i)=>({id:'fiction-client-'+i,name:'Synthetic client '+i,email:'fixture-'+i+'@example.test',notes:'Fictitious '+i,extra:{preserve:true}})),events:[{id:'fiction-event',clientId:'fiction-client-0',notes:'Synthetic event'}],agents:[],finalPrices:{8:400000,24:500000},statuses:{8:'Reservado',24:'Reservado'},priceHistory:{8:[{id:'fiction-price',price:400000}]},unknownRoot:{bytes:'x'.repeat(padding),preserved:true}};
}
function operation(base,data,revision=0,id=randomUUID()){
  const originalRequest={action:'save',requestId:id,baseRevision:hash(base),data:clone(data)};
  return {version:1,operationId:id,requestId:id,instanceId:'fiction-instance',expectedLocalRevision:revision,baseRemoteRevision:hash(base),baseRef:hash(base),payloadRef:hash(data),payloadHash:hash(data),requestHash:hash(originalRequest),originalRequest,phase:'LOCAL_DURABLE',writerEpoch:2};
}
function validateOperation(op){
  requireFields('operation',op);
  assert.ok(op.requestId&&op.operationId&&op.instanceId);
  assert.ok(Number.isSafeInteger(op.expectedLocalRevision)&&op.expectedLocalRevision>=0);
  assert.equal(op.originalRequest.requestId,op.requestId);
  assert.equal(op.originalRequest.baseRevision,op.baseRemoteRevision);
  assert.equal(op.baseRef,op.baseRemoteRevision);
  assert.equal(hash(op.originalRequest),op.requestHash);
  assert.equal(hash(op.originalRequest.data),op.payloadHash);
  assert.equal(op.payloadRef,op.payloadHash);
  assert.ok(contract.states.includes(op.phase));
}
function insertOperation(operations,op){
  validateOperation(op);
  const previous=operations[op.requestId];
  if(previous){assert.equal(previous.requestHash,op.requestHash,'IMMUTABLE_REQUEST_ID');return clone(operations);}
  return {...clone(operations),[op.requestId]:clone(op)};
}
function transition(from,to,proof={}){
  const edge=contract.transitions.find(x=>x.from===from&&x.to===to);
  assert.ok(edge,'FORBIDDEN_TRANSITION '+from+'>'+to);
  for(const guard of edge.requires)assert.equal(proof[guard],true,'MISSING_GUARD '+guard);
  return to;
}
function receiptMatches(op,receipt){
  requireFields('receipt',receipt);validateOperation(op);
  return receipt.status==='COMMITTED'&&receipt.requestId===op.requestId&&receipt.baseRevision===op.baseRemoteRevision&&receipt.resultRevision===op.payloadHash&&receipt.payloadHash===op.payloadHash&&receipt.requestHash===op.requestHash&&receipt.sourceId==='fiction-source'&&Boolean(receipt.commitRef&&receipt.confirmedAt);
}
function receipt(op,commitRef){return {version:1,requestId:op.requestId,baseRevision:op.baseRemoteRevision,resultRevision:op.payloadHash,payloadHash:op.payloadHash,requestHash:op.requestHash,commitRef,status:'COMMITTED',confirmedAt:'2026-11-05T12:00:00Z',sourceId:'fiction-source'};}
function envelope(op,base,data,receipts=[],snapshotRevision=0){
  const available={version:1,kind:'forensic',instanceId:op?.instanceId||'fiction-instance',data:clone(data),base:base?clone(base):null,baseRevision:base?hash(base):null,operation:op?clone(op):null,receipts:clone(receipts),snapshotRevision};
  try{validateOperation(op);assert.equal(hash(base),op.baseRef);assert.equal(hash(data),op.payloadRef);available.kind='recoverable';}catch{available.reason='NO_VERIFIABLE_COMMON_BASE_OR_REQUEST';}
  return {...available,checksum:hash(available)};
}
function validateExport(value){
  requireFields('export',value);const {checksum,...body}=value;assert.equal(hash(body),checksum);
  if(value.kind==='recoverable'){
    validateOperation(value.operation);assert.equal(hash(value.base),value.operation.baseRef);assert.equal(hash(value.data),value.operation.payloadRef);assert.equal(value.baseRevision,value.operation.baseRemoteRevision);assert.equal(value.instanceId,value.operation.instanceId);
  }else assert.equal(value.kind,'forensic');
}
function migrate(item,to,proof={}){
  requireFields('migration',item);assert.ok(contract.migrationEdges.includes(item.phase+'>'+to),'MIGRATION_ORDER');
  if(['VERIFIED','READY','ACTIVATED'].includes(to))assert.equal(proof.roundTripVerified,true,'MIGRATION_NOT_VERIFIED');
  if(to==='ACTIVATED')assert.equal(proof.transactionComplete,true,'MIGRATION_NOT_DURABLE');
  if(proof.quotaFailure)return clone(item);
  return {...clone(item),phase:to,cursor:item.cursor+1};
}
module.exports={contract,clone,canonical,hash,legacyBytes,legacyHash,fixture,operation,validateOperation,insertOperation,transition,receipt,receiptMatches,envelope,validateExport,migrate,requireFields};
