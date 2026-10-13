"use strict";
const store=require('../server/commercial-store.js');

async function checkGoogleRead(call=store.callStore){
  if(process.env.CRM_GOOGLE_READ_CHECK!=='true')throw store.failure('READ_CHECK_NOT_AUTHORIZED',403);
  if(process.env.VERCEL_ENV==='production')throw store.failure('TEST_ENVIRONMENT_REQUIRED',403);
  const previous={VERCEL_ENV:process.env.VERCEL_ENV,CRM_GOOGLE_WRITES_ENABLED:process.env.CRM_GOOGLE_WRITES_ENABLED,CRM_GOOGLE_TEST_WRITES_ENABLED:process.env.CRM_GOOGLE_TEST_WRITES_ENABLED};
  try{
    process.env.VERCEL_ENV='preview';process.env.CRM_GOOGLE_WRITES_ENABLED='false';process.env.CRM_GOOGLE_TEST_WRITES_ENABLED='false';
    const result=await call('crmRead');
    if(result.environment!=='test'||result.sourceId!==process.env.CRM_GOOGLE_SPREADSHEET_ID||result.protocol!=='tv-cas-v1'||!store.REVISION.test(result.revision)||!store.validStore(result.data)||!Number.isFinite(Date.parse(result.confirmedAt)))throw store.failure('INVALID_SOURCE_RESPONSE');
    if(result.canWrite!==false)throw store.failure('READ_ONLY_SOURCE_REQUIRED',403);
    const serializedCharacters=store.serializedStore(result.data).length;
    return {ok:true,environment:'test',writeEnabled:false,sourceWriteEnabled:false,revision:result.revision,confirmedAt:result.confirmedAt,serializedCharacters,withinPreventiveCellBudget:serializedCharacters<=50000,clients:(result.data.clients||[]).length,events:(result.data.events||[]).length,agents:(result.data.agents||[]).length};
  }finally{for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value}}
}
if(require.main===module)checkGoogleRead().then(result=>console.log(JSON.stringify(result))).catch(error=>{
  const safeCodes=new Set(['READ_CHECK_NOT_AUTHORIZED','TEST_ENVIRONMENT_REQUIRED','READ_ONLY_SOURCE_REQUIRED','SOURCE_NOT_CONFIGURED','SOURCE_AUTHENTICATION_FAILED','SOURCE_ENVIRONMENT_MISMATCH','SOURCE_TIMEOUT','SOURCE_UNAVAILABLE','SOURCE_OPERATION_FAILED','INVALID_SOURCE_RESPONSE','WRITE_INCOMPLETE','UNINITIALIZED']);
  console.error(JSON.stringify({ok:false,code:safeCodes.has(error.code)?error.code:'READ_CHECK_FAILED'}));process.exitCode=1;
});
module.exports=checkGoogleRead;
