'use strict';
const path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),normalize=s=>s.replace(/\r\n/g,'\n');
const ranges=[
 ['fraction-results','function refreshClientFractionResults(','function refreshClientPreparedConditions(','e94cd6dbcbc0a1f2e64ae8751ab3947a24c64fb6ffd757256666796c99da8010'],
 ['bind','function bind(){','function ensureCrmFormFields(){','4222735e9ce0a2e5a9b1e888b8ab888ab0dc88f8deac284c8e4f8e9aeb2c7559'],
 ['draft','function createCommercialDraftGuard(','function renderCommercialRemoteUpdate(','07ee1f26388d5d4e49e771c45b2947426a311f2d8d77dfb76e7bd685a948ebf7'],
 ['transport','async function requestCommercialTransport(','function loadRemoteData(','992e225bb7e1c16f33d77cf888afff8efe64ad282ac0b589b6f5dfd9c4ea750f'],
 ['read','async function applyRemoteData(','let saveTimer=null;','0c3d76d89bc41ac7664719aeca87eee3d8039e94af19f198c0a134405b08c052'],
 ['write','async function performCommercialWrite(','function commercialDataOriginLabel(','dfbf2d6e9c8b79d37ef7ab3a37339d012213004de678b30cb2540bfed0246fb2']
];
const baseline=file=>normalize(cp.execFileSync('git',['show','869397c:'+file],{cwd:root,encoding:'utf8'}));
function restore(source){let result=normalize(source),base=baseline('commercial.js');for(const[name,start,end,hash]of ranges){const section=text=>{const a=text.indexOf(start),b=text.indexOf(end,a+start.length);assert.ok(a>=0&&b>a);return text.slice(a,b)};const current=section(result);assert.equal(crypto.createHash('sha256').update(current).digest('hex'),hash,'Reviewed filters/deployment-only section: '+name);result=result.replace(current,section(base))}assert.equal(result,base,'All commercial data, PDF, CAS, tickets, original request and archive code outside reviewed gates remains exact');return result}
function restorePreview(source){assert.equal(crypto.createHash('sha256').update(normalize(source)).digest('hex'),'a48979875aa6747ca8bab94ba83577ba541d4bd52d85dd48b37dfee4d6d796b1','Only the reviewed isolated version/fraction-test fixture additions');return baseline('tests/helpers/client-phase2a-preview.cjs')}
function config(value){const result=JSON.parse(JSON.stringify(value));assert.equal(result.buildCommand,'node scripts/build-deployment-version.cjs');assert.equal(result.outputDirectory,'.');assert.deepEqual(result.headers,[{source:'/deployment-version.json',headers:[{key:'Cache-Control',value:'no-store, max-age=0'},{key:'CDN-Cache-Control',value:'no-store'},{key:'Vercel-CDN-Cache-Control',value:'no-store'},{key:'Access-Control-Allow-Origin',value:'*'}]}]);delete result.buildCommand;delete result.outputDirectory;delete result.headers;return result}
module.exports={restore,restorePreview,config};
