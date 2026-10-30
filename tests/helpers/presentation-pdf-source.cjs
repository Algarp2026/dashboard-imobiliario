'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto'),path=require('node:path');
module.exports=function(){
 const root=path.resolve(__dirname,'../..'),normalize=s=>s.replace(/\r\n/g,'\n');
 // The approved PR22 includes the loading fix: all persistence bytes stay exact.
 const base=normalize(cp.execFileSync('git',['show','38f868c8:commercial.js'],{cwd:root,encoding:'utf8'}));
 let current=require('./d2-visual-source.cjs').restoreCommercial(normalize(fs.readFileSync(path.join(root,'commercial.js'),'utf8')));
 const hashes={openPresentationPriceModal:'cb2faa15923fbfdebbdf1297c1d292626d0dddfedc7290ea240f0acaf6e76786',generateClientPresentationPdf:'714e8ccb1fe404ea3c97b95204111df46c8d206df0d2b6ca908cecb30a0ec7f1'};
 const body=(s,name)=>{const start=s.indexOf('function '+name+'(');return s.slice(start,s.indexOf('\nfunction ',start+1))};
 for(const [name,hash]of Object.entries(hashes)){const changed=body(current,name);assert.equal(crypto.createHash('sha256').update(changed).digest('hex'),hash,'Reviewed PDF change: '+name);current=current.replace(changed,body(base,name))}
 assert.equal(current,base,'All commercial, sync, recovery and persistence code outside the two PDF functions stays exact');
};
