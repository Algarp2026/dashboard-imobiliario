'use strict';
const assert=require('node:assert/strict');
const {current}=require('./helpers/persistence-p1-current.cjs');
const {fixture,clone,hash}=require('./helpers/persistence-p1-model.cjs');

// Characterization tests: success means the defect was reproduced, NOT fixed.
const storage=new Map(),a=current(storage),b=current(storage),base=fixture();
a.init(base,hash(base));b.init(base,hash(base));
b.edit(1,'Synthetic edit B');b.save();a.edit(0,'Synthetic edit A');a.save();
assert.equal(a.cache().clients[0].notes,'Synthetic edit A');
assert.notEqual(a.cache().clients[1].notes,'Synthetic edit B');
assert.notEqual(current(storage).cache().clients[1].notes,'Synthetic edit B');
console.log('REPRODUCED P1-CUR-01: current offline cache loses the other tab edit; expected future behavior: durable CAS branch, no loss');

const first=current(),remote=clone(base);first.init(base,hash(base));remote.clients[1].notes='Synthetic confirmed B';
first.replaceShared(remote,hash(remote));first.edit(0,'Synthetic unconfirmed A');
const exported=clone(first.export());assert.deepEqual(exported.base,remote);
const merged=clone(first.merge(exported.base,exported.data,remote));
assert.equal(merged.conflicts.length,0);assert.notEqual(merged.data.clients[1].notes,'Synthetic confirmed B');
console.log('REPRODUCED P1-CUR-02: current export mixes instance data/shared metadata and false conflict-free reversal; expected future behavior: coherent snapshot or forensic');
