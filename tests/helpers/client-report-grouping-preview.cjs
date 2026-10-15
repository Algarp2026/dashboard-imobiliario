'use strict';
const key=require.resolve('./client-phase2b-fixture.js'),original=require(key);
require.cache[key].exports=()=>{
  const data=original(),stages=['Novo Lead','Qualificado','Apresentado','Em negociação','Reservado','Vendido','Desistiu'];
  data.clients.forEach((c,i)=>{
    c.stage=stages[i%stages.length];
    c.priorityHistory=[{version:1,value:i%9===0,source:'manual'}];
    c.contactStateHistory=[{version:1,value:i%2?'Resposta nossa pendente':'Em acompanhamento',source:'manual'}];
  });
  return data;
};
process.env.PHASE2A_TEST_PORT='5200';process.env.PHASE2B_FIXTURE='true';require('./client-phase2a-preview.cjs');
