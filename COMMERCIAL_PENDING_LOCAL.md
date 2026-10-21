# Pending local changes versus shared rollback

Base: main `ed7c68480ee3a319717a225c34125c25ba45c3a5`.
Branch: `codex/fix-pending-local-rollback`. Draft review only.

## Reproduced cause

The previous load path called `sharedStoreMayRegress(local, remote, meta,
remoteRevision)` before its pending-local-changes branch. The regression check
compared the already edited local data with the unchanged server. An edited
client or an additional local event was interpreted as information lost by the
server even when both the remote revision AND the entire remote JSON matched
the last confirmed base. A new test failed on the original main with
`conflict` instead of `pending`; it passes with this correction.

## Narrow correction

- Same confirmed revision + exact normalized base equality means that the
  source has not regressed relative to that confirmed base. Preserve local
  differences as pending; a refresh performs no commercial POST.
- Same revision with different contents is still blocked. An older/missing
  remote record, metadata loss, unknown-field loss or a true 63-to-24 rollback
  without that exact confirmed-base proof remains protected.
- Source B5 diagnostics are still validated before any new classification.
  Pending/blocked source writes retain the previous fail-closed behavior.
- An existing local request different from current local data cannot be sent
  either as a normal retry or as recovery. Its exact original contents/ID remain
  in storage and the state is `PENDING_REQUEST_REVIEW_REQUIRED`.
- If an acknowledgement was lost and the authenticated remote data matches
  the original request from the confirmed base, but newer local changes exist,
  require review rather than call it a shared rollback. Do not replay the older
  request, mark the newer data synced, or silently replace either copy.
- Use the existing explicit three-way review. It rechecks the entire remote
  data, revision, B5 diagnostics, current local data and pending request before
  applying. It archives the full original request before retiring it. A new
  operation ID is created only after that review, and CAS still governs writes.
- If remote and local match the outstanding request after a lost response, the
  existing confirmed-read archival path can retire that request without POST.
  Otherwise an unconfirmed request remains blocked.

No new merge policy, automatic recovery, data migration, localStorage key or
backend protocol. Only three production functions in commercial.js changed:
`loadRemoteData`, `sharedStoreMayRegress` and `syncRemote`.

## Validation

- 41/41 Node suites passed, including all integrity, concurrency, rollback,
  metadata, chunk/backup, write-recovery and Apartment 16 regressions.
- Nine new client/API/actual Apps Script VM scenarios: same-base pending edits,
  timeout before persistence, lost acknowledgement, both cases with a newer
  divergent local copy, true rollback, contradictory revision/content, two
  concurrent users and a changed revision while review is open.
- New real-browser journey at desktop 1440px and mobile 390px: refresh without
  POST, explicit sync, older recovery request refused after confirmation,
  review/archive/new request, refresh, unique event IDs and preserved prices,
  states, histories, reservations and commissions.
- 3/3 relevant browser suites passed in the final combined run: the new
  desktop/mobile journey, Phase 2A and PR #6 regression.
- 98 JavaScript/TypeScript syntax checks passed; Apps Script parsing passed.
- The historical unknown-local-metadata test now expects pending, not conflict,
  only when its source equals its confirmed base. The 24 existing rollback/
  metadata cases and all security assertions remain.
- Aggregator freezes the sync code outside the three reviewed functions.
  Backend, Apps Script, authentication, data and unrelated commercial modules
  remain unchanged from main.

```sh
node tests/commercial-pending-local.test.js
node tests/commercial-client-complete-regression.cjs
node tests/commercial-browser-regression.cjs commercial-pending-local-browser.mjs commercial-client-phase2a-browser.mjs commercial-pr6-regression-browser.mjs
node --check commercial.js
node --check app.js
node --check config.js
```

All fixtures are fictitious. Google requests are intercepted in memory and
browser traffic is restricted to the isolated loopback server. No live Sheet,
credentials, production reads/writes or recovery operations were used.

## Scope and residual risks

Files: commercial.js; new Node/browser regressions; browser runner registration;
the existing sync test and regression aggregator; this report; and the single
branch-specific Vercel Git deployment disable flag in vercel.json.

The equality exception requires valid local sync metadata plus an authenticated,
compatible source response. It does not resolve missing/corrupt base metadata,
conflicting edits to the same field, a source intent, source corruption, storage
failure or a divergent old request automatically. These remain explicit review
or administrative-recovery cases. Browser backups remain on that device, not a
substitute for source backups. Offline transport/server failures remain possible.

The real incident is not replayed. No decision about a real pending payload is
made here. No merge, deployment, Apps Script publication, configuration change
in production or automatic publication is authorized. Publish only this branch
and create a Draft PR to main after verifying the expected commit and refs.
