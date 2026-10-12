const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const engine=require('../commercial-recommendations.js');
const now='2026-10-12T12:00:00Z';
class Clock extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return Date.parse(now)}}
let writes=0,requests=0,pdf='';
const context={console,Date:Clock,document:{readyState:'loading',addEventListener(){}},window:{THE_VIEW_CONFIG:{},THE_VIEW_RECOMMENDATIONS:engine,addEventListener(){},open(){return{document:{open(){},write(value){pdf=value},close(){}}}}},localStorage:{getItem(){return null},setItem(){writes++},removeItem(){writes++}},fetch(){requests++;throw new Error('No remote access allowed')}};
vm.createContext(context);
const source=fs.readFileSync(require.resolve('../commercial.js'),'utf8'),end=source.lastIndexOf('})();');
vm.runInContext(source.slice(0,end)+'commercialUxToast=()=>{};globalThis.reportTest={state,STAGES,parseRow,buildClientSummaryRows,filterClientReportRows,clientReportIndicators,clientReportColumnGroups,clientReportMarkup,generateClientsSummaryPdf,CLIENT_REPORT_COLUMNS};'+source.slice(end),context);
const app=context.reportTest,clone=value=>JSON.parse(JSON.stringify(value));
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value)}return value}
const c=(id,extra={})=>({id,name:id,stage:'Qualificado',preferences:{typology:'T2'},budget:800000,manualFractions:[],fractions:[],manualNextStep:'',manualNextFollowup:'',...extra});
const event=(id,clientId,type,date,extra={})=>({id,clientId,type,date,time:'10:00',fractions:[],...extra});
app.state.fractions=[1,2,3].map(number=>({number,typology:'T2',floor:2,orientation:'Sul',basePrice:700000}));
app.state.data={clients:[
  c('A overdue',{manualNextStep:'Manual overdue',manualNextFollowup:'2026-10-01'}),
  c('B legacy',{manualNextStep:'Legacy undated action'}),
  c('C high',{stage:'Em negociação'}),
  c('D scheduled',{manualNextStep:'Scheduled action',manualNextFollowup:'2026-10-14'}),
  c('E undated',{manualNextStep:'New undated action',manualNextActionDefinedAt:now}),
  c('F recommended'),
  c('G completed',{manualNextStep:'Completed action',manualNextFollowup:'2026-01-01',manualNextActionCompletedAt:now}),
  c('H empty',{preferences:{},budget:0}),
  c('I sold',{stage:'Vendido',manualNextStep:'Do not reactivate',manualNextFollowup:'2026-01-01'}),
  c('J desist',{stage:'Desistiu'}),
  c('K presented',{stage:'Apresentado',agentId:'a',phone:'912345678',email:'synthetic@example.test',nif:'PRIVATE-NIF',nationality:'PRIVATE-NATIONALITY',origin:'Outro',originManual:'Referral',manualFractions:[3],fractions:[1,2,3],presentationSelection:[3]})
],events:[event('proposal','C high','Contra-proposta enviada','2026-10-01',{amount:650000,fractions:[1]}),event('presentation','K presented','Apresentação comercial','2026-10-02',{fractions:[1,2]}),event('prices','K presented','Preços informados','2026-10-03',{fractions:[1,2],informedPrices:[{fraction:1,informedPrice:700000},{fraction:2,informedPrice:720000}]}),event('request','K presented','Pedido de informação recebido','2026-10-09'),event('admin','K presented','Outro','2026-10-10',{notes:'Administrative note'}),event('future','K presented','Documentação enviada','2026-10-20')],agents:[{id:'a',name:'Agent fixture',agency:'Agency fixture'}],finalPrices:{1:700000,2:720000,3:740000},statuses:{},priceHistory:{},salePrices:{},saleCommissions:{}};
const before=JSON.stringify(app.state.data);freeze(app.state.data);
const rows=app.buildClientSummaryRows();
assert.equal(rows.length,9,'Default excludes sold/desisted');
assert.deepEqual(clone(rows.slice(0,3).map(row=>row.client)),['A overdue','B legacy','C high']);
assert.ok(rows.findIndex(row=>row.client==='D scheduled')<rows.findIndex(row=>row.client==='E undated'));
assert.equal(rows.find(row=>row.client==='G completed').followupStatus,'none');
assert.equal(rows.find(row=>row.client==='B legacy').followupNeedsReview,true);
assert.equal(rows.find(row=>row.client==='E undated').followupNeedsReview,false);
const presented=rows.find(row=>row.client==='K presented');
assert.equal(presented.lastContact,'2026-10-03','Incoming/admin/future events are not effective contacts');
assert.equal(presented.presented,'Apt. 1 · Apt. 2');assert.equal(presented.related,'Apt. 1 · Apt. 2 · Apt. 3');
assert.match(presented.informedPrices,/700.000/);assert.match(presented.informedPrices,/720.000/);
assert.equal(presented.origin,'Outro — Referral');
assert.equal(rows.find(row=>row.client==='H empty').phone,'—');assert.equal(rows.find(row=>row.client==='H empty').typology,'—');
const all=app.buildClientSummaryRows({statuses:app.STAGES});assert.equal(all.length,11);
assert.equal(app.filterClientReportRows(all,{agentId:'a'}).length,1);
assert.equal(app.filterClientReportRows(all,{search:'PRESENTED'}).length,1);
assert.equal(app.filterClientReportRows(all,{statuses:[]}).length,0);
assert.equal(app.filterClientReportRows(all,{followupFilter:'undated-review'}).length,1);
assert.equal(app.filterClientReportRows(all,{priority:'Alta'}).length,1);
const counts=clone(app.clientReportIndicators(rows));
assert.equal(counts.total,9);assert.equal(counts.active,9);assert.equal(counts.overdue,1);assert.equal(counts.review,1);assert.equal(counts.scheduled,1);assert.equal(counts.high,1);assert.equal(counts.noManual,5);
assert.equal(Object.values(counts.stages).reduce((sum,n)=>sum+n,0),9);
assert.equal(app.clientReportIndicators(app.filterClientReportRows(all,{agentId:'a'})).total,1);
for(const model of ['operational','management','listing']){
  for(const subset of [[],[presented],rows]){
    assert.equal(app.generateClientsSummaryPdf(subset,['client','status','nextStep'],{model}),true);
    assert.ok(pdf.includes('Documento interno'));assert.ok(pdf.includes('Página'));
    assert.ok(!pdf.includes('PRIVATE-NIF'));assert.ok(!pdf.includes('PRIVATE-NATIONALITY'));
    assert.ok(!pdf.includes('synthetic@example.test'));assert.ok(!pdf.includes('https://fonts.googleapis.com'));
    assert.ok(pdf.includes('font-size:9pt'));assert.ok(!pdf.includes('5.7pt'));
    assert.ok(!pdf.includes('window.print()},250)'));
  }
}
app.generateClientsSummaryPdf(rows,['client'],{model:'operational',includeContacts:true});assert.match(pdf,/synthetic@example.test/);assert.match(pdf,/Manual:/);assert.match(pdf,/Sistema:/);
app.generateClientsSummaryPdf(rows,app.CLIENT_REPORT_COLUMNS.map(col=>col[0]),{model:'listing'});assert.match(pdf,/synthetic@example.test/);assert.match(pdf,/Bloco 2 de/);
const layout=app.clientReportColumnGroups(app.CLIENT_REPORT_COLUMNS.map(col=>col[0]));assert.equal(layout.landscape,true);assert.ok(layout.groups.length>1);
assert.ok(layout.groups.every(group=>group[0][0]==='client'&&group.reduce((sum,col)=>sum+col[2],0)<=277));
assert.deepEqual(new Set(clone(layout.groups.flatMap(group=>group.map(col=>col[0])))),new Set(clone(app.CLIENT_REPORT_COLUMNS.map(col=>col[0]))));
assert.equal(app.clientReportColumnGroups(['client','phone']).landscape,false);
const executive=app.clientReportMarkup(all,{model:'management'});assert.equal(executive.landscape,false);assert.match(executive.body,/Indisponível/);assert.ok(!executive.body.includes('650.000'));
assert.match(app.clientReportMarkup([],{model:'management'}).body,/<td>0<\/td>/,'Zero counts must not be replaced by missing values');
const longManual=app.clientReportMarkup([{...presented,nextStep:'Long manual action '.repeat(200),followupStatus:'overdue',followupNeedsReview:false,automatic:'—',priority:'—'}],{model:'management'});
assert.ok(longManual.body.includes('…'));assert.ok(longManual.body.length<6000,'Executive summaries must remain compact');
assert.equal(JSON.stringify(app.state.data),before);assert.equal(writes,0);assert.equal(requests,0);
console.log('client reports tests passed: three models, filters, immutable data, central contacts/followups/recommendations, exact client KPIs, closed clients, column blocks and privacy');
