const assert=require('node:assert/strict');
const makeStore=require('./helpers/apps-script-store.js');
const clone=value=>JSON.parse(JSON.stringify(value));
const base={clients:Array.from({length:63},(_,i)=>({id:'synthetic-'+i,name:'Fictitious '+i,notes:'x'.repeat(2400)})),events:Array.from({length:86},(_,i)=>({id:'event-'+i,clientId:'synthetic-0',notes:'fictitious'})),agents:[{id:'agent-test',name:'Synthetic agent'}],finalPrices:{2:615000},statuses:{2:'Disponível'},salePrices:{},priceHistory:{2:[{price:615000}]},saleCommissions:{},unavailableReasons:{},statusEventIds:{},salePriceEventIds:{},unknown:{preserved:true,unicode:'ação 😀',formula:'=SUM(A1)'}};
assert.ok(JSON.stringify(base).length>150000);
const initial={...clone(base),clients:base.clients.slice(0,2).map(c=>({...c,notes:''})),events:[]};
const operation=(store,data,id='synthetic-write-001')=>({baseRevision:store.revision,requestId:id,data});
const cells=store=>store.sheets.get('Store').cells;
const archived=store=>store.sheets.get('BackupsVersions')?.getLastRow()||0;
const versionData=(store,version)=>JSON.parse(store.context.readVersion_(version));

const store=makeStore(initial),legacy=cells(store).get('2:2'),op=operation(store,base);
assert.equal(store.write(op).persisted,true);assert.deepEqual(store.data,base);assert.equal(cells(store).get('2:2'),legacy);
let pointer=JSON.parse(cells(store).get('6:2'));
assert.ok(pointer.version.count>6);assert.deepEqual(versionData(store,pointer.previous),initial);
assert.equal(store.write(op).persisted,true);assert.equal(archived(store),1);
const changed=clone(base);changed.clients[0].notes+='changed';
const chunkSheet=store.sheets.get('StoreVersions');chunkSheet.maxRows=chunkSheet.getLastRow();
const priorRows=chunkSheet.maxRows;
const second=operation(store,changed,'synthetic-write-002');assert.equal(store.write(second).persisted,true);
assert.ok(chunkSheet.maxRows>priorRows);
pointer=JSON.parse(cells(store).get('6:2'));assert.deepEqual(versionData(store,pointer.previous),base);
const restored=versionData(store,pointer.previous),restore=operation(store,restored,'synthetic-restore-003');
assert.equal(store.write(restore).persisted,true);assert.deepEqual(store.data,base);
assert.equal(store.write({...op,requestId:'stale-user-write'}).code,'CONFLICT');
assert.deepEqual(store.data,base);assert.equal(cells(store).get('2:2'),legacy);
for(const sheet of store.sheets.values())for(const value of sheet.cells.values())assert.ok(String(value).length<50000);

for(const fault of ['chunks-before','chunks-partial','chunks-corrupt','archive-before','archive-after','pointer-before','mirror']){
  const s=makeStore(initial);assert.equal(s.write(operation(s,base)).persisted,true);
  const before=JSON.stringify(s.data),active=cells(s).get('6:2'),oldLegacy=cells(s).get('2:2');
  const write=operation(s,changed,'failure-'+fault);
  fault==='mirror'?s.failMirror('Eventos'):s.failWrite(fault);
  assert.throws(()=>s.write(write),undefined,fault);
  assert.equal(JSON.stringify(s.data),before,fault);assert.equal(cells(s).get('6:2'),active);assert.equal(cells(s).get('2:2'),oldLegacy);
  assert.equal(s.recover({...write,requestId:'unrelated-recovery'}).code,'CONFLICT');
  s.failWrite('');s.failMirror('');assert.equal(s.recover(write).persisted,true,fault);assert.deepEqual(s.data,changed);
  const backups=archived(s);assert.equal(s.recover(write).persisted,true);assert.equal(archived(s),backups);
}
const lost=makeStore(initial),lostOp=operation(lost,base);lost.failWrite('pointer-after');
assert.throws(()=>lost.write(lostOp));assert.deepEqual(lost.data,base);
lost.failWrite('');assert.equal(lost.recover(lostOp).persisted,true);assert.equal(archived(lost),1);

const corrupt=makeStore(initial);corrupt.write(operation(corrupt,base));
const active=JSON.parse(cells(corrupt).get('6:2'));
corrupt.sheets.get('StoreVersions').cells.set(active.version.start+':3',':tampered');
assert.throws(()=>corrupt.read(),/INVALID_STORAGE/); // Never fall back silently to the old 2-client B2.
assert.deepEqual(versionData(corrupt,active.previous),initial);
const legacyWriter=makeStore(initial);legacyWriter.write(operation(legacyWriter,base));cells(legacyWriter).set('2:2',JSON.stringify({...initial,extra:'legacy writer'}));
assert.throws(()=>legacyWriter.read(),/LEGACY_STORE_CHANGED/);
const oversized=clone(base);oversized.unknown.large='x'.repeat(900000);
const limited=makeStore(initial);assert.equal(limited.write(operation(limited,oversized)).code,'STORE_SIZE_LIMIT');assert.equal(limited.sheets.has('StoreVersions'),false);
const readonly=makeStore(initial);readonly.properties.CRM_API_WRITES_ENABLED='false';assert.equal(readonly.write(operation(readonly,base)).code,'WRITES_DISABLED');
assert.equal(readonly.context.testWrite().ok,true);assert.equal(readonly.sheets.has('StoreVersions'),false);
const unicode=makeStore(initial),unicodeData=clone(base);unicodeData.unknown.unicode='😀'.repeat(50000);
assert.equal(unicode.write(operation(unicode,unicodeData)).persisted,true);assert.deepEqual(unicode.data,unicodeData);
for(const [key,value] of unicode.sheets.get('StoreVersions').cells){if(key.endsWith(':3')){assert.ok(value.startsWith(':'));assert.ok(!/[\uD800-\uDBFF]$/.test(value));assert.ok(value.length<=24001)}}
const hugeField=makeStore(initial),hugeData=clone(base);hugeData.clients[0].notes='x'.repeat(51000);
assert.throws(()=>hugeField.write(operation(hugeField,hugeData)),/Cell capacity exceeded/);assert.deepEqual(hugeField.data,initial);
console.log(JSON.stringify({characters:JSON.stringify(base).length,clients:63,events:86,agents:1,partialFailures:7,largeBackup:true,restoreWithCAS:true,checksumCorruptionRejected:true,legacyWriterDetected:true,realGoogle:false}));
