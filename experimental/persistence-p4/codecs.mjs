import {encodeOriginal as encodeP2,decodeOriginal as decodeP2,sha,utf8,fail} from '../persistence-p2/codec.mjs';

const LIMIT=32*1024*1024;
const fields=['version','bodyRef','rawHash','codec','codecVersion','mediaType','decodedBytes','encodedBytes','encodedHash','bytes'];
export const physicalCost=b=>b.bytes.length+utf8(JSON.stringify(Object.fromEntries(Object.entries(b).filter(([k])=>k!=='bytes')))).length;
export function samePhysicalBody(a,b){
  if(!a||!b||!(a.bytes instanceof Uint8Array)||!(b.bytes instanceof Uint8Array))return false;
  const keys=Object.keys(a).sort();if(JSON.stringify(keys)!==JSON.stringify(Object.keys(b).sort()))return false;
  return keys.filter(k=>k!=='bytes').every(k=>a[k]===b[k])&&a.bytes.length===b.bytes.length&&a.bytes.every((x,i)=>x===b.bytes[i]);
}
async function streamBytes(stream,limit){
  const reader=stream.getReader(),chunks=[];let size=0;
  try{for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>limit){await reader.cancel();fail('P4_EXPANSION_LIMIT');}chunks.push(part.value);}}finally{reader.releaseLock();}
  const result=new Uint8Array(size);let offset=0;for(const c of chunks){result.set(c,offset);offset+=c.length;}return result;
}
async function unpack(body,timing=null){
  if(body?.version===1){const t=performance.now(),value=await decodeP2(body);if(timing)timing.verificationMs=performance.now()-t;return {raw:body,value};}
  if(!body||Object.keys(body).length!==fields.length||!fields.every(k=>Object.hasOwn(body,k))||body.version!==2||body.codec!=='gzip'||body.codecVersion!==1||!(body.bytes instanceof Uint8Array)||!Number.isSafeInteger(body.decodedBytes)||body.decodedBytes<0||body.decodedBytes>LIMIT||body.encodedBytes!==body.bytes.length||body.bytes.length>LIMIT)fail('P4_ENCODING_INTEGRITY');
  const h=performance.now();if(await sha(body.bytes)!==body.encodedHash)fail('P4_ENCODING_INTEGRITY');if(timing)timing.verificationMs=performance.now()-h;
  if(typeof DecompressionStream==='undefined')fail('P4_CODEC_UNAVAILABLE');
  const d=performance.now();let raw;try{raw=await streamBytes(new Blob([body.bytes]).stream().pipeThrough(new DecompressionStream('gzip')),LIMIT);}catch(e){if(typeof e.code==='string'&&e.code.startsWith('P4_'))throw e;fail('P4_INVALID_GZIP');}if(timing)timing.decompressionMs=performance.now()-d;
  if(raw.length!==body.decodedBytes)fail('P4_LENGTH');
  const original={version:1,bodyRef:body.bodyRef,rawHash:body.rawHash,codec:'identity',mediaType:body.mediaType,decodedBytes:raw.length,encodedBytes:raw.length,bytes:raw},v=performance.now(),value=await decodeP2(original);if(timing)timing.verificationMs+=performance.now()-v;return {raw:original,value};
}
export async function rawBody(body){return (await unpack(body)).raw;}
export async function decodeOriginal(body){return (await unpack(body)).value;}
export async function equivalent(a,b){const x=await rawBody(a),y=await rawBody(b);return samePhysicalBody(x,y);}
export async function compressBody(original,{forceIdentity=false}={}){
  const start=performance.now(),raw=await rawBody(original),sourceVerificationMs=performance.now()-start,originalBytes=raw.bytes.length;
  if(originalBytes>LIMIT)fail('P4_BODY_LIMIT');
  const metrics={originalBytes,originalCost:physicalCost(raw),sourceVerificationMs,compressionMs:0,decompressionMs:0,verificationMs:sourceVerificationMs,encodedHashMs:0,savedBytes:0,metadataBytes:physicalCost(raw)-originalBytes,selected:'identity',reason:'below-threshold'};
  if(forceIdentity||originalBytes<4096||typeof CompressionStream==='undefined'){metrics.reason=forceIdentity?'opaque-preserved':typeof CompressionStream==='undefined'?'codec-unavailable':'below-threshold';return {body:raw,metrics};}
  const c=performance.now();let encoded;try{encoded=await streamBytes(new Blob([raw.bytes]).stream().pipeThrough(new CompressionStream('gzip')),LIMIT);}catch{metrics.reason='compression-unavailable';return {body:raw,metrics};}
  metrics.compressionMs=performance.now()-c;
  const h=performance.now(),encodedHash=await sha(encoded);metrics.encodedHashMs=performance.now()-h;
  const body={version:2,bodyRef:raw.bodyRef,rawHash:raw.rawHash,codec:'gzip',codecVersion:1,mediaType:raw.mediaType,decodedBytes:raw.bytes.length,encodedBytes:encoded.length,encodedHash,bytes:encoded},timing={},expanded=(await unpack(body,timing)).raw;
  metrics.decompressionMs=timing.decompressionMs;
  const v=performance.now();if(!samePhysicalBody(raw,expanded))fail('P4_ROUNDTRIP');metrics.verificationMs+=timing.verificationMs+performance.now()-v;
  const saving=physicalCost(raw)-physicalCost(body);metrics.compressedBytes=encoded.length;metrics.compressedCost=physicalCost(body);metrics.candidateSavedBytes=saving;
  if(saving<256||saving/physicalCost(raw)<0.2){metrics.reason='insufficient-net-benefit';return {body:raw,metrics};}
  metrics.selected='gzip';metrics.savedBytes=saving;metrics.reason='net-benefit';metrics.metadataBytes=physicalCost(body)-encoded.length;return {body,metrics};
}
export async function encodeOriginal(value){return (await compressBody(await encodeP2(value))).body;}
export const bodyCodec=Object.freeze({labOnly:true,formatVersion:2,encodeOriginal,decodeOriginal,samePhysicalBody,equivalent});
