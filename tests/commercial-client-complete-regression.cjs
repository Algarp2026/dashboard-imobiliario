'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'..'),output=process.env.COMPLETE_ARTIFACTS||path.join(require('node:os').tmpdir(),'the-view-complete-regression');
const run=args=>cp.execFileSync(process.execPath,args,{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']});
const syntax=['commercial.js','commercial-client-workflow.js','commercial-client-workflow-ui.js','commercial-recommendations.js','app.js','config.js','tests/commercial-client-complete-browser.mjs','tests/commercial-client-complete-exports.mjs','tests/commercial-contacts-browser.mjs'];
syntax.push('tests/commercial-pr6-regression-browser.mjs');
for(const file of syntax)run(['--check',file]);
const suites=fs.readdirSync(__dirname).filter(file=>file.endsWith('.test.js')).sort();
for(const file of suites){run([path.join('tests',file)]);console.log('PASS '+file)}
// The 2026 CRM snapshot predates approved synchronization changes in main.
// Freeze the audited recovery implementation, not the obsolete transport.
const recoveryBase='3729e304317541b5bd23bb4fa45aadde9d959934',mainBase='fa876dc98f8ccc208ed68123ddce3c71e948ad51';
const base=cp.execFileSync('git',['show',recoveryBase+':commercial.js'],{cwd:repo,encoding:'utf8'}),current=fs.readFileSync(path.join(repo,'commercial.js'),'utf8');
const sync=s=>s.slice(s.indexOf('async function requestCommercialData('),s.indexOf('function appDialog(')).replace(/\r\n/g,'\n');assert.equal(sync(current),sync(base));
const protectedPaths=['api','server','google_apps_script.gs','config.js','data.json','plantas','middleware.ts'];
for(const file of protectedPaths)assert.equal(cp.execFileSync('git',['diff',recoveryBase,'--',file],{cwd:repo,encoding:'utf8'}),'',file);
const commercialPaths=['commercial-client-workflow.js','commercial-client-workflow-ui.js','commercial-client-preferences.js','commercial-fraction-recommendations.js','commercial.html','config.js','data.json','plantas','middleware.ts'];
for(const file of commercialPaths)assert.equal(cp.execFileSync('git',['diff',mainBase,'--',file],{cwd:repo,encoding:'utf8'}),'',file);
const layoutFix='.ux-opportunity-detail .ux-next-action>div{grid-template-columns:minmax(0,1fr)}\n.ux-opportunity-detail .ux-next-action strong{grid-column:1}\n';
const css=fs.readFileSync(path.join(repo,'commercial.css'),'utf8').replace(/\r\n/g,'\n'),originalCss=cp.execFileSync('git',['show',mainBase+':commercial.css'],{cwd:repo,encoding:'utf8'}).replace(/\r\n/g,'\n');
assert.ok(css.includes(layoutFix));assert.equal(css.replace(layoutFix,''),originalCss,'Only the scoped opportunity follow-up layout fix is allowed');
const hashes=Object.fromEntries(syntax.slice(0,4).map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,file))).digest('hex')]));
const report={base:recoveryBase,mainBase,suiteCount:suites.length,suites,syntax,protectedPathsUnchanged:protectedPaths,commercialPathsUnchanged:commercialPaths,syncBlockUnchanged:true,onlyScopedFollowupLayoutChanged:true,hashes,productionAccess:false};
fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'regression-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
