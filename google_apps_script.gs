
/**
 * The View · Google Sheets Backend corrigido
 * - Corrige erro ao executar doGet manualmente.
 * - Evita apagar dados em pedidos inválidos.
 * - Guarda a base completa em Store!B2 e espelha nas abas operacionais.
 */

const STORE_SHEET = 'Store';
const CLIENTES_SHEET = 'Clientes';
const EVENTOS_SHEET = 'Eventos';
const ESTADOS_SHEET = 'EstadosVendas';
const PRECOS_SHEET = 'PrecosHistorico';
const AGENTES_SHEET = 'Agentes';
const COMISSOES_SHEET = 'VendasComissoes';

function doGet(e) {
  e = e || { parameter: {} };
  const params = e.parameter || {};
  const action = String(params.action || 'load').toLowerCase();

  let obj;
  try {
    if (action === 'load') {
      obj = { ok: true, data: readStore_(), updatedAt: getUpdatedAt_() };
    } else {
      obj = { ok: false, error: 'Ação inválida.' };
    }
  } catch (err) {
    obj = { ok: false, error: String(err && err.message ? err.message : err) };
  }

  const callback = params.callback;
  if (callback) {
    const safeCallback = String(callback).replace(/[^\w.$]/g, '');
    return ContentService
      .createTextOutput(safeCallback + '(' + JSON.stringify(obj) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return jsonOutput_(obj);
}

function doPost(e) {
  e = e || {};
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    if (!e.postData || !e.postData.contents) {
      return jsonOutput_({ ok: false, error: 'Pedido sem dados. Nada foi alterado.' });
    }

    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (err) {
      return jsonOutput_({ ok: false, error: 'JSON inválido. Nada foi alterado.' });
    }

    if (String(payload.action || 'save').toLowerCase() !== 'save') {
      return jsonOutput_({ ok: false, error: 'Ação inválida. Nada foi alterado.' });
    }

    const data = normalize_(payload.data || {});
    writeStore_(data);
    writeMirrorSheets_(data);

    return jsonOutput_({ ok: true, updatedAt: new Date().toISOString() });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function normalize_(d) {
  d = d || {};
  return {
    finalPrices: d.finalPrices || {},
    statuses: d.statuses || {},
    salePrices: d.salePrices || {},
    priceHistory: d.priceHistory || {},
    clients: Array.isArray(d.clients) ? d.clients : [],
    events: Array.isArray(d.events) ? d.events : [],
    agents: Array.isArray(d.agents) ? d.agents : [],
    saleCommissions: d.saleCommissions || {},
    unavailableReasons: d.unavailableReasons || {},
    priceMigrationKey: d.priceMigrationKey || ''
  };
}

function readStore_() {
  const sh = getSheet_(STORE_SHEET, ['key', 'json', 'updatedAt']);
  const json = sh.getRange('B2').getValue();
  if (!json) return normalize_({});
  try {
    return normalize_(JSON.parse(json));
  } catch (err) {
    return normalize_({});
  }
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
    data.clients.map(c => [c.id, c.name, c.phone, c.email, c.nif, c.nationality, c.origin, c.agent, c.agency, c.budget, c.stage, (c.fractions || []).join(', '), c.notes, c.updatedAt || c.updated || '']));

  writeTable_(EVENTOS_SHEET, ['id','clienteId','tipo','data','hora','fracoes','valor','interesse','followUp','dataFollowUp','agenteId','objecoes','notas'],
    data.events.map(ev => [ev.id, ev.clientId, ev.type, ev.date, ev.time, (ev.fractions || []).join(', '), ev.amount, ev.interest, ev.followup, ev.followupDate, ev.agentId || '', ev.objections, ev.notes]));

  writeTable_(AGENTES_SHEET, ['id','nome','agencia','ami','telefone','email','comissaoPadrao','notas'],
    (data.agents || []).map(a => [a.id, a.name, a.agency, a.ami, a.phone, a.email, a.defaultCommission, a.notes]));

  writeTable_(COMISSOES_SHEET, ['fracao','comAgente','agenteId','tipoComissao','valorComissao','comissaoCalculada','notas'],
    Object.entries(data.saleCommissions || {}).map(([n,c]) => [n, c.withAgent || '', c.agentId || '', c.type || '', c.value || '', c.amount || '', c.notes || '']));

  const nums = {};
  Object.keys(data.statuses || {}).forEach(k => nums[k] = true);
  Object.keys(data.finalPrices || {}).forEach(k => nums[k] = true);
  Object.keys(data.salePrices || {}).forEach(k => nums[k] = true);
  Object.keys(data.unavailableReasons || {}).forEach(k => nums[k] = true);
  Object.keys(data.saleCommissions || {}).forEach(k => nums[k] = true);

  writeTable_(ESTADOS_SHEET, ['apartamento','estado','precoFinal','precoVendaReserva','motivoIndisponivel','comissao','receitaLiquida'],
    Object.keys(nums).sort((a,b)=>Number(a)-Number(b)).map(n => {
      const sale = Number(data.salePrices[n] || 0);
      const finalPrice = Number(data.finalPrices[n] || 0);
      const commission = Number((data.saleCommissions[n] || {}).amount || 0);
      const base = sale || finalPrice || 0;
      return [n, data.statuses[n] || 'Disponível', finalPrice || '', sale || '', data.unavailableReasons[n] || '', commission || '', base ? base - commission : ''];
    }));

  const priceRows = [];
  Object.keys(data.priceHistory || {}).sort((a,b)=>Number(a)-Number(b)).forEach(n => {
    (data.priceHistory[n] || []).forEach(h => {
      priceRows.push([n, h.date || '', h.price || '', h.oldPrice || '', h.reason || '']);
    });
  });
  writeTable_(PRECOS_SHEET, ['apartamento','data','preco','precoAnterior','razao'], priceRows);
}

function getSheet_(name, header) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (header && sh.getLastRow() === 0) sh.getRange(1, 1, 1, header.length).setValues([header]);
  return sh;
}

function writeTable_(name, header, rows) {
  const sh = getSheet_(name);
  sh.clearContents();
  sh.getRange(1, 1, 1, header.length).setValues([header]);
  if (rows && rows.length) sh.getRange(2, 1, rows.length, header.length).setValues(rows);
  sh.autoResizeColumns(1, header.length);
}
