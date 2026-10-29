'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'..'),output=process.env.COMPLETE_ARTIFACTS||path.join(require('node:os').tmpdir(),'the-view-complete-regression');
const run=args=>cp.execFileSync(process.execPath,args,{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']});
const syntax=['commercial.js','commercial-client-workflow.js','commercial-client-workflow-ui.js','commercial-recommendations.js','app.js','config.js','tests/crm-reform-browser.mjs','tests/commercial-client-complete-exports.mjs','tests/commercial-contacts-browser.mjs'];
syntax.push('tests/commercial-pr6-regression-browser.mjs');
for(const file of syntax)run(['--check',file]);
const suites=fs.readdirSync(__dirname).filter(file=>file.endsWith('.test.js')).sort();
for(const file of suites){run([path.join('tests',file)]);console.log('PASS '+file)}
// Freeze the published PR14/15/16 implementation, not historical UI layouts.
const recoveryBase='9ba65b56f01a22fa04c8d89f95811510c3ae3e3d',mainBase=recoveryBase;
const historical=file=>cp.execFileSync('git',['show',recoveryBase+':'+file],{cwd:repo,encoding:'utf8'}).replace(/\r\n/g,'\n');
const read=file=>fs.readFileSync(path.join(repo,file),'utf8').replace(/\r\n/g,'\n');
const current=read('commercial.js'),base=historical('commercial.js');
const reviewedSyncFunctions=['requestCommercialData','loadRemoteData','applyRemoteData','syncRemote','performCommercialWrite','reconcileSharedData','renderSharedSyncStatus'];
const sync=s=>s.slice(s.indexOf('function readSyncMeta('),s.indexOf('function appDialog('));
const publishedFunctions=functions(sync(base)),updatedFunctions=functions(sync(current));
for(const [name,body]of Object.entries(publishedFunctions))if(!reviewedSyncFunctions.includes(name)){
  const actual=name==='openSyncReconciliation'?updatedFunctions[name].replace("state.data=next;sharedSync.autoBlock='';","state.data=next;"):updatedFunctions[name];
  assert.equal(actual,body,'Unchanged local vault/rollback/reconciliation function: '+name);
}
for(const file of ['api','server','google_apps_script.gs','google_commercial_integrity.gs'])assert.equal(cp.execFileSync('git',['diff','658da6f','--',file],{cwd:repo,encoding:'utf8'}),'','Auto sync must not change backend/authentication: '+file);
assert.ok(suites.includes('commercial-ticket-renewal.test.js')&&suites.includes('commercial-auto-sync.test.js'));
assert.ok(suites.includes('commercial-safe-reconciliation.test.js'),'Reviewed automatic reconciliation requires semantic/CAS/pending-request tests');
assert.equal(current,cp.execFileSync('git',['show','9d939f3:commercial.js'],{cwd:repo,encoding:'utf8'}).replace(/\r\n/g,'\n'),'PR21 automatic reconciliation, PR19 renewal and synchronization must remain exact');
assert.ok(suites.includes('comparator-belaformosa.test.js'),'Authorized analytical data changes require exact source/table preservation tests');
const protectedPaths=['api/access.js','api/logout.js','config.js','plantas','server/session.js'];
for(const file of protectedPaths)assert.equal(cp.execFileSync('git',['diff',recoveryBase,'--',file],{cwd:repo,encoding:'utf8'}),'',file);
assert.equal(read('middleware.ts').replace(/^    "\/(?:google_commercial_integrity\.gs|commercial-integrity\.js|commercial-opportunities\.js|commercial-opportunity-ui\.js)",\n/gm,''),historical('middleware.ts'),'Only protect the new module paths; authentication behavior unchanged');
function functions(source,indent=''){
  const matches=[...source.matchAll(new RegExp('^'+indent+'(?:async )?function (\\w+)\\(','gm'))];
  return Object.fromEntries(matches.map((m,i)=>[m[1],source.slice(m.index,matches[i+1]?.index??source.indexOf('module.exports=')).trim()]));
}
const serverBefore=functions(historical('server/commercial-store.js')),serverAfter=functions(read('server/commercial-store.js'));
for(const [name,body]of Object.entries(serverBefore))if(name!=='callStore')assert.equal(serverAfter[name],body,'PR16 server transport/security frozen: '+name);
assert.equal(read('api/commercial-data.js').replace(',requireCommercialIntegrity:true',''),historical('api/commercial-data.js'),'Only require the source-side integrity capability; no additional data read');
const previousFunctions=functions(historical('google_apps_script.gs')),currentFunctions=functions(read('google_apps_script.gs'));
// Six source functions have reviewed telemetry/batching changes. Their CAS,
// interrupted-write and exact I/O expectations are exercised by mandatory suites.
const latencyFunctions=['sourceContext_','sourceStep_','storeResponse_','crmRead','crmWrite','writeSheet_'];
assert.ok(suites.includes('commercial-latency.test.js'));
assert.ok(suites.includes('commercial-source-integrity.test.js'));
for(const [name,body]of Object.entries(previousFunctions)){
  if(latencyFunctions.includes(name))continue;
  let actual=currentFunctions[name];
  if(['storeResponse_','crmRead'].includes(name))actual=actual.replace(',commercialIntegrity:commercialIntegrityReady_()?1:0','');
  if(name==='crmWrite'){
    actual=actual.replace('    // Validate the exact CAS baseline while holding the writer lock, before B5,\n    // backups, chunks or mirrors. Exact committed replays above remain idempotent.\n    sourceStep_(context, \'commercial-validation\', function() { validateCommercialTransition_(JSON.parse(current.raw), request.data); });\n','');
    actual=actual.replace(/^    if \(error && \(error.code === 'COMMERCIAL_INTEGRITY'.*\n/m,'');
  }
  assert.equal(actual,body,'Storage/CAS/flush/backup/diagnostics unchanged outside the explicit integrity gate: '+name);
}
const workflowBefore=functions(historical('commercial-client-workflow.js'),'  '),workflowAfter=functions(read('commercial-client-workflow.js'),'  ');
for(const name of ['effectiveEffect','effectTransition','closingError'])assert.equal(workflowAfter[name],workflowBefore[name],'Closing ownership/provenance unchanged: '+name);
const appBefore=functions(base),appAfter=functions(current);
for(const name of ['save','backupBeforeMajucaImport','applyMajucaImportMigration','resetLocal','hasCriticalCommercialEventChange','protectedEventEditError','replaceEventAndReapplyBusinessRules','applyEventBusinessRules','exportPdf','generateClientsSummaryPdf'])assert.equal(appAfter[name],appBefore[name],'Unrelated persistence/business function frozen: '+name);
run(['scripts/build-commercial-integrity.js','--check']);
const commercialPaths=['commercial-client-preferences.js','commercial-fraction-recommendations.js','commercial-recommendations.js','config.js','plantas'];
for(const file of commercialPaths)assert.equal(cp.execFileSync('git',['diff',mainBase,'--',file],{cwd:repo,encoding:'utf8'}),'',file);
const hashes=Object.fromEntries(syntax.slice(0,4).map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,file))).digest('hex')]));
const report={base:recoveryBase,mainBase,suiteCount:suites.length,suites,syntax,protectedPathsUnchanged:protectedPaths,commercialPathsUnchanged:commercialPaths,reviewedSyncFunctions,reviewedSourceLatencyFunctions:latencyFunctions,wholePublishedSyncBlockUnchanged:false,unmodifiedSyncFunctionsFrozen:true,backendUnchangedSincePr18:true,sharedIntegrityBundleVerified:true,hashes,productionAccess:false};
fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'regression-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
