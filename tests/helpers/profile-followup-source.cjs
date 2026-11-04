'use strict';
const assert=require('node:assert/strict'),cp=require('node:child_process'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),normalize=s=>s.replace(/\r\n/g,'\n');
const reviewed={
 renderClients:'f0a5626eb219ab34dadac8e33e5caa4db31ccef76100abce0c237c1064f23fd7',
 clientFractionWorkspaceMarkup:'468f2eb214fd81e49f3a5b6c6418dd986d4f836fafe4b8bd1a0e1e06657b4012',
 refreshClientFractionResults:'77f7674ff288c1813e64f6012a3e40e49bb58e6d9d17af3dfc5d10d98d9acf0c',
 missingClientModules:'8901b456ca709b7da014921cc60b0612207508afbc701f86a588fd70d718c8e9',
 renderClientDetail:'eb6cd55db3acf1f5dfb16b94e184ca813bafe9718b3601743c48f4ab1d6c76ea',
 protectedCommercialEdit:'ca63f6290fe6e04333431c60b7f40e7f5a26d58ce1ec1c7e0b282cbcb497b188',
 sharedStoreMayRegress:'863df1e2fce1296c66b248c87a78cee92359a4400897d4b0f2bf15c7962c7131'
};
function functions(source){const list=[...source.matchAll(/^(?:async )?function (\w+)\(/gm)];return Object.fromEntries(list.map((m,i)=>[m[1],source.slice(m.index,list[i+1]?.index||source.length)]))}
function restore(source){
 const base=normalize(cp.execFileSync('git',['show','8c5026c:commercial.js'],{cwd:root,encoding:'utf8'}));let result=normalize(source);
 if(result===base)return result;
 const actual=functions(result),before=functions(base);
 for(const [name,hash]of Object.entries(reviewed)){
  assert.equal(crypto.createHash('sha256').update(actual[name]).digest('hex'),hash,'Reviewed profile function: '+name);
  result=result.replace(actual[name],before[name]);
 }
 assert.equal(result,base,'All write/read protocols, CAS, tickets, archive, PDFs, commercial operations and unrelated code remain byte-exact to current main');
 return result;
}
const files={
 'commercial.css':'b9a91d85659513d583f40d8b3e8dcf663062a47238addd15574f902075efbf49',
 'commercial.html':'95d0686805ac33cb0ead94e6580cdf4c4f042abf44004f5792d7cbf3b31946c9',
 'commercial-opportunity-ui.js':'4225fe8ac913267cff08f608483f6ff569476719e2d1484bbf739eb971dbf2fa',
 'commercial-client-workspace.js':'adca5f0369c0b6d72275e82987e83ba5b50a48f987cf394dce16ee6ce0346c8c',
 'commercial-client-workflow-ui.js':'14c4e75cc59e469cee38ec7b808ec16f91dacbbf4ccd2f9a6cd1be5ff4402c2c',
 'commercial-client-workspace.css':'92d8c6f42df8221a15c44f9c291b8f6cd5f084f4ee4ef46c3e8245dc2d505e32',
 'view-workspace.js':'5f62d5909c0ef395115ab55cbd1b4d940ecc1ba2813d48675a87e3c7de503b6d'
};
function restoreFile(file,source){
 assert.ok(files[file],'Only explicitly requested profile UI files may be normalized');
 const base=normalize(cp.execFileSync('git',['show','8c5026c:'+file],{cwd:root,encoding:'utf8'}));
 if(normalize(source)===base)return base;
 assert.equal(crypto.createHash('sha256').update(normalize(source)).digest('hex'),files[file],'Exact current profile UI snapshot: '+file);
 return base;
}
const browserFiles={
 'tests/commercial-contacts-browser.mjs':'541c5a0dc6156f76c273e731f66e89b82dc3be5895034da210bae10ec0eaec1f',
 'tests/crm-reform-safety-browser.mjs':'9dd6c11d03a2ba7075d335cf282c418755bc320c71dbcf901ba5130be52c306f'
};
function restoreBrowser(file,source){
 assert.ok(browserFiles[file]);
 const base=normalize(cp.execFileSync('git',['show','8c5026c:'+file],{cwd:root,encoding:'utf8'}));
 if(normalize(source)===base)return base;
 assert.equal(crypto.createHash('sha256').update(normalize(source)).digest('hex'),browserFiles[file],'Exact UI-route adaptation; no removed safety assertions: '+file);
 return base;
}
function restoreRecommendations(source){
 const base=normalize(cp.execFileSync('git',['show','8c5026c:commercial-fraction-recommendations.js'],{cwd:root,encoding:'utf8'}));
 const expected=base.replace('const row={...f,group:',"const row={...f,orientationTieBreak:!differences.length&&p.choices.orientation.state==='selected'?new Set(p.choices.orientation.values.filter(value=>directions.includes(norm(value)))).size:0,group:").replace('||a.currentPrice-b.currentPrice||a.number-b.number','||a.currentPrice-b.currentPrice||b.orientationTieBreak-a.orientationTieBreak||a.number-b.number');
 assert.equal(normalize(source),expected,'Only the required full-match orientation tie-break may extend the existing OR/floor/budget ranking');
 return base;
}
module.exports={restore,restoreFile,files,restoreBrowser,browserFiles,restoreRecommendations};
