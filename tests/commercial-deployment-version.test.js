'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{build,stamp}=require('../scripts/build-deployment-version.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'the-view-version-'));
try{
  for(const name of ['index.html','commercial.html','comparador.html','access.html'])fs.writeFileSync(path.join(dir,name),'<head><script src="commercial.js" defer></script><link href="view-theme.css" rel="stylesheet"></head><body></body>');
  assert.throws(()=>build(dir,{}),/identity/);
  const first=build(dir,{VERCEL_DEPLOYMENT_ID:'dpl_fictitious_one',VERCEL_ENV:'production',VERCEL_PROJECT_PRODUCTION_URL:'the-view.test',VERCEL_GIT_COMMIT_SHA:'same-commit',SECRET:'must-not-leak'});
  const html=fs.readFileSync(path.join(dir,'commercial.html'),'utf8');assert.match(html,new RegExp('name="the-view-deployment" content="'+first+'"'));assert.ok(html.includes('commercial.js?tv_build='+first));assert.ok(html.includes('content="https://the-view.test"'));assert.ok(!html.includes('must-not-leak'));assert.equal(stamp(html,first,'https://the-view.test'),html);
  const second=build(dir,{VERCEL_DEPLOYMENT_ID:'dpl_fictitious_two',VERCEL_ENV:'production',VERCEL_PROJECT_PRODUCTION_URL:'the-view.test',VERCEL_GIT_COMMIT_SHA:'same-commit'});assert.notEqual(first,second);assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'deployment-version.json'))).version,second);
  for(const name of ['index.html','commercial.html','comparador.html','access.html'])assert.ok(fs.readFileSync(path.join(dir,name),'utf8').includes('content="'+second+'"'));
  const manifest=JSON.parse(fs.readFileSync(path.join(dir,'deployment-version.json')));assert.deepEqual(Object.keys(manifest).sort(),['format','version']);
  const preview=build(dir,{VERCEL_URL:'fictitious-preview-one.vercel.app',VERCEL_ENV:'preview',VERCEL_PROJECT_PRODUCTION_URL:'the-view.test'});const previewHtml=fs.readFileSync(path.join(dir,'commercial.html'),'utf8');assert.ok(previewHtml.includes('name="the-view-version-origin" content=""'));assert.ok(!previewHtml.includes('the-view.test'));assert.notEqual(preview,build(dir,{VERCEL_URL:'fictitious-preview-two.vercel.app',VERCEL_ENV:'preview'}));
  const config=JSON.parse(fs.readFileSync('vercel.json'));assert.equal(config.git.deploymentEnabled['codex/fix-local-recovery-archive'],false);assert.ok(config.headers.find(r=>r.source==='/deployment-version.json').headers.filter(h=>h.key.includes('Cache-Control')).every(h=>h.value.includes('no-store')));
  const code=fs.readFileSync('commercial.js','utf8');assert.ok(code.includes("if(payload&&window.THE_VIEW_DEPLOYMENT_GUARD?.outdated)throw"));assert.ok(code.includes('if(window.THE_VIEW_DEPLOYMENT_GUARD?.outdated)return false;'));
  console.log('Deployment version: same-commit redeploy, embedded identity, all pages/assets, no secrets, no-store and write gates PASS; isolated build only.');
}finally{const target=path.resolve(dir);assert.ok(target.startsWith(path.resolve(os.tmpdir())+path.sep+'the-view-version-'));fs.rmSync(target,{recursive:true,force:true})}
