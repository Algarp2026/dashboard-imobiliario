import {openLocal,STORES} from '../persistence-p3/store.mjs';
import {lab,seal,same} from '../persistence-p3/contracts.mjs';
import {encodeOriginal as encodeP2,sha,fail} from '../persistence-p2/codec.mjs';
import {inspectFragment} from '../persistence-p2/reader.mjs';
import {bodyCodec,samePhysicalBody,equivalent,compressBody,decodeOriginal,physicalCost} from './codecs.mjs';
import {EXTRA,inventory,scan,sealPrepared,validatePrepared,preparedBody} from './references.mjs';

const ALL=[...STORES,...EXTRA],err=code=>Object.assign(new Error(code),{code});
function equalSnapshots(a,b){return ALL.every(store=>{
  if(a[store]?.length!==b[store]?.length)return false;
  return a[store].every((row,i)=>{const other=b[store][i];if(store==='bodies')return samePhysicalBody(row,other);return same(row,other);});
});}
const fingerprint=async snapshot=>(await encodeP2(snapshot)).rawHash;
const physicalHash=async body=>(await encodeP2(body)).rawHash;

export async function openStorage({factory,origin,name='the-view-p3-lab.p4.v1',synthetic=false,remote=null}={}){
  lab(origin,name,synthetic);if(!name.startsWith('the-view-p3-lab.p4.'))fail('P4_LAB_ONLY');
  const core=await openLocal({factory,origin,name,synthetic,remote,bodyCodec,extensionStores:EXTRA});
  const db=await new Promise((resolve,reject)=>{const r=factory.open(name,2);r.onupgradeneeded=()=>{r.transaction.abort();reject(err('P4_SCHEMA'));};r.onerror=()=>reject(err('P4_DATABASE'));r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result);};});
  if([...db.objectStoreNames].sort().join('|')!==[...ALL].sort().join('|')){db.close();core.close();fail('P4_UNKNOWN_STORE');}
  function write(before,action){return new Promise((resolve,reject)=>{
    let tx,result,cause;try{tx=db.transaction(ALL,'readwrite',{durability:'strict'});}catch{reject(err('P4_TRANSACTION'));return;}
    const abort=e=>{cause ||= e?.code?.startsWith?.('P4_')?e:err(e?.name==='QuotaExceededError'?'P4_QUOTA':'P4_ABORT');try{tx.abort();}catch{}};
    tx.onabort=()=>reject(cause||err(tx.error?.name==='QuotaExceededError'?'P4_QUOTA':'P4_ABORT'));tx.onerror=e=>{e.preventDefault();abort(e.target.error);};tx.oncomplete=()=>resolve(result);
    const now={};let left=ALL.length;for(const s of ALL){const r=tx.objectStore(s).getAll();r.onsuccess=()=>{try{now[s]=r.result;if(--left)return;if(!equalSnapshots(before,now))fail('P4_STALE_ANALYSIS');result=action(tx,now);}catch(e){abort(e);}};}
  });}
  async function putScratch(value,{identity=false}={}){
    const original=await encodeP2(value),prepared=await compressBody(original,{forceIdentity:identity});
    for(let attempt=0;attempt<8;attempt++){
      const snapshot=await core.snapshot(),existing=snapshot.bodies.find(b=>b.bodyRef===prepared.body.bodyRef);
      if(existing&&!await equivalent(existing,prepared.body))fail('P4_CONTENT_COLLISION');
      if(existing)return {bodyRef:existing.bodyRef,reused:true,metrics:prepared.metrics};
      const audit=await seal({version:1,id:prepared.body.bodyRef,bodyRef:prepared.body.bodyRef,rawHash:prepared.body.rawHash,mediaType:prepared.body.mediaType,origin:'LAB_SCRATCH'});
      try{await write(snapshot,tx=>{tx.objectStore('bodies').add(prepared.body);tx.objectStore('p4Audit').add(audit);});return {bodyRef:prepared.body.bodyRef,reused:false,metrics:prepared.metrics};}catch(e){if(e.code!=='P4_STALE_ANALYSIS')throw e;}
    }fail('P4_BUSY');
  }
  async function pin(kind,bodyRefs){
    if(!['CHECKPOINT','HISTORY','UNCERTAIN'].includes(kind)||!Array.isArray(bodyRefs)||!bodyRefs.length)fail('P4_PIN');
    const s=await core.snapshot();for(const ref of bodyRefs){const body=s.bodies.find(x=>x.bodyRef===ref);if(!body)fail('P4_MISSING_BODY');await decodeOriginal(body);}
    const row=await seal({version:1,id:crypto.randomUUID(),kind,bodyRefs:[...new Set(bodyRefs)]});await write(s,tx=>tx.objectStore('p4Pins').add(row));return row.id;
  }
  async function archiveFragment(fragment){
    const parsed=await inspectFragment(fragment),opaque=['UNKNOWN','INSUFFICIENT_INTEGRITY'].includes(parsed.report.classification),prepared=await compressBody(parsed.body,{forceIdentity:opaque}),s=await core.snapshot();
    const existing=s.bodies.find(x=>x.bodyRef===prepared.body.bodyRef);if(existing&&!await equivalent(existing,prepared.body))fail('P4_CONTENT_COLLISION');
    const id=await sha(new TextEncoder().encode(fragment.id+'|'+prepared.body.bodyRef));
    const row=await seal({version:1,id,bodyRef:prepared.body.bodyRef,sourceKey:fragment.id,fragmentKind:fragment.kind,classification:parsed.report.classification,opaque,issues:parsed.report.issues});
    const old=s.p4Archive.find(x=>x.id===id);if(old&&!same(old,row))fail('P4_ARCHIVE_COLLISION');
    await write(s,tx=>{if(!existing)tx.objectStore('bodies').add(prepared.body);if(!old)tx.objectStore('p4Archive').add(row);});return {bodyRef:row.bodyRef,classification:row.classification,opaque,codec:(existing||prepared.body).codec};
  }
  async function dryRun(){const s=await core.snapshot(),analysis=await inventory(s);return {...analysis,snapshotToken:await fingerprint(s)};}
  async function release(plan){
    if(typeof plan?.snapshotToken!=='string')fail('P4_PLAN_REQUIRED');const s=await core.snapshot(),token=await fingerprint(s);
    if(token!==plan.snapshotToken)fail('P4_STALE_ANALYSIS');const fresh=await inventory(s);if(fresh.blockers.length)fail('P4_RETENTION_BLOCKED');
    const candidates=fresh.candidates;
    await write(s,(tx,now)=>{const live=scan(now);if(live.blockers.length||candidates.some(ref=>live.links.has(ref)||!now.p4Audit.some(a=>a.id===ref&&a.origin==='LAB_SCRATCH')))fail('P4_RETENTION_BLOCKED');for(const ref of candidates){tx.objectStore('bodies').delete(ref);tx.objectStore('p4Audit').delete(ref);}});
    return {released:candidates.length,encodedCostReleased:fresh.safeReclaimableBytes,source:'laboratory-only'};
  }
  async function resumeCompression(id){
    const s=await core.snapshot(),prepared=s.p4Prepared.find(x=>x.id===id);if(!prepared)fail('P4_PREPARATION_MISSING');await validatePrepared(prepared);
    const old=s.bodies.find(x=>x.bodyRef===prepared.bodyRef),next=preparedBody(prepared);if(!old)fail('P4_MISSING_BODY');
    if(await physicalHash(old)!==prepared.originalPhysicalHash||!await equivalent(old,next))fail('P4_STALE_REPRESENTATION');
    const analysis=await inventory(s);if(analysis.blockers.some(x=>x!=='OPAQUE_ARCHIVE_REVIEW_REQUIRED')||s.p4Archive.some(a=>a.bodyRef===old.bodyRef&&(a.opaque||['UNKNOWN','INSUFFICIENT_INTEGRITY'].includes(a.classification))))fail('P4_COMPRESSION_BLOCKED');
    await write(s,tx=>{tx.objectStore('bodies').put(next);tx.objectStore('p4Prepared').delete(prepared.id);});
    const reread=await core.snapshot(),body=reread.bodies.find(x=>x.bodyRef===prepared.bodyRef);if(!body||!await equivalent(body,next))fail('P4_POSTCOMMIT_INTEGRITY');return {bodyRef:body.bodyRef,codec:body.codec,complete:true};
  }
  async function prepareCompression(bodyRef){
    const s=await core.snapshot(),body=s.bodies.find(x=>x.bodyRef===bodyRef);if(!body)fail('P4_MISSING_BODY');
    if(s.p4Archive.some(x=>x.bodyRef===bodyRef&&(x.opaque||['UNKNOWN','INSUFFICIENT_INTEGRITY'].includes(x.classification))))fail('P4_OPAQUE_PROTECTED');
    const analysis=await inventory(s),known=s.p4Audit.some(a=>a.id===bodyRef)||s.p4Archive.some(a=>a.bodyRef===bodyRef)||s.operations.some(o=>o.baseRef===bodyRef||o.payloadRef===bodyRef)||s.workspaces.some(w=>w.headRef===bodyRef||w.baseRef===bodyRef);
    if(!known||analysis.blockers.some(x=>x!=='OPAQUE_ARCHIVE_REVIEW_REQUIRED'))fail('P4_COMPRESSION_BLOCKED');
    if(body.codec==='gzip')return {skipped:true,reason:'already-compressed'};
    const compressed=await compressBody(body);if(compressed.body.codec==='identity')return {skipped:true,metrics:compressed.metrics};
    const row=await sealPrepared({version:1,id:crypto.randomUUID(),bodyRef,originalPhysicalHash:await physicalHash(body),body:{...compressed.body,bytes:Array.from(compressed.body.bytes)},phase:'PREPARED'});
    await write(s,tx=>tx.objectStore('p4Prepared').add(row));
    const durable=await core.snapshot(),copy=durable.p4Prepared.find(x=>x.id===row.id);if(!copy)fail('P4_PREPARATION_MISSING');await validatePrepared(copy);return {id:row.id,metrics:compressed.metrics};
  }
  async function compress(bodyRef){const p=await prepareCompression(bodyRef);return p.skipped?p:{...await resumeCompression(p.id),metrics:p.metrics};}
  return Object.freeze({...core,putScratch,pin,archiveFragment,dryRun,release,prepareCompression,resumeCompression,compress,readBody:async ref=>{const s=await core.snapshot(),b=s.bodies.find(x=>x.bodyRef===ref);if(!b)fail('P4_MISSING_BODY');return decodeOriginal(b);},close:()=>{core.close();db.close();}});
}
