'use strict';
const assert=require('node:assert/strict');
const {createHmac}=require('node:crypto');
const fs=require('node:fs'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const api=require('../api/commercial-data.js');
const workflow=require('../commercial-client-workflow.js');
const ops=require('../commercial-opportunities.js');
const integrity=require('../server/commercial-integrity.js');
const makeStore=require('./helpers/apps-script-store.js');

const client={id:'p7-fictitious',name:'Cliente fictício',presentationSelection:[]};
const base={clients:[client],events:[],agents:[],statuses:{24:'Disponível',26:'Disponível'},finalPrices:{24:500000,26:600000},
  priceHistory:{},salePrices:{},saleCommissions:{},statusEventIds:{},salePriceEventIds:{},unavailableReasons:{}};
const present=(id,date,corrects,data=base,n=24,informedPrice=490000)=>ops.build({
  id,date,clientId:client.id,action:'present',fractions:[n],corrects,recordedAt:corrects?'2026-10-07T12:00:00Z':date+'T12:00:00Z',
  notes:corrects?'Observação histórica fictícia':'',rows:[{fraction:n,informedPrice,officialPrice:data.finalPrices[n]}]
},data);
const original=present('presentation-1','2026-10-01');
const withdrawal={id:'withdrawal',type:'Desistência',clientId:client.id,date:'2026-10-03',fractions:[],globalWithdrawal:true,scope:'global'};
base.events.push(original,withdrawal);
const projected=data=>{
  const {stage,relations:[relation]}=workflow.clientProjection(data,client);
  return {stage,relation:relation.commercialState,active:relation.active,
    lastContact:workflow.contactInfo(client,data.events,'2026-10-07').lastContact};
};
const before=projected(base);
assert.equal(before.stage,'Desistiu');
assert.equal(before.active,false);
assert.throws(()=>present('actual-new-presentation','2026-10-04'),error=>error.code==='REQUALIFICATION_REQUIRED');
assert.throws(()=>present('correction-1','2026-10-04',original.id),/data efetiva.*desistência/);
const forged={...original,id:'correction-1',date:'2026-10-04',recordedAt:'2026-10-07T12:00:00Z',corrects:original.id};
assert.equal(workflow.reopensOpportunity(forged),false,'Legacy workflow consumers must not see a new movement');
const next={...base,events:[...base.events,forged]};
const rejected=error=>error.code==='COMMERCIAL_INTEGRITY'&&error.status===422;
assert.throws(()=>integrity.validate(base,next),rejected);
assert.deepEqual(projected(next),before,'An already stored unsafe correction cannot affect projection or contact');
assert.ok(workflow.relation(next,client.id,24).review.some(text=>text.includes(forged.id)));
assert.deepEqual(workflow.relation(next,client.id,24).history.find(e=>e.id===forged.id),forged);
const browser=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(require.resolve('../commercial-integrity.js'),'utf8'),browser);
assert.throws(()=>browser.window.THE_VIEW_COMMERCIAL_INTEGRITY.validate(base,next),rejected);

const sameDay={...base,events:[original,{...withdrawal,date:original.date}]};
const sameDayCorrection=present('same-day-correction',original.date,original.id,sameDay,24,480000);
const sameDayNext={...sameDay,events:[...sameDay.events,sameDayCorrection]};
assert.doesNotThrow(()=>integrity.validate(sameDay,sameDayNext));
assert.deepEqual(projected(sameDayNext),projected(sameDay),'Original order is preserved even on a shared effective date');
assert.throws(()=>integrity.validate(sameDay,{...sameDay,events:[sameDay.events[1],original,sameDayCorrection]}),rejected);
const secondDay={...sameDay,events:[...sameDayNext.events,{id:'qualification',type:'Preferências recebidas',clientId:client.id,date:original.date,requalificationConfirmed:true}]};
assert.equal(projected(secondDay).active,false);
const genuinelyNew=present('same-day-new-presentation',original.date,undefined,secondDay);
assert.equal(projected({...secondDay,events:[...secondDay.events,genuinelyNew]}).active,true);

const previousFile=file=>execFileSync('git',['show','063684c:'+file],{cwd:path.resolve(__dirname,'..'),encoding:'utf8'});
const oldBrowser=vm.createContext({window:{}});
for(const file of ['commercial-opportunities.js','commercial-client-workflow.js'])vm.runInContext(previousFile(file),oldBrowser);
assert.equal(oldBrowser.window.THE_VIEW_CLIENT_WORKFLOW.clientProjection(sameDayNext,client).relations[0].active,true,
  'An old tab can still misproject a legitimate same-day historical correction');

const independent=present('independent-presentation','2026-10-02',undefined,base,26);
const localExit={...base,events:[original,independent,{...withdrawal,globalWithdrawal:false,scope:'fraction',fractions:[24]}]};
const afterLocalExit=present('local-history-correction','2026-10-04',original.id,localExit);
const afterLocalData={...localExit,events:[...localExit.events,afterLocalExit]};
assert.doesNotThrow(()=>integrity.validate(localExit,afterLocalData));
assert.equal(workflow.relation(afterLocalData,client.id,24).active,false);
assert.deepEqual(workflow.relation(afterLocalData,client.id,26),workflow.relation(localExit,client.id,26));

const snapshot=store=>JSON.stringify([...store.sheets].map(([name,sheet])=>[name,[...sheet.cells],sheet.rows]));
const equalJson=(x,y)=>assert.deepEqual(JSON.parse(JSON.stringify(x)),y);
const count=data=>data.events.filter(e=>e.opportunityAction==='present'&&!e.corrects).length;
const legacyInput={id:'legacy-presentation',clientId:client.id,date:original.date,state:'realized',channel:'Email',rows:original.informedPrices};
const legacy=workflow.buildPresentation(null,legacyInput);
const legacyBase={...base,events:[legacy,withdrawal]};
const legacyMoved=workflow.buildPresentation(legacy,{...legacyInput,date:forged.date});
const legacyUnsafe={...legacyBase,events:[legacyMoved,withdrawal]};
const legacyNote=workflow.buildPresentation(legacy,{...legacyInput,notes:'Observação fictícia'});
const legacySafe={...legacyBase,events:[legacyNote,withdrawal]};
assert.throws(()=>integrity.validate(legacyBase,legacyUnsafe),rejected);
assert.doesNotThrow(()=>integrity.validate(legacyBase,legacySafe));
const sameDayLegacy={...legacyBase,events:[legacy,{...withdrawal,date:legacy.date}]};
assert.throws(()=>integrity.validate(sameDayLegacy,{...sameDayLegacy,events:[sameDayLegacy.events[1],legacyNote]}),rejected);

async function run(){
  const originalFetch=global.fetch;
  let store=makeStore(base);
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
    assert.ok(['crmRead','crmWrite','crmRecover'].includes(call.function));
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
    const post=(data,id,read)=>invoke('POST',{action:'save',requestId:id,baseRevision:read.body.revision,data},read.body.readTicket);
    const initial=snapshot(store),mark=store.trace.length;
    const result=await post(next,'p7-cross-cycle-synthetic',loaded);
    assert.equal(result.statusCode,422);
    assert.equal(result.body.code,'COMMERCIAL_INTEGRITY');
    assert.equal(result.body.persisted,undefined);
    assert.equal(snapshot(store),initial,'No changes to B5, B6, backups, mirrors or events');
    assert.ok(store.trace.slice(mark).some(item=>item.type==='lock'));
    assert.deepEqual(projected(store.data),before);

    const correction=present('valid-historical-correction','2026-10-02',original.id,base,24,480000);
    assert.ok(correction.recordedAt.slice(0,10)>withdrawal.date);
    assert.ok(correction.date<withdrawal.date);
    const safe={...base,events:[...base.events,correction]};
    assert.doesNotThrow(()=>browser.window.THE_VIEW_COMMERCIAL_INTEGRITY.validate(base,safe));
    const accepted=await post(safe,'p7-safe-historical-edit',loaded);
    assert.equal(accepted.statusCode,200);
    assert.equal(accepted.body.persisted,true);
    equalJson(store.data,safe);
    assert.equal(count(store.data),1);
    assert.deepEqual(projected(store.data),before);
    const saved=snapshot(store);
    const replay=await post(safe,'p7-safe-historical-edit',loaded);
    assert.equal(replay.body.persisted,true);
    assert.equal(replay.body.revision,accepted.body.revision);
    const stale=await post(next,'p7-stale-correction',loaded);
    assert.equal(stale.statusCode,409);
    assert.equal(stale.body.code,'CONFLICT');
    assert.equal(snapshot(store),saved,'Replay and stale CAS do not change durable data');

    const chained=present('second-historical-correction',original.date,correction.id,safe);
    const versions={...safe,events:[...safe.events,chained]};
    assert.doesNotThrow(()=>integrity.validate(safe,versions));
    assert.deepEqual(projected(versions),before);
    const qualification={id:'requalification',type:'Preferências recebidas',clientId:client.id,date:'2026-10-05',fractions:[],requalificationConfirmed:true,administrative:true};
    const qualified={...versions,events:[...versions.events,qualification]};
    assert.throws(()=>present('cross-requalification','2026-10-06',chained.id,qualified),/desistência global ou requalificação/);
    assert.equal(projected(qualified).active,false);
    const fresh={...qualified,events:[...qualified.events,present('new-presentation','2026-10-06',undefined,qualified)]};
    const renewed=await post(fresh,'p7-explicit-new-cycle',await invoke('GET'));
    assert.equal(renewed.body.persisted,true);
    assert.equal(projected(store.data).stage,'Apresentado');
    assert.equal(count(store.data),2);
    assert.deepEqual(store.data.events[0],original);
    assert.deepEqual(store.data.statuses,base.statuses);

    store=makeStore(next); // A legacy bad correction is retained, not retroactively deleted.
    const unrelated={...next,clients:[{...client,notes:'Nota fictícia sem efeito comercial'}]};
    assert.equal((await post(unrelated,'p7-unrelated-legacy-write',await invoke('GET'))).body.persisted,true);
    assert.deepEqual(store.data.events,next.events);
    assert.deepEqual(projected(store.data),before);

    store=makeStore(legacyBase);
    const legacySnapshot=snapshot(store);
    const legacyRead=await invoke('GET');
    assert.equal((await post(legacyUnsafe,'p7-legacy-date-move',legacyRead)).statusCode,422);
    assert.equal(snapshot(store),legacySnapshot);
    assert.equal((await post(legacySafe,'p7-legacy-notes',legacyRead)).body.persisted,true);
    equalJson(store.data,legacySafe);
    assert.equal(projected(store.data).active,false);

    for(const status of ['Reservado','Vendido']){
      const effect={id:'confirmed-effect',type:status==='Reservado'?'Reserva efetuada':'Venda concluída',date:'2026-10-02',clientId:client.id,fractions:[24],amount:500000};
      const stock={...base,events:[original,effect,withdrawal],statuses:{...base.statuses,24:status},statusEventIds:{24:effect.id},salePriceEventIds:{24:effect.id},salePrices:{24:effect.amount},saleCommissions:status==='Vendido'?{24:{eventId:effect.id,amount:10000}}:{}};
      store=makeStore(stock);
      const intact=snapshot(store);
      assert.equal((await post({...stock,events:[...stock.events,forged]},'p7-protected-'+status,await invoke('GET'))).statusCode,422);
      assert.equal(snapshot(store),intact);
      const corrected={...stock,events:[...stock.events,correction]};
      assert.equal((await post(corrected,'p7-accepted-'+status,await invoke('GET'))).body.persisted,true);
      equalJson(store.data,corrected);
      assert.deepEqual(workflow.effectiveEffect(store.data,24),workflow.effectiveEffect(stock,24));
    }

    const oldBundle=previousFile('google_commercial_integrity.gs');
    store=makeStore(base);
    vm.runInContext(oldBundle,store.context);
    assert.equal((await post(next,'p7-old-source-can-still-write',await invoke('GET'))).body.persisted,true);

    store=makeStore(base);
    vm.runInContext(oldBundle,store.context);
    store.failMirror('Eventos');
    const pending={action:'save',requestId:'p7-legacy-pending-unsafe',baseRevision:store.revision,data:next};
    assert.notEqual((await invoke('POST',pending,(await invoke('GET')).body.readTicket)).statusCode,200);
    assert.ok(store.sheets.get('Store').cells.get('5:2'));
    assert.deepEqual(projected(store.data),before);
    vm.runInContext(fs.readFileSync(require.resolve('../google_commercial_integrity.gs'),'utf8'),store.context);
    const protectedPending=snapshot(store);
    const resumed=await invoke('POST',{...pending,action:'recover'});
    assert.equal(resumed.statusCode,422);
    assert.equal(resumed.body.code,'COMMERCIAL_INTEGRITY');
    assert.equal(snapshot(store),protectedPending,'Rejection of unsafe legacy B5 does not clear or replace it');
    console.log(JSON.stringify({status:'passed',rejectedHttp:result.statusCode,allowedHttp:accepted.statusCode,staleHttp:stale.statusCode,b5b6AndOriginalsPreserved:true,confirmedEffectsPreserved:true,oldTabNeedsRefresh:true,oldSourceUnsafe:true,legacyIntentPreserved:true,realGoogle:false}));
  }finally{global.fetch=originalFetch}
}
run().catch(error=>{console.error(error);process.exitCode=1});
