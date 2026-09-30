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
  'globalThis.app={state,els,parseRow,compMatches,compBlock,strategicBenchmarks,strategicItem,selectDiverseComparables,openFractionModal,internalComparables};' +
  source.slice(end), context);
const app = context.app;
app.state.rows = rows.map(app.parseRow).filter(Boolean);
app.state.fractions = app.state.rows.filter(row => row.isTheView);
app.state.competitors = app.state.rows.filter(row => !row.isTheView);
app.els.fractionModalContent = {innerHTML:''};
app.els.fractionModal = {classList:{remove(){}}};

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

for (const number of [2,24,36,39]) {
  const fraction = app.state.fractions.find(row => row.number === number);
  assert.ok(fraction);
  for (const mode of ['direct','indirect','broad']) {
    const matches = app.compMatches(fraction, mode);
    assert.ok(matches.every(row => row.comparableTypology === fraction.comparableTypology));
    if (mode === 'direct') assert.ok(matches.every(row => row.floor === fraction.floor && row.view === fraction.view));
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
  assert.ok(strategic.length >= 3 && strategic.length <= 6);
  for (const development of ['Del Mar Waterfront','Prestige V','Plessis Luxury Residence']) {
    assert.ok(developments.has(development), `${number}: missing ${development}`);
    assert.ok(strategic.filter(row => row.development === development).length <= 2);
  }
  assert.ok(app.internalComparables(fraction).some(row => row.number === number));
  app.openFractionModal(fraction);
  assert.match(app.els.fractionModalContent.innerHTML, /Benchmarks estratégicos/);
  assert.match(app.els.fractionModalContent.innerHTML, /Concorrência interna/);
  assert.match(app.els.fractionModalContent.innerHTML, /Concorrência externa/);
}

const apt36 = app.state.fractions.find(row => row.number === 36);
assert.ok(app.strategicBenchmarks(apt36).some(row => row.development === 'Del Mar Waterfront' && row.typology === 'T3' && row.floor !== apt36.floor));
const plessis = app.state.competitors.find(row => row.development === 'Plessis Luxury Residence' && !row.abp && row.totalArea);
const plessisHtml = app.strategicItem(plessis);
assert.match(plessisHtml, /Área total/);
assert.match(plessisHtml, /€\/m² total/);
assert.doesNotMatch(plessisHtml, /ABP|undefined|null|NaN/);
const prestige = app.state.competitors.find(row => row.development === 'Prestige V' && row.abp);
assert.match(app.strategicItem(prestige), /ABP.*€\/m² interior/s);

console.log('compset tests passed');
