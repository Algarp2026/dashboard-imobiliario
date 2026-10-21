# PR #15: quota-safe local recovery

Base correction preserved: `8fbad94`, branch
`codex/fix-pending-local-rollback`. No production operations.

## Confirmed cause and write audit

The old conflict review appended a full `localRecoveryExport()` to a new
`theView.crmCommercial.v2.conflictBackup.<timestamp>` key on every review.
`confirmedReadBackup.*` and `backupBeforeRemoteLoad.archive.*` also grew without
a bound. Each export can contain data, the confirmed base and the original
pending request, so one record can duplicate several copies of the CRM.

Other writes were audited:

- The active cache, syncMeta.base and pendingWrite are fixed keys. These copies
  have different purposes: current edits, three-way base and exact request
  identity. They remain compatible; none is pruned to obtain space.
- pendingSync is a small fixed marker. Preference settings are small fixed
  values. The Majuca pre-import backup is fixed and one-off; a failed backup
  now stops that legacy import rather than silently continuing.
- Reset-local also required an archive before deleting its cache; it now uses
  the same verified archive.
- The comparator's `theViewCommercialSuiteV1` is a separate fixed legacy cache,
  not one of these growing CRM backup families. It was not changed.

## Storage and retention

New full recovery snapshots use IndexedDB database
`theView.crmCommercial.v2.recovery.v1`, object store `copies`.

- Each write/prune is one readwrite transaction. Completion is awaited, then
  the committed record is read back and verified before destructive follow-up.
- New IDs use add, never overwrite an existing backup on an ID collision.
- Content deduplication ignores only the export creation time and the
  confirmation timestamp. Business timestamps and original request IDs/data
  remain part of the identity. A protected use upgrades a confirmed duplicate.
- Keep at most five known-confirmed snapshots, 64 records total and a 16 MiB
  payload/signature budget. Only known-confirmed snapshots may rotate.
- Unique unconfirmed, emergency and unknown legacy copies stay protected.
  If they exhaust the budget, reject the new operation without pruning them.
  Export and administrative review are required, not silent deletion.
- Without IndexedDB, the bounded localStorage fallback fails closed on quota
  or capacity; it does not discard an unknown older copy to make room.

Existing backup keys are not silently cleaned. The explicit
**Transferir backups antigos** action asks the user to close other The View
tabs, stores the exact key/raw string, waits for transaction/readback, checks
that the old string has not changed and only then removes that old key.
It never migrates/removes the active cache, sync metadata or pending request.
An aborted transaction leaves the legacy key untouched.

## Failure, export and recovery

- Reconciliation archives before replacing data. After the asynchronous
  archive it rechecks local data, generation/pending request and modal state.
- Cache + metadata + pending marker writes are staged before updating the
  in-memory success state or retiring the original request. A write failure
  attempts rollback, blocks confirmation and preserves the verified archive.
  Rollback only touches values still equal to this operation's own writes,
  not a different concurrent cache value. localStorage itself is not
  transactional; IndexedDB archives are.
- A failed primary save additionally protects the current in-memory export in
  IndexedDB. On refresh a newer emergency checkpoint prevents an old cache
  from being labelled synced or replayed through recovery.
- **Recuperar ultima copia local** is an explicit, confirmed, local-only
  operation with a backup of current data. It refuses to overwrite a different
  existing pending request and requires another authenticated source check
  before synchronization. Nothing is sent automatically.
- Known-confirmed or explicitly recovered checkpoints are acknowledged without
  deleting their protected contents, preventing repeated false recovery alerts.
- **Exportar copia local** requires no storage writes and includes current
  memory plus the valid original request. **Exportar arquivo local** includes
  IndexedDB records and remaining legacy copies. If the archive cannot be
  read, the current-copy export is offered with an explicit partial warning.
- Archive format 1 contains records with exact JSON strings in `raw`.
  Legacy transfer records contain `legacyKey` and exact `legacyRaw` inside
  that JSON. Keep the complete exported envelope for administrative recovery;
  do not replay a request with different contents or bypass CAS.

## Actual validation

The original PR #15 rollback and pending-request regressions remain.

- 42 Node suites passed, including cache/metadata rollback, quota failure,
  memory export, original request retention, bounded fallback, CAS, backups,
  write recovery and Apartment 16 recovery.
- Chrome reached its native localStorage quota (no quota monkeypatch).
  The old full-backup setItem was confirmed to fail. Both approximately
  4,096 free characters and completely full storage were exercised.
- At near-limit capacity, IndexedDB allowed reconciliation and normal sync.
  At full capacity, failed cache/marker writes never reported synced; export
  still worked and the original pending request remained intact.
- An injected IndexedDB transaction abort left all old keys and vault records
  unchanged. Explicit migration verified every exact raw string; retry and
  refresh then preserved all data with exactly one commercial POST.
- A real primary-cache quota failure retained the newest next-action/event
  snapshot in IndexedDB; refresh reported recovery required, explicit local
  restore sent no POST, and subsequent synchronization added the event once.
- Transactional retention kept five confirmed records, preserved the unique
  unconfirmed record and rejected overflow at 64 without deleting it.
- Browser runs use desktop/mobile, authenticated local API + real Apps Script
  VM with fictitious in-memory storage. Requests outside loopback are blocked.
- 4/4 relevant browser suites passed: native quota, pending-local rollback,
  Phase 2A and PR #6 regression. 102 syntax checks and Apps Script parsing passed.

Commands:

```sh
node tests/commercial-client-complete-regression.cjs
node tests/commercial-local-backups.test.js
node tests/commercial-browser-regression.cjs commercial-local-quota-browser.mjs commercial-pending-local-browser.mjs commercial-client-phase2a-browser.mjs commercial-pr6-regression-browser.mjs
node --check commercial.js
node --check app.js
node --check config.js
```

## Residual limits

IndexedDB is browser-local, not a server backup; eviction, clearing site data,
private-mode policy or device failure can remove it. Keep exported copies.
If both storage systems are unavailable/full, no browser code can guarantee a
new durable save: the application blocks confirmation, warns before leaving
and keeps current memory exportable. Do not close before exporting.

Close older tabs before explicit transfer. Legacy tabs do not participate in
an atomic cross-tab compare-and-delete protocol; a changed legacy value aborts
the transfer, but localStorage has no native CAS. Multiple data-key rollback
is best effort; verified archives/checkpoints provide the recovery copy.
Source writes remain governed by the existing read tickets, CAS and B5/B6.

No Google Sheet/API/server/Apps Script/authentication/pricing changes, real
fixtures, merge, deployment or production configuration changes. Review both
corrections together in the existing PR #15 before authorizing publication.
