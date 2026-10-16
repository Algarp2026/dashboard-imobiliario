'use strict';
module.exports=(data,model)=>{
  const event=(id,clientId,number,type,date,extra={})=>({id,clientId,type,date,fractions:[number],...extra});
  const shown=(id,clientId,number,date)=>model.buildPresentation(null,{id,clientId,state:'realized',date,channel:'Videochamada',rows:[{fraction:number,officialPrice:500000,informedPrice:490000}]});
  data.events.push(
    event('audit-offer-9','demo-4',9,'Proposta recebida','2026-10-01',{amount:470000}),
    event('audit-sale-9','demo-5',9,'Venda concluída','2026-10-02',{amount:480000}),
    event('audit-visit-18','demo-6',18,'Visita','2026-10-01'),
    event('audit-legacy-offer-19','demo-6',19,'Proposta recebida','2026-10-02',{amount:470000}),
    shown('audit-first-show-24','demo-7',24,'2026-10-01'),
    event('audit-refusal-24','demo-7',24,'Acompanhamento da fração','2026-10-02',{negotiationVersion:1,interest:'Sem interesse'}),
    shown('audit-reshow-24','demo-7',24,'2026-10-03'),
    shown('audit-show-30','demo-8',30,'2026-10-01'),
    event('audit-global-close','demo-8',0,'Desistência','2026-10-05',{fractions:[],globalWithdrawal:true,scope:'global',notes:'Encerramento global exclusivamente ficticio.'})
  );
  data.statuses[9]='Vendido';data.statusEventIds[9]='audit-sale-9';
  return data;
};
