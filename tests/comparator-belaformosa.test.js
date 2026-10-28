'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process');
const rows=JSON.parse(fs.readFileSync(require.resolve('../data.json'),'utf8'));
const before=JSON.parse(cp.execFileSync('git',['show','658da6f:data.json'],{encoding:'utf8'}));
const prices=[675000,725000,400000,500000,475000,735000,625000,415000,1000000,775000,415000,465000,465000,685000,650000,1100000,825000,450000,385000,435000,675000,695000,1000000,900000,475000,725000,475000,525000,525000,1100000,1025000,500000,750000,880000,700000,1500000,1105000,490000,1150000];
const view=rows.filter(r=>r.Empreendimento==='The View'),bela=rows.filter(r=>r.Empreendimento==='BelaFormosa');
assert.equal(view.length,39);assert.equal(bela.length,216);assert.equal(rows.length,535);
assert.deepEqual(rows.filter(r=>!['The View','BelaFormosa'].includes(r.Empreendimento)),before.filter(r=>r.Empreendimento!=='The View'));
assert.equal(view.reduce((s,r)=>s+r['Preço Recomendado'],0),27395000);
for(let n=1;n<=39;n++){
 const row=view.find(r=>r.Fração==='Apartamento '+n),old=before.find(r=>r.Empreendimento==='The View'&&r.Fração===row.Fração);
 assert.equal(row['Preço Recomendado'],prices[n-1]);
 const changed=new Set(['Preço Recomendado','Versão Análise','Justificação Técnica',...([3,11].includes(n)?['Garagem']:[])]);
 assert.deepEqual(Object.fromEntries(Object.entries(row).filter(([k])=>!changed.has(k))),Object.fromEntries(Object.entries(old).filter(([k])=>!changed.has(k))));
 if(n>=30&&n<=35)assert.equal(row['Disponibilidade Análise'],'Fora de comercialização');
}
assert.equal(view.find(r=>r.Fração==='Apartamento 3').Garagem,'Sem estacionamento');assert.equal(view.find(r=>r.Fração==='Apartamento 11').Garagem,'Sem estacionamento');assert.ok(view.every(r=>r.Garagem!=='P0Inf — Lugar 02'));
const spaces=view.flatMap(r=>{const m=r.Garagem.match(/^(.*?) — Lugar(?:es)? (.+)$/);return m?m[2].split('+').map(p=>m[1]+'|'+Number(p)):[]});assert.equal(spaces.length,39);assert.equal(new Set(spaces).size,39);
assert.equal(new Set(bela.map(r=>r.Fração)).size,216);assert.equal(bela.filter(r=>r.Status==='Reservado').length,20);assert.ok(bela.every(r=>r.PVP>0&&r.Vista===null&&!('Classe vista comparável' in r)));
assert.equal(bela.filter(r=>r['Tipo produto']==='Rooftop').length,32);assert.equal(bela.filter(r=>r['Tipo produto']==='Duplex').length,4);
let writes=0;const context={document:{readyState:'loading',addEventListener(){},body:{style:{}}},window:{addEventListener(){}},localStorage:{getItem(){return null},setItem(){writes++}},console};
const source=fs.readFileSync(require.resolve('../app.js'),'utf8'),end=source.lastIndexOf('})();');vm.createContext(context);vm.runInContext(source.slice(0,end)+'globalThis.a={state,els,parseRow,compMatches,selectDiverseComparables,comparisonLayer,comparisonScore,comparisonReason,equivalentArea,specialProduct,comparableView,openFractionModal,finalPrice,suggestedPrice};'+source.slice(end),context);
const a=context.a;a.state.rows=rows.map(a.parseRow);a.state.fractions=a.state.rows.filter(r=>r.isTheView);a.state.competitors=a.state.rows.filter(r=>!r.isTheView);a.els.fractionModalContent={innerHTML:''};a.els.fractionModal={classList:{remove(){}}};
const fraction=n=>a.state.fractions.find(r=>r.number===n),competitor=code=>a.state.competitors.find(r=>r.development==='BelaFormosa'&&r.fractionRaw===code);
for(const f of a.state.fractions){const seen=new Set();for(const mode of ['direct','adjacent','indirect','special'])for(const c of a.compMatches(f,mode)){const k=c.development+'|'+c.fractionRaw;assert.ok(!seen.has(k),'Duplicate '+k);seen.add(k);assert.equal(a.comparisonLayer(f,c),mode);if(mode==='direct'||mode==='adjacent'){assert.ok(a.comparableView(c)!==null);assert.ok(!a.specialProduct(c));}if(c.development==='BelaFormosa')assert.ok(!['direct','adjacent'].includes(mode));}}
assert.notEqual(a.comparisonLayer(fraction(1),competitor('RF108')),'direct');assert.equal(a.comparableView(competitor('LF504')),null);
for(const [n,codes]of [[36,['LF504','RF504']],[37,['LF507','RF507']],[38,['RB503','RB504']],[39,['LB507','RB507']]])for(const code of codes){assert.equal(a.comparisonLayer(fraction(n),competitor(code)),'indirect');assert.equal(a.specialProduct(competitor(code)),false);assert.ok(a.compMatches(fraction(n),'indirect').some(c=>c.fractionRaw===code));}
for(const n of [36,37,38,39]){const chosen=a.selectDiverseComparables(a.compMatches(fraction(n),'indirect'),4,2);assert.equal(chosen.filter(r=>r.development==='BelaFormosa').length,2);assert.ok(a.compMatches(fraction(n),'special').every(a.specialProduct));}
assert.equal(a.comparisonLayer(fraction(36),competitor('LF604')),'special');
const sample=competitor('RF507');assert.equal(a.equivalentArea(sample),100.25+.3*19);a.state.compare.exteriorCoefficient=.5;assert.equal(a.equivalentArea(sample),100.25+.5*19);a.state.compare.exteriorCoefficient=.3;
const reliable={...sample,view:2,viewConfidence:'Confirmada',viewMin:null,viewMax:null,dataQuality:'Alta',floor:6};assert.equal(a.comparisonLayer(fraction(37),reliable),'direct');assert.equal(a.comparisonLayer(fraction(37),{...reliable,floor:5}),'adjacent');assert.equal(a.comparisonLayer(fraction(37),{...reliable,view:4}),'indirect');assert.equal(a.comparisonLayer(fraction(37),{...reliable,price:NaN}),null);
assert.ok(a.comparisonScore(fraction(37),reliable)>a.comparisonScore(fraction(37),{...reliable,status:'Histórico',referenceYear:2024,dataQuality:'Baixa'}));
const snapshot=JSON.stringify(a.state.commercialData);for(const n of [1,9,23,36,37,38,39]){a.openFractionModal(fraction(n));const html=a.els.fractionModalContent.innerHTML;assert.match(html,/Preço recomendado/);assert.match(html,/Adjacentes prioritários/);assert.match(html,/Referências especiais/);assert.ok(html.includes('/m² equivalente'));assert.doesNotMatch(html,/NaN|undefined/)}
assert.equal(JSON.stringify(a.state.commercialData),snapshot);assert.equal(writes,0);
for(const path of ['commercial.js','commercial.html','commercial.css','api','server','google_apps_script.gs','google_commercial_integrity.gs','config.js','plantas'])assert.equal(cp.execFileSync('git',['diff','658da6f','--',path],{encoding:'utf8'}),'','Protected path: '+path);
console.log('BelaFormosa comparator PASS: 39 management prices, 27.395M, 280 preserved +216, parking, four exclusive layers, uncertain views, sixth floor, special products, diversity, unknown data, no commercial writes.');
