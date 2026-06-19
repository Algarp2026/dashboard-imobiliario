const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const commercial = fs.readFileSync(path.join(root, 'commercial.js'), 'utf8');
const appsScript = fs.readFileSync(path.join(root, 'google_apps_script.gs'), 'utf8');
const config = fs.readFileSync(path.join(root, 'config.js'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function includesAll(source, values, label) {
  values.forEach(value => assert(source.includes(value), `${label}: missing "${value}"`));
}

assert(!/\b(alert|prompt|confirm)\s*\(/.test(commercial), 'commercial.js should use app dialogs instead of native browser dialogs');

includesAll(commercial, [
  'const RenderFlow=',
  'applyEventBusinessRules',
  'applyReservationEvent',
  'applySaleEvent',
  'applyManualStatusChange',
  'buildEventFromForm'
], 'commercial business rules');

includesAll(commercial, [
  "CRM_MIGRATION_KEY='crm-funnel-2026-06-v4'",
  'migrateCrmData',
  'recalculateResumoCliente',
  'recalculateResumoTodosClientes',
  'commercialEffectForFraction',
  'getHistoricoComercialFracao'
], 'CRM funnel migration and derived summaries');

includesAll(commercial, [
  'Preços informados',
  'officialPrice',
  'informedPrice',
  'previousLowerInformedPrice',
  'Reserva cancelada',
  'Venda concluída'
], 'structured commercial events');

includesAll(commercial, [
  'preferencesManuallyEdited',
  'renderEventSelectedFractionChips',
  'clearEventFractions'
], 'editable client preferences and fraction selection');

includesAll(commercial, [
  "const CLIENT_ORIGINS=['Website The View','Outdoor / Mupie','Agente','Amigo / Familiar','Outro']",
  'clientOriginManual',
  'toggleClientOriginManual',
  'clientOriginLabel'
], 'client origin options and manual value');

const clientOriginsDeclaration = commercial.match(/const CLIENT_ORIGINS=\[([^\]]+)\]/)?.[1] || '';
assert(!clientOriginsDeclaration.includes('Redes sociais'), 'new client origins should not include "Redes sociais"');
assert(!clientOriginsDeclaration.includes('Portal Imobili'), 'new client origins should not include "Portal Imobiliario"');

const eventTypesDeclaration = commercial.match(/const EVENT_TYPES=\[([^\]]+)\]/)?.[1] || '';
['Contacto efetuado', 'Reunião agendada', 'Reunião realizada', 'Follow-up'].forEach(type => {
  assert(!eventTypesDeclaration.includes(type), `new event types should not include "${type}"`);
});

includesAll(commercial, [
  "statusOf(f)==='Disponível'",
  'presentationPdfLanguage',
  'PT/ENG',
  'PT/FR',
  'Presentation Price',
  'Prix de présentation'
], 'commercial PDF flow');

includesAll(commercial, [
  'printClientsSummaryBtn',
  'Imprimir Resumo de Clientes',
  'openClientsSummaryPdfModal',
  'generateClientsSummaryPdf',
  '@page{size:A4 portrait',
  'Resumo Comercial de Clientes / Leads',
  'Documento interno de acompanhamento comercial. Informação sujeita a atualização.'
], 'client summary PDF flow');

const clientSummaryPdfFlow = commercial.slice(
  commercial.indexOf('function clientSummaryFollowupInfo'),
  commercial.indexOf('function renderSalesSubTabs')
);
assert(clientSummaryPdfFlow.length > 0, 'client summary PDF flow should be isolated');
assert(!/\bsave\s*\(/.test(clientSummaryPdfFlow), 'client summary PDF must not persist CRM data');

includesAll(commercial, [
  "LOCAL_REMOTE_BACKUP_KEY=KEY+'.backupBeforeRemoteLoad'",
  'backupLocalBeforeRemoteLoad'
], 'local backup flow');

includesAll(appsScript, [
  'BACKUP_SHEET_NAME',
  'Backups',
  'backupStoreBeforeSave_',
  'Store!B2 and mirror sheets refreshed.'
], 'Apps Script backup flow');

assert(config.trim().startsWith('window.THE_VIEW_CONFIG = {'), 'config.js must expose THE_VIEW_CONFIG');
assert(!config.includes('SYNC_MODE'), 'config.js must not include SYNC_MODE');

console.log('commercial smoke tests passed');
