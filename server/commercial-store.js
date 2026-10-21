"use strict";
const {createHmac,randomUUID} = require('node:crypto');
const {sessionCookie,safeEqual} = require('./session.js');
const REVISION = /^[a-f0-9]{64}$/;
const OBJECT = value => !!value && typeof value === 'object' && !Array.isArray(value);

function validStore(data, complete = false) {
  if (!OBJECT(data)) return false;
  for (const key of ['clients','events','agents']) {
    if (complete && !Array.isArray(data[key]) || key in data && !Array.isArray(data[key])) return false;
    const ids = new Set();
    for (const item of data[key] || []) {
      if (!OBJECT(item) || !['string','number'].includes(typeof item.id) || !String(item.id) || ids.has(String(item.id))) return false;
      ids.add(String(item.id));
    }
  }
  for (const key of ['finalPrices','statuses','salePrices','priceHistory','saleCommissions','unavailableReasons','statusEventIds','salePriceEventIds']) {
    if (complete && !OBJECT(data[key]) || key in data && !OBJECT(data[key])) return false;
  }
  function safe(value, depth = 0) {
    if (depth > 40) return false;
    if (value && typeof value === 'object') return Object.entries(value).every(([key,item]) => !['__proto__','prototype','constructor'].includes(key) && safe(item,depth+1));
    return typeof value !== 'number' || Number.isFinite(value);
  }
  return safe(data);
}
function failure(code, status = 502) { const error = new Error(code);error.code=code;error.status=status;return error; }
function serializedStore(value) {
  if (Array.isArray(value)) return '['+value.map(serializedStore).join(',')+']';
  if (value&&typeof value==='object') return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+serializedStore(value[key])).join(',')+'}';
  return JSON.stringify(value);
}
function sourceContext() { return {correlationId:randomUUID(),started:Date.now(),token:null}; }
function sourceLog(context, phase, started, fields = {}) {
  // Fixed labels/statuses only. Never log upstream messages, bodies, tokens or identities.
  try { console.log(JSON.stringify({component:'crm-api',correlationId:context.correlationId,phase,durationMs:Date.now()-started,elapsedMs:Date.now()-context.started,...fields})); } catch {}
}
async function fetchJson(url, options, context, phase) {
  const started=Date.now();
  let response;
  try {
    response=await fetch(url,{...options,redirect:'manual',signal:AbortSignal.timeout(20000)});
    if (!response.ok) throw failure(response.status===401||response.status===403||response.status>=300&&response.status<400?'SOURCE_AUTHENTICATION_FAILED':'SOURCE_UNAVAILABLE');
    if (!response.headers.get('content-type')?.includes('application/json')) throw failure('INVALID_SOURCE_RESPONSE');
    let value;
    try { value=await response.json(); } catch(error) { if(error.name==='TimeoutError'||error.name==='AbortError')throw error;throw failure('INVALID_SOURCE_RESPONSE'); }
    sourceLog(context,phase,started,{layer:phase==='oauth'?'oauth':'execution-api',outcome:'ok',httpStatus:response.status});
    return value;
  } catch(error) {
    const code=error.name==='TimeoutError'||error.name==='AbortError'?'SOURCE_TIMEOUT':['SOURCE_AUTHENTICATION_FAILED','INVALID_SOURCE_RESPONSE','SOURCE_UNAVAILABLE'].includes(error.code)?error.code:'SOURCE_UNAVAILABLE';
    sourceLog(context,phase,started,{layer:phase==='oauth'?'oauth':'execution-api',outcome:code,httpStatus:response?.status||0});
    throw failure(code);
  }
}
async function callStore(functionName, argument, context = sourceContext()) {
  const env=process.env, deployment=env.CRM_GOOGLE_DEPLOYMENT_ID, sheet=env.CRM_GOOGLE_SPREADSHEET_ID;
  if (!deployment || !/^[\w-]+$/.test(deployment) || !sheet || !env.CRM_GOOGLE_CLIENT_ID || !env.CRM_GOOGLE_CLIENT_SECRET || !env.CRM_GOOGLE_REFRESH_TOKEN) throw failure('SOURCE_NOT_CONFIGURED',503);
  if (!context.token) {
    const token=await fetchJson('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',client_id:env.CRM_GOOGLE_CLIENT_ID,client_secret:env.CRM_GOOGLE_CLIENT_SECRET,refresh_token:env.CRM_GOOGLE_REFRESH_TOKEN}).toString()},context,'oauth');
    if (typeof token.access_token!=='string'||!token.access_token) throw failure('SOURCE_AUTHENTICATION_FAILED');
    context.token=token.access_token;
  }
  const phase=functionName==='crmRead'?(argument?.capabilitiesOnly?'preflight':'read'):'write';
  const operation=await fetchJson(`https://script.googleapis.com/v1/scripts/${deployment}:run`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+context.token},body:JSON.stringify({function:functionName,parameters:[{...argument,diagnosticsVersion:1,correlationId:context.correlationId,sourceId:sheet,environment:env.VERCEL_ENV==='production'?'production':'test'}],devMode:false})},context,phase);
  if (!OBJECT(operation)) throw failure('INVALID_SOURCE_RESPONSE');
  if (operation.error) {
    const scriptError=Array.isArray(operation.error.details)&&operation.error.details.find(detail=>detail?.['@type']==='type.googleapis.com/google.apps.script.v1.ExecutionError');
    const operationCode=Number.isInteger(operation.error.code)&&operation.error.code>=0&&operation.error.code<=599?operation.error.code:0;
    sourceLog(context,phase,Date.now(),{layer:scriptError?'apps-script':'execution-api',outcome:'operation-error',operationCode});
  }
  if (operation.done!==true||operation.error||!OBJECT(operation.response?.result)) throw failure('INVALID_SOURCE_RESPONSE');
  const result=operation.response.result;
  if (result.sourceId!==sheet || result.environment!==(env.VERCEL_ENV==='production'?'production':'test')) throw failure('SOURCE_ENVIRONMENT_MISMATCH',503);
  if (!result.ok) {
    if (['COMMERCIAL_INTEGRITY','COMMERCIAL_VALIDATION_UNAVAILABLE'].includes(result.code)) {
      sourceLog(context,phase,Date.now(),{layer:'apps-script',outcome:result.code});
      throw failure(result.code,result.code==='COMMERCIAL_INTEGRITY'?422:503);
    }
    if (result.diagnostics) {
      const diagnostic=result.diagnostics,phases=['open','store-sheet','metadata','control','chunks','chunk-validation','validate','prepare','commercial-validation','lock','intent','intent-version','archive','mirrors','activate','cleanup','stage','backup',...['Clientes','Eventos','Agentes','EstadosVendas','PrecosHistorico','VendasComissoes'].map(name=>'mirror-'+name)];
      if (!OBJECT(diagnostic)||Object.keys(diagnostic).sort().join(',')!=='durationMs,elapsedMs,layer,phase'||!phases.includes(diagnostic.phase)||!['google-sheets','apps-script'].includes(diagnostic.layer)||![diagnostic.durationMs,diagnostic.elapsedMs].every(value=>Number.isFinite(value)&&value>=0&&value<=3600000)) throw failure('INVALID_SOURCE_RESPONSE');
      sourceLog(context,phase,Date.now(),{layer:diagnostic.layer,sourcePhase:diagnostic.phase,sourceDurationMs:diagnostic.durationMs,sourceElapsedMs:diagnostic.elapsedMs,outcome:'source-error'});
    }
    if (result.code==='INVALID_SOURCE_RESPONSE') throw failure('INVALID_SOURCE_RESPONSE');
    const code=['CONFLICT','WRITE_INCOMPLETE','UNINITIALIZED','WRITES_DISABLED','STORE_SIZE_LIMIT','SOURCE_BUSY','SOURCE_TIMEOUT'].includes(result.code)?result.code:'SOURCE_OPERATION_FAILED';
    sourceLog(context,phase,Date.now(),{layer:'apps-script',outcome:code});
    throw failure(code,result.code==='CONFLICT'?409:result.code==='STORE_SIZE_LIMIT'?413:503);
  }
  // Old sources ignore this option and still return a fully validated read below.
  if (functionName==='crmRead'&&argument?.capabilitiesOnly&&result.capabilities?.lightweightPreflight===1) {
    if (result.protocol!=='tv-cas-v1'||result.capabilities.pendingWriteDiagnostics!==1||result.preflight!==true) throw failure('SYNC_DIAGNOSTICS_UNAVAILABLE',503);
    if (argument.requireCommercialIntegrity&&result.capabilities.commercialIntegrity!==1) throw failure('COMMERCIAL_VALIDATION_UNAVAILABLE',503);
    return result;
  }
  if (result.protocol!=='tv-cas-v1'||!REVISION.test(result.revision)||!Number.isFinite(Date.parse(result.confirmedAt))) throw failure('INVALID_SOURCE_RESPONSE');
  if (!OBJECT(result.capabilities)||result.capabilities.pendingWriteDiagnostics!==1) throw failure('SYNC_DIAGNOSTICS_UNAVAILABLE',503);
  if (functionName==='crmRead') {
    if (!Object.hasOwn(result,'pendingWrite')) throw failure('SYNC_DIAGNOSTICS_UNAVAILABLE',503);
    const pending=pendingWriteState(result.pendingWrite);
    if (pending && (pending.state==='pending'&&pending.baseRevision!==result.revision || pending.state==='committed'&&pending.revision!==result.revision)) throw failure('INVALID_SYNC_DIAGNOSTICS');
  }
  if (argument?.requireCommercialIntegrity&&result.capabilities.commercialIntegrity!==1) throw failure('COMMERCIAL_VALIDATION_UNAVAILABLE',503);
  return result;
}
function writeEnabled() {
  return process.env.CRM_GOOGLE_WRITES_ENABLED==='true' && (process.env.VERCEL_ENV==='production'||process.env.CRM_GOOGLE_TEST_WRITES_ENABLED==='true');
}
function pendingWriteState(value) {
  if (value === null) return null;
  if (!OBJECT(value) || !['pending','committed','blocked'].includes(value.state) ||
      typeof value.requestId !== 'string' || !/^[\w-]{8,100}$/.test(value.requestId) ||
      typeof value.baseRevision !== 'string' || !REVISION.test(value.baseRevision) ||
      typeof value.revision !== 'string' || !REVISION.test(value.revision) ||
      Object.keys(value).sort().join(',')!=='baseRevision,requestId,revision,state') throw failure('INVALID_SYNC_DIAGNOSTICS');
  return {state:value.state,requestId:value.requestId,baseRevision:value.baseRevision,revision:value.revision};
}
function ticket(request, revision, issued = Date.now()) {
  const secret=process.env.COMMERCIAL_ACCESS_SECRET||process.env.COMMERCIAL_ACCESS_PASSWORD||'';
  return issued+'.'+createHmac('sha256',secret).update([sessionCookie(request),revision,issued,process.env.CRM_GOOGLE_DEPLOYMENT_ID,process.env.CRM_GOOGLE_SPREADSHEET_ID].join('|')).digest('hex');
}
function validTicket(request, revision, value) {
  if (!REVISION.test(revision)||typeof value!=='string'||!/^\d{13}\.[a-f0-9]{64}$/.test(value)) return false;
  const issued=Number(value.split('.')[0]),age=Date.now()-issued;
  return age>=0&&age<=60*60*1000&&safeEqual(value,ticket(request,revision,issued));
}
module.exports={validStore,serializedStore,callStore,writeEnabled,pendingWriteState,ticket,validTicket,REVISION,failure,sourceContext,sourceLog};
