'use strict';
const p5=require('./persistence-p5-lab.cjs'),fixture=require('./persistence-p2-fixture.cjs'),makeStore=require('./apps-script-store.js');
async function setup({primary,secondary,operational=false}={}){
 const c=await p5.load('experimental/persistence-p6/contracts.mjs'),snap=await p5.load('experimental/persistence-p6/snapshot.mjs'),mirror=await p5.load('experimental/persistence-p6/mirrors.mjs'),copier=await p5.load('experimental/persistence-p6/copy.mjs'),vm=await p5.load('experimental/persistence-p6/projector-node.mjs'),{memoryBackend}=await p5.load('experimental/persistence-p5/backend.mjs');
 primary ||= {...memoryBackend(),failureDomain:'fiction-primary'};secondary ||= {...memoryBackend(),failureDomain:'fiction-independent'};
 const l=await p5.setup({backend:primary}),credential=l.sessions.grant({sourceId:l.source.sourceId,apiEpoch:2,scopes:['read','lookup','write','mirror-read','repair','pending-maintenance','copy-read','copy-write']});
 const options={backend:primary,sourceId:l.source.sourceId,origin:'http://127.0.0.1:53800',synthetic:true,authorize:l.sessions.resolve,project:vm.project};
 const mirrors=await mirror.openMirrors(options),vault=await copier.openCopyVault({...options,backend:secondary,primaryDomain:primary.failureDomain,captureOfficial:()=>snap.capture(primary,l.source.sourceId)});
 async function mutate(fn){const s=await primary.load(),g=s.generation;await fn(s);s.generation++;await primary.compareExchange(g,s);}
 async function seed({candidate=false,names=c.NAMES}={}){const {snapshot}=await snap.capture(primary,l.source.sourceId),p=vm.project(candidate?snapshot.candidate.data:snapshot.data);await mutate(async s=>{s.Derived ||= {version:1,tables:{},claims:{},journal:[]};for(const n of names){s.Derived.tables[n]=p.tables[n];s.Derived.claims[n]=await mirror.mirrorEvidence(snapshot,p,n,{candidate});}});}
 return {...l,c,snap,mirror,vm,primary,secondary,credential,mirrors,vault,options,mutate,seed};
}
async function operationalFixture(){
 const data=fixture.base();let stop=false;const real=makeStore(data,{onStep:name=>{if(stop&&name==='before:clear:Eventos')throw Error('Synthetic interrupted mirror sequence');}}),first=structuredClone(data);first.clients[0].notes='Synthetic official R0';real.write({requestId:'fiction-operational-r0',baseRevision:real.revision,data:first});const next=structuredClone(first);next.clients[0].notes='Synthetic candidate R1';next.events.push({id:'fiction-unconfirmed-event',clientId:'fiction-a',type:'Outro',fractions:[]});stop=true;try{real.write({requestId:'fiction-operational-r1',baseRevision:real.revision,data:next});}catch{}
 const l=await setup(),rows=(name,width)=>{const s=real.sheets.get(name);return s?Array.from({length:s.getLastRow()},(_,i)=>Array.from({length:width},(_,j)=>s.cells.get((i+1)+':'+(j+1))??'')):[];},store=real.sheets.get('Store');
 await l.mutate(s=>{s.Store=Object.fromEntries(['B2','B3','B4','B5','B6'].map((k,i)=>[k,store.cells.get((i+2)+':2')||'']));s.StoreVersions=rows('StoreVersions',3);s.BackupsVersions=rows('BackupsVersions',4);s.Manifests={};s.Derived={version:1,tables:l.vm.grids(real),claims:{},journal:[]};});
 const {snapshot}=await l.snap.capture(l.primary,l.source.sourceId),p=l.vm.project(next);await l.mutate(async s=>{s.Derived.claims.Clientes=await l.mirror.mirrorEvidence(snapshot,p,'Clientes',{candidate:true});});return {...l,real,first,next};
}
module.exports={setup,operationalFixture,load:p5.load,fileBackend:p5.fileBackend};
