'use strict';
// Pin the entire hotfix diff before the existing historical integrity chain runs.
const cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict'),path=require('node:path');
function restore(source){
  const current=source.replace(/\r\n/g,'\n');if(!current.includes("LOCAL_ACTIVE_WRITE_ID='active-write.v1'"))return current;
  const baseline=cp.execFileSync('git',['show','cc5da5d04a10b7b078dd116bc6852d9729af7d89:commercial.js'],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8',maxBuffer:4000000}).replace(/\r\n/g,'\n');
  let result=current;
  const presentation=s=>s.slice(s.indexOf('function generateClientPresentationPdf('),s.indexOf('\nfunction fractionPriceSummary('));
  const pdf=presentation(current),previousPdf=presentation(baseline);
  if(pdf!==previousPdf){
    assert.equal(crypto.createHash('sha256').update(pdf).digest('hex'),'78f8287cb68b7a841f440b349da3ba54ac17cfebd954c5fa3a7bcd2b560985a4','Exact reviewed PDF footer update');
    result=result.replace(pdf,previousPdf);
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
