'use strict';
const key=require.resolve('./client-phase2b-fixture.js'),original=require(key),model=require('../../commercial-client-workflow.js');
require.cache[key].exports=()=>{
  const data=original(),client=data.clients[0];
  Object.assign(client,{name:'Cliente Exemplo Visual',phone:'+351 000 000 000',email:'cliente@example.invalid',origin:'Website The View',stageManual:false,fractions:[],manualFractions:[],presentationSelection:[1,2,3],manualNextStep:'Confirmar disponibilidade para videochamada',manualNextFollowup:'2099-10-20',nextActionDefinedAt:'2026-10-10T12:00:00Z'});
  data.statuses=Object.fromEntries(Array.from({length:39},(_,i)=>[i+1,'Disponível']));
  data.finalPrices=Object.fromEntries(Array.from({length:39},(_,i)=>[i+1,500000+i*1000]));
  data.statusEventIds={};data.salePrices={};data.salePriceEventIds={};data.saleCommissions={};
  const e=(id,n,type,date,extra={})=>({id,clientId:client.id,type,date,fractions:[n],...extra});
  const shown=(n,date)=>model.buildPresentation(null,{id:'visual-present-'+n,clientId:client.id,state:'realized',date,channel:'Videochamada',notes:'Apresentacao inteiramente ficticia.',rows:[{fraction:n,officialPrice:data.finalPrices[n],informedPrice:data.finalPrices[n]-5000}]});
  data.events=[shown(9,'2026-10-01'),shown(24,'2026-10-02'),shown(30,'2026-10-03'),shown(36,'2026-10-03'),shown(37,'2026-10-03'),shown(38,'2026-10-03'),e('visual-interest',30,'Acompanhamento da fração','2026-10-04',{negotiationVersion:1,interest:'Interessado'}),e('visual-offer',9,'Proposta recebida','2026-10-05',{negotiationVersion:1,amount:495000}),e('visual-counter',9,'Contra-proposta enviada','2026-10-06',{negotiationVersion:1,amount:500000}),e('visual-closed',36,'Desistência','2026-10-07',{scope:'fraction',globalWithdrawal:false}),e('visual-reserve',37,'Reserva efetuada','2026-10-08',{negotiationVersion:1,amount:530000}),e('visual-sale',38,'Venda concluída','2026-10-09',{negotiationVersion:1,amount:535000})];
  data.statuses[37]='Reservado';data.statuses[38]='Vendido';data.statusEventIds[37]='visual-reserve';data.statusEventIds[38]='visual-sale';
  return process.env.VISUAL_AUDIT_FIXTURE==='true'?require('./visual-audit-fixture.cjs')(data,model):data;
};
process.env.PHASE2A_TEST_PORT='5210';process.env.PHASE2B_FIXTURE='true';process.env.HOME_ENTRY_TESTS='true';require('./client-phase2a-preview.cjs');
