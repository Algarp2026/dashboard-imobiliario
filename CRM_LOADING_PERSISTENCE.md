# CRM: completed reads must not strand local writes

## Scope and reproduction

Base: `main` at `e2c041dc` (PR #21 integrated). Branch:
`codex/fix-crm-loading-persistence`. No production resource was accessed.

The attached `the_view_fix_persistencia.py` was inspected before execution:
it reads/writes only `commercial.js`, checks every replacement before writing,
and contains no network calls. Its SHA-256 is
`5a2440e971aa54ecfc6ba28dc72cce35200a6d317150edaca5f6686c37b07986`.
It was run once from the new worktree root using the bundled Python executable
(Windows equivalent of `python3 the_view_fix_persistencia.py`). The exact input
script is retained for traceability, not automatic execution. It is a one-shot
patch: rerunning it against the corrected source intentionally fails its checks.

Confirmed defect: a manual `loadRemoteData()` set `phase='loading'` and revoked
verification. When an editor was open and the source revision was unchanged,
the protected-editor early return left both values unchanged. Subsequent `save()`
kept data locally but could not schedule a remote write. The targeted test runs
the actual base source and reproduces this failure before checking the fix.

## Applied correction and review adjustments

- A manual read uses `checking`, not an unconditionally persistent `loading` phase.
- With a protected editor, only an unchanged confirmed base/revision can renew
  the ticket and restore `synced` or `pending`. Form values are not overwritten.
- The read finalizer schedules an eligible local pending write without another
  manual click. It refuses open editors, uncertain original requests, busy writes,
  missing write permission, missing confirmation, and automatic-reconciliation blocks.
- Price/agent messages distinguish local registration from remote confirmation.

The supplied patch required three small safety supplements after review:

1. A manual read still revokes write verification until it completes. This
   prevents a queued timer from transmitting during that fresh read.
2. An incomplete source operation is handled before the protected-editor return,
   preserves a backup, and leaves verification false (`WRITE_INCOMPLETE`).
3. Storage/recovery/rollback errors and `autoBlock` are not silently cleared by
   an unchanged read with an editor open. Only reviewed transient errors can clear.

No changes to `save`, write preflight, CAS, read-ticket transport, B5/B6,
idempotent recovery, request IDs, IndexedDB, backup retention, reconciliation
algorithm, or commercial rules. Exact source guards cover the complete script
outside `applyRemoteData` and the two message literals. The reviewed read function
has its own fixed SHA-256 assertion; unrelated changes cannot pass unnoticed.

Existing historical whole-file assertions were narrowed to these exact changes,
not removed. All other protected files and analytical data remain frozen.
`vercel.json` only adds this branch to the disabled automatic deployment map.

## Tests and reproduction commands

- `node tests/commercial-loading-persistence.test.js`: 18 directed cases passed.
  Covers the failing base, manual read with editor, automatic rescheduling,
  read/write overlap, reload, timeout/offline/authentication failures, source pending
  operation, preservation of serious errors, remote edits, old pending payloads
  before/after lost confirmation, rollback and automatic-retry blocks.
- `node tests/commercial-client-complete-regression.cjs`: 59 Node suites passed,
  including storage chunks/backups, quota, CAS/concurrency, Apartment 16 recovery,
  source-side integrity, ticket renewal and safe reconciliation.
- `node tests/commercial-browser-regression.cjs`: 27/27 browser suites passed.
  This retains all 26 existing suites and adds the incident regression.
- New real Chrome scenario: desktop 1440px and mobile 390px; actual edit/save,
  manual read during open form, refresh, writes queued behind a held read,
  no premature POST, and unchanged unrelated clients/events/prices/statuses.
- `python tests/test_belaformosa_workbook.py`: 4 tests passed using temporary copies.
- JavaScript syntax sweep: 130 files passed. `git diff --check` passed.

Browser tests require the existing Playwright/Chrome environment and a dedicated
loopback port in 53000..53999. They use authenticated in-memory fixtures and block
external browser traffic. Test hooks exist only in the isolated fixture server.
Results and browser artifacts are stored outside the repository worktree.

## Integrity and limits

Byte-for-byte diff against the base is empty for `data.json`, `data.xlsx`,
`app.js`, `config.js`, API, server, both Google source files, shared integrity
bundle, commercial workflow/opportunity modules, HTML, middleware and `plantas/`.
No customer exports, credentials, pending requests or local backups are committed.
Only synthetic customer data was used. There were no Google reads or writes,
no merge to `main`, and no deployment.

This fixes a frontend state-transition defect, not Google/OAuth latency or outages.
Existing ambiguous writes and genuine conflicts remain protected and may require
explicit recovery/reconciliation. No live Google result or production recovery
is claimed. Publication remains a separate, explicitly authorized operation.

## Integrated main after PR #23

The original results above describe `38f868c8`. This integration adds main
`544de8fd7f62e56a50846027bf255a0bcb435fdd` to the same PR #22 branch;
it does not merge PR #22 into main or authorize a deployment.

Six content conflicts were resolved individually:

- `tests/commercial-browser-regression.cjs`: retain both new browser suites and
  the complete earlier catalog, now 28 suites.
- `tests/commercial-client-complete-regression.cjs`: execute both exact source guards.
- `tests/comparator-belaformosa.test.js`: keep analytical assertions and both guards.
- `tests/pr20-main-integration.test.js`: preserve the isolated loading hook,
  both guards, both deployment exclusions and all existing security assertions.
- `tests/pr21-main-integration.test.js`: exact union of both catalogs/configurations.
- `vercel.json`: keep both branch exclusions and every other main setting.

`commercial.js` merged automatically. No manual runtime edits were needed.
Its final source is exactly the approved PR22 source with only the two approved
PR23 PDF functions substituted. The new `pr22-main-integration.test.js` asserts
that complete equality, not merely the presence of labels or function names.

The read-path SHA-256 and both PDF function SHA-256 expectations are unchanged.
The loading guard now compares every other byte against approved main `544de8fd`;
the PDF guard compares every other byte against approved PR22 `38f868c8`.
Thus neither feature is exempted from verification by the other. Historical
commercial/backend/data assertions remain intact.

Fresh integrated validation:

- Node: **61/61 suites passed**, including the new exact-union integration test,
  concurrency, CAS, read tickets, B5/B6, backups, quota, request recovery and rollback.
- Loading: **18/18 directed cases passed**.
- PDF generator: **16/16 combinations passed**, with priced output otherwise
  identical to the original generator except the approved title/inactive CSS.
- Browser: complete **28/28 suites passed**, with zero failures. Both original
  catalogs and the PDF/loading interaction checks ran on the integrated source.
- Integrated PDF browser suite passed all eight price/language/unit combinations.
  It now performs a manual remote read with the PDF options open, then checks that
  checkbox, language and individual price drafts survive unchanged. Commercial
  cache, source revision and source data remain identical, with zero writes.
- **Eight real PDFs / 12 pages passed** the PDF reader/render checks: correct
  titles, A4 portrait, one page per unit, embedded plans and optional prices.
  SHA-256 comparison of all 12 rendered page PNGs with the approved PR23 run:
  **12/12 identical**. No blank price column or pagination regression.
- Syntax: **134/134 JavaScript files passed**.
- Excel/JSON: **4/4 tests passed** using temporary copies only.
- No conflict markers remain; staged whitespace checks passed.

Test commands remain the complete Node/browser runners documented above, plus
`node tests/pr22-main-integration.test.js`,
`node tests/commercial-presentation-pdf.test.js` and
`python tests/validate_presentation_pdfs.py <isolated browser artifact folder>`.
Artifacts are outside the repository, in `pr22-integrated-node` and
`pr22-integrated-browser`; they contain only fictional fixtures.

An exact diff against integrated main is empty for data/Excel, config, API,
server, both Apps Script files, commercial integrity and workflow/opportunity
modules, HTML, CSS, middleware, comparator and plans. No production data was
read or written; no migrations, production merge or deployment were performed.

Residual limits are unchanged: no live Google test is claimed, native print
filename extension is controlled by the browser, and uncertain requests/genuine
conflicts remain protected for explicit recovery rather than forced replay.
