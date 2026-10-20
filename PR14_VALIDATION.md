# PR #14 validation

Branch: `codex/fix-commercial-write-recovery`.
Audited recovery baseline: `3729e304317541b5bd23bb4fa45aadde9d959934`.
Comparison main: `fa876dc98f8ccc208ed68123ddce3c71e948ad51`.

## Findings and changes

- Updated the eight historical browser journeys to use the client modal,
  current creation buttons, expandable settings/cards and visible sync controls.
  Required client selection, cancellation, persistence, conflict and no-write
  assertions remain. Negotiation outcomes use deterministic movement types;
  a separate follow-up movement explicitly records lack of interest.
- Made PDF tests independent: their own synthetic presentation fixture includes
  the informed price and selected unit, without relying on a previous test.
- Ordering assertions now use projected commercial stages and the selected
  portfolio sort mode. The fixture explicitly identifies manual stage choices.
- Two real application defects were reproduced on main and fixed here:
  opportunity follow-up text incorrectly shared the icon-oriented grid row;
  agent rendering dereferenced `contactInfo` when the workflow module was absent.
  The fixes are two scoped CSS rules and a fail-closed rendering guard.
- Added focused layout and missing-module regressions. Module-failure tests
  exercise every available event entry, retain the explicit error/no-legacy
  fallback checks, and require zero commercial writes and JavaScript errors.
- Added a runner that creates a fresh authenticated in-memory fixture server
  per browser suite, checks port availability and terminates its own server.
  Ports are restricted to loopback 53000..53999; port 5210 is never used.
  Artifacts default to the system temporary directory, outside the repository.
- Replaced the obsolete aggregator freeze at `5582825`, which already failed
  against main. The audited synchronization block/API/Apps Script remain frozen;
  commercial modules remain equal to main. Only the exact two-rule CSS fix is
  permitted by the stylesheet comparison. No security suite was removed.

## Results

- 39/39 Node suites passed, including the revised aggregator.
- 95 JavaScript/TypeScript syntax checks passed; Apps Script parsed successfully.
- 21/21 browser suites passed in the final complete run, including all nine
  previously blocked suites. The runner exited successfully and stopped its
  fixture servers. Desktop/mobile follow-up geometry passed at 1440/390/320px.
- Recovery: 105 simulated interruption points; 47 integrity/compatibility cases,
  including 14 incompatible diagnostic variants; 39 Apartment 16 recovery cases.
- Actual simulated API concurrency: first writer 200, stale writer 409,
  reconciliation race 409, first data intact and second local changes preserved.
- Chunk storage: synthetic JSON above 160,000 characters, verified backups,
  partial failures, checksum rejection and CAS restoration passed.
- Original main: 34/34 original Node suites passed. With corrected browser
  journeys, 18/20 passed; the other two reproduced the pre-existing layout and
  missing-module defects. Both new focused regressions also fail on main as
  expected. This validation did not change main or its production data.

## Reproduction

Use Node 24 and installed Playwright/Chrome plus pdf-lib. Optional local paths
can be provided through `PLAYWRIGHT_MODULE`, `CHROME_EXECUTABLE` and
`PDF_LIB_MODULE`. No production environment file is loaded by the fixtures.

```sh
node tests/commercial-client-complete-regression.cjs
node tests/commercial-browser-regression.cjs
node --check commercial.js
node --check app.js
node --check config.js
git diff --check
```

`COMMERCIAL_TEST_PORT` selects a dedicated test port (default 53214).
`BROWSER_REGRESSION_OUTPUT` selects the external artifact directory. A list of
browser suite filenames can be supplied to repeat only targeted journeys.

## Apps Script v3 and publication

The frontend/API/Apps Script source combination was exercised locally using
the actual Apps Script in a simulated Google environment. The required contract
is `tv-cas-v1`, `pendingWriteDiagnostics:1`, explicit pending-intent diagnostics,
authenticated read tickets, CAS revisions and exact request/content identity.
Incompatible combinations refuse mutation rather than bypassing safeguards.

The administrative label "v3" alone does not prove the deployed source matches
this contract. The live executable, credentials and Google Sheet were not
accessed. Coordinated publication must use the reviewed matching source and the
existing maintenance/write-gate procedure in `COMMERCIAL_WRITE_RECOVERY.md`.

No production read/write/recovery, Apps Script publication, Vercel configuration
change, merge, deployment, data migration or real-customer fixture was performed.
API, server modules, Apps Script, authentication, pricing and commercial state
logic are unchanged by this validation correction.

Conclusion: APPROVED for the reviewed coordinated source publication procedure.
This is a local technical approval, not confirmation of the live Google version
or authorization to merge, publish, enable writes or recover real data.
