export async function recoveryReport({mirrors,vault},credential,copyId){
 const source=await mirrors.diagnose(credential),saved=await vault.read(credential,copyId),healthy=['CONSISTENT','DIVERGENT'].includes(source.status),available=saved.status==='RECOVERABLE_COPY';let decision;
 if(healthy&&available)decision=source.snapshotHash===saved.record.authorityHash?(source.status==='DIVERGENT'?'DERIVED_REPAIR_POTENTIALLY_AUTHORIZABLE':'SOURCE_AND_COPY_MATCH'):'DIVERGENCE_REQUIRES_INVESTIGATION';
 else if(healthy)decision='VERIFIED_INDEPENDENT_COPY_NEEDED';
 else if(available)decision=source.reason==='READ_FAILURE'?'SOURCE_UNAVAILABLE_COPY_NOT_KNOWN_LATEST':'ADMINISTRATIVE_RECOVERY_PROPOSAL_ONLY';
 else decision='INSUFFICIENT_EVIDENCE';
 return {version:1,decision,sourceStatus:source.status,copyStatus:saved.status,pending:source.pending||'UNKNOWN',automaticRecovery:false,mayChangeAuthority:false,commercialConfirmed:false,copyKnownLatest:false,actions:['Preserve evidence and original operations','No B6 rewrite','Separate authorization required for official recovery']};
}
