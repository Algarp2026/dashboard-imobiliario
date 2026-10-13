"use strict";
const {createHmac} = require('node:crypto');
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
async function fetchJson(url, options) {
  let response;
  try { response = await fetch(url,{...options,redirect:'manual',signal:AbortSignal.timeout(20000)}); }
  catch (error) { throw failure(error.name==='TimeoutError'||error.name==='AbortError'?'SOURCE_TIMEOUT':'SOURCE_UNAVAILABLE'); }
  if (!response.ok) throw failure(response.status===401||response.status===403||response.status>=300&&response.status<400?'SOURCE_AUTHENTICATION_FAILED':'SOURCE_UNAVAILABLE');
  if (!response.headers.get('content-type')?.includes('application/json')) throw failure('INVALID_SOURCE_RESPONSE');
  try { return await response.json(); } catch { throw failure('INVALID_SOURCE_RESPONSE'); }
}
async function callStore(functionName, argument) {
  const env=process.env, deployment=env.CRM_GOOGLE_DEPLOYMENT_ID, sheet=env.CRM_GOOGLE_SPREADSHEET_ID;
  if (!deployment || !/^[\w-]+$/.test(deployment) || !sheet || !env.CRM_GOOGLE_CLIENT_ID || !env.CRM_GOOGLE_CLIENT_SECRET || !env.CRM_GOOGLE_REFRESH_TOKEN) throw failure('SOURCE_NOT_CONFIGURED',503);
  const token=await fetchJson('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',client_id:env.CRM_GOOGLE_CLIENT_ID,client_secret:env.CRM_GOOGLE_CLIENT_SECRET,refresh_token:env.CRM_GOOGLE_REFRESH_TOKEN}).toString()});
  if (typeof token.access_token!=='string'||!token.access_token) throw failure('SOURCE_AUTHENTICATION_FAILED');
  const operation=await fetchJson(`https://script.googleapis.com/v1/scripts/${deployment}:run`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token.access_token},body:JSON.stringify({function:functionName,parameters:[{...argument,sourceId:sheet,environment:env.VERCEL_ENV==='production'?'production':'test'}],devMode:false})});
  if (operation.done!==true||operation.error||!OBJECT(operation.response?.result)) throw failure('INVALID_SOURCE_RESPONSE');
  const result=operation.response.result;
  if (result.sourceId!==sheet || result.environment!==(env.VERCEL_ENV==='production'?'production':'test')) throw failure('SOURCE_ENVIRONMENT_MISMATCH',503);
  if (!result.ok) throw failure(['CONFLICT','WRITE_INCOMPLETE','UNINITIALIZED','WRITES_DISABLED','STORE_SIZE_LIMIT'].includes(result.code)?result.code:'SOURCE_OPERATION_FAILED',result.code==='CONFLICT'?409:result.code==='STORE_SIZE_LIMIT'?413:503);
  if (result.protocol!=='tv-cas-v1'||!REVISION.test(result.revision)||!Number.isFinite(Date.parse(result.confirmedAt))) throw failure('INVALID_SOURCE_RESPONSE');
  return result;
}
function writeEnabled() {
  return process.env.CRM_GOOGLE_WRITES_ENABLED==='true' && (process.env.VERCEL_ENV==='production'||process.env.CRM_GOOGLE_TEST_WRITES_ENABLED==='true');
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
module.exports={validStore,serializedStore,callStore,writeEnabled,ticket,validTicket,REVISION,failure};
