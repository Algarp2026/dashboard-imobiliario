const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const makeStore=require('./helpers/apps-script-store.js');
const serialize=require('../server/commercial-store.js').serializedStore;
const sizes=[40000,49000,50000,60000,100000],results=[];
const template=()=>({clients:[{id:'synthetic-client',name:'Fictitious capacity test',notes:''}],events:[],agents:[],finalPrices:{},statuses:{},salePrices:{},priceHistory:{},saleCommissions:{},unavailableReasons:{},statusEventIds:{},salePriceEventIds:{}});
function sized(length){const data=template();data.clients[0].notes='x'.repeat(length-serialize(data).length);assert.equal(serialize(data).length,length);assert.equal(JSON.stringify(data).length,length);return data}
const cell=(google,key)=>google.sheets.get('Store').cells.get(key)||'';
function snapshot(google){return JSON.stringify([...google.sheets].map(([name,sheet])=>[name,[...sheet.cells],sheet.rows]))}
for(const length of sizes){
  const existing=sized(length),readOnly=makeStore(existing),before=snapshot(readOnly);
  assert.equal(readOnly.read().ok,true);assert.equal(snapshot(readOnly),before);
  vm.runInContext(fs.readFileSync(require.resolve('../scripts/measure-store-read-only.gs'),'utf8'),readOnly.context);
  const measured=readOnly.context.measureStoreReadOnly();assert.equal(measured.characters,length);assert.deepEqual(JSON.parse(JSON.stringify(measured.counts)),{clients:1,events:0,agents:0});assert.equal(measured.revision,readOnly.revision);assert.equal(Object.keys(measured).sort().join(','),'characters,counts,revision');assert.equal(snapshot(readOnly),before);assert.ok(!JSON.stringify(measured).includes('Fictitious'));
  const small=template(),google=makeStore(small),prior=cell(google,'2:2'),oldTime=cell(google,'3:2');
  const reply=google.write({data:existing,baseRevision:google.revision,requestId:'capacity-'+length});
  if(length<=50000){
    assert.equal(reply.ok,true);assert.equal(reply.persisted,true);assert.equal(cell(google,'2:2').length,length);assert.equal(cell(google,'2:2'),serialize(existing));assert.notEqual(cell(google,'3:2'),oldTime);assert.equal(cell(google,'5:2'),'');
    const backup=google.sheets.get('Backups');assert.equal(backup.getLastRow(),2);assert.equal(backup.cells.get('2:4'),prior);
    for(const name of ['Clientes','Eventos','Agentes','EstadosVendas','PrecosHistorico','VendasComissoes'])assert.ok(google.sheets.has(name));
  }else{
    assert.equal(reply.code,'STORE_SIZE_LIMIT');assert.equal(cell(google,'2:2'),prior);assert.equal(cell(google,'3:2'),oldTime);assert.equal(cell(google,'4:2'),'');assert.equal(cell(google,'5:2'),'');assert.equal(google.sheets.size,1);
  }
  const priorSnapshot=snapshot(readOnly),replace=template();replace.clients[0].notes='A new fictitious version';
  const oldReply=readOnly.write({data:replace,baseRevision:readOnly.revision,requestId:'backup-size-'+length});
  if(length<=50000){assert.equal(oldReply.persisted,true);assert.equal(readOnly.sheets.get('Backups').cells.get('2:4').length,length)}
  else{assert.equal(oldReply.code,'STORE_SIZE_LIMIT');assert.equal(snapshot(readOnly),priorSnapshot);assert.throws(()=>readOnly.context.testWrite(),/STORE_SIZE_LIMIT/);assert.equal(snapshot(readOnly),priorSnapshot)}
  results.push({characters:length,read:'accepted in simulated storage',write:length<=50000?'persisted with backup':'STORE_SIZE_LIMIT, no mutation',backupOfExisting:length<=50000?'exact original retained':'rejected, original retained',measurement:'read-only, exact'});
}
const spaced=makeStore(sized(40000));spaced.sheets.get('Store').cells.set('2:2',' '.repeat(10001)+cell(spaced,'2:2'));const spacedBefore=snapshot(spaced);
assert.equal(spaced.write({data:template(),baseRevision:spaced.revision,requestId:'whitespace-boundary'}).code,'STORE_SIZE_LIMIT');assert.equal(snapshot(spaced),spacedBefore);assert.equal(cell(spaced,'5:2'),'');
spaced.context.Session={getEffectiveUser:()=>({getEmail:()=> 'wrong@example.test'})};vm.runInContext(fs.readFileSync(require.resolve('../scripts/measure-store-read-only.gs'),'utf8'),spaced.context);assert.throws(()=>spaced.context.measureStoreReadOnly(),/READ_NOT_AUTHORIZED/);
console.log(JSON.stringify({results,whitespacePreflight:true,realGoogleTested:false}));
