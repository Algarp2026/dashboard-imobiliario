import {commercialHash,fail} from '../persistence-p2/codec.mjs';
import {check} from '../persistence-p3/contracts.mjs';
import {inspectFragment,dataIssues} from '../persistence-p2/reader.mjs';
import {decodeOriginal,physicalCost} from './codecs.mjs';

export const EXTRA=['p4Audit','p4Pins','p4Archive','p4Migration','p4Prepared'];
const schemas={
 workspaces:'version workspaceId localRevision headRef baseRef baseRemoteRevision activeOperationId writerEpoch confirmationScope sourceId recordHash',
 instances:'version instanceId workspaceId identityHash view generation recordHash',
 operations:'version operationId requestId instanceId workspaceId expectedLocalRevision baseRemoteRevision baseRef payloadRef payloadHash requestHash originalRequest phase writerEpoch sequence receiptRef ackApplied confirmationScope sourceId recordHash',
 requests:'version requestId operationId requestHash recordHash',
 branches:'version branchId operationId instanceId workspaceId baseRef payloadRef expectedLocalRevision observedLocalRevision conflictPaths resolved recordHash',
 receipts:'version status requestId baseRevision resultRevision requestHash payloadHash commitRef confirmedAt sourceId laboratoryOnly recordHash',
 p4Audit:'version id bodyRef rawHash mediaType origin recordHash',
 p4Pins:'version id kind bodyRefs recordHash',
 p4Archive:'version id bodyRef sourceKey fragmentKind classification opaque issues recordHash',
 p4Migration:'version id phase bodyRefs cursor recordHash',
 p4Prepared:'version id bodyRef originalPhysicalHash body phase recordHash'
};
const viewKeys='workspaceId localRevision headRef baseRef baseRemoteRevision activeOperationId writerEpoch sourceId branchId proposalExpectedLocalRevision'.split(' ');
export function scan(snapshot){
  const links=new Map(),blockers=[],known=new Set(['bodies',...Object.keys(schemas)]),add=(ref,reason)=>{if(typeof ref!=='string'){blockers.push('INVALID_REFERENCE');return;}if(!links.has(ref))links.set(ref,[]);links.get(ref).push(reason);};
  for(const store of Object.keys(snapshot))if(!known.has(store))blockers.push('UNKNOWN_STORE');
  for(const [store,list]of Object.entries(snapshot)){
    if(!Array.isArray(list)){blockers.push('UNKNOWN_COLLECTION');continue;}if(store==='bodies')continue;
    for(const row of list){
      if(!row||typeof row!=='object'||row.version!==1||!schemas[store]||schemas[store].split(' ').some(k=>!Object.hasOwn(row,k))||Object.keys(row).some(k=>!schemas[store].split(' ').includes(k)))blockers.push('UNKNOWN_RECORD');
      if(['workspaces','operations'].includes(store)&&row.writerEpoch!==2)blockers.push('UNKNOWN_WRITER');
      if(store==='workspaces'&&(!Number.isSafeInteger(row.localRevision)||row.localRevision<0)||store==='instances'&&(!Number.isSafeInteger(row.generation)||row.generation<0)||store==='operations'&&(!Number.isSafeInteger(row.sequence)||row.sequence<0||!Number.isSafeInteger(row.expectedLocalRevision)||row.expectedLocalRevision<0))blockers.push('INVALID_REVISION');
      if(store==='workspaces'){add(row.headRef,'workspace-head');add(row.baseRef,'verified-base');if(row.activeOperationId&&!snapshot.operations?.some(x=>x.operationId===row.activeOperationId))blockers.push('MISSING_OPERATION');}
      if(store==='instances'){if(!row.view||Object.keys(row.view).some(k=>!viewKeys.includes(k)))blockers.push('UNKNOWN_INSTANCE_VIEW');add(row.view?.headRef,'instance-head');add(row.view?.baseRef,'instance-base');}
      if(store==='operations'){add(row.baseRef,'operation-base:'+row.phase);add(row.payloadRef,'operation-payload:'+row.phase);if(!['UI_DIRTY','LOCAL_DURABLE','SENDING','REMOTE_UNKNOWN','REMOTE_COMMITTED','LOCAL_ACK_PENDING','SYNCED','CONFLICT','STORAGE_BLOCKED'].includes(row.phase))blockers.push('UNKNOWN_OPERATION_PHASE');if(row.receiptRef&&!snapshot.receipts?.some(x=>x.requestId===row.receiptRef))blockers.push('MISSING_RECEIPT');if(!snapshot.requests?.some(x=>x.requestId===row.requestId&&x.operationId===row.operationId&&x.requestHash===row.requestHash))blockers.push('MISSING_REQUEST_INDEX');}
      if(store==='operations'&&(!row.originalRequest||Object.keys(row.originalRequest).some(k=>!['action','requestId','baseRevision'].includes(k))))blockers.push('UNKNOWN_REQUEST_METADATA');
      if(store==='requests'&&!snapshot.operations?.some(x=>x.operationId===row.operationId&&x.requestId===row.requestId&&x.requestHash===row.requestHash))blockers.push('MISSING_OPERATION');
      if(store==='branches'){add(row.baseRef,'conflict-base');add(row.payloadRef,'conflict-payload');if(!snapshot.operations?.some(x=>x.operationId===row.operationId))blockers.push('MISSING_OPERATION');}
      if(store==='receipts'){const op=snapshot.operations?.find(x=>x.receiptRef===row.requestId);if(!op||row.requestHash!==op.requestHash||row.payloadHash!==op.payloadHash||row.resultRevision!==op.payloadHash||row.baseRevision!==op.baseRemoteRevision||row.sourceId!==op.sourceId)blockers.push('INCOMPATIBLE_RECEIPT');else{add(op.baseRef,'receipt-base');add(op.payloadRef,'receipt-payload');}}
      if(['p4Pins','p4Migration'].includes(store)){if(!Array.isArray(row.bodyRefs))blockers.push('UNKNOWN_REFERENCES');else for(const ref of row.bodyRefs)add(ref,store==='p4Migration'?'migration-checkpoint':row.kind);if(store==='p4Pins'&&!['CHECKPOINT','HISTORY','UNCERTAIN'].includes(row.kind)||store==='p4Migration'&&!['DISCOVERED','COPYING','VERIFIED','READY'].includes(row.phase))blockers.push('UNKNOWN_PROTECTION');}
      if(store==='p4Archive'){add(row.bodyRef,'historical-archive:'+row.classification);if(typeof row.opaque!=='boolean'||typeof row.sourceKey!=='string'||!Array.isArray(row.issues)||row.issues.some(x=>typeof x!=='string'||!/^[A-Z0-9_]+$/.test(x)))blockers.push('UNKNOWN_ARCHIVE_METADATA');if(row.opaque||['UNKNOWN','INSUFFICIENT_INTEGRITY'].includes(row.classification)||!['RECOVERABLE','PENDING','CONFLICT','UNKNOWN','INSUFFICIENT_INTEGRITY'].includes(row.classification))blockers.push('OPAQUE_ARCHIVE_REVIEW_REQUIRED');}
      if(store==='p4Prepared'){add(row.bodyRef,'prepared-representation');if(row.phase!=='PREPARED')blockers.push('UNKNOWN_PREPARATION');}
      if(store==='p4Audit'&&(row.origin!=='LAB_SCRATCH'||row.id!==row.bodyRef))blockers.push('UNKNOWN_PROVENANCE');
    }
  }
  for(const ref of links.keys())if(!snapshot.bodies?.some(x=>x.bodyRef===ref))blockers.push('MISSING_BODY');
  return {links,blockers:[...new Set(blockers)]};
}
export async function sealPrepared(row){const header={...row,body:Object.fromEntries(Object.entries(row.body).filter(([k])=>k!=='bytes'))};delete header.recordHash;return {...row,recordHash:await commercialHash(header)};}
export function preparedBody(row){if(!Array.isArray(row.body?.bytes)||row.body.bytes.some(x=>!Number.isInteger(x)||x<0||x>255))fail('P4_PREPARATION_INTEGRITY');return {...row.body,bytes:Uint8Array.from(row.body.bytes)};}
export async function validatePrepared(row){if((await sealPrepared(row)).recordHash!==row.recordHash)fail('P4_PREPARATION_INTEGRITY');await decodeOriginal(preparedBody(row));}
export async function inventory(snapshot){
  const result=scan(snapshot),blockers=[...result.blockers];
  for(const [store,rows]of Object.entries(snapshot))if(store!=='bodies')for(const row of rows)try{if(store==='p4Prepared')await validatePrepared(row);else await check(row);}catch{blockers.push('RECORD_INTEGRITY');}
  // Preserve even reference-shaped strings in extensible payload fields, conservatively.
  const validBodies=new Set(),values=new Map();
  for(const body of snapshot.bodies)try{
    const value=await decodeOriginal(body),seen=new Set();validBodies.add(body.bodyRef);values.set(body.bodyRef,value);
    function walk(v){if(typeof v==='string'){for(const ref of v.match(/b1:(?:u16|graph):[a-f0-9]{64}/g)||[]){if(!result.links.has(ref))result.links.set(ref,[]);result.links.get(ref).push('embedded-reference');}try{const parsed=JSON.parse(v);if(parsed&&typeof parsed==='object')walk(parsed);}catch{}return;}
      if(!v||typeof v!=='object'||seen.has(v))return;seen.add(v);if(v instanceof Map)for(const [k,x]of v){walk(k);walk(x);}else if(v instanceof Set)for(const x of v)walk(x);else if(!ArrayBuffer.isView(v)&&!(v instanceof ArrayBuffer)&&!(v instanceof Blob))for(const x of Object.values(v))walk(x);}
    walk(value);
  }catch{blockers.push('BODY_INTEGRITY');}
  const jsonCache=new Map(),hashCache=new Map();
  const json=ref=>{if(!jsonCache.has(ref)){const value=values.get(ref);if(typeof value!=='string')fail('P4_DATA_FORMAT');const data=JSON.parse(value);if(dataIssues(data).length)fail('P4_DATA_FORMAT');jsonCache.set(ref,data);}return jsonCache.get(ref);};
  const dataHash=async ref=>{if(!hashCache.has(ref))hashCache.set(ref,await commercialHash(json(ref)));return hashCache.get(ref);};
  for(const w of snapshot.workspaces||[])try{if(await dataHash(w.baseRef)!==w.baseRemoteRevision||w.activeOperationId&&!snapshot.operations.some(o=>o.operationId===w.activeOperationId&&o.workspaceId===w.workspaceId&&o.payloadRef===w.headRef))fail('P4_WORKSPACE_REFERENCE');json(w.headRef);}catch{blockers.push('WORKSPACE_INTEGRITY');}
  for(const i of snapshot.instances||[])try{if(await dataHash(i.view.baseRef)!==i.view.baseRemoteRevision||i.workspaceId!==i.view.workspaceId)fail('P4_INSTANCE_REFERENCE');json(i.view.headRef);}catch{blockers.push('INSTANCE_INTEGRITY');}
  for(const o of snapshot.operations||[])try{if(await dataHash(o.baseRef)!==o.baseRemoteRevision||await dataHash(o.payloadRef)!==o.payloadHash||o.originalRequest.requestId!==o.requestId||o.originalRequest.baseRevision!==o.baseRemoteRevision||await commercialHash({...o.originalRequest,data:json(o.payloadRef)})!==o.requestHash)fail('P4_OPERATION_REFERENCE');}catch{blockers.push('OPERATION_INTEGRITY');}
  for(const a of snapshot.p4Archive||[])try{const parsed=await inspectFragment({id:a.sourceKey,kind:a.fragmentKind,value:values.get(a.bodyRef)}),opaque=['UNKNOWN','INSUFFICIENT_INTEGRITY'].includes(parsed.report.classification);if(parsed.report.classification!==a.classification||opaque!==a.opaque||JSON.stringify(parsed.report.issues)!==JSON.stringify(a.issues))fail('P4_ARCHIVE_REFERENCE');}catch{blockers.push('ARCHIVE_INTEGRITY');}
  for(const ref of result.links.keys())if(!snapshot.bodies.some(b=>b.bodyRef===ref))blockers.push('MISSING_BODY');
  const bodies=[];let encodedBytes=0,originalBytes=0,metadataBytes=0;
  for(const body of snapshot.bodies){
    const reasons=[...(result.links.get(body.bodyRef)||[])],audit=snapshot.p4Audit?.find(a=>a.bodyRef===body.bodyRef);let valid=true;
    if(!validBodies.has(body.bodyRef)){valid=false;blockers.push('BODY_INTEGRITY');reasons.push('unknown-or-invalid-encoding');}
    if(audit&&(audit.rawHash!==body.rawHash||audit.mediaType!==body.mediaType))blockers.push('PROVENANCE_MISMATCH');
    const mandatory=reasons.some(r=>!r.endsWith(':SYNCED')&&!['receipt-base','receipt-payload','HISTORY','historical-archive:RECOVERABLE'].includes(r));
    const category=reasons.length?mandatory?'MANDATORY_PROTECTION':'OPERATIONAL_SAFETY_RETENTION':valid&&audit?.origin==='LAB_SCRATCH'?'POTENTIALLY_RELEASABLE':'UNKNOWN_OR_UNVERIFIABLE';
    if(!reasons.length&&category==='UNKNOWN_OR_UNVERIFIABLE')reasons.push('no-proven-disposable-origin');
    const cost=valid?physicalCost(body):0;encodedBytes+=body.encodedBytes||0;originalBytes+=body.decodedBytes||0;metadataBytes+=valid?cost-body.encodedBytes:0;
    bodies.push({bodyRef:body.bodyRef,category,reasons,dependencies:result.links.get(body.bodyRef)||[],cost,encodedBytes:body.encodedBytes||0,originalBytes:body.decodedBytes||0,valid});
  }
  const unique=[...new Set(blockers)],candidates=unique.length?[]:bodies.filter(x=>x.category==='POTENTIALLY_RELEASABLE').map(x=>x.bodyRef);
  return {bodies,blockers:unique,candidates,uniqueBodies:bodies.length,references:[...result.links.values()].reduce((n,a)=>n+a.length,0),encodedBytes,originalBytes,serializedMetadataBytes:metadataBytes,temporaryBytes:(snapshot.p4Prepared||[]).reduce((n,r)=>n+(r.body?.encodedBytes||0),0),safeReclaimableBytes:bodies.filter(b=>candidates.includes(b.bodyRef)).reduce((n,b)=>n+b.cost,0),remoteConfirmation:'NOT_ESTABLISHED_BY_RETENTION'};
}
