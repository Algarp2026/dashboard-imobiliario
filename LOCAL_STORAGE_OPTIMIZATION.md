# Local recovery storage optimization

Isolated branch `codex/optimize-local-recovery-storage`, based on merged main
`8148c67eb8dee274b201ae570026c5dd45b798e0` (PR25). No production access,
migration, merge or deployment. Limits remain 64 records / 16 MiB estimated /
five eligible confirmed snapshots. This is a local archive change, not a
commercial data migration or a remote persistence change.

## Confirmed diagnosis

- Confirmed read snapshots depend on an eight-entry, in-memory confirmation map. After reopening a session the old entries may no longer qualify for retention, despite their old unprotected flag.
- Write acknowledgements clear flags but leave the original pending request in the snapshot. Administrative protection still regards that body as pending. A durable, content/revision/request-bound confirmation receipt is needed; flags and checksums alone are insufficient.
- Snapshots repeat data/base/remoteData; UTF-16 estimates count both text and hashes. Browser quota is a separate, origin-wide constraint.

## Implementation constraints

- Keep limits 64 / 16 MiB / 5 confirmed copies. Keep the existing database and readable legacy records. Only verified, genuinely confirmed records qualify for incremental consolidation/compression; unresolved requests, checkpoints, conflicts and unknown structures remain intact.
- Persist a strictly validated local acknowledgement receipt at authenticated confirmation, binding original content, revisions and request identity. Revalidate its structure and integrity on reopening; never accept legacy flags or a caller's confirmed argument as proof.
- Use gzip only with native CompressionStream/DecompressionStream and a verified round-trip. New readers inflate into the existing readable export format. Failed/unsupported codecs preserve original bytes. Older clients must treat newer envelopes as unknown/protected; pending requests/checkpoints remain uncompressed. Document downgrade limitations rather than claiming an older reader can decode a new envelope.
- Analyse/hash/compress outside readwrite transactions, then compare the complete physical records before any mutation. Aborted or stale plans preserve originals. Bounded scheduling after confirmed reads/writes and pressure; no remote protocol changes.
- Diagnostics contain counts, estimated physical usage, recoverable bytes and protection reasons only. Never include customer data, request identifiers or monetary values.

## Snapshot inventory

The live `theView.crmCommercial.v2` cache and `.syncMeta.v1` remain unchanged.
They retain the live data and CAS baseline; `.pendingWrite.v1` retains the
original request, and `.pendingSync` retains the unconfirmed marker. They are
not pruned by archive maintenance. Existing keys/database/version stay intact.

Archive creation sites and approximate uncompressed UTF-16 cost, where N is
one complete data body (structural estimates, not production measurements):

| Kind / trigger | Approximate body cost | Eligibility |
| --- | --- | --- |
| `legacy`, explicit transfer from old localStorage copies | Original envelope, including escape overhead | Strictly understood and source-confirmed only; otherwise preserved |
| `storage-failure`, failed local persistence | 2N, or 3N with original request | Unresolved checkpoints always protected |
| `before-local-restore`, explicit local recovery | 2N or 3N | Original identity and confirmation required |
| `before-remote`, changed authenticated read | 3N, or 4N with request | No backup for unchanged content; regressions/conflicts protected |
| `confirmed`, preserving request before read-side retirement | 3N | Content equality alone does not acknowledge an original request |
| `write-request`, before a POST | 3N | Actual exact request acknowledgement required |
| `auto-reconciliation`, compatible three-way merge | 3N or 4N | Exact successful merged write must incorporate the snapshot |
| `conflict`, explicit reconciliation | 2N or 3N | Unresolved divergence preserved |
| `reset`, explicit local reset | 2N or 3N | Unconfirmed content remains protected |

These costs explain amplification independently of the number of clients.
Unknown business fields are included in complete content hashes, never dropped.
Metadata is now included in capacity estimates too; unknown non-text/cyclic
records cannot trick the estimate into accepting additional writes.

## Confirmation and maintenance

New `confirmationReceipt` metadata records the *application's observation* of
an authenticated read or acknowledged write: protocol, full source revision,
archived baseline, actual write baseline, original request ID where applicable,
and hashes of exact original raw bytes, complete content, baseline and remote
snapshot. The revision must equal the SHA-256 of canonical committed data.
Formatting differences in a legacy raw string remain bound to its exact bytes.

A pending marker without a request is not confirmation. If the full snapshot
is subsequently observed in the authenticated source, a receipt can resolve
that marker; actual changes still absent from the source remain protected.
An original request needs its own acknowledgement, even if its business data
equals a later read. Neither `{confirmed:true}`, legacy flags, dates nor an
export checksum manufacture commercial confirmation. True source regressions
(including a 65-to-24-client rollback) do not acquire a read receipt.

The receipt is persisted local acknowledgement provenance, **not a server-signed
certificate** or protection from malicious editing of IndexedDB/XSS. Its trust
boundary is the authenticated application that created it. No automatic import
or remote protocol/credential change is added. External archive integrity alone
does not prove commercial confirmation.

Maintenance is scheduled after verified reads (including startup) and actual
write confirmations, and forced near archive pressure. A one-second debounce,
30-second throttle and single in-flight maintenance task per tab limit work.
Hashes and compression run outside write transactions. The transaction rechecks
the entire physical record set against the analysed snapshot before any put or
delete; another tab's addition, edit or deletion aborts the plan. Completion is
awaited. Quota errors, aborts and failed rechecks preserve the old records.
Ordinary archive insertion independently enforces bounded confirmed retention.

Deduplication ignores only snapshot creation/last-check timestamps. Baselines,
unknown information and original request identity remain part of the content.
Different request IDs never consolidate merely because business data matches.
An unresolved checkpoint overrides any receipt. Historical confirmations survive
reopening or eviction of the eight-entry in-memory observation cache.

## Compact format and recovery

Only verified, confirmed copies are incrementally gzip-packed in IndexedDB.
The envelope is `recoveryStorageFormat:1`, `codec:gzip`, base64 bytes, original
character length and SHA-256. Decoding has length/output limits and checksum
verification; packing requires an exact native round-trip and a smaller result.
The latest retained confirmed copy stays plain. Pending requests/checkpoints
stay plain. No database upgrade, commercial schema change or mass migration.

The normal archive export remains readable format 2: successfully decoded raw
JSON, original metadata, current data, baseline, original pending request and
local entries, with its existing checksum. The offline verifier remains unchanged.
Tests export compact records, verify the external file and recover equivalent
records into a separate fictitious profile. If a codec is unavailable/corrupt,
opaque original bytes remain protected/exportable rather than becoming empty.
Older application versions preserve newer receipts/envelopes as unknown; they
cannot decode compressed history. Full downgrade usability is not claimed.

## Measured growth

Exactly the same fixed fictitious fixture and script on Chrome/Windows:
400 unchanged read attempts, then 400 distinct confirmed revisions, volatile
confirmation cache reset every five revisions, then final idle maintenance.
The baseline server serves `git show 8148c67:commercial.js`, sanitized identically.
Both executions use the same physical-size estimator (including metadata).

| Observation | Previous implementation | New implementation |
| --- | ---: | ---: |
| Copies from 400 unchanged reads | 0 | 0 |
| Distinct revisions completed | 65; next blocked | 400 |
| Error | `LOCAL_BACKUP_CAPACITY` | None |
| Peak record count | 64 | 5 |
| Peak estimated stored bytes | 9,186,904 | 724,250 |
| Final estimated stored bytes | 9,186,904 | 195,506 |
| Time until stop / completion | 6,373 ms | 28,469 ms |

The time columns cover different numbers of completed operations, not a latency
benchmark or a percentage speed claim. These are local synthetic measurements,
including compressible padding, not Google timings or a production compression
ratio. IndexedDB/browser quota is origin-wide and distinct from the internal
UTF-16 estimate; diagnostics show both separately.

## Validation

Commands (Node and Playwright/Chrome paths supplied by the local environment):

```powershell
node tests/commercial-client-complete-regression.cjs
node tests/commercial-browser-regression.cjs
# Same growth script against old source, with isolated in-memory API:
$env:STORAGE_SOURCE_BASELINE='true'
node tests/commercial-browser-regression.cjs commercial-storage-growth-browser.mjs
Remove-Item Env:STORAGE_SOURCE_BASELINE
```

- 66 Node suites passed, including exact source guards, CAS, read tickets,
  interrupted writes, Apartment 16, auto-reconciliation and commercial integrity.
- 153 JavaScript/CJS/MJS syntax checks passed.
- Initial complete browser run: 31/33 passed; offline-leadership timing and the
  existing `Piso 5` search test required independent investigation/reruns. The
  final combined catalogue has 33/33 passing suites after the focused reruns;
  this is not claimed as a single uninterrupted green run. Evidence is recorded
  in `docs/local-storage-optimization/results.json`.
- New native-browser stress: 120 acknowledged frontend writes (12 unique added
  fictitious events), reopening, two isolated computer profiles, lost response
  and idempotent replay, interruption with a newer unsent edit, real HTTP409,
  native transaction abort, exact deduplication, gzip/export/recovery, codec
  failures, same-browser record modification during compression, 64 protected
  copies, aggregate diagnostics, and a browser-enforced IndexedDB quota error.
- Quota is induced through Chrome's native quota override plus actual random
  Blob transactions until `QuotaExceededError`, not a stubbed setItem. The real
  frontend save remains unconfirmed, sends no POST after archive failure,
  preserves live data/original request, and can still export externally.
- Existing actual localStorage exhaustion, PDF, forms, navigation, reservation,
  sale, commissions, prices and comparator tests remain in the full catalogue.

The recovery browser fixture now contains a real unsaved data difference, not
only a pending flag on already source-identical data. All legacy/pending/unknown
metadata/checkpoint preservation assertions remain. The auto-sync offline test
also requires an actual attempted read and waits for offline state, rather than
assuming a leadership-skipped check observes the network failure immediately.
Historical source guards explicitly recognize these reviewed test additions and
the local-only ranges; API, transport, business rules and all other source lines
are still frozen to the merged main implementation.

The search probe observed no input event reaching the document during a rapid
fill immediately after modal closure. The final test waits for that transition,
types through the keyboard and additionally asserts the exact input value;
the original six-result and all subsequent functional checks remain unchanged.
The offline test advances a bounded number of virtual polling periods, since a
lock-skipped/coalesced poll is not a completed network observation. Both UI
paths were independently run against the previous main as a control. No product
search, navigation, read leadership or network-recovery code was changed.

## Files and operational limits

Runtime changes: `commercial.js` (local vault, receipts, compression, maintenance,
diagnostics and acknowledgement integration); `vercel.json` (only this branch's
automatic deployment disabled). Everything else changed is this report, its
aggregate evidence or isolated tests/fixtures/source guards. No production data,
prices, statuses, Apps Script, API, authentication, PDFs or commercial model changed.

Archives already filled with genuinely unresolved requests or unknowable legacy
states cannot be safely emptied automatically. They remain blocked with an
explicit diagnostic/export path and may need a one-time reviewed resolution.
Likewise, a legacy source missing normalization fields may have a raw revision
different from its normalized local body; it is not assigned a guessed receipt.
No write or migration is forced to manufacture confirmation. Future ordinary
acknowledged writes establish an exact full-content revision for new receipts.
Normal *confirmed* use now stays bounded without periodic manual cleanup.
No promise can prevent browser/site-data deletion, device failure, origin-wide
quota imposed by unrelated code, or loss in private mode; external backups remain
necessary. Testing used Chrome only; other engines/codec fallbacks warrant
controlled validation before rollout. Publication remains blocked pending review.
