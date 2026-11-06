'use strict';
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),makeStore=require('./apps-script-store.js'),fixture=require('./persistence-p2-fixture.cjs');
const load=p=>import(pathToFileURL(path.resolve(p)));
function fileBackend(directory){const file=path.join(directory,'fiction-source.json');return {labOnly:true,load:async()=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null,compareExchange:async(g,next)=>{const old=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;if((old?.generation??null)!==g)throw Object.assign(Error('P5_STORAGE_CAS'),{code:'P5_STORAGE_CAS'});const temporary=file+'.next';fs.writeFileSync(temporary,JSON.stringify(next));fs.renameSync(temporary,file);}};}
async function setup({data=fixture.base(),backend,sourceEpoch=2,legacyHistory=false,sourceId='fiction-p3-p5-test'}={}){
 const c=await load('experimental/persistence-p5/contracts.mjs'),m=await load('experimental/persistence-p5/source.mjs'),b=await load('experimental/persistence-p5/backend.mjs');
 backend ||= b.memoryBackend();const sessions=m.labSessions(),credential=sessions.grant({sourceId,apiEpoch:2,scopes:['read','lookup','write']}),vmStore=makeStore(data);
 const options={backend,sourceId,origin:'http://127.0.0.1:53700',synthetic:true,data,authorize:sessions.resolve,validateTransition:(old,next)=>vmStore.context.validateCommercialTransition_(old,next),sourceEpoch,legacyHistory};
 const source=await m.createSource(options),request=async(id,change='Synthetic '+id)=>{const current=await source.read(credential),next=structuredClone(current.data);next.clients[0].notes=change;return {action:'save',requestId:'fiction-'+id,baseRevision:current.revision,data:next};};
 const send=async r=>{const p=await source.preflight(credential,r,2);return p.receipt||source.write(credential,r,p.ticket,2);};
 return {c,source,credential,backend,sessions,options,request,send,query:r=>c.identity(r,sourceId),restart:()=>m.createSource(options),vmStore};
}
module.exports={setup,fileBackend,load};
