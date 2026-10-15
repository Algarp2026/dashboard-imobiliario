'use strict';
const assert=require('node:assert/strict');
const model=require('../commercial-client-workflow.js');
const ev=(id,type,date,extra={})=>({id,clientId:'fiction',type,date,time:'10:00',fractions:[9],...extra});
const show=ev('show','Frações apresentadas','2026-10-01');
const offer=ev('offer','Proposta recebida','2026-10-02');
const close=ev('close','Desistência','2026-10-03',{fractions:[],globalWithdrawal:true});
const data=events=>({clients:[{id:'fiction',fractions:[9],preferences:{}}],events,statuses:{9:'Disponível'},statusEventIds:{}});
function check(events,expected,extra={}){
  const input={...data(events),...extra},before=JSON.stringify(input);
  for(const ordered of [events,[...events].reverse()])assert.equal(model.clientProjection({...input,events:ordered},input.clients[0]).stage,expected);
  assert.equal(JSON.stringify(input),before);
  return model.clientProjection(input,input.clients[0]);
}
for(const flags of [{globalWithdrawal:false,scope:'global'},{globalWithdrawal:true,scope:'fraction'}]){
  const conflict={...close,...flags};assert.equal(model.globalWithdrawal(conflict),false);
  const result=check([show,offer,conflict],'Em negociação');assert.ok(result.review.some(message=>/contradit/i.test(message)));
  check([show,offer,{...conflict,fractions:[9]}],'Em negociação');
  check([conflict],'Qualificado');
}
for(const flags of [{globalWithdrawal:true},{scope:'global'},{globalWithdrawal:true,scope:'global'}])assert.equal(model.globalWithdrawal({...close,globalWithdrawal:undefined,...flags}),true);
assert.equal(model.globalWithdrawal({...close,globalWithdrawal:false,scope:'fraction'}),false);
const administrative=ev('prefs','Preferências recebidas','2026-10-04',{fractions:[],administrative:true});
check([show,offer,close,administrative],'Desistiu');
check([show,offer,close,{...administrative,requalificationConfirmed:false}],'Desistiu');
const qualified={...administrative,requalificationConfirmed:true};
const qualification=check([show,offer,close,qualified],'Qualificado');assert.equal(qualification.relations[0].state,'Interessado');assert.equal(qualification.relations[0].presented,false);assert.equal(qualification.relations[0].historicallyPresented,true);
check([show,offer,{...qualified,date:'2026-10-02'},close],'Desistiu');
check([show,offer,close,qualified,ev('closed-again','Desistência','2026-10-05',{fractions:[],globalWithdrawal:true})],'Desistiu');
check([show,offer,close,ev('interest','Interessado','2026-10-04')],'Qualificado');
check([show,offer,close,ev('interest','Acompanhamento da fração','2026-10-04',{negotiationVersion:1,interest:'Interessado'})],'Qualificado');
check([show,offer,close,qualified,ev('show-new','Frações apresentadas','2026-10-05')],'Apresentado');
check([show,offer,close,qualified,ev('offer-new','Nova proposta recebida','2026-10-05')],'Em negociação');
check([show,offer,close,qualified], 'Qualificado',{clients:[{id:'fiction',stageManual:true,manualStage:'Apresentado',fractions:[9]}]});
check([show,offer,qualified], 'Qualificado',{clients:[{id:'fiction',stageManual:true,manualStage:'Em negociação',fractions:[9]}]});
for(const status of ['Reservado','Vendido']){
  const closing=ev('effective',status==='Vendido'?'Venda concluída':'Reserva efetuada','2026-10-01');
  check([closing,close,qualified],status,{statuses:{9:status},statusEventIds:{9:closing.id}});
}
console.log('Cycle boundaries passed: conflicting flags quarantined, administrative vs confirmed requalification, fresh Interested cycle, preserved historical presentation, new presentation/offer, stable order, reservation/sale precedence and immutable input.');
