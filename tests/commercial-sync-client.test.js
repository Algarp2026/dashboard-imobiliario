const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),{createHash}=require('node:crypto');
const source=fs.readFileSync(require.resolve('../commercial.js'),'utf8'),end=source.lastIndexOf('})();');
const KEY='theView.crmCommercial.v2',clone=value=>JSON.parse(JSON.stringify(value));
const root=(count)=>({clients:Array.from({length:count},(_,n)=>({id:'client-'+n,name:'Synthetic '+n,stage:'Qualificado',preferences:{typology:'T2'},manualFractions:[],fractions:[],extra:{preserved:true}})),events:[],agents:[],finalPrices:{1:700000},statuses:{},salePrices:{},priceHistory:{},saleCommissions:{},unavailableReasons:{},statusEventIds:{},salePriceEventIds:{},unknownRoot:{preserved:true}});
function app(local,options={}){
  const storage=options.storage||new Map(local===undefined?[]:[[KEY,JSON.stringify(local)]]),requests=[],timers=[],now='2026-10-13T12:00:00.000Z';let upstream=options.upstream?clone(options.upstream):root(63),failure='',writeFault='',writes=0,pdf='',initialMigrations=0;
  const revision=()=>createHash('sha256').update(JSON.stringify(upstream)).digest('hex');
  const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  const result=()=>({ok:true,data:upstream,revision:revision(),protocol:'tv-cas-v1',source:'shared',canWrite:true,confirmedAt:now,readTicket:'1791892800000.'+'a'.repeat(64)});
  const context={console,Date,AbortController,document:{readyState:'loading',addEventListener(){},querySelector(){return null}},window:{THE_VIEW_CONFIG:{GOOGLE_SHEETS_WEBAPP_URL:'https://never-contact-google.invalid/exec'},THE_VIEW_RECOMMENDATIONS:require('../commercial-recommendations.js'),addEventListener(){},open(){return{document:{open(){},write(value){pdf=value},close(){}}}}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},requestAnimationFrame(){},setTimeout(fn){timers.push(fn);return timers.length},clearTimeout(){},fetch:async(url,options={})=>{
    requests.push({url,method:options.method||'GET'});
    if(url==='data.json')return Response.json(JSON.parse(fs.readFileSync(require.resolve('../data.json'),'utf8')));
    assert.equal(url,'/api/commercial-data');assert.equal(options.credentials,'same-origin');
    if(failure==='html')return new Response('<html>Google login</html>',{headers:{'Content-Type':'text/html'}});
    if(failure==='invalid')return new Response('{',{headers:{'Content-Type':'application/json'}});
    if(failure==='timeout')throw Object.assign(new Error('Timeout'),{name:'AbortError'});
    if(failure==='offline')throw new Error('Offline');
    if(failure)return response({ok:false,code:failure},failure==='UNAUTHENTICATED'?401:503);
    if(options.method==='POST'){
      const payload=JSON.parse(options.body);
      if(writeFault==='offline')throw new Error('Write unavailable');
      if(writeFault==='timeout-before')throw Object.assign(new Error('Write timeout'),{name:'AbortError'});
      if(writeFault==='401')return response({ok:false,code:'UNAUTHENTICATED'},401);
      if(writeFault==='403')return response({ok:false,code:'INVALID_ORIGIN'},403);
      if(writeFault==='500')return response({ok:false,code:'SOURCE_UNAVAILABLE'},500);
      if(writeFault==='CONFLICT')return response({ok:false,code:'CONFLICT'},409);
      if(writeFault==='STORE_SIZE_LIMIT')return response({ok:false,code:'STORE_SIZE_LIMIT'},413);
      if(writeFault==='invalid-before')return new Response('{',{headers:{'Content-Type':'application/json'}});
      if(writeFault==='false-200')return response({ok:true});
      if(writeFault==='missing-receipt')return response(result());
      if(writeFault==='wrong-request')return response({...result(),persisted:true,requestId:'another-operation'});
      if(payload.baseRevision!==revision())return response({ok:false,code:'CONFLICT'},409);
      writes++;upstream=clone(payload.data);
      if(writeFault==='timeout-after')throw Object.assign(new Error('Lost write acknowledgement'),{name:'AbortError'});
      if(writeFault==='invalid-after')return new Response('{',{headers:{'Content-Type':'application/json'}});
      const reply={...result(),persisted:true,requestId:payload.requestId};delete reply.data;return response(reply);
    }
    return response(result());
  }};
  vm.createContext(context);vm.runInContext(source.slice(0,end)+`const migrationHistory=ensureHistory;el.dataStatus={textContent:''};el.globalErrorBox={textContent:'',classList:{remove(){}}};populate=()=>{};restoreCommercialContext=()=>{};renderAll=()=>{};activateCommercialView=()=>{};renderCommercialUx=()=>{};restoreCommercialScroll=()=>{};commercialUxToast=()=>{};confirmUser=async()=>true;notifyUser=()=>{};applyUpdatedInitialPriceMigration=()=>{globalThis.migrations=(globalThis.migrations||0)+1};migrateCrmData=()=>{globalThis.migrations=(globalThis.migrations||0)+1};ensureHistory=()=>{globalThis.migrations=(globalThis.migrations||0)+1};globalThis.syncTest={state,sharedSync,loadExcel,loadRemoteData,syncRemote,save,flushPendingSyncOnUnload,normalizeData,reconcileSharedData,commercialDataOriginLabel,generateClientsSummaryPdf,buildClientSummaryRows,clientReportIndicators,resetLocal,hasUnconfirmedLocalData,openSyncReconciliation,migrationHistory};`+source.slice(end),context);
  const api=context.syncTest;return{api,storage,requests,get upstream(){return upstream},set upstream(value){upstream=clone(value)},set failure(value){failure=value},set writeFault(value){writeFault=value},get writes(){return writes},get pdf(){return pdf},get migrations(){return context.migrations||0},context};
}
async function main(){
  for(const scenario of ['missing-records','changed-without-timestamp','newer-record','price-change']){
    const local=root(63),remote=clone(local);
    if(scenario==='missing-records')remote.clients=remote.clients.slice(0,24);
    if(scenario==='changed-without-timestamp')local.clients[0].notes='Newer local note without metadata';
    if(scenario==='newer-record'){local.clients[0].updated='2026-10-14T10:00:00Z';remote.clients[0].updated='2026-10-01T10:00:00Z'}
    if(scenario==='price-change')remote.finalPrices[1]=600000;
    const guarded=app(local,{upstream:remote});const cached=guarded.storage.get(KEY);await guarded.api.loadExcel();
    assert.equal(guarded.api.sharedSync.phase,'conflict',scenario);assert.equal(guarded.api.sharedSync.verified,false);
    assert.equal(guarded.storage.get(KEY),cached);assert.equal(guarded.api.state.data.clients.length,63);assert.equal(guarded.writes,0);
    assert.ok(guarded.storage.has(KEY+'.backupBeforeRemoteLoad'));
    assert.equal(JSON.parse(guarded.storage.get(KEY+'.backupBeforeRemoteLoad')).remoteData.clients.length,remote.clients.length);
    const originalBackup=guarded.storage.get(KEY+'.backupBeforeRemoteLoad');
    guarded.api.state.data.clients[0].notes='A later local edit';await guarded.api.loadRemoteData();
    assert.ok([...guarded.storage.entries()].some(([key,value])=>key.startsWith(KEY+'.backupBeforeRemoteLoad.archive.')&&value===originalBackup));
  }
  const a=app(root(50));await a.api.loadExcel();assert.equal(a.api.state.data.clients.length,63);assert.equal(a.writes,0);assert.equal(a.migrations,0);assert.equal(a.api.sharedSync.phase,'synced');assert.equal(JSON.parse(a.storage.get(KEY+'.backupBeforeRemoteLoad')).data.clients.length,50);assert.deepEqual(clone(a.api.state.data.unknownRoot),{preserved:true});
  for(const model of ['operational','management','listing']){const before=JSON.stringify(a.api.state.data),rows=a.api.buildClientSummaryRows();assert.equal(rows.length,63);assert.equal(a.api.clientReportIndicators(rows).total,63);a.api.generateClientsSummaryPdf(rows,['client'],{model});assert.ok(a.pdf.includes('Base comercial partilhada'));assert.ok(a.pdf.includes('13/10/2026'));assert.equal(JSON.stringify(a.api.state.data),before);assert.equal(a.writes,0)}
  a.api.state.data.clients[0].phone='new-phone';a.api.save();assert.equal(a.api.sharedSync.phase,'pending');assert.ok(a.api.commercialDataOriginLabel().includes('Dados locais'));await a.api.syncRemote();assert.equal(a.writes,1);assert.equal(a.upstream.clients[0].phone,'new-phone');assert.equal(a.api.sharedSync.phase,'synced');assert.equal(a.storage.has(KEY+'.pendingSync'),false);a.api.flushPendingSyncOnUnload();assert.equal(a.writes,1);
  const reloaded=app(undefined,{storage:a.storage,upstream:a.upstream});await reloaded.api.loadExcel();assert.equal(reloaded.api.state.data.clients[0].phone,'new-phone');assert.equal(reloaded.writes,0);
  for(const phase of ['offline','pending','conflict']){
    const oldState=JSON.stringify(a.api.state.data),oldWrites=a.writes,last=a.api.sharedSync.lastConfirmedAt;
    a.api.sharedSync.phase=phase;
    for(const model of ['operational','management','listing']){a.api.generateClientsSummaryPdf(a.api.buildClientSummaryRows(),['client'],{model});assert.ok(a.pdf.includes('Última sincronização confirmada:'));assert.ok(a.pdf.includes('13/10/2026, 13:00:00'));assert.ok(a.pdf.includes('Origem: Dados locais'))}
    assert.equal(a.api.sharedSync.lastConfirmedAt,last);assert.equal(JSON.stringify(a.api.state.data),oldState);assert.equal(a.writes,oldWrites);
  }
  a.api.sharedSync.phase='synced';
  await a.api.resetLocal();assert.equal(a.api.state.data.clients.length,63);assert.equal(a.writes,1);assert.equal(a.api.sharedSync.phase,'synced');
  a.failure='html';const resetBefore=JSON.stringify(a.api.state.data);await a.api.resetLocal();assert.equal(JSON.stringify(a.api.state.data),resetBefore);assert.equal(a.writes,1);a.failure='';
  for(const failure of ['html','invalid','timeout','offline','UNAUTHENTICATED','SOURCE_AUTHENTICATION_FAILED','WRITE_INCOMPLETE']){
    const fixture=app(root(50));fixture.failure=failure;const before=JSON.stringify(fixture.api.state.data);await fixture.api.loadExcel();assert.equal(JSON.stringify(fixture.api.state.data),before);assert.equal(fixture.api.sharedSync.phase,'offline');assert.equal(fixture.migrations,0);fixture.api.state.data.clients[0].notes='Preserved offline note';fixture.api.save();await fixture.api.syncRemote();fixture.api.flushPendingSyncOnUnload();assert.equal(fixture.writes,0);assert.ok(fixture.storage.has(KEY+'.pendingSync'));assert.ok(fixture.api.commercialDataOriginLabel().includes('potencialmente desatualizada'));fixture.api.generateClientsSummaryPdf(fixture.api.buildClientSummaryRows(),['client'],{model:'management'});assert.ok(fixture.pdf.includes('Dados locais'));
    fixture.failure='';await fixture.api.loadRemoteData();assert.equal(fixture.api.sharedSync.phase,'conflict');assert.equal(fixture.api.state.data.clients.length,50);assert.equal(fixture.api.state.data.clients[0].notes,'Preserved offline note');assert.equal(fixture.writes,0);
  }
  for(const fault of ['offline','timeout-before','401','403','500','CONFLICT','STORE_SIZE_LIMIT','invalid-before','false-200','missing-receipt','wrong-request']){
    const fixture=app();fixture.upstream=root(2);await fixture.api.loadExcel();const last=fixture.api.sharedSync.lastConfirmedAt,remoteBefore=JSON.stringify(fixture.upstream);
    fixture.api.state.data.clients[0].notes='Pending synthetic note';fixture.api.save();fixture.writeFault=fault;assert.equal(await fixture.api.syncRemote(),false,fault);assert.equal(fixture.api.sharedSync.verified,false);assert.equal(fixture.api.sharedSync.lastConfirmedAt,last);assert.equal(fixture.api.state.data.clients[0].notes,'Pending synthetic note');assert.ok(fixture.storage.has(KEY+'.pendingSync'));assert.equal(JSON.stringify(fixture.upstream),remoteBefore);assert.equal(fixture.writes,0);
    fixture.api.flushPendingSyncOnUnload();assert.equal(fixture.writes,0);
  }
  for(const fault of ['timeout-after','invalid-after']){
    const fixture=app();await fixture.api.loadExcel();fixture.api.state.data.clients[0].notes='Saved but not acknowledged';fixture.api.save();const last=fixture.api.sharedSync.lastConfirmedAt;
    fixture.writeFault=fault;assert.equal(await fixture.api.syncRemote(),false);assert.equal(fixture.writes,1);assert.equal(fixture.api.sharedSync.lastConfirmedAt,last);assert.ok(fixture.storage.has(KEY+'.pendingSync'));
    const pending=fixture.storage.get(KEY+'.pendingWrite.v1'),requests=fixture.requests.length;assert.equal(await fixture.api.syncRemote(),false);assert.equal(fixture.requests.length,requests);
    fixture.writeFault='401';assert.equal(await fixture.api.syncRemote(true),false);assert.equal(fixture.api.sharedSync.error,'UNAUTHENTICATED');assert.equal(fixture.storage.get(KEY+'.pendingWrite.v1'),pending);
    fixture.writeFault='';await fixture.api.loadRemoteData();assert.equal(fixture.api.sharedSync.phase,'synced');assert.equal(fixture.writes,1);assert.equal(fixture.storage.has(KEY+'.pendingWrite.v1'),false);assert.equal(fixture.storage.has(KEY+'.pendingSync'),false);
  }
  const cold=app();cold.failure='offline';await cold.api.loadExcel();assert.equal(cold.api.state.data.clients.length,0);assert.equal(Object.keys(cold.api.state.data.priceHistory).length,0);assert.equal(cold.migrations,0);assert.equal(cold.writes,0);assert.equal(cold.api.sharedSync.phase,'offline');assert.equal(cold.api.sharedSync.lastConfirmedAt,'');
  for(const model of ['operational','management','listing']){cold.api.generateClientsSummaryPdf([],['client'],{model});assert.ok(cold.pdf.includes('Origem: Dados locais'));assert.ok(!cold.pdf.includes('Última sincronização confirmada:'))}
  cold.failure='';await cold.api.loadRemoteData();assert.equal(cold.api.state.data.clients.length,63);assert.equal(cold.api.sharedSync.phase,'synced');assert.equal(cold.writes,0);
  const b=app(root(50));b.storage.set(KEY+'.pendingSync','{}');await b.api.loadExcel();assert.equal(b.api.sharedSync.phase,'conflict');assert.equal(b.api.state.data.clients.length,50);assert.equal(b.writes,0);
  const migratedOffline=app(root(2));migratedOffline.failure='offline';await migratedOffline.api.loadExcel();const pricesBefore=JSON.stringify(migratedOffline.api.state.data.finalPrices);assert.equal(migratedOffline.api.migrationHistory(),true);migratedOffline.api.save();await migratedOffline.api.syncRemote();assert.equal(migratedOffline.writes,0);assert.equal(JSON.stringify(migratedOffline.api.state.data.finalPrices),pricesBefore);assert.equal(migratedOffline.api.state.data.clients.length,2);assert.ok(migratedOffline.storage.has(KEY+'.pendingSync'));
  const empty=app(root(50));empty.upstream={clients:[],events:[],agents:[],finalPrices:{},statuses:{},salePrices:{},priceHistory:{},saleCommissions:{}};await empty.api.loadExcel();assert.equal(empty.api.sharedSync.error,'EMPTY_SHARED_STORE');assert.equal(empty.api.state.data.clients.length,50);empty.api.openSyncReconciliation();assert.equal(empty.api.state.data.clients.length,50);empty.api.save();assert.equal(await empty.api.syncRemote(),false);assert.equal(empty.writes,0);
  const c=app(root(50));await c.api.loadExcel();const base=clone(c.api.state.data);c.api.state.data.clients[0].phone='Local phone';c.api.save();c.upstream={...clone(base),clients:base.clients.map((item,i)=>i===1?{...item,email:'Remote email'}:item)};assert.equal(await c.api.syncRemote(),false);assert.equal(c.api.sharedSync.phase,'conflict');assert.equal(c.upstream.clients[0].phone,undefined);assert.equal(c.api.state.data.clients[0].phone,'Local phone');assert.ok(c.storage.has(KEY+'.pendingSync'));
  await c.api.loadRemoteData();const merge=c.api.reconcileSharedData(base,c.api.state.data,c.upstream);assert.equal(merge.conflicts.length,0);assert.equal(merge.data.clients[0].phone,'Local phone');assert.equal(merge.data.clients[1].email,'Remote email');
  const simultaneous=clone(c.upstream);simultaneous.clients[0].phone='Different remote phone';assert.ok(c.api.reconcileSharedData(base,c.api.state.data,simultaneous).conflicts.length);assert.ok(c.api.commercialDataOriginLabel().includes('não reconciliada'));
  const unknown={...root(1),futureMetadata:{nested:{unrecognized:'Keep this'}}};const roundtrip=app(unknown);roundtrip.upstream=unknown;await roundtrip.api.loadExcel();assert.deepEqual(clone(roundtrip.api.state.data.futureMetadata),unknown.futureMetadata);
  roundtrip.api.state.data.clients[0].notes='Unmarked local difference';assert.equal(roundtrip.api.hasUnconfirmedLocalData(roundtrip.api.state.data),true);
  console.log('secure sync client tests passed: 50/63 diagnostic, no startup migration or writes, offline safety, pending edits, conservative reconciliation, conflict denial, source labels, exact PDF counts and unknown fields');
}
main().catch(error=>{console.error(error);process.exitCode=1});
