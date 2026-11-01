'use strict';
const path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),normalize=s=>s.replace(/\r\n/g,'\n');
const ranges=[
 ['fraction-results','function refreshClientFractionResults(','function refreshClientPreparedConditions(','e94cd6dbcbc0a1f2e64ae8751ab3947a24c64fb6ffd757256666796c99da8010'],
 ['bind','function bind(){','function ensureCrmFormFields(){','1c43e028066c012b3a60873669fb2bbc8730e2e7aeb62a85bc725f6e54d35010'],
 ['draft','function createCommercialDraftGuard(','function renderCommercialRemoteUpdate(','9df2e85644e26856a86aa6690329196640cac785b3bb8c2b9acf6dd11b3ad29c']
];
const baseline=file=>normalize(cp.execFileSync('git',['show','869397c:'+file],{cwd:root,encoding:'utf8'}));
function restore(source){let result=normalize(source),base=baseline('commercial.js');for(const[name,start,end,hash]of ranges){const section=text=>{const a=text.indexOf(start),b=text.indexOf(end,a+start.length);assert.ok(a>=0&&b>a);return text.slice(a,b)};const current=section(result);assert.equal(crypto.createHash('sha256').update(current).digest('hex'),hash,'Reviewed consultation/draft-only section: '+name);result=result.replace(current,section(base))}assert.equal(result,base,'All archive, data, PDF, CAS, tickets, transport and sync code outside reviewed consultation changes remains exact');return result}
function restorePreview(source){assert.equal(crypto.createHash('sha256').update(normalize(source)).digest('hex'),'0ec5163b22c8d8e2bb6aa60e9fffbe0d715fc53570c36c078277e236bab7ea29','Only the reviewed isolated consultation/fraction fixture additions');return baseline('tests/helpers/client-phase2a-preview.cjs')}
module.exports={restore,restorePreview};
