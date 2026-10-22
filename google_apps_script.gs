var STORE_SHEET_NAME = 'Store';
var STORE_JSON_CELL = 'B2';
var STORE_UPDATED_AT_CELL = 'B3';
var BACKUP_SHEET_NAME = 'Backups';
var STORE_RECEIPT_CELL = 'B4';
var STORE_WRITE_INTENT_CELL = 'B5';
var STORE_MAX_CHARACTERS = 50000;
var STORE_ACTIVE_CELL = 'B6';
var STORE_VERSIONS_SHEET = 'StoreVersions';
var STORE_CHUNK_CHARACTERS = 24000;
var STORE_TOTAL_CHARACTERS = 900000;
var STORE_READ_BUDGET_MS = 12000;
var STORE_READ_ATTEMPTS = 2;

function sourceContext_(operation, request) {
  var correlationId = request && /^[a-f0-9-]{36}$/.test(request.correlationId || '') ? request.correlationId : '';
  return {operation:operation,correlationId:correlationId,started:Date.now(),spreadsheet:null,storeSheet:null};
}
function sourceStep_(context, phase, action) {
  if (!context) return action();
  var started = Date.now(), outcome = 'error';
  function log(state) {
    // Only fixed labels and timings: never payloads, identities, revisions or error messages.
    try { console.log(JSON.stringify({component:'crm-store',correlationId:context.correlationId,operation:context.operation,phase:phase,state:state,elapsedMs:Date.now()-context.started,durationMs:Date.now()-started})); } catch (ignored) {}
  }
  log('start');
  try {
    if (context.operation === 'read' && Date.now()-context.started >= STORE_READ_BUDGET_MS) throw new Error('SOURCE_TIMEOUT');
    var result = action();
    // Cooperative budget: an in-flight Sheets RPC cannot be cancelled here.
    if (context.operation === 'read' && Date.now()-context.started >= STORE_READ_BUDGET_MS) throw new Error('SOURCE_TIMEOUT');
    outcome = 'ok';
    return result;
  } catch (error) {
    // Keep the innermost fixed phase; never copy the exception message.
    if (!context.failure) context.failure = {phase:phase,durationMs:Date.now()-started,elapsedMs:Date.now()-context.started};
    throw error;
  } finally { log(outcome); }
}
function sourceFailure_(context) {
  var failure = context.failure || {phase:'validate',durationMs:0,elapsedMs:Date.now()-context.started};
  var sheetsPhase = /^(open|store-sheet|metadata|control|chunks|intent|intent-version|archive|mirrors|activate|cleanup|stage|backup|mirror-)/.test(failure.phase);
  return {phase:failure.phase,durationMs:failure.durationMs,elapsedMs:failure.elapsedMs,layer:sheetsPhase?'google-sheets':'apps-script'};
}
function readStoreSnapshot_(context) {
  var sheet = getStoreSheet_(context);
  return sourceStep_(context, 'metadata', function() {
    return sheet.getRange(2, 2, 5, 1).getValues().map(function(row) { return String(row[0] || ''); });
  });
}

function doGet(e) {
  var params = e && e.parameter ? e.parameter : {};
  var callback = validCallback_(params.callback) ? params.callback : '';
  var action = params.action || 'load';

  try {
    if (action !== 'load') {
      return respond_({ ok: false, error: 'Unsupported action' }, callback);
    }

    // HTTP/JSONP callers must use the CRM API; only the authenticated Execution API reads the Store.
    return respond_({ok:false,code:'SERVER_ACCESS_REQUIRED'}, callback);
  } catch (err) {
    return respond_({ ok: false, error: String(err && err.message ? err.message : err) }, callback);
  }
}

function doPost(e) {
  var params = e && e.parameter ? e.parameter : {};
  var callback = validCallback_(params.callback) ? params.callback : '';

  try {
    var raw = '';
    if (params.payload) raw = params.payload;
    if (!raw && e && e.postData && e.postData.contents) raw = e.postData.contents;
    if (!raw) throw new Error('Missing payload');

    var payload = JSON.parse(raw);
    if (payload && payload.action && payload.action !== 'save') {
      throw new Error('Unsupported action');
    }

    return respond_({ok:false,code:'SERVER_ACCESS_REQUIRED'}, callback);
  } catch (err) {
    return respond_({ ok: false, error: String(err && err.message ? err.message : err) }, callback);
  }
}

function testWrite(request) {
  // Manual diagnostics must never bypass revision checks or migrate storage.
  assertServerCaller_();
  if(request) return crmWrite(request);
  return crmRead({sourceId:PropertiesService.getScriptProperties().getProperty('CRM_SPREADSHEET_ID'),environment:PropertiesService.getScriptProperties().getProperty('CRM_ENVIRONMENT')});
}

function assertServerCaller_() {
  var props = PropertiesService.getScriptProperties();
  var expected = props.getProperty('CRM_API_CALLER_EMAIL');
  var actual = Session.getEffectiveUser().getEmail();
  if (!expected || !actual || expected.toLowerCase() !== actual.toLowerCase()) throw new Error('SOURCE_AUTHENTICATION_FAILED');
  if (!props.getProperty('CRM_SPREADSHEET_ID') || !/^(test|production)$/.test(props.getProperty('CRM_ENVIRONMENT') || '')) throw new Error('SOURCE_NOT_CONFIGURED');
}
function storeResponse_(values) {
  var props = PropertiesService.getScriptProperties();
  var response = {sourceId:props.getProperty('CRM_SPREADSHEET_ID'),environment:props.getProperty('CRM_ENVIRONMENT'),protocol:'tv-cas-v1',capabilities:{pendingWriteDiagnostics:1,commercialIntegrity:commercialIntegrityReady_()?1:0},canWrite:props.getProperty('CRM_API_WRITES_ENABLED') === 'true'};
  Object.keys(values).forEach(function(key) { response[key] = values[key]; });
  return response;
}
function commercialIntegrityReady_() {
  return typeof THE_VIEW_COMMERCIAL_INTEGRITY === 'object' && THE_VIEW_COMMERCIAL_INTEGRITY && THE_VIEW_COMMERCIAL_INTEGRITY.version === 1 && typeof THE_VIEW_COMMERCIAL_INTEGRITY.validate === 'function';
}
function validateCommercialTransition_(previous, next) {
  if (!commercialIntegrityReady_()) throw new Error('COMMERCIAL_VALIDATION_UNAVAILABLE');
  // Add defaults only to the in-memory validation view of a legacy snapshot.
  var view = JSON.parse(JSON.stringify(previous));
  ['clients','events','agents'].forEach(function(key) { if (!view[key]) view[key] = []; });
  ['statuses','salePrices','saleCommissions','statusEventIds','salePriceEventIds'].forEach(function(key) { if (!view[key]) view[key] = {}; });
  THE_VIEW_COMMERCIAL_INTEGRITY.validate(view, next);
}
function storeRevision_(json) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, json, Utilities.Charset.UTF_8).map(function(byte) { return ('0' + ((byte + 256) % 256).toString(16)).slice(-2); }).join('');
}
function storeJson_(value) {
  if (Array.isArray(value)) return '[' + value.map(storeJson_).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(function(key) { return JSON.stringify(key) + ':' + storeJson_(value[key]); }).join(',') + '}';
  return JSON.stringify(value);
}
function readStoreMetadata_(cell, context) {
  var sheet = getStoreSheet_(context);
  var raw = sourceStep_(context, 'control', function() { return String(sheet.getRange(cell).getValue() || ''); });
  return raw ? JSON.parse(raw) : null;
}
function validStoreData_(data, complete) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  var valid = true;
  ['clients','events','agents'].forEach(function(key) {
    if (complete && !Array.isArray(data[key]) || key in data && !Array.isArray(data[key])) { valid = false; return; }
    var ids = {};
    (data[key] || []).forEach(function(item) {
      if (!item || !['string','number'].includes(typeof item.id) || !String(item.id) || Object.prototype.hasOwnProperty.call(ids, String(item.id))) valid = false;
      else Object.defineProperty(ids, String(item.id), {value:true,enumerable:true});
    });
  });
  ['finalPrices','statuses','salePrices','priceHistory','saleCommissions','unavailableReasons','statusEventIds','salePriceEventIds'].forEach(function(key) {
    if (complete && (!data[key] || typeof data[key] !== 'object' || Array.isArray(data[key])) || key in data && (!data[key] || typeof data[key] !== 'object' || Array.isArray(data[key]))) valid = false;
  });
  function safe(value, depth) {
    if (depth > 40) return false;
    if (value && typeof value === 'object') return Object.keys(value).every(function(key) { return !['__proto__','prototype','constructor'].includes(key) && safe(value[key], depth + 1); });
    return typeof value !== 'number' || isFinite(value);
  }
  return valid && safe(data, 0);
}
function validSourceRequest_(request) {
  var props = PropertiesService.getScriptProperties();
  return request && request.sourceId === props.getProperty('CRM_SPREADSHEET_ID') && request.environment === props.getProperty('CRM_ENVIRONMENT');
}
// Descriptors are small; payloads are immutable, append-only rows. B6 is the sole commit point.
function readVersion_(version, context) {
  if (!version || version.format !== 2 || !Number.isInteger(version.start) || version.start < 1 ||
      !Number.isInteger(version.count) || version.count < 1 || version.count > 100 ||
      !Number.isInteger(version.length) || version.length > STORE_TOTAL_CHARACTERS ||
      !/^[a-f0-9]{64}$/.test(version.checksum)) throw new Error('INVALID_STORAGE');
  var rows = sourceStep_(context, 'chunks', function() {
    var sheet = storeSpreadsheet_(context).getSheetByName(STORE_VERSIONS_SHEET);
    if (!sheet) throw new Error('INVALID_STORAGE');
    return sheet.getRange(version.start, 1, version.count, 3).getValues();
  });
  return sourceStep_(context, 'chunk-validation', function() {
    var raw = rows.map(function(row, index) {
      if (row[0] !== version.checksum || Number(row[1]) !== index || typeof row[2] !== 'string' ||
          row[2].charAt(0) !== ':' || row[2].length > STORE_CHUNK_CHARACTERS + 1) throw new Error('INVALID_STORAGE');
      return row[2].slice(1);
    }).join('');
    if (raw.length !== version.length || storeRevision_(raw) !== version.checksum ||
        !validStoreData_(JSON.parse(raw), false)) throw new Error('INVALID_STORAGE');
    return raw;
  });
}
function stageVersion_(raw, updatedAt, context) {
  if(STORE_CHUNK_CHARACTERS + 1 >= STORE_MAX_CHARACTERS) throw new Error('INVALID_STORAGE');
  if (raw.length > STORE_TOTAL_CHARACTERS || !validStoreData_(JSON.parse(raw), false)) throw new Error('STORE_SIZE_LIMIT');
  var checksum = storeRevision_(raw), rows = [];
  // Prefix prevents Sheets interpreting chunks beginning with '=' as formulas.
  for (var offset = 0; offset < raw.length;) {
    var end = Math.min(offset + STORE_CHUNK_CHARACTERS, raw.length);
    if (end < raw.length && /[\uD800-\uDBFF]/.test(raw.charAt(end - 1))) end--;
    rows.push([checksum, rows.length, ':' + raw.slice(offset, end)]);
    offset = end;
  }
  var sheet = getOrCreateSheet_(STORE_VERSIONS_SHEET, context);
  var version = {format:2,start:sheet.getLastRow()+1,count:rows.length,length:raw.length,checksum:checksum,updatedAt:updatedAt};
  var requiredRows = version.start + version.count - 1, availableRows = sheet.getMaxRows();
  if(requiredRows > availableRows) sheet.insertRowsAfter(availableRows, requiredRows - availableRows);
  sheet.getRange(version.start, 1, rows.length, 3).setValues(rows);
  SpreadsheetApp.flush();
  if (readVersion_(version, context) !== raw) throw new Error('WRITE_INCOMPLETE');
  return version;
}
function currentStore_(context, snapshot) {
  snapshot = snapshot || readStoreSnapshot_(context);
  var active = snapshot[4] ? JSON.parse(snapshot[4]) : null;
  if(active && (active.format !== 2 || !/^[a-f0-9]{64}$/.test(active.legacyChecksum))) throw new Error('INVALID_STORAGE');
  if(active && storeRevision_(snapshot[0]) !== active.legacyChecksum) throw new Error('LEGACY_STORE_CHANGED');
  var raw = active ? readVersion_(active.version, context) : snapshot[0];
  if (!raw.trim()) throw new Error('UNINITIALIZED');
  return sourceStep_(context, 'validate', function() {
    if (!validStoreData_(JSON.parse(raw), false)) throw new Error('INVALID_STORAGE');
    return {raw:raw,revision:storeRevision_(raw.trim()),updatedAt:active ? active.version.updatedAt : snapshot[1],active:active,legacyReceiptRaw:snapshot[2]};
  });
}
function crmRead(request) {
  assertServerCaller_();
  if (!validSourceRequest_(request)) return storeResponse_({ok:false,code:'SOURCE_ENVIRONMENT_MISMATCH'});
  // Compatibility/authentication probe only. crmWrite still validates the full
  // authoritative version, B5/B6 and CAS under its lock before any mutation.
  if (request.capabilitiesOnly === true) return storeResponse_({ok:true,preflight:true,capabilities:{pendingWriteDiagnostics:1,lightweightPreflight:1,commercialIntegrity:commercialIntegrityReady_()?1:0}});
  var context = sourceContext_('read', request);
  try {
    for (var attempt = 0; attempt < STORE_READ_ATTEMPTS; attempt++) {
      // Immutable chunks are safe without the writer lock. Recheck ALL control cells,
      // including B5, before accepting data and pending-write diagnostics together.
      var before = readStoreSnapshot_(context);
      var intent = before[3] ? JSON.parse(before[3]) : null;
      if (intent && intent.format !== 2) return storeResponse_({ok:false,code:'WRITE_INCOMPLETE'});
      var current = currentStore_(context, before);
      var pending = pendingWriteState_(intent,current);
      var after = readStoreSnapshot_(context);
      if (JSON.stringify(before) !== JSON.stringify(after)) continue;
      return storeResponse_({ok:true,data:JSON.parse(current.raw),revision:current.revision,updatedAt:current.updatedAt,confirmedAt:new Date().toISOString(),pendingWrite:pending});
    }
    return storeResponse_({ok:false,code:'SOURCE_BUSY'});
  } catch (error) {
    if (error && error.message === 'SOURCE_TIMEOUT') return storeResponse_({ok:false,code:'SOURCE_TIMEOUT'});
    if (request.diagnosticsVersion === 1) return storeResponse_({ok:false,code:'INVALID_SOURCE_RESPONSE',diagnostics:sourceFailure_(context)});
    throw error;
  }
}
function pendingWriteState_(intent, current) {
  if (!intent) return null;
  if (intent.format !== 2 || !/^[\w-]{8,100}$/.test(intent.requestId) ||
      !/^[a-f0-9]{64}$/.test(intent.baseRevision) || !/^[a-f0-9]{64}$/.test(intent.revision)) throw new Error('INVALID_STORAGE');
  var receipt = current.active ? current.active.receipt : current.legacyReceiptRaw ? JSON.parse(current.legacyReceiptRaw) : null;
  var committed = receipt && receipt.requestId === intent.requestId && receipt.baseRevision === intent.baseRevision &&
    receipt.revision === intent.revision && current.revision === intent.revision;
  return {state:committed ? 'committed' : intent.baseRevision === current.revision ? 'pending' : 'blocked',
    requestId:intent.requestId,baseRevision:intent.baseRevision,revision:intent.revision};
}
function crmWrite(request) {
  assertServerCaller_();
  if (!validSourceRequest_(request)) return storeResponse_({ok:false,code:'SOURCE_ENVIRONMENT_MISMATCH'});
  if (PropertiesService.getScriptProperties().getProperty('CRM_API_WRITES_ENABLED') !== 'true') return storeResponse_({ok:false,code:'WRITES_DISABLED'});
  if (!request || typeof request.baseRevision !== 'string' || !/^[a-f0-9]{64}$/.test(request.baseRevision) ||
      typeof request.requestId !== 'string' || !/^[\w-]{8,100}$/.test(request.requestId) || !validStoreData_(request.data, true))
    return storeResponse_({ok:false,code:'INVALID_PAYLOAD'});
  var context = sourceContext_('write', request), lock = LockService.getScriptLock();
  sourceStep_(context, 'lock', function() { lock.waitLock(10000); });
  try {
    var sheet = getStoreSheet_(context), current = currentStore_(context);
    var prepared = sourceStep_(context, 'prepare', function() {
      var raw = storeJson_(request.data);
      return {raw:raw,revision:storeRevision_(raw)};
    });
    var nextJson = prepared.raw, revision = prepared.revision;
    if (nextJson.length > STORE_TOTAL_CHARACTERS || current.raw.length > STORE_TOTAL_CHARACTERS) return storeResponse_({ok:false,code:'STORE_SIZE_LIMIT'});
    var intent = readStoreMetadata_(STORE_WRITE_INTENT_CELL, context);
    var receipt = current.active ? current.active.receipt : readStoreMetadata_(STORE_RECEIPT_CELL, context);
    var same = function(value) { return value && value.requestId === request.requestId && value.baseRevision === request.baseRevision && value.revision === revision; };
    var success = function() { return storeResponse_({ok:true,persisted:true,revision:revision,updatedAt:current.updatedAt,confirmedAt:new Date().toISOString(),requestId:request.requestId}); };
    if (same(receipt) && current.revision === revision) {
      if (same(intent)) sourceStep_(context, 'cleanup', function() { sheet.getRange(STORE_WRITE_INTENT_CELL).setValue(''); SpreadsheetApp.flush(); });
      return success();
    }
    // A verified active receipt survives a lost B5 cleanup. Do not let that completed
    // intent block the next CAS write; its receipt remains in B6 and BackupsVersions.
    if (intent && pendingWriteState_(intent,current).state === 'committed') intent = null;
    if (request.recovery && !same(intent)) return storeResponse_({ok:false,code:'CONFLICT'});
    if (intent && (intent.format !== 2 || !same(intent))) return storeResponse_({ok:false,code:'WRITE_INCOMPLETE'});
    if (receipt && receipt.requestId === request.requestId && !same(receipt)) return storeResponse_({ok:false,code:'CONFLICT'});
    if (current.revision !== request.baseRevision) return storeResponse_({ok:false,code:'CONFLICT'});
    if (current.revision === revision && !intent) return success();
    // Validate the exact CAS baseline while holding the writer lock, before B5,
    // backups, chunks or mirrors. Exact committed replays above remain idempotent.
    sourceStep_(context, 'commercial-validation', function() { validateCommercialTransition_(JSON.parse(current.raw), request.data); });
    var metadata = intent || {format:2,requestId:request.requestId,baseRevision:request.baseRevision,revision:revision,updatedAt:new Date().toISOString()};
    sourceStep_(context, 'intent', function() {
      sheet.getRange(STORE_WRITE_INTENT_CELL).setValue(JSON.stringify(metadata));
      SpreadsheetApp.flush();
    });
    // Backups reference fully verified immutable versions, never a single payload cell.
    var previous = sourceStep_(context, 'backup', function() {
      var previous = metadata.previous || (current.active ? current.active.version : stageVersion_(current.raw, current.updatedAt, context));
      // currentStore_ already verified the active version. A resumed descriptor
      // must still be checked independently.
      if (metadata.previous || !current.active) readVersion_(previous, context);
      return previous;
    });
    var version = sourceStep_(context, 'stage', function() {
      var version = metadata.version || stageVersion_(nextJson, metadata.updatedAt, context);
      if(metadata.version && readVersion_(version, context) !== nextJson) throw new Error('WRITE_INCOMPLETE');
      return version;
    });
    metadata.previous = previous; metadata.version = version;
    sourceStep_(context, 'intent-version', function() {
      sheet.getRange(STORE_WRITE_INTENT_CELL).setValue(JSON.stringify(metadata));
      SpreadsheetApp.flush();
    });
    sourceStep_(context, 'archive', function() {
      var archive = getOrCreateSheet_(BACKUP_SHEET_NAME + 'Versions', context);
      var last = archive.getLastRow() ? archive.getRange(archive.getLastRow(), 1, 1, 4).getValues()[0] : [];
      if(last[3] !== JSON.stringify(metadata)) archive.appendRow([metadata.updatedAt, JSON.stringify(previous), JSON.stringify(version), JSON.stringify(metadata)]);
      SpreadsheetApp.flush();
      var archived = archive.getRange(archive.getLastRow(), 1, 1, 4).getValues()[0];
      if (archived[1] !== JSON.stringify(previous) || archived[2] !== JSON.stringify(version)) throw new Error('WRITE_INCOMPLETE');
    });
    // Mirrors are derived. A failure here leaves the old authoritative version active.
    sourceStep_(context, 'mirrors', function() { mirrorChanged_(JSON.parse(current.raw), request.data, context); SpreadsheetApp.flush(); });
    readVersion_(version, context);
    var pointer = JSON.stringify({format:2,version:version,previous:previous,receipt:metadata,legacyChecksum:current.active ? current.active.legacyChecksum : storeRevision_(current.raw)});
    sourceStep_(context, 'activate', function() {
      sheet.getRange(STORE_ACTIVE_CELL).setValue(pointer);
      SpreadsheetApp.flush();
      if (String(sheet.getRange(STORE_ACTIVE_CELL).getValue()) !== pointer) throw new Error('WRITE_INCOMPLETE');
      current = currentStore_(context);
      if (current.revision !== revision) throw new Error('WRITE_INCOMPLETE');
    });
    sourceStep_(context, 'cleanup', function() {
      sheet.getRange(STORE_WRITE_INTENT_CELL).setValue('');
      SpreadsheetApp.flush();
    });
    return success();
  } catch (error) {
    if (error && (error.code === 'COMMERCIAL_INTEGRITY' || error.message === 'COMMERCIAL_VALIDATION_UNAVAILABLE')) return storeResponse_({ok:false,code:error.code === 'COMMERCIAL_INTEGRITY'?'COMMERCIAL_INTEGRITY':'COMMERCIAL_VALIDATION_UNAVAILABLE'});
    if (request.diagnosticsVersion === 1) return storeResponse_({ok:false,code:'INVALID_SOURCE_RESPONSE',diagnostics:sourceFailure_(context)});
    throw error;
  } finally { lock.releaseLock(); }
}
function crmRecover(request) {
  if (!request || typeof request !== 'object') return storeResponse_({ok:false,code:'INVALID_PAYLOAD'});
  request.recovery = true;
  return crmWrite(request);
}
function loadStore_() { return JSON.parse(currentStore_().raw); }
function getStoreUpdatedAt_() { return currentStore_().updatedAt; }

function mirrorAll_(data) {
  data = data || {};
  mirrorClientes_(data.clients || []);
  mirrorEventos_(data.events || []);
  mirrorAgentes_(data.agents || []);
  mirrorEstadosVendas_(data);
  mirrorPrecosHistorico_(data.priceHistory || {});
  mirrorVendasComissoes_(data.saleCommissions || {});
}

function mirrorChanged_(previous, data, context) {
  // Compare complete dependencies, including unknown fields. Reapply the same
  // delta on retries against old B6, and always recreate a missing mirror.
  var groups = [
    ['Clientes',['clients'],function() { mirrorClientes_(data.clients || [], context); }],
    ['Eventos',['events'],function() { mirrorEventos_(data.events || [], context); }],
    ['Agentes',['agents'],function() { mirrorAgentes_(data.agents || [], context); }],
    ['EstadosVendas',['statuses','salePrices','unavailableReasons'],function() { mirrorEstadosVendas_(data, context); }],
    ['PrecosHistorico',['priceHistory'],function() { mirrorPrecosHistorico_(data.priceHistory || {}, context); }],
    ['VendasComissoes',['saleCommissions'],function() { mirrorVendasComissoes_(data.saleCommissions || {}, context); }]
  ];
  groups.forEach(function(group) {
    var changed = group[1].some(function(key) { return storeJson_(previous[key]) !== storeJson_(data[key]); });
    if (changed || !storeSpreadsheet_(context).getSheetByName(group[0])) sourceStep_(context, 'mirror-'+group[0], group[2]);
  });
}

function mirrorClientes_(clients, context) {
  var rows = (clients || []).map(function(c) {
    return [
      text_(c.id),
      text_(c.name),
      text_(c.phone),
      text_(c.email),
      text_(c.nif),
      text_(c.nationality),
      text_(c.origin),
      text_(c.agentId),
      text_(c.agent),
      text_(c.agency),
      numberOrBlank_(c.budget),
      text_(c.stage),
      list_(c.fractions),
      text_(c.notes),
      text_(c.updated)
    ];
  });
  writeSheet_('Clientes', ['ID', 'Nome', 'Contacto', 'Email', 'NIF', 'Nacionalidade', 'Origem', 'AgentId', 'Agente', 'Agencia', 'Orcamento', 'Estado', 'Fracoes', 'Notas', 'Atualizado'], rows, context);
}

function mirrorEventos_(events, context) {
  var rows = (events || []).map(function(ev) {
    return [
      text_(ev.id),
      text_(ev.date),
      text_(ev.time),
      text_(ev.type),
      text_(ev.clientId),
      list_(ev.fractions),
      numberOrBlank_(ev.amount),
      text_(ev.interest),
      text_(ev.followup),
      text_(ev.followupDate),
      text_(ev.objections),
      text_(ev.notes),
      bool_(ev.withAgent),
      text_(ev.agentId),
      text_(ev.commissionType),
      numberOrBlank_(ev.commissionValue),
      numberOrBlank_(ev.commissionAmount)
    ];
  });
  writeSheet_('Eventos', ['ID', 'Data', 'Hora', 'Tipo', 'ClienteId', 'Fracoes', 'Valor', 'Interesse', 'FollowUp', 'DataFollowUp', 'Objecoes', 'Notas', 'ComAgente', 'AgentId', 'TipoComissao', 'ValorComissao', 'Comissao'], rows, context);
}

function mirrorAgentes_(agents, context) {
  var rows = (agents || []).map(function(a) {
    return [
      text_(a.id),
      text_(a.name),
      text_(a.agency),
      text_(a.ami),
      text_(a.phone),
      text_(a.email),
      numberOrBlank_(a.defaultCommission),
      text_(a.notes),
      text_(a.updated)
    ];
  });
  writeSheet_('Agentes', ['ID', 'Nome', 'Agencia', 'AMI', 'Contacto', 'Email', 'ComissaoPadrao', 'Notas', 'Atualizado'], rows, context);
}

function mirrorEstadosVendas_(data, context) {
  var statuses = data.statuses || {};
  var salePrices = data.salePrices || {};
  var reasons = data.unavailableReasons || {};
  var keys = uniqueKeys_(statuses, salePrices, reasons);
  var rows = keys.map(function(k) {
    return [
      k,
      text_(statuses[k] || 'Disponivel'),
      numberOrBlank_(salePrices[k]),
      text_(reasons[k])
    ];
  });
  writeSheet_('EstadosVendas', ['Fracao', 'Estado', 'PrecoReservaVenda', 'MotivoIndisponivel'], rows, context);
}

function mirrorPrecosHistorico_(priceHistory, context) {
  var rows = [];
  sortKeys_(priceHistory).forEach(function(k) {
    var entries = priceHistory[k] || [];
    if (Object.prototype.toString.call(entries) !== '[object Array]') entries = [entries];
    entries.forEach(function(h) {
      rows.push([
        k,
        text_(h.date),
        numberOrBlank_(h.price),
        numberOrBlank_(h.oldPrice),
        text_(h.reason)
      ]);
    });
  });
  writeSheet_('PrecosHistorico', ['Fracao', 'Data', 'Preco', 'PrecoAnterior', 'Motivo'], rows, context);
}

function mirrorVendasComissoes_(saleCommissions, context) {
  var rows = sortKeys_(saleCommissions).map(function(k) {
    var c = saleCommissions[k] || {};
    return [
      k,
      bool_(c.withAgent),
      text_(c.agentId),
      text_(c.commissionType),
      numberOrBlank_(c.commissionValue),
      numberOrBlank_(c.amount),
      numberOrBlank_(c.netRevenue),
      text_(c.eventId),
      text_(c.date)
    ];
  });
  writeSheet_('VendasComissoes', ['Fracao', 'ComAgente', 'AgentId', 'TipoComissao', 'ValorComissao', 'Comissao', 'ReceitaLiquida', 'EventoId', 'Data'], rows, context);
}

function getStoreSheet_(context) {
  if (context && context.storeSheet) return context.storeSheet;
  var sheet = sourceStep_(context, 'store-sheet', function() { return storeSpreadsheet_(context).getSheetByName(STORE_SHEET_NAME); });
  if (!sheet) throw new Error('UNINITIALIZED');
  if (context) context.storeSheet = sheet;
  return sheet;
}

function storeSpreadsheet_(context) {
  if (context && context.spreadsheet) return context.spreadsheet;
  var id = PropertiesService.getScriptProperties().getProperty('CRM_SPREADSHEET_ID');
  if (!id) throw new Error('SOURCE_NOT_CONFIGURED');
  var spreadsheet = sourceStep_(context, 'open', function() { return SpreadsheetApp.openById(id); });
  if (context) context.spreadsheet = spreadsheet;
  return spreadsheet;
}

function getOrCreateSheet_(name, context) {
  var ss = storeSpreadsheet_(context);
  var sheet = ss.getSheetByName(name);
  return sheet || ss.insertSheet(name);
}

function writeSheet_(name, headers, rows, context) {
  var sheet = getOrCreateSheet_(name, context);
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  sheet.setFrozenRows(1);
}

function respond_(obj, callback) {
  var body = JSON.stringify(obj);
  var output = callback ? callback + '(' + body + ');' : body;
  return ContentService
    .createTextOutput(output)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function validCallback_(callback) {
  return !!callback && /^[A-Za-z_$][0-9A-Za-z_$]*(\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(callback);
}

function uniqueKeys_() {
  var map = {};
  for (var i = 0; i < arguments.length; i++) {
    var obj = arguments[i] || {};
    Object.keys(obj).forEach(function(k) { map[k] = true; });
  }
  return sortKeys_(map);
}

function sortKeys_(obj) {
  return Object.keys(obj || {}).sort(function(a, b) {
    var na = Number(a);
    var nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  });
}

function text_(value) {
  if (value === null || typeof value === 'undefined') return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function list_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Array]') return value.join(', ');
  return text_(value);
}

function numberOrBlank_(value) {
  var n = Number(value);
  return isNaN(n) || value === '' || value === null || typeof value === 'undefined' ? '' : n;
}

function bool_(value) {
  return value ? 'Sim' : 'Nao';
}
