const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const makeStore=require('./helpers/apps-script-store.js'),serialize=require('../server/commercial-store.js').serializedStore;
const template=()=>({clients:[{id:'synthetic-client',name:'Fictitious capacity test'}],events:[],agents:[],finalPrices:{},statuses:{},salePrices:{},priceHistory:{},saleCommissions:{},unavailableReasons:{},statusEventIds:{},salePriceEventIds:{},padding:''});
const snapshot=store=>JSON.stringify([...store.sheets].map(([name,sheet])=>[name,[...sheet.cells]]));
const results=[];
for(const size of [40000,49000,50000,60000,100000,160000]){
  const data=template();data.padding='x'.repeat(size-serialize(data).length);assert.equal(serialize(data).length,size);
  const store=makeStore(template()),legacy=store.sheets.get('Store').cells.get('2:2');
  assert.equal(store.write({data,baseRevision:store.revision,requestId:'capacity-'+size}).persisted,true);
  assert.deepEqual(store.data,data);assert.equal(store.sheets.get('Store').cells.get('2:2'),legacy);
  vm.runInContext(fs.readFileSync(require.resolve('../scripts/measure-store-read-only.gs'),'utf8'),store.context);
  const before=snapshot(store),measured=store.context.measureStoreReadOnly();
  assert.equal(measured.characters,size);assert.equal(measured.revision,store.revision);
  assert.equal(Object.keys(measured).sort().join(','),'characters,counts,revision');assert.equal(snapshot(store),before);
  assert.equal(store.write({data:template(),baseRevision:store.revision,requestId:'backup-'+size}).persisted,true);
  const active=JSON.parse(store.sheets.get('Store').cells.get('6:2'));
  assert.equal(store.context.readVersion_(active.previous).length,size);
  for(const sheet of store.sheets.values())for(const cell of sheet.cells.values())assert.ok(String(cell).length<50000);
  results.push({characters:size,persisted:true,fullBackup:true,legacyUnchanged:true,measurementReadOnly:true});
}
const legacy=makeStore(template()),original=legacy.sheets.get('Store').cells.get('2:2');
legacy.sheets.get('Store').cells.set('2:2',' '.repeat(50001)+original);
assert.equal(legacy.write({data:{...template(),changed:true},baseRevision:legacy.revision,requestId:'whitespace-backup'}).persisted,true);
const pointer=JSON.parse(legacy.sheets.get('Store').cells.get('6:2'));
assert.equal(legacy.context.readVersion_(pointer.previous),' '.repeat(50001)+original);
console.log(JSON.stringify({results,whitespacePreserved:true,realGoogleTested:false}));
