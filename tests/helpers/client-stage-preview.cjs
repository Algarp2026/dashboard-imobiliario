'use strict';
const key=require.resolve('./client-phase2b-fixture.js'),original=require(key);
require.cache[key].exports=()=>{
  const data=original();
  data.statuses=Object.fromEntries(Array.from({length:39},(_,i)=>[i+1,'Disponível']));
  data.finalPrices=Object.fromEntries(Array.from({length:39},(_,i)=>[i+1,500000+i*1000]));
  data.statusEventIds={9:'stage-reserve',30:'stage-sale'};
  data.statuses[9]='Reservado';data.statuses[30]='Vendido';
  data.events=[
    {id:'stage-reserve',clientId:'demo-0',type:'Reserva efetuada',date:'2026-10-01',fractions:[9]},
    {id:'stage-withdraw',clientId:'demo-0',type:'Desistência',date:'2026-10-02',fractions:[24]},
    {id:'stage-sale',clientId:'demo-1',type:'Venda concluída',date:'2026-10-01',fractions:[30]},
    {id:'stage-negotiation',clientId:'demo-2',type:'Proposta recebida',date:'2026-10-01',fractions:[24],negotiationVersion:1,interest:'Vendido'},
    {id:'stage-global',clientId:'demo-3',type:'Desistência',date:'2026-10-01',fractions:[],globalWithdrawal:true}
  ];
  data.clients[0].stageManual=true;data.clients[0].manualStage='Desistiu';
  data.clients[3].fractions=[];data.clients[3].manualFractions=[];
  return data;
};
process.env.PHASE2A_TEST_PORT=process.env.PHASE2A_TEST_PORT||'5201';process.env.PHASE2B_FIXTURE='true';require('./client-phase2a-preview.cjs');
