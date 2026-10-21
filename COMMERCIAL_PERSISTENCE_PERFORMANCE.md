# Commercial persistence: performance and reliability review

Base: `c323ce9` (main after PR #15). Branch: `codex/optimize-commercial-persistence`.
Review only: no merge, deployment, published Apps Script change, migration or real CRM access.

## Diagnosis

Confirmed by source inspection and isolated tests:

- The unchanged frontend performs a fresh GET before each POST. That read checks
  the original pending request, remote diagnostics, local checkpoints and API
  compatibility. It is not redundant and remains unchanged.
- The API then performed a second complete `crmRead`, followed by `crmWrite` or
  `crmRecover`. Each Execution API invocation independently refreshed OAuth.
- The writer reconstructed already-verified active/staged chunks again, and
  rewrote all six mirrors. Each mirror reopened the spreadsheet independently.
- A failed OAuth refresh or preflight explains how a POST can fail without any
  `crmWrite` execution. This does NOT establish which upstream fault caused the
  observed production incidents; production logs/resources were not accessed.

The original reader remains lock-free and validates the before/after snapshot,
including B5, with checksums and bounded retries. The writer retains its lock.

## Changes

1. An invocation-local OAuth context shares one token between preflight and write.
   There is no cross-request token cache, background refresh or automatic retry.
2. `crmRead({capabilitiesOnly:true})` authenticates the caller/source/environment
   and advertises the compatible write implementation, without accessing Sheets
   or issuing a read ticket. Old sources ignore the option and return the old
   full read, which the adapter still validates completely. The actual writer
   validates the authoritative data, B5/B6 and CAS under its lock before mutation.
3. Existing verified active chunks are reused within the same locked operation;
   newly staged chunks are already read back by `stageVersion_`. Resumed
   descriptors are revalidated. Checks immediately before activation and after
   B6 activation are retained.
4. Only mirrors whose complete input dependencies changed are rewritten. Missing
   mirrors are recreated. All mirror writes remain before B6 activation, under
   the writer lock. Retries reapply the same delta against the old active version.
5. Mirror writers reuse the invocation spreadsheet context. Their columns,
   formatting rules and business projections are unchanged.
6. No `flush()` barriers were removed. Their durability/acknowledgement role is
   preserved instead of assuming that eliminating them is safe.
7. Structured, best-effort logs carry an API-generated correlation UUID,
   fixed layer/phase labels, durations and numeric HTTP/operation codes. The
   response exposes only `X-CRM-Correlation-Id`, not upstream errors or credentials.
   Script requests opt into sanitized error diagnostics. Legacy callers retain
   their previous exception behavior; the frontend protocol remains unchanged.

### Mirror dependencies

| Mirror | Complete inputs compared |
| --- | --- |
| Clientes | clients |
| Eventos | events |
| Agentes | agents |
| EstadosVendas | statuses, salePrices, unavailableReasons |
| PrecosHistorico | priceHistory |
| VendasComissoes | saleCommissions |

Unknown fields inside these inputs participate in the comparison. Unknown root
fields remain in the complete authoritative JSON, without unrelated mirror writes.
This is not a repair tool for manually modified mirrors: Store/B6 remains authoritative.

## Metrics

Reproduce with `node tests/commercial-persistence-performance.test.js`.
The test executes both the exact base implementation (loaded with `git show
c323ce9`) and the new implementation, against the same fictitious, chunked base
larger than 150,000 characters, updating one client.

| POST work | Before | After |
| --- | ---: | ---: |
| OAuth refresh calls | 2 | 1 |
| Execution API calls | 2 | 2 |
| Complete API preflight reads | 1 | 0 |
| Spreadsheet opens | 8 | 1 |
| Chunk reads, including preflight | 7 | 4 |
| Rewritten mirrors | 6 | 1 |
| Mirror setValues operations | 11 | 2 |
| Flush barriers | 7 | 7 |

Timing model: 5 ms per simulated Sheets RPC, 20 ms per OAuth call and 30 ms per
Execution API call. These are declared simulation costs, NOT measured Google
latency or a performance SLA.

| Modeled duration | Before | After |
| --- | ---: | ---: |
| Standalone GET | 70 ms | 70 ms |
| POST including compatibility probe | 365 ms | 215 ms |
| Stage new version | 20 ms | 15 ms |
| Mirror phase | 120 ms | 20 ms |
| Activation/confirmation | 25 ms | 25 ms |
| Cleanup | 10 ms | 10 ms |

Serialization/checksum preparation is now timed separately (`prepare`). It has
zero *modeled RPC* cost; its real CPU time is not assumed to be zero. The test
also emits real local wall-clock timings. One observed run was GET 35.74/4.75 ms
and POST 16.53/11.51 ms (before/after); these short CPU/mock runs are noisy and
must not be used to claim a production speedup. Production latency remains
unmeasured. The verified improvement is reduced repeated work/RPC count.

## Diagnostics and uncertain writes

- `layer:oauth`: token endpoint rejection, redirect, timeout or invalid response.
- `layer:execution-api`: HTTP status, network/body timeout or Execution API failure.
- `layer:apps-script`: fixed script-level failure or validation phase.
- `layer:google-sheets`: sanitized script I/O phase, for example `chunks` or
  `mirror-Clientes`. This identifies the failing stage, not an inferred Google outage.
- `component:crm-store`: start/end timings for lock, metadata, chunks, validation,
  preparation, intent, backup, stage, archive, individual mirrors, activation and cleanup.

Follow the correlation UUID across Vercel and Apps Script logs. Do not log raw
exception messages, request bodies, revisions, request IDs, tokens, cookies,
spreadsheet IDs, client fields or pending contents. Sanitized source diagnostics
are strictly allowlisted before the API logs them.

A timeout/502 means **unconfirmed**, not definitively failed. No transport retry
allocates a replacement request ID or clears B5. The original frontend and PR15
local backups/checkpoints/pending requests are byte-for-byte unchanged. A later
fresh read and the existing explicit recovery/reconciliation path remain required.

## Tests

Final validation: 43/43 Node suites, 4/4 directed real-browser suites,
103/103 JavaScript/TypeScript syntax checks, Apps Script parsing and diff hygiene
passed. All source/transport calls used fictitious fixtures; production access: none.

- `node tests/commercial-client-complete-regression.cjs`: all Node suites and
  security/business source-preservation checks.
- `node tests/commercial-persistence-performance.test.js`: 27 directed scenarios,
  before/after metrics, OAuth/Execution API failures, HTTP 502, network and body
  timeouts, preflight compatibility/corruption, lost commit confirmation, CAS
  conflict, idempotent recovery, selected-mirror interruption, every mirror
  dependency, missing-mirror recreation, unknown metadata and log privacy.
- `node tests/commercial-write-recovery.test.js`: 123 injected interruptions at
  durable mutation/flush boundaries, legacy and chunked storage. It checks B5,
  B6, backups, wrong IDs, committed stale intents, reservations and exact retries.
- Existing concurrency, read-contention, write-integrity, Apartment 16, rollback
  and quota suites remain included. Only fault targets that no longer change
  (Eventos on a client-only/price-only update) moved to the actually affected
  mirror. Assertions were not removed.
- Browser runner: `node tests/commercial-browser-regression.cjs
  commercial-local-quota-browser.mjs commercial-pending-local-browser.mjs
  commercial-client-phase2a-browser.mjs commercial-pr6-regression-browser.mjs`.
  Dedicated loopback port 53223, in-memory fictitious source, authenticated API,
  external requests denied; no use of an existing preview or real Google source.
- JavaScript/TypeScript `node --check`, Apps Script parsed with `vm.Script`,
  and `git diff --check`.

The historical aggregator now explicitly allows only this reviewed transport
instrumentation/preflight change. Session/CSRF/payload/read-ticket/hash checks,
store validators, write gates, tickets, commercial functions and mirror column
projections remain independently frozen and functionally tested.

## Publication review and residual risks

- Git deployments are disabled for this branch in vercel.json. No tracked CI
  deployment workflow exists. Push only this branch, never main. No deployment
  or Apps Script publication is performed by this work.
- The change requires a separately authorized, coordinated publication later.
  A safe review sequence is an isolated test Sheet/Execution API deployment,
  then Apps Script first, then API, with writes disabled until validation.
  Old API/new script and new API/old script are both tested; no data migration
  or storage format change is needed.
- All six mirrors are still rewritten for a broad update affecting all inputs.
  Selected mirrors remain whole-sheet replacements, not row-level diffs. A failed
  attempt can temporarily leave those mirrors ahead of B6, exactly as before;
  only B6 is authoritative, and recovery reapplies the pending delta.
- External edits to immutable chunks/control cells bypass the cooperative writer
  lock and remain unsupported. Existing checksums/legacy-drift checks detect
  corruption, but selective mirrors do not continuously repair manual mirror edits.
- An in-flight Google RPC cannot be cancelled from Apps Script. Reducing calls
  cannot guarantee a fixed execution time or eliminate Google-side outages.
  The existing 25 s frontend and 20 s transport budgets are unchanged. An
  execution can continue after the browser times out; preserve its original ID.
- No production incident root cause is claimed from simulations. Correlated
  real diagnostics and controlled publication still need explicit authorization.

## Files

Runtime: `api/commercial-data.js`, `server/commercial-store.js`,
`google_apps_script.gs`. Branch deployment guard: `vercel.json`.
Tests: new performance suite; scoped updates to Apartment 16, chunk storage,
read contention, sync API, final compatibility audit and the regression aggregator.
This report is the only new documentation. No frontend, CRM data, pricing,
availability, authentication configuration, local backup data or credentials changed.
