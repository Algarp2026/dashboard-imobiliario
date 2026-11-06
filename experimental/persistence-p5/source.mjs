import {copy,canonical,legacyTextHash,fail,seal,check,identity,queryShape,matches,FORMAT,EPOCH,MANIFEST,laboratory,validateData,hash,requestId} from './contracts.mjs';
import {stageVersion,readVersion,walk,metrics,receipt} from './chain.mjs';

// Credentials are opaque laboratory objects. Neither headers nor sourceId enroll a caller.
export function labSessions(){const principals=new WeakMap();return {grant:p=>{const c=Object.freeze({});principals.set(c,copy(p));return c;},revoke:c=>principals.delete(c),resolve:c=>c&&principals.get(c)};}
export async function createSource({backend,sourceId='fiction-p3-p5-source',origin,synthetic=false,data,authorize,validateTransition,legacyHistory=false,sourceEpoch=EPOCH}={}){
 laboratory(origin,synthetic);if(!backend?.labOnly||!/^fiction-p3-p5-[a-z0-9-]+$/.test(sourceId)||typeof authorize!=='function'||typeof validateTransition!=='function')fail('P5_LAB_ONLY');
 let state=await backend.load(),fault=null;const tickets=new Map();
 if(!state){
  if(!data)fail('P5_UNINITIALIZED');validateData(data);const raw=canonical(data),time=new Date().toISOString();
  state={format:1,generation:0,sourceId,domainId:crypto.randomUUID(),Store:{B2:raw,B5:null,B6:null},StoreVersions:[],BackupsVersions:[],Manifests:{},lockOwner:null,commits:0};
  const version=await stageVersion(state,raw,time),genesis=await seal({format:FORMAT,kind:'GENESIS',operationId:null,requestId:null,requestHash:null,payloadHash:version.checksum,baseRevision:null,resultRevision:version.checksum,sourceId,domainId:state.domainId,previousRef:null,version,requestVersion:null,height:0,createdAt:time,completeHistory:!legacyHistory});state.Manifests[genesis.integrity]=genesis;
  state.Store.B6=await seal({format:FORMAT,sourceId,domainId:state.domainId,manifestRef:genesis.integrity,resultRevision:genesis.resultRevision,legacyChecksum:await legacyTextHash(raw)});await backend.compareExchange(null,state);
 }
 if(state.format!==1||state.sourceId!==sourceId)fail('P5_SOURCE_FORMAT');
 function principal(credential,scope){const p=authorize(credential);if(!p||p.sourceId!==sourceId||!Array.isArray(p.scopes)||!p.scopes.includes(scope))fail('P5_UNAUTHORIZED');return p;}
 async function load(){const s=await backend.load();if(!s||s.format!==1||s.sourceId!==sourceId||s.domainId!==state.domainId)fail('P5_SOURCE_CHANGED');return s;}
 async function persist(s){const g=s.generation;if(!Number.isSafeInteger(g)||g>=Number.MAX_SAFE_INTEGER)fail('P5_GENERATION');s.generation++;await backend.compareExchange(g,s);}
 const response=(status,reason,stats,extra={})=>({status,reason,sourceId,domainId:state.domainId,readOnly:true,retryAuthorized:false,laboratoryOnly:true,stats,...extra});
 async function readIntent(value){const i=await check(value,'format requestId requestHash payloadHash baseRevision sourceId createdAt version requestVersion manifestRef');if(i.format!==FORMAT||i.sourceId!==sourceId||!requestId(i.requestId)||!hash(i.requestHash)||!hash(i.payloadHash)||!hash(i.baseRevision)||typeof i.createdAt!=='string'||!Number.isFinite(Date.parse(i.createdAt)))fail('P5_INTENT');return i;}
 async function committedIntent(s,v){if(!s.Store.B5)return false;const i=await readIntent(s.Store.B5);return v.chain.some(m=>m.kind==='COMMIT'&&matches(m,i)&&m.integrity===i.manifestRef);}
 async function lookup(credential,query,options={}){
  principal(credential,'lookup');queryShape(query);if(query.sourceId!==sourceId)fail('P5_SOURCE_IDENTITY');
  const stats=metrics(),started=performance.now(),safe={maxDepth:options.maxDepth??256,maxMs:options.maxMs??5000,stats};
  try{
   if(sourceEpoch!==EPOCH)return response('UNKNOWN','HISTORICAL_CAPABILITY_UNAVAILABLE',stats);
   const s=await load();stats.reads++;const verified=await walk(s,{...safe,onManifest:options.onManifest});
   // An incomplete or moving source must never yield an affirmative receipt.
   const sameId=verified.chain.filter(m=>m.requestId===query.requestId);
   let answer;
   if(sameId.length>1||sameId.some(m=>!matches(m,query)))answer=response('BLOCKED','REQUEST_ID_COLLISION',stats);
   else if(sameId.length===1){const m=sameId[0];answer=response('COMMITTED','ANCHORED_TO_CURRENT_B6',stats,{receipt:receipt(m),proof:{format:FORMAT,anchorRef:verified.anchor.integrity,manifestRef:m.integrity,domainId:s.domainId,historical:m.integrity!==verified.anchor.manifestRef}});}
   else{
    const entries=Object.values(s.Manifests);if(entries.length>1024)fail('P5_LOOKUP_LIMIT');
    const reachable=new Set(verified.chain.map(m=>m.integrity));for(const m of entries)if(!reachable.has(m?.integrity)){await check(m,MANIFEST);stats.reads++;if(m.format!==FORMAT||m.sourceId!==sourceId||m.domainId!==s.domainId)fail('P5_MANIFEST');}
    for(const m of entries.filter(m=>m?.requestId===query.requestId)){
     await check(m,MANIFEST);stats.reads++;if(!matches(m,query)){answer=response('BLOCKED','REQUEST_ID_COLLISION',stats);break;}
     const original=JSON.parse(await readVersion(s,m.requestVersion,stats));if(!matches(await identity(original,sourceId),query))fail('P5_REQUEST_INTEGRITY');
     await readVersion(s,m.version,stats);answer=response('PENDING','ORPHAN_PREPARATION_NOT_ACTIVATED',stats);
    }
    const intent=s.Store.B5;
    if(intent){await readIntent(intent);if(intent.requestId===query.requestId){if(!matches(intent,query))answer=response('BLOCKED','REQUEST_ID_COLLISION',stats);else if(answer?.status!=='BLOCKED')answer=response('PENDING','INTENT_WITHOUT_ACTIVATION',stats);}}
    if(!answer){const archive=s.BackupsVersions.find(x=>x?.requestId===query.requestId);answer=archive?response('UNKNOWN','BACKUP_IS_NOT_ACTIVATION',stats):response(verified.completeHistory?'NOT_FOUND':'UNKNOWN',verified.completeHistory?'ABSENT_WITHIN_LAB_DOMAIN':'PRE_DOMAIN_HISTORY_UNPROVEN',stats);}
   }
   const after=await load();stats.reads++;if(after.generation!==s.generation||canonical(after.Store)!==canonical(s.Store))return response('UNKNOWN','SOURCE_MOVED_DURING_LOOKUP',stats);
   if(performance.now()-started>safe.maxMs)fail('P5_LOOKUP_LIMIT');return {...answer,stats:{...stats,totalMs:performance.now()-started}};
  }catch(e){return response('UNKNOWN',/^P5_[A-Z_]+$/.test(e.code||'')?e.code:'READ_FAILURE',stats,{stats:{...stats,totalMs:performance.now()-started}});}
 }
 async function read(credential){principal(credential,'read');const s=await load(),v=await walk(s),raw=await readVersion(s,v.chain[0].version,metrics()),after=await load();if(after.generation!==s.generation)fail('P5_SOURCE_MOVED');return {data:JSON.parse(raw),revision:v.anchor.resultRevision,sourceId,laboratoryOnly:true,writes:s.commits,apiEpoch:EPOCH,sourceEpoch};}
 async function preflight(credential,request,epoch,{resume=false}={}){
  const p=principal(credential,'write');if(epoch!==EPOCH||p.apiEpoch!==EPOCH||sourceEpoch!==EPOCH)fail('P5_SOURCE_FENCE');
  const id=await identity(request,sourceId),found=await lookup(credential,id);
  if(found.status==='COMMITTED')return {receipt:found.receipt};
  if(found.status==='UNKNOWN'||found.status==='BLOCKED'||found.status==='PENDING'&&!resume)fail('P5_OUTCOME_UNRESOLVED');
  const s=await load(),v=await walk(s);if(s.lockOwner)fail('P5_SOURCE_BUSY');if(v.anchor.resultRevision!==request.baseRevision)fail('P5_REMOTE_CONFLICT');
  if(s.Store.B5&&!await committedIntent(s,v)){const i=s.Store.B5;if(!matches(i,id)||!resume)fail('P5_SOURCE_PENDING');}
  const ticket=crypto.randomUUID();tickets.set(ticket,{id,expires:Date.now()+30000,credential,anchor:v.anchor.integrity,resume});
  return {ticket,revision:request.baseRevision,sourceId,apiEpoch:EPOCH,sourceEpoch,laboratoryOnly:true};
 }
 async function write(credential,request,ticket,epoch){
  const p=principal(credential,'write');if(p.apiEpoch!==EPOCH||sourceEpoch!==EPOCH||epoch!==EPOCH)fail('P5_SOURCE_FENCE');
  const id=await identity(request,sourceId),known=await lookup(credential,id);
  if(known.status==='COMMITTED')return known.receipt;
  if(['BLOCKED','UNKNOWN'].includes(known.status))fail('P5_OUTCOME_UNRESOLVED');
  const proof=tickets.get(ticket);tickets.delete(ticket);if(!proof||proof.credential!==credential||proof.expires<Date.now()||!matches(proof.id,id)||known.status==='PENDING'&&!proof.resume)fail('P5_TICKET');
  const owner=crypto.randomUUID(),mode=fault;fault=null;let s=await load();if(s.lockOwner)fail('P5_SOURCE_BUSY');s.lockOwner=owner;await persist(s);
  const step=async name=>{if(mode===name)fail('P5_INJECTED_'+name.toUpperCase().replaceAll('-','_'));};
  async function change(fn){s=await load();if(s.lockOwner!==owner)fail('P5_LOCK_LOST');await fn(s);await persist(s);}
  try{
   s=await load();const v=await walk(s);if(v.anchor.integrity!==proof.anchor||v.anchor.resultRevision!==request.baseRevision)fail('P5_REMOTE_CONFLICT');
   if(await committedIntent(s,v)){await change(x=>{x.Store.B5=null;});s=await load();}
   if(s.Store.B5&&(!matches(s.Store.B5,id)||!proof.resume))fail('P5_SOURCE_PENDING');
   const previous=JSON.parse(await readVersion(s,v.chain[0].version,metrics()));await validateTransition(copy(previous),copy(request.data));
   await step('before-b5');const time=s.Store.B5?.createdAt||new Date().toISOString();
   await change(async x=>{x.Store.B5=await seal({format:FORMAT,...id,createdAt:time,version:x.Store.B5?.version||null,requestVersion:x.Store.B5?.requestVersion||null,manifestRef:x.Store.B5?.manifestRef||null});});await step('after-b5');
   if(mode==='partial-chunks'){await change(async x=>{const d=await stageVersion(x,canonical(request.data),time);x.StoreVersions.splice(d.start,Math.max(1,d.count-1));});fail('P5_INJECTED_PARTIAL_CHUNKS');}
   await change(async x=>{const i=x.Store.B5;if(!i.version)i.version=await stageVersion(x,canonical(request.data),time);if(!i.requestVersion)i.requestVersion=await stageVersion(x,canonical(request),time);await readVersion(x,i.version,metrics());await readVersion(x,i.requestVersion,metrics());x.Store.B5=await seal(i);});await step('after-chunks');
   let manifest;
   await change(async x=>{const i=x.Store.B5;manifest=await seal({format:FORMAT,kind:'COMMIT',operationId:'p5-op-'+id.requestHash,...id,resultRevision:id.payloadHash,domainId:x.domainId,previousRef:v.anchor.manifestRef,version:i.version,requestVersion:i.requestVersion,height:v.chain[0].height+1,createdAt:time,completeHistory:null});const old=x.Manifests[manifest.integrity];if(old&&canonical(old)!==canonical(manifest))fail('P5_IMMUTABLE_MANIFEST');x.Manifests[manifest.integrity]=manifest;x.Store.B5=await seal({...i,manifestRef:manifest.integrity});});await step('after-manifest');
   await change(x=>{if(!x.BackupsVersions.some(b=>b.manifestRef===manifest.integrity))x.BackupsVersions.push({format:FORMAT,...id,previous:v.chain[0].version,version:manifest.version,manifestRef:manifest.integrity});});await step('after-backup');await step('before-b6');
   await change(async x=>{const raw=await readVersion(x,manifest.version,metrics()),original=JSON.parse(await readVersion(x,manifest.requestVersion,metrics()));if(canonical(x.Store.B6)!==canonical(v.anchor)||manifest.version.checksum!==id.payloadHash||!matches(await identity(original,sourceId),id)||canonical(original.data)!==raw)fail('P5_PREACTIVATION_INTEGRITY');x.Store.B6=await seal({format:FORMAT,sourceId,domainId:x.domainId,manifestRef:manifest.integrity,resultRevision:id.payloadHash,legacyChecksum:v.anchor.legacyChecksum});x.commits++;});
   await step('during-b6');const activated=await walk(await load());if(activated.anchor.manifestRef!==manifest.integrity||activated.anchor.resultRevision!==id.payloadHash)fail('P5_ACTIVATION_UNCONFIRMED');await step('after-b6');
   await change(x=>{x.Store.B5=null;});await step('after-cleanup');return receipt(manifest);
  }finally{
   // Uncertain intent and all immutable rows survive failures. Only the writer lock is released.
   const end=await load();if(end.lockOwner===owner){end.lockOwner=null;await persist(end);}
  }
 }
 async function verifyReceipt(credential,provided,request){const id=await identity(request,sourceId),found=await lookup(credential,id);if(found.status!=='COMMITTED'||canonical(found.receipt)!==canonical(provided))fail('P5_UNANCHORED_RECEIPT');return found.receipt;}
 return Object.freeze({labOnly:true,sourceId,lookup,read,preflight,write,verifyReceipt,setFault:mode=>{fault=mode;},capabilities:credential=>{const p=principal(credential,'read');return {historicalLookup:sourceEpoch===EPOCH?1:0,writerEpoch:sourceEpoch,apiEpoch:p.apiEpoch,laboratoryOnly:true};}});
}
