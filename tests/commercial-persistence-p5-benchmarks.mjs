import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{setup}=require('./helpers/persistence-p5-lab.cjs'),out=process.env.P5_BENCHMARK_OUTPUT||path.join(os.tmpdir(),'the-view-p5-benchmarks.json'),results=[];
for(const size of [1,10,100]){
 const lab=await setup(),requests=[];const build=performance.now();
 for(let i=0;i<size;i++){const r=await lab.request('bench-'+i,'Synthetic historical operation '+i);await lab.send(r);requests.push(r);}
 const buildMs=performance.now()-build,source=await lab.backend.load(),snapshotCharacters=JSON.stringify(source).length;
 for(const [kind,r,options] of [['latest',requests.at(-1),{}],['oldest',requests[0],{}],['missing',await lab.request('missing'),{}],['bounded',requests[0],{maxDepth:Math.max(1,Math.floor(size/2))}]]){
  const before=process.memoryUsage().heapUsed,t=performance.now(),result=await lab.source.lookup(lab.credential,await lab.query(r),options),elapsed=performance.now()-t;
  assert.equal(result.status,kind==='missing'?'NOT_FOUND':kind==='bounded'?'UNKNOWN':'COMMITTED');
  results.push({operations:size,case:kind,status:result.status,reason:result.reason,totalMs:elapsed,stats:result.stats,sourceSnapshotCharacters:snapshotCharacters,temporaryRepresentationEstimateBytes:2*(snapshotCharacters+result.stats.temporaryPeakCharacters),heapUsedBefore:before,heapUsedAfter:process.memoryUsage().heapUsed,buildMs,physicalGoogle:false});
 }
 const g=source.generation;delete source.Manifests[source.Store.B6.manifestRef];source.generation++;await lab.backend.compareExchange(g,source);const t=performance.now(),bad=await lab.source.lookup(lab.credential,await lab.query(requests[0]));assert.equal(bad.status,'UNKNOWN');results.push({operations:size,case:'incomplete',status:bad.status,reason:bad.reason,totalMs:performance.now()-t,stats:bad.stats});
}
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({version:1,scope:'synthetic local VM-backed transition validation; no Google',results,limits:{maxDepth:256,maxAllowedDepth:512,maxMs:5000,maxAllowedMs:10000,maxUnanchoredManifests:1024},notes:['Heap before/after is not peak heap','Temporary representation estimate is UTF-16 characters, not actual allocated memory','Storage reads include logical descriptor/block accesses from a copied snapshot; not Google RPCs','A complete chain is checked even for its latest operation; no derived index is authoritative']},null,2));console.log(JSON.stringify(results.map(r=>({operations:r.operations,case:r.case,status:r.status,totalMs:r.totalMs,manifests:r.stats.manifests,reads:r.stats.reads}))));
