'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'../..'),port=Number(process.env.PHASE2A_TEST_PORT)||5194;
const entryTests=process.env.HOME_ENTRY_TESTS==='true';
const entryRedirects=entryTests?JSON.parse(fs.readFileSync(path.join(repo,'vercel.json'),'utf8')).redirects:[];
const middleware=entryTests?import('../../middleware.ts'):null;
// Test process only: no env file, production secrets, Google calls or disk CRM store.
Object.assign(process.env,{COMMERCIAL_ACCESS_PASSWORD:'View-Phase2A-Teste',COMMERCIAL_ACCESS_SECRET:crypto.randomBytes(32).toString('hex'),VERCEL_ENV:'preview',CRM_GOOGLE_DEPLOYMENT_ID:'test-deployment',CRM_GOOGLE_SPREADSHEET_ID:'test-sheet',CRM_GOOGLE_CLIENT_ID:'fictitious-client',CRM_GOOGLE_CLIENT_SECRET:'fictitious-secret',CRM_GOOGLE_REFRESH_TOKEN:'fictitious-token',CRM_GOOGLE_WRITES_ENABLED:'true',CRM_GOOGLE_TEST_WRITES_ENABLED:'true'});
const session=require('../../server/session.js'),access=require('../../api/access.js'),api=require('../../api/commercial-data.js'),makeStore=require('./apps-script-store.js'),fixture=require(process.env.PHASE2B_FIXTURE==='true'?'./client-phase2b-fixture.js':'./client-phase2a-fixture.js');
let store=makeStore(fixture()),reads=0,writes=0,failure='',delay=0;
global.fetch=async(url,options)=>{
  if(url==='https://oauth2.googleapis.com/token')return Response.json({access_token:'fictitious-access'});
  if(url!=='https://script.googleapis.com/v1/scripts/test-deployment:run')throw Error('External network denied');
  const call=JSON.parse(options.body);if(!['crmRead','crmWrite','crmRecover'].includes(call.function))throw Error('Unknown isolated operation');
  if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
  if(call.function==='crmRead')reads++;else writes++;
  if(failure==='offline')throw Error('Simulated offline source');
  if(failure==='write-failure'&&call.function!=='crmRead')return Response.json({done:true,response:{result:{ok:false,code:'WRITE_INCOMPLETE',sourceId:'test-sheet',environment:'test'}}});
  return Response.json({done:true,response:{result:store.context[call.function](...call.parameters)}});
};
const allowed=new Set(['commercial.html','commercial.css','view-theme.css','commercial.js','commercial-client-preferences.js','commercial-fraction-recommendations.js','commercial-client-workflow.js','commercial-client-workflow-ui.js','commercial-recommendations.js','data.json','access.html','access.js','Olhao_Ext_Piscina_Web.jpg','vendor/lucide.min.js']);
if(entryTests)for(const name of ['comparador.html','app.js','style.css'])allowed.add(name);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.jpg':'image/jpeg','.pdf':'application/pdf','.png':'image/png'};
http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');const url=new URL(req.url,'http://127.0.0.1:'+port),name=url.pathname.slice(1)||'commercial.html';
  const reply={statusCode:200,setHeader:(key,value)=>res.setHeader(key,value),status(value){this.statusCode=value;return this},json(body){res.statusCode=this.statusCode;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(body));return this}};
  try{
    if(entryTests){
      const redirect=entryRedirects.find(rule=>rule.source===url.pathname);
      if(redirect){res.writeHead(redirect.permanent?308:307,{Location:redirect.destination+url.search});res.end();return}
      const {config,default:guard}=await middleware;
      if(config.matcher.includes(url.pathname)||url.pathname.startsWith('/server/')){
        const result=await guard(new Request(url,{headers:{cookie:req.headers.cookie||''}}));
        if(result){res.writeHead(result.status,Object.fromEntries(result.headers));res.end(await result.text());return}
      }
    }
    if(!['api/access','access.html','access.js','Olhao_Ext_Piscina_Web.jpg','favicon.ico'].includes(name)&&!await session.hasValidSession(req)){res.writeHead(name.startsWith('api/')?401:302,name.startsWith('api/')?{'Content-Type':'application/json'}:{Location:'/access.html'});res.end(name.startsWith('api/')?JSON.stringify({ok:false,code:'UNAUTHENTICATED'}):'');return}
    if(name.startsWith('api/')){
      let raw='';for await(const part of req){raw+=part;if(raw.length>1000000)throw Error('Too large')}req.body=raw?JSON.parse(raw):undefined;
      if(name==='api/access'||name==='api/commercial-data'){await(name==='api/access'?access:api)(req,reply);return}
      if(name==='api/test-control'&&req.method==='POST'){
        if(req.headers.origin!=='http://127.0.0.1:'+port){reply.status(403).json({ok:false});return}
        const input=req.body||{};
        if(input.reset){store=makeStore(fixture());reads=0;writes=0}
        if(process.env.PHASE2B_FIXTURE==='true'&&input.commercialChange){const data=store.data;for(const key of ['statuses','finalPrices'])if(input.commercialChange[key])Object.assign(data[key],input.commercialChange[key]);const result=store.write({data,baseRevision:store.revision,requestId:'test-change-'+crypto.randomUUID()});if(!result.ok)throw Error('Isolated change failed')}
        failure=['','offline','write-failure'].includes(input.failure)?input.failure:'';delay=Math.min(3000,Math.max(0,Number(input.delay)||0));reply.json({ok:true});return;
      }
      if(name==='api/test-meta'){const data=store.data;reply.json({clients:data.clients.length,events:data.events.length,reads,writes,revision:store.revision,source:'fictitious in-memory test store',productionNetwork:false});return}
      reply.status(404).json({ok:false});return;
    }
    if(name==='favicon.ico'){res.writeHead(204);res.end();return}
    if(name==='api/logout'){res.writeHead(302,{Location:'/access.html'});res.end();return}
    if(!allowed.has(name)&&name!=='config.js'&&!/^plantas\/planta-[a-z0-9.-]+$/.test(name)){res.writeHead(404);res.end();return}
    let content;
    if(name==='config.js')content=Buffer.from('window.THE_VIEW_CONFIG={GOOGLE_SHEETS_WEBAPP_URL:"https://isolated-test.invalid/exec"};');
    else if(name==='commercial.js'){
      let source=fs.readFileSync(path.join(repo,name),'utf8');const begin=source.indexOf('const MAJUCA_IMPORT_RECORDS=['),end=source.indexOf('\n];',begin);if(begin<0||end<0)throw Error('Sanitization failed');source=source.slice(0,begin)+'const MAJUCA_IMPORT_RECORDS=[];'+source.slice(end+3);content=Buffer.from(source);
    }else content=fs.readFileSync(path.join(repo,name));
    res.setHeader('Content-Type',mime[path.extname(name)]||'application/octet-stream');res.end(content);
  }catch{if(!res.headersSent)reply.status(500).json({ok:false,code:'ISOLATED_TEST_ERROR'});else res.end()}
}).listen(port,'127.0.0.1',()=>console.log('Phase 2A isolated preview: http://127.0.0.1:'+port+'/commercial.html; 64 fictitious clients; all writes stay in memory.'));
