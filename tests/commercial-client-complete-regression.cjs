'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'..'),output=path.join(repo,'docs/client-profile-complete');
const run=args=>cp.execFileSync(process.execPath,args,{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']});
const syntax=['commercial.js','commercial-client-workflow.js','commercial-client-workflow-ui.js','commercial-recommendations.js','app.js','config.js','tests/commercial-client-complete-browser.mjs','tests/commercial-client-complete-exports.mjs','tests/commercial-contacts-browser.mjs'];
for(const file of syntax)run(['--check',file]);
const suites=fs.readdirSync(__dirname).filter(file=>file.endsWith('.test.js')).sort();
for(const file of suites){run([path.join('tests',file)]);console.log('PASS '+file)}
const base=cp.execFileSync('git',['show','5582825:commercial.js'],{cwd:repo,encoding:'utf8'}),current=fs.readFileSync(path.join(repo,'commercial.js'),'utf8');
const sync=s=>s.slice(s.indexOf('async function requestCommercialData('),s.indexOf('function appDialog(')).replace(/\r\n/g,'\n');assert.equal(sync(current),sync(base));
const protectedPaths=['api','server','google_apps_script.gs','config.js','data.json','plantas','middleware.ts'];
for(const file of protectedPaths)assert.equal(cp.execFileSync('git',['diff','5582825','--',file],{cwd:repo,encoding:'utf8'}),'',file);
const hashes=Object.fromEntries(syntax.slice(0,4).map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,file))).digest('hex')]));
const report={base:'5582825fb27555b336ac5495e4bd3ddb9503c3ad',suiteCount:suites.length,suites,syntax,protectedPathsUnchanged:protectedPaths,syncBlockUnchanged:true,hashes,productionAccess:false};
fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'regression-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
