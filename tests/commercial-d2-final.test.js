'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');require('../view-workspace.js');
const ui=globalThis.THE_VIEW_D2,base={phase:'synced',canWrite:true,label:'Base partilhada verificada'};
for(const [input,want]of [[{phase:'loading'},'initial'],[{checking:true},'checking'],[{editing:true},'draft'],[{phase:'pending'},'local'],[{label:'Gravação solicitada — A aguardar confirmação'},'saving'],[{label:'Alterações guardadas na base partilhada'},'confirmed'],[{label:'Atualização recebida — Dados confirmados'},'received'],[{phase:'offline'},'offline'],[{canWrite:false},'readonly'],[{phase:'conflict'},'conflict'],[{phase:'offline',uncertain:true},'uncertain']])assert.equal(ui.syncDisplay({...base,...input}),want);
const history=[{value:'A aguardar cliente',recordedAt:'2026-10-20T15:30:00Z'}],before=JSON.stringify(history);
assert.deepEqual(ui.waitingSummary(history,'A aguardar cliente','2026-10-29'),{waiting:true,since:'2026-10-20',days:9});assert.equal(JSON.stringify(history),before);
assert.equal(ui.waitingSummary(history,'Resposta nossa pendente','2026-10-29').days,null);assert.equal(ui.waitingSummary(history,'Em acompanhamento','2026-10-29').waiting,false);assert.equal(ui.waitingSummary(history,'A aguardar cliente','2026-10-01').days,null);assert.equal(ui.waitingSummary([{value:'A aguardar cliente',recordedAt:'invalid'}],'A aguardar cliente','2026-10-29').days,null);
const guards=require('./helpers/d2-visual-source.cjs');guards.restoreCommercial(fs.readFileSync('commercial.js','utf8').replace(/\r\n/g,'\n'));guards.assertOpportunity();
console.log('D2 final: 11 sync displays, immutable waiting-date projection, unknown/future date safety, exact commercial and source guards passed');
