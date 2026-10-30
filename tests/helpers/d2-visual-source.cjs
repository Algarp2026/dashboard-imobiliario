'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto'),path=require('node:path');
const cwd=path.resolve(__dirname,'../..'),read=s=>s.replace(/\r\n/g,'\n');
const original=file=>read(cp.execFileSync('git',['show','54dfd0a:'+file],{cwd,encoding:'utf8'}));
const fn=(source,name)=>{const start=source.indexOf('function '+name+'(');assert.ok(start>=0);return source.slice(start,source.indexOf('\nfunction ',start+1))};
function restoreCommercial(source){const current=fn(source,'renderWorkspaceDashboard');assert.equal(crypto.createHash('sha256').update(current).digest('hex'),'81ee751e0b8ddaa74c5c096a2573f9f4510667787a8baebf99dc17f9c9680034','Only the reviewed dashboard presentation changes');return source.replace(current,fn(original('commercial.js'),'renderWorkspaceDashboard'))}
function assertOpportunity(){const source=read(fs.readFileSync(path.join(cwd,'commercial-opportunity-ui.js'),'utf8')),base=original('commercial-opportunity-ui.js');const part=s=>s.slice(s.indexOf('    function dataMarkup('),s.indexOf('\n    function collect('));const current=part(source);assert.equal(crypto.createHash('sha256').update(current).digest('hex'),'7652460193abf03d846fba81eab6bc654a8e636e862eedd17f70a320b37f722b');assert.equal(source.replace(current,part(base)),base,'All opportunity operations, guards and persistence remain exact')}
function assertBrowserSafety(){
 const file='tests/crm-reform-safety-browser.mjs',source=read(fs.readFileSync(path.join(cwd,file),'utf8'));
 const normalized=source.replace("import {contactSettings,closeProfile,openOpportunity,reveal}","import {contactSettings}").replace('await openOpportunity(a,9)',"await unit.locator('summary').first().click()");
 assert.equal(normalized,original(file),'Only explicit drawer navigation may change; all commercial/conflict assertions remain exact');
}
function assertAutoSyncTest(){
 const file='tests/commercial-auto-sync-browser.mjs',source=read(fs.readFileSync(path.join(cwd,file),'utf8'));
 const normalized=source.replace("await control(a,{failure:'offline'});await a.clock.fastForward(70000);await tick(a);await until(a,()=>document.getElementById('commercialSyncBadge')?.dataset.phase==='offline');","await control(a,{failure:'offline'});await tick(a);");
 assert.equal(normalized,original(file),'Only wait for the actual offline read; all auto-sync, ticket, concurrency and recovery assertions remain exact');
}
function assertContactsTest(){
 const file='tests/commercial-contacts-browser.mjs',source=read(fs.readFileSync(path.join(cwd,file),'utf8'));
 const normalized=source.replaceAll("locator('.d2-followup').innerText()","locator('.ux-contact-controls').innerText()").replaceAll("await (await reveal(p,'#clientPanel-data [data-ux-client-action=\"stage\"]')).click()","await p.locator('#clientPanel-data [data-ux-client-action=\"stage\"]').click()");
 assert.equal(normalized,original(file),'Only fact location and disclosure navigation may change; contact, history, priority and persistence assertions remain exact');
}
module.exports={restoreCommercial,original,assertOpportunity,assertBrowserSafety,assertAutoSyncTest,assertContactsTest};
