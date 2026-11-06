import {canonical,commercialHash,legacyTextHash,fail} from '../persistence-p2/codec.mjs';
import {dataIssues} from '../persistence-p2/reader.mjs';
export {canonical,commercialHash,legacyTextHash,fail};
export const EPOCH=2,FORMAT=3,MAX_CHARACTERS=900000,CHUNK=24000;
export const hash=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export const requestId=v=>typeof v==='string'&&/^[a-zA-Z0-9._:-]{1,160}$/.test(v);
export const copy=v=>structuredClone(v);
export function exact(v,keys){return v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join('|')===keys.split(' ').sort().join('|');}
export async function seal(v){const c={...v};delete c.integrity;return {...c,integrity:await commercialHash(c)};}
export async function check(v,keys){if(!exact(v,keys+' integrity')||!hash(v.integrity)||(await seal(v)).integrity!==v.integrity)fail('P5_INTEGRITY');return v;}
export const MANIFEST='format kind operationId requestId requestHash payloadHash baseRevision resultRevision sourceId domainId previousRef version requestVersion height createdAt completeHistory';
export const ANCHOR='format sourceId domainId manifestRef resultRevision legacyChecksum';
export function validateData(data){if(dataIssues(data).length||!['clients','events','agents'].every(k=>Array.isArray(data[k])))fail('P5_DATA');}
export async function identity(request,sourceId){
 if(!exact(request,'action requestId baseRevision data')||request.action!=='save'||!requestId(request.requestId)||!hash(request.baseRevision)||canonical(request).length>MAX_CHARACTERS)fail('P5_REQUEST');
 validateData(request.data);const payloadHash=await commercialHash(request.data),requestHash=await commercialHash(request);
 return {requestId:request.requestId,requestHash,payloadHash,baseRevision:request.baseRevision,sourceId};
}
export function queryShape(q){if(!exact(q,'requestId requestHash payloadHash baseRevision sourceId')||!requestId(q.requestId)||!hash(q.requestHash)||!hash(q.payloadHash)||!hash(q.baseRevision))fail('P5_QUERY');}
export function matches(a,b){return ['requestId','requestHash','payloadHash','baseRevision','sourceId'].every(k=>a[k]===b[k]);}
export function laboratory(origin,synthetic){const u=new URL(origin);if(!synthetic||u.origin!==origin||u.protocol!=='http:'||u.hostname!=='127.0.0.1'||!/^53\d{3}$/.test(u.port)||typeof location!=='undefined'&&location.origin!==origin)fail('P5_LAB_ONLY');}
