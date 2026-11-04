'use strict';
// Injected only into the isolated fixture's sanitized commercial IIFE.
module.exports=(function(){
  window.__storageGrowthTest={
    archiveRecoveryCopy,localVaultCopies,rememberConfirmedRecoveryBase,backupLocalBeforeRemoteLoad,commitLocalCache,confirmCommercialRequestArchive,localRecoveryExport,sharedSync,state,normalizeData,save:()=>{save();clearTimeout(saveTimer)},sync:syncRemote,read:()=>loadRemoteData(),
    raw:()=>localVaultTransaction('readonly',(store,done)=>{const read=store.getAll();read.onsuccess=()=>done(read.result)}),
    dataRevision:value=>recoveryChecksum(syncComparable(value)),
    stats:()=>typeof localRecoveryDiagnostics==='function'?localRecoveryDiagnostics():null,
    maintain:()=>typeof maintainLocalRecoveryArchive==='function'?maintainLocalRecoveryArchive({force:true}):null,
    cancel:()=>{if(typeof localMaintenanceTimer!=='undefined'){clearTimeout(localMaintenanceTimer);localMaintenanceTimer=null}},
    resetMemory:()=>{sharedSync.confirmedRecoveryBases=new Map();if(typeof localReceiptProofs!=='undefined')localReceiptProofs.clear();if(typeof localInflationCache!=='undefined')localInflationCache.clear()},
    abortNextWrite:()=>{
      const original=localVaultTransaction;
      localVaultTransaction=(mode,action)=>{
        if(mode!=='readwrite')return original(mode,action);localVaultTransaction=original;
        return original(mode,(store,done,abort)=>{
          const proxy=new Proxy(store,{get(target,key){if(key==='put')return value=>{const request=target.put(value);target.transaction.abort();return request};const value=target[key];return typeof value==='function'?value.bind(target):value}});
          action(proxy,done,abort);
        });
      };
    }
  };
}).toString();
