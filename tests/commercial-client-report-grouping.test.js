'use strict';
const assert=require('node:assert/strict'),cp=require('node:child_process'),path=require('node:path');
const {loadReportApp,fictitiousRows}=require('./helpers/client-report-grouping.cjs');
const app=loadReportApp(),rows=fictitiousRows(app.STAGES),snapshot=JSON.stringify(rows);
const clone=value=>JSON.parse(JSON.stringify(value));
for(const model of ['operational','listing']){
  const options={model,statuses:app.STAGES,sort:'name',includeContacts:true,columns:app.CLIENT_REPORT_COLUMNS.map(c=>c[0])};
  const filtered=app.filterClientReportRows(rows,options),report=app.clientReportMarkup(filtered,options),groups=app.clientReportStageGroups(filtered);
  assert.deepEqual(clone(groups.map(g=>g.stage)),clone(app.STAGES));assert.equal(groups.reduce((n,g)=>n+g.rows.length,0),rows.length);
  for(const group of groups){assert.equal(group.rows.length,4);assert.match(report.body,new RegExp(group.stage+' — 4 clientes'));assert.deepEqual(clone(group.rows.map(r=>r.id)),clone(filtered.filter(r=>r.status===group.stage).map(r=>r.id)))}
  const blocks=model==='listing'?app.clientReportColumnGroups(options.columns).groups.length:1;
  assert.equal((report.body.match(/data-report-stage=/g)||[]).length,app.STAGES.length*blocks);
  assert.equal((report.body.match(/<tbody>/g)||[]).length,app.STAGES.length*blocks);
  for(const row of rows)assert.equal(report.body.split('<strong>'+row.client+'</strong>').length-1,blocks);
  if(model==='operational'){assert.match(report.body,/Manual:/);assert.match(report.body,/Sistema:/);assert.match(report.body,/cliente0@example.test/);assert.match(report.body,/Prazo \/ Prioridade/)}
  else for(const col of app.CLIENT_REPORT_COLUMNS)assert.ok(report.body.includes(col[1]));
  app.generateClientsSummaryPdf(filtered,options.columns,options);assert.match(app.html(),/Total geral: 28 clientes/);
  const partial=app.filterClientReportRows(rows,{...options,statuses:[app.STAGES[0],app.STAGES[2]],search:'Cliente fictício',agentId:'agent-a'}),partialGroups=app.clientReportStageGroups(partial);
  assert.equal(partialGroups.reduce((n,g)=>n+g.rows.length,0),partial.length);assert.ok(partialGroups.every(g=>[app.STAGES[0],app.STAGES[2]].includes(g.stage)&&g.rows.length));
  assert.equal(app.clientReportStageGroups(app.filterClientReportRows(rows,{...options,statuses:[]})).length,0);
  assert.match(app.clientReportMarkup([],{...options}).body,/Sem registos para apresentar/);assert.doesNotMatch(app.clientReportMarkup([],{...options}).body,/data-report-stage/);
  for(const sort of ['operational','name','agent','lastContact','priority','status']){
    const sorted=app.filterClientReportRows(rows,{...options,sort});for(const g of app.clientReportStageGroups(sorted))assert.deepEqual(clone(g.rows.map(r=>r.id)),clone(sorted.filter(r=>r.status===g.stage).map(r=>r.id)));
  }
}
const constrained=app.filterClientReportRows(rows,{statuses:app.STAGES,contactState:'Resposta nossa pendente',priorityClient:'yes',followupFilter:'future',priority:'Alta'});assert.ok(constrained.length>0);assert.ok(constrained.every(r=>r.priorityClient&&r.contactState==='Resposta nossa pendente'&&r.followupStatus==='future'&&r.priority==='Alta'));
// The two models outside this correction must produce byte-for-byte identical bodies.
const baseline=loadReportApp(cp.execFileSync('git',['show','origin/main:commercial.js'],{cwd:path.resolve(__dirname,'..'),encoding:'utf8'}));
for(const model of ['management','portfolio'])assert.deepEqual(clone(app.clientReportMarkup(rows,{model,statuses:app.STAGES})),clone(baseline.clientReportMarkup(rows,{model,statuses:app.STAGES})));
assert.equal(JSON.stringify(rows),snapshot);
console.log('Grouped reports passed: seven official stages, filtered counts, stable within-group sorts, column blocks, optional fields, empty reports, combined filters and unchanged management/portfolio.');
