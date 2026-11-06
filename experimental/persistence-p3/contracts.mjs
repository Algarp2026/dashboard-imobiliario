import {canonical,commercialHash,fail} from '../persistence-p2/codec.mjs';

export const EPOCH=2;
export const PHASES=['UI_DIRTY','LOCAL_DURABLE','SENDING','REMOTE_UNKNOWN','REMOTE_COMMITTED','LOCAL_ACK_PENDING','SYNCED','CONFLICT','STORAGE_BLOCKED'];
export const same=(a,b)=>canonical(a)===canonical(b);
export const id=v=>typeof v==='string'&&/^[a-zA-Z0-9._:-]{1,160}$/.test(v);
export const revision=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export function lab(origin,name,synthetic){
  let u;try{u=new URL(origin);}catch{fail('P3_LAB_ONLY');}
  if(!synthetic||u.origin!==origin||u.hostname!=='127.0.0.1'||u.protocol!=='http:'||!/^53\d{3}$/.test(u.port)||typeof location!=='undefined'&&location.origin!==origin||!/^the-view-p3-lab\.[a-z0-9.-]{1,64}$/.test(name))fail('P3_LAB_ONLY');
}
export function compatible(frontend,api,source){return frontend===EPOCH&&api===EPOCH&&source===EPOCH;}
export async function seal(row){const clean={...row};delete clean.recordHash;return {...clean,recordHash:await commercialHash(clean)};}
export async function check(row){if(!row||row.version!==1||(await seal(row)).recordHash!==row.recordHash)fail('P3_RECORD_INTEGRITY');return row;}
export function edge(from,to){
  const edges={UI_DIRTY:['LOCAL_DURABLE','CONFLICT','STORAGE_BLOCKED'],STORAGE_BLOCKED:['LOCAL_DURABLE','CONFLICT'],LOCAL_DURABLE:['SENDING','CONFLICT'],SENDING:['REMOTE_UNKNOWN','REMOTE_COMMITTED','CONFLICT'],REMOTE_UNKNOWN:['SENDING','REMOTE_COMMITTED','CONFLICT'],REMOTE_COMMITTED:['SYNCED','LOCAL_ACK_PENDING'],LOCAL_ACK_PENDING:['SYNCED']};
  if(!edges[from]?.includes(to))fail('P3_TRANSITION');
}
