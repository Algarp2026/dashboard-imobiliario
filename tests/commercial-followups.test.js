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
  const {info,recommendation}=evaluate(c,[old]);assert.equal(info.status,'undated');assert.equal(info.age,null);assert.equal(info.needsReview,true);assert.equal(info.reviewReason,'legacy');assert.equal(recommendation.primary.code,'manual-undated');
  assert.equal(recommendation.primary.reason,'Existe uma pr\u00f3xima a\u00e7\u00e3o comercial sem data definida que necessita de revis\u00e3o.');
  assert.ok(!/\d+ dias/.test(recommendation.primary.reason));
  const eventOnly=evaluate(client('c'),[old]);assert.equal(eventOnly.info.status,'none');assert.equal(eventOnly.recommendation.manual,null);
  for(const definedAt of ['invalid','2026-02-30T10:00:00Z'])assert.equal(evaluate({...c,manualNextActionDefinedAt:definedAt}).info.reviewReason,'legacy');
  assert.equal(evaluate({...c,manualNextActionDefinedAt:'2026-10-14T10:00:00Z'}).info.needsReview,false);
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
  const redefined=clone(app.nextActionMetadata(legacy,legacy.manualNextStep,'','client',now,true));
  assert.equal(evaluate({...legacy,...redefined}).info.age,0);assert.equal(evaluate({...legacy,...redefined}).info.needsReview,false);
  assert.equal({...legacy,...redefined}.manualNextStep,legacy.manualNextStep);
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
  assert.deepEqual(Array.from(rows,row=>row.client),['z-overdue','u-legacy','y-review','w-future-first','x-future-later','v-recent','s-done','t-none']);
  for(const c of app.state.data.clients){const row=rows.find(row=>row.client===c.id),info=app.clientSummaryFollowupInfo(c),rec=engine.recommendClient(c,engine.buildContext({events:[],now}));assert.equal(row.followupStatus,info.status);assert.equal(row.followupNeedsReview,info.needsReview);if(rec.manual)assert.equal(row.nextStep,rec.manual.step)}
  assert.equal(app.buildClientSummaryRows({...options,followupFilter:'undated-review'}).length,2);
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
  app.migrateCrmData();assert.equal(c.manualNextActionDefinedAt,undefined);assert.equal(ev.nextActionDefinedAt,undefined);
  assert.equal(app.clientSummaryFollowupInfo(c).needsReview,true);
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
  const store=require('./helpers/apps-script-store.js')(app.normalizeData());
  assert.equal(store.write({data:before,baseRevision:store.revision,requestId:'followups-test'}).ok,true);
  assert.deepEqual(store.data,before);
  assert.deepEqual(clone(store.read().data),before);
  assert.equal(JSON.parse(store.context.doPost({parameter:{payload:app.remotePayload()}}).body).ok,false);
  assert.equal(JSON.parse(store.context.doPost({postData:{contents:app.remotePayload()}}).body).ok,false);
  assert.equal(requests,0);
});
test('Legacy completion and cancellation markers suppress follow-up alerts without changing records',()=>{
  for(const extra of [{manualNextActionCompleted:true},{manualNextActionCompletedAt:now},{manualNextActionCancelledAt:now},{manualNextActionStatus:'Cancelada'},{manualNextActionStatus:'Substituida'}]){
    const c=undated('c',null,extra),{info,recommendation}=evaluate(c);
    assert.equal(info.status,'none');assert.equal(recommendation.manual,null);
    assert.ok(![recommendation.primary,...recommendation.secondary].some(rec=>rec?.code==='manual-undated'));
  }
});
test('A newer defined event replaces an undated legacy manual plan even after completion',()=>{
  const c=undated('c',null),ev={id:'new-plan',clientId:'c',type:'Outro',date:'2026-10-12',nextStep:'New action',nextActionDefinedAt:'2026-10-12T10:00:00Z'};
  const current=evaluate(c,[ev]);assert.equal(current.info.step,'New action');assert.equal(current.info.source,'event');assert.equal(current.info.age,0);assert.equal(current.info.needsReview,false);
  assert.equal(evaluate(c,[{...ev,nextActionCompletedAt:now}]).info.status,'none');
  assert.equal(c.manualNextStep,'Preparar acompanhamento');
});
test('Old event snapshots need explicit evidence of pending status and respect later execution references',()=>{
  const ev={id:'legacy-plan',clientId:'c',type:'Outro',date:'2020-01-01',time:'10:00',nextStep:'Old event action'};
  assert.equal(evaluate(client('c'),[ev]).info.status,'none');
  const pending={...ev,nextActionStatus:'Pendente'};
  const active=evaluate(client('c'),[pending]);assert.equal(active.info.reviewReason,'legacy');assert.equal(active.info.age,null);
  const execution={id:'execution',clientId:'c',type:'Outro',date:'2026-10-10',time:'10:00',completedNextActionEventId:'legacy-plan'};
  assert.equal(evaluate(client('c'),[pending,execution]).info.status,'none');
  assert.equal(evaluate(client('c'),[{...pending,id:''},{...execution,completedNextActionEventId:''}]).info.reviewReason,'legacy');
  for(const extra of [{nextActionCompletedAt:now},{nextActionCancelledAt:now},{nextActionStatus:'Cancelada'},{nextActionStatus:'Substituida'}])assert.equal(evaluate(client('c'),[{...pending,...extra}]).info.status,'none');
});
test('Closed, sold, lost and archived clients do not acquire pending legacy follow-ups',()=>{
  for(const stage of ['Vendido','Desistiu','Desistente','Encerrado','Perdido']){
    const {info,recommendation}=evaluate(undated('c',null,{stage}));assert.equal(info.status,'none');assert.equal(recommendation.primary,null);assert.equal(recommendation.manual,null);
  }
  assert.equal(evaluate(undated('c',null,{archived:true})).info.status,'none');
});
test('The requested 13 scenarios agree across CRM, recommendations, dashboard and PDF without writes',()=>{
  const c=(id,extra={})=>client(id,{stage:'Apresentado',manualStage:'Apresentado',legacyStageFallback:'Apresentado',...extra});
  const cases=[
    c('01-legacy',{manualNextStep:'Existing legacy action'}),
    c('02-future',{manualNextStep:'Scheduled action',manualNextFollowup:'2026-10-15'}),
    c('03-completed',{manualNextStep:'Completed original action',manualNextActionCompletedAt:now}),
    c('04-replaced',{manualNextStep:'Previous action'}),
    c('05-none'),
    c('06-today',{manualNextStep:'New action',manualNextActionDefinedAt:'2026-10-12T10:00:00Z'}),
    c('07-two',{manualNextStep:'New action',manualNextActionDefinedAt:'2026-10-10T10:00:00Z'}),
    c('08-three',{manualNextStep:'New action',manualNextActionDefinedAt:'2026-10-09T10:00:00Z'}),
    c('09-five',{manualNextStep:'New action',manualNextActionDefinedAt:'2026-10-07T10:00:00Z'}),
    c('10-edited',{manualNextStep:'Redefined legacy action',...clone(app.nextActionMetadata({manualNextStep:'Redefined legacy action'},'Redefined legacy action','','client',now,true))}),
    c('11-proposal',{manualNextStep:'Existing legacy action'}),
    c('12-history'),
    c('13-closed',{stage:'Vendido',manualStage:'Vendido',legacyStageFallback:'Vendido',manualNextStep:'Retained old action'})
  ];
  const events=[
    {id:'newer',clientId:'04-replaced',type:'Outro',date:'2026-10-12',nextStep:'Replacement action',nextActionDefinedAt:now},
    {id:'proposal',clientId:'11-proposal',type:'Contra-proposta enviada',date:'2026-10-07',time:'10:00',amount:700000,fractions:[24]},
    {id:'history',clientId:'12-history',type:'Outro',date:'2020-01-01',nextStep:'Historical snapshot'}
  ];
  app.state.data=app.normalizeData({clients:cases,events,finalPrices:{24:750000},statuses:{30:'Indispon\u00edvel'},salePrices:{36:1400000},saleCommissions:{36:{amount:42000}},priceHistory:{24:[{date:'2026-10-01',price:750000}]},agents:[{id:'a',name:'Preserved'}]});
  const before=JSON.stringify(app.state.data),writeCount=writes;freeze(app.state.data);
  const expected=['undated','future','none','undated','none','undated','undated','undated','undated','undated','undated','none','none'];
  const review=new Set(['01-legacy','08-three','09-five','11-proposal']);
  const options={statuses:Array.from(app.STAGES),sort:'followup'},rows=app.buildClientSummaryRows(options);
  const queue=app.commercialRecommendationQueueMarkup();
  for(const [index,c] of cases.entries()){
    const info=app.clientSummaryFollowupInfo(c),rec=engine.recommendClient(c,engine.buildContext({events,now})),row=rows.find(row=>row.client===c.name);
    assert.equal(info.status,expected[index],c.id);assert.equal(info.needsReview,review.has(c.id),c.id);
    assert.equal(row.followupStatus,info.status);assert.equal(row.followupNeedsReview,info.needsReview);
    assert.equal(rec.manual?.needsReview||false,info.needsReview);
    if(review.has(c.id))assert.equal((queue.match(new RegExp(`data-ux-client="${c.id}"`,'g'))||[]).length,1);
    if(c.id==='11-proposal'){assert.equal(rec.primary.code,'proposal');assert.equal(rec.secondary.filter(r=>r.code==='manual-undated').length,1)}
  }
  assert.equal(rows[0].followupNeedsReview,true);assert.ok(rows.findIndex(row=>row.client==='02-future')>rows.findIndex(row=>row.client==='01-legacy'));
  app.generateClientsSummaryPdf(rows,['client','nextFollowup','nextStep']);
  assert.ok(pdf.includes('Existing legacy action'));assert.ok(pdf.includes('Sem data \u2014 necessita revis\u00e3o'));assert.ok(!pdf.includes('Historical snapshot'));
  assert.equal(JSON.stringify(app.state.data),before);assert.equal(writes,writeCount);assert.equal(requests,0);
});
test('Startup interpretation preserves cached follow-up fields and does not backfill timestamps or request a general save',()=>{
  const c=client('stable-history',{stage:'Apresentado',manualStage:'Apresentado',legacyStageFallback:'Apresentado',commercialSummary:{presentedFractions:[],lastInformedPrices:[],lastContact:'2020-01-01',nextFollowup:'',nextStep:'Preserved cached historical value'}});
  c.preferences={...c.manualPreferences};
  const ev={id:'old-event',clientId:c.id,type:'Outro',date:'2020-01-01',time:'10:00',fractions:[],nextStep:'Historical snapshot',followup:'Historical snapshot',followupDate:'',informedPrices:[],notes:'Preserve event'};
  app.state.data=app.normalizeData({clients:[c],events:[ev],crmMigrationKey:'crm-funnel-2026-06-v4',majucaImportKey:'majuca_import_v1'});
  const before=JSON.stringify(app.state.data),writeCount=writes;
  assert.equal(app.migrateCrmData(),false);assert.equal(JSON.stringify(app.state.data),before);
  assert.equal(app.clientSummaryFollowupInfo(c).status,'none');assert.equal(JSON.stringify(app.state.data),before);
  assert.equal(writes,writeCount);assert.equal(c.manualNextActionDefinedAt,undefined);assert.equal(ev.nextActionDefinedAt,undefined);
});
console.log(`commercial follow-up tests passed: ${scenarios.length} scenarios; Portugal calendar days, pending legacy/manual actions, historical safety, shared CRM/PDF states, priority, immutable interpretation and simulated Store round-trip`);
