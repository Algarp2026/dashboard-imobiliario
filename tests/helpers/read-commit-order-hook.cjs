'use strict';
// Fault injection for the isolated fixture only. No application asset loads this file.
module.exports=(function(){
 let gate=null,held=false,read=null,confirmedRevision='';const original=latestLocalCheckpoint;
 latestLocalCheckpoint=function(...args){
  const result=original.apply(this,args);if(!gate||held||sharedSync.busy)return result;
  const current=gate;gate=null;
  return result.then(async checkpoint=>{held=true;await current.promise;held=false;return checkpoint});
 };
 window.__readCommitOrderTest={
  begin:()=>{
   if(gate||held||read)return true;
   if(commercialLoadInFlight||commercialReadInFlight||sharedSync.busy)return false;
   let release;const promise=new Promise(resolve=>release=resolve);gate={promise,release};window.__readCommitOrderTest.releaseGate=release;
   read=loadRemoteData({automatic:true});return true;
  },
  held:()=>held,
  release:async()=>{window.__readCommitOrderTest.releaseGate();try{return await read}finally{read=null}},
  write:async value=>{state.data.clients[0].notes=value;save();clearTimeout(saveTimer);const saved=await syncRemote();if(saved)confirmedRevision=sharedSync.revision;return saved},
  inspect:()=>{
   const cached=JSON.parse(localStorage.getItem(KEY)),meta=readSyncMeta();
   return{phase:sharedSync.phase,busy:sharedSync.busy,dirty:sharedSync.dirty,verified:sharedSync.verified,error:sharedSync.error,pending:localStorage.getItem(LOCAL_SYNC_REQUEST_KEY)!==null,marker:hasPendingLocalSync(),revision:sharedSync.revision,revisionPreserved:!confirmedRevision||sharedSync.revision===confirmedRevision,metadataRevisionMatches:meta?.revision===sharedSync.revision,cacheMatchesState:syncComparable(cached)===syncComparable(state.data),cacheMatchesBase:syncComparable(cached)===syncComparable(sharedSync.base),metadataBaseMatches:syncComparable(meta?.base)===syncComparable(sharedSync.base)};
  }
 };
}).toString();
