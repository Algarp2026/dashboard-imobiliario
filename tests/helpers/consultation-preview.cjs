process.env.AUTO_SYNC_TESTS='true';
process.env.SAFE_RECONCILIATION_TESTS='true';
process.env.HOME_ENTRY_TESTS='true';
process.env.D2_SYNTHETIC_CATALOG='true';
process.env.FRACTION_DRAFT_TESTS='true';
require('./client-phase2a-preview.cjs');
