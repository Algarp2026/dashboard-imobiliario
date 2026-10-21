const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'commercial.js'), 'utf8');
const rows = JSON.parse(fs.readFileSync(path.join(root, 'data.json'), 'utf8'));
let writes = 0;
const context = {
  console,
  document: {readyState:'loading',addEventListener(){},querySelector(){return null}},
  window: {THE_VIEW_CONFIG:{},THE_VIEW_RECOMMENDATIONS:require('../commercial-recommendations.js'),THE_VIEW_CLIENT_WORKFLOW:require('../commercial-client-workflow.js'),THE_VIEW_OPPORTUNITIES:require('../commercial-opportunities.js')},
  localStorage: {getItem(){return null},setItem(){writes++}},
  fetch(){throw new Error('Unexpected request')}
};
vm.createContext(context);
const end = source.lastIndexOf('})();');
vm.runInContext(source.slice(0, end) + 'globalThis.testFlow={state,parseRow,presentationSelection,updatePresentationSelection,consumePresentationSelection,recalculateResumoCliente,clientCommercialProjection,commercialClientRecommendation,clientInvestmentLabel,clientRecommendationMarkup,normalizeData,clientEditPatch};' + source.slice(end), context);
const app = context.testFlow;
app.state.fractions = rows.map(app.parseRow).filter(f=>f.isTheView);
const legacy = {id:'legacy',name:'Legacy fixture',stage:'Apresentado',manualFractions:[24],fractions:[24],commercialSummary:{presentedFractions:[24]},budget:750000,manualBudget:750000,preferences:{typology:'T2'},manualPreferences:{typology:'T2'},preferencesManuallyEdited:true};
app.state.data = app.normalizeData({clients:[legacy],events:[{id:'old-presentation',clientId:'legacy',type:'Apresentação comercial',fractions:[24]}],finalPrices:{24:750000},statuses:{30:'Indisponível'},agents:[{id:'preserved-agent'}],saleCommissions:{36:{amount:42000}}});
const original = JSON.stringify(app.state.data);
assert.deepEqual(Array.from(app.presentationSelection(legacy)),[]);
assert.equal('presentationSelection' in legacy,false);
assert.equal(app.updatePresentationSelection(legacy,[]),false);
assert.equal(JSON.stringify(app.state.data),original);

assert.equal(app.updatePresentationSelection(legacy,[2,1,2,99]),true);
assert.deepEqual(Array.from(app.presentationSelection(legacy)),[1,2]);
assert.deepEqual(legacy.fractions,[24]);
assert.deepEqual(legacy.commercialSummary.presentedFractions,[24]);
assert.equal(legacy.stage,'Apresentado');
assert.equal(app.state.data.events.length,2);assert.equal(app.state.data.events[1].opportunityAction,'select');
assert.equal(app.updatePresentationSelection(legacy,[1,2]),false);
const restored = app.normalizeData(JSON.parse(JSON.stringify(app.state.data)));
assert.deepEqual(Array.from(app.presentationSelection(restored.clients[0])),[1,2]);
assert.deepEqual(restored.saleCommissions,{36:{amount:42000}});
app.consumePresentationSelection(legacy,{type:'Documentação enviada',fractions:[1]});
assert.deepEqual(Array.from(app.presentationSelection(legacy)),[1,2]);
app.consumePresentationSelection(legacy,{type:'Apresentação comercial',fractions:[1]});
assert.deepEqual(Array.from(app.presentationSelection(legacy)),[2]);
assert.equal(app.state.data.events.length,2);assert.equal(app.state.data.events[1].opportunityAction,'select');

const lead = {id:'new',name:'New fixture',preferences:{typology:'T2'},manualPreferences:{typology:'T2'},manualBudget:750000,budget:750000,preferencesManuallyEdited:true,fractions:[],manualFractions:[],manualNextStep:'Preserved action',manualNextFollowup:'2099-01-01'};
app.state.data.clients.push(lead);
app.recalculateResumoCliente(lead.id);
assert.equal(app.clientCommercialProjection(lead).stage,'Qualificado');
assert.equal(lead.stage,undefined,'Derivation must not regularize persisted stages');
assert.deepEqual(Array.from(lead.commercialSummary.presentedFractions),[]);
assert.equal(lead.manualNextStep,'Preserved action');
assert.equal(app.state.data.events.length,2);
const matching = app.commercialClientRecommendation(lead).matching;
assert.equal(matching.known,true);
assert.ok(matching.matches.length);
assert.ok(matching.matches.every(item=>app.state.fractions.find(f=>f.number===item.number).typology==='T2'));
app.updatePresentationSelection(lead,[24]);
app.recalculateResumoCliente(lead.id);
assert.deepEqual(Array.from(lead.commercialSummary.presentedFractions),[]);
assert.deepEqual(Array.from(lead.fractions),[]);
assert.equal(app.clientInvestmentLabel({budgetMin:550000,budgetMax:650000}),'550.000 € a 650.000 €');
assert.equal(app.clientInvestmentLabel({}),'—');
const recommendation={clientId:lead.id,status:'action',message:'',primary:{code:'matching',action:'Apresentar frações compatíveis',reason:'Original reason',priority:'Média',reference:{fractions:[2]},quickActions:[{id:'presentation',label:'Registar apresentação'}]},secondary:[]};
const beforeRecommendation=JSON.stringify(recommendation);
assert.match(app.clientRecommendationMarkup(recommendation),/Preparar \/ registar apresentação comercial/);
assert.equal(JSON.stringify(recommendation),beforeRecommendation);
const opened={name:'Legacy name',phone:'912345678',email:'legacy@example.test',origin:'Website The View',originManual:'Previous source',nif:'123456789',nationality:'Portuguesa',agentId:'',agency:'Previous agency',notes:'Previous notes',manualNextStep:'Preserved next action',manualNextFollowup:'2099-01-01',stage:'Em negociação',manualFractions:[24]};
const hiddenEmpty={...opened,phone:'910000000',budget:0,preferences:{},manualNextStep:'',manualNextFollowup:'',stage:'Novo Lead',manualFractions:[],fractions:[],presentationSelection:[]};
const clone=value=>JSON.parse(JSON.stringify(value));
assert.deepEqual(clone(app.clientEditPatch(opened,hiddenEmpty,'identity')),{phone:'910000000'});
assert.deepEqual(clone(app.clientEditPatch(opened,{...opened},'identity')),{});
assert.deepEqual(clone(app.clientEditPatch(opened,{...opened,notes:'Changed note'},'identity')),{notes:'Changed note'});
assert.deepEqual(clone(app.clientEditPatch(opened,{...opened,name:'Changed name',manualNextStep:'Changed action'},'plan')),{manualNextStep:'Changed action'});
assert.deepEqual(clone(app.clientEditPatch(opened,{...opened,name:'Changed name',stage:'Qualificado'},'stage')),{stage:'Qualificado'});
assert.deepEqual(clone(app.clientEditPatch(opened,{...opened,name:'Changed name',manualFractions:[]},'associate')),{manualFractions:[]});
assert.deepEqual(clone(app.clientEditPatch({},hiddenEmpty,'identity')),{});
assert.deepEqual(clone(app.clientEditPatch(opened,hiddenEmpty,'full')),{});
const unresolvedLegacy={...legacy,origin:'Portal Imobiliário',agentId:'missing-agent',agent:'Preserved historical agent',agency:'Historical agency'};
Object.assign(unresolvedLegacy,clone(app.clientEditPatch(opened,hiddenEmpty,'identity')));
assert.equal(unresolvedLegacy.origin,'Portal Imobiliário');
assert.equal(unresolvedLegacy.agentId,'missing-agent');
assert.equal(unresolvedLegacy.agent,'Preserved historical agent');
assert.equal(unresolvedLegacy.agency,'Historical agency');
assert.equal(writes,0);
assert.deepEqual(app.state.data.finalPrices,{24:750000});
console.log('progressive CRM tests passed: backward compatibility, preparation vs presentation, matching, scoped edits, hidden-field safety and unchanged business data');
