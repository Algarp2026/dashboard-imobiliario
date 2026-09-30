const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const rows = JSON.parse(fs.readFileSync(path.join(root, 'data.json'), 'utf8'));
const expected = [0,545000,615000,390000,475000,450000,625000,535000,390000,825000,635000,400000,440000,440000,600000,580000,900000,660000,425000,360000,410000,575000,600000,850000,775000,440000,630000,440000,500000,485000,950000,850000,455000,600000,690000,600000,1450000,1000000,470000,1050000];
const viewRows = rows.filter(row => row.Empreendimento === 'The View');
assert.equal(viewRows.length, 39);

for (const row of viewRows) {
  const number = Number(row['Fração'].match(/\d+/)[0]);
  assert.equal(row['Preço Recomendado'], expected[number]);
  assert.equal(row['Versão Análise'], '2026-09');
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
assert.match(app.els.fractionModalContent.innerHTML, /Preço recomendado<\/span><strong>775/);
assert.match(app.els.fractionModalContent.innerHTML, /\+75.*\+10,7%/s);
assert.match(app.els.fractionModalContent.innerHTML, /Setembro 2026/);
assert.match(app.els.fractionModalContent.innerHTML, /Fora de comercialização/);
assert.match(app.els.fractionModalContent.innerHTML, /Qualidade/);
app.openFractionModal({...apt24,recommendedPrice:null,analysisVersion:''});
assert.match(app.els.fractionModalContent.innerHTML, /Preço recomendado<\/span><strong>—<\/strong>/);

const commercial = loadFunctions('commercial.js', ['parseRow','state','recommendedPriceOf','finalPrice']);
const commercial24 = commercial.parseRow(viewRows.find(row => row['Fração'] === 'Apartamento 24'));
const historyBefore = JSON.stringify(commercial.state.data.priceHistory);
assert.equal(commercial.recommendedPriceOf(commercial24), 775000);
commercial.state.data.finalPrices[24] = 750000;
assert.equal(commercial.finalPrice(commercial24), 750000);
assert.equal(commercial.recommendedPriceOf(commercial24) - commercial.finalPrice(commercial24), 25000);
assert.equal(JSON.stringify(commercial.state.data.priceHistory), historyBefore);
assert.equal(commercial.recommendedPriceOf(commercial.parseRow({...commercial24.raw,'Preço Recomendado':undefined})), null);
assert.equal(writes, 0);

console.log('pricing analysis tests passed');
