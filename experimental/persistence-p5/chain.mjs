import {check,MANIFEST,ANCHOR,FORMAT,CHUNK,MAX_CHARACTERS,hash,identity,matches,legacyTextHash,canonical,fail,validateData} from './contracts.mjs';

export function appendVersion(state,raw,time){
 if(typeof raw!=='string'||raw.length>MAX_CHARACTERS)fail('P5_SIZE');
 const start=state.StoreVersions.length+1,rows=[];
 for(let offset=0;offset<raw.length;){let end=Math.min(offset+CHUNK,raw.length);if(end<raw.length&&/[\uD800-\uDBFF]/.test(raw[end-1]))end--;rows.push([null,rows.length,':'+raw.slice(offset,end)]);offset=end;}
 return {start,rows,time,raw};
}
export async function stageVersion(state,raw,time){const p=appendVersion(state,raw,time),checksum=await legacyTextHash(raw);for(const row of p.rows)row[0]=checksum;state.StoreVersions.push(...p.rows);return {format:2,start:p.start,count:p.rows.length,length:raw.length,checksum,updatedAt:time};}
export async function readVersion(state,d,stats,budget=()=>{}){
 budget();if(!d||Object.keys(d).sort().join('|')!=='checksum|count|format|length|start|updatedAt'||d.format!==2||!Number.isInteger(d.start)||d.start<1||!Number.isInteger(d.count)||d.count<1||d.count>100||!Number.isInteger(d.length)||d.length<1||d.length>MAX_CHARACTERS||!hash(d.checksum))fail('P5_DESCRIPTOR');
 stats.reads++;const rows=state.StoreVersions.slice(d.start-1,d.start-1+d.count);if(rows.length!==d.count)fail('P5_CHUNKS');
 const raw=rows.map((r,i)=>{if(!Array.isArray(r)||r.length!==3||r[0]!==d.checksum||r[1]!==i||typeof r[2]!=='string'||r[2][0]!==':'||r[2].length>CHUNK+1)fail('P5_CHUNKS');return r[2].slice(1);}).join('');
 stats.temporaryPeakCharacters=Math.max(stats.temporaryPeakCharacters,raw.length);stats.verifiedCharacters+=raw.length;
 const t=performance.now();if(raw.length!==d.length||await legacyTextHash(raw)!==d.checksum)fail('P5_CONTENT');JSON.parse(raw);stats.verificationMs+=performance.now()-t;budget();return raw;
}
export const metrics=()=>({manifests:0,reads:0,temporaryPeakCharacters:0,verifiedCharacters:0,verificationMs:0});
export async function walk(state,{maxDepth=256,maxMs=5000,stats=metrics(),onManifest=null}={}){
 const started=performance.now(),budget=()=>{if(performance.now()-started>maxMs)fail('P5_LOOKUP_LIMIT');};
 if(!Number.isInteger(maxDepth)||maxDepth<1||maxDepth>512||!Number.isFinite(maxMs)||maxMs<=0||maxMs>10000)fail('P5_LOOKUP_LIMIT');
 budget();const t=performance.now(),anchor=await check(state.Store.B6,ANCHOR);stats.reads++;
 if(anchor.format!==FORMAT||anchor.sourceId!==state.sourceId||anchor.domainId!==state.domainId||await legacyTextHash(state.Store.B2)!==anchor.legacyChecksum)fail('P5_ANCHOR');
 stats.verificationMs+=performance.now()-t;const seen=new Set(),chain=[];let ref=anchor.manifestRef,child=null;
 while(ref){budget();if(chain.length>=maxDepth||seen.has(ref))fail('P5_LOOKUP_LIMIT');seen.add(ref);stats.reads++;
  const mt=performance.now(),m=await check(state.Manifests[ref],MANIFEST);stats.verificationMs+=performance.now()-mt;stats.manifests++;
  if(m.integrity!==ref||m.format!==FORMAT||m.sourceId!==anchor.sourceId||m.domainId!==anchor.domainId||!Number.isSafeInteger(m.height)||m.height<0||!hash(m.resultRevision)||m.payloadHash!==m.resultRevision||!Number.isFinite(Date.parse(m.createdAt)))fail('P5_MANIFEST');
  if(!child&&anchor.resultRevision!==m.resultRevision||child&&(child.previousRef!==ref||child.baseRevision!==m.resultRevision||child.height!==m.height+1))fail('P5_PARENT');
  const raw=await readVersion(state,m.version,stats,budget),payload=JSON.parse(raw);validateData(payload);if(m.version.checksum!==m.payloadHash||canonical(payload)!==raw)fail('P5_PAYLOAD');
  if(m.kind==='GENESIS'){
   if(m.previousRef!==null||m.height!==0||m.operationId!==null||m.requestId!==null||m.requestHash!==null||m.baseRevision!==null||m.requestVersion!==null||typeof m.completeHistory!=='boolean')fail('P5_GENESIS');
  }else{
   if(m.kind!=='COMMIT'||!hash(m.previousRef)||m.height<1||m.completeHistory!==null||m.operationId!=='p5-op-'+m.requestHash)fail('P5_MANIFEST');
   const original=JSON.parse(await readVersion(state,m.requestVersion,stats,budget)),it=performance.now(),id=await identity(original,anchor.sourceId);if(!matches(m,id)||m.resultRevision!==id.payloadHash||canonical(original.data)!==raw)fail('P5_REQUEST_INTEGRITY');stats.verificationMs+=performance.now()-it;
  }
  chain.push(m);if(onManifest)await onManifest(stats.manifests);child=m;ref=m.previousRef;
 }
 if(chain.at(-1)?.kind!=='GENESIS')fail('P5_TRUNCATED');return {anchor,chain,completeHistory:chain.at(-1).completeHistory,stats};
}
export function receipt(m){return {version:1,status:'COMMITTED',requestId:m.requestId,baseRevision:m.baseRevision,resultRevision:m.resultRevision,payloadHash:m.payloadHash,requestHash:m.requestHash,commitRef:m.integrity,confirmedAt:m.createdAt,sourceId:m.sourceId,laboratoryOnly:true};}
