'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const makeStore=require('./helpers/apps-script-store.js');
const baseline='a4a04ab',oldSource=execFileSync('git',['show',baseline+':google_apps_script.gs'],{encoding:'utf8'});
const clone=value=>JSON.parse(JSON.stringify(value));
const base={clients:Array.from({length:65},(_,i)=>({id:'fiction-'+i,name:'Fictitious client',notes:'x'.repeat(2400)})),events:[{id:'fiction-reserve-8',clientId:'fiction-0',fractions:[8]},{id:'fiction-reserve-24',clientId:'fiction-1',fractions:[24]}],agents:[{id:'fiction-agent'}],finalPrices:{16:400000},statuses:{8:'Reservado',24:'Reservado'},salePrices:{8:100000,24:200000},priceHistory:{16:[{price:400000}]},saleCommissions:{},unavailableReasons:{},statusEventIds:{8:'fiction-reserve-8',24:'fiction-reserve-24'},salePriceEventIds:{8:'fiction-reserve-8',24:'fiction-reserve-24'},unknown:{keep:true}};
assert.ok(JSON.stringify(base).length>150000);
const next=clone(base);next.clients[0].notes='Fictitious action';
function create(old=false,options={}) {
  const g=makeStore(clone(base),options);if(old)vm.runInContext(oldSource,g.context);return g;
}
function measure(old=false,legacy=false) {
  let enabled=false,virtualMs=0,operations=0,flushes=0;
  const g=create(old,{onStep(name){if(enabled&&(name==='open'||name==='flush'||/^before:(read|value|rows|clear|append):/.test(name))){operations++;virtualMs+=5;if(name==='flush')flushes++;}}});
  if(!legacy)assert.equal(g.write({requestId:'fiction-seed',baseRevision:g.revision,data:clone(base)}).persisted,true);
  // Count metadata RPCs separately; appendRow's internal helper also calls this
  // in both implementations, so differences remain comparable.
  for(const sheet of g.sheets.values()){
    const get=sheet.getLastRow;sheet.getLastRow=function(){if(enabled){operations++;virtualMs+=5}return get.call(this)};
  }
  g.context.Date=class extends Date {static now(){return 1800000000000+virtualMs}};
  const revision=g.revision;g.trace.length=0;enabled=true;
  const wall=performance.now();const result=g.write({requestId:'fiction-measure',baseRevision:revision,data:clone(next),diagnosticsVersion:1});
  const write={operations,modeledMs:virtualMs,flushes,wallMs:+(performance.now()-wall).toFixed(3),mirrorWrites:g.trace.filter(x=>x.type==='rows'&&x.name==='Clientes').length};
  enabled=false;assert.equal(result.persisted,true);assert.deepEqual(g.data,next);
  const control=g.trace.filter(x=>x.type==='write'&&x.name==='Store').map(x=>x.key);
  assert.deepEqual(control,['B5','B5','B6','B5']);
  for(const name of ['events','statuses','priceHistory','finalPrices','agents','unknown'])assert.deepEqual(g.data[name],base[name]);
  assert.ok(g.trace.filter(x=>x.type==='write'||x.type==='rows'||x.type==='append').every(x=>x.held));
  if(!old){
    assert.equal(result.sourceMetrics.version,1);
    for(const phase of ['lock','lock-held','metadata','chunks','chunk-validation','validate','prepare','commercial-validation','backup','stage','archive','mirror-Clientes','activate','cleanup'])assert.ok(result.sourceMetrics.phases[phase],phase);
    assert.ok(!JSON.stringify(result.sourceMetrics).includes('fiction'));
    assert.equal(g.read().sourceMetrics,undefined,'Old callers need not request metrics');
  }
  operations=0;virtualMs=0;flushes=0;enabled=true;
  const read=g.context.crmRead({sourceId:'test-sheet',environment:'test',diagnosticsVersion:1});
  const reading={operations,modeledMs:virtualMs,flushes};enabled=false;assert.deepEqual(clone(read.data),next);
  if(!old)assert.equal(read.sourceMetrics.phases.metadata.count,2,'Both consistent-read snapshots retained');
  return {write,read:reading};
}
const metrics={baseline,modelRpcMs:5,realGoogleMeasurements:false,chunked:{before:measure(true),after:measure()},legacy:{before:measure(true,true),after:measure(false,true)}};
for(const mode of ['chunked','legacy']){
  const {before,after}=metrics[mode];assert.ok(after.write.operations<before.write.operations);
  assert.equal(after.write.flushes,before.write.flushes,'Every durable barrier retained');
  assert.deepEqual(after.read,before.read,'Read consistency cost intentionally unchanged');
  assert.equal(before.write.mirrorWrites,2);assert.equal(after.write.mirrorWrites,1);
}
// Interrupted optimized writes preserve the previous authority or the exact
// committed receipt. Retry uses the original ID/content, without duplicate backups.
for(const point of ['chunks-before','chunks-partial','chunks-corrupt','archive-before','archive-after','pointer-before','pointer-after']){
  const g=create();const request={requestId:'fiction-failure-'+point,baseRevision:g.revision,data:clone(next)};
  g.failWrite(point);let result;try{result=g.write(request)}catch{}
  assert.notEqual(result?.persisted,true);assert.deepEqual(g.data,point==='pointer-after'?next:base);
  g.failWrite('');assert.equal(g.recover(request).persisted,true,point);assert.deepEqual(g.data,next);
  const count=g.sheets.get('BackupsVersions').getLastRow();assert.equal(g.recover(request).persisted,true);
  assert.equal(g.sheets.get('BackupsVersions').getLastRow(),count);assert.deepEqual(g.data.events,base.events);
}
{
  const g=create();const revision=g.revision;
  assert.equal(g.write({requestId:'fiction-user-one',baseRevision:revision,data:clone(next)}).persisted,true);
  const other=clone(base);other.clients[1].notes='Other edit';
  assert.equal(g.write({requestId:'fiction-user-two',baseRevision:revision,data:other}).code,'CONFLICT');assert.deepEqual(g.data,next);
}
// Empty and shrinking mirrors must retain headers and remove stale rows.
{
  const g=create();const lock=g.context.LockService.getScriptLock();lock.waitLock();
  g.context.writeSheet_('TestMirror',['ID'],[['fiction-a'],['fiction-b']]);
  g.context.writeSheet_('TestMirror',['ID'],[]);lock.releaseLock();
  assert.deepEqual([...g.sheets.get('TestMirror').cells],[['1:1','ID']]);
}
if(process.env.LATENCY_METRICS_OUTPUT)fs.writeFileSync(process.env.LATENCY_METRICS_OUTPUT,JSON.stringify(metrics,null,2));
console.log(JSON.stringify(metrics));
