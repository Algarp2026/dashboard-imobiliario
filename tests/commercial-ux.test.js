const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'commercial.js'), 'utf8');
const rows = JSON.parse(fs.readFileSync(path.join(root, 'data.json'), 'utf8'));
const end = source.lastIndexOf('})();');
let businessWrites = 0, requests = 0;
const uiStorage = new Map();
const bar = {innerHTML:'',classList:{toggle(){}}};
const context = {
  console,
  document:{readyState:'loading',addEventListener(){},querySelector(){return null},querySelectorAll(){return []},getElementById(id){return id==='quickComparisonBar'?bar:null},body:{style:{},classList:{toggle(){}}}},
  window:{THE_VIEW_CONFIG:{},addEventListener(){}},
  localStorage:{getItem(){return null},setItem(){businessWrites++},removeItem(){businessWrites++}},
  sessionStorage:{getItem(key){return uiStorage.get(key)||null},setItem(key,value){uiStorage.set(key,value)}},
  fetch(){requests++;throw new Error('Unexpected network request')}
};
vm.createContext(context);
vm.runInContext(source.slice(0,end)+
  'globalThis.uxTest={state,el,commercialUx,parseRow,fractionPriceSummary,fractionPriceMarkup,fractionReference,relatedFractionClients,relatedClientFractions,compatibleClientFractions,clientCompatibilityCriteria,clientTimelineItem,fractionContextHistory,fractionDecisionMarkup,salesColumnDefinitions,displayMoney,operationalCommercialSummary,operationalActionsMarkup,sortedUxFractions,toggleQuickComparison,captureCommercialContext,persistCommercialContext};'+source.slice(end),context);
const app=context.uxTest;
app.state.rows=rows.map(app.parseRow);
app.state.fractions=app.state.rows.filter(row=>row.isTheView);
app.el.compareResult={innerHTML:''};
app.el.compareFractions={options:app.state.fractions.map(f=>({value:String(f.number),selected:false})),get selectedOptions(){return this.options.filter(option=>option.selected)}};

// Disposable fixtures exercise presentation only, never the real store or Sheets.
app.state.data={
  finalPrices:{24:750000},statuses:{30:'Indisponível',36:'Vendido'},salePrices:{36:1400000},
  priceHistory:{24:[{date:'2026-09-01',price:700000},{date:'2026-09-02',price:750000}]},
  clients:[
    {id:'ux-active',name:'Presentation fixture',stage:'Em negociação',fractions:[24],manualNextFollowup:'2099-01-01',manualNextStep:'Contactar'},
    {id:'ux-new',name:'New lead fixture',stage:'Novo Lead',fractions:[]},
    {id:'ux-sold',name:'Closed fixture',stage:'Vendido',fractions:[36]}
  ],
  events:[{id:'ux-offer',clientId:'ux-active',type:'Contra-proposta recebida',date:'2026-10-01',fractions:[24],amount:680000}],
  agents:[{id:'ux-agent',name:'Agent fixture'}],saleCommissions:{36:{agentId:'ux-agent',amount:42000}},unavailableReasons:{30:'Existing reason'}
};
const before=JSON.stringify(app.state.data),rowsBefore=JSON.stringify(rows);
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value)}}
freeze(app.state.data);
const fraction=app.state.fractions.find(f=>f.number===24);
const price=app.fractionPriceSummary(fraction);
assert.equal(price.current,750000);
assert.equal(price.base,700000);
assert.equal(price.recommended,775000);
assert.equal(price.difference,25000);
assert.ok(Math.abs(price.percent-3.3333333333333335)<1e-10);
assert.match(app.fractionPriceMarkup(fraction),/Preço Comercial Atual/);
assert.match(app.fractionReference(fraction,true),/data-ux-select="24"/);
assert.deepEqual(Array.from(app.relatedFractionClients(24),c=>c.id),['ux-active']);
assert.equal(app.fractionPriceSummary({...fraction,raw:{}}).recommended,null);
assert.equal(app.displayMoney(750000),'750.000 €');
assert.equal(app.displayMoney(7514),'7.514 €');
assert.equal(app.displayMoney(99.74,2),'99,74 €');
assert.deepEqual(Array.from(app.salesColumnDefinitions().filter(column=>column.default),column=>column.key),['number','typology','floor','totalArea','current','recommended','status']);
assert.equal(app.compatibleClientFractions({preferences:{},budget:0}),null);
assert.equal(app.compatibleClientFractions({preferences:{typology:'T2',floor:'piso alto'},budget:800000}),null);
assert.equal(app.compatibleClientFractions({preferences:{typology:'talvez T2'},budget:800000}),null);
const matches=app.compatibleClientFractions({preferences:{typology:'T2',floor:'≥ 2'},budget:800000});
assert.ok(matches.length>0);
assert.ok(matches.every(f=>f.typology==='T2'&&f.floor>=2&&app.fractionPriceSummary(f).current<=800000&&![30,36].includes(f.number)));
const combined=app.compatibleClientFractions({preferences:{typology:'T1+1',floor:'1 a 3'},budget:500000});
assert.ok(combined.every(f=>f.typology==='T1+1'&&f.floor>=1&&f.floor<=3));
assert.ok(!app.compatibleClientFractions({preferences:{typology:'T2+1'},budget:2000000}).some(f=>f.number===30));
assert.deepEqual(Array.from(app.relatedClientFractions(app.state.data.clients[0]),f=>f.number),[24]);
assert.match(app.clientTimelineItem(app.state.data.events[0]),/Contra-proposta recebida/);
assert.match(app.clientTimelineItem({...app.state.data.events[0],fractions:[99],date:''}),/Apt\. 99/);
assert.match(app.clientTimelineItem({...app.state.data.events[0],date:''}),/Data não registada/);
assert.match(app.fractionContextHistory(fraction),/700\.000 € → 750\.000 €/);
assert.match(app.fractionContextHistory(fraction),/01\/09\/2026/);
assert.match(app.fractionDecisionMarkup(fraction),/Ver análise detalhada/);
assert.ok(!app.fractionContextHistory(fraction).includes('Preço recomendado alterado'));

const operational=app.operationalCommercialSummary();
assert.equal(operational.available.length,37);
assert.equal(operational.active.length,2);
assert.equal(operational.newLeads.length,1);
assert.equal(operational.negotiations.length,1);
assert.equal(operational.followups.length,1);
assert.ok(app.operationalActionsMarkup().includes('data-ux-client="ux-active"'));
app.commercialUx.sort.prices={field:'current',direction:-1};
const sorted=app.sortedUxFractions(app.state.fractions,'prices');
assert.equal(sorted[0].number,36);
assert.notEqual(sorted,app.state.fractions);
assert.equal(app.state.fractions[0].number,1);

app.commercialUx.ready=true;
for(const n of [3,24,30,39])assert.equal(app.toggleQuickComparison(n,true),true);
assert.equal(app.toggleQuickComparison(36,true),false);
assert.equal(app.commercialUx.comparison.size,4);
assert.equal(app.el.compareFractions.selectedOptions.length,4);
assert.equal(app.toggleQuickComparison(24,false),true);
assert.equal(app.commercialUx.comparison.size,3);
app.persistCommercialContext();
const stored=JSON.parse(uiStorage.get('theView.commercialUi.v1'));
assert.equal(stored.version,1);
assert.deepEqual(stored.comparison,[3,30,39]);
for(const key of ['clients','events','finalPrices','statuses','salePrices','priceHistory','agents','saleCommissions'])assert.equal(key in stored,false);
assert.equal(JSON.stringify(app.state.data),before);
assert.equal(JSON.stringify(rows),rowsBefore);
assert.equal(businessWrites,0);
assert.equal(requests,0);
console.log('commercial UX tests passed: read-only prices/KPIs, stable data, isolated session context and max-4 comparison');
