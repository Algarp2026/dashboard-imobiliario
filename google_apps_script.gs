
/**
 * The View · Google Sheets Backend
 * Como usar:
 * 1. Crie uma Google Sheet vazia.
 * 2. Extensões > Apps Script.
 * 3. Cole este ficheiro.
 * 4. Implementar > Nova implementação > Aplicação Web.
 * 5. Executar como: você. Acesso: Qualquer pessoa com o link.
 * 6. Copie o URL /exec para config.js no website.
 */

const STORE_SHEET = 'Store';
const CLIENTES_SHEET = 'Clientes';
const EVENTOS_SHEET = 'Eventos';
const ESTADOS_SHEET = 'EstadosVendas';
const PRECOS_SHEET = 'PrecosHistorico';

function doGet(e) {
  const action = ((e.parameter && e.parameter.action) || 'load').toLowerCase();
  let obj;
  if (action === 'load') {
    obj = { ok: true, data: readStore_(), updatedAt: getUpdatedAt_() };
  } else {
    obj = { ok: false, error: 'Ação inválida.' };
  }

  // Suporte JSONP para leitura a partir de websites externos,
  // evitando limitações CORS do Google Apps Script.
  const callback = e.parameter && e.parameter.callback;
  if (callback) {
    const safeCallback = String(callback).replace(/[^\w.$]/g, '');
    return ContentService
      .createTextOutput(safeCallback + '(' + JSON.stringify(obj) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return jsonOutput(obj);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}');
    if (payload.action !== 'save') return jsonOutput({ ok: false, error: 'Ação inválida.' });
    const data = normalize_(payload.data || {});
    writeStore_(data);
    writeMirrorSheets_(data);
    return jsonOutput({ ok: true, updatedAt: new Date().toISOString() });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function normalize_(d) {
  return {
    finalPrices: d.finalPrices || {},
    statuses: d.statuses || {},
    salePrices: d.salePrices || {},
    priceHistory: d.priceHistory || {},
    clients: d.clients || [],
    events: d.events || []
  };
}

function readStore_() {
  const sh = getSheet_(STORE_SHEET, ['key', 'json', 'updatedAt']);
  const json = sh.getRange('B2').getValue();
  if (!json) return normalize_({});
  return normalize_(JSON.parse(json));
}

function writeStore_(data) {
  const sh = getSheet_(STORE_SHEET, ['key', 'json', 'updatedAt']);
  sh.getRange('A2:C2').setValues([['crmData', JSON.stringify(data), new Date().toISOString()]]);
  sh.autoResizeColumns(1, 3);
}

function getUpdatedAt_() {
  const sh = getSheet_(STORE_SHEET, ['key', 'json', 'updatedAt']);
  return sh.getRange('C2').getValue() || '';
}

function writeMirrorSheets_(data) {
  writeTable_(CLIENTES_SHEET, ['id','nome','telefone','email','nif','nacionalidade','origem','agente','agencia','orcamento','estadoLead','fracoesInteresse','observacoes','atualizadoEm'],
    data.clients.map(c => [c.id, c.name, c.phone, c.email, c.nif, c.nationality, c.origin, c.agent, c.agency, c.budget, c.stage, (c.fractions || []).join(', '), c.notes, c.updated]));

  writeTable_(EVENTOS_SHEET, ['id','clienteId','tipo','data','hora','fracoes','valor','interesse','followUp','dataFollowUp','objecoes','notas'],
    data.events.map(ev => [ev.id, ev.clientId, ev.type, ev.date, ev.time, (ev.fractions || []).join(', '), ev.amount, ev.interest, ev.followup, ev.followupDate, ev.objections, ev.notes]));

  const numbers = uniqueNumbers_(Object.keys(data.statuses).concat(Object.keys(data.salePrices)).concat(Object.keys(data.finalPrices)));
  writeTable_(ESTADOS_SHEET, ['apartamento','estado','precoFinal','precoVendaReserva'],
    numbers.map(n => [n, data.statuses[n] || '', data.finalPrices[n] || '', data.salePrices[n] || '']));

  const histRows = [];
  Object.keys(data.priceHistory || {}).forEach(n => {
    (data.priceHistory[n] || []).forEach(h => histRows.push([n, h.date, h.oldPrice || '', h.price || '', h.reason || '']));
  });
  writeTable_(PRECOS_SHEET, ['apartamento','data','precoAnterior','precoNovo','motivo'], histRows);
}

function writeTable_(name, headers, rows) {
  const sh = getSheet_(name, headers);
  sh.clearContents();
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#eef2f7');
  if (rows.length) sh.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, headers.length);
}

function getSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sh;
}

function uniqueNumbers_(values) {
  const seen = {};
  values.forEach(v => { const n = String(v).trim(); if (n) seen[n] = true; });
  return Object.keys(seen).sort((a,b) => Number(a) - Number(b));
}
