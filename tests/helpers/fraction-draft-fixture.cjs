'use strict';
module.exports=()=>{
  const data=require('./client-phase2a-fixture.js')();
  for(let n=1;n<=39;n++){data.finalPrices[n]=500000+n*1000;data.statuses[n]='Disponível'}
  Object.assign(data.statuses,{8:'Reservado',24:'Reservado',18:'Indisponível',36:'Vendido'});
  data.clients[0].presentationSelection=[9,24];
  return data;
};
