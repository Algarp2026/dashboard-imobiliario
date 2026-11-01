'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const {inspect,compare}=require('../scripts/verify-browser-archive.cjs');
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'the-view-archive-fictitious-'));
try{
 const archive={format:'the-view-browser-backup-manual-v1',copies:[{id:'fiction-original',raw:'{"fictitious":true}',protected:true}],localStorage:{'theView.crmCommercial.v2.pendingWrite.v1':'fiction-request-exact'}};
 const first=path.join(folder,'fiction-a.json'),second=path.join(folder,'fiction-b.json');fs.writeFileSync(first,JSON.stringify(archive));fs.writeFileSync(second,JSON.stringify(archive));const before=fs.readFileSync(first,'utf8');
 assert.equal(compare(inspect(first),inspect(second)).equal,true);
 const result=cp.spawnSync(process.execPath,['scripts/verify-browser-archive.cjs',first,second],{encoding:'utf8'});assert.equal(result.status,0);assert.equal(JSON.parse(result.stdout).comparison.matchingRecords,1);assert.ok(!result.stdout.includes('fiction-request-exact'));assert.ok(!result.stdout.includes('fiction-original'));assert.equal(fs.readFileSync(first,'utf8'),before);
 archive.current={fictitiousMemoryOnlyChange:true};fs.writeFileSync(second,JSON.stringify(archive));assert.equal(compare(inspect(first),inspect(second)).equal,false,'Matching records and keys must not hide differing memory snapshots or unknown metadata');delete archive.current;
 archive.copies[0].raw='{"fictitious":false}';fs.writeFileSync(second,JSON.stringify(archive));assert.equal(compare(inspect(first),inspect(second)).equal,false);assert.equal(cp.spawnSync(process.execPath,['scripts/verify-browser-archive.cjs',first,second]).status,1);
 archive.copies.push(archive.copies[0]);fs.writeFileSync(second,JSON.stringify(archive));assert.throws(()=>inspect(second));
 console.log('Read-only manual backup verifier PASS: exact record/key comparison, duplicates rejected, no identifiers or payloads printed, files unchanged.');
}finally{const absolute=path.resolve(folder);assert.ok(absolute.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(absolute).startsWith('the-view-archive-fictitious-'));fs.rmSync(absolute,{recursive:true,force:true})}
