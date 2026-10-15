'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {pathToFileURL}=require('node:url'),{createHmac}=require('node:crypto');
async function main(){
  const root=path.resolve(__dirname,'..'),config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));
  const entries=['/','/index','/index.html'];
  assert.deepEqual(config.redirects.map(r=>r.source),entries);
  for(const route of config.redirects){assert.equal(route.destination,'/commercial.html');assert.equal(route.permanent,false);assert.ok(!entries.includes(route.destination))}
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.ok(html.length<1000);assert.doesNotMatch(html,/<script[^>]+src=|id="clientDetail"|localStorage|fetch\(/);
  assert.match(html,/<meta http-equiv="refresh" content="0;url=\/commercial.html"/);
  let target='';vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],{window:{location:{search:'?entry=fictitious',hash:'#test',replace:value=>{target=value}}}});
  assert.equal(target,'/commercial.html?entry=fictitious#test');
  const canonical=fs.readFileSync(path.join(root,'commercial.html'),'utf8');
  for(const file of ['commercial-client-preferences.js','commercial-fraction-recommendations.js','commercial-client-workflow.js','commercial-client-workflow-ui.js'])assert.equal((canonical.match(new RegExp('src="'+file.replaceAll('.','\\.')+'"','g'))||[]).length,1);
  const {default:middleware}=await import(pathToFileURL(path.join(root,'middleware.ts')).href);
  process.env.COMMERCIAL_ACCESS_SECRET='fictitious-home-entry-secret';
  const issued=String(Date.now()),cookie='tv_commercial_access='+issued+'.'+createHmac('sha256',process.env.COMMERCIAL_ACCESS_SECRET).update(issued).digest('hex');
  for(const entry of entries){
    const rule=config.redirects.find(r=>r.source===entry),url=new URL(rule.destination+'?entry=fictitious','https://example.test');
    const denied=await middleware(new Request(url));assert.equal(denied.status,303);
    const login=new URL(denied.headers.get('location'));assert.equal(login.pathname,'/access.html');assert.equal(login.searchParams.get('next'),'/commercial.html?entry=fictitious');
    assert.equal(await middleware(new Request(url,{headers:{cookie}})),undefined);
  }
  assert.equal(await middleware(new Request('https://example.test/comparador.html',{headers:{cookie}})),undefined);
  console.log('Home entry: three temporary canonical redirects, no loops or duplicate CRM, query/hash fallback, four modules and existing authentication passed.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
