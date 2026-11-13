'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),base='f44ad5e0c5d6aceff213d8b2f6cea9b9a4ab35cf';
const previous=file=>cp.execFileSync('git',['show',base+':'+file],{cwd:root,encoding:'utf8'}).replace(/\r\n/g,'\n');
const mapLine=text=>text.match(/^\s*const PLANT_MAP\s*=([^\n]+);/m);
function restoreMap(source,file){
  const text=source.replace(/\r\n/g,'\n'),old=previous(file);
  const current=mapLine(text),before=mapLine(old);
  assert.ok(current&&before,'Both plan maps must exist');
  const expected=JSON.parse(before[1]);
  for(const item of Object.values(expected))item.image=item.image.replace(/\.jpg$/,'.png');
  assert.deepEqual(JSON.parse(current[1]),expected,'Only the 39 PNG image paths may change');
  return text.replace(current[0],before[0]);
}
function verifyAssets(){
  const records=require('../fixtures/apartment-plan-assets.json'),hash=require('node:crypto').createHash;
  const files=fs.readdirSync(path.join(root,'plantas')).filter(name=>/^planta-apartamento-[\d-]+\.png$/.test(name));
  assert.equal(records.length,32);
  assert.deepEqual(files.sort(),records.map(record=>path.basename(record.path)).sort());
  assert.deepEqual(records.flatMap(record=>record.fractions).sort((a,b)=>a-b),Array.from({length:39},(_,i)=>i+1));
  for(const record of records){
    const bytes=fs.readFileSync(path.join(root,record.path));
    assert.equal(bytes.length,record.bytes);
    assert.equal(hash('sha256').update(bytes).digest('hex'),record.sha256,'Exact original ZIP image: '+record.path);
    assert.ok(!fs.existsSync(path.join(root,record.path.replace(/\.png$/,'.jpg'))));
  }
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'plantas/plantas-manifest.json'),'utf8')),before=JSON.parse(previous('plantas/plantas-manifest.json'));
  for(const item of Object.values(before))item.image=item.image.replace(/\.jpg$/,'.png');
  assert.deepEqual(manifest,before);
  const exclusions=['plantas/plantas-manifest.json',...records.flatMap(record=>[record.path,record.path.replace(/\.png$/,'.jpg')])];
  assert.equal(cp.execFileSync('git',['diff',base,'--','plantas',...exclusions.map(p=>':(exclude)'+p)],{cwd:root,encoding:'utf8'}),'','Only the 32 replaced images and manifest may change');
}
let verified=false;
function protectedDiff(ref,file){
  if(file==='plantas'){
    assert.equal(cp.execFileSync('git',['diff',ref,base,'--',file],{cwd:root,encoding:'utf8'}),'','The approved plant baseline is exact');
    if(!verified){verifyAssets();verified=true}
    return '';
  }
  if(file==='app.js'){
    return restoreMap(fs.readFileSync(path.join(root,file),'utf8'),file)===cp.execFileSync('git',['show',ref+':'+file],{cwd:root,encoding:'utf8'}).replace(/\r\n/g,'\n')?'':'Unexpected app.js changes';
  }
  return cp.execFileSync('git',['diff',ref,'--',file],{cwd:root,encoding:'utf8'});
}
module.exports={root,base,previous,restoreMap,verifyAssets,protectedDiff};
