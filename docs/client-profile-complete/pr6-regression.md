# PR #6: targeted integrity corrections

- Presentation preparation is consumed only on the first realization, and only for the event's fractions. Draft saves and historical edits do not replace preparation.
- Editing a communication preserves the current contact-state decision history. Only a new communication or the existing manual control defines a new current state.
- No schema, API, authentication, Apps Script or synchronization protocol changes.

## Validation

Targeted tests passed before the complete Node regression:

- `tests/commercial-client-workflow.test.js`: actual integration adapter, selection 9/24/30, realization of 24, draft edits, historical fraction changes, retry, repeat, reload and unrelated data preservation.
- `tests/commercial-contact-history.test.js`: actual UI submit handler, backdated communications, later manual decisions, historical state corrections, persistence round-trip, unchanged priority and a new explicit state decision.
- `tests/commercial-contacts.test.js`: existing contact-model regression.
- `tests/commercial-pr6-regression-browser.mjs`: authenticated local browser, actual API and in-memory Apps Script test store; drafts, realization, edit/retry without duplicate events, repeated presentation, reload, backdated contact, manual correction, historical edits and a second session receiving synchronized changes. Zero JavaScript errors or external browser requests.

Browser validation started with 64 fictitious clients. Other clients/events, official prices, availability, sales, commissions, price history and agents remained unchanged. The selected client's priority history was preserved through historical edits and new contacts.

Run the browser test against `tests/helpers/client-complete-preview.cjs` on localhost port 5197 with the existing Playwright runtime. This helper replaces credentials and data with isolated test values; writes stay in memory. The complete regression results are recorded in `regression-results.json`.

No real Google Sheet was contacted. No merge or deployment was performed. Previously corrupted selections or state decisions are not automatically repaired; these changes prevent future occurrences without rewriting historical data.
