import {commercialHash,canonical,fail} from '../persistence-p2/codec.mjs';
import {compatible,EPOCH,same} from './contracts.mjs';

// Synthetic source only. Its private registry is evidence in this laboratory, not Google.
export async function createSimulator({data,sourceId='fiction-p3-source',apiEpoch=EPOCH,sourceEpoch=EPOCH}={}){
  if(!/^fiction-p3-[a-z0-9-]+$/.test(sourceId))fail('P3_LAB_SOURCE');
  let current=structuredClone(data),currentRevision=await commercialHash(data),fault=null,writes=0;
  const tickets=new Map(),commits=new Map(),pending=new Map();
  const copy=x=>structuredClone(x);
  async function hashes(request){return {requestHash:await commercialHash(request),payloadHash:await commercialHash(request.data)};}
  async function inspect(request){
    const h=await hashes(request),known=commits.get(request.requestId)||pending.get(request.requestId);
    if(known&&known.requestHash!==h.requestHash)fail('P3_REQUEST_ID_COLLISION');
    return known?copy(known):{status:'UNKNOWN',sourceId,laboratoryOnly:true};
  }
  async function preflight(request,epoch){
    if(!compatible(epoch,apiEpoch,sourceEpoch))fail('P3_WRITER_INCOMPATIBLE');
    const found=await inspect(request);if(found.status==='COMMITTED')return {receipt:found};
    if(found.status==='PENDING')fail('P3_SOURCE_PENDING');
    if(request.baseRevision!==currentRevision)fail('P3_REMOTE_CONFLICT');
    const ticket=crypto.randomUUID();tickets.set(ticket,{request:canonical(request),revision:currentRevision,epoch,expires:Date.now()+30000});
    return {ticket,sourceId,revision:currentRevision,apiEpoch,sourceEpoch,laboratoryOnly:true};
  }
  async function write(request,ticket,epoch){
    // Source fence is independent of API preflight. An old API cannot bypass it.
    if(sourceEpoch!==EPOCH||epoch!==EPOCH)fail('P3_SOURCE_FENCE');
    const found=await inspect(request);if(found.status==='COMMITTED')return found;
    const proof=tickets.get(ticket);tickets.delete(ticket);
    if(!proof||proof.expires<Date.now()||proof.epoch!==epoch||proof.revision!==currentRevision||proof.request!==canonical(request))fail('P3_TICKET');
    if(request.baseRevision!==currentRevision)fail('P3_REMOTE_CONFLICT');
    const h=await hashes(request),mode=fault;fault=null;
    if(mode==='before-send')fail('P3_SIMULATED_NETWORK');
    pending.set(request.requestId,{status:'PENDING',...h,sourceId,laboratoryOnly:true});
    if(mode==='after-prepare')fail('P3_SIMULATED_NETWORK');
    current=copy(request.data);currentRevision=h.payloadHash;writes++;
    const receipt={version:1,status:'COMMITTED',requestId:request.requestId,baseRevision:request.baseRevision,resultRevision:currentRevision,...h,commitRef:'fiction-commit-'+writes,confirmedAt:new Date().toISOString(),sourceId,laboratoryOnly:true};
    commits.set(request.requestId,receipt);pending.delete(request.requestId);
    if(mode==='after-commit')fail('P3_SIMULATED_NETWORK');
    return copy(receipt);
  }
  async function verifyReceipt(receipt,request){
    const found=commits.get(request.requestId),h=await hashes(request);
    if(!found||!same(found,receipt)||found.requestHash!==h.requestHash||found.payloadHash!==h.payloadHash||found.baseRevision!==request.baseRevision)fail('P3_UNANCHORED_RECEIPT');
    return copy(found);
  }
  return Object.freeze({labOnly:true,sourceId,preflight,write,inspect,verifyReceipt,setFault:mode=>{fault=mode;},read:()=>({data:copy(current),revision:currentRevision,writes,sourceId,laboratoryOnly:true,apiEpoch,sourceEpoch})});
}
