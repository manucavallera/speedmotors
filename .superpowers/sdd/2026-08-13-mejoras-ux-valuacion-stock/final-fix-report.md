# Final fix report — valuation UX final review

## Status and commits

- Base reviewed commit: `62224536769f868e82178f5d02e7ef7964db9e64`.
- Final-fix implementation and regression tests: `a26b437` (`fix(stock): guard valuation preview lifecycle`).
- This report is committed separately after the implementation commit so it can record the immutable implementation hash.

## Findings mapped to code and tests

### 1. Late preview responses and mismatched close payloads (Critical)

- `apps/frontend/src/lib/stockValuationLifecycle.ts` now assigns every preview a monotonically increasing request id, a draft revision, an exact serialized request signature, and a cloned payload snapshot.
- `apps/frontend/src/hooks/useStockValuation.ts` invalidates the revision synchronously for edits, resets, refreshes, and period changes. A response is installed only when it is the latest request and its revision, payload signature, period, and fingerprint still match.
- Closing now accepts only an `AcceptedValuationPreview` and submits the snapshot owned by that preview. It never rebuilds a close body from the mutable current draft.
- `apps/frontend/src/lib/stockValuationLifecycle.spec.ts` covers late results after edit/reset/period invalidation, A/B request ordering, exact current payload matching, source-payload mutation after preview, and close from the accepted snapshot.

### 2. Preview allowed without usable current data (Important)

- `valuationPreviewBlockReason()` requires successfully loaded current data for the selected period, a synchronized draft source/fingerprint, at least one draft group, and no current-stock fetch in progress.
- `useStockValuation.requestPreview()` repeats that guard at handler time; `StockValuationPage` also checks it before invoking the hook.
- `ValuationActionBar` disables the action and exposes the blocking explanation in the button title.
- Pure tests cover initial load, fatal error, wrong period, stale draft source, zero groups, fetching, and the valid synchronized case.

### 3. Background and explicit refresh overwrites (Important)

- Current-stock focus and reconnect refetches are disabled. Mount refetch remains available for returning from vehicle editing, but source adoption is guarded.
- Dirty detection now compares the draft with its stable adopted baseline, not mutable query data.
- `shouldAdoptValuationSource()` rejects a non-active period, refuses changed background data while the draft is dirty or explicit refresh is active, and still supports initial load, clean refreshes, and period changes.
- Explicit refresh captures revision and period after the user approves discarding prior edits. An edit, reset, or period change while the request is in flight invalidates that token. The response then preserves local state and the UI asks the user to refresh/reconfirm again.
- Pure tests cover dirty/background adoption, initial and new-period adoption, foreign-period rejection, and revision/period refresh-token invalidation.

### 4. Failed re-preview retaining an earlier preview (Important)

- Starting a preview clears the accepted preview immediately.
- Failure of the active request leaves readiness cleared for all errors, including `STALE_STOCK`; stale stock also invalidates the exact current-stock query.
- A late failure from request A cannot clear an accepted request B.
- Lifecycle tests cover start clearing, active failure, `STALE_STOCK`, and late A versus accepted B.

### 5. Expanded unit identity (Minor)

- `ValuationEditor` now renders brand, model, and version (with `Sin versión` fallback) in every expanded unit card, in addition to internal code, status, chassis, and engine.
- `stockValuation.spec.ts` covers versioned and missing-version labels; the production component consumes the tested helper.

### 6. Closed date and time (Minor)

- `ValuationActionBar` now uses `valuationClosedLabel()`, formatted in `es-AR` with both short date and short time.
- The helper has an exact formatting regression test.

### 7. Exact backend identifying-data contract (Minor)

- `stock-valuations.service.spec.ts` now uses `toStrictEqual` with literal eight-key unit objects: `id`, `internalCode`, `brand`, `model`, `version`, `status`, `chassisNumber`, and `engineNumber`.
- Extra fields, including extra keys whose value is `undefined`, now fail the contract test. Ineligible boats and sold motorcycles remain excluded.

### 8. Regression coverage (Minor)

- Added `stockValuationLifecycle.spec.ts` with focused pure coordinator coverage for lifecycle races and guards.
- Added focused formatter tests to `stockValuation.spec.ts` and tightened the backend service contract test.
- The frontend Jest harness is Node-only and has no DOM/component test environment. These are pure coordinator/helper tests, not claimed as DOM interaction coverage. Production TypeScript wiring is additionally checked by the frontend build and scoped lint.

## TDD evidence

1. RED:

   `rtk npm test --workspace=apps/frontend -- stockValuationLifecycle.spec.ts stockValuation.spec.ts --runInBand`

   Failed as expected because `stockValuationLifecycle` and the unit/closed-label helpers did not exist (`TS2307`, `TS2305`).

2. Additional RED hardening:

   The same focused command failed after adding active-period refresh/source guards and the missing-version expectation (`TS2353`, `TS2554`, and expected `Guerrero Trip Sin versión` but received `Guerrero Trip`).

3. GREEN:

   `rtk npm test --workspace=apps/frontend -- stockValuationLifecycle.spec.ts stockValuation.spec.ts --runInBand`

   Result: 2 suites passed, 31 tests passed, 0 failed.

4. Backend focused contract:

   `rtk npm test --workspace=apps/backend -- stock-valuations/stock-valuations.service.spec.ts --runInBand`

   Result: 1 suite passed, 8 tests passed, 0 failed.

## Final verification

- `rtk npm test --workspace=apps/frontend -- --runInBand`
  - 4 suites passed; 52 tests passed; 0 failed.
- `rtk npm test --workspace=apps/backend -- --runInBand`
  - 5 suites passed; 40 tests passed; 0 failed.
- `rtk npm run build --workspace=apps/frontend`
  - TypeScript and Vite production build passed; 2,459 modules transformed; PWA artifacts generated. Vite emitted only its existing plugin-timing warning.
- `rtk npm run build --workspace=apps/backend`
  - Nest production build passed.
- `rtk npx eslint src/hooks/useStockValuation.ts src/lib/stockValuationLifecycle.ts src/lib/stockValuationLifecycle.spec.ts src/lib/stockValuation.ts src/lib/stockValuation.spec.ts src/pages/StockValuationPage.tsx src/components/stock-valuation/ValuationActionBar.tsx src/components/stock-valuation/ValuationEditor.tsx --quiet`
  - Passed with zero scoped errors.
- `rtk git diff --check` and `rtk git diff --cached --check`
  - Passed with no whitespace errors.
- Migration and delete-action audit:
  - No files under backend migration directories changed.
  - No delete action was added to valuation components/page.
  - Admin authorization and backend grouping/filtering logic were not changed.

Repository-wide frontend lint was also attempted. It is not currently a clean project gate: it reported 409 errors across many pre-existing unrelated files. The touched frontend files pass when linted as a scoped set.

## Self-review

- Verified every final-review finding against the changed code and a corresponding regression assertion or build-checked UI connection.
- Confirmed an accepted preview is the only object that can create a close payload, and its request data is cloned before the network call.
- Confirmed edit/reset/period/refresh invalidation occurs before late mutation callbacks can install results.
- Confirmed stale current data blocks both the visible action and the handler.
- Confirmed background query data cannot replace a dirty draft and explicit refresh cannot replace edits made after its token was captured.
- Confirmed no auth, grouping, persistence, migration, or valuation-delete behavior changed.
- Confirmed only scoped files were staged; the pre-existing untracked `node_modules` entry was not touched or committed.

## Concerns / limits

- No authenticated browser/DOM smoke test was run in this wave because the frontend test setup is Node-only and no running authenticated environment was supplied. Lifecycle coverage is pure and deterministic; it must not be described as DOM coverage.
- The repository-wide lint baseline remains red in unrelated code, although all touched frontend files lint cleanly.
- The build continues to emit Vite's non-fatal plugin-timing warning.
