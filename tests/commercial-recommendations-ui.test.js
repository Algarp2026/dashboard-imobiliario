const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const engine=require('../commercial-recommendations.js');
const root=path.resolve(__dirname,'..');
for(const page of ['index.html','commercial.html']){
  const html=fs.readFileSync(path.join(root,page),'utf8');
  assert.equal((html.match(/<script src="commercial-recommendations\.js" defer><\/script>/g)||[]).length,1,page+' must load the recommendation engine exactly once');
  assert.match(html,/<script src="commercial-recommendations\.js" defer><\/script>\s*<script src="config\.js" defer><\/script>\s*<script src="commercial\.js" defer><\/script>/,page+' must load the engine before configuration and the commercial application');
}
const source=fs.readFileSync(path.join(root,'commercial.js'),'utf8');
const rows=JSON.parse(fs.readFileSync(path.join(root,'data.json'),'utf8'));
let writes=0,requests=0;
const container={innerHTML:''};
const context={
  console,
  document:{readyState:'loading',addEventListener(){},getElementById(id){return id==='clientRecommendation'?container:null},querySelector(){return null}},
  window:{THE_VIEW_CONFIG:{},THE_VIEW_RECOMMENDATIONS:engine,addEventListener(){}},
  localStorage:{getItem(){return null},setItem(){writes++},removeItem(){writes++}},
  fetch(){requests++;throw new Error('Recommendation UI must not access the real Sheet')}
};
vm.createContext(context);
const end=source.lastIndexOf('})();');
vm.runInContext(source.slice(0,end)+'globalThis.test={state,commercialUx,parseRow,commercialRecommendationInput,commercialClientRecommendation,commercialRecommendationQueueMarkup,clientRecommendationMarkup,refreshClientRecommendations,clientFractionTiles};'+source.slice(end),context);
const app=context.test;
app.state.rows=rows.map(app.parseRow);app.state.fractions=app.state.rows.filter(row=>row.isTheView);
const daysAgo=days=>new Date(Date.now()-days*86400000).toISOString().slice(0,10);
app.state.data={
  finalPrices:{24:750000},statuses:{27:'Indisponível',36:'Vendido'},priceHistory:{},salePrices:{36:1400000},saleCommissions:{36:{amount:42000}},agents:[],
  clients:[
    {id:'lead',name:'Lead <unsafe>',stage:'Novo Lead',preferences:{},budget:0,fractions:[]},
    {id:'presentation',name:'Presentation',stage:'Apresentado',preferences:{typology:'T2'},budget:800000,fractions:[]},
    {id:'future',name:'Future plan',stage:'Qualificado',preferences:{typology:'T2'},budget:800000,manualNextFollowup:'2099-01-01',manualNextStep:'Preserve exact plan',fractions:[]},
    {id:'closed',name:'Closed',stage:'Vendido',preferences:{},fractions:[36]}
  ],
  events:[
    {id:'incoming',clientId:'lead',type:'Pedido de informação recebido',date:daysAgo(5),time:'10:00',channel:'Email',fractions:[]},
    {id:'show',clientId:'presentation',type:'Apresentação comercial',date:daysAgo(5),time:'10:00',channel:'Videoconferência',fractions:[24]},
    {id:'legacy',clientId:'closed',type:'Visita',date:daysAgo(12),fractions:[36],notes:'Original historical event'}
  ]
};
const snapshot=JSON.stringify(app.state.data),rowSnapshot=JSON.stringify(rows);
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value)}}
freeze(app.state.data);freeze(app.state.fractions);
const input=app.commercialRecommendationInput();
assert.equal(input.fractions.find(f=>f.number===24).currentPrice,750000);
assert.equal(input.fractions.find(f=>f.number===27).statusConfirmed,true);
assert.equal(input.fractions.find(f=>f.number===24).statusConfirmed,false);
assert.ok(!('recommendedPrice' in input.fractions[0]));
assert.equal(input.fractions.find(f=>f.number===24).reservationClientId,'');
const queue=app.commercialRecommendationQueueMarkup();
assert.match(queue,/Atenção comercial/);assert.match(queue,/Lead &lt;unsafe&gt;/);assert.ok(!queue.includes('Lead <unsafe>'));
assert.match(queue,/data-ux-recommendation-filter="all" aria-pressed="true"/);
assert.match(queue,/data-ux-client="lead"/);assert.match(queue,/data-ux-client="presentation"/);
assert.ok(!queue.includes('data-ux-client="future"'));assert.ok(!queue.includes('data-ux-client="closed"'));
app.commercialUx.recommendationPriority='Alta';
const high=app.commercialRecommendationQueueMarkup();assert.match(high,/data-ux-client="lead"/);assert.ok(!high.includes('data-ux-client="presentation"'));
app.commercialUx.recommendationPriority='Baixa';assert.match(app.commercialRecommendationQueueMarkup(),/Sem recomendações nesta prioridade/);
const presentation=app.commercialClientRecommendation(app.state.data.clients[1]);
const markup=app.clientRecommendationMarkup(presentation);assert.match(markup,/Próxima ação recomendada/);assert.match(markup,/Fazer follow-up da apresentação/);
assert.match(markup,/data-ux-recommendation-action="contact"/);assert.match(markup,/data-ux-edit-event="show"/);
assert.ok((markup.match(/data-recommendation-code=/g)||[]).length<=3);
const alreadyDefined={...presentation,primary:{...presentation.primary,alreadyDefined:true}};
assert.match(app.clientRecommendationMarkup(alreadyDefined),/Próxima ação já definida/);
assert.ok(!app.clientRecommendationMarkup(alreadyDefined).includes('<h4>Fazer follow-up da apresentação</h4>'));
const future=app.commercialClientRecommendation(app.state.data.clients[2]);assert.equal(future.primary,null);assert.equal(future.manual.step,'Preserve exact plan');
assert.match(app.clientRecommendationMarkup(future),/Aguardar a próxima ação definida/);
app.state.selectedClientId='presentation';app.refreshClientRecommendations();assert.equal(container.innerHTML,markup);
const f=app.state.fractions.find(f=>f.number===24);
assert.match(app.clientFractionTiles([f],'', [{number:24,preferred:['Piso','Orientação']}]),/Preferências coincidentes: Piso · Orientação/);
assert.equal(JSON.stringify(app.state.data),snapshot);assert.equal(JSON.stringify(rows),rowSnapshot);assert.equal(writes,0);assert.equal(requests,0);
assert.equal(app.state.fractions.length,39);
app.state.data={...app.state.data,statuses:{...app.state.data.statuses,24:'Reservado'},clients:[
  {id:'old-owner',name:'Old reservation fixture',stage:'Reservado',preferences:{},budget:0,fractions:[24]},
  {id:'new-owner',name:'Current reservation fixture',stage:'Reservado',preferences:{},budget:0,fractions:[24]}
],events:[
  {id:'old-reservation',clientId:'old-owner',type:'Reserva efetuada',date:daysAgo(8),fractions:[24]},
  {id:'current-reservation',clientId:'new-owner',type:'Reserva efetuada',date:daysAgo(5),fractions:[24]}
]};
freeze(app.state.data);const reservationSnapshot=JSON.stringify(app.state.data);
assert.equal(app.commercialRecommendationInput().fractions.find(f=>f.number===24).reservationClientId,'new-owner');
assert.equal(app.commercialClientRecommendation(app.state.data.clients[0]).primary.code,'unavailable');
assert.equal(app.commercialClientRecommendation(app.state.data.clients[1]).primary,null);
assert.equal(JSON.stringify(app.state.data),reservationSnapshot);assert.equal(writes,0);assert.equal(requests,0);
console.log('commercial recommendation UI tests passed: same engine, current prices, filters, references, manual plans, immutable CRM and zero writes/requests');
