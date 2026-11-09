'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),before='063684cea8472cdf3048bf8b63e36c68a0e4aa9d';
const reviewed={
 'commercial-opportunities.js':'f766a81bbd616aff87a7698296eeafc95bf3cd459743fdbe40e5ccfe47d0dde9',
 'commercial-client-workflow.js':'22d51e5db4880eb0dc4dfdc075ae4be66e6384ae7487cde3495267cec21d2081',
 'server/commercial-integrity.js':'913f1aee2b0b0e309607f6e918bf128c4d488d70747beaf0599bda8e250212e1'
};
const bundles=['commercial-integrity.js','google_commercial_integrity.gs'];
const allowed=[...Object.keys(reviewed),...bundles];
const diff=(ref,scope,end=[])=>cp.execFileSync('git',['diff',ref,...end,'--',...scope],{cwd:root,encoding:'utf8'});
let verified=false;
function protectedDiff(ref,file){
 const scoped=allowed.filter(name=>name===file||name.startsWith(file+'/'));
 if(!scoped.length)return diff(ref,[file]);
 if(!verified){
   for(const [name,hash] of Object.entries(reviewed)){
     const source=fs.readFileSync(path.join(root,name),'utf8').replace(/\r\n/g,'\n');
     assert.equal(crypto.createHash('sha256').update(source).digest('hex'),hash,'Exact reviewed P7 code: '+name);
   }
   assert.equal(diff(before,['scripts/build-commercial-integrity.js']),'');
   cp.execFileSync(process.execPath,['scripts/build-commercial-integrity.js','--check'],{cwd:root});
   verified=true;
 }
 // The excluded current changes must have started at the exact historical baseline.
 assert.equal(diff(ref,scoped,[before]),'','P7 predecessor differs from protected revision');
 return diff(ref,[file,...scoped.map(name=>':(exclude)'+name)]);
}
const restoreLegacyEditor=source=>source.replace('  const historyError=window.THE_VIEW_CLIENT_WORKFLOW?.legacyPresentationCorrectionError?.(oldEv,newEv,state.data.events);if(historyError)throw Error(historyError);\n','');
module.exports={protectedDiff,restoreLegacyEditor};
