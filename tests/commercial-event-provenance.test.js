'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const model=require('../commercial-client-workflow.js'),copy=x=>JSON.parse(JSON.stringify(x));
let source=fs.readFileSync(require.resolve('../commercial.js'),'utf8');const begin=source.indexOf('const MAJUCA_IMPORT_RECORDS=['),stop=source.indexOf('\n];',begin);source=source.slice(0,begin)+'const MAJUCA_IMPORT_RECORDS=[];'+source.slice(stop+3);
let writes=0,requests=0;
const context={console,document:{readyState:'loading',addEventListener(){},getElementById(){return null},querySelectorAll(){return[]}},window:{THE_VIEW_CONFIG:{},THE_VIEW_CLIENT_WORKFLOW:model,createClientWorkflow:a=>a},localStorage:{getItem(){return null},setItem(){writes++}},fetch(){requests++;throw Error('Forbidden network')}};
vm.createContext(context);const end=source.lastIndexOf('})();');vm.runInContext(source.slice(0,end)+'globalThis.app={state,el,normalizeData,hasCriticalCommercialEventChange,replaceEventAndReapplyBusinessRules,clientWorkflow,buildEventFromForm};'+source.slice(end),context);
const app=context.app;
const admin={id:'manual-status-9',type:'Alteração de estado',clientId:'',date:'2026-10-01',time:'10:00',fractions:[9],notes:'Fictitious reason',unknown:{preserved:true}};
function input(event,refs={statusEventIds:{9:event.id}}){return{clients:[{id:'fiction',name:'Fictitious client',preferences:{typology:'T3'},manualPreferences:{typology:'T3'},preferencesManuallyEdited:true,fractions:[9]},{id:'other',name:'Fictitious other'}],events:[copy(event)],statuses:{9:'Indisponível',24:'Disponível'},finalPrices:{9:500000},salePrices:{},saleCommissions:{},...refs}}
const critical=[{type:'Outro'},{fractions:[24]},{clientId:'other'},{date:'2026-10-02'},{time:'11:00'},{id:'replacement'},{amount:100},{source:'different'},{createdAt:'2026-10-02T00:00:00Z'},{unknown:{preserved:false}}];
for(const refs of [{statusEventIds:{9:admin.id}},{salePriceEventIds:{9:admin.id}},{saleCommissions:{9:{eventId:admin.id,amount:10,unknown:true}}}]){
  for(const patch of critical){
    app.state.data=app.normalizeData(input(admin,refs));const before=JSON.stringify(app.state.data),changed={...copy(admin),...patch};
    assert.equal(app.hasCriticalCommercialEventChange(admin,changed),true,JSON.stringify(patch));
    assert.throws(()=>app.replaceEventAndReapplyBusinessRules(admin,changed),/proveniência|ciclo|origem|integridade/i);assert.equal(JSON.stringify(app.state.data),before);
  }
  app.state.data=app.normalizeData(input(admin,refs));const before=copy(app.state.data);
  const edited={...copy(admin),notes:'Corrected fictitious note',objections:'Fictitious description',amount:0,interest:'',followup:'',followupDate:'',nextStep:'',nextActionDefinedAt:'',nextActionCompletedAt:'',preferences:{typology:'',floor:'',orientation:'',objective:'',decisionTime:'',summary:''},preferenceBudget:0,informedPrices:[],withAgent:false,agentId:'',commissionType:'',commissionValue:0,commissionAmount:0,channel:''};
  assert.equal(app.hasCriticalCommercialEventChange(admin,edited),false);assert.equal(app.replaceEventAndReapplyBusinessRules(admin,edited),true);
  before.events[0].notes=edited.notes;before.events[0].objections=edited.objections;assert.deepEqual(copy(app.state.data),before,'Only safe descriptive fields may change');
}
for(const boundary of [
  {id:'global',clientId:'fiction',type:'Desistência',date:'2026-10-03',time:'10:00',fractions:[],administrative:true,globalWithdrawal:true,source:'manual-stage'},
  {id:'legacy-global',clientId:'fiction',type:'Desistência',date:'2026-10-03',fractions:[]},
  {id:'qualified',clientId:'fiction',type:'Preferências recebidas',date:'2026-10-04',fractions:[],administrative:true,requalificationConfirmed:true,actualCommunication:false,source:'manual-stage'}
]){
  app.state.data=app.normalizeData(input(boundary,{}));const before=JSON.stringify(app.state.data);
  for(const patch of [{type:'Outro'},{clientId:'other'},{fractions:[9]},{date:'2026-10-05'},{administrative:false},{globalWithdrawal:false},{scope:'fraction'},{requalificationConfirmed:false}]){
    assert.throws(()=>app.replaceEventAndReapplyBusinessRules(boundary,{...boundary,...patch}),/proveniência|ciclo|origem|integridade/i);assert.equal(JSON.stringify(app.state.data),before);
  }
  app.replaceEventAndReapplyBusinessRules(boundary,{...boundary,notes:'Safe historical annotation'});
  const expected=JSON.parse(before);expected.events[0].notes='Safe historical annotation';assert.deepEqual(copy(app.state.data),expected,'Safe cycle notes do not replay preferences or change clients');
}
app.state.data=app.normalizeData(input(admin));const baseline=JSON.stringify(app.state.data);
assert.throws(()=>app.clientWorkflow().applyCommunication({...admin,type:'Contacto recebido'},admin,{preferences:{typology:'T1'}}),/proveniência|ciclo|origem|integridade/i);assert.equal(JSON.stringify(app.state.data),baseline,'Alternative communication adapter validates before mutating client');
// Use the real generic form producer, including all empty fields it normally adds.
const formFields=['eventType','eventDate','eventTime','eventChannel','eventAmount','eventInterest','eventFollowup','eventFollowupDate','eventPreferenceTypology','eventPreferenceFloor','eventPreferenceOrientation','eventPurchaseObjective','eventPreferenceObjective','eventPreferenceDecisionTime','eventPreferenceSummary','eventPreferenceBudget','eventObjections','eventNotes'];
for(const key of formFields)app.el[key]={value:''};
for(const original of [admin,{id:'qualified-form',clientId:'fiction',type:'Preferências recebidas',date:'2026-10-04',fractions:[],administrative:true,requalificationConfirmed:true,source:'manual-stage',unknown:{preserved:true}}]){
  app.state.data=app.normalizeData(input(original));const expected=copy(app.state.data);
  app.el.eventType.value=original.type;app.el.eventDate.value=original.date;app.el.eventTime.value=original.time||'';app.el.eventNotes.value='Safe note from generic form';
  const generated=app.buildEventFromForm(original.clientId,original.fractions,original.id);
  assert.equal(app.hasCriticalCommercialEventChange(original,generated),false);app.replaceEventAndReapplyBusinessRules(original,generated);
  expected.events[0].notes=app.el.eventNotes.value;expected.events[0].objections='';assert.deepEqual(copy(app.state.data),expected,'Generic note editing preserves the original provenance and client snapshot');
}
app.state.data=app.normalizeData(input(admin));app.state.data.events.push(copy(admin));const duplicate=JSON.stringify(app.state.data);assert.throws(()=>app.replaceEventAndReapplyBusinessRules(admin,{...admin,notes:'Ambiguous note'}),/origem.*ambígua/);assert.equal(JSON.stringify(app.state.data),duplicate);
assert.equal(writes,0);assert.equal(requests,0);
console.log('Provenance regression passed: three reference maps, structural/unknown fields blocked atomically, descriptive edits only, global/legacy/qualification cycles protected, communication adapter cannot bypass guards; zero storage/network writes.');
