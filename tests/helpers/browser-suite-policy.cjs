'use strict';

// Functional coverage is consolidated, not waived. No historical JS is injected.
const consolidated = {
  'commercial-client-complete-browser.mjs': {
    classification: 'adaptable-consolidated',
    replacements: ['crm-reform-browser.mjs', 'commercial-contacts-browser.mjs', 'commercial-pr6-regression-browser.mjs', 'commercial-client-complete-exports.mjs'],
    coverage: 'Creation, preferences, presentations, negotiation, reservation/cancellation, agent commission, contacts, recovery and exports.'
  },
  'visual-workspace-transactions.mjs': {
    classification: 'adaptable-consolidated',
    replacements: ['crm-reform-browser.mjs', 'crm-reform-safety-browser.mjs', 'commercial-contacts-browser.mjs'],
    coverage: 'Draft retention, realization, offers/counters, reservation/cancellation/sale, 409, rejected writes and unchanged unrelated data.'
  },
  'visual-workspace-browser.mjs': {
    classification: 'adaptable-consolidated',
    replacements: ['client-workspace-browser.mjs', 'client-workspace-dialogs.mjs', 'commercial-profile-routing-browser.mjs', 'visual-audit-browser.mjs'],
    coverage: 'Four viewport sizes, module failure, dialogs, focus/scroll, current projections, contrast and zero consultation writes.'
  },
  'composition-d2-browser.mjs': {
    classification: 'adaptable-consolidated',
    replacements: ['composition-d2-platform-browser.mjs', 'client-workspace-browser.mjs', 'visual-audit-browser.mjs'],
    coverage: 'Dashboard/pipeline, inventory filters/columns, keyboard, responsive layout, comparator, modules, unchanged cache and revision.'
  }
};

module.exports = {consolidated};
