'use strict';
const ops=require('../../commercial-opportunities.js');

module.exports=function seedP7(data){
  const clientId='demo-2';
  const c=data.clients.find(client=>client.id===clientId);
  Object.assign(c,{fractions:[9,24,30],stage:'Desistiu',manualStage:'Desistiu',stageManual:true});
  const reserve={id:'p7-reserve',clientId,type:'Reserva efetuada',negotiationVersion:1,date:'2026-10-10',fractions:[9],amount:500000};
  data.events.push(reserve);
  data.statuses[9]='Reservado';
  data.statusEventIds[9]=reserve.id;
  data.salePrices[9]=reserve.amount;
  data.salePriceEventIds[9]=reserve.id;
  for(const fraction of [24,30]){
    data.events.push(ops.build({id:'p7-round-'+fraction,clientId,action:'round',date:'2026-10-11',fractions:[fraction],party:'cliente',amount:510000},data));
  }
  data.events.push(ops.build({id:'p7-close-24',clientId,action:'close',date:'2026-10-12',fractions:[24],reason:ops.reasons[0]},data));
  const present=(id,date,price,corrects)=>ops.build({
    id,clientId:'demo-0',action:'present',date,fractions:[7],corrects,
    rows:[{fraction:7,officialPrice:data.finalPrices[7],informedPrice:price}]
  },data);
  data.events.push(present('p7-presentation','2026-10-11',500000));
  data.events.push(present('p7-price-correction','2026-10-11',495000,'p7-presentation'));
  data.events.push(present('p7-representation','2026-10-12',496000));
};
