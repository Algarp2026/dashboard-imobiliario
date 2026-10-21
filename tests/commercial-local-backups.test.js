'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../commercial.js'),'utf8'),end=source.lastIndexOf('})();'),KEY='theView.crmCommercial.v2';
let limit=Infinity,failKey='',failures=0,otherWrite=null;
const storage={getItem(key){return Object.hasOwn(this,key)?this[key]:null},setItem(key,value){
  const text=String(value),size=Object.keys(this).filter(k=>typeof this[k]==='string'&&k!==key).reduce((sum,k)=>sum+k.length+this[k].length,0)+key.length+text.length;
  if(size>limit||key===failKey&&failures++===0){if(otherWrite){this[KEY]=otherWrite;otherWrite=null}throw Object.assign(Error('Fictitious quota'),{name:'QuotaExceededError'})}
  this[key]=text;
},removeItem(key){delete this[key]}};
const context={console,Date,AbortController,window:{THE_VIEW_CONFIG:{GOOGLE_SHEETS_WEBAPP_URL:'https://fixture.invalid'},addEventListener(){}},document:{readyState:'loading',addEventListener(){},getElementById(){return null},querySelector(){return null}},localStorage:storage,requestAnimationFrame(){},setTimeout(){return 1},clearTimeout(){}};
vm.createContext(context);vm.runInContext(source.slice(0,end)+`renderSharedSyncStatus=()=>{};notifyUser=()=>{};globalThis.downloads=[];downloadJson=value=>downloads.push(value);globalThis.app={state,sharedSync,normalizeData,commitLocalCache,archiveRecoveryCopy,localRecoveryExport,exportLocalRecoveryCopy,save,localBackupKeys};`+source.slice(end),context);
const app=context.app,clone=value=>JSON.parse(JSON.stringify(value)),snapshot=()=>JSON.stringify(Object.fromEntries(Object.keys(storage).filter(k=>typeof storage[k]==='string').map(k=>[k,storage[k]])));
async function main(){
  const base=clone(app.normalizeData({clients:[{id:'fiction-client',notes:'Fictitious'}],events:[],agents:[],finalPrices:{16:400000},statuses:{8:'Reservado',24:'Reservado'},priceHistory:{16:[{price:400000}]}}));
  const meta={base,revision:'a'.repeat(64),lastConfirmedAt:'2026-10-21T12:00:00Z'};
  app.state.data=clone(base);Object.assign(app.sharedSync,meta,{phase:'synced',verified:true});
  app.commitLocalCache(base,meta);
  const original=JSON.stringify({action:'save',requestId:'fiction-original',baseRevision:meta.revision,data:base});
  storage.setItem(KEY+'.pendingWrite.v1',original);
  const before=snapshot(),next=clone(base);next.clients[0].notes='Fictitious newer data';next.events.push({id:'fiction-event',clientId:'fiction-client'});
  failKey=KEY+'.syncMeta.v1';failures=0;
  assert.throws(()=>app.commitLocalCache(next,{...meta,base:next},true),error=>error.code==='LOCAL_STORAGE_FAILED');
  assert.equal(snapshot(),before,'A metadata failure rolls the cache and marker back');
  assert.equal(storage.getItem(KEY+'.pendingWrite.v1'),original);
  const concurrent=JSON.stringify({...base,fictionConcurrent:true});otherWrite=concurrent;failures=0;
  assert.throws(()=>app.commitLocalCache(next,{...meta,base:next},true),error=>error.code==='LOCAL_STORAGE_FAILED');
  assert.equal(storage.getItem(KEY),concurrent,'Rollback must not overwrite a different concurrent cache value');
  storage.setItem(KEY,JSON.stringify(base));
  failKey='';
  limit=0;app.state.data=clone(next);app.save();assert.equal(app.sharedSync.verified,false);assert.equal(app.sharedSync.error,'LOCAL_STORAGE_FAILED');assert.notEqual(app.sharedSync.phase,'synced');
  app.exportLocalRecoveryCopy();assert.equal(context.downloads.length,1);
  assert.deepEqual(clone(context.downloads[0].data),next);assert.equal(context.downloads[0].pendingWrite.requestId,'fiction-original');
  assert.equal(storage.getItem(KEY+'.pendingWrite.v1'),original);assert.equal(storage.getItem(KEY),JSON.stringify(base));
  limit=Infinity;
  await app.archiveRecoveryCopy('conflict',{data:{fiction:0}});
  const count=app.localBackupKeys().length;await app.archiveRecoveryCopy('conflict',{data:{fiction:0}});assert.equal(app.localBackupKeys().length,count,'Exact duplicates do not grow fallback storage');
  for(let i=1;i<64;i++)await app.archiveRecoveryCopy('conflict',{data:{fiction:i}});
  const full=snapshot();await assert.rejects(app.archiveRecoveryCopy('conflict',{data:{fiction:64}}),error=>error.code==='LOCAL_BACKUP_CAPACITY');
  assert.equal(snapshot(),full,'Capacity rejection must not delete a protected copy');
  assert.equal(app.localBackupKeys().length,64);assert.equal(storage.getItem(KEY+'.pendingWrite.v1'),original);
  console.log(JSON.stringify({metadataRollback:true,concurrentCacheNotOverwritten:true,quotaNeverSynced:true,memoryExportWithoutStorage:true,originalRequestPreserved:true,boundedFallback:64,capacityNonDestructive:true,realNetwork:false}));
}
main().catch(error=>{console.error(error);process.exitCode=1});
