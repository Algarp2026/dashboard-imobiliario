'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const model=require('../commercial-client-workflow.js');
const c={id:'fiction',name:'Cliente ficticio',fractions:[1,2,3],presentationSelection:[1,2,3]},other={id:'untouched'};
const data={clients:[c,other],events:[],statuses:Object.fromEntries(Array.from({length:39},(_,i)=>[i+1,'Disponível'])),finalPrices:{},statusEventIds:{},saleCommissions:{},priorityHistory:[]};
const context={window:{THE_VIEW_CLIENT_WORKFLOW:model}};vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../commercial-client-workflow-ui.js'),'utf8'),context);
const escape=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const ui=context.window.createClientWorkflow({esc:escape,icon:()=>'',today:()=> '2026-10-16',events:()=>data.events,data:()=>data,selection:()=>c.presentationSelection,rows:()=>Array.from({length:39},(_,i)=>({number:i+1,typology:'T2',floorLabel:'2'})),status:r=>data.statuses[r.number],price:()=> '500.000',money:x=>String(x),followup:()=>null,facts:rows=>rows.map(row=>row.join(':')).join('|'),timeline:e=>`<p data-event="${e.id}">${escape(e.notes)}</p>`,general:()=>{throw Error('No duplicated general section')}});
const render=()=>{const before=JSON.stringify(data),html=ui.negotiationMarkup(c);assert.equal(JSON.stringify(data),before,'Rendering must not mutate any JSON');return html};
const card=(n,group,html=render())=>assert.match(html,new RegExp(`data-negotiation-unit="${n}" data-opportunity-group="${group}"`));
const absent=n=>assert.doesNotMatch(render(),new RegExp(`data-negotiation-unit="${n}"`));
const event=(id,n,type,date='2026-10-01',extra={})=>({id,clientId:c.id,type,date,fractions:[n],...extra});
const present=(id,n,date='2026-10-01')=>model.buildPresentation(null,{id,clientId:c.id,state:'realized',date,channel:'Email',rows:[{fraction:n,informedPrice:490000,officialPrice:500000}]});
absent(1);absent(2);absent(3);
data.events.push(model.buildPresentation(null,{id:'draft',clientId:c.id,state:'draft',date:'2026-10-01',channel:'Email',rows:[{fraction:1,informedPrice:0,officialPrice:500000}]}));absent(1);
data.events.push(event('docs',2,'Documentação enviada'),event('association',3,'Outro'));absent(2);absent(3);
data.events.push(present('shown',9));card(9,'presented');assert.match(render(),/>Apresentado</);assert.doesNotMatch(render(),/data-opportunity-section="active"/);
data.events.push(present('shown-again',9,'2026-10-02'));assert.equal((render().match(/data-negotiation-unit="9"/g)||[]).length,1);
data.events.push(event('interest',9,'Acompanhamento da fração','2026-10-03',{interest:'Interessado',negotiationVersion:1}));card(9,'interested');
data.events.push(event('offer',9,'Proposta recebida','2026-10-04',{amount:470000}));card(9,'active');
data.events.push(event('counter',9,'Contra-proposta enviada','2026-10-05',{amount:480000}));card(9,'active');assert.match(render(),/480000/);
data.events.push(present('second-unit',24),event('unit-withdrawal',24,'Desistência','2026-10-06',{scope:'fraction',globalWithdrawal:false}));card(24,'closed');card(9,'active');assert.doesNotMatch(render(),/id="clientClosedOpportunities" open/);
data.events.push(event('global',0,'Desistência','2026-10-07',{fractions:[],globalWithdrawal:true,scope:'global'}));card(9,'closed');
data.events.push(event('admin',9,'Preferências recebidas','2026-10-08',{administrative:true}));card(9,'closed');
data.events.push(event('qualify',0,'Preferências recebidas','2026-10-09',{fractions:[],administrative:true,requalificationConfirmed:true}));card(9,'closed');assert.equal(model.clientProjection(data,c).stage,'Qualificado');
data.events.push(event('renewed-interest',9,'Acompanhamento da fração','2026-10-09',{time:'12:00',negotiationVersion:1,interest:'Interessado'}));card(9,'interested');assert.doesNotMatch(render(),/data-opportunity-section="presented"/);
data.events.push(event('reserve',9,'Reserva efetuada','2026-10-10',{amount:480000}));data.statuses[9]='Reservado';data.statusEventIds[9]='reserve';card(9,'completed');
data.events.push(event('cancel',9,'Reserva cancelada','2026-10-11'));data.statuses[9]='Disponível';data.statusEventIds[9]='cancel';card(9,'interested');
data.events.push(event('reopen',9,'Nova proposta recebida','2026-10-12',{amount:485000}));card(9,'active');
data.events.push(event('sold',9,'Venda concluída','2026-10-13',{amount:485000}));data.statuses[9]='Vendido';data.statusEventIds[9]='sold';card(9,'completed');
data.events.push(event('legacy',30,'Preços informados','2026-09-01',{informedPrices:[{fraction:30,informedPrice:400000}]}));card(30,'closed');
data.events.push(event('legacy-current',30,'Preços informados','2026-10-14',{informedPrices:[{fraction:30,informedPrice:410000}]}));card(30,'presented');
data.events.push(event('unknown',50,'Proposta recebida'));card(50,'closed');assert.match(render(),/Fração desconhecida/);
assert.deepEqual(other,{id:'untouched'});assert.deepEqual(c.presentationSelection,[1,2,3]);
assert.match(fs.readFileSync(require.resolve('../commercial.html'),'utf8'),/view-theme.css/);assert.match(fs.readFileSync(require.resolve('../comparador.html'),'utf8'),/view-theme.css/);
console.log('Opportunity cards: selection/draft/document exclusion, realized vs interested, deduplication, offers, independent withdrawals, global cycles, closing/cancellation/reopening, legacy and incomplete data; no mutations.');

// Independent audit regressions: each scenario starts from a fresh fictitious source.
function reset(){data.events=[];data.statuses=Object.fromEntries(Array.from({length:39},(_,i)=>[i+1,'Disponível']));data.statusEventIds={}}
reset();data.events=[event('first-offer',9,'Proposta recebida','2026-10-01',{amount:470000}),{...event('third-party-sale',9,'Venda concluída','2026-10-02',{amount:480000}),clientId:other.id}];data.statuses[9]='Vendido';data.statusEventIds[9]='third-party-sale';
card(9,'unavailable');assert.match(render(),/Vendido a outro cliente/);assert.doesNotMatch(render(),/data-opportunity-section="active"|>Desistiu</);assert.match(render(),/data-opportunity-origin="third-party-sale"/);assert.match(render(),/data-event="first-offer"/);assert.doesNotMatch(render(),/data-event="third-party-sale"/,'Another client sale is identified, not editable as this client event');
data.statuses[9]='Reservado';data.events[1].type='Reserva efetuada';card(9,'unavailable');assert.match(render(),/Reservado a outro cliente/);
delete data.statusEventIds[9];card(9,'unavailable');assert.match(render(),/titularidade por confirmar/);
data.statuses[9]='Indisponível';card(9,'unavailable');

reset();data.events=[event('simple-visit',9,'Visita')];absent(9);
for(const price of [0,-1,NaN,Infinity]){data.events[0].informedPrices=[{fraction:9,informedPrice:price}];absent(9)}
data.events[0].informedPrices=[{fraction:24,informedPrice:400000}];absent(9);
data.events.push(event('legacy-offer',9,'Proposta recebida','2026-10-02',{amount:470000}));card(9,'active');

reset();data.events=[present('initial-show',9),event('refusal',9,'Acompanhamento da fração','2026-10-02',{interest:'Sem interesse',negotiationVersion:1})];card(9,'closed');
data.events.push(event('unpriced-revisit',9,'Visita','2026-10-03'));card(9,'closed');
data.events.push(present('valid-reshow',9,'2026-10-04'));card(9,'presented');assert.equal(model.relation(data,c.id,9).state,'Sem interesse','Protected model remains unchanged; only visual reopening is projected');
assert.match(render(),/data-event="refusal"/);assert.equal((render().match(/data-negotiation-unit="9"/g)||[]).length,1);
data.events.push(event('new-offer',9,'Proposta recebida','2026-10-05',{amount:480000}));card(9,'active');

reset();const global={...event('global-origin',0,'Desistência','2026-10-05',{fractions:[],scope:'global',globalWithdrawal:true,notes:'Encerramento ficticio',time:'12:30'})};data.events=[present('previous-show',9),global];card(9,'closed');
assert.match(render(),/ux-opportunity-last"><span>Desistência global · 2026-10-05/);assert.match(render(),/data-opportunity-origin="global-origin"/);assert.match(render(),/Desistência global do cliente/);assert.match(render(),/data-event="global-origin"/);assert.deepEqual(global.fractions,[]);
data.events.push(event('bad-global',0,'Desistência','2026-10-06',{fractions:[],scope:'global',globalWithdrawal:false}));assert.doesNotMatch(render(),/data-opportunity-origin="bad-global"/);
console.log('Audit regressions PASS: third-party availability, visits without positive unit price, valid reopening after refusal, and global withdrawal provenance; JSON and protected model untouched.');
