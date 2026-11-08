'use strict';
// Diagnostic of a known blocker, not an acceptance test that blesses the result.
const assert=require('node:assert/strict');
const {createHmac}=require('node:crypto');
const api=require('../api/commercial-data.js');
const workflow=require('../commercial-client-workflow.js');
const ops=require('../commercial-opportunities.js');
const integrity=require('../server/commercial-integrity.js');
const makeStore=require('./helpers/apps-script-store.js');

const client={id:'p7-fictitious',name:'Cliente fictício',presentationSelection:[]};
const base={clients:[client],events:[],agents:[],statuses:{24:'Disponível'},finalPrices:{24:500000},
  priceHistory:{},salePrices:{},saleCommissions:{},statusEventIds:{},salePriceEventIds:{},unavailableReasons:{}};
const present=(id,date,corrects)=>ops.build({
  id,date,clientId:client.id,action:'present',fractions:[24],corrects,
  rows:[{fraction:24,informedPrice:490000,officialPrice:500000}]
},base);
const original=present('presentation-1','2026-10-01');
base.events.push(original,{id:'withdrawal',type:'Desistência',clientId:client.id,date:'2026-10-03',fractions:[],globalWithdrawal:true,scope:'global'});
const projected=data=>{
  const {stage,relations:[relation]}=workflow.clientProjection(data,client);
  return {stage,relation:relation.commercialState,active:relation.active,
    lastContact:workflow.contactInfo(client,data.events,'2026-10-07').lastContact};
};
const before=projected(base),store=makeStore(base);
assert.equal(before.stage,'Desistiu');
assert.equal(before.active,false);
assert.throws(()=>present('actual-new-presentation','2026-10-04'),error=>error.code==='REQUALIFICATION_REQUIRED');
const correction=present('correction-1','2026-10-04',original.id);
const next={...base,events:[...base.events,correction]};
assert.doesNotThrow(()=>integrity.validate(base,next),'The Node validation kernel accepts the same correction');

async function run(){
  const originalFetch=global.fetch;
  Object.assign(process.env,{
    VERCEL_ENV:'preview',COMMERCIAL_ACCESS_SECRET:'p7-fictitious-session',
    CRM_GOOGLE_DEPLOYMENT_ID:'test-deployment',CRM_GOOGLE_SPREADSHEET_ID:'test-sheet',
    CRM_GOOGLE_CLIENT_ID:'test-client',CRM_GOOGLE_CLIENT_SECRET:'test-secret',CRM_GOOGLE_REFRESH_TOKEN:'test-refresh',
    CRM_GOOGLE_WRITES_ENABLED:'true',CRM_GOOGLE_TEST_WRITES_ENABLED:'true'
  });
  global.fetch=async(url,options)=>{
    if(url==='https://oauth2.googleapis.com/token')return Response.json({access_token:'fictitious-token'});
    assert.equal(url,'https://script.googleapis.com/v1/scripts/test-deployment:run','No external request allowed');
    const call=JSON.parse(options.body);
    assert.ok(['crmRead','crmWrite'].includes(call.function));
    return Response.json({done:true,response:{result:store.context[call.function](...call.parameters)}});
  };
  const issued=String(Date.now()-1000),signature=createHmac('sha256',process.env.COMMERCIAL_ACCESS_SECRET).update(issued).digest('hex');
  const invoke=async(method,body,ticket='')=>{
    const response={statusCode:200,setHeader(){},status(code){this.statusCode=code;return this},json(value){this.body=value;return this}};
    await api({method,body,headers:{host:'example.test',origin:'https://example.test','content-type':'application/json',
      cookie:'tv_commercial_access='+issued+'.'+signature,'x-crm-read-ticket':ticket}},response);
    return response;
  };
  try{
    const loaded=await invoke('GET');
    assert.equal(loaded.statusCode,200);
    const requestId='p7-cross-cycle-synthetic';
    const result=await invoke('POST',{action:'save',requestId,baseRevision:loaded.body.revision,data:next},loaded.body.readTicket);
    const after=projected(store.data);
    assert.deepEqual(store.data.events[0],original);
    assert.deepEqual(store.data.statuses,base.statuses);
    assert.equal(result.statusCode,200,'The isolated API and source currently accept the correction');
    assert.equal(result.body.persisted,true);
    assert.equal(result.body.requestId,requestId);
    assert.equal(after.stage,'Apresentado','The unsafe reactivation is still reproducible');
    assert.equal(after.active,true);
    console.log(JSON.stringify({status:'defect-reproduced-not-fixed',before,after,httpStatus:result.statusCode,sourceAccepted:result.body.persisted,realGoogle:false},null,2));
  }finally{global.fetch=originalFetch}
}
run().catch(error=>{console.error(error);process.exitCode=1});
