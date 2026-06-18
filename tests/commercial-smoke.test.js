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
  "CRM_MIGRATION_KEY='crm-funnel-2026-06-v2'",
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
  "statusOf(f)==='Disponível'",
  'presentationPdfLanguage',
  'PT/ENG',
  'PT/FR',
  'Presentation Price',
  'Prix de présentation'
], 'commercial PDF flow');

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
