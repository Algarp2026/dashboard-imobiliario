# Commercial persistence: isolated diagnosis and recovery plan

## Scope

Branch: `codex/fix-commercial-write-recovery`, based exactly on production reference
`fa876dc98f8ccc208ed68123ddce3c71e948ad51`. The separate dirty CRM worktree was not
changed. No production requests, Sheet access, credential changes, recovery,
push, PR, merge or deployment were performed. All test records are fictitious.

## Confirmed local causes, not a diagnosis of live Sheet contents

1. `crmWrite` persists B5 (intent), stages and validates immutable chunks,
   records a backup, updates derived mirror sheets, commits B6 (active pointer
   and receipt), verifies the active version and finally clears B5. If execution
   stops after mirrors but before B6, mirrors show the candidate while authenticated
   reads still return the previous authoritative version. Mirror appearance is
   not proof of persistence.
2. If B6 was committed but B5 cleanup failed, a retry with the original request
   works. However a different request previously encountered that completed B5
   and returned `WRITE_INCOMPLETE`, even with a current base revision. Now the
   writer recognizes a completed intent only when the verified active version
   and receipt agree on requestId, baseRevision and target revision. A subsequent
   normal write still requires CAS and a valid read ticket. GET never clears B5.
   The old receipt and backup remain retained; uncommitted/ambiguous intents are
   never bypassed, superseded or erased by an unrelated request.
3. The previous reconciliation stored a local data/base backup but deleted the
   original pending request, without knowing whether B5 still needed that ID.
   Subsequent recovery with another ID returns 409; a normal write with a new ID
   returns 503 while the different unfinished intent exists. GET now includes a
   validated, content-free `pendingWrite` summary. An unfinished/blocked intent
   stops automatic synchronization and reconciliation. Otherwise reconciliation
   includes the old request in its local backup before replacing it.

The live incident is consistent with causes 1 and 3, or cause 2, but its exact
phase and failed normal-save HTTP status remain unverified. No conclusion is
drawn about which candidate price was committed. No monetary value is changed
by this patch itself.

## Responses and retry semantics

- GET 200 with `canWrite=true` means write configuration is enabled, not that
  an unfinished intent is absent. Inspect `pendingWrite` as well as revision.
- `pendingWrite: null`: no persisted intent observed at read time.
- `state: pending`: intent base agrees with the verified active revision;
  same-request recovery is needed. `state: committed`: receipt and target
  revision confirm completion. `state: blocked`: metadata is inconsistent;
  stop and request administrative review.
- Summary fields are restricted to state, requestId, baseRevision and revision;
  no staged payload, credentials, or customer information is included.
- 409 `CONFLICT`: stale CAS revision, wrong/nonexistent recovery identity,
  changed payload for a receipt/intent, or otherwise incompatible recovery.
- 503 `WRITE_INCOMPLETE`: an unrelated unfinished intent blocks normal writes.
- Script execution exceptions (e.g. mirror/flush failures) currently reach the
  API as 502 `INVALID_SOURCE_RESPONSE`; network timeouts can be 502
  `SOURCE_TIMEOUT`. These are ambiguous outcomes, not proof of non-persistence.
  Read the authoritative source and preserve/retry the original request.
- Client errors now retain and display HTTP status plus safe machine code.
- Recovery is still authenticated and same-origin and can only resume the exact
  request/contents or confirm its matching active receipt. It is not a forced
  replacement route. Normal saves still require a session-bound read ticket.
- The protocol remains `tv-cas-v1`, with an explicit capability
  `capabilities.pendingWriteDiagnostics: 1`. A GET must have its own `pendingWrite`
  property. Explicit null means no intent; a missing property means unsupported
  diagnostics, never an empty intent. Both API and client strictly check the
  four-field summary, types, states, revision relations and feature version.
- Missing/unsupported capability or a missing summary blocks synchronization
  with `SYNC_DIAGNOSTICS_UNAVAILABLE`; malformed summaries are rejected as
  `INVALID_SYNC_DIAGNOSTICS`. The API returns 503 or 502 respectively. The client
  retains data, requests and metadata and gives a compatibility message.
- Before any save/recovery POST, the new client probes GET, so an old API cannot
  receive a write from it. Before invoking any source write/recovery function,
  the new API probes `crmRead`, so an old Apps Script cannot be mutated by it.
  This does not upgrade already-open old clients; the controlled rollout below
  requires a write freeze and closing/reloading them. No deployment is authorized.

## Tests and reproduction

Run with Node.js, from this worktree, without environment credentials:

```text
node tests/commercial-write-recovery.test.js
node tests/commercial-recovery-client-api.test.js
node tests/commercial-chunk-storage.test.js
node tests/commercial-concurrency.test.js
node tests/commercial-sync-api.test.js
node tests/commercial-sync-client.test.js
node tests/commercial-write-integrity.test.js
node tests/commercial-sync-final-audit.test.js
```

The new storage suite injects 105 interruptions before/after durable mutations
and at flush boundaries, for legacy and already-chunked stores larger than
150,000 characters. It checks whole-version visibility, same-request recovery,
idempotent retries, backup counts and recoverable prior versions, unchanged B2,
unrelated/conflicting requests, inconsistent metadata and read-only diagnostics.
Existing chunk tests additionally exercise partial/corrupt chunk writes.

The integrated suite executes actual client functions in two simulated browser
contexts through the authenticated API, server adapter and in-memory Apps Script.
Every fetch is intercepted and production access is forbidden. It verifies
200/409/503/502, refresh, lost acknowledgements, retained requests, blocked
reconciliation, local archival, later confirmed saves, and unchanged reservation
events/statuses/prices/provenance for synthetic units 8 and 24. It is not a
real-browser visual test or a real-Google durability guarantee.

Before/after proof: `CHECK_BASELINE=1` runs the stale-intent assertion against
the original production Apps Script and intentionally fails. Similarly
`CHECK_CLIENT_BASELINE=1` intentionally reproduces deletion of the recovery
request by the original reconciliation. Both tests pass against the patch.
The historical D2 source-freeze assertions exclude only the synchronization
files/functions intentionally changed here; commercial/UI/PDF guards remain.

Final independent-audit regressions: 47 targeted cases, including 14 malformed
or incompatible diagnostics exercised at both API and frontend boundaries.
All 37 `tests/*.test.js` suites passed. JavaScript syntax checks, Apps Script VM
parsing and `git diff --check` passed. No real browser or real Google service
was used. Tests include 65 fictitious clients, 90 events and reservations 8/24;
the example unit-16 amounts reproduce the reported delta only in memory.

## Files changed

- `google_apps_script.gs`: safe pending summary and completed-intent recognition.
- `server/commercial-store.js`: strict summary validation and field allowlist.
- `api/commercial-data.js`: authenticated GET includes the safe summary.
- `commercial.js`: pending-write gate, archived request and HTTP diagnostics.
- `commercial.js` also includes complete private exports, capability checks,
  read-only preflight, stale-review rejection and retention of rejected requests.
- `tests/helpers/apps-script-store.js`: optional in-memory interruption hooks.
- `tests/commercial-write-recovery.test.js`: storage interruption regressions.
- `tests/commercial-recovery-client-api.test.js`: integrated client/API recovery.
- `tests/commercial-sync-final-audit.test.js`: export purity, compatibility,
  upgrade-in-flight and reconciliation race regressions (47 targeted cases).
- `tests/commercial-sync-client.test.js`: supported capabilities in the fake API.
- `tests/commercial-composition-d2.test.js`: retain business/UI guards while
  allowing this explicitly scoped synchronization intervention.
- `COMMERCIAL_WRITE_RECOVERY.md`: diagnosis, evidence, limitations and procedure.

No persistent business schema or storage layout changed; no migration is needed.
The local conflict-backup/export envelope gains additive fields, including the
optional pendingWrite. Existing copies with data/base/createdAt remain usable;
absence of a pending request in an old export is not proof that none existed.

## Private recovery exports

`Exportar copia local` is available in the synchronization status area even if
an incomplete source prevents opening reconciliation. The same export function
serves the reconciliation modal. It includes current local data, confirmed base,
the complete original pendingWrite (action, requestId, baseRevision and original
data, unchanged), confirmed revision/time, pending flag and export timestamp.
The data/base/createdAt fields remain compatible with earlier copies.

The function only reads storage and creates a local download. It neither calls
the API nor writes/removes storage keys. It never exports runtime read tickets,
cookies, authentication state or credentials; synchronization metadata is
allowlisted. Invalid JSON or unexpected request-envelope fields stop the export
without changing the original. An export without an original request cannot
invent or reconstruct its ID. Exports contain private business data: keep them
offline and out of Git, screenshots, logs and external services.

Rejected requests and requests belonging to an older base are no longer silently
removed or replaced by a new ID. Explicit recovery remains possible with an
original request even if its separate pending flag is missing. If a successful
GET confirms the same local/request data, the exact request is archived privately
before its active local key is retired. If the pending request contains different
data despite matching local/remote snapshots, the client stops with
`UNCONFIRMED_PENDING_REQUEST` and requires review instead of silently losing it.

Before applying either reconciliation option, the client performs another
authenticated GET and checks revision, complete pending summary and remote data
against the reviewed snapshot. It also rechecks local data and the exact pending
request after the await. Changed state, incompatible diagnostics, an in-flight
local save or a closed dialog aborts the application without changing storage.
The user must review again. A successful review archives the original request,
uses the fresh read ticket and prepares a local result only; it cancels any old
save timer and does not send a POST. The final save requires explicit action
and still uses server CAS, which rejects later races with 409.

## Controlled publication order: instructions only

1. Obtain separate approval for publication. Arrange a maintenance/write-freeze
   window. Preserve complete source/browser backups, including exact pending
   requests, before changing any component. Disable both existing write gates
   under approved administrative control; do not clear or resume intents.
2. In an isolated test environment, validate the complete version combination
   and rollback plan. Do not point a preview at the production source for writes.
3. While writes remain disabled, update the configured Apps Script API Executable
   to the reviewed implementation. Verify its version/capability and read-only
   diagnostics administratively. Do not execute `testWrite` with a payload, deploy
   an old Web App, edit cells or import data as part of publication.
4. Update Vercel API and frontend together from this isolated fix. Keep the source
   deployment pinned to its reviewed version; do not change source versions or
   roll them back while a request is executing. If the API is updated before
   Apps Script, its preflight must return 503 and refuse mutation. A new frontend
   against an old API similarly refuses to POST. These are intentional safe stops.
5. Close/reload old browser sessions and verify the new capability end-to-end,
   explicit null or valid intent summary, revision, full counts and backup
   checksums using authorized reads. Check both normal and pending-source cases
   in the isolated environment. No automatic recovery or local overwrite is a
   deployment step. Incompatible components must not be worked around.
6. Review any existing intent and the incident separately, following the recovery
   procedure below. Re-enable writes or authorize one controlled recovery only
   after explicit approval, with other writers excluded during maintenance.
   Resume general use only after confirmed receipt and integrity checks.
7. If rollout must be rolled back, freeze writes first and preserve requests and
   backups. Do not downgrade one component and continue writing through an old
   frontend. The block storage is unchanged, but old clients lack these safeguards.

No write gates, credentials, deployment settings or source resources were changed
in this task. The steps above are not authorization to execute them.

## Safe recovery procedure: preparation only

All actions below involving the real source require separate explicit approval.
Do not use a dashboard reload, reconciliation or repeated save as a diagnostic.

1. Preserve the browser's current local JSON, confirmed base/sync metadata,
   pending flags and exact pendingWrite object separately, without deleting or
   replacing any key. Preserve all existing conflict backups. Keep exports private;
   never attach them to Git or test fixtures. Do not close the only browser copy.
2. Verify a complete recoverable spreadsheet backup, including Store B2/B3/B4/B5/B6,
   StoreVersions and BackupsVersions. Reconstruct active and previous versions;
   validate lengths, chunk indices, SHA-256, JSON structure, unique IDs and links.
   Preserve the legacy checksum. A mirror-only export is not a full backup.
   This patch has not inspected or validated the user's actual backup.
3. With approved authenticated GET only, read the active revision and the pending
   summary. Repeat the read and require a stable revision/summary. GET must not
   write or repair metadata. A concurrently changing source is a reason to stop.
   Read revision alone does not establish the intent phase on the old deployment;
   use approved administrative read-only inspection if the summary is unavailable.
4. Compare the candidate's canonical SHA-256 to the target revision of the intent
   or receipt, with the same serializer as the API. Confirm exact requestId and
   original baseRevision, not merely the browser's latest revision. Confirm full
   counts, IDs, references and unknown metadata, both reservations 8 and 24,
   their event/provenance/sale-price/commission fields, and that the proposed
   difference is restricted to the intended unit 16 price/history change.
   The desired price requires user confirmation; never infer it from a mirror.
5. If the intent is pending, keep the original pending request. With approval,
   send only that exact request using `action: recover`. Do not change its base
   revision to the current revision, regenerate its ID or substitute a merged
   payload. Resolve the underlying mirror/capacity failure first if it is still
   present. A same-ID retry does not append another backup or business event.
6. If already committed with the matching receipt, the same recovery request can
   confirm it idempotently. A later unrelated normal write can ignore only that
   cryptographically verified completed intent under the new code. Do not clear
   B5 manually, even if the mirrors appear correct.
7. If the request was lost, mismatches the source, or the intent is blocked:
   stop. Recover the exact request from private preserved copies, or prepare a
   separately approved administrative read-only reconstruction of its immutable
   staged version and verify its checksum. If no staged descriptor exists and
   no original request copy survives, this patch cannot reconstruct it safely.
   Never guess an ID/payload or force-reset B5. If there is no pending intent or
   matching receipt, a 409 recovery is expected; any new CAS save requires a
   separate reviewed reconciliation, fresh authenticated read/ticket and approval.
8. After an approved recovery, require persisted=true, exact requestId and expected
   target revision from the response. Repeat authenticated reads, reconstruct
   and check active length/checksum, verify the prior backup and original B2,
   compare all protected data, and confirm both reservations and no duplicated
   events/history entries. Only after those confirmations retire the browser
   pending request through the normal client success path, preserving exports.
   Any 409 or uncertain response stops the sequence; do not force or auto-loop.

## Remaining limitations

The real failure's code, current B5/B6/receipt, mirror error, installed Apps Script
version and backup integrity are unknown. This intervention does not prove that
the live source is recoverable. Cell-size limits in mirror fields, Apps Script
quotas/timeouts and append-only sheet growth are unchanged. Mirrors can still be
partially refreshed before a commit; only verified active chunks are authoritative.
Orphaned chunks/backups are intentionally retained. A real deployment and any real
recovery require explicit authorization and separate operational checks.
The compatibility probes add read round-trips to saves and recovery. Existing
client/source timeouts and the Vercel function duration limit are unchanged;
slow operations may still have ambiguous acknowledgements. Preserve the exact
request and diagnose before manually retrying; the patch does not auto-loop.
