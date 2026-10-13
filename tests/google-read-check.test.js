const assert=require('node:assert/strict');
const check=require('../scripts/check-google-read.js');
const original={...process.env};
async function main(){
  delete process.env.CRM_GOOGLE_READ_CHECK;let calls=0;
  await assert.rejects(check(async()=>{calls++}),error=>error.code==='READ_CHECK_NOT_AUTHORIZED');assert.equal(calls,0);
  process.env.CRM_GOOGLE_READ_CHECK='true';process.env.VERCEL_ENV='production';
  await assert.rejects(check(async()=>{calls++}),error=>error.code==='TEST_ENVIRONMENT_REQUIRED');assert.equal(calls,0);
  process.env.VERCEL_ENV='development';process.env.CRM_GOOGLE_SPREADSHEET_ID='test-sheet';process.env.CRM_GOOGLE_WRITES_ENABLED='true';
  const result={sourceId:'test-sheet',environment:'test',protocol:'tv-cas-v1',revision:'a'.repeat(64),confirmedAt:'2026-10-13T12:00:00.000Z',canWrite:false,data:require('./fixtures/google-test-store.json')};
  const output=await check(async fn=>{calls++;assert.equal(fn,'crmRead');assert.equal(process.env.CRM_GOOGLE_WRITES_ENABLED,'false');assert.equal(process.env.CRM_GOOGLE_TEST_WRITES_ENABLED,'false');return result});
  assert.equal(output.clients,2);assert.equal(output.events,1);assert.equal(output.writeEnabled,false);assert.equal(output.data,undefined);assert.equal(process.env.CRM_GOOGLE_WRITES_ENABLED,'true');assert.ok(!JSON.stringify(output).includes('example.test'));
  assert.equal(output.serializedCharacters,require('../server/commercial-store.js').serializedStore(result.data).length);assert.equal(output.withinPreventiveCellBudget,true);
  await assert.rejects(check(async()=>({...result,canWrite:true})),error=>error.code==='READ_ONLY_SOURCE_REQUIRED');
  await assert.rejects(check(async()=>({...result,environment:'production'})),error=>error.code==='INVALID_SOURCE_RESPONSE');
  console.log('Google read-check tests passed: explicit opt-in, production refusal, forced read-only transport, source write gate and no personal data in output; no real Google calls');
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>{for(const key of Object.keys(process.env))if(!(key in original))delete process.env[key];Object.assign(process.env,original)});
