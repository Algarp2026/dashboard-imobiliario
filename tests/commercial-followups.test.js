const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const engine=require('../commercial-recommendations.js');
const root=path.resolve(__dirname,'..');
const now='2026-10-12T12:00:00Z';
const storage=new Map();
let writes=0,requests=0,pdf='';
class Clock extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return Date.parse(now)}}
const context={console,Date:Clock,document:{readyState:'loading',addEventListener(){}},window:{THE_VIEW_CONFIG:{},THE_VIEW_RECOMMENDATIONS:engine,addEventListener(){},open(){return{document:{open(){},write(value){pdf=value},close(){}}}}},localStorage:{getItem(key){return storage.get(key)||null},setItem(key,value){writes++;storage.set(key,value)},removeItem(key){writes++;storage.delete(key)}},fetch(){requests++;throw new Error('Follow-up tests must not use the real Sheet')}};
vm.createContext(context);
const source=fs.readFileSync(path.join(root,'commercial.js'),'utf8'),end=source.lastIndexOf('})();');
const expose=['state','STAGES','normalizeData','clientSummaryFollowupInfo','buildClientSummaryRows','nextActionMetadata','migrateCrmData','recalculateResumoTodosClientes','saveLocalOnly','loadDataLocal','mergeCommercialData','remotePayload','generateClientsSummaryPdf','commercialRecommendationQueueMarkup'];
vm.runInContext(source.slice(0,end)+'commercialUxToast=()=>{};globalThis.test={'+expose.join(',')+'};'+source.slice(end),context);
const app=context.test;
const clone=value=>JSON.parse(JSON.stringify(value));
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value)}return value}
function client(id,extra={}){return{id,name:id,stage:'Qualificado',stageManual:true,manualStage:'Qualificado',legacyStageFallback:'Qualificado',preferences:{typology:'T2'},manualPreferences:{typology:'T2',floor:'',orientation:'',objective:'',decisionTime:'',summary:''},budget:800000,manualBudget:800000,preferencesManuallyEdited:true,fractions:[],manualFractions:[],manualNextStep:'',manualNextFollowup:'',originManual:'',notes:'Preserve original notes',...extra}}
const undated=(id,day,extra={})=>client(id,{manualNextStep:'Preparar acompanhamento',...(day?{manualNextActionDefinedAt:`2026-10-${day}T10:00:00Z`}:{}),...extra});
const scenarios=[];
function test(name,callback){callback();scenarios.push(name)}
function evaluate(c,events=[],options={}){
  const input={clients:[c],events,fractions:[],now,...options},before=JSON.stringify(input);freeze(input);
  const context=engine.buildContext(input),info=engine.followupInfo(c,context),recommendation=engine.recommendClient(c,context);
  assert.equal(JSON.stringify(input),before,'Classification mutated inputs');
  return{info,recommendation};
}
for(const [day,age,review] of [['12',0,false],['10',2,false],['09',3,true],['07',5,true]]){
  test(`Undated action ${age} calendar days old`,()=>{
    const {info,recommendation}=evaluate(undated('c',day));
    assert.equal(info.status,'undated');assert.equal(info.age,age);assert.equal(info.needsReview,review);
    assert.equal(info.date,'');assert.equal(info.label,review?'Sem data \u2014 necessita revis\u00e3o':'Sem data');
    assert.equal(recommendation.primary?.code==='manual-undated',review);
    assert.ok(![recommendation.primary,...recommendation.secondary].some(r=>r?.code==='manual-overdue'));
    if(review){assert.equal(recommendation.primary.priority,'M\u00e9dia');assert.equal(recommendation.primary.action,'Definir prazo de acompanhamento');assert.deepEqual(recommendation.primary.quickActions,[{id:'plan',label:'Definir pr\u00f3xima a\u00e7\u00e3o'}])}
  });
}
test('Legacy actions do not borrow client or event dates',()=>{
  const c=undated('c',null,{created:'2000-01-01',updated:'2000-01-01',lastContact:'2000-01-01'});
  const old={id:'e',clientId:'c',type:'Outro',date:'2000-01-01',nextStep:'Historical plan'};
  const {info,recommendation}=evaluate(c,[old]);assert.equal(info.status,'undated');assert.equal(info.age,null);assert.equal(info.needsReview,false);assert.notEqual(recommendation.primary?.code,'manual-undated');
  const eventOnly=evaluate(client('c'),[old]);assert.equal(eventOnly.info.step,'Historical plan');assert.equal(eventOnly.info.age,null);
  for(const definedAt of ['invalid','2026-02-30T10:00:00Z','2026-10-14T10:00:00Z'])assert.equal(evaluate({...c,manualNextActionDefinedAt:definedAt}).info.needsReview,false);
});
test('Portugal calendar days include summer time and the DST transition',()=>{
  const c=undated('c',null,{manualNextActionDefinedAt:'2026-06-01T23:30:00Z'});
  assert.equal(evaluate(c,[],{now:'2026-06-03T23:05:00Z'}).info.age,2);
  assert.equal(evaluate(c,[],{now:'2026-06-04T23:05:00Z'}).info.needsReview,true);
  const dst={...c,manualNextActionDefinedAt:'2026-10-23T23:30:00Z'};
  assert.equal(evaluate(dst,[],{now:'2026-10-26T00:05:00Z'}).info.age,2);
});
test('Scheduled, today and overdue dates remain distinct from undated',()=>{
  assert.equal(evaluate(client('c',{manualNextFollowup:'2026-10-14'})).info.label,'Agendado');
  assert.equal(evaluate(client('c',{manualNextFollowup:'2026-10-12'})).info.label,'Agendado');
  const expired=evaluate(client('c',{manualNextStep:'Telefonar',manualNextFollowup:'2026-10-11'}));
  assert.equal(expired.info.label,'Vencido');assert.equal(expired.recommendation.primary.code,'manual-overdue');
  assert.equal(evaluate(client('c')).info.label,'Sem a\u00e7\u00e3o');
});
test('Explicit completion preserves the action and its date without pending classification',()=>{
  const c=client('c',{manualNextStep:'Original action',manualNextFollowup:'2026-10-11',manualNextActionDefinedAt:'2026-10-07T10:00:00Z',manualNextActionCompletedAt:'2026-10-12T10:00:00Z'});
  assert.equal(evaluate(c).info.status,'none');assert.equal(c.manualNextStep,'Original action');assert.equal(c.manualNextFollowup,'2026-10-11');
  const ev={id:'done',clientId:'c',type:'Outro',date:'2026-10-01',nextStep:'Done event action',followupDate:'2026-10-20',nextActionCompletedAt:'2026-10-10T10:00:00Z'};
  assert.equal(evaluate(client('c'),[ev]).info.status,'none');
});
test('Later actual contacts satisfy old event follow-ups, not newly defined backdated actions',()=>{
  const plan={id:'plan',clientId:'c',type:'Documenta\u00e7\u00e3o enviada',date:'2026-10-01',time:'10:00',nextStep:'Telefonar',followupDate:'2026-10-09'};
  const contact={id:'contact',clientId:'c',type:'Outro',channel:'Telefone',date:'2026-10-10',time:'10:00'};
  assert.equal(evaluate(client('c'),[plan,contact]).info.status,'none');
  assert.equal(evaluate(client('c'),[{...plan,nextActionDefinedAt:now},contact]).info.status,'overdue');
});
test('An undated event uses only its own action-definition timestamp',()=>{
  const ev={id:'e',clientId:'c',type:'Outro',date:'2020-01-01',nextStep:'Event action',nextActionDefinedAt:'2026-10-09T10:00:00Z'};
  const {info,recommendation}=evaluate(client('c'),[ev]);assert.equal(info.age,3);assert.equal(info.source,'event');assert.equal(recommendation.primary.code,'manual-undated');
});
test('Pending high-priority proposals take precedence without duplicate deadline recommendations',()=>{
  const proposal={id:'proposal',clientId:'c',type:'Contra-proposta enviada',date:'2026-10-07',time:'10:00',fractions:[],amount:700000};
  const {recommendation}=evaluate(undated('c','07'),[proposal]);
  assert.equal(recommendation.primary.code,'proposal');assert.equal(recommendation.primary.priority,'Alta');
  const deadline=[recommendation.primary,...recommendation.secondary].filter(r=>r.code==='manual-undated');assert.equal(deadline.length,1);
});
test('Only an actual action edit establishes or restarts the reference date',()=>{
  const created=clone(app.nextActionMetadata({},'New action','','client',now));assert.equal(created.manualNextActionDefinedAt,now);
  const c=undated('c','07');
  assert.deepEqual(clone(app.nextActionMetadata(c,c.manualNextStep,'','client',now)),{});
  const changed=clone(app.nextActionMetadata(c,'Revised action','','client',now));
  assert.equal(changed.manualNextActionDefinedAt,now);assert.equal(evaluate({...c,manualNextStep:'Revised action',...changed}).info.age,0);
  const oldEvent={id:'old',clientId:'c',type:'Outro',date:'2026-10-01',nextStep:'Original dated plan',followupDate:'2026-10-08'};
  const restarted=evaluate({...c,manualNextStep:'Revised action',...changed},[oldEvent]);
  assert.equal(restarted.info.status,'undated');assert.equal(restarted.info.age,0);assert.equal(restarted.info.step,'Revised action');
  const legacy=undated('c',null);assert.deepEqual(clone(app.nextActionMetadata(legacy,legacy.manualNextStep,'','client',now)),{});
  const deadline=clone(app.nextActionMetadata(c,c.manualNextStep,'2026-10-15','client',now));assert.equal(deadline.manualNextActionDefinedAt,now);
  const eventMetadata=clone(app.nextActionMetadata({nextStep:'Old event plan'},'New event plan','','event',now));assert.equal(eventMetadata.nextActionDefinedAt,now);
  const cleared=client('c',{nextStep:'Legacy description',nextFollowup:'2026-10-20'});
  assert.equal(evaluate(cleared).info.status,'none');assert.deepEqual(clone(app.nextActionMetadata(cleared,'','','client',now)),{});
  assert.ok(source.includes('c.manualNextStep??c.nextStep??'));
  assert.ok(source.includes('c.manualNextFollowup??c.nextFollowup??'));
});
test('CRM, dashboard and PDF share the same classifications, filters and ordering',()=>{
  app.state.data=app.normalizeData({clients:[client('z-overdue',{manualNextStep:'Call',manualNextFollowup:'2026-10-11'}),undated('y-review','07'),client('x-future-later',{manualNextStep:'Later',manualNextFollowup:'2026-10-20'}),client('w-future-first',{manualNextStep:'Soon',manualNextFollowup:'2026-10-14'}),undated('v-recent','10'),undated('u-legacy',null),client('t-none'),client('s-done',{manualNextStep:'Retained completed description',manualNextFollowup:'2026-10-10',manualNextActionCompletedAt:now})],events:[],finalPrices:{24:750000},statuses:{30:'Indispon\u00edvel'},agents:[{id:'a',name:'Existing agent'}],priceHistory:{24:[{date:'2026-10-01',price:750000}]} });
  const before=JSON.stringify(app.state.data),options={statuses:['Qualificado'],sort:'followup'};
  const rows=app.buildClientSummaryRows(options);
  assert.deepEqual(Array.from(rows,row=>row.client),['z-overdue','y-review','w-future-first','x-future-later','u-legacy','v-recent','s-done','t-none']);
  for(const c of app.state.data.clients){const row=rows.find(row=>row.client===c.id),info=app.clientSummaryFollowupInfo(c),rec=engine.recommendClient(c,engine.buildContext({events:[],now}));assert.equal(row.followupStatus,info.status);assert.equal(row.followupNeedsReview,info.needsReview);if(rec.manual)assert.equal(row.nextStep,rec.manual.step)}
  assert.equal(app.buildClientSummaryRows({...options,followupFilter:'undated-review'}).length,1);
  assert.equal(app.buildClientSummaryRows({...options,followupFilter:'undated'}).length,3);
  assert.equal(app.buildClientSummaryRows({...options,followupFilter:'none'}).length,2);
  assert.match(app.commercialRecommendationQueueMarkup(),/data-ux-client="y-review"/);
  app.generateClientsSummaryPdf(rows,['client','nextFollowup','nextStep']);
  for(const label of ['Vencido:','Agendado:','Sem data','Sem data \u2014 necessita revis\u00e3o','Sem a\u00e7\u00e3o'])assert.ok(pdf.includes(label));
  assert.ok(!pdf.includes('Sem follow-up'));assert.ok(pdf.includes('@page{size:A4 portrait'));
  assert.equal((pdf.match(/<th>/g)||[]).length,3);
  assert.equal(JSON.stringify(app.state.data),before);assert.equal(writes,0);assert.equal(requests,0);
});
test('Retrocompatible migration keeps unknown definition dates empty and all original business data',()=>{
  const c=undated('legacy',null),ev={id:'legacy-event',clientId:'legacy',type:'Outro',date:'2020-01-01',nextStep:'Old event action',followup:'Old event action',followupDate:'',fractions:[],informedPrices:[],notes:'Original event note'};
  app.state.data=app.normalizeData({clients:[c],events:[ev],finalPrices:{24:750000},statuses:{30:'Indispon\u00edvel'},salePrices:{36:1400000},saleCommissions:{36:{amount:42000}},priceHistory:{24:[{date:'2026-10-01',price:750000}]},agents:[{id:'a',name:'Preserved'}]});
  app.state.data.majucaImportKey='majuca_import_v1';
  const before=clone(app.state.data);
  app.migrateCrmData();assert.equal(c.manualNextActionDefinedAt,'');assert.equal(ev.nextActionDefinedAt,'');
  assert.equal(app.clientSummaryFollowupInfo(c).needsReview,false);
  assert.equal(c.manualNextStep,before.clients[0].manualNextStep);assert.equal(ev.nextStep,before.events[0].nextStep);
  for(const key of ['finalPrices','statuses','salePrices','saleCommissions','priceHistory','agents'])assert.deepEqual(clone(app.state.data[key]),before[key]);
  assert.equal(app.state.data.clients.length,1);assert.equal(app.state.data.events.length,1);
  app.recalculateResumoTodosClientes();const stable=JSON.stringify(app.state.data);app.migrateCrmData();assert.equal(JSON.stringify(app.state.data),stable);
});
test('Metadata survives local storage, conservative merge and Apps Script Store JSON round-trip',()=>{
  const c=app.state.data.clients[0];Object.assign(c,app.nextActionMetadata(c,'Updated saved action','','client',now));c.manualNextStep='Updated saved action';
  app.state.data.events[0].nextActionDefinedAt=now;
  const before=clone(app.state.data);app.saveLocalOnly();assert.deepEqual(clone(app.loadDataLocal()),before);
  const stale=clone(before);delete stale.clients[0].manualNextActionDefinedAt;delete stale.events[0].nextActionDefinedAt;
  const merged=app.mergeCommercialData(before,stale);assert.equal(merged.clients[0].manualNextActionDefinedAt,now);assert.equal(merged.events[0].nextActionDefinedAt,now);
  const values={},sheet={getRange(address){return{getValue(){return values[address]||''},setValue(value){values[address]=value;return this}}}};
  const backend={console,LockService:{getDocumentLock(){return{waitLock(){},releaseLock(){}}}},ContentService:{MimeType:{JSON:'json',JAVASCRIPT:'js'},createTextOutput(text){return{text,setMimeType(){return this}}}}};
  vm.createContext(backend);vm.runInContext(fs.readFileSync(path.join(root,'google_apps_script.gs'),'utf8'),backend);
  backend.getStoreSheet_=()=>sheet;backend.backupStoreBeforeSave_=()=>{};backend.mirrorAll_=()=>{};
  assert.equal(JSON.parse(backend.doPost({parameter:{payload:app.remotePayload()}}).text).ok,true);
  assert.deepEqual(JSON.parse(values.B2),before);
  assert.deepEqual(JSON.parse(backend.doGet(undefined).text).data,before);
  assert.equal(JSON.parse(backend.doPost({postData:{contents:app.remotePayload()}}).text).ok,true);
  assert.equal(requests,0);
});
console.log(`commercial follow-up tests passed: ${scenarios.length} scenarios; Portugal calendar days, legacy safety, shared CRM/PDF states, priority, completion, metadata and simulated Store round-trip`);
