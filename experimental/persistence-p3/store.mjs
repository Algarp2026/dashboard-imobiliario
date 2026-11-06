import {fail,commercialHash,encodeOriginal,decodeOriginal} from '../persistence-p2/codec.mjs';
import {dataIssues} from '../persistence-p2/reader.mjs';
import {EPOCH,PHASES,same,id,revision,lab,seal,check,edge} from './contracts.mjs';

export const STORES=['workspaces','instances','bodies','operations','requests','branches','receipts'];
const clone=v=>structuredClone(v);
const error=code=>Object.assign(new Error(code),{code});
const bump=value=>{if(!Number.isSafeInteger(value)||value<0||value>=Number.MAX_SAFE_INTEGER)fail('P3_REVISION_EXHAUSTED');return value+1;};
const bodyEqual=(a,b)=>a?.version===1&&b?.version===1&&Object.keys(a).length===8&&Object.keys(b).length===8&&a.bodyRef===b.bodyRef&&a.rawHash===b.rawHash&&a.mediaType===b.mediaType&&a.codec===b.codec&&a.encodedBytes===b.encodedBytes&&a.decodedBytes===b.decodedBytes&&a.bytes instanceof Uint8Array&&b.bytes instanceof Uint8Array&&a.bytes.length===b.bytes.length&&a.bytes.every((v,i)=>v===b.bytes[i]);
async function dataBody(data){if(dataIssues(data).length)fail('P3_INVALID_DATA');return encodeOriginal(JSON.stringify(data));}

export async function openLocal({factory,origin,name='the-view-p3-lab.v1',synthetic=false,remote=null}={}){
  lab(origin,name,synthetic);if(!factory||remote&&(!remote.labOnly||!/^fiction-p3-/.test(remote.sourceId)))fail('P3_LAB_ONLY');
  const db=await new Promise((resolve,reject)=>{
    const r=factory.open(name,1);let stopped=false;
    r.onupgradeneeded=()=>{for(const s of STORES)r.result.createObjectStore(s,{keyPath:s==='bodies'?'bodyRef':s==='workspaces'?'workspaceId':s==='instances'?'instanceId':s==='operations'?'operationId':s==='requests'?'requestId':s==='branches'?'branchId':'requestId'});};
    r.onerror=r.onblocked=()=>{stopped=true;reject(error('P3_DATABASE_UNAVAILABLE'));};
    r.onsuccess=()=>{if(stopped){r.result.close();return;}r.result.onversionchange=()=>r.result.close();resolve(r.result);};
  });
  function transaction(mode,action){return new Promise((resolve,reject)=>{
    let tx,result,cause;
    try{tx=db.transaction(STORES,mode,mode==='readwrite'?{durability:'strict'}:undefined);}catch{reject(error('P3_TRANSACTION_UNAVAILABLE'));return;}
    const abort=e=>{cause ||= typeof e?.code==='string'&&e.code.startsWith('P3_')?e:error(e?.name==='QuotaExceededError'?'P3_QUOTA':'P3_ABORT');try{tx.abort();}catch{}};
    tx.onabort=()=>reject(cause||error(tx.error?.name==='QuotaExceededError'?'P3_QUOTA':'P3_ABORT'));
    tx.onerror=e=>{e.preventDefault();abort(e.target.error);};tx.oncomplete=()=>resolve(result);
    try{action(tx,v=>result=v,abort);}catch(e){abort(e);}
  });}
  function snapshot(){return transaction('readonly',(tx,done,abort)=>{
    const rows={};let left=STORES.length;for(const s of STORES){const r=tx.objectStore(s).getAll();r.onsuccess=()=>{try{rows[s]=r.result;if(!--left)done(rows);}catch(e){abort(e);}};}
  });}
  // Compare the complete captured metadata and immutable bodies in the transaction.
  // Crypto, reconstruction, adapters and timers are all outside this critical section.
  function mutate(before,rows,bodies=[],result=null){return transaction('readwrite',(tx,done,abort)=>{
    const now={};let left=STORES.length;
    for(const s of STORES){const r=tx.objectStore(s).getAll();r.onsuccess=()=>{try{
      now[s]=r.result;if(--left)return;
      if(!STORES.every(k=>k==='bodies'?now[k].length===before[k].length&&now[k].every((b,i)=>bodyEqual(b,before[k][i])):same(now[k],before[k])))fail('P3_CONCURRENT_CHANGE');
      for(const b of bodies){const old=now.bodies.find(x=>x.bodyRef===b.bodyRef);if(old&&!bodyEqual(old,b))fail('P3_IMMUTABLE_BODY');if(!old)tx.objectStore('bodies').add(b);}
      for(const [store,list]of Object.entries(rows))for(const row of list)tx.objectStore(store).put(row);
      done(result);
    }catch(e){abort(e);}};}
  });}
  async function decode(ref,s){const b=s.bodies.find(x=>x.bodyRef===ref);if(!b)fail('P3_MISSING_BODY');const value=await decodeOriginal(b);if(typeof value!=='string')fail('P3_BODY_TYPE');const data=JSON.parse(value);if(dataIssues(data).length)fail('P3_INVALID_DATA');return data;}
  async function instance(handle,s){
    if(!id(handle?.instanceId)||typeof handle?.token!=='string')fail('P3_INSTANCE');
    const row=s.instances.find(x=>x.instanceId===handle.instanceId);await check(row);
    if(row.identityHash!==await commercialHash({instanceId:handle.instanceId,token:handle.token,workspaceId:row.workspaceId,origin}))fail('P3_INSTANCE');
    return row;
  }
  async function operation(handle,operationId,s){const i=await instance(handle,s),o=s.operations.find(x=>x.operationId===operationId);await check(o);if(o.instanceId!==i.instanceId||o.workspaceId!==i.workspaceId||!PHASES.includes(o.phase))fail('P3_OPERATION_OWNER');const index=s.requests.find(x=>x.requestId===o.requestId);await check(index);if(index.operationId!==o.operationId||index.requestHash!==o.requestHash)fail('P3_REQUEST_REFERENCE');return {i,o};}
  async function reconstruct(o,s){
    await check(o);const data=await decode(o.payloadRef,s),base=await decode(o.baseRef,s),request={...o.originalRequest,data};
    if(await commercialHash(data)!==o.payloadHash||await commercialHash(base)!==o.baseRemoteRevision||await commercialHash(request)!==o.requestHash||request.requestId!==o.requestId||request.baseRevision!==o.baseRemoteRevision)fail('P3_OPERATION_INTEGRITY');
    return request;
  }
  const view=w=>({workspaceId:w.workspaceId,localRevision:w.localRevision,headRef:w.headRef,baseRef:w.baseRef,baseRemoteRevision:w.baseRemoteRevision,activeOperationId:w.activeOperationId,writerEpoch:w.writerEpoch,sourceId:w.sourceId});
  async function createWorkspace({workspaceId,data,initialLocalRevision=0}={}){
    if(!id(workspaceId)||!Number.isSafeInteger(initialLocalRevision)||initialLocalRevision<0)fail('P3_WORKSPACE');
    if(!remote||typeof remote.read!=='function')fail('P3_BASE_UNVERIFIED');
    const verified=await remote.read(),hash=await commercialHash(data);
    if(!verified.laboratoryOnly||verified.sourceId!==remote.sourceId||verified.apiEpoch!==EPOCH||verified.sourceEpoch!==EPOCH||verified.revision!==hash||!same(verified.data,data))fail('P3_BASE_UNVERIFIED');
    const b=await dataBody(data),s=await snapshot();
    if(s.workspaces.some(x=>x.workspaceId===workspaceId))fail('P3_WORKSPACE_EXISTS');
    const w=await seal({version:1,workspaceId,localRevision:initialLocalRevision,headRef:b.bodyRef,baseRef:b.bodyRef,baseRemoteRevision:hash,activeOperationId:null,writerEpoch:EPOCH,confirmationScope:'LABORATORY_ONLY',sourceId:remote?.sourceId||null});
    await mutate(s,{workspaces:[w]},[b]);return clone(w);
  }
  async function createInstance(workspaceId){
    const s=await snapshot(),w=s.workspaces.find(x=>x.workspaceId===workspaceId);await check(w);
    const handle={instanceId:crypto.randomUUID(),token:crypto.randomUUID()};
    if(s.instances.some(x=>x.instanceId===handle.instanceId))fail('P3_ID_COLLISION');
    const i=await seal({version:1,instanceId:handle.instanceId,workspaceId,identityHash:await commercialHash({...handle,workspaceId,origin}),view:view(w),generation:0});
    await mutate(s,{instances:[i]});return handle;
  }
  async function read(handle,{refresh=false}={}){
    const s=await snapshot(),i=await instance(handle,s),w=s.workspaces.find(x=>x.workspaceId===i.workspaceId);await check(w);
    if(refresh){const next=await seal({...i,view:view(w),generation:bump(i.generation)});await mutate(s,{instances:[next]});return {view:clone(next.view),data:await decode(next.view.headRef,s),base:await decode(next.view.baseRef,s)};}
    return {view:clone(i.view),data:await decode(i.view.headRef,s),base:await decode(i.view.baseRef,s)};
  }
  async function stage(handle,data,{expectedLocalRevision,requestId=crypto.randomUUID()}={}){
    if(!id(requestId)||!Number.isSafeInteger(expectedLocalRevision)||expectedLocalRevision<0)fail('P3_PROPOSAL');
    const payload=await dataBody(data);
    for(let attempt=0;attempt<8;attempt++){
    const s=await snapshot(),i=await instance(handle,s);
    if(i.view.sourceId!==(remote?.sourceId||null))fail('P3_SOURCE_IDENTITY');
    const existing=s.requests.find(x=>x.requestId===requestId);
    if(existing){await check(existing);const old=s.operations.find(x=>x.operationId===existing.operationId);await check(old);if(old.instanceId!==i.instanceId||old.expectedLocalRevision!==expectedLocalRevision||old.requestHash!==await commercialHash({...old.originalRequest,data}))fail('P3_REQUEST_ID_COLLISION');await reconstruct(old,s);return clone(old);}
    if(s.operations.some(x=>x.requestId===requestId))fail('P3_REQUEST_REFERENCE');
    if(i.view.branchId)fail('P3_BRANCH_REVIEW_REQUIRED');
    if(i.view.localRevision!==expectedLocalRevision)fail('P3_INSTANCE_REVISION');
    const base=await decode(i.view.baseRef,s);if(await commercialHash(base)!==i.view.baseRemoteRevision)fail('P3_BASE_INTEGRITY');
    const original={action:'save',requestId,baseRevision:i.view.baseRemoteRevision},requestHash=await commercialHash({...original,data});
    const operationId=crypto.randomUUID();if(s.operations.some(x=>x.operationId===operationId))fail('P3_ID_COLLISION');
    const o=await seal({version:1,operationId,requestId,instanceId:i.instanceId,workspaceId:i.workspaceId,expectedLocalRevision,baseRemoteRevision:i.view.baseRemoteRevision,baseRef:i.view.baseRef,payloadRef:payload.bodyRef,payloadHash:await commercialHash(data),requestHash,originalRequest:original,phase:'UI_DIRTY',writerEpoch:EPOCH,sequence:0,receiptRef:null,ackApplied:false,confirmationScope:'LABORATORY_ONLY',sourceId:remote?.sourceId||null});
    const index=await seal({version:1,requestId,operationId,requestHash});
    try{await mutate(s,{operations:[o],requests:[index]},[payload]);return clone(o);}catch(e){if(e.code!=='P3_CONCURRENT_CHANGE')throw e;}
    }fail('P3_BUSY');
  }
  async function commit(handle,operationId){
    // Retry only transaction conflicts; the durable original is never reconstructed from current UI.
    for(let retry=0;retry<8;retry++){
      const s=await snapshot(),{i,o}=await operation(handle,operationId,s);await reconstruct(o,s);
      if(!['UI_DIRTY','STORAGE_BLOCKED'].includes(o.phase))return clone(o);
      const w=s.workspaces.find(x=>x.workspaceId===i.workspaceId);await check(w);const conflict=w.localRevision!==o.expectedLocalRevision;
      const next=await seal({...o,phase:conflict?'CONFLICT':'LOCAL_DURABLE',sequence:bump(o.sequence)}),rows={operations:[next]};
      let nextView;
      if(conflict){
        const b=await seal({version:1,branchId:o.operationId,operationId:o.operationId,instanceId:i.instanceId,workspaceId:i.workspaceId,baseRef:o.baseRef,payloadRef:o.payloadRef,expectedLocalRevision:o.expectedLocalRevision,observedLocalRevision:w.localRevision,conflictPaths:['$head'],resolved:false});rows.branches=[b];
        nextView={workspaceId:o.workspaceId,localRevision:w.localRevision,headRef:o.payloadRef,baseRef:o.baseRef,baseRemoteRevision:o.baseRemoteRevision,activeOperationId:o.operationId,writerEpoch:o.writerEpoch,sourceId:o.sourceId,branchId:b.branchId,proposalExpectedLocalRevision:o.expectedLocalRevision};
      }else{
        const head=await seal({...w,localRevision:bump(w.localRevision),headRef:o.payloadRef,activeOperationId:o.operationId});rows.workspaces=[head];nextView=view(head);
      }
      rows.instances=[await seal({...i,view:nextView,generation:bump(i.generation)})];
      try{await mutate(s,rows,[],next);return clone(next);}catch(e){if(e.code!=='P3_CONCURRENT_CHANGE')throw e;}
    }fail('P3_BUSY');
  }
  async function save(handle,data,options){const o=await stage(handle,data,options);try{return await commit(handle,o.operationId);}catch(e){if(['P3_QUOTA','P3_ABORT'].includes(e.code))try{await updatePhase(handle,o.operationId,'STORAGE_BLOCKED');}catch{}throw e;}}
  async function updatePhase(handle,operationId,to,receipt=null){
    const s=await snapshot(),{o}=await operation(handle,operationId,s);await reconstruct(o,s);edge(o.phase,to);
    const next=await seal({...o,phase:to,sequence:bump(o.sequence),...(receipt?{receiptRef:receipt.requestId}:{})}),rows={operations:[next]};
    if(receipt)rows.receipts=[await seal(receipt)];await mutate(s,rows);return next;
  }
  async function acceptReceipt(handle,operationId,receipt){
    if(!remote)fail('P3_NO_LAB_SOURCE');const s=await snapshot(),{o}=await operation(handle,operationId,s),request=await reconstruct(o,s);if(o.sourceId!==remote.sourceId)fail('P3_SOURCE_IDENTITY');
    const proof=await remote.verifyReceipt(receipt,request);
    if(!proof.laboratoryOnly||proof.sourceId!==remote.sourceId||proof.status!=='COMMITTED'||proof.requestHash!==o.requestHash||proof.payloadHash!==o.payloadHash||proof.resultRevision!==o.payloadHash||proof.baseRevision!==o.baseRemoteRevision)fail('P3_RECEIPT');
    if(['REMOTE_COMMITTED','LOCAL_ACK_PENDING','SYNCED'].includes(o.phase)){const prior=s.receipts.find(x=>x.requestId===o.requestId);await check(prior);const clean={...prior};delete clean.recordHash;if(!same(clean,proof))fail('P3_RECEIPT');return clone(o);}
    return updatePhase(handle,operationId,'REMOTE_COMMITTED',proof);
  }
  async function acknowledge(handle,operationId){
    const s=await snapshot(),{i,o}=await operation(handle,operationId,s),request=await reconstruct(o,s);
    if(!remote||o.sourceId!==remote.sourceId)fail('P3_SOURCE_IDENTITY');
    const current=s.workspaces.find(x=>x.workspaceId===i.workspaceId);await check(current);
    const laterDraft=s.operations.some(x=>x.workspaceId===o.workspaceId&&x.operationId!==o.operationId&&x.expectedLocalRevision>=o.expectedLocalRevision&&['UI_DIRTY','STORAGE_BLOCKED'].includes(x.phase));
    if(!['REMOTE_COMMITTED','LOCAL_ACK_PENDING','SYNCED'].includes(o.phase)||!remote)fail('P3_ACK_WITHOUT_PROOF');
    const receipt=s.receipts.find(x=>x.requestId===o.receiptRef);await check(receipt);const proof={...receipt};delete proof.recordHash;await remote.verifyReceipt(proof,request);
    if(o.phase==='SYNCED')return {operation:o,headSynced:current.headRef===o.payloadRef&&current.activeOperationId===null&&!laterDraft,laboratoryOnly:true};
    const w=s.workspaces.find(x=>x.workspaceId===i.workspaceId);await check(w);
    const exactHead=w.headRef===o.payloadRef&&w.activeOperationId===o.operationId&&!laterDraft;
    const advanceBase=w.baseRemoteRevision===o.baseRemoteRevision;
    const nextW=await seal({...w,...(advanceBase?{baseRef:o.payloadRef,baseRemoteRevision:o.payloadHash}:{}),...(exactHead?{activeOperationId:null}:{}),localRevision:bump(w.localRevision)});
    const next=await seal({...o,phase:exactHead?'SYNCED':o.phase,sequence:bump(o.sequence),ackApplied:true});
    if(o.ackApplied&&!exactHead)return {operation:o,headSynced:false,laboratoryOnly:true};
    const rows={workspaces:[nextW],operations:[next]};
    if(i.view.activeOperationId===o.operationId&&i.view.headRef===o.payloadRef)rows.instances=[await seal({...i,view:view(nextW),generation:bump(i.generation)})];
    try{await mutate(s,rows);return {operation:next,headSynced:exactHead,laboratoryOnly:true};}
    catch(e){try{if(o.phase==='REMOTE_COMMITTED')await updatePhase(handle,operationId,'LOCAL_ACK_PENDING');}catch{}throw e;}
  }
  async function send(handle,operationId,{retryOriginal=false}={}){
    if(!remote)fail('P3_NO_LAB_SOURCE');const s=await snapshot(),{o}=await operation(handle,operationId,s),request=await reconstruct(o,s);if(o.sourceId!==remote.sourceId)fail('P3_SOURCE_IDENTITY');
    if(['REMOTE_COMMITTED','LOCAL_ACK_PENDING','SYNCED'].includes(o.phase))return acknowledge(handle,operationId);
    if(!['LOCAL_DURABLE','REMOTE_UNKNOWN'].includes(o.phase)||o.phase==='REMOTE_UNKNOWN'&&!retryOriginal)fail('P3_SEND_STATE');
    const preflight=await remote.preflight(request,EPOCH);
    if(preflight.receipt){if(o.phase==='LOCAL_DURABLE')fail('P3_UNEXPECTED_REMOTE_COMMIT');await acceptReceipt(handle,operationId,preflight.receipt);return acknowledge(handle,operationId);}
    if(!preflight.laboratoryOnly||preflight.sourceId!==remote.sourceId||preflight.revision!==o.baseRemoteRevision||preflight.apiEpoch!==EPOCH||preflight.sourceEpoch!==EPOCH||typeof preflight.ticket!=='string')fail('P3_PREFLIGHT');
    await updatePhase(handle,operationId,'SENDING');let receipt;
    try{receipt=await remote.write(request,preflight.ticket,EPOCH);}catch(e){await updatePhase(handle,operationId,'REMOTE_UNKNOWN');return {operationId,phase:'REMOTE_UNKNOWN',headSynced:false,error:e.code||'P3_SOURCE_ERROR',laboratoryOnly:true};}
    await acceptReceipt(handle,operationId,receipt);return acknowledge(handle,operationId);
  }
  async function recover(handle,operationId){
    if(!remote)fail('P3_NO_LAB_SOURCE');const s=await snapshot(),{o}=await operation(handle,operationId,s),request=await reconstruct(o,s);if(o.sourceId!==remote.sourceId)fail('P3_SOURCE_IDENTITY');
    if(o.phase==='SENDING')await updatePhase(handle,operationId,'REMOTE_UNKNOWN');
    const receipt=await remote.inspect(request);
    if(receipt.status==='COMMITTED'){await acceptReceipt(handle,operationId,receipt);return acknowledge(handle,operationId);}
    return {phase:'REMOTE_UNKNOWN',sourceStatus:receipt.status,headSynced:false,originalPreserved:true,laboratoryOnly:true};
  }
  async function exportInstance(handle,{memoryDraft}={}){
    // One readonly transaction captures all stores. No global syncMeta or live UI is consulted.
    const s=await snapshot(),i=await instance(handle,s),issues=[],selected=i.view;
    const operations=s.operations.filter(o=>o.instanceId===i.instanceId||o.operationId===selected.activeOperationId),branches=s.branches.filter(b=>b.instanceId===i.instanceId),receipts=s.receipts.filter(r=>operations.some(o=>o.receiptRef===r.requestId));
    if(selected.activeOperationId&&!operations.some(o=>o.operationId===selected.activeOperationId))issues.push('P3_MISSING_OPERATION');
    for(const o of operations){const index=s.requests.find(r=>r.requestId===o.requestId);if(!index||index.operationId!==o.operationId||index.requestHash!==o.requestHash)issues.push('P3_REQUEST_REFERENCE');else try{await check(index);}catch(e){issues.push(e.code);}if(o.receiptRef&&!receipts.some(r=>r.requestId===o.receiptRef))issues.push('P3_MISSING_RECEIPT');}
    if(branches.some(b=>!operations.some(o=>o.operationId===b.operationId)))issues.push('P3_MISSING_OPERATION');
    const refs=new Set([selected.headRef,selected.baseRef]);for(const o of operations){refs.add(o.baseRef);refs.add(o.payloadRef);}for(const b of branches){refs.add(b.baseRef);refs.add(b.payloadRef);}
    let data=null,base=null;const decodedOps=[];
    try{data=await decode(selected.headRef,s);base=await decode(selected.baseRef,s);if(await commercialHash(base)!==selected.baseRemoteRevision)fail('P3_BASE_INTEGRITY');}catch(e){issues.push(e.code||'P3_HEAD_INTEGRITY');}
    for(const row of [...operations,...branches,...receipts])try{await check(row);}catch(e){issues.push(e.code);}
    for(const r of receipts){const o=operations.find(o=>o.requestId===r.requestId);if(!o||r.requestHash!==o.requestHash||r.payloadHash!==o.payloadHash||r.resultRevision!==o.payloadHash||r.baseRevision!==o.baseRemoteRevision||r.sourceId!==o.sourceId||r.status!=='COMMITTED'||r.laboratoryOnly!==true)issues.push('P3_RECEIPT_REFERENCE');}
    for(const o of operations)try{decodedOps.push({...o,originalRequest:await reconstruct(o,s)});}catch(e){issues.push(e.code||'P3_OPERATION_INTEGRITY');}
    const bodies=[];for(const ref of refs){const b=s.bodies.find(x=>x.bodyRef===ref);if(!b){issues.push('P3_MISSING_BODY');continue;}try{await decodeOriginal(b);}catch(e){issues.push(e.code||'P3_BODY_INTEGRITY');}bodies.push({...b,bytes:Array.from(b.bytes)});}
    if(memoryDraft!==undefined)issues.push('MEMORY_DRAFT_NOT_DURABLE');
    const envelope={version:1,kind:issues.length?'FORENSIC':'RECOVERABLE',instanceId:i.instanceId,workspaceId:i.workspaceId,snapshotRevision:selected.localRevision,view:clone(selected),data,base,baseRevision:selected.baseRemoteRevision,operation:decodedOps.find(o=>o.operationId===selected.activeOperationId)||null,operations:decodedOps,branches:clone(branches),receipts:clone(receipts),bodies,integrity:{issues:[...new Set(issues)],remoteConfirmation:'LABORATORY_ONLY',automaticRemoteRestore:false},limitations:['Experimental local snapshot, not Google activation proof',...(memoryDraft!==undefined?['Unsaved memory proposal preserved separately, not durable']:[])],...(memoryDraft!==undefined?{memoryDraft:clone(memoryDraft)}:{})};
    return {...envelope,checksum:await commercialHash(envelope)};
  }
  async function getOperation(handle,operationId){const s=await snapshot(),{o}=await operation(handle,operationId,s);return {...o,originalRequest:await reconstruct(o,s)};}
  return Object.freeze({createWorkspace,createInstance,read,stage,commit,save,send,recover,acceptReceipt,acknowledge,exportInstance,getOperation,snapshot,close:()=>db.close(),name:db.name});
}
