import {object,fail,canonical,commercialHash,legacyTextHash,encodeOriginal,decodeOriginal} from './codec.mjs';
export const KEY='theView.crmCommercial.v2';
const hex=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const keys=(v,allowed,required=[])=>object(v)&&Object.keys(v).every(k=>allowed.includes(k))&&required.every(k=>Object.hasOwn(v,k));
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(v)&&Number.isFinite(Date.parse(v));
const same=(a,b)=>canonical(a)===canonical(b);
const requestKeys=['action','data','baseRevision','requestId'];
export function dataIssues(data){
  const issues=[];if(!object(data))return ['DATA_NOT_OBJECT'];
  try{canonical(data);}catch{return ['NON_JSON_DATA'];}
  function safe(v,d=0){if(d>40)return false;return !v||typeof v!=='object'||Object.entries(v).every(([k,x])=>!['__proto__','prototype','constructor'].includes(k)&&safe(x,d+1));}
  if(!safe(data))issues.push('UNSAFE_DATA_KEYS');
  for(const name of ['clients','events','agents']){
    if(data[name]!==undefined&&!Array.isArray(data[name])){issues.push('INVALID_COLLECTION');continue;}
    const ids=new Set();for(const item of data[name]||[]){if(!object(item)||!['string','number'].includes(typeof item.id)||!String(item.id)||ids.has(String(item.id)))issues.push('INVALID_OR_DUPLICATE_ID');else ids.add(String(item.id));}
  }
  if(issues.length)return [...new Set(issues)];
  const clients=new Set((data.clients||[]).map(x=>String(x.id))),agents=new Set((data.agents||[]).map(x=>String(x.id))),events=new Map((data.events||[]).map(x=>[String(x.id),x]));
  for(const c of data.clients||[])if(c.agentId&&!agents.has(String(c.agentId)))issues.push('MISSING_AGENT');
  for(const e of data.events||[])if(e.clientId&&!clients.has(String(e.clientId)))issues.push('MISSING_CLIENT');
  for(const name of ['finalPrices','statuses','salePrices','priceHistory','saleCommissions','unavailableReasons','statusEventIds','salePriceEventIds'])if(data[name]!==undefined&&!object(data[name]))issues.push('INVALID_MAP');
  for(const name of ['statusEventIds','salePriceEventIds'])if(object(data[name]))for(const [unit,id]of Object.entries(data[name])){
    const event=events.get(String(id));if(!event)issues.push('MISSING_EVENT');else if(!Array.isArray(event.fractions)||!event.fractions.map(Number).includes(Number(unit)))issues.push('EVENT_FRACTION_MISMATCH');
  }
  if(object(data.saleCommissions))for(const commission of Object.values(data.saleCommissions))if(!object(commission)||!events.has(String(commission.eventId)))issues.push('MISSING_COMMISSION_EVENT');
  return [...new Set(issues)];
}
function requestIssues(v){
  if(!keys(v,requestKeys,requestKeys)||!['save','recover'].includes(v.action)||typeof v.requestId!=='string'||!v.requestId||!hex(v.baseRevision))return ['INVALID_REQUEST'];
  return dataIssues(v.data);
}
function payloadIssues(v){
  if(!keys(v,['recoveryFormat','data','base','pendingWrite','syncMeta','pendingSync','createdAt','remoteData','reason'],['recoveryFormat','data','base','pendingWrite','syncMeta'])||v.recoveryFormat!==1)return ['UNKNOWN_RECOVERY_ENVELOPE'];
  if(!keys(v.syncMeta,['revision','lastConfirmedAt'],['revision'])||!hex(v.syncMeta.revision)||v.syncMeta.lastConfirmedAt!==undefined&&!date(v.syncMeta.lastConfirmedAt))return ['UNKNOWN_SYNC_METADATA'];
  if(v.pendingSync!==undefined&&typeof v.pendingSync!=='boolean'||v.createdAt!==undefined&&!date(v.createdAt)||v.reason!==undefined&&typeof v.reason!=='string')return ['INVALID_RECOVERY_FIELDS'];
  return [...dataIssues(v.data),...dataIssues(v.base),...(v.remoteData?dataIssues(v.remoteData):[]),...(v.pendingWrite!==null?requestIssues(v.pendingWrite):[])];
}
function recoveryContent(value){const copy=JSON.parse(JSON.stringify(value));delete copy.createdAt;if(copy.syncMeta)delete copy.syncMeta.lastConfirmedAt;return canonical(copy);}
async function unpack(raw){
  let value;try{value=JSON.parse(raw);}catch{fail('P2_INVALID_JSON');}
  if(!object(value)||!Object.hasOwn(value,'recoveryStorageFormat'))return {raw,value,compressed:false};
  if(!keys(value,['recoveryStorageFormat','codec','data','length','checksum'],['recoveryStorageFormat','codec','data','length','checksum'])||value.recoveryStorageFormat!==1||value.codec!=='gzip')fail('P2_UNKNOWN_CODEC');
  if(!Number.isSafeInteger(value.length)||value.length<0||value.length>8*1024*1024||!hex(value.checksum)||typeof value.data!=='string'||value.data.length>48*1024*1024||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value.data))fail('P2_INVALID_COMPRESSION');
  if(typeof DecompressionStream==='undefined')fail('P2_CODEC_UNAVAILABLE');
  const bytes=Uint8Array.from(atob(value.data),c=>c.charCodeAt(0)),reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader(),chunks=[];let length=0;
  try{while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>32*1024*1024){await reader.cancel();fail('P2_INFLATION_LIMIT');}chunks.push(part.value);}}finally{reader.releaseLock();}
  const expanded=new Uint8Array(length);let offset=0;for(const part of chunks){expanded.set(part,offset);offset+=part.length;}
  const text=new TextDecoder('utf-8',{fatal:true}).decode(expanded);if(text.length!==value.length||await legacyTextHash(text)!==value.checksum)fail('P2_COMPRESSED_CHECKSUM');
  return {raw:text,value:JSON.parse(text),compressed:true};
}
function unwrap(value){let current=value;for(let i=0;i<8;i++){if(!object(current)||!Object.hasOwn(current,'legacyRaw'))return current;if(!keys(current,['legacyKey','legacyRaw'],['legacyKey','legacyRaw'])||typeof current.legacyKey!=='string'||typeof current.legacyRaw!=='string')fail('P2_UNKNOWN_LEGACY');try{current=JSON.parse(current.legacyRaw);}catch{fail('P2_INVALID_LEGACY_JSON');}}fail('P2_LEGACY_DEPTH');}
const proofKeys=['format','protocol','method','revision','baseRevision','operationBaseRevision','requestId','confirmedAt','rawHash','bodyHash','dataHash','baseHash','remoteHash'];
async function receiptBinding(proof,value,payload,raw){
  if(!keys(proof,proofKeys,proofKeys))return 'UNKNOWN_PROOF';
  if(proof.format!==1||proof.protocol!=='tv-cas-v1'||!date(proof.confirmedAt)||!['confirmed-read','confirmed-state','exact-request','exact-data','reconciled'].includes(proof.method))return 'INCOMPATIBLE_PROOF';
  if(!['revision','baseRevision','rawHash','bodyHash','dataHash','baseHash'].every(k=>hex(proof[k]))||proof.revision!==proof.dataHash||proof.baseRevision!==payload.syncMeta.revision)return 'INCOMPATIBLE_PROOF';
  if(proof.rawHash!==await legacyTextHash(raw)||proof.bodyHash!==await legacyTextHash(recoveryContent(value))||proof.baseHash!==await commercialHash(payload.base)||proof.remoteHash!==(payload.remoteData?await commercialHash(payload.remoteData):''))return 'INCOMPATIBLE_PROOF';
  if(proof.method==='reconciled')return 'NEEDS_FUTURE_SEMANTIC_VALIDATION';
  if(proof.dataHash!==await commercialHash(payload.data))return 'INCOMPATIBLE_PROOF';
  if(proof.method==='exact-request'){
    if(payload.pendingWrite===null||proof.requestId!==payload.pendingWrite.requestId||proof.operationBaseRevision!==payload.pendingWrite.baseRevision||!same(payload.pendingWrite.data,payload.data))return 'INCOMPATIBLE_PROOF';
  }else if(payload.pendingWrite!==null)return 'INCOMPATIBLE_PROOF';
  if(['confirmed-read','confirmed-state'].includes(proof.method)&&(proof.requestId!==''||proof.operationBaseRevision!==''))return 'INCOMPATIBLE_PROOF';
  if(proof.method==='confirmed-read'&&(payload.pendingSync!==false||proof.revision!==proof.baseRevision||!same(payload.data,payload.base)))return 'INCOMPATIBLE_PROOF';
  if(proof.method==='exact-data'&&(!proof.requestId||!hex(proof.operationBaseRevision)))return 'INCOMPATIBLE_PROOF';
  return 'LOCAL_CONTENT_BOUND_ONLY';
}
export async function inspectFragment(fragment){
  if(typeof fragment?.id!=='string'||!fragment.id||!['cache','sync-meta','request','pending-marker','recovery','legacy'].includes(fragment.kind))fail('P2_INVALID_FRAGMENT');
  const body=await encodeOriginal(fragment.value),report={version:1,id:fragment.id,kind:fragment.kind,bodyRef:body.bodyRef,classification:'UNKNOWN',issues:[],confirmation:'NOT_ESTABLISHED',receiptBinding:'NONE',protected:true};
  let value,payload,raw,record,selection=fragment.kind==='legacy'?'legacy':'json';
  try{
    if(fragment.kind==='recovery'){
      record=fragment.value;
      if(!keys(record,['id','kind','raw','signature','rawChecksum','createdAt','protected','needsReview','checkpointAt','checkpointOrder','confirmation','confirmationReceipt'],['id','kind','raw'])||typeof record.raw!=='string'||typeof record.id!=='string'||typeof record.kind!=='string'){report.issues.push('UNKNOWN_RECORD_METADATA');return {body,report};}
      if(!['legacy','legacy-localStorage','confirmed','before-remote','write-request','auto-reconciliation','conflict','before-local-restore','storage-failure','reset'].includes(record.kind)){report.issues.push('UNKNOWN_RECORD_KIND');return {body,report};}
      if(['protected','needsReview'].some(k=>record[k]!==undefined&&typeof record[k]!=='boolean')||['createdAt','checkpointAt'].some(k=>record[k]!==undefined&&!date(record[k]))||record.checkpointOrder!==undefined&&(!Number.isSafeInteger(record.checkpointOrder)||record.checkpointOrder<1))fail('P2_INVALID_RECORD_METADATA');
      if(record.confirmation!==undefined&&(!keys(record.confirmation,['requestId','baseRevision','method'],['requestId','baseRevision','method'])||!hex(record.confirmation.baseRevision)||typeof record.confirmation.requestId!=='string'||!record.confirmation.requestId||!['exact-request','exact-data','reconciled'].includes(record.confirmation.method)))fail('P2_UNKNOWN_CONFIRMATION');
      const decoded=await unpack(record.raw);raw=decoded.raw;value=decoded.value;report.compressed=decoded.compressed;selection='recovery';
      if(record.rawChecksum!==undefined&&record.rawChecksum!==await legacyTextHash(raw))fail('P2_RAW_CHECKSUM');
      if(record.signature!==undefined){const content=recoveryContent(value);if(record.signature!==content&&record.signature!==await legacyTextHash(content))fail('P2_CONTENT_SIGNATURE');}else report.issues.push('LEGACY_SIGNATURE_ABSENT');
    }else{
      if(typeof fragment.value!=='string')fail('P2_EXPECTED_STORAGE_TEXT');raw=fragment.value;try{value=JSON.parse(raw);}catch{fail('P2_INVALID_JSON');}
    }
    if(fragment.kind==='cache'){
      const issues=dataIssues(value);report.issues.push(...issues);report.classification=issues.length?'CONFLICT':'RECOVERABLE';report.dataHash=issues.length?null:await commercialHash(value);
    }else if(fragment.kind==='sync-meta'){
      if(!keys(value,['base','revision','lastConfirmedAt'],['base','revision','lastConfirmedAt'])||!hex(value.revision)||!date(value.lastConfirmedAt)){report.issues.push('UNKNOWN_SYNC_METADATA');return {body,report};}
      report.issues.push(...dataIssues(value.base));if(!report.issues.length&&await commercialHash(value.base)!==value.revision)report.issues.push('BASE_REVISION_MISMATCH');report.classification=report.issues.length?'CONFLICT':'RECOVERABLE';report.baseRevision=value.revision;
    }else if(fragment.kind==='request'){
      report.issues.push(...requestIssues(value));report.classification=report.issues.length?'CONFLICT':'PENDING';if(!report.issues.length)report.operation=await operationView(value,'json');
    }else if(fragment.kind==='pending-marker'){
      if(!keys(value,['createdAt','clients','events','agents'],['createdAt','clients','events','agents'])||!date(value.createdAt)||['clients','events','agents'].some(k=>!Number.isSafeInteger(value[k])||value[k]<0))report.issues.push('UNKNOWN_PENDING_MARKER');report.classification=report.issues.length?'UNKNOWN':'PENDING';
    }else{
      payload=unwrap(value);report.issues.push(...payloadIssues(payload));
      if(report.issues.some(x=>x.startsWith('UNKNOWN_')))return {body,report};
      if(!report.issues.length&&await commercialHash(payload.base)!==payload.syncMeta.revision)report.issues.push('BASE_REVISION_MISMATCH');
      if(payload.pendingWrite&&!report.issues.length){if(payload.pendingWrite.baseRevision!==payload.syncMeta.revision||!same(payload.pendingWrite.data,payload.data))report.issues.push('REQUEST_SNAPSHOT_MISMATCH');else report.operation=await operationView(payload.pendingWrite,selection,selection==='recovery'?'/pendingWrite':'/pendingWrite');}
      if(record?.confirmationReceipt){report.receiptBinding=await receiptBinding(record.confirmationReceipt,value,payload,raw);if(report.receiptBinding==='UNKNOWN_PROOF')report.classification='UNKNOWN';else if(report.receiptBinding==='INCOMPATIBLE_PROOF')report.issues.push('INCOMPATIBLE_PROOF');}
      if(report.classification!=='UNKNOWN'||report.receiptBinding!=='UNKNOWN_PROOF')report.classification=report.issues.length?'CONFLICT':payload.pendingWrite!==null||payload.pendingSync===true||record?.needsReview===true||!same(payload.data,payload.base)?'PENDING':'RECOVERABLE';
      if(report.operation)report.operation.basePointer='/base';
      if(record&&['active-write.v1','active-write-confirmed.v1'].includes(record.id))report.reservation=record.id;
    }
    if(report.issues.includes('LEGACY_SIGNATURE_ABSENT'))report.classification='INSUFFICIENT_INTEGRITY';
    return {body,report};
  }catch(e){report.classification=/UNKNOWN_|CODEC_UNAVAILABLE/.test(e.code||'')?'UNKNOWN':'INSUFFICIENT_INTEGRITY';report.issues.push(e.code||'P2_UNREADABLE');return {body,report};}
}
async function operationView(request,view,pointer=''){
  return {requestId:request.requestId,baseRevision:request.baseRevision,payloadHash:await commercialHash(request.data),requestHash:await commercialHash(request),view,requestPointer:pointer,dataPointer:pointer+'/data'};
}
export async function project(body,{view='json',pointer=''}={}){
  let value=await decodeOriginal(body);
  if(view==='recovery'){const decoded=await unpack(value.raw);value=unwrap(decoded.value);}
  else if(typeof value==='string'){value=JSON.parse(value);if(view==='legacy')value=unwrap(value);}
  if(pointer){if(!pointer.startsWith('/'))fail('P2_INVALID_POINTER');for(const part of pointer.slice(1).split('/').map(p=>p.replace(/~1/g,'/').replace(/~0/g,'~'))){if(value===null||typeof value!=='object'||!Object.hasOwn(value,part))fail('P2_MISSING_REFERENCE');value=value[part];}}
  return value;
}
export async function inspectCapture(capture){
  if(capture?.version!==1||!Array.isArray(capture.fragments))fail('P2_INVALID_CAPTURE');
  const ids=new Set();for(const f of capture.fragments){if(ids.has(f.id))fail('P2_DUPLICATE_FRAGMENT');ids.add(f.id);}
  const entries=[];for(const f of capture.fragments)entries.push(await inspectFragment(f));
  const cache=entries.find(x=>x.report.kind==='cache'),meta=entries.find(x=>x.report.kind==='sync-meta'),pending=entries.find(x=>x.report.kind==='request');
  const mark=(items,reason)=>{for(const x of items.filter(Boolean)){x.report.classification='CONFLICT';x.report.issues.push(reason);}};
  if(pending?.report.operation&&!meta?.report.baseRevision)mark([pending],'MISSING_BASE_REFERENCE');
  if(pending?.report.operation&&meta?.report.baseRevision&&pending.report.operation.baseRevision!==meta.report.baseRevision)mark([pending,meta],'CROSS_FRAGMENT_BASE_MISMATCH');
  if(cache?.report.dataHash&&pending?.report.operation&&cache.report.dataHash!==pending.report.operation.payloadHash)mark([cache,pending],'LOCAL_EDITS_AFTER_REQUEST');
  const requests=new Map();for(const e of entries)if(e.report.operation){const id=e.report.operation.requestId;if(!requests.has(id))requests.set(id,[]);requests.get(id).push(e);}for(const group of requests.values())if(new Set(group.map(e=>e.report.operation.requestHash)).size>1)mark(group,'REQUEST_ID_CONTENT_COLLISION');
  if(capture.stability!=='OBSERVED_UNCHANGED')for(const e of entries)mark([e],'SOURCE_CHANGED_DURING_CAPTURE');
  return {version:1,entries,atomicAcrossStores:false,baseBinding:'NO_INSTANCE_BASE_INFERRED',confirmation:'NOT_ESTABLISHED'};
}
export function diagnostics(analysis){const counts={};for(const e of analysis.entries)counts[e.report.classification]=(counts[e.report.classification]||0)+1;return {fragments:analysis.entries.length,counts,bytes:analysis.entries.reduce((n,e)=>n+e.body.encodedBytes,0),remoteConfirmation:false,atomicAcrossStores:false};}
export async function readExisting({storage,recoveryDb,sourceOrigin}){
  if(typeof sourceOrigin!=='string'||!storage||!recoveryDb||recoveryDb.name!==KEY+'.recovery.v1'||!recoveryDb.objectStoreNames.contains('copies'))fail('P2_SOURCE_ADAPTER_REQUIRED');
  const relevant=k=>[KEY,KEY+'.syncMeta.v1',KEY+'.pendingWrite.v1',KEY+'.pendingSync',KEY+'.backupBeforeRemoteLoad',KEY+'.backupBeforeMajucaImport.v1'].includes(k)||[KEY+'.conflictBackup.',KEY+'.confirmedReadBackup.',KEY+'.backupBeforeRemoteLoad.archive.'].some(p=>k.startsWith(p));
  const take=()=>{const rows=[];for(let i=0;i<storage.length;i++){const k=storage.key(i);if(k&&relevant(k)){const value=storage.getItem(k);if(value!==null)rows.push([k,value]);}}return rows.sort((a,b)=>a[0].localeCompare(b[0]));};
  const before=take(),snapshot=await new Promise((resolve,reject)=>{const tx=recoveryDb.transaction('copies','readonly');let rows,ids;tx.oncomplete=()=>resolve({rows,ids});tx.onabort=tx.onerror=()=>reject(Object.assign(new Error('P2_SOURCE_READ_FAILED'),{code:'P2_SOURCE_READ_FAILED'}));const store=tx.objectStore('copies'),r=store.getAll(),k=store.getAllKeys();r.onsuccess=()=>rows=r.result;k.onsuccess=()=>ids=k.result;}),after=take();
  const kind=k=>k===KEY?'cache':k===KEY+'.syncMeta.v1'?'sync-meta':k===KEY+'.pendingWrite.v1'?'request':k===KEY+'.pendingSync'?'pending-marker':'legacy';
  const fragments=before.map(([k,value])=>({id:'ls:'+k,kind:kind(k),value}));for(let i=0;i<snapshot.rows.length;i++){const encodedKey=await encodeOriginal(snapshot.ids[i]);fragments.push({id:'idb:'+encodedKey.bodyRef,kind:'recovery',value:snapshot.rows[i]});}
  const changed=canonical(before)!==canonical(after);if(changed)for(const [k,value]of after)if(!before.some(([old,raw])=>old===k&&raw===value))fragments.push({id:'changed-ls:'+k,kind:kind(k),value});
  return {version:1,sourceOrigin,stability:changed?'CHANGED':'OBSERVED_UNCHANGED',fragments};
}
