'use strict';
// Read-only: never loads credentials, opens a browser, changes files or contacts a source.
const fs=require('node:fs'),crypto=require('node:crypto');
const canonical=value=>Array.isArray(value)?'['+value.map(canonical).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}':JSON.stringify(value);
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
function inspect(filename){
 const raw=fs.readFileSync(filename),value=JSON.parse(raw.toString('utf8'));
 const manual=Object.values(value).includes('the-view-browser-backup-manual-v1');
 if(value.recoveryArchiveFormat!==2&&!manual)throw Error('Unsupported archive format; explicit administrative mapping required');
 const records=manual?value.copies:value.records,local=manual?(value.localStorage||value.localEntries):value.localEntries;
 if(!Array.isArray(records)||records.some(record=>!record||typeof record.id!=='string'||typeof record.raw!=='string')||!local||typeof local!=='object'||Array.isArray(local))throw Error('Unknown archive structure; preserve the original and request administrative mapping');
 const ids=new Set(records.map(record=>record.id));if(ids.size!==records.length)throw Error('Duplicate record identifiers');
 if(!manual){const {checksum,...content}=value;if(sha(canonical(content))!==checksum)throw Error('Archive checksum mismatch')}
 return{format:manual?'the-view-browser-backup-manual-v1':'the-view-recovery-archive-v2',document:value,records,local,report:{format:manual?'manual-v1':'archive-v2',records:records.length,duplicateIds:0,fileBytes:raw.length,fileSha256:sha(raw),manifestChecksum:manual?'not available': 'valid'}};
}
function compare(a,b){
 const left=new Map(a.records.map(record=>[record.id,canonical(record)])),right=new Map(b.records.map(record=>[record.id,canonical(record)]));
 let matching=0;for(const [key,value]of left)if(right.get(key)===value)matching++;
 const keys=new Set([...Object.keys(a.local),...Object.keys(b.local)]);let localMatching=0;for(const key of keys)if(Object.hasOwn(a.local,key)&&Object.hasOwn(b.local,key)&&canonical(a.local[key])===canonical(b.local[key]))localMatching++;
 const completeSnapshotsEqual=canonical(a.document)===canonical(b.document);
 return{matchingRecords:matching,totalLeft:left.size,totalRight:right.size,matchingLocalKeys:localMatching,totalLocalKeys:keys.size,completeSnapshotsEqual,equal:matching===left.size&&matching===right.size&&localMatching===keys.size&&completeSnapshotsEqual};
}
if(require.main===module){try{
 if(process.argv.length<3||process.argv.length>4)throw Error('Usage: node scripts/verify-browser-archive.cjs FILE [SECOND_FILE]');
 const first=inspect(process.argv[2]),result={first:first.report};
 if(process.argv[3]){const second=inspect(process.argv[3]);result.second=second.report;result.comparison=compare(first,second);if(!result.comparison.equal)process.exitCode=1}
 console.log(JSON.stringify(result));
}catch{console.error('Archive verification failed. Preserve the original files; check format, structure and integrity locally. No data was changed.');process.exitCode=1}}
module.exports={inspect,compare};
