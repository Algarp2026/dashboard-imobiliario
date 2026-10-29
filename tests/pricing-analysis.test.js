const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const rows = JSON.parse(fs.readFileSync(path.join(root, 'data.json'), 'utf8'));
const expected = [0,675000,785000,420000,535000,510000,795000,675000,425000,1200000,830000,440000,515000,500000,735000,705000,1300000,880000,465000,395000,440000,745000,775000,1075000,940000,490000,815000,510000,565000,545000,1175000,1025000,515000,795000,935000,800000,1750000,1150000,545000,1300000];
const viewRows = rows.filter(row => row.Empreendimento === 'The View');
assert.equal(viewRows.length, 39);

for (const row of viewRows) {
  const number = Number(row['Fração'].match(/\d+/)[0]);
  assert.equal(row['Preço Recomendado'], expected[number]);
  assert.equal(row['Versão Análise'], '2026-10');
  assert.ok(['Alta','Média','Baixa'].includes(row['Confiança Recomendação']));
  assert.ok(row['Justificação Técnica']);
  assert.ok(['Standard','Premium'].includes(row['Segmento Análise']));
  if (number >= 30 && number <= 35) assert.equal(row['Disponibilidade Análise'], 'Fora de comercialização');
}
assert.equal(viewRows.find(row => row['Fração'] === 'Apartamento 13')['Confiança Recomendação'], 'Média');
assert.equal(viewRows.find(row => row['Fração'] === 'Apartamento 24').PVP, 700000);
assert.equal(viewRows.find(row => row['Fração'] === 'Apartamento 31').PVP, 720000);
assert.ok(rows.filter(row => row.Empreendimento !== 'The View').every(row => !('Preço Recomendado' in row)));

let writes = 0;
const context = {
  document: { readyState:'loading', addEventListener(){}, body:{style:{}} },
  window: { THE_VIEW_CONFIG:{}, addEventListener(){} },
  localStorage: { getItem(){return null}, setItem(){writes++} },
  console
};
vm.createContext(context);
function loadFunctions(file, names) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const end = source.lastIndexOf('})();');
  assert.ok(end > 0, `${file}: closure not found`);
  const exports = names.join(',');
  vm.runInContext(source.slice(0,end) + `globalThis.__pricingTest={${exports}};\n` + source.slice(end), context, {filename:file});
  return context.__pricingTest;
}

const app = loadFunctions('app.js', ['parseRow','state','els','internalComparables','openFractionModal']);
app.state.rows = rows.map(app.parseRow).filter(Boolean);
app.state.fractions = app.state.rows.filter(row => row.isTheView).sort((a,b) => a.number-b.number);
app.state.competitors = app.state.rows.filter(row => !row.isTheView);
app.els.fractionModalContent = {innerHTML:''};
app.els.fractionModal = {classList:{remove(){}}};
const apt24 = app.state.fractions.find(row => row.number === 24);
assert.deepEqual(Array.from(app.internalComparables(apt24), row => row.number), [2,10,17,24,31,37]);
app.openFractionModal(apt24);
assert.match(app.els.fractionModalContent.innerHTML, /Preço base<\/span><strong>700/);
assert.match(app.els.fractionModalContent.innerHTML, /Preço recomendado<\/span><strong>940/);
assert.match(app.els.fractionModalContent.innerHTML, /\+240.*\+34,3%/s);
assert.match(app.els.fractionModalContent.innerHTML, /Outubro 2026/);
assert.match(app.els.fractionModalContent.innerHTML, /Fora de comercialização/);
assert.match(app.els.fractionModalContent.innerHTML, /Qualidade/);
app.openFractionModal({...apt24,recommendedPrice:null,analysisVersion:''});
assert.match(app.els.fractionModalContent.innerHTML, /Preço recomendado<\/span><strong>—<\/strong>/);

const commercial = loadFunctions('commercial.js', ['parseRow','state','recommendedPriceOf','finalPrice']);
const commercial24 = commercial.parseRow(viewRows.find(row => row['Fração'] === 'Apartamento 24'));
const historyBefore = JSON.stringify(commercial.state.data.priceHistory);
assert.equal(commercial.recommendedPriceOf(commercial24), 940000);
commercial.state.data.finalPrices[24] = 750000;
assert.equal(commercial.finalPrice(commercial24), 750000);
assert.equal(commercial.recommendedPriceOf(commercial24) - commercial.finalPrice(commercial24), 190000);
assert.equal(JSON.stringify(commercial.state.data.priceHistory), historyBefore);
assert.equal(commercial.recommendedPriceOf(commercial.parseRow({...commercial24.raw,'Preço Recomendado':undefined})), null);
assert.equal(writes, 0);

// Fictitious persisted prices/history remain independent of all 39 recommendations.
for(let n=1;n<=39;n++)commercial.state.data.finalPrices[n]=400000+n*1000;
const persistedBefore=JSON.stringify(commercial.state.data);
for(const raw of viewRows){const row=commercial.parseRow(raw);assert.equal(commercial.finalPrice(row),400000+row.number*1000);assert.equal(commercial.recommendedPriceOf(row),expected[row.number]);}
assert.equal(JSON.stringify(commercial.state.data),persistedBefore);
assert.equal(writes,0);

console.log('pricing analysis tests passed');
