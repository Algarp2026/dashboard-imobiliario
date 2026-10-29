'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const main='e604861',reviewed='4967d26';
const reconciliation='9d939f3';
const show=(ref,file)=>cp.execFileSync('git',['show',ref+':'+file],{encoding:'utf8'});
const changed=cp.execFileSync('git',['diff','--name-only','658da6f',main],{encoding:'utf8'}).trim().split('\n');
const combined=new Set(['tests/commercial-browser-regression.cjs','tests/commercial-client-complete-regression.cjs','vercel.json']);
const reconciled=new Set(cp.execFileSync('git',['diff','--name-only',main,reconciliation],{encoding:'utf8'}).trim().split('\n'));
for(const file of changed.filter(file=>!combined.has(file)))if(file==='commercial.js')require('./helpers/presentation-pdf-source.cjs')();else assert.equal(cp.execFileSync('git',['diff',reconciled.has(file)?reconciliation:main,'--',file],{encoding:'utf8'}),'','Published PR19/PR21 source must remain exact: '+file);
for(const file of ['style.css','scripts/data_workbook.py'])assert.equal(cp.execFileSync('git',['diff',reviewed,'--',file],{encoding:'utf8'}),'','Reviewed PR20 must remain exact: '+file);
const analyticalApp=fs.readFileSync('app.js','utf8');
assert.equal(analyticalApp.replace(/\r\n/g,'\n'),show('c19e297','app.js').replace(/\r\n/g,'\n')
 .replace('Decisão da gestão; não altera preços comerciais','Avaliação técnica independente; não altera preços comerciais')
 .replace("metric('Preço base'","metric('PVP original'")
 .replace("metric('Diferença',difference)","metric('Diferença: recomendado vs PVP original',difference)")
 .replaceAll('>Preço base<','>PVP original<'),'Only approved public analytical labels may change');
assert.ok(!analyticalApp.includes('Preço base'),'All public analytical labels must identify PVP original');
assert.ok(analyticalApp.includes('<span>PVP original</span><strong>${money(f.price)}</strong>'),'Fraction card retains original PVP expression');
assert.ok(analyticalApp.includes('<th class="num-col">PVP original</th>'),'Internal comparison identifies original PVP');
assert.ok(analyticalApp.includes('Avaliação técnica independente; não altera preços comerciais'));
assert.ok(analyticalApp.includes('Diferença: recomendado vs PVP original'));
assert.ok(!analyticalApp.includes('Decisão da gestão; não altera preços comerciais'));
// Exact recommendation-only data differences and all 39 values are checked by
// comparator-belaformosa.test.js; the importer remains covered by native-part/idempotency tests.
const expected=JSON.parse(show(main,'vercel.json')),previous=JSON.parse(show(reviewed,'vercel.json'));
expected.git.deploymentEnabled={...previous.git.deploymentEnabled,...expected.git.deploymentEnabled,...JSON.parse(show(reconciliation,'vercel.json')).git.deploymentEnabled};
expected.git.deploymentEnabled['codex/presentation-pdf-price-option']=false;
assert.deepEqual(JSON.parse(fs.readFileSync('vercel.json','utf8')),expected,'Preserve all configuration and both branch deployment guards');
const browser=fs.readFileSync('tests/commercial-browser-regression.cjs','utf8');
for(const suite of ['commercial-auto-sync-browser.mjs','commercial-safe-reconciliation-browser.mjs','comparator-belaformosa-browser.mjs','commercial-client-phase2b-browser.mjs'])assert.ok(browser.includes("'"+suite+"':"),'Browser catalog must include '+suite);
const node=fs.readFileSync('tests/commercial-client-complete-regression.cjs','utf8');
for(const guard of ['commercial-ticket-renewal.test.js','commercial-auto-sync.test.js','commercial-safe-reconciliation.test.js','comparator-belaformosa.test.js','Unchanged local vault/rollback/reconciliation function','PR21 automatic reconciliation, PR19 renewal and synchronization must remain exact','Auto sync must not change backend/authentication'])assert.ok(node.includes(guard),'Missing security/analytical guard: '+guard);
console.log('PR20/main integration: PR19 source exact, comparator and analytical data exact, both browser catalogs retained, Vercel configuration union verified.');
