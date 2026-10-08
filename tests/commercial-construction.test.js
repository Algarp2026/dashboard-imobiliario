const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'commercial.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'commercial.html'), 'utf8');
const rows = JSON.parse(fs.readFileSync(path.join(root, 'data.json'), 'utf8'));
const storage = new Map();
let requests = 0;
const context = {
  console,
  document: {readyState:'loading', addEventListener(){}},
  window: {THE_VIEW_CONFIG:{}, addEventListener(){}},
  localStorage: {
    getItem(key){return storage.get(key) || null},
    setItem(key,value){storage.set(key,value)}
  },
  fetch(){requests++; throw new Error('A construction flow test must not use the real Sheet')}
};
vm.createContext(context);
const end = source.lastIndexOf('})();');
const exposed = ['state','EVENT_TYPES','PRESENTATION_FORMATS','parseRow','normalizeData','loadDataLocal','saveLocalOnly','isCommercialPresentationEvent','commercialInteractionCounts','eventChannelOptions','eventChannelDetailsHtml','eventFractionsPresented','stageFromEvent','recalculateResumoTodosClientes','applyEventBusinessRules','replaceEventAndReapplyBusinessRules','metrics','clientTimelineItem','getHistoricoComercialFracao','salesColumnDefinitions'];
vm.runInContext(source.slice(0,end) + 'globalThis.constructionTest={' + exposed.join(',') + '};' + source.slice(end),context);
const app = context.constructionTest;
app.state.rows = rows.map(app.parseRow);
app.state.fractions = app.state.rows.filter(row => row.isTheView);
app.state.data = app.normalizeData({
  finalPrices:{24:710000,30:950000}, statuses:{30:'Indisponível',36:'Vendido'},
  salePrices:{36:1400000}, unavailableReasons:{30:'Existing reason'},
  priceHistory:{24:[{date:'2026-09-01',price:710000,reason:'Existing entry'}]},
  saleCommissions:{36:{agentId:'agent-old',amount:42000}},
  clients:[
    {id:'client-old',name:'Existing client',stage:'Apresentado',legacyStageFallback:'Apresentado',fractions:[24],notes:'Existing client notes'},
    {id:'client-active',name:'Active client',stage:'Em negociação',stageManual:true,manualStage:'Em negociação',legacyStageFallback:'Em negociação',fractions:[],notes:'Preserve these notes'}
  ],
  events:[
    {id:'visit-old',clientId:'client-old',type:'Visita',date:'2026-09-01',time:'10:00',fractions:[24],channel:'SMS',notes:'Original visit record',legacyField:'Preserved'},
    {id:'meeting-old',clientId:'client-old',type:'Reunião realizada',date:'2026-09-02',fractions:[24],notes:'Original meeting'},
    {id:'prices-old',clientId:'client-old',type:'Preços informados',date:'2026-09-03',fractions:[24],informedPrices:[{fraction:24,officialPrice:710000,informedPrice:700000}]}
  ],
  agents:[{id:'agent-old',name:'Existing agent'}]
});
app.recalculateResumoTodosClientes();
const initial = JSON.parse(JSON.stringify(app.state.data));
const dataBeforeRead = JSON.stringify(app.state.data), rowsBefore = JSON.stringify(rows);

assert.ok(app.EVENT_TYPES.includes('Apresentação comercial'));
assert.ok(app.EVENT_TYPES.includes('Documentação enviada'));
assert.ok(!app.EVENT_TYPES.includes('Visita'));
assert.ok(!app.EVENT_TYPES.includes('Reunião realizada'));
assert.equal(app.stageFromEvent({type:'Apresentação comercial'}),'');
assert.equal(app.stageFromEvent({type:'Documentação enviada'}),'');
assert.equal(app.stageFromEvent(initial.events[0]),'Apresentado');
assert.equal(app.eventFractionsPresented({type:'Apresentação comercial'}),true);
assert.equal(app.eventFractionsPresented({type:'Documentação enviada'}),false);
assert.equal(app.metrics(24).visits,2);
assert.equal(app.metrics(24).presentations,0);
assert.equal(app.commercialInteractionCounts().presentations,0);
assert.equal(app.commercialInteractionCounts().documentation,0);
assert.match(app.clientTimelineItem(initial.events[0]),/Visita/);
assert.match(app.clientTimelineItem(initial.events[0]),/Original visit record/);
assert.ok(app.getHistoricoComercialFracao(24).some(row => row.eventId === 'visit-old'));
assert.ok(app.eventChannelOptions('Apresentação comercial').includes('Videoconferência'));
assert.ok(!app.eventChannelOptions('Apresentação comercial').includes('value="Email"'));
assert.ok(app.eventChannelOptions('Documentação enviada').includes('value="Email"'));
assert.ok(app.eventChannelOptions('Visita','SMS',true).includes('value="SMS"'));
assert.equal(app.eventChannelDetailsHtml({type:'Apresentação comercial',channel:'Telefone'}),'<p class="muted small">Formato da apresentação: Telefone</p>');
assert.ok(app.salesColumnDefinitions().some(column => column.key === 'visits' && column.label === 'Visitas históricas'));
assert.ok(app.salesColumnDefinitions().some(column => column.key === 'presentations'));
assert.equal(JSON.stringify(app.state.data),dataBeforeRead);
assert.equal(storage.size,0);
assert.equal(requests,0);

for (const [index,format] of Array.from(app.PRESENTATION_FORMATS).entries()) {
  const presentation = {id:'presentation-'+index,clientId:'client-active',type:'Apresentação comercial',date:'2026-10-08',time:'11:00',channel:format,fractions:index === 0 ? [24] : [],notes:'Manual presentation record',followupDate:''};
  app.applyEventBusinessRules(presentation);
  assert.equal(app.state.data.clients.find(client => client.id === 'client-active').stage,'Em negociação');
}
const documentEvent = {id:'documents-new',clientId:'client-active',type:'Documentação enviada',date:'2026-10-08',time:'12:00',channel:'Email',fractions:[30],notes:'Plantas e mapa de acabamentos',followupDate:''};
app.applyEventBusinessRules(documentEvent);
assert.equal(app.metrics(24).visits,2);
assert.equal(app.metrics(24).presentations,1);
assert.equal(app.metrics(30).presentations,0);
assert.equal(app.commercialInteractionCounts().presentations,4);
assert.equal(app.commercialInteractionCounts().documentation,1);
assert.equal(app.state.data.clients.length,initial.clients.length);
assert.equal(app.state.data.events.length,initial.events.length+5);
assert.equal(JSON.stringify(app.state.data.events.slice(0,initial.events.length)),JSON.stringify(initial.events));
assert.equal(JSON.stringify(app.state.data.clients.map(client => client.stage)),JSON.stringify(initial.clients.map(client => client.stage)));
assert.ok(!app.state.data.clients.find(client => client.id === 'client-active').commercialSummary.presentedFractions.includes(30));
assert.ok(app.clientTimelineItem(app.state.data.events.find(event => event.id === 'presentation-1')).includes('Videoconferência'));
assert.ok(app.clientTimelineItem(documentEvent).includes('Documentação enviada'));
for (const key of ['finalPrices','statuses','salePrices','priceHistory','saleCommissions','agents','unavailableReasons']) {
  assert.equal(JSON.stringify(app.state.data[key]),JSON.stringify(initial[key]),key+' changed when recording an interaction');
}
const oldPresentation = app.state.data.events.find(event => event.id === 'presentation-0');
const edited = {...oldPresentation,channel:'Videoconferência',notes:'Edited presentation',fractions:[24,30]};
app.replaceEventAndReapplyBusinessRules(oldPresentation,edited);
assert.equal(app.state.data.events.filter(event => event.id === edited.id).length,1);
assert.equal(app.metrics(30).presentations,1);
assert.equal(JSON.stringify(app.state.data.events.slice(0,initial.events.length)),JSON.stringify(initial.events));
for (const key of ['finalPrices','statuses','salePrices','priceHistory','saleCommissions','agents','unavailableReasons']) {
  assert.equal(JSON.stringify(app.state.data[key]),JSON.stringify(initial[key]),key+' changed during presentation editing');
}
app.saveLocalOnly();
const restored = app.loadDataLocal();
assert.equal(JSON.stringify(restored),JSON.stringify(app.state.data));
assert.equal(restored.events.find(event => event.id === edited.id).channel,'Videoconferência');
assert.equal(restored.events.find(event => event.id === 'visit-old').legacyField,'Preserved');
assert.equal(JSON.stringify(rows),rowsBefore);
assert.ok(!html.includes('<option>Visita</option>'));
assert.ok(!html.includes('2ª Visita'));

// Exercise the unchanged backend against an in-memory Sheet, never Google Sheets.
const sheets = new Map();
function sheet(name){
  if (!sheets.has(name)) sheets.set(name,{
    cells:new Map(),rows:[],
    getRange(key){return {getValue:()=>this.cells.get(key)||'',setValue:value=>this.cells.set(key,value),setValues:values=>{this.rows.push(values)}}},
    getLastRow(){return this.rows.length},clearContents(){this.rows=[]},setFrozenRows(){},appendRow(row){this.rows.push(row)}
  });
  return sheets.get(name);
}
const backend = {
  console,
  SpreadsheetApp:{getActiveSpreadsheet(){return {getSheetByName:name=>sheets.get(name),insertSheet:sheet}}},
  LockService:{getDocumentLock(){return {waitLock(){},releaseLock(){}}}},
  ContentService:{MimeType:{JSON:'json',JAVASCRIPT:'javascript'},createTextOutput(body){return {body,setMimeType(){return this}}}}
};
vm.createContext(backend);
vm.runInContext(fs.readFileSync(path.join(root,'google_apps_script.gs'),'utf8'),backend);
const payload = JSON.stringify({action:'save',data:restored,updatedAt:'2026-10-08T12:00:00Z'});
assert.equal(JSON.parse(backend.doPost({parameter:{payload}}).body).ok,true);
assert.equal(sheet('Store').cells.get('B2'),JSON.stringify(restored));
assert.equal(JSON.stringify(JSON.parse(backend.doGet({parameter:{action:'load'}}).body).data),JSON.stringify(restored));
assert.equal(JSON.parse(backend.doPost({postData:{contents:payload}}).body).ok,true);
assert.equal(JSON.parse(backend.doGet().body).ok,true);
assert.ok(backend.doGet({parameter:{action:'load',callback:'testCallback'}}).body.startsWith('testCallback('));
const storedBeforeInvalid = sheet('Store').cells.get('B2');
assert.equal(JSON.parse(backend.doPost({}).body).ok,false);
assert.equal(sheet('Store').cells.get('B2'),storedBeforeInvalid);
for (const name of ['Clientes','Eventos','Agentes','EstadosVendas','PrecosHistorico','VendasComissoes']) assert.ok(sheets.has(name),name+' mirror missing');

// Existing closing rules still apply only to explicit negotiation/reservation/sale events.
app.state.data = app.normalizeData(JSON.parse(JSON.stringify(restored)));
app.applyEventBusinessRules({id:'negotiation-test',clientId:'client-active',type:'Contra-proposta recebida',date:'2026-10-09',fractions:[24],amount:680000});
assert.ok(app.metrics(24).proposals > 0);
app.applyEventBusinessRules({id:'reservation-test',clientId:'client-active',type:'Reserva efetuada',date:'2026-10-10',fractions:[24],amount:700000});
assert.equal(app.state.data.statuses[24],'Reservado');
assert.equal(app.state.data.salePrices[24],700000);
app.applyEventBusinessRules({id:'cancellation-test',clientId:'client-active',type:'Reserva cancelada',date:'2026-10-11',fractions:[24]});
assert.equal(app.state.data.statuses[24],undefined);
app.applyEventBusinessRules({id:'sale-test',clientId:'client-active',type:'Venda concluída',date:'2026-10-12',fractions:[24],amount:700000,withAgent:true,agentId:'agent-old',commissionType:'percent',commissionValue:3,commissionAmount:21000});
assert.equal(app.state.data.statuses[24],'Vendido');
assert.equal(app.state.data.saleCommissions[24].amount,21000);
assert.equal(app.state.data.saleCommissions[24].netRevenue,679000);
assert.equal(app.state.data.saleCommissions[24].agentId,'agent-old');
app.applyEventBusinessRules({id:'post-sale-presentation',clientId:'client-active',type:'Apresentação comercial',date:'2026-10-13',channel:'Telefone',fractions:[24]});
assert.equal(app.state.data.statuses[24],'Vendido');
assert.equal(app.state.data.saleCommissions[24].eventId,'sale-test');
assert.equal(app.state.data.clients.find(client => client.id === 'client-active').stage,'Vendido');
assert.equal(app.state.data.statuses[30],'Indisponível');
assert.equal(JSON.stringify(app.state.data.finalPrices),JSON.stringify(initial.finalPrices));
assert.equal(JSON.stringify(app.state.data.priceHistory),JSON.stringify(initial.priceHistory));
assert.equal(requests,0);
console.log('construction CRM tests passed: formats, historical visits, separate counts, unchanged stages/prices, editing, reservation/sale/commission and local/Apps Script round-trip');
