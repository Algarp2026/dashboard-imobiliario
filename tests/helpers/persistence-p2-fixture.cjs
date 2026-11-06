'use strict';
const {createHash}=require('node:crypto');
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const hash=v=>createHash('sha256').update(typeof v==='string'?v:canonical(v)).digest('hex');
const content=v=>{const copy=structuredClone(v);delete copy.createdAt;if(copy.syncMeta)delete copy.syncMeta.lastConfirmedAt;return canonical(copy);};
const KEY='theView.crmCommercial.v2',time='2026-11-05T12:00:00Z';
function base(){return {clients:[{id:'fiction-a',name:'Synthetic A',agentId:'fiction-agent',notes:'Synthetic baseline'},{id:'fiction-b',name:'Synthetic B',notes:'Synthetic baseline'}],agents:[{id:'fiction-agent',name:'Synthetic agency'}],events:[{id:'fiction-reserve-8',clientId:'fiction-a',fractions:[8]},{id:'fiction-reserve-24',clientId:'fiction-b',fractions:[24]}],statuses:{8:'Reservado',24:'Reservado'},finalPrices:{8:400000,24:500000},priceHistory:{8:[{id:'fiction-price',price:400000}]},salePrices:{},saleCommissions:{},statusEventIds:{8:'fiction-reserve-8',24:'fiction-reserve-24'},salePriceEventIds:{},unavailableReasons:{},unknownRoot:{unicode:'Fiction \u00e1\u0000\ud800',keep:true},majucaImportKey:'fiction-only',majucaImportSummary:{synthetic:true}};}
function envelope(data,baseline,id=null){return {recoveryFormat:1,data,base:baseline,pendingSync:true,pendingWrite:id?{action:'save',requestId:id,baseRevision:hash(baseline),data}:null,syncMeta:{revision:hash(baseline),lastConfirmedAt:time}};}
function record(id,value,kind='legacy'){
  const raw=JSON.stringify(value);return {id,kind,raw,signature:hash(content(value)),rawChecksum:hash(raw),createdAt:time,protected:true,needsReview:false};
}
function receipt(value){return {format:1,protocol:'tv-cas-v1',method:'exact-request',revision:hash(value.data),baseRevision:value.syncMeta.revision,operationBaseRevision:value.pendingWrite.baseRevision,requestId:value.pendingWrite.requestId,confirmedAt:time,rawHash:hash(JSON.stringify(value)),bodyHash:hash(content(value)),dataHash:hash(value.data),baseHash:hash(value.base),remoteHash:''};}
const bytes=r=>{const {raw,signature='',rawChecksum='',...meta}=r;return 2*(raw.length+signature.length+rawChecksum.length+JSON.stringify(meta).length);};
async function capture({large=false,newerEdits=true,sourceOrigin='http://127.0.0.1:53472'}={}){
  const baseline=base(),pending=structuredClone(baseline);pending.clients[0].notes='Synthetic pending original';const current=structuredClone(pending);if(newerEdits)current.clients[0].notes='Synthetic newer local edit';
  const request={action:'save',requestId:'fiction-live-request',baseRevision:hash(baseline),data:pending};
  const fragments=[{id:'ls:'+KEY,kind:'cache',value:JSON.stringify(current)},{id:'ls:'+KEY+'.syncMeta.v1',kind:'sync-meta',value:JSON.stringify({base:baseline,revision:hash(baseline),lastConfirmedAt:time})},{id:'ls:'+KEY+'.pendingWrite.v1',kind:'request',value:JSON.stringify(request)},{id:'ls:'+KEY+'.pendingSync',kind:'pending-marker',value:JSON.stringify({createdAt:time,clients:2,events:2,agents:1})}];
  const records=[];let used=0,total=Math.floor(14.84*1024*1024/2)*2;
  for(let i=0;i<15;i++){
    let value;
    if(i<8){const d=structuredClone(baseline);d.clients[1].notes='Synthetic historical '+i;value=envelope(d,baseline,'fiction-old-'+i);}
    else if(i<11)value={legacyKey:'fiction-old-key-'+i,legacyRaw:JSON.stringify(envelope(baseline,baseline))};
    else value={futureEnvelopeVersion:9,opaque:'Fiction \u00e1\u0000\ud800',padding:''};
    const r=record('fiction-history-'+i,value,i<8?'write-request':'legacy');
    const target=large?(i===14?total-used:Math.floor(total/15/2)*2):bytes(r)+64;
    const padding='z'.repeat(Math.max(0,Math.floor((target-bytes(r))/2)));
    if(i<8)value.reason=padding;else if(i<11){const inner=JSON.parse(value.legacyRaw);inner.reason=padding;value.legacyRaw=JSON.stringify(inner);}else value.padding=padding;
    Object.assign(r,record(r.id,value,r.kind));used+=bytes(r);records.push(r);
  }
  // Rebalance the last opaque item after wrapper overhead, without hiding bytes.
  if(large){const last=records.at(-1),v=JSON.parse(last.raw),extra=Math.floor((total-records.reduce((n,r)=>n+bytes(r),0))/2);v.padding=extra>=0?v.padding+'z'.repeat(extra):v.padding.slice(0,extra);Object.assign(last,record(last.id,v,last.kind));}
  const active=record('active-write.v1',envelope(pending,baseline,request.requestId),'write-request');
  const previous=base(),old=structuredClone(previous);old.clients[0].notes='Synthetic older baseline';const confirmedValue=envelope(previous,old,'fiction-confirmed-request'),confirmed=record('active-write-confirmed.v1',confirmedValue,'write-request');confirmed.protected=false;confirmed.confirmationReceipt=receipt(confirmedValue);
  const compressed=record('fiction-compressed',envelope(baseline,baseline,'fiction-compressed-request'));
  const original=compressed.raw,zipped=new Uint8Array(await new Response(new Blob([original]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  let binary='';for(let i=0;i<zipped.length;i+=8192)binary+=String.fromCharCode(...zipped.subarray(i,i+8192));compressed.raw=JSON.stringify({recoveryStorageFormat:1,codec:'gzip',data:btoa(binary),length:original.length,checksum:hash(original)});
  for(const r of [...records,active,confirmed,compressed])fragments.push({id:'idb:'+r.id,kind:'recovery',value:r});
  return {version:1,sourceOrigin,stability:'OBSERVED_UNCHANGED',fragments};
}
module.exports={capture,base,envelope,record,receipt,hash,canonical,bytes,KEY};
