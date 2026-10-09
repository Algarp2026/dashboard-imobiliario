const assert=require('node:assert/strict');
const engine=require('../commercial-recommendations.js');
const now='2026-10-09T12:00:00Z';
const stock=[
  {number:24,typology:'T2',floor:3,orientation:'Sul/Oeste',currentPrice:750000,status:'Disponível',statusConfirmed:true},
  {number:25,typology:'T2',floor:0,orientation:'Este',currentPrice:775000,status:'Disponível',statusConfirmed:true},
  {number:26,typology:'T2',floor:2,orientation:'Oeste',currentPrice:825000,status:'Disponível',statusConfirmed:true},
  {number:27,typology:'T2',floor:0,orientation:'Sul',currentPrice:700000,status:'Indisponível',statusConfirmed:true},
  {number:28,typology:'T1+1',floor:1,orientation:'Este',currentPrice:450000,status:'Disponível',statusConfirmed:true}
];
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value)}return value}
function client(overrides={}){return{id:'c1',name:'Isolated fixture',stage:'Qualificado',preferences:{typology:'T2'},budget:800000,manualFractions:[],fractions:[],...overrides}}
function event(type,date='2026-10-05',overrides={}){return{id:'e1',clientId:'c1',type,date,time:'10:00',fractions:[],...overrides}}
function run(c,events=[],overrides={}){
  const input={clients:[c],events,fractions:stock,priceHistory:{},now,...overrides};
  const snapshot=JSON.stringify(input);freeze(input);
  const report=engine.evaluate(input);
  assert.equal(JSON.stringify(input),snapshot,'The engine mutated its inputs');
  return report.clients[0].recommendation;
}
const contact=event('Outro','2026-10-05',{channel:'Telefone'});
const preferenceContact=event('Preferências recebidas');
const scenarios=[];
function test(name,callback){callback();scenarios.push(name)}

test('1. new client without contact and calendar-day priority',()=>{
  const c=client({stage:'Novo Lead',preferences:{},budget:0});
  const rec=run(c,[event('Pedido de informação recebido','2026-10-07',{channel:'Email'})]);
  assert.equal(rec.primary.code,'first-contact');assert.equal(rec.primary.priority,'Alta');
  assert.equal(run(c,[event('Pedido de informação recebido','2026-10-08')]).primary.priority,'Média');
});
test('2. actual contact is separate from the initial request',()=>{
  const rec=run(client({preferences:{},budget:0}),[event('Pedido de informação recebido','2026-10-01'),contact]);
  assert.equal(rec.primary.code,'qualification');assert.ok(!rec.secondary.some(rec=>rec.code==='first-contact'));
});
test('3. qualification lists only missing essential fields',()=>{
  const rec=run(client({budget:0}),[contact]);assert.equal(rec.primary.code,'qualification');
  assert.deepEqual(rec.primary.reference.missing,['Intervalo de investimento']);
  const complete=run(client({budget:0,budgetMin:550000,budgetMax:800000}),[contact]);
  assert.notEqual(complete.primary.code,'qualification');assert.ok(!complete.primary.reason.includes('piso'));
});
test('4. compatible units use current price; floor and orientation are preferences',()=>{
  const rec=run(client({preferences:{typology:'T2',floor:'Rés-do-chão',orientation:'Este'}}),[preferenceContact]);
  assert.equal(rec.primary.code,'matching');assert.deepEqual(rec.matching.matches.map(f=>f.number),[25,24]);
  assert.deepEqual(rec.matching.matches[0].preferred,['Piso','Orientação']);
  assert.ok(!rec.matching.matches.some(f=>[26,27].includes(f.number)));
  const unknown=run(client({preferences:{typology:'talvez T2'}}),[preferenceContact]);assert.equal(unknown.matching.known,false);
  const empty=run(client({budget:600000}),[preferenceContact]);assert.equal(empty.matching.matches.length,0);assert.match(empty.primary.reason,/Não foram encontradas/);
});
test('5. documentation follow-up requires three days and no later contact',()=>{
  const rec=run(client(),[event('Documentação enviada')]);assert.equal(rec.primary.code,'documentation-followup');
  assert.ok(!rec.primary.reason.includes('apresentação'));
  const later=run(client(),[event('Documentação enviada'),event('Outro','2026-10-08',{id:'e2',channel:'Telefone'})]);
  assert.equal(later.primary,null);assert.equal(later.status,'cooldown');
});
test('6. presentations are exact types; legacy visits are not presentations',()=>{
  assert.equal(run(client(),[event('Apresentação comercial')]).primary.code,'presentation-followup');
  const old=run(client({stage:'Apresentado'}),[event('Visita')]);assert.equal(old.primary,null);
  assert.ok(!run(client(),[event('Preços informados')]).primary);
});
test('7. explicit interest does not automatically propose a sale',()=>{
  const rec=run(client({manualFractions:[24],fractions:[24]}),[contact]);assert.equal(rec.primary.code,'interest');
  assert.deepEqual(rec.primary.reference.fractions,[24]);assert.ok(!rec.primary.quickActions.some(action=>action.id==='proposal'));
  assert.ok(!rec.secondary.some(rec=>rec.code==='matching'));
  const presentation=run(client(),[event('Apresentação comercial','2026-10-05',{fractions:[24],interest:'4 — Interesse elevado'})]);
  assert.equal(presentation.primary.code,'presentation-followup');assert.ok(!presentation.secondary.some(rec=>rec.group==='contact'));
});
test('8. pending outgoing proposal takes precedence over qualification',()=>{
  const rec=run(client({budget:0,preferences:{}}),[event('Contra-proposta enviada','2026-10-05',{fractions:[24],amount:700000})]);
  assert.equal(rec.primary.code,'proposal');assert.equal(rec.primary.priority,'Alta');assert.deepEqual(rec.primary.reference.fractions,[24]);
  assert.ok(!rec.secondary.some(rec=>rec.code==='qualification'));
});
test('9. completed or answered proposals are not pending',()=>{
  assert.equal(run(client(),[event('Proposta enviada','2026-10-05',{proposalStatus:'Aceite'})]).primary,null);
  assert.equal(run(client(),[event('Contra-proposta enviada'),event('Contra-proposta recebida','2026-10-07',{id:'answer'})]).primary,null);
  const pdfOnly=run(client(),[event('Outro','2026-10-05',{channel:'PDF',notes:'Proposta enviada'})]);
  assert.notEqual(pdfOnly.primary?.code,'proposal');
});
test('10. confirmed unavailability, not a negotiation; own reservation excluded',()=>{
  const c=client({manualFractions:[27],fractions:[27]});
  const rec=run(c,[contact]);assert.equal(rec.primary.code,'unavailable');assert.equal(rec.primary.priority,'Alta');assert.deepEqual(rec.primary.reference.alternatives,[24,25]);
  assert.notEqual(run(c,[contact],{fractions:stock.map(f=>f.number===27?{...f,status:'Em análise'}:f)}).primary?.code,'unavailable');
  assert.notEqual(run(c,[contact],{fractions:stock.map(f=>f.number===27?{...f,statusConfirmed:false}:f)}).primary?.code,'unavailable');
  const own=run(client({stage:'Reservado',manualFractions:[24],fractions:[24]}),[event('Reserva efetuada','2026-10-05',{fractions:[24]})],{fractions:stock.map(f=>f.number===24?{...f,status:'Reservado',reservationClientId:'c1'}:f)});
  assert.equal(own.primary,null);
  const reassigned=run(client({stage:'Reservado',manualFractions:[24],fractions:[24]}),[event('Reserva efetuada','2026-10-05',{fractions:[24]})],{fractions:stock.map(f=>f.number===24?{...f,status:'Reservado',reservationClientId:'other-client'}:f)});
  assert.equal(reassigned.primary.code,'unavailable');
});
test('11. reliable commercial-price history only, after the contact',()=>{
  const c=client({fractions:[24]});
  const rec=run(c,[contact],{priceHistory:{24:[{date:'2026-10-01',price:700000},{date:'2026-10-08',price:750000,oldPrice:700000}]}});
  assert.equal(rec.primary.code,'commercial-price');assert.deepEqual(rec.primary.reference.fractions,[24]);
  assert.notEqual(run(c,[contact],{priceHistory:{24:[{date:'2026-10-08',price:750000}]}}).primary?.code,'commercial-price');
  assert.notEqual(run(c,[contact],{priceHistory:{24:[{date:'2026-10-05',price:750000,oldPrice:700000}]}}).primary?.code,'commercial-price');
  assert.notEqual(run(c,[contact],{priceHistory:{24:[{date:'invalid',price:700000},{date:'2026-10-08',price:750000}]}}).primary?.code,'commercial-price');
});
test('12. recommended/target price changes never trigger the price rule',()=>{
  const c=client({fractions:[24]});
  const rec=run(c,[contact],{fractions:stock.map(f=>({...f,recommendedPrice:999999,targetPrice:888888})),recommendedPriceHistory:{24:[{date:'2026-10-08',price:999999}]}});
  assert.notEqual(rec.primary?.code,'commercial-price');
});
test('13. future manual actions override ordinary automatic suggestions',()=>{
  const rec=run(client({manualNextFollowup:'2026-10-15',manualNextStep:'Contactar na data acordada'}),[event('Contra-proposta enviada')]);
  assert.equal(rec.primary,null);assert.equal(rec.status,'waiting');assert.equal(rec.manual.step,'Contactar na data acordada');
  const urgent=run(client({manualNextFollowup:'2026-10-15',fractions:[27]}),[contact]);assert.equal(urgent.primary.code,'unavailable');
});
test('14. overdue and due-today manual actions have precedence',()=>{
  const rec=run(client({manualNextFollowup:'2026-10-08',manualNextStep:'Confirmar interesse'}),[event('Outro','2026-10-09',{channel:'Telefone'})]);
  assert.equal(rec.primary.code,'manual-overdue');assert.equal(rec.primary.priority,'Alta');assert.equal(rec.manual.step,'Confirmar interesse');
  assert.equal(run(client({manualNextFollowup:'2026-10-09'}),[contact]).primary.code,'manual-today');
  const eventFuture=run(client(),[event('Documentação enviada','2026-10-05',{followupDate:'2026-10-15',nextStep:'Ligar na data pedida'})]);assert.equal(eventFuture.primary,null);
});
test('15. actual 48-hour interval and missing-time conservative handling',()=>{
  assert.equal(run(client(),[event('Outro','2026-10-07',{channel:'Telefone',time:'14:00'})]).status,'cooldown');
  assert.equal(run(client(),[event('Outro','2026-10-07',{channel:'Telefone',time:'12:00'})]).primary.code,'matching');
  assert.equal(run(client(),[event('Outro','2026-10-07',{channel:'Telefone',time:''})]).status,'cooldown');
  assert.equal(run(client(),[event('Outro','2026-10-09',{channel:'Email',time:'12:00'})]).primary,null);
});
test('16. closed clients and structured do-not-contact flags',()=>{
  for(const stage of ['Vendido','Desistiu','Perdido','Encerrado','Sem interesse'])assert.equal(run(client({stage}),[contact]).primary,null);
  for(const flag of [{doNotContact:true},{contactAllowed:false},{contactConsent:false},{archived:true},{contactPreferences:{doNotContact:true}}])assert.equal(run(client(flag),[contact]).primary,null);
});
test('17. empty/invalid dates and future events do not invent urgency',()=>{
  assert.equal(run(client({preferences:{},budget:0}),[]).primary,null);
  for(const date of ['','invalid','2026-02-30','2026-13-01'])assert.equal(run(client(),[event('Apresentação comercial',date)]).primary,null);
  assert.equal(run(client(),[event('Apresentação comercial','2026-10-10')]).primary,null);
  assert.equal(run(client(),[event('Outro','2026-10-05',{channel:'Telefone',time:'25:00'})]).primary,null);
  assert.equal(run(client(),[contact],{now:'invalid'}).primary,null);
});
test('18. bounded, unique, specific recommendations and deterministic queue',()=>{
  const c=client({fractions:[24,27],manualNextFollowup:'2026-10-08',manualNextStep:'Telefonar'});
  const rec=run(c,[event('Contra-proposta enviada')],{priceHistory:{24:[{date:'2026-10-08',price:750000,oldPrice:700000}]}});
  assert.equal(rec.primary.code,'manual-overdue');assert.ok(rec.secondary.length<=2);
  assert.equal(new Set([rec.primary,...rec.secondary].map(rec=>rec.group)).size,1+rec.secondary.length);
  const input=freeze({clients:[client({id:'c2',name:'B',budget:0,preferences:{}}),client({name:'A',budget:0,preferences:{}})],events:[event('Pedido de informação recebido','2026-10-01'),event('Pedido de informação recebido','2026-10-01',{id:'e2',clientId:'c2'})],fractions:stock,now});
  const first=engine.evaluate(input);assert.deepEqual(first,engine.evaluate(input));assert.equal(first.counts.Alta,2);assert.deepEqual(first.queue.map(item=>item.client.id),['c1','c2']);
});
test('calendar parameters, non-linear process and legacy data are preserved',()=>{
  assert.equal(run(client({stage:'Em negociação'}),[event('Contra-proposta recebida','2026-09-20')]).primary.code,'inactive');
  assert.equal(run(client({stage:'Qualificado',preferences:{},budget:0}),[event('Outro','2026-09-20',{channel:'Telefone'})]).primary.code,'qualification');
  const rec=run(client({stage:'Apresentado'}),[event('Apresentação comercial','2026-10-05')],{settings:{presentationDays:8}});assert.equal(rec.primary,null);
  const lower=run(client({stage:'Qualificado'}),[event('Outro','2026-09-20',{channel:'Telefone'})]);assert.notEqual(lower.primary?.priority,'Alta');
});
test('manual matching actions stay in the queue without a duplicate client headline',()=>{
  const rec=run(client({stage:'Novo Lead',preferences:{},budget:0,manualNextStep:'Realizar primeiro contacto'}),[event('Pedido de informação recebido','2026-10-01')]);
  assert.equal(rec.primary.code,'first-contact');assert.equal(rec.primary.alreadyDefined,true);assert.equal(rec.manual.step,'Realizar primeiro contacto');
  const context=engine.buildContext({events:[],fractions:stock});assert.equal(context.day,null);
  assert.equal(engine.recommendClient(client(),context).status,'unknown');
});
console.log(`commercial recommendation tests passed: ${scenarios.length} scenarios; immutable inputs, calendar thresholds, 48-hour interval, priority and compatibility`);
