'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {previous,restoreMap,verifyAssets}=require('./helpers/apartment-plan-assets.cjs');
verifyAssets();
const shared=[[2,10,17,24,31],[7,15],[9,16],[23,30]];
const stem=n=>(shared.find(group=>group.includes(n))||[n]).map(value=>String(value).padStart(2,'0')).join('-');
const parse=text=>JSON.parse(text.match(/^\s*const PLANT_MAP\s*=([^\n]+);/m)[1]);
const commercial=parse(fs.readFileSync('commercial.js','utf8')),comparator=parse(fs.readFileSync('app.js','utf8'));
const manifest=JSON.parse(fs.readFileSync('plantas/plantas-manifest.json','utf8'));
for(const file of ['commercial.js','app.js']){
  assert.equal(restoreMap(fs.readFileSync(file,'utf8'),file),previous(file),'All product code outside image paths must be exact');
}
const oldManifest=JSON.parse(previous('plantas/plantas-manifest.json'));
for(const record of Object.values(oldManifest))record.image=record.image.replace(/\.jpg$/,'.webp');
assert.deepEqual(manifest,oldManifest,'Preserve original PDF links and metadata');
assert.equal(Object.keys(commercial).length,39);
const paths=new Set();
for(let n=1;n<=39;n++){
  const image='plantas/planta-apartamento-'+stem(n)+'.webp';
  assert.equal(commercial[n].image,image);
  assert.equal(comparator[n].image,image);
  assert.equal(manifest[n].image,image);
  const bytes=fs.readFileSync(image);
  assert.equal(bytes.subarray(0,4).toString(),'RIFF');
  assert.equal(bytes.subarray(8,12).toString(),'WEBP');
  paths.add(image);
}
assert.equal(paths.size,32,'Shared fractions must not duplicate assets');
const hashes=Object.fromEntries([...paths].map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
assert.equal(Object.values(hashes).length,new Set(Object.values(hashes)).size,'Each distinct plan has distinct content');
const files=fs.readdirSync('plantas');
assert.equal(files.filter(p=>/^planta-apartamento-[\d-]+\.webp$/.test(p)).length,32);
assert.equal(files.filter(p=>/^planta-apartamento-[\d-]+\.png$/.test(p)).length,0);
assert.equal(files.filter(p=>/^planta-apartamento-[\d-]+\.jpg$/.test(p)).length,0,'Obsolete mapped JPEGs removed');
assert.equal(files.filter(p=>path.extname(p)==='.pdf').length,32,'Original PDF downloads retained');
console.log('Apartment plans: 39 mappings, 32 unique lossless WebPs, normalized names, exact product/map scope, original PDFs preserved.');
