"use strict";
const {hasValidSession,sameOrigin,header} = require('../server/session.js');
const store = require('../server/commercial-store.js');
const {createHash} = require('node:crypto');

module.exports = async function commercialData(request,response) {
  const context=store.sourceContext();
  response.setHeader('X-CRM-Correlation-Id',context.correlationId);
  response.setHeader('Cache-Control','private, no-store');
  response.setHeader('X-Content-Type-Options','nosniff');
  if (!await hasValidSession(request)) return response.status(401).json({ok:false,code:'UNAUTHENTICATED'});
  if (!['GET','POST'].includes(request.method)) {response.setHeader('Allow','GET, POST');return response.status(405).json({ok:false,code:'METHOD_NOT_ALLOWED'});}
  try {
    if (request.method==='POST') {
      if (!sameOrigin(request)||!header(request,'content-type').split(';')[0].trim().includes('application/json')) return response.status(403).json({ok:false,code:'INVALID_ORIGIN'});
      if (!store.writeEnabled()) return response.status(503).json({ok:false,code:'WRITES_DISABLED'});
      const body=typeof request.body==='string'?JSON.parse(request.body):request.body;
      if (!body || !['save','recover'].includes(body.action)||!store.validStore(body.data,true)||JSON.stringify(body).length>1000000||typeof body.baseRevision!=='string'||!store.REVISION.test(body.baseRevision)||typeof body.requestId!=='string'||! /^[\w-]{8,100}$/.test(body.requestId)) return response.status(400).json({ok:false,code:'INVALID_PAYLOAD'});
      if (body.action==='save'&&!store.validTicket(request,body.baseRevision,header(request,'x-crm-read-ticket'))) return response.status(403).json({ok:false,code:'READ_REQUIRED'});
      // Probe the deployed source before any mutation, including recovery. An old
      // Apps Script must not execute a write before incompatibility is detected.
      await store.callStore('crmRead',{capabilitiesOnly:true,requireCommercialIntegrity:true},context);
      const saved=await store.callStore(body.action==='recover'?'crmRecover':'crmWrite',{data:body.data,baseRevision:body.baseRevision,requestId:body.requestId},context);
      if (saved.persisted!==true||saved.requestId!==body.requestId||saved.revision!==createHash('sha256').update(store.serializedStore(body.data)).digest('hex')) throw store.failure('INVALID_SOURCE_RESPONSE');
      store.sourceLog(context,'request',context.started,{outcome:'confirmed',writeOutcome:'confirmed'});
      return response.status(200).json({ok:true,persisted:true,requestId:saved.requestId,revision:saved.revision,confirmedAt:saved.confirmedAt,updatedAt:saved.updatedAt||'',readTicket:store.ticket(request,saved.revision),canWrite:store.writeEnabled()&&saved.canWrite===true,source:'shared',protocol:saved.protocol,capabilities:{pendingWriteDiagnostics:1}});
    }
    const loaded=await store.callStore('crmRead',undefined,context);
    if (!store.validStore(loaded.data)) throw store.failure('INVALID_SOURCE_RESPONSE');
    store.sourceLog(context,'request',context.started,{outcome:'confirmed',writeOutcome:'not-applicable'});
    return response.status(200).json({ok:true,data:loaded.data,revision:loaded.revision,confirmedAt:loaded.confirmedAt,updatedAt:loaded.updatedAt||'',readTicket:store.ticket(request,loaded.revision),canWrite:store.writeEnabled()&&loaded.canWrite===true,source:'shared',protocol:loaded.protocol,capabilities:{pendingWriteDiagnostics:1},pendingWrite:store.pendingWriteState(loaded.pendingWrite)});
  } catch(error) {
    store.sourceLog(context,'request',context.started,{outcome:'failed',code:error instanceof SyntaxError?'INVALID_PAYLOAD':error.code||'SOURCE_UNAVAILABLE',writeOutcome:request.method==='POST'?'unconfirmed':'not-applicable'});
    return response.status(error instanceof SyntaxError?400:error.status||502).json({ok:false,code:error instanceof SyntaxError?'INVALID_PAYLOAD':error.code||'SOURCE_UNAVAILABLE'});
  }
};
