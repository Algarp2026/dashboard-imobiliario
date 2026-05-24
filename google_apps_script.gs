var STORE_SHEET_NAME = 'Store';
var STORE_JSON_CELL = 'B2';
var STORE_UPDATED_AT_CELL = 'B3';

function doGet(e) {
  var params = e && e.parameter ? e.parameter : {};
  var callback = validCallback_(params.callback) ? params.callback : '';
  var action = params.action || 'load';

  try {
    if (action !== 'load') {
      return respond_({ ok: false, error: 'Unsupported action' }, callback);
    }

    return respond_({
      ok: true,
      data: loadStore_(),
      updatedAt: getStoreUpdatedAt_()
    }, callback);
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

    var data = payload && payload.data ? payload.data : payload;
    if (!data || typeof data !== 'object' || Object.prototype.toString.call(data) === '[object Array]') {
      throw new Error('Invalid data');
    }

    var updatedAt = payload.updatedAt || new Date().toISOString();
    var lock = LockService.getDocumentLock();
    lock.waitLock(30000);
    try {
      saveStore_(data, updatedAt);
      mirrorAll_(data);
    } finally {
      lock.releaseLock();
    }

    return respond_({ ok: true, updatedAt: updatedAt }, callback);
  } catch (err) {
    return respond_({ ok: false, error: String(err && err.message ? err.message : err) }, callback);
  }
}

function testWrite() {
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    var data = loadStore_();
    var updatedAt = new Date().toISOString();
    saveStore_(data, updatedAt);
    mirrorAll_(data);
    return { ok: true, updatedAt: updatedAt, message: 'Store!B2 and mirror sheets refreshed.' };
  } finally {
    lock.releaseLock();
  }
}

function loadStore_() {
  var sheet = getStoreSheet_();
  var raw = String(sheet.getRange(STORE_JSON_CELL).getValue() || '').trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function saveStore_(data, updatedAt) {
  var sheet = getStoreSheet_();
  sheet.getRange('A1').setValue('Campo');
  sheet.getRange('B1').setValue('Valor');
  sheet.getRange('A2').setValue('JSON');
  sheet.getRange(STORE_JSON_CELL).setValue(JSON.stringify(data));
  sheet.getRange('A3').setValue('AtualizadoEm');
  sheet.getRange(STORE_UPDATED_AT_CELL).setValue(updatedAt || new Date().toISOString());
}

function getStoreUpdatedAt_() {
  var value = getStoreSheet_().getRange(STORE_UPDATED_AT_CELL).getValue();
  return value ? String(value) : '';
}

function mirrorAll_(data) {
  data = data || {};
  mirrorClientes_(data.clients || []);
  mirrorEventos_(data.events || []);
  mirrorAgentes_(data.agents || []);
  mirrorEstadosVendas_(data);
  mirrorPrecosHistorico_(data.priceHistory || {});
  mirrorVendasComissoes_(data.saleCommissions || {});
}

function mirrorClientes_(clients) {
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
  writeSheet_('Clientes', ['ID', 'Nome', 'Contacto', 'Email', 'NIF', 'Nacionalidade', 'Origem', 'AgentId', 'Agente', 'Agencia', 'Orcamento', 'Estado', 'Fracoes', 'Notas', 'Atualizado'], rows);
}

function mirrorEventos_(events) {
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
  writeSheet_('Eventos', ['ID', 'Data', 'Hora', 'Tipo', 'ClienteId', 'Fracoes', 'Valor', 'Interesse', 'FollowUp', 'DataFollowUp', 'Objecoes', 'Notas', 'ComAgente', 'AgentId', 'TipoComissao', 'ValorComissao', 'Comissao'], rows);
}

function mirrorAgentes_(agents) {
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
  writeSheet_('Agentes', ['ID', 'Nome', 'Agencia', 'AMI', 'Contacto', 'Email', 'ComissaoPadrao', 'Notas', 'Atualizado'], rows);
}

function mirrorEstadosVendas_(data) {
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
  writeSheet_('EstadosVendas', ['Fracao', 'Estado', 'PrecoReservaVenda', 'MotivoIndisponivel'], rows);
}

function mirrorPrecosHistorico_(priceHistory) {
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
  writeSheet_('PrecosHistorico', ['Fracao', 'Data', 'Preco', 'PrecoAnterior', 'Motivo'], rows);
}

function mirrorVendasComissoes_(saleCommissions) {
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
  writeSheet_('VendasComissoes', ['Fracao', 'ComAgente', 'AgentId', 'TipoComissao', 'ValorComissao', 'Comissao', 'ReceitaLiquida', 'EventoId', 'Data'], rows);
}

function getStoreSheet_() {
  return getOrCreateSheet_(STORE_SHEET_NAME);
}

function getOrCreateSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  return sheet || ss.insertSheet(name);
}

function writeSheet_(name, headers, rows) {
  var sheet = getOrCreateSheet_(name);
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
