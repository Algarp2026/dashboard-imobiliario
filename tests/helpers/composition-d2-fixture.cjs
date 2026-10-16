'use strict';
module.exports=data=>{
  Object.assign(data.clients[1],{manualNextStep:'Enviar documentacao solicitada',manualNextFollowup:'2099-10-20',nextActionDefinedAt:'2026-10-10T12:00:00Z',priorityHistory:[{version:1,value:true,source:'manual',recordedAt:'2026-10-10T12:00:00Z'}],contactStateHistory:[{version:1,value:'Resposta nossa pendente',source:'manual',recordedAt:'2026-10-10T12:00:00Z'}]});
  data.clients[3].contactStateHistory=[{version:1,value:'Resposta nossa pendente',source:'manual',recordedAt:'2026-10-10T12:00:00Z'}];
  data.events.push({id:'d2-fiction-offer',clientId:'demo-4',type:'Proposta recebida',date:'2026-10-10',fractions:[26],amount:510000,negotiationVersion:1});
  return data;
};
