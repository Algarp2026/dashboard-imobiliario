// Standalone administrative diagnostic. Only Sheets read-only and user email scopes are needed.
function measureStoreReadOnly() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('CRM_SPREADSHEET_ID');
  var expected = props.getProperty('CRM_API_CALLER_EMAIL');
  var caller = Session.getEffectiveUser().getEmail();
  if (!id || !expected || !caller || expected.toLowerCase() !== caller.toLowerCase()) throw new Error('READ_NOT_AUTHORIZED');
  var sheet = SpreadsheetApp.openById(id).getSheetByName('Store');
  if (!sheet) throw new Error('UNINITIALIZED');
  var raw = String(sheet.getRange('B2').getValue() || '');
  var activeRaw = String(sheet.getRange('B6').getValue() || '');
  function digest(text) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8).map(function(byte) {
      return ('0' + ((byte + 256) % 256).toString(16)).slice(-2);
    }).join('');
  }
  if(activeRaw) {
    var active = JSON.parse(activeRaw), version = active.version;
    if(active.format !== 2 || active.legacyChecksum !== digest(raw) || !version || version.format !== 2 ||
       !Number.isInteger(version.start) || version.start < 1 || !Number.isInteger(version.count) || version.count < 1 || version.count > 100) throw new Error('INVALID_STORAGE');
    var chunks = SpreadsheetApp.openById(id).getSheetByName('StoreVersions');
    if(!chunks) throw new Error('INVALID_STORAGE');
    raw = chunks.getRange(version.start, 1, version.count, 3).getValues().map(function(row,index) {
      if(row[0] !== version.checksum || Number(row[1]) !== index || typeof row[2] !== 'string' || row[2].charAt(0) !== ':' || row[2].length > 24001) throw new Error('INVALID_STORAGE');
      return row[2].slice(1);
    }).join('');
    if(raw.length !== version.length || digest(raw) !== version.checksum || String(sheet.getRange('B6').getValue()) !== activeRaw) throw new Error('INVALID_STORAGE');
  }
  var data;
  try { data = JSON.parse(raw); } catch (err) { throw new Error('INVALID_STORE_JSON'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('INVALID_STORE_DATA');
  var counts = {};
  ['clients', 'events', 'agents'].forEach(function(key) {
    if (key in data && !Array.isArray(data[key])) throw new Error('INVALID_STORE_DATA');
    counts[key] = (data[key] || []).length;
  });
  var revision = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw.trim(), Utilities.Charset.UTF_8).map(function(byte) {
    return ('0' + ((byte + 256) % 256).toString(16)).slice(-2);
  }).join('');
  return {characters:raw.length,counts:counts,revision:revision};
}
