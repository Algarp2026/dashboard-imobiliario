'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {consolidated} = require('./helpers/browser-suite-policy.cjs');
const runner = fs.readFileSync(path.join(__dirname, 'commercial-browser-regression.cjs'), 'utf8');
const plans = runner.slice(runner.indexOf('const plans='), runner.indexOf('const requested='));
for (const [name, policy] of Object.entries(consolidated)) {
  assert.equal(policy.classification, 'adaptable-consolidated');
  assert.ok(policy.coverage.length > 40);
  assert.ok(!plans.includes("'" + name + "':"), name + ' must not remain in the active catalog');
  assert.equal(fs.existsSync(path.join(__dirname, name)), false);
  for (const replacement of policy.replacements) {
    assert.ok(plans.includes("'" + replacement + "':"), replacement + ' must run by default');
    assert.ok(fs.existsSync(path.join(__dirname, replacement)));
  }
}
for (const name of ['commercial-local-quota-browser.mjs', 'commercial-pending-local-browser.mjs', 'crm-reform-safety-browser.mjs', 'commercial-client-report-grouping-browser.mjs']) {
  assert.ok(plans.includes("'" + name + "':"), 'Safety/report coverage cannot be retired: ' + name);
}
assert.ok(!runner.includes("git show"));
console.log('Current browser catalog: consolidated functional coverage remains mandatory; quota, pending recovery, concurrency and reports retained.');
