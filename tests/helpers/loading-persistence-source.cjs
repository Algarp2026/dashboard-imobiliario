'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto'),path=require('node:path');
module.exports=function assertLoadingPersistenceSource(){
 const cwd=path.resolve(__dirname,'../..'),read=s=>s.replace(/\r\n/g,'\n');
 // The approved main includes PR23: every PDF byte must remain unchanged.
 const base=read(cp.execFileSync('git',['show','544de8fd:commercial.js'],{cwd,encoding:'utf8'}));
 const current=read(fs.readFileSync(path.join(cwd,'commercial.js'),'utf8'));
 const section=s=>s.slice(s.indexOf('async function applyRemoteData('),s.indexOf('let saveTimer=null;'));
 assert.equal(crypto.createHash('sha256').update(section(current)).digest('hex'),'5577a767d0b0c8db033cfe52537fe50c1123ee6db39d6317c803cf73e3850654','Only the reviewed loading fix may change the read path');
 assert.equal(current.replace(section(current),section(base))
  .replace("commercialUxToast('Preço registado no dispositivo. Confirme a sincronização na base partilhada.');","commercialUxToast('Alteração de preço guardada.');")
  .replace("commercialUxToast('Dados do agente registados no dispositivo. Confirme a sincronização na base partilhada.');","commercialUxToast(idx>=0?'Agente atualizado.':'Agente guardado.');"),base,'All CAS, recovery, vault, reconciliation and commercial code outside the reviewed read/UI changes stays exact');
};
