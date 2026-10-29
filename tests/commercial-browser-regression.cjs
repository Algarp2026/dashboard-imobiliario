'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),net=require('node:net');
const repo=path.resolve(__dirname,'..'),port=Number(process.env.COMMERCIAL_TEST_PORT||53214),origin='http://127.0.0.1:'+port;
const {consolidated}=require('./helpers/browser-suite-policy.cjs');
if(!Number.isInteger(port)||port<53000||port>53999)throw Error('Use a dedicated loopback test port in 53000..53999');
const output=path.resolve(process.env.BROWSER_REGRESSION_OUTPUT||path.join(os.tmpdir(),'the-view-browser-regression'));
const plans={
 'commercial-safe-reconciliation-browser.mjs':'visual-workspace',
 'comparator-belaformosa-browser.mjs':'visual-workspace',
 'commercial-auto-sync-browser.mjs':'visual-workspace',
 'crm-reform-browser.mjs':'visual-workspace',
 'crm-reform-safety-browser.mjs':'visual-workspace',
 'crm-reform-report-browser.mjs':'visual-workspace',
 'crm-post-audit-browser.mjs':'visual-workspace',
 'commercial-local-quota-browser.mjs':'client-local-backups',
 'commercial-pending-local-browser.mjs':'client-phase2a',
 'commercial-followup-layout-browser.mjs':'client-complete',
 'commercial-audit-defects-browser.mjs':'client-stage',
 'commercial-stage-browser.mjs':'client-stage',
 'commercial-client-phase2a-browser.mjs':'client-phase2a',
 'commercial-client-phase2b-browser.mjs':'client-phase2b',
 'commercial-client-complete-exports.mjs':'client-complete',
 'commercial-contacts-browser.mjs':'client-complete',
 'commercial-pr6-regression-browser.mjs':'client-complete',
 'commercial-profile-routing-browser.mjs':'client-complete',
 'commercial-home-entry-browser.mjs':'commercial-home-entry',
 'commercial-client-report-grouping-browser.mjs':'client-report-grouping',
 'client-workspace-audit.mjs':'visual-workspace',
 'client-workspace-browser.mjs':'visual-workspace',
 'client-workspace-dialogs.mjs':'visual-workspace',
 'composition-d2-history-routing-probe.mjs':'visual-workspace',
 'composition-d2-platform-browser.mjs':'visual-workspace',
 'visual-audit-browser.mjs':'visual-workspace',
};
const requested=process.argv.slice(2),selected=requested.length?requested:Object.keys(plans),results=[];
for(const name of selected)if(!plans[name])throw Error(consolidated[name]?'Consolidated suite '+name+'. Run: '+consolidated[name].replacements.join(' '):'Unknown browser suite: '+name);
fs.mkdirSync(output,{recursive:true});
const env={...process.env,PHASE2A_TEST_PORT:String(port),COMMERCIAL_TEST_ORIGIN:origin,PHASE2A_TEST_ORIGIN:origin,PHASE2B_TEST_ORIGIN:origin};
function available(){return new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(port,'127.0.0.1',()=>s.close(resolve))})}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(server){for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error('Fixture server exited');try{const r=await fetch(origin+'/api/commercial-data');if(r.status===401)return}catch{}await delay(100)}throw Error('Fixture server did not start')}
async function test(name){
 await available();const dir=path.join(output,name.replace('.mjs',''));fs.mkdirSync(path.join(dir,'docs/client-profile-complete'),{recursive:true});
 const flags={SAFE_RECONCILIATION_TESTS:String(name==='commercial-safe-reconciliation-browser.mjs'),AUTO_SYNC_TESTS:String(['commercial-auto-sync-browser.mjs','commercial-safe-reconciliation-browser.mjs'].includes(name)),D2_SYNTHETIC_CATALOG:String(name.startsWith('crm-')||['commercial-auto-sync-browser.mjs','commercial-safe-reconciliation-browser.mjs'].includes(name)),COMPOSITION_D2_FIXTURE:String(name.startsWith('composition-d2')),VISUAL_AUDIT_FIXTURE:String(name==='visual-audit-browser.mjs'),COMPLETE_EXPORT_FIXTURE:String(name==='commercial-client-complete-exports.mjs')};
 const server=cp.spawn(process.execPath,[path.join(repo,'tests/helpers',plans[name]+'-preview.cjs')],{cwd:repo,env:{...env,...flags},windowsHide:true,stdio:['ignore','pipe','pipe']});
 let serverLog='';server.stdout.on('data',b=>serverLog+=b);server.stderr.on('data',b=>serverLog+=b);
 try{
  console.log('RUN '+name);await ready(server);
  const gitDir=cp.execFileSync('git',['rev-parse','--absolute-git-dir'],{cwd:repo,encoding:'utf8'}).trim();
  const run=cp.spawn(process.execPath,[path.join(repo,'tests',name)],{cwd:dir,env:{...env,GIT_DIR:gitDir,GIT_WORK_TREE:repo,REFORM_ARTIFACTS:dir,COMPLETE_ARTIFACTS:path.join(dir,'docs/client-profile-complete'),PHASE2A_ARTIFACTS:dir,PHASE2B_ARTIFACTS:dir},windowsHide:true,stdio:['ignore','pipe','pipe']});
  let log='';const logPath=path.join(dir,'output.log');fs.writeFileSync(logPath,'');const append=b=>{log+=b;fs.appendFileSync(logPath,b)};run.stdout.on('data',append);run.stderr.on('data',append);const timer=setTimeout(()=>run.kill(),240000);
  const code=await new Promise((resolve,reject)=>{run.once('error',reject);run.once('exit',resolve)});clearTimeout(timer);
  fs.writeFileSync(path.join(dir,'output.log'),log);results.push({name,code,passed:code===0});console.log((code===0?'PASS ':'FAIL ')+name+(code===0?'':'\n'+log.slice(-3500)));
 }finally{server.kill();await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));fs.writeFileSync(path.join(dir,'server.log'),serverLog)}
}
(async()=>{for(const name of selected)await test(name);fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));if(results.some(r=>!r.passed))process.exitCode=1})().catch(e=>{console.error(e);process.exitCode=1});
