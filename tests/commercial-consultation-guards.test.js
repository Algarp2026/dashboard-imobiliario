'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const code=fs.readFileSync('commercial.js','utf8').replace(/\r\n/g,'\n'),base=cp.execFileSync('git',['show','869397c:commercial.js'],{encoding:'utf8'}).replace(/\r\n/g,'\n');
assert.equal(require('./helpers/consultation-source.cjs').restore(code),base,'Only reviewed consultation, unload and fraction-draft changes survive beyond the approved archive');
const config=JSON.parse(fs.readFileSync('vercel.json','utf8'));assert.deepEqual(config,JSON.parse(cp.execFileSync('git',['show','869397c:vercel.json'],{encoding:'utf8'})),'Exact pre-monitor configuration, including every branch protection, redirect and API setting');assert.equal(config.git.deploymentEnabled['codex/fix-local-recovery-archive'],false);
// Negative assertions prevent reintroducing the removed feature; no runtime replacement.
const removed=['deployment-guard.js','deployment-guard.css','scripts/build-deployment-version.cjs','DEPLOYMENT_UPDATE.md','PR25_FINAL_AUDIT.md','tests/helpers/deployment-source.cjs','tests/helpers/deployment-guard-preview.cjs','tests/commercial-deployment-browser.mjs','tests/commercial-deployment-version.test.js'];
for(const file of removed)assert.equal(fs.existsSync(file),false,'Removed file '+file);
for(const file of ['commercial.js','commercial.html','index.html','comparador.html','access.html','vercel.json'])assert.doesNotMatch(fs.readFileSync(file,'utf8'),/THE_VIEW_DEPLOYMENT_GUARD|DEPLOYMENT_UPDATE_REQUIRED|deployment-version\.json|deployment-guard|the-view-deployment|tv_build|tv_version|tv_from/,'No runtime version checks in '+file);
assert.match(code,/window\.addEventListener\('beforeunload',event=>\{if\(\['LOCAL_STORAGE_FAILED','LOCAL_BACKUP_CAPACITY'\]\.includes\(sharedSync\.error\)\|\|protectedCommercialEdit\(\)\)/);
assert.match(code,/commercialDraftGuard\?\.modified\(\)\|\|modifiedFractionSelection\(\)/);
assert.ok(code.includes("new BroadcastChannel('theView.crm.revisions.v1')"),'Commercial data synchronization remains active');
console.log('Consultation guards: exact archive/CAS/ticket/pending transport, pre-monitor Vercel config, real-edit unload protection and no update-system runtime PASS.');
