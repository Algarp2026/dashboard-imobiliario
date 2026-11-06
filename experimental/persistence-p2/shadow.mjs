import {fail,canonical,commercialHash,decodeOriginal} from './codec.mjs';
import {inspectCapture,project,KEY} from './reader.mjs';
export const STORES=['workspaces','bodies','operations','branches','receipts','migration','archive'];
const clone=value=>structuredClone(value);
const allowedPhase=value=>['DISCOVERED','COPYING','VERIFIED','READY'].includes(value);
const same=(a,b)=>canonical(a)===canonical(b);
function labOrigin(value){try{const u=new URL(value);return u.origin===value&&u.protocol==='http:'&&u.hostname==='127.0.0.1'&&/^53\d{3}$/.test(u.port);}catch{return false;}}
function sameBody(a,b){return a&&b&&a.bodyRef===b.bodyRef&&a.rawHash===b.rawHash&&a.mediaType===b.mediaType&&a.codec===b.codec&&a.encodedBytes===b.encodedBytes&&a.decodedBytes===b.decodedBytes&&a.bytes instanceof Uint8Array&&b.bytes instanceof Uint8Array&&a.bytes.length===b.bytes.length&&a.bytes.every((x,i)=>x===b.bytes[i]);}
const stamp=async state=>({...state,checkpointHash:await commercialHash(Object.fromEntries(Object.entries(state).filter(([k])=>k!=='checkpointHash')))});
export async function openShadow({factory,origin,sourceOrigin,name='the-view-p2-shadow-lab.v1',synthetic=false}={}){
  if(!synthetic||!labOrigin(origin)||!labOrigin(sourceOrigin)||origin===sourceOrigin||typeof location!=='undefined'&&location.origin!==origin||!/^the-view-p2-shadow-lab\.[a-z0-9.-]{1,64}$/.test(name)||name.includes(KEY)||!factory)fail('P2_LAB_ONLY');
  const db=await new Promise((resolve,reject)=>{
    let settled=false;const r=factory.open(name,1);
    r.onupgradeneeded=()=>{for(const n of STORES)r.result.createObjectStore(n,{keyPath:n==='bodies'?'bodyRef':'id'});};
    r.onerror=r.onblocked=()=>{settled=true;reject(Object.assign(new Error('P2_DESTINATION_UNAVAILABLE'),{code:'P2_DESTINATION_UNAVAILABLE'}));};
    r.onsuccess=()=>{if(settled){r.result.close();return;}r.result.onversionchange=()=>r.result.close();resolve(r.result);};
  });
  function transaction(names,mode,action){return new Promise((resolve,reject)=>{
    let result,error,tx;try{tx=db.transaction(names,mode,mode==='readwrite'?{durability:'strict'}:undefined);}catch{fail('P2_TRANSACTION_UNAVAILABLE');}
    tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(error||Object.assign(new Error(tx.error?.name==='QuotaExceededError'?'P2_QUOTA':'P2_ABORT'),{code:tx.error?.name==='QuotaExceededError'?'P2_QUOTA':'P2_ABORT'}));
    tx.onerror=e=>{e.preventDefault();error ||= Object.assign(new Error(e.target.error?.name==='QuotaExceededError'?'P2_QUOTA':'P2_ABORT'),{code:e.target.error?.name==='QuotaExceededError'?'P2_QUOTA':'P2_ABORT'});try{tx.abort();}catch{}};
    const abort=e=>{error=typeof e?.code==='string'&&e.code.startsWith('P2_')?e:Object.assign(new Error(e?.name==='QuotaExceededError'?'P2_QUOTA':'P2_ABORT'),{code:e?.name==='QuotaExceededError'?'P2_QUOTA':'P2_ABORT'});try{tx.abort();}catch{}};try{action(tx,v=>result=v,abort);}catch(e){abort(e);}
  });}
  function snapshot(){return transaction(STORES,'readonly',(tx,done)=>{const result={};let left=STORES.length;for(const name of STORES){const r=tx.objectStore(name).getAll();r.onsuccess=()=>{result[name]=r.result;if(!--left)done(result);};}});}
  async function session(id){const all=await snapshot(),state=all.migration.find(x=>x.id===id);if(!state)fail('P2_SESSION_MISSING');if(state.version!==1||!allowedPhase(state.phase)||state.activationAllowed!==false||state.sourceOrigin!==sourceOrigin||(await stamp(state)).checkpointHash!==state.checkpointHash)fail('P2_CHECKPOINT_INTEGRITY');return {all,state};}
  async function begin(id){
    if(typeof id!=='string'||!id||id.length>128)fail('P2_SESSION_ID');
    const empty=await stamp({version:1,id,sourceOrigin,phase:'DISCOVERED',cursor:0,verifiedCursor:0,revision:0,items:[],bodyRefs:[],projectionProofs:[],blocked:[],activationAllowed:false});
    const state=await transaction(['migration'],'readwrite',(tx,done,abort)=>{const store=tx.objectStore('migration'),r=store.get(id);r.onsuccess=()=>{try{if(r.result){if(r.result.version!==1||r.result.sourceOrigin!==sourceOrigin||r.result.activationAllowed!==false){abort(Object.assign(new Error('P2_SESSION_INCOMPATIBLE'),{code:'P2_SESSION_INCOMPATIBLE'}));return;}done(r.result);}else{store.add(empty);done(empty);}}catch(error){abort(error);}};});
    if(!allowedPhase(state.phase)||(await stamp(state)).checkpointHash!==state.checkpointHash)fail('P2_CHECKPOINT_INTEGRITY');return state;
  }
  async function fresh(readSource){const capture=await readSource();if(capture.sourceOrigin!==sourceOrigin)fail('P2_SOURCE_ORIGIN');return inspectCapture(capture);}
  async function copyBatch(id,{readSource,maxItems=4,maxBytes=4*1024*1024}={}){
    if(typeof readSource!=='function'||!Number.isSafeInteger(maxItems)||maxItems<1||maxItems>32||!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>16*1024*1024)fail('P2_BATCH_LIMIT');
    const {all,state}=await session(id);
    const first=await fresh(readSource),second=await fresh(readSource),byId=new Map(second.entries.map(e=>[e.report.id,e]));
    const selected=[];let used=0;
    const add=e=>{if(selected.some(x=>x.report.id===e.report.id&&x.body.bodyRef===e.body.bodyRef))return;
      if(selected.length>=maxItems||used+e.body.encodedBytes>maxBytes)fail('P2_BATCH_DEPENDENCY_LIMIT');selected.push(e);used+=e.body.encodedBytes;};
    for(const e of first.entries){
      const old=state.items.find(x=>x.sourceId===e.report.id),latest=byId.get(e.report.id);
      if(old?.refs.includes(e.body.bodyRef)&&(!latest||old.refs.includes(latest.body.bodyRef)))continue;
      const variants=[e,...(latest&&latest.body.bodyRef!==e.body.bodyRef?[latest]:[])];
      const deps=[];for(const x of variants)if(x.report.kind==='request'&&x.report.operation){const m=first.entries.find(m=>m.report.kind==='sync-meta'&&m.report.baseRevision===x.report.operation.baseRevision);if(m&&!all.bodies.some(b=>b.bodyRef===m.body.bodyRef))deps.push(m);}
      const unique=[...deps,...variants].filter((x,i,a)=>a.findIndex(y=>y.report.id===x.report.id&&y.body.bodyRef===x.body.bodyRef)===i&&!selected.some(y=>y.report.id===x.report.id&&y.body.bodyRef===x.body.bodyRef));
      const bytes=unique.reduce((n,x)=>n+x.body.encodedBytes,0);
      if(selected.length+unique.length>maxItems||used+bytes>maxBytes){if(selected.length)break;fail('P2_BATCH_DEPENDENCY_LIMIT');}
      for(const x of unique)add(x);
    }
    const disappeared=state.items.filter(x=>!first.entries.some(e=>e.report.id===x.sourceId));
    if(!selected.length&&!disappeared.length)return clone(state);
    const next=clone(state),rows={archive:[],operations:[],branches:[],receipts:[],workspaces:[]};next.revision++;next.phase='COPYING';
    if(disappeared.length&&!next.blocked.includes('SOURCE_SET_CHANGED'))next.blocked.push('SOURCE_SET_CHANGED');
    for(const item of disappeared)rows.branches.push({id:await commercialHash({session:id,absent:item.sourceId}),version:1,sessionId:id,kind:'shadow-source-absent',bodyRefs:clone(item.refs),activationAllowed:false});
    for(const e of selected){
      await decodeOriginal(e.body);const r=e.report;
      let item=next.items.find(x=>x.sourceId===r.id);if(!item){item={sourceId:r.id,kind:r.kind,refs:[]};next.items.push(item);}
      if(!item.refs.includes(e.body.bodyRef))item.refs.push(e.body.bodyRef);
      if(item.refs.length>1){if(!next.blocked.includes('SOURCE_DIVERGED'))next.blocked.push('SOURCE_DIVERGED');rows.branches.push({id:await commercialHash({session:id,source:r.id,refs:item.refs}),version:1,kind:'shadow-source-variants',sessionId:id,sourceId:r.id,bodyRefs:clone(item.refs),activationAllowed:false});}
      if(!next.bodyRefs.includes(e.body.bodyRef))next.bodyRefs.push(e.body.bodyRef);
      if(r.issues.some(x=>x.startsWith('MISSING_')||x.includes('BASE_MISMATCH')))next.blocked.push('MISSING_OR_INCOMPATIBLE_REFERENCE');
      if(r.classification==='INSUFFICIENT_INTEGRITY')next.blocked.push('SOURCE_INTEGRITY');
      if(r.issues.includes('SOURCE_CHANGED_DURING_CAPTURE'))next.blocked.push('UNSTABLE_SOURCE_CAPTURE');
      rows.archive.push({id:await commercialHash({session:id,source:r.id,body:e.body.bodyRef}),version:1,sessionId:id,sourceId:r.id,bodyRef:e.body.bodyRef,kind:r.kind,classification:r.classification,issues:clone(r.issues),protection:'PRESERVE',activationAllowed:false});
      if(r.operation){
        const op=r.operation,requestRef={bodyRef:e.body.bodyRef,view:op.view,pointer:op.requestPointer},payloadRef={bodyRef:e.body.bodyRef,view:op.view,pointer:op.dataPointer};
        const meta=first.entries.find(x=>x.report.kind==='sync-meta'&&x.report.baseRevision===op.baseRevision&&!x.report.issues.includes('BASE_REVISION_MISMATCH'));
        const baseRef=op.basePointer?{bodyRef:e.body.bodyRef,view:op.view,pointer:op.basePointer}:meta?{bodyRef:meta.body.bodyRef,view:'json',pointer:'/base'}:null;
        if(baseRef&&!next.bodyRefs.includes(baseRef.bodyRef))next.bodyRefs.push(baseRef.bodyRef);
        if(!baseRef&&!next.blocked.includes('MISSING_OR_INCOMPATIBLE_REFERENCE'))next.blocked.push('MISSING_OR_INCOMPATIBLE_REFERENCE');
        rows.operations.push({id:await commercialHash({session:id,source:r.id,body:e.body.bodyRef,hash:op.requestHash}),version:1,kind:'shadow-preserved-request',sessionId:id,requestId:op.requestId,baseRevision:op.baseRevision,payloadHash:op.payloadHash,requestHash:op.requestHash,requestRef,payloadRef,baseRef,phase:'REMOTE_UNKNOWN',instanceProvenance:'UNKNOWN',activationAllowed:false});
      }
      if(r.receiptBinding!=='NONE')rows.receipts.push({id:await commercialHash({session:id,source:r.id,receipt:e.body.bodyRef}),version:1,kind:'shadow-local-receipt',sessionId:id,bodyRef:e.body.bodyRef,binding:r.receiptBinding,confirmation:'NOT_ESTABLISHED',activationAllowed:false});
    }
    for(const row of rows.operations){const other=[...all.operations,...rows.operations].filter(x=>x.sessionId===id&&x.requestId===row.requestId&&x.requestHash!==row.requestHash);if(other.length)rows.branches.push({id:await commercialHash({session:id,collision:row.id}),version:1,sessionId:id,kind:'shadow-request-collision',bodyRefs:[row.requestRef.bodyRef,...other.map(x=>x.requestRef.bodyRef)],activationAllowed:false});}
    const proofs=new Map(next.projectionProofs.map(x=>[x.store+':'+x.id,x]));for(const [store,list]of Object.entries(rows))for(const row of list)proofs.set(store+':'+row.id,{store,id:row.id,hash:await commercialHash(row)});
    next.projectionProofs=[...proofs.values()];next.cursor=next.items.length;next.blocked=[...new Set(next.blocked)];const checkpoint=await stamp(next);
    // No promises, hashing, codecs or source reads inside this transaction.
    await transaction(STORES,'readwrite',(tx,done,abort)=>{const r=tx.objectStore('migration').get(id);r.onsuccess=()=>{
      if(!r.result||r.result.checkpointHash!==state.checkpointHash){abort(Object.assign(new Error('P2_STALE_CHECKPOINT'),{code:'P2_STALE_CHECKPOINT'}));return;}
      const bodies=[...new Map(selected.map(e=>[e.body.bodyRef,e.body])).values()];let left=bodies.length;const commit=()=>{try{for(const [name,list]of Object.entries(rows))for(const row of list)tx.objectStore(name).put(row);tx.objectStore('migration').put(checkpoint);done(checkpoint);}catch(e){abort(e);}};
      for(const body of bodies){const store=tx.objectStore('bodies'),q=store.get(body.bodyRef);q.onsuccess=()=>{try{if(q.result&&!sameBody(q.result,body)){abort(Object.assign(new Error('P2_IMMUTABLE_BODY_COLLISION'),{code:'P2_IMMUTABLE_BODY_COLLISION'}));return;}if(!q.result)store.add(body);if(!--left)commit();}catch(error){abort(error);}};}
      if(!left)commit();
    };});
    return clone(checkpoint);
  }
  async function validateSnapshot(id,all){
    const state=all.migration.find(x=>x.id===id);if(!state||!allowedPhase(state.phase)||state.activationAllowed!==false||(await stamp(state)).checkpointHash!==state.checkpointHash||state.cursor!==state.items.length)fail('P2_CHECKPOINT_INTEGRITY');
    const bodies=new Map(all.bodies.map(x=>[x.bodyRef,x]));
    for(const proof of state.projectionProofs){const row=all[proof.store]?.find(x=>x.id===proof.id);if(!row||await commercialHash(row)!==proof.hash)fail('P2_PROJECTION_INTEGRITY');}
    for(const ref of state.bodyRefs){if(!bodies.has(ref))fail('P2_MISSING_REFERENCE');await decodeOriginal(bodies.get(ref));}
    for(const item of state.items)for(const ref of item.refs)if(!state.bodyRefs.includes(ref)||!all.archive.some(x=>x.sessionId===id&&x.sourceId===item.sourceId&&x.bodyRef===ref))fail('P2_MISSING_REFERENCE');
    for(const op of all.operations.filter(x=>x.sessionId===id)){
      for(const ref of [op.requestRef,op.payloadRef,op.baseRef].filter(Boolean))if(!bodies.has(ref.bodyRef))fail('P2_MISSING_REFERENCE');
      const request=await project(bodies.get(op.requestRef.bodyRef),op.requestRef),data=await project(bodies.get(op.payloadRef.bodyRef),op.payloadRef);
      if(request.requestId!==op.requestId||request.baseRevision!==op.baseRevision||await commercialHash(request)!==op.requestHash||await commercialHash(data)!==op.payloadHash)fail('P2_OPERATION_INTEGRITY');
      if(op.baseRef&&await commercialHash(await project(bodies.get(op.baseRef.bodyRef),op.baseRef))!==op.baseRevision)fail('P2_BASE_REFERENCE');
    }
    for(const name of ['branches','receipts'])for(const row of all[name].filter(x=>x.sessionId===id))for(const ref of row.bodyRefs||[row.bodyRef])if(!bodies.has(ref))fail('P2_MISSING_REFERENCE');
    return state;
  }
  async function advanceVerified(id,phase,all){
    const state=await validateSnapshot(id,all),next=await stamp({...state,phase,verifiedCursor:state.cursor,revision:state.revision+1});
    await transaction(STORES,'readwrite',(tx,done,abort)=>{
      const current={};let left=STORES.length;for(const name of STORES){const r=tx.objectStore(name).getAll();r.onsuccess=()=>{current[name]=r.result;if(--left)return;
        const equal=STORES.every(n=>n==='bodies'?current[n].length===all[n].length&&current[n].every((b,i)=>sameBody(b,all[n][i])):same(current[n],all[n]));
        if(!equal){abort(Object.assign(new Error('P2_DESTINATION_CHANGED'),{code:'P2_DESTINATION_CHANGED'}));return;}try{tx.objectStore('migration').put(next);done(true);}catch(error){abort(error);}
      };}
    });return next;
  }
  async function verify(id){const {all,state}=await session(id);if(state.phase==='READY'){await validateSnapshot(id,all);return clone(state);}return advanceVerified(id,'VERIFIED',all);}
  async function ready(id,{readSource}={}){
    if(typeof readSource!=='function')fail('P2_FRESH_SOURCE_REQUIRED');const current=await fresh(readSource),{all,state}=await session(id);
    if(!['VERIFIED','READY'].includes(state.phase))fail('P2_NOT_VERIFIED');
    if(current.entries.some(e=>!state.items.some(x=>x.sourceId===e.report.id)))fail('P2_INCOMPLETE_SOURCE');
    const changed=current.entries.some(e=>!state.items.some(x=>x.sourceId===e.report.id&&x.refs.includes(e.body.bodyRef)))||state.items.some(x=>!current.entries.some(e=>e.report.id===x.sourceId));
    if(changed){await copyBatch(id,{readSource});fail('P2_SOURCE_DIVERGED');}
    if(state.blocked.length||state.items.some(x=>x.refs.length!==1)||current.entries.some(e=>e.report.issues.includes('SOURCE_CHANGED_DURING_CAPTURE')))fail('P2_REVIEW_REQUIRED');
    if(state.phase==='READY'){await validateSnapshot(id,all);return clone(state);}return advanceVerified(id,'READY',all);
  }
  async function reconstruct(bodyRef){const all=await snapshot(),body=all.bodies.find(x=>x.bodyRef===bodyRef);if(!body)fail('P2_MISSING_REFERENCE');return decodeOriginal(body);}
  async function diagnose(id){const {all,state}=await session(id);return {phase:state.phase,cursor:state.cursor,verifiedCursor:state.verifiedCursor,bodies:state.bodyRefs.length,encodedBytes:all.bodies.filter(b=>state.bodyRefs.includes(b.bodyRef)).reduce((n,b)=>n+b.encodedBytes,0),blocked:[...state.blocked],activationAllowed:false};}
  return Object.freeze({begin,copyBatch,verify,ready,snapshot,reconstruct,diagnose,close:()=>db.close(),name:db.name});
}
