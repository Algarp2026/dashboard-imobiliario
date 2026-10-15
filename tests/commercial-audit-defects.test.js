'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const model=require('../commercial-client-workflow.js'),copy=x=>JSON.parse(JSON.stringify(x));
const event=(id,type,date,fractions=[9],extra={})=>({id,clientId:'fiction',type,date,time:'10:00',fractions,...extra});
const proposal=event('offer','Proposta recebida','2026-10-01');
const withdrawal=event('withdraw','Desistência','2026-10-03',[],{globalWithdrawal:true});
const reservation=event('reserve','Reserva efetuada','2026-10-01');
const cancellation=event('cancel','Reserva cancelada','2026-10-02',[9],{releaseReservation:true});
function data(events,extra={}){return{clients:[{id:'fiction',name:'Fictitious customer',fractions:[9,24],preferences:{}},{id:'other',name:'Fictitious other'}],events:copy(events),statuses:{9:'Disponível',24:'Disponível'},statusEventIds:{},finalPrices:{9:500000},salePrices:{},salePriceEventIds:{},saleCommissions:{},...extra}}
function stage(input,expected){const before=JSON.stringify(input);for(const events of [input.events,[...input.events].reverse()])assert.equal(model.clientProjection({...input,events},input.clients[0]).stage,expected);assert.equal(JSON.stringify(input),before)}
for(const type of ['Contacto recebido','Contacto enviado','Outro','Documentação enviada','Preferências recebidas'])stage(data([proposal,withdrawal,event('admin',type,'2026-10-04')]),'Desistiu');
stage(data([proposal,withdrawal,event('new','Nova proposta recebida','2026-10-04')]),'Em negociação');
const otherUnit=data([proposal,withdrawal,event('new-b','Nova proposta recebida','2026-10-04',[24])]);stage(otherUnit,'Em negociação');assert.equal(model.relation(otherUnit,'fiction',9).state,'Desistiu');assert.equal(model.relation(otherUnit,'fiction',24).state,'Em negociação');
assert.equal(model.globalWithdrawal({...withdrawal,date:''}),false);
assert.equal(model.globalWithdrawal({...withdrawal,globalWithdrawal:false}),false);
assert.equal(model.globalWithdrawal({...withdrawal,releaseReservation:true}),false);
const historical=data([proposal,withdrawal]);Object.assign(historical.clients[0],{stageManual:true,manualStage:'Em negociação',updatedAt:'2026-10-05T12:00:00Z'});stage(historical,'Desistiu');assert.ok(model.clientProjection(historical,historical.clients[0]).review.length);
stage(data([withdrawal]),'Desistiu');
const ambiguous=data([]);Object.assign(ambiguous.clients[0],{stageManual:true,manualStage:'Desistiu'});stage(ambiguous,'Qualificado');assert.ok(model.clientProjection(ambiguous,ambiguous.clients[0]).review.length);
const active=data([reservation,withdrawal],{statuses:{9:'Reservado'},statusEventIds:{9:reservation.id}});stage(active,'Reservado');
const sold={...reservation,type:'Venda concluída'};stage(data([sold,withdrawal],{statuses:{9:'Vendido'},statusEventIds:{9:sold.id}}),'Vendido');
const cancelled=data([reservation,cancellation],{statusEventIds:{9:cancellation.id}});
assert.throws(()=>model.effectTransition(cancelled,9,cancellation,null),/revisão|reposição/i);
assert.throws(()=>model.effectTransition(cancelled,9,cancellation,{...cancellation,fractions:[24]}),/revisão|reposição/i);
const orphan=data([],{statusEventIds:{9:'missing'}});assert.ok(model.clientProjection(orphan,orphan.clients[0]).review.some(v=>/origem|referência/i.test(v)));

let source=fs.readFileSync(require.resolve('../commercial.js'),'utf8');const start=source.indexOf('const MAJUCA_IMPORT_RECORDS=['),stop=source.indexOf('\n];',start);source=source.slice(0,start)+'const MAJUCA_IMPORT_RECORDS=[];'+source.slice(stop+3);
let storageWrites=0,requests=0;
const context={console,document:{readyState:'loading',addEventListener(){},getElementById(){return null},querySelectorAll(){return[]}},window:{THE_VIEW_CONFIG:{},THE_VIEW_CLIENT_WORKFLOW:model},localStorage:{getItem(){return null},setItem(){storageWrites++}},fetch(){requests++;throw Error('Forbidden network')}};
vm.createContext(context);const end=source.lastIndexOf('})();');
vm.runInContext(source.slice(0,end)+`globalThis.app={state,el,normalizeData,applyManualStatusChange,handleManualStatusSelect,replaceEventAndReapplyBusinessRules,commercialTransitionPlan,reapplyCommercialEffectsForFractions,deleteMaintenanceSelected,prepareManualClientWithdrawal,saveClientEdit,
harness:()=>{checkedValues=selector=>selector==='[data-maint-event]'?['cancel']:[];confirmUser=async()=>harness.answer!==false;notifyUser=async message=>harness.messages.push(message);save=()=>harness.saves++;closeMaintenanceModal=()=>{};RenderFlow.eventChanged=()=>{};RenderFlow.salesChanged=()=>{};RenderFlow.clientChanged=()=>{};promptUser=async()=>{if(harness.change)state.data.statuses[9]='Reservado';return harness.reason};readClientEditValues=()=>({stage:harness.stage||'Desistiu'});persistClientChange=async()=>{harness.persists=(harness.persists||0)+1;return true};closeClientModal=()=>{};clientSaveFeedback=()=>{};}};`+source.slice(end),context);
const app=context.app;context.harness={messages:[],saves:0,reason:'Fictitious administrative reason',change:false};app.harness();
app.state.fractions=[{number:9,name:'Apt. 9'}];
(async()=>{
  app.state.data=app.normalizeData(copy(cancelled));let before=JSON.stringify(app.state.data);
  await app.deleteMaintenanceSelected();assert.equal(JSON.stringify(app.state.data),before);assert.equal(context.harness.saves,0);
  assert.throws(()=>app.replaceEventAndReapplyBusinessRules(cancellation,{...cancellation,fractions:[24]}),/revisão|reposição/i);assert.equal(JSON.stringify(app.state.data),before);
  app.replaceEventAndReapplyBusinessRules(cancellation,{...cancellation,notes:'Fictitious note correction'});assert.equal(app.state.data.statusEventIds[9],'cancel');assert.equal(app.state.data.events.find(e=>e.id==='cancel').notes,'Fictitious note correction');
  app.state.data.statusEventIds[24]='cancel';before=JSON.stringify(app.state.data);await app.deleteMaintenanceSelected();assert.equal(JSON.stringify(app.state.data),before,'Out-of-scope provenance cannot be silently detached');
  app.state.data=app.normalizeData(copy(cancelled));app.applyManualStatusChange(9,'Disponível','Indisponível',{unavailableReason:'Fictitious administrative reason'});const administrativeSource=app.state.data.statusEventIds[9];await app.deleteMaintenanceSelected();assert.equal(app.state.data.events.some(ev=>ev.id==='cancel'),false);assert.equal(app.state.data.statusEventIds[9],administrativeSource);assert.ok(app.state.data.events.some(ev=>ev.id===administrativeSource));assert.equal(app.state.data.statuses[9],'Indisponível');context.harness.saves=0;
  for(const status of ['Reservado','Vendido']){
    const closing={...reservation,type:status==='Vendido'?'Venda concluída':reservation.type};
    app.state.data=app.normalizeData(data([closing],{statuses:{9:status},statusEventIds:{9:closing.id},salePrices:{9:490000},salePriceEventIds:{9:closing.id},saleCommissions:{9:{eventId:closing.id,amount:10000,unknown:true}}}));before=JSON.stringify(app.state.data);
    for(const target of ['Disponível','Indisponível',status==='Vendido'?'Reservado':'Vendido'])assert.throws(()=>app.applyManualStatusChange(9,status,target),/evento|operação|revisão/i);
    assert.equal(app.applyManualStatusChange(9,status,status),false);assert.equal(JSON.stringify(app.state.data),before);
    await app.handleManualStatusSelect(9,'Disponível');assert.equal(JSON.stringify(app.state.data),before);assert.equal(context.harness.saves,0);
  }
  app.state.data=app.normalizeData(data([]));before=copy(app.state.data);
  assert.throws(()=>app.applyManualStatusChange(9,'Disponível','Reservado'),/evento|reserva/i);
  await app.handleManualStatusSelect(9,'Indisponível');assert.equal(app.state.data.statuses[9],'Indisponível');assert.ok(app.state.data.events.some(ev=>ev.id===app.state.data.statusEventIds[9]));assert.deepEqual(copy(app.state.data.finalPrices),before.finalPrices);
  app.state.data=app.normalizeData(data([]));context.harness.reason=null;before=JSON.stringify(app.state.data);await app.handleManualStatusSelect(9,'Indisponível');assert.equal(JSON.stringify(app.state.data),before);
  context.harness.reason='Fictitious reason';context.harness.change=true;const saves=context.harness.saves;await app.handleManualStatusSelect(9,'Indisponível');assert.equal(app.state.data.statuses[9],'Reservado');assert.equal(app.state.data.events.length,0);assert.equal(context.harness.saves,saves);context.harness.change=false;
  app.state.data=app.normalizeData(data([]));const confirmed=await app.prepareManualClientWithdrawal(app.state.data.clients[0]);assert.equal(confirmed.globalWithdrawal,true);assert.deepEqual(Array.from(confirmed.fractions),[]);app.state.data.events.push(confirmed);stage(app.state.data,'Desistiu');
  assert.equal(await app.prepareManualClientWithdrawal(app.state.data.clients[0]),null);
  app.state.data=app.normalizeData(active);assert.equal(await app.prepareManualClientWithdrawal(app.state.data.clients[0]),null,'Existing global withdrawal is not duplicated while a reservation remains effective');
  app.state.data=app.normalizeData(data([],{salePriceEventIds:{9:'foreign-price'},salePrices:{9:480000},saleCommissions:{9:{eventId:'foreign-sale',unknown:true}}}));before=JSON.stringify(app.state.data);assert.throws(()=>app.applyManualStatusChange(9,'Disponível','Indisponível',{unavailableReason:'Fictitious'}),/preços\/comissões/);assert.equal(JSON.stringify(app.state.data),before);
  app.state.data=app.normalizeData(data([reservation],{statuses:{9:'Reservado'},statusEventIds:{9:reservation.id}}));
  app.el.clientId={value:'fiction'};app.el.clientModal={dataset:{clientMode:'stage'}};app.state.clientFormSnapshot={stage:'Qualificado'};
  context.harness.answer=false;before=JSON.stringify(app.state.data);await app.saveClientEdit();assert.equal(JSON.stringify(app.state.data),before);
  context.harness.answer=true;const associations=copy(app.state.data.clients[0].fractions),prices=copy(app.state.data.finalPrices);await app.saveClientEdit();
  assert.equal(app.state.data.events.filter(model.globalWithdrawal).length,1);assert.equal(model.clientProjection(app.state.data,app.state.data.clients[0]).stage,'Reservado');assert.deepEqual(copy(app.state.data.clients[0].fractions),associations);assert.deepEqual(copy(app.state.data.finalPrices),prices);assert.equal(app.state.data.statusEventIds[9],reservation.id);
  await app.saveClientEdit();assert.equal(app.state.data.events.filter(model.globalWithdrawal).length,1,'Retry must not duplicate a manual global withdrawal');
  const oldPresentation=event('old-show','Frações apresentadas','2026-10-01'),oldPreferences=event('old-prefs','Preferências recebidas','2026-10-01',[],{preferences:{typology:'T1'}});
  app.state.data=app.normalizeData(data([oldPresentation,oldPreferences,proposal,withdrawal]));Object.assign(app.state.data.clients[0],{stage:'Desistiu',stageManual:true,manualStage:'Desistiu',preferences:{typology:'T3'},manualPreferences:{typology:'T3'},preferencesManuallyEdited:true});
  app.state.clientFormSnapshot={stage:'Desistiu'};context.harness.stage='Qualificado';context.harness.answer=false;before=JSON.stringify(app.state.data);await app.saveClientEdit();assert.equal(JSON.stringify(app.state.data),before);
  const requalificationBaseline=copy(app.state.data);context.harness.answer=true;await app.saveClientEdit();stage(app.state.data,'Qualificado');assert.equal(app.state.data.events.filter(model.confirmedRequalification).length,1);assert.equal(app.state.data.clients[0].preferences.typology,'T3');assert.equal(app.state.data.clients[0].preferencesManuallyEdited,true);assert.deepEqual(copy(app.state.data.events.slice(0,4)),requalificationBaseline.events);
  for(const key of ['statuses','finalPrices','salePrices','salePriceEventIds','statusEventIds','saleCommissions'])assert.deepEqual(copy(app.state.data[key]),requalificationBaseline[key]);
  await app.saveClientEdit();assert.equal(app.state.data.events.filter(model.confirmedRequalification).length,1);context.harness.stage='Desistiu';app.state.clientFormSnapshot={stage:'Qualificado'};await app.saveClientEdit();assert.equal(app.state.data.events.filter(model.globalWithdrawal).length,2,'A confirmed requalification permits a new explicit closure');
  assert.equal(storageWrites,0);assert.equal(requests,0);
  console.log('Five audit defects passed: administrative activity does not reopen, manual ambiguity reviewed, explicit withdrawal preserves associations, cancellation references protected atomically, manual availability and concurrent changes guarded; no storage/network writes.');
})().catch(error=>{console.error(error);process.exitCode=1});
