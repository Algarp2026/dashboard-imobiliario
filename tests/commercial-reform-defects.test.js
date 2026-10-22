'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const model=require('../commercial-client-workflow.js'),source=fs.readFileSync(require.resolve('../commercial.js'),'utf8');
const start=source.indexOf('function initialClientRequestEvent('),end=source.indexOf('\nfunction ',start+1);
const build=vm.runInNewContext('('+source.slice(start,end)+')',{state:{pendingEventClientCreation:false},el:{clientSkipInitialRequest:{checked:true}},buildInitialRequestEvent:()=>({id:'synthetic-request',type:'Pedido de informação recebido'})});
assert.equal(build('synthetic-client',{}, {eventId:'synthetic-event'}),null,'Skip initial request must not build an event');
const c={id:'synthetic-client'},data={clients:[c],statuses:{19:'Disponível'},events:[{id:'refused',clientId:c.id,type:'Acompanhamento da fração',interest:'Sem interesse',date:'2026-10-01',fractions:[19]},model.buildPresentation(null,{id:'reopened',clientId:c.id,state:'realized',date:'2026-10-02',channel:'Email',rows:[{fraction:19,officialPrice:500000,informedPrice:490000}]})]};
assert.equal(model.relation(data,c.id,19).state,'Apresentado','Motor and reopened presentation must agree');
console.log('Reproduced defects fixed: skip means no event; presentation after refusal reopens the canonical relation.');
