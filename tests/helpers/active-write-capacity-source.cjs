'use strict';
// Pin the entire hotfix diff before the existing historical integrity chain runs.
const cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict'),path=require('node:path');
function restore(source){
  const current=require('./p7-cycle-source.cjs').restoreLegacyEditor(source.replace(/\r\n/g,'\n'));if(!current.includes("LOCAL_ACTIVE_WRITE_ID='active-write.v1'"))return current;
  const baseline=cp.execFileSync('git',['show','cc5da5d04a10b7b078dd116bc6852d9729af7d89:commercial.js'],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8',maxBuffer:4000000}).replace(/\r\n/g,'\n');
  const p7="function isCountedCommercialPresentation(ev){return isCommercialPresentationEvent(ev)&&!(ev.opportunityVersion===1&&ev.opportunityAction==='present'&&ev.corrects)}\n";
  let result=current;
  // Normalize only the exact P7 predicate and the two read-only count calls.
  if(current.includes(p7)){
    assert.equal(current.split('.filter(isCountedCommercialPresentation)').length-1,2);
    result=current.replace(p7,'').replaceAll('.filter(isCountedCommercialPresentation)','.filter(isCommercialPresentationEvent)');
  }
  for(const [start,end,hash]of [
    ['async function confirmCommercialRequestArchive(','function hasBusinessData(','ae510565c8b1cd8651b66ab04ad142b104b932f3c8389ba44907363b08f6c7b2'],
    ['const LOCAL_BACKUP_LIMIT=','async function migrateLegacyLocalBackups(','d29aff07da2eb123b39127ee76efdfe34cb967e37df331ffef02e941d1caf3be']
  ]){
    const section=text=>{const a=text.indexOf(start),b=text.indexOf(end,a);assert.ok(a>=0&&b>a);return text.slice(a,b);};
    const body=section(result);assert.equal(crypto.createHash('sha256').update(body).digest('hex'),hash,'Exact reviewed active-write capacity range');result=result.replace(body,section(baseline));
  }
  assert.equal(result,baseline,'No change outside acknowledgement capacity and the local vault; CAS, transport, read/export and business code remain exact');return result;
}
module.exports={restore};
