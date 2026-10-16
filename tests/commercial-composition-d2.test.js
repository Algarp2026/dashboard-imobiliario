'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process');
const model=require('../commercial-client-workflow.js');
const read=file=>fs.readFileSync(require.resolve('../'+file),'utf8').replaceAll('\r\n','\n');
const previous=file=>cp.execFileSync('git',['show','8ba9038:'+file],{encoding:'utf8',maxBuffer:4000000}).replaceAll('\r\n','\n');
function declaration(source,name,indent=''){
  const expression=new RegExp('(?:async )?function '+name+'\\('),match=source.match(expression);assert.ok(match,name);
  const rest=source.slice(match.index+1),next=rest.search(new RegExp('\n'+indent+'(?:async )?function '));return source.slice(match.index,next<0?source.length:match.index+1+next);
}
for(const file of ['commercial-client-workflow.js','commercial-client-preferences.js','commercial-fraction-recommendations.js','commercial-recommendations.js','api/commercial-data.js','google_apps_script.gs','config.js','data.json','middleware.ts'])assert.equal(read(file),previous(file),file+' must remain unchanged');
for(const name of ['hasCriticalCommercialEventChange','protectedEventEditError','replaceEventAndReapplyBusinessRules','applyEventBusinessRules','loadRemoteData','syncRemote','save','exportPdf','generateClientsSummaryPdf','operationalCommercialSummary'])assert.equal(declaration(read('commercial.js'),name),declaration(previous('commercial.js'),name),name+' changed');
assert.equal(declaration(read('commercial-client-workflow-ui.js'),'opportunityCards','    '),declaration(previous('commercial-client-workflow-ui.js'),'opportunityCards','    '),'PR 11 visual classification must stay intact');
const c={id:'fiction-d2',name:'Cliente ficticio'},data={clients:[c],events:[],statuses:{9:'Disponível'},statusEventIds:{}},context={window:{THE_VIEW_CLIENT_WORKFLOW:model}};vm.createContext(context);vm.runInContext(read('commercial-client-workflow-ui.js'),context);
const ui=context.window.createClientWorkflow({esc:x=>String(x??''),icon:()=>'',today:()=> '2026-10-16',events:()=>data.events,data:()=>data,rows:()=>[{number:9,typology:'T2',floorLabel:'2'}],status:()=>data.statuses[9],price:()=> '500000',money:x=>String(x),followup:()=>null,facts:rows=>rows.map(row=>row.join(':')).join('|'),timeline:e=>e.id});
const render=()=>{const before=JSON.stringify(data),html=ui.negotiationMarkup(c);assert.equal(JSON.stringify(data),before);return html};
const summary=()=>render().match(/data-negotiation-unit="9"[^>]*><summary>([\s\S]*?)<\/summary>/)?.[1]||'';
data.events=[model.buildPresentation(null,{id:'shown',clientId:c.id,state:'realized',date:'2026-10-01',channel:'Email',rows:[{fraction:9,informedPrice:490000,officialPrice:500000}]})];
assert.equal((summary().match(/<span>Preço comunicado<strong>/g)||[]).length,1);assert.doesNotMatch(summary(),/Última proposta|Última contraproposta|—/);assert.match(render(),/Última proposta:—/);
data.events.push({id:'offer',clientId:c.id,type:'Proposta recebida',date:'2026-10-02',fractions:[9],amount:470000},{id:'counter',clientId:c.id,type:'Contra-proposta enviada',date:'2026-10-03',fractions:[9],amount:480000});assert.match(summary(),/470000/);assert.match(summary(),/480000/);assert.doesNotMatch(summary(),/Preço comunicado/);assert.match(render(),/Último preço comunicado:490000/);
data.events.push({id:'closed',clientId:c.id,type:'Desistência',date:'2026-10-04',fractions:[9],scope:'fraction',globalWithdrawal:false});assert.doesNotMatch(summary(),/ux-opportunity-prices/);assert.match(summary(),/Desistência/);assert.match(render(),/d2-opportunity-board/);
console.log('D2: protected source unchanged, approved card projection identical, compact state-specific amounts, secondary values preserved, no render mutations.');
