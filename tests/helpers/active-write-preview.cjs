'use strict';
// Isolated test process: prepare a large, valid, chunked fictional source.
const assert=require('node:assert/strict'),storePath=require.resolve('./apps-script-store.js'),makeStore=require(storePath);
require.cache[storePath].exports=function paddedStore(initial){
  const store=makeStore(initial),data=structuredClone(initial);
  data.priceMigrationKey=data.priceMigrationKey||'';data.crmMigrationKey=data.crmMigrationKey||'';
  for(const client of data.clients)client.notes='Synthetic baseline padding '+String(client.id)+' '+'x'.repeat(6500);
  const result=store.write({data,baseRevision:store.revision,requestId:'fiction-hotfix-source-seed'});
  assert.equal(result.persisted,true,'Large fictional source must be committed before the test');return store;
};
require('./storage-growth-preview.cjs');
