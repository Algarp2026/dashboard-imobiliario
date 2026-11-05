'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require.resolve('../../commercial.js'),'utf8');
const declarations=[...source.matchAll(/^(?:async )?function (\w+)\(/gm)];
function extract(name){
  const index=declarations.findIndex(match=>match[1]===name);
  assert.ok(index>=0&&index<declarations.length-1,'Missing current function '+name);
  return source.slice(declarations[index].index,declarations[index+1].index);
}
// Extract only these functions; never embed the application's historical import data.
const functions=['saveLocalOnly','localRecoveryExport','readSyncMeta','hasPendingLocalSync','validSharedData','syncComparable','reconcileSharedData'].map(extract).join('\n');
const script=`(()=>{const KEY='p1.fiction-only',LOCAL_SYNC_META_KEY=KEY+'.meta',LOCAL_SYNC_REQUEST_KEY=KEY+'.request',LOCAL_PENDING_SYNC_KEY=KEY+'.pending';let state={data:null},sharedSync={base:null,revision:'',lastConfirmedAt:''};
${functions}
globalThis.p1Current={init:(base,revision)=>{state.data=JSON.parse(JSON.stringify(base));sharedSync={base:JSON.parse(JSON.stringify(base)),revision,lastConfirmedAt:'2026-11-05T12:00:00Z'};localStorage.setItem(KEY,JSON.stringify(base));localStorage.setItem(LOCAL_SYNC_META_KEY,JSON.stringify(sharedSync))},edit:(index,value)=>state.data.clients[index].notes=value,save:saveLocalOnly,export:localRecoveryExport,merge:reconcileSharedData,cache:()=>JSON.parse(localStorage.getItem(KEY)),replaceShared:(base,revision)=>localStorage.setItem(LOCAL_SYNC_META_KEY,JSON.stringify({base,revision,lastConfirmedAt:'2026-11-05T12:00:00Z'}))};})();`;
function current(storage=new Map()){
  const context={localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}};
  vm.createContext(context);vm.runInContext(script,context);
  return context.p1Current;
}
module.exports={script,current,extract};
