'use strict';
process.env.PHASE2A_TEST_PORT=process.env.PHASE2A_TEST_PORT||'5199';
process.env.PHASE2B_FIXTURE='true';
process.env.HOME_ENTRY_TESTS='true';
require('./client-phase2a-preview.cjs');
