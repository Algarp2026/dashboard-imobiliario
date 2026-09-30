const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const rows = JSON.parse(fs.readFileSync(path.join(root, 'data.json'), 'utf8'));
const counts = rows.reduce((acc, row) => {
  acc[row.Empreendimento] = (acc[row.Empreendimento] || 0) + 1;
  return acc;
}, {});
assert.equal(rows.length, 319);
assert.deepEqual(counts, {
  'Aura Living': 27,
  'Del Mar Waterfront': 47,
  'EVO Lux Garden': 77,
  'Le Parc': 59,
  'Palácio BR Avenida': 31,
  'Plessis Luxury Residence': 6,
  'Prestige V': 8,
  'Saramago Condomínio': 25,
  'The View': 39
});

const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const end = source.lastIndexOf('})();');
const context = {
  document: { readyState:'loading', addEventListener(){}, body:{style:{}} },
  window: { addEventListener(){} },
  localStorage: { getItem(){return null}, setItem(){throw new Error('unexpected write')} },
  console
};
vm.createContext(context);
vm.runInContext(source.slice(0,end) +
  'globalThis.app={state,els,parseRow,comparableTypology,comparableView,compMatches,compBlock,strategicBenchmarks,strategicItem,selectDiverseComparables,openFractionModal,internalComparables,suggestedPrice,finalPrice};' +
  source.slice(end), context);
const app = context.app;
app.state.rows = rows.map(app.parseRow).filter(Boolean);
app.state.fractions = app.state.rows.filter(row => row.isTheView);
app.state.competitors = app.state.rows.filter(row => !row.isTheView);
app.els.fractionModalContent = {innerHTML:''};
app.els.fractionModal = {classList:{remove(){}}};

for (const [input, expected] of Object.entries({
  T1:'t1', T2:'t2', T3:'t3', T4:'t4', 'T1+1':'t2', 'T2+1':'t3',
  'T1-Duplex':'t1', 'T1 Duplex':'t1', 'T1_Duplex':'t1',
  'T2-Duplex':'t2', 'T2 Duplex':'t2', 'T2_Duplex':'t2',
  'T3-Duplex':'t3', 'T3 Duplex':'t3'
})) assert.equal(app.comparableTypology(input), expected, input);

const prestigeRows = rows.filter(row => row.Empreendimento === 'Prestige V');
assert.equal(prestigeRows.length, 8);
assert.ok(prestigeRows.every(row => row.Vista === null && row['Classe vista comparável'] === 4));
assert.ok(rows.filter(row => row.Empreendimento !== 'Prestige V').every(row => !('Classe vista comparável' in row)));
assert.ok(prestigeRows.every(row => {
  const parsed = app.parseRow(row);
  return parsed.view === null && parsed.comparableViewClass === 4 && app.comparableView(parsed) === 4;
}));
const prestigeFallback = app.parseRow({...prestigeRows[0], 'Classe vista comparável':undefined, Vista:3});
assert.equal(app.comparableView(prestigeFallback), 3);
assert.equal(app.comparableView(app.parseRow({...prestigeRows[0], 'Classe vista comparável':undefined})), null);

for (const number of [12,13]) {
  const fraction = app.state.fractions.find(row => row.number === number);
  assert.equal(fraction.comparableTypology, 't2');
  assert.equal(app.comparableView(fraction), 4);
  const prestigeSameFloor = {...app.parseRow(prestigeRows[0]), floor:fraction.floor};
  const originalCompetitors = app.state.competitors;
  app.state.competitors = [prestigeSameFloor];
  assert.equal(app.compMatches(fraction, 'direct').length, 1);
  assert.match(app.compBlock('Diretos', app.compMatches(fraction, 'direct'), fraction.analysisSegment), /Vista — · Classe comparável de vista: 4/);
  app.state.competitors = originalCompetitors;
}
const apt13 = app.state.fractions.find(row => row.number === 13);
assert.equal(app.suggestedPrice(apt13), 440000);
assert.equal(app.finalPrice(apt13), 435000);
const apt35 = app.state.fractions.find(row => row.number === 35);
assert.equal(apt35.comparableTypology, 't1');
assert.equal(apt35.analysisAvailability, 'Fora de comercialização');
assert.ok(app.compMatches(apt35, 'broad').some(row => row.comparableTypology === 't1'));
for (let number = 30; number <= 35; number++) {
  const fraction = app.state.fractions.find(row => row.number === number);
  assert.equal(fraction.analysisAvailability, 'Fora de comercialização');
  assert.ok(fraction.recommendedPrice > 0);
  assert.ok(app.internalComparables(fraction).some(row => row.number !== number));
  assert.ok(app.strategicBenchmarks(fraction).length > 0);
  assert.ok(app.compMatches(fraction, 'broad').length > 0);
}

const sample = [
  ...Array.from({length:4}, (_, index) => ({development:'EVO', fractionRaw:String(index)})),
  {development:'Del Mar', fractionRaw:'A'},
  {development:'Prestige V', fractionRaw:'B'},
  {development:'Plessis', fractionRaw:'C'},
  {development:'Aura', fractionRaw:'D'}
];
assert.deepEqual(Array.from(app.selectDiverseComparables(sample), row => row.fractionRaw),
  ['0','1','A','B','C','D']);
assert.equal(sample.length, 8);

for (const number of [2,12,13,24,35,36,39]) {
  const fraction = app.state.fractions.find(row => row.number === number);
  assert.ok(fraction);
  for (const mode of ['direct','indirect','broad']) {
    const matches = app.compMatches(fraction, mode);
    assert.ok(matches.every(row => row.comparableTypology === fraction.comparableTypology));
    if (mode === 'direct') assert.ok(matches.every(row => row.floor === fraction.floor && app.comparableView(row) === app.comparableView(fraction)));
    if (mode === 'indirect') assert.ok(matches.every(row => row.floor === fraction.floor));
    if (mode === 'broad') assert.ok(matches.every(row => Math.abs(row.floor - fraction.floor) <= 1));
    const visible = app.selectDiverseComparables(matches);
    assert.ok(visible.length <= 6);
    for (const development of new Set(visible.map(row => row.development))) {
      assert.ok(visible.filter(row => row.development === development).length <= 2);
    }
    assert.match(app.compBlock(mode, matches, fraction.analysisSegment), /comp-block/);
  }
  const strategic = app.strategicBenchmarks(fraction);
  const developments = new Set(strategic.map(row => row.development));
  assert.ok(strategic.length >= 1 && strategic.length <= 6);
  for (const development of developments) {
    assert.ok(strategic.filter(row => row.development === development).length <= 2);
  }
  if ([2,24,36,39].includes(number)) {
    for (const development of ['Del Mar Waterfront','Prestige V','Plessis Luxury Residence']) {
      assert.ok(developments.has(development), `${number}: missing ${development}`);
    }
  }
  assert.ok(app.internalComparables(fraction).some(row => row.number === number));
  app.openFractionModal(fraction);
  assert.match(app.els.fractionModalContent.innerHTML, /Benchmarks estratégicos/);
  assert.match(app.els.fractionModalContent.innerHTML, /Concorrência interna/);
  assert.match(app.els.fractionModalContent.innerHTML, /Concorrência externa/);
}

const apt36 = app.state.fractions.find(row => row.number === 36);
assert.ok(app.strategicBenchmarks(apt36).some(row => row.development === 'Del Mar Waterfront' && row.typology === 'T3' && row.floor !== apt36.floor));
const strategicBaseline = Array.from(app.strategicBenchmarks(apt36), row => row.name);
app.state.compare.development = 'EVO Lux Garden';
assert.ok(app.compMatches(apt36, 'broad').every(row => row.development === 'EVO Lux Garden'));
assert.deepEqual(Array.from(app.strategicBenchmarks(apt36), row => row.name), strategicBaseline);
app.state.compare.development = 'all';
const plessis = app.state.competitors.find(row => row.development === 'Plessis Luxury Residence' && !row.abp && row.totalArea);
const plessisHtml = app.strategicItem(plessis);
assert.match(plessisHtml, /Área total/);
assert.match(plessisHtml, /€\/m² total/);
assert.doesNotMatch(plessisHtml, /ABP|undefined|null|NaN/);
const prestige = app.state.competitors.find(row => row.development === 'Prestige V' && row.abp);
assert.match(app.strategicItem(prestige), /ABP.*€\/m² interior/s);

console.log('compset tests passed');
