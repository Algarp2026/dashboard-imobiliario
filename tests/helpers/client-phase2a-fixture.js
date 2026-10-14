'use strict';
module.exports=function clientPhase2aFixture(){
  const clients=Array.from({length:64},(_,index)=>({
    id:'demo-'+index,name:'Cliente demonstração '+String(index+1).padStart(2,'0'),stage:index%4===0?'Qualificado':'Novo Lead',origin:'',fractions:[],manualFractions:[],
    preferences:{typology:'',floor:'',orientation:'',objective:'',decisionTime:'',summary:''},
    unknownClient:{keep:['fictitious',index]},commercialSummary:{unknownSummary:'Preservar'},notes:'Registo exclusivamente fictício.'
  }));
  Object.assign(clients[0],{phone:'+351 000 000 001',email:'cliente01@example.test',nif:'000000000',nationality:'Portuguesa',agentId:'demo-agent',agent:'Agente fictício',agency:'Agência fictícia',createdAt:'2026-08-01T10:00:00.000Z',budget:750000,manualBudget:0,budgetMin:600000,budgetMax:800000,preferences:{typology:'T1 ou T2',floor:'3 ou 4',orientation:'Sul ou Oeste',objective:'Habitação própria',decisionTime:'Até ao final do ano',summary:'Terraço amplo.',unknownPreference:{keep:true}},manualPreferences:{typology:'T2',floor:'',orientation:'',objective:'',decisionTime:'',summary:'',unknownManual:'Preservar'}});
  clients[1].preferences={typology:'T2 espaçoso, talvez outro',floor:'Piso elevado com privacidade',orientation:'Vista para o mar',objective:'Compra em avaliação',decisionTime:'Após vender outro imóvel',summary:'Texto legado fictício.',extraLegacy:['never','discard']};
  clients[2].preferences={typology:'Indiferente',floor:'Indiferente',orientation:'Indiferente',objective:'',decisionTime:'',summary:''};
  clients[3].preferences={typology:'T1 Duplex',floor:'6',orientation:'Este/Oeste',objective:'Investimento',decisionTime:'Imediato',summary:''};
  return{clients,events:[{id:'demo-old-request',clientId:'demo-0',type:'Pedido de informação recebido',date:'2026-08-01',time:'10:00',fractions:[],notes:'Evento anterior fictício.',unknownEvent:{keep:true}}],agents:[{id:'demo-agent',name:'Agente fictício',agency:'Agência fictícia',ami:'000000',email:'agente@example.test',phone:'000000000'}],finalPrices:{2:615000,18:665000,21:720000},statuses:{36:'Vendido'},salePrices:{36:1400000},saleCommissions:{},priceHistory:{},unavailableReasons:{},statusEventIds:{},salePriceEventIds:{},unknownRoot:{keep:true},majucaImportSummary:{testOnly:true},majucaImportKey:'fictitious-fixture'};
};
