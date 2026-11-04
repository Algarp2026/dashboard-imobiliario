'use strict';
const cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),normalize=s=>s.replace(/\r\n/g,'\n');
const baseline=file=>normalize(cp.execFileSync('git',['show','8148c67:'+file],{cwd:root,encoding:'utf8'}));
const ranges=[
 ['confirmation','async function confirmCommercialRequestArchive(','function hasBusinessData(','a9a6366cf0e7a219c78ec50c43343d40b6f0b06fac4ff55bd9fb04ead2e154ff'],
 ['vault','const LOCAL_BACKUP_LIMIT=','async function migrateLegacyLocalBackups(','e125ac48fc10c94723c6dae665305611f992c22e0c50216f0efd497f96f5ba3a'],
 ['read','async function applyRemoteData(','let saveTimer=null;','693d4ef1e9ba84438090356b4c822549e8df72f7144a81052bba204303a1e686'],
 ['write','async function performCommercialWrite(','function commercialDataOriginLabel(','aa6354d6266f82d122720c60f84a9fa8f7baedfb3272ac722eb0ce583b96fd87'],
 ['status','function renderSharedSyncStatus(','function appDialog(','84dc054f347cd02bde91fafc5c9f471d3210846fd4c75fb74c8a3812ca94c9a0']
];
function restore(source){
 let result=normalize(source);const base=baseline('commercial.js');
 for(const[name,start,end,hash]of ranges){const extract=s=>{const a=s.indexOf(start),b=s.indexOf(end,a+start.length);assert.ok(a>=0&&b>a);return s.slice(a,b)};const actual=extract(result);assert.equal(crypto.createHash('sha256').update(actual).digest('hex'),hash,'Reviewed local storage lifecycle section: '+name);result=result.replace(actual,extract(base))}
 assert.equal(result,base,'Every line outside local archive lifecycle, acknowledgement and diagnostic integration remains exact to merged main');return result;
}
function restorePreview(source){assert.equal(crypto.createHash('sha256').update(normalize(source)).digest('hex'),'b24d28091e8c7efc99be64336b22797c4c3a17ba5e37362815fbb3d430a41947','Only reviewed isolated storage fixture hooks');return baseline('tests/helpers/client-phase2a-preview.cjs')}
function restoreConfig(config){const copy=structuredClone(config);assert.equal(copy.git.deploymentEnabled['codex/optimize-local-recovery-storage'],false,'This branch cannot auto-deploy');delete copy.git.deploymentEnabled['codex/optimize-local-recovery-storage'];return copy}
function restoreAutoSyncTest(source){
 const current=normalize(source),base=baseline('tests/commercial-auto-sync-browser.mjs');
 const oldLine=base.split('\n').find(line=>line.includes("await control(a,{failure:'offline'});await tick(a);"));
 const newLine="  await a.bringToFront();await until(a,()=>window.__autoSyncTest.idle());await control(a,{failure:'offline'});const offlineReads=(await a.evaluate(()=>window.__autoSyncTest.metrics())).reads;await tickPhase(a,'offline');assert.ok((await a.evaluate(()=>window.__autoSyncTest.metrics())).reads>offlineReads,'The offline assertion requires a real attempted read, not a skipped leadership check');assert.equal(posts.length,postCount);assert.match(await a.locator('#commercialSyncBadge').textContent(),/Sem ligação/);";
 const polling="async function tickPhase(page,phase){for(let attempt=0;attempt<6;attempt++){await tick(page);if(await page.locator('#commercialSyncBadge').getAttribute('data-phase')===phase)return}throw Error('Bounded polling did not reach '+phase)}";
 const oldOnline=base.split('\n').find(line=>line.includes("await control(a,{failure:''});await a.clock.fastForward(70000);")),newOnline=oldOnline.replace("await tick(a);await until(a,()=>document.getElementById('commercialSyncBadge')?.dataset.phase==='synced');","await tickPhase(a,'synced');");
 assert.ok(oldLine&&current.includes(newLine)&&current.includes(polling)&&current.includes(newOnline));assert.equal(current.replace(polling+'\n','').replace(newLine,oldLine).replace(newOnline,oldOnline),base,'Only foreground/real-read bounded waits are added; all original failure, ticket, CAS, draft and no-write assertions remain exact');return base;
}
function restoreSearchTest(source){
 const base=baseline('tests/commercial-client-phase2b-browser.mjs'),before="  await page.locator('#clientFractionSearch').fill('Piso 5');";
 const after="  await page.locator('#clientFractionInfo').waitFor({state:'detached'});\n  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));\n  await page.locator('#clientFractionSearch').fill('');await page.locator('#clientFractionSearch').pressSequentially('Piso 5',{delay:40});\n  assert.equal(await page.locator('#clientFractionSearch').inputValue(),'Piso 5');";
 assert.ok(base.includes(before));assert.equal(normalize(source),base.replace(before,after),'Only modal-transition/keyboard input stabilization is allowed; all six-unit, pricing, selection, source, CAS and no-write checks remain exact');return base;
}
module.exports={restore,restorePreview,restoreConfig,restoreAutoSyncTest,restoreSearchTest};
