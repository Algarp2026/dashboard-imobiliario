import {identity,fail} from './contracts.mjs';
// No HTTP handler is registered. The credential and selected source stay in the server-side closure.
export function createRemote(source,credential,{apiEpoch=2,lookupCapability=true}={}){
 if(!source?.labOnly)fail('P5_LAB_ONLY');
 return Object.freeze({labOnly:true,sourceId:source.sourceId,
  read:()=>source.read(credential),
  inspect:async request=>{if(!lookupCapability)return {status:'UNKNOWN',sourceId:source.sourceId,laboratoryOnly:true};const result=await source.lookup(credential,await identity(request,source.sourceId));return result.status==='COMMITTED'?result.receipt:result;},
  preflight:(request,epoch)=>{if(apiEpoch!==2||!lookupCapability)fail('P5_API_CAPABILITY');return source.preflight(credential,request,epoch);},
  write:(request,ticket,epoch)=>source.write(credential,request,ticket,epoch),
  verifyReceipt:(r,request)=>source.verifyReceipt(credential,r,request)
 });
}
