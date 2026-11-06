import {copy,canonical,commercialHash,legacyTextHash,fail,seal,check,validateData,authority,authorityHash,hash} from './contracts.mjs';
import {readVersion,walk,metrics} from '../persistence-p5/chain.mjs';
const parse=v=>typeof v==='string'?(v?JSON.parse(v):null):v;
export async function decodeAuthority(image){
 if(!image?.Store||typeof image.Store.B2!=='string'||typeof image.sourceId!=='string')fail('P6_SOURCE_UNVERIFIED');
 const anchor=parse(image.Store.B6),intent=parse(image.Store.B5);if(!anchor)fail('P6_LEGACY_UNANCHORED');
 let raw,version,revision,format,history=[],proof;
 if(anchor.format===3){const v=await walk({...image,Store:{...image.Store,B6:anchor}});version=v.chain[0].version;raw=await readVersion(image,version,metrics());revision=v.anchor.resultRevision;format='P5_FORMAT_3';proof={kind:'P5_CHAIN',manifestRef:v.anchor.manifestRef,anchorHash:v.anchor.integrity};history=v.chain.slice(1).map(m=>({revision:m.resultRevision,version:m.version,ref:m.integrity,activated:true}));}
 else if(anchor.format===2){
  if(!hash(anchor.legacyChecksum)||await legacyTextHash(image.Store.B2)!==anchor.legacyChecksum||!anchor.version)fail('P6_INVALID_B6');
  version=anchor.version;raw=await readVersion(image,version,metrics());revision=await legacyTextHash(raw.trim());format='OPERATIONAL_FORMAT_2';proof={kind:'CURRENT_B6_ONLY',anchorHash:await commercialHash(anchor),historicalActivationNotProven:true};
 }else fail('P6_UNKNOWN_B6_FORMAT');
 const data=JSON.parse(raw);validateData(data);let pending={state:'NONE'},candidate=null;
 if(intent){
  if(format==='P5_FORMAT_3'){
   await check(intent,'format requestId requestHash payloadHash baseRevision sourceId createdAt version requestVersion manifestRef');if(intent.format!==3||intent.sourceId!==image.sourceId||!hash(intent.requestHash)||!hash(intent.payloadHash)||!hash(intent.baseRevision)||typeof intent.requestId!=='string'||!Number.isFinite(Date.parse(intent.createdAt)))fail('P6_INVALID_B5');
   const linked=[proof.manifestRef,...history.map(h=>h.ref)].map(r=>image.Manifests[r]).find(m=>m.requestId===intent.requestId&&m.requestHash===intent.requestHash&&m.payloadHash===intent.payloadHash&&m.integrity===intent.manifestRef);
   pending={state:linked?'COMMITTED':intent.baseRevision===revision?'PENDING':'BLOCKED',requestId:intent.requestId,baseRevision:intent.baseRevision,targetRevision:intent.payloadHash};
  }else{
   if(intent.format!==2||!hash(intent.baseRevision)||!hash(intent.revision)||typeof intent.requestId!=='string')fail('P6_INVALID_B5');const r=anchor.receipt;
   pending={state:r&&r.requestId===intent.requestId&&r.baseRevision===intent.baseRevision&&r.revision===intent.revision&&revision===intent.revision?'COMMITTED':intent.baseRevision===revision?'PENDING':'BLOCKED',requestId:intent.requestId,baseRevision:intent.baseRevision,targetRevision:intent.revision};
  }
  if(pending.state==='PENDING'&&intent.version){const text=await readVersion(image,intent.version,metrics()),d=JSON.parse(text);validateData(d);if(await legacyTextHash(text.trim())!==pending.targetRevision)fail('P6_PENDING_CONTENT');candidate={revision:pending.targetRevision,version:intent.version,data:d,ref:await commercialHash(intent.version),activated:false};}
 }
 return {version:1,sourceId:image.sourceId,domainId:image.domainId||null,format,revision,raw,data,descriptor:version,anchor,proof,pending,candidate,history,authorityHash:await authorityHash(image)};
}
export async function capture(backend,sourceId,{onCaptured=null}={}){
 const before=await backend.load();if(before?.sourceId!==sourceId||!Number.isSafeInteger(before.generation))fail('P6_SOURCE_IDENTITY');const official=await decodeAuthority(authority(before));
 if(onCaptured)await onCaptured();const after=await backend.load();if(after?.generation!==before.generation||after.sourceId!==sourceId||await authorityHash(after)!==official.authorityHash)fail('P6_SOURCE_CHANGED');
 const snapshot=await seal({...official,generation:before.generation,lockOwner:before.lockOwner||null,image:authority(before)});return {snapshot,state:copy(before)};
}
export async function validateSnapshot(snapshot){
 await check(snapshot,'version sourceId domainId format revision raw data descriptor anchor proof pending candidate history authorityHash generation lockOwner image');
 const actual=await decodeAuthority(snapshot.image);for(const key of Object.keys(actual))if(canonical(actual[key])!==canonical(snapshot[key]))fail('P6_SNAPSHOT_INTEGRITY');return actual;
}
