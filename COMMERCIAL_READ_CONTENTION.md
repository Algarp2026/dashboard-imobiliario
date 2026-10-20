# Commercial read contention correction

Date: 2026-10-21. Base: main `def5085` (PR #14 integrated).
Branch: `codex/fix-commercial-read-contention`. Review only; no publication.

## Confirmed findings and remaining hypotheses

- The previous `crmRead` acquired the same script lock as every write, then
  performed all spreadsheet opening, metadata/chunk reads, JSON validation and
  hashing before releasing it. A stalled reader therefore serialized the CRM.
  This contention is reproduced with the actual old source in the isolated VM.
- `waitLock(10000)` limits acquisition waiting, not execution after acquisition.
  It cannot by itself explain the reported 360-second execution.
- A successful chunked read previously reopened the spreadsheet four times.
  The corrected read opens it once per execution, batches B2:B6, reads the
  immutable chunks and verifies B2:B6 again. No data is cached between requests.
- The PR #14 source probe adds a full read before each API mutation; the
  frontend also probes before POST. These checks increased read pressure under
  the old shared lock. Both compatibility probes remain unchanged.
- Likely slow boundaries include `openById`, sheet/range access and chunk
  `getValues`. Repeated validation/hashing also ran under the old lock.
  Writer mirror updates and `flush` can prolong writer ownership too.
  Which specific RPC stalled in production is NOT established: no production
  logs, credentials, Sheet, source execution or pending operation were accessed.
- The server aborts an upstream HTTP call after 20 seconds. There is no source
  cancellation request in that path; do not infer that the remote execution
  ended when the browser/API timed out. Apps Script operation errors previously
  mapped to INVALID_SOURCE_RESPONSE, including thrown lock failures.

## Correction and integrity argument

1. Readers no longer acquire, wait for or release the writer lock.
2. Read B2:B6 together; validate B6's descriptor and the legacy B2 checksum.
3. Read only the immutable version named by that descriptor; validate chunk
   identities/order/length, complete length, SHA-256 and JSON structure.
4. Derive B5 diagnostics using the same snapshot's B4/B6 receipt, not a later
   independent metadata read.
5. Read B2:B6 again. Accept only if all five values match, otherwise retry the
   entire snapshot once. Continued movement returns SOURCE_BUSY without data,
   revision or a new read ticket.
6. A 12-second cooperative budget checks before/after each instrumented step.
   Exceeding it returns SOURCE_TIMEOUT without continuing further Sheets work.
   Both controlled source failures map to HTTP 503. Transport timeouts retain
   the existing HTTP 502 behavior. No automatic write/recovery was introduced.
7. Writers retain the exclusive lock and the existing durable sequence:
   B5 intent, verified previous/new immutable versions, backup archive, mirrors,
   B6 commit/receipt verification, B5 cleanup. CAS, request/content identity,
   idempotency, recovery and backups remain enforced. No schema migration.

Because version rows are append-only and never reused, a concurrent writer can
stage rows and update mirrors without changing the complete version being read.
Rechecking the control cells detects activation or intent changes during the
read. A write after that check is still protected by CAS at write time.

## Instrumentation and limits

Structured start/end logs use only component, operation, fixed phase, state,
elapsedMs and durationMs. They exclude payloads, IDs, source IDs, revisions,
prices, personal data, secrets and arbitrary exception messages.
Read phases: open, store-sheet, metadata, chunks, chunk-validation, validate.
Write phases additionally cover lock acquisition, control cells, intent updates,
backup, stage, archive, mirrors, activation and cleanup. The last start without a matching completion
helps locate an execution killed inside a service call.

The cooperative budget CANNOT interrupt an in-flight synchronous Sheets RPC.
A Google service stall can still last until the platform kills that execution,
but that reader no longer owns the CRM script lock. This does not eliminate
Google quotas, simultaneous-execution limits or a service-wide Sheets outage.
Future version pruning must not delete chunks that an in-flight reader may use.
Unsanctioned direct edits/other scripts do not participate in CAS and remain a
risk; checksum/metadata inconsistencies fail closed, never trigger repair.

## Isolated validation

- 40/40 Node suites passed, including all PR #14 recovery/integrity/concurrency suites.
- 23 directed cases: overlapping readers against the same source/lock,
  read while a writer owns the lock, writer progress during a simulated
  360-second read stall, changing B3/B4/B5/B6, activation races, pending and
  committed intents, legacy B2, checksum/legacy corruption, service exceptions,
  bounded retries/budget, private timing logs and API preflight rejection.
- Reads observed at 51 durable writer boundaries, always seeing a complete
  old/new authoritative JSON, never half-written mirrors or staged data.
- Recovery fault injection covers 167 interruption points, including newly
  instrumented read/RPC boundaries. Previous versions, backups, reservations
  8/24 and idempotent retries remain checked.
- Client/API tests verify SOURCE_BUSY and SOURCE_TIMEOUT retain local data and
  the exact pending request even when they differ, including after refresh.
- 96/96 JavaScript/TypeScript syntax checks passed; Apps Script parsing passed.
- 2/2 browser persistence/conflict regressions passed on loopback 53216,
  with authenticated in-memory fake Google storage, never port 5210.

Commands:

```sh
node tests/commercial-read-contention.test.js
node tests/commercial-write-recovery.test.js
node tests/commercial-recovery-client-api.test.js
node tests/commercial-client-complete-regression.cjs
node tests/commercial-browser-regression.cjs commercial-client-phase2a-browser.mjs commercial-pr6-regression-browser.mjs
```

The concurrency tests deterministically interleave the actual Apps Script at
service boundaries; they are not a claim of a live Google concurrency/load test.
No real data, source requests, writes, pending-operation changes or recovery.

## Review and future controlled verification

Changes are limited to the Apps Script source, two server error-code mappings,
targeted tests/harness assertions and this report. Frontend, API route,
authentication, data/prices/states and published Apps Script remain unchanged.
The aggregator freezes the server adapter except for those exact two added
codes, all original storage constants and all unrelated Apps Script functions.
The branch-specific Vercel Git deployment flag is false; no deployment command
or production setting change is part of this work.

Before any separately authorized release, review the Draft PR and validate the
instrumented complete source on an isolated Google test Sheet/Executable:
parallel reads, slow writer, CAS conflict, interrupted write and exact retry.
Inspect timing phases without exporting payloads. Keep production writes
disabled. Confirm source identity and contract using the established procedure.
The real pending request differs from current local data according to the
incident report; preserve both and the local export. This correction neither
chooses a recovery payload nor authorizes replay, clearing B5, replacing an
operation, changing configuration, merge or publication.

References: [Google lock semantics](https://developers.google.com/apps-script/reference/lock/lock),
[batching guidance](https://developers.google.com/apps-script/guides/support/best-practices),
[execution quotas](https://developers.google.com/apps-script/guides/services/quotas),
[Vercel branch deployment control](https://vercel.com/docs/project-configuration/git-configuration#git.deploymentenabled).
