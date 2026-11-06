import {copy,canonical,commercialHash,fail,seal,check,laboratory} from './contracts.mjs';
import {validateSnapshot} from './snapshot.mjs';
import {encodeOriginal,decodeOriginal,equivalent,physicalCost} from '../persistence-p4/codecs.mjs';
import {indexedBackend} from '../persistence-p5/backend.mjs';
export async function independentIndexedBackend({factory,origin,synthetic=false,name='the-view-p5-lab.p6-copy.v1'}={}){if(!/^the-view-p5-lab\.p6-copy\.[a-z0-9.-]+$/.test(name))fail('P6_COPY_DOMAIN');const b=await indexedBackend({factory,origin,synthetic,name});return Object.freeze({...b,failureDomain:'idb:'+origin+':'+name});}
const bodyFrom=b=>{if(!b||!Array.isArray(b.bytes)||b.bytes.some(v=>!Number.isInteger(v)||v<0||v>255))fail('P6_COPY_BODY');return {...b,bytes:Uint8Array.from(b.bytes)};};
const RECORD='version kind id sourceId primaryDomain copyDomain snapshotHash authorityHash revision bodyRef createdAt phase';
export async function openCopyVault({backend,primaryDomain,sourceId,origin,synthetic=false,authorize,captureOfficial}={}){
 laboratory(origin,synthetic);if(!backend?.labOnly||!backend.failureDomain||backend.failureDomain===primaryDomain||!primaryDomain||typeof authorize!=='function'||typeof captureOfficial!=='function')fail('P6_COPY_NOT_INDEPENDENT');let fault=null;
 function principal(c,scope){const p=authorize(c);if(!p||p.sourceId!==sourceId||p.apiEpoch!==2||!p.scopes?.includes(scope))fail('P6_UNAUTHORIZED');}
 let initial=await backend.load();if(!initial){initial={format:1,generation:0,domain:backend.failureDomain,copies:{},bodies:{}};await backend.compareExchange(null,initial);}
 async function load(){const s=await backend.load();if(s?.format!==1||s.domain!==backend.failureDomain||!Number.isSafeInteger(s.generation)||!s.copies||!s.bodies)fail('P6_COPY_FORMAT');return s;}
 async function save(s){const g=s.generation;if(g>=Number.MAX_SAFE_INTEGER)fail('P6_COPY_GENERATION_EXHAUSTED');s.generation++;await backend.compareExchange(g,s);}
 async function reconstruct(s,id){
  const r=s.copies[id];if(!r)return {status:'MISSING',commercialConfirmed:false};
  try{await check(r,RECORD);if(r.version!==1||r.kind!=='P6_INDEPENDENT_COPY'||r.id!==id||r.sourceId!==sourceId||r.copyDomain!==backend.failureDomain||r.primaryDomain!==primaryDomain||!['STAGED','VERIFIED'].includes(r.phase))fail('P6_COPY_PROVENANCE');
   if(s.bodies[r.bodyRef]?.bodyRef!==r.bodyRef)fail('P6_COPY_REFERENCE');const bundle=JSON.parse(await decodeOriginal(bodyFrom(s.bodies[r.bodyRef])));if(Object.keys(bundle).sort().join('|')!=='kind|snapshot|version'||bundle.version!==1||bundle.kind!=='P6_SNAPSHOT_BUNDLE')fail('P6_COPY_FORMAT');await validateSnapshot(bundle.snapshot);
   if(bundle.snapshot.integrity!==r.snapshotHash||bundle.snapshot.sourceId!==sourceId||bundle.snapshot.authorityHash!==r.authorityHash||bundle.snapshot.revision!==r.revision)fail('P6_COPY_ASSOCIATION');
   return {status:r.phase==='VERIFIED'?'RECOVERABLE_COPY':'FORENSIC',technicalVerified:r.phase==='VERIFIED',commercialConfirmed:false,isLatest:false,record:copy(r),snapshot:bundle.snapshot};
  }catch(e){return {status:'FORENSIC',technicalVerified:false,commercialConfirmed:false,isLatest:false,reason:e.code||'COPY_UNVERIFIABLE'};}
 }
 async function read(c,id){principal(c,'copy-read');try{return await reconstruct(await load(),id);}catch(e){return {status:'INSUFFICIENT',commercialConfirmed:false,reason:e.code||'COPY_UNAVAILABLE'};}}
 async function create(c,id=crypto.randomUUID()){
  principal(c,'copy-write');principal(c,'copy-read');if(typeof id!=='string'||!/^[a-zA-Z0-9._:-]{1,160}$/.test(id))fail('P6_COPY_ID');
  const captured=await captureOfficial(c),snapshot=captured.snapshot||captured;await validateSnapshot(snapshot);if(snapshot.sourceId!==sourceId)fail('P6_COPY_SOURCE');
  const mode=fault;fault=null;const body=await encodeOriginal(canonical({version:1,kind:'P6_SNAPSHOT_BUNDLE',snapshot}));
  if(mode==='before-stage')fail('P6_INJECTED_COPY_FAILURE');
  for(let attempt=0;attempt<5;attempt++){
   let s=await load(),record=s.copies[id];if(record&&(record.authorityHash!==snapshot.authorityHash||record.revision!==snapshot.revision))fail('P6_COPY_ID_COLLISION');
   if(record){const prior=await reconstruct(s,id);if(!prior.snapshot)fail('P6_COPY_PROTECTED_UNVERIFIABLE');if(record.phase==='VERIFIED')return prior;}
   else{
    const old=s.bodies[body.bodyRef];if(old&&!await equivalent(bodyFrom(old),body))fail('P6_COPY_BODY_COLLISION');
    if(!old)s.bodies[body.bodyRef]={...body,bytes:Array.from(body.bytes)};
    record=await seal({version:1,kind:'P6_INDEPENDENT_COPY',id,sourceId,primaryDomain,copyDomain:backend.failureDomain,snapshotHash:snapshot.integrity,authorityHash:snapshot.authorityHash,revision:snapshot.revision,bodyRef:body.bodyRef,createdAt:new Date().toISOString(),phase:'STAGED'});s.copies[id]=record;
    try{await save(s);}catch(e){if(e.code==='P5_STORAGE_CAS')continue;throw e;}
   }
   if(mode==='after-stage')fail('P6_INJECTED_COPY_FAILURE');
   s=await load();const verified=await reconstruct(s,id);if(!verified.snapshot)fail('P6_COPY_VERIFY_FAILED');
   if(s.copies[id].phase!=='VERIFIED'){s.copies[id]=await seal({...s.copies[id],phase:'VERIFIED'});try{await save(s);}catch(e){if(e.code==='P5_STORAGE_CAS')continue;throw e;}}
   if(mode==='after-verified')fail('P6_LOST_COPY_RESPONSE');return reconstruct(await load(),id);
  }fail('P6_COPY_BUSY');
 }
 async function statistics(c){principal(c,'copy-read');const s=await load(),b=Object.values(s.bodies).map(bodyFrom);return {copies:Object.keys(s.copies).length,uniqueBodies:b.length,encodedBytes:b.reduce((n,x)=>n+x.encodedBytes,0),decodedBytes:b.reduce((n,x)=>n+x.decodedBytes,0),bodyHeaderBytes:b.reduce((n,x)=>n+physicalCost(x)-x.encodedBytes,0),serializedCharacters:JSON.stringify(s).length,failureDomain:backend.failureDomain};}
 return Object.freeze({create,read,statistics,setFault:m=>{fault=m;},failureDomain:backend.failureDomain});
}
