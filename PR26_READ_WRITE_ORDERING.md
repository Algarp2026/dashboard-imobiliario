# PR26: investigation of the final mobile synchronization blocker

## Confirmed cause

A deterministic read/write ordering defect exists both in main `8148c67` and
in the original PR26 commit `9f8d79b`. An automatic read captures revision A,
then awaits local checkpoint I/O. A newer write can confirm revision B during
that wait. The old read subsequently classifies B against its captured base A,
restores the obsolete base/revision and changes `synced` to `pending`.

The reproduced final state was `busy=false`, `dirty=false`, `verified=true`,
without a pending request or active local operation, but with a cache different
from the restored baseline. Waiting longer cannot resolve that state.

This reproduces the original blocker's symptom after server acknowledgement.
The original failing run did not contain internal timing traces, so its exact
interleaving cannot be established retrospectively. The defect is preexisting,
not a newly introduced commercial rule or a demonstrated archive maintenance
deadlock. Additional asynchronous archive verification can widen this window.

## Minimal correction

`applyRemoteData()` captures the starting revision and checks whether the read
was superseded after checkpoint lookup and again after checkpoint acknowledgement.
An obsolete result returns without replacing the confirmed revision, baseline,
cache, phase or original pending request. Automatic reads also honor changes to
the local generation/shared cache. Manual recovery retains its existing path,
with the revision fence preventing a late read from undoing its acknowledgement.

The write protocol, CAS, tickets, B5/B6, archive retention, receipts, idempotency,
pending request identities and server integrity checks are unchanged. The original
15-second browser assertion was not increased or removed.

## Local timing evidence

Measured with temporary instrumentation in an isolated Chrome/fictitious source.
These are successful local samples, not Google measurements or latency guarantees.
All durations are milliseconds; stages overlap and must not be added together.

| Stage | Original PR26 desktop | Original PR26 mobile | Main desktop | Main mobile |
| --- | ---: | ---: | ---: | ---: |
| Server write response, including JSON | 32.9 | 45.9 | 29.8 | 25.7 |
| Request archive confirmation | 56.2 | 130.0 | 14.5 | 13.7 |
| Confirmed cache commit | 1.5 | 1.3 | 0.7 | 1.7 |
| Post-commit checkpoint lookup | 44.9 | 26.6 | 1.3 | 1.9 |
| Whole write pipeline | 248.2 | 334.0 | 140.4 | 172.7 |

In the PR26 mobile sample, the server write ended at 29742.8 ms, the pending
request was removed at 29907.1 ms, `synced` appeared at 29912.9 ms and `busy`
cleared at 29914.1 ms. Native IndexedDB read/write transactions totaled 82.5 ms
across three transactions (maximum 74.9 ms). That case had no checkpoint to
acknowledge: acknowledgement ordering is separately covered by a gated test,
not reported as a measured zero-duration operation.

Instrumentation captured phase, busy, dirty, verified, checking, errors, pending
existence, cache/base equality, focus/visibility and unfinished operations. It did
not log commercial payloads, names, request identifiers or credentials. It lives
outside the application. The final catalogue runs without this instrumentation.

Before the fix, gated native-browser probes on main and PR26 both ended in
`pending` with an obsolete baseline. After the fix, the same probe ends in
`synced`, with matching cache/base/revision, no pending request and no active
operation. No production endpoint or data was used.

## Regression coverage

- Nine deterministic Node cases: old-main reproduction, checkpoint and
  acknowledgement gates, newer unsent changes, timeout before/after write,
  confirmed write followed by another edit, explicit recovery and another tab.
- The existing fraction-draft browser suite retains every functional check and
  adds the gated real frontend/API write in desktop and mobile. It verifies one
  POST only, preserved unrelated data, coherent metadata/cache and reload without
  a duplicate write.
- Test hooks are injected only by the isolated fixture; production HTML does
  not load them. The normal hook path returns the original checkpoint promise.
- Source guards explicitly recognize the reviewed read fence and fixture hooks;
  all other protected business/backend/source comparisons remain in force.

Final integrated catalogue results are recorded in
`docs/local-storage-optimization/read-write-ordering-results.json`.

Fresh corrected-code results: **67/67 Node suites, 33/33 browser suites in one
continuous run, and 155/155 syntax checks passed**. The focused fraction-draft
suite also passed independently before the complete run. The complete catalogue
covers archive/quota, loading, pending writes, tickets/CAS, reconciliation,
commercial operations, PDFs and comparator regressions. No checks were removed.

Technical recommendation: **APTA PARA MERGE**, subject to the user's explicit
approval. This recommendation does not authorize a merge or deployment.

Earlier instrumented exploratory runs had fixture/environment failures: a sensor
initially referenced browser APIs in a Node VM, and one full run per version
omitted NODE_PATH for pdf-lib. They are not counted as green full runs or product
regressions. The latter main PDF case passed with the proper dependency path.

## Limits and publication

The deterministic defect is resolved, but no historical trace can prove the exact
schedule of the original uninstrumented failure. Testing uses Chrome; Firefox,
WebKit, private-mode quota and slower devices still warrant controlled validation.
Unresolved/unknown archives remain protected and may still need explicit review.
The change provides no guarantee against browser data deletion or device failure.

No commercial records, prices, states, API, Apps Script, authentication, deployment
settings or design were changed by this correction. No merge, deployment, Google
operation or automatic production recovery is authorized. Keep PR26 in Draft.
