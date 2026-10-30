'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),read=s=>s.replace(/\r\n/g,'\n');
const ranges=[
 ['confirmation','async function confirmCommercialRequestArchive(','function hasBusinessData(','15ecc6296817fc9ee89d8d9bab6c18f5d5426e74cdf06babb77579cc0bd219ee'],
 ['vault','const LOCAL_BACKUP_LIMIT=','async function migrateLegacyLocalBackups(','47a2019c13581a9455c9b86ded46421c037227624166c5b05cc2a741942fbb84'],
 ['checkpoint','async function latestLocalCheckpoint(','async function restoreLocalCheckpoint(','1180246f1d9389fdb1cb3a714db25778c78c46926d679cb4b2bb7ab2575cc8f0'],
 ['export','function exportLocalRecoveryCopy(','function validateSyncDiagnostics(','f5ebca8efa0fa51497d3088e12195441f79448dd8693c5e7ee89b7e5efe1b7df'],
 ['read','async function applyRemoteData(','let saveTimer=null;','b3f00417b917d4ddeb5e355cc4c357024435f45b9ac827e1987c181ac3b73240'],
 ['backup','async function backupLocalBeforeRemoteLoad(','function save(','0913d80d18d67de73634781eae46cdb26682d07d404752a9d5c0634b29049dd7'],
 ['write','async function performCommercialWrite(','function commercialDataOriginLabel(','439490640f0b44c8333d5988a1983c3bfc6842bfd1df98e1264e81bb03bcd131'],
 ['status','function renderSharedSyncStatus(','function appDialog(','eeb18560c7da884706645f7a6108deb44e9344df01a97828ce74ebe2b1e1c679'],
 ['download','function downloadJson(','function fill(','494862d225bc4971eb4c551d801616fcc86b72121d25b91fe3b3a6d41f5c6e86']
];
function restore(source){
 const base=read(cp.execFileSync('git',['show','54dfd0a:commercial.js'],{cwd:root,encoding:'utf8'}));let restored=read(source);
 for(const [name,start,end,hash]of ranges){const extract=s=>{const a=s.indexOf(start),b=s.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,'Reviewed range '+name);return s.slice(a,b)};const current=extract(restored);assert.equal(crypto.createHash('sha256').update(current).digest('hex'),hash,'Only explicitly reviewed local recovery changes: '+name);restored=restored.replace(current,extract(base))}
 assert.equal(restored,base,'All data, business, PDF, CAS and transport code outside reviewed local-archive ranges remains exact');return restored;
}
function restorePreview(source){
 const line=source.split('\n').find(line=>line.includes("if(process.env.RECOVERY_ARCHIVE_TESTS==='true')"));
 assert.ok(line);assert.equal(crypto.createHash('sha256').update(line).digest('hex'),'51dab19cfd8041a35da57e2952823ae24277471cfd42856fe410458b93801653','Only the explicitly isolated recovery test hook');return source.replace(line+'\n','');
}
module.exports={restore,restorePreview};
