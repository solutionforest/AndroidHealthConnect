# Changelog

All notable changes to `@solutionforest/android-health-connect` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- DX helpers: `ensurePermissions`, `timeRangeToday` / `timeRangeLastDays` /
  `timeRangeLastHours`, `waitForRecords` (poll — HC has no push), `readAllRecords`
  (pageToken drain), `pullChanges` (changelog `hasMore` loop).
- `pollUntil` / `waitUntil` for resume UX (first aggregate often `0` until vendor
  sync finishes); soft timeout keeps last value for the UI.
- `useForegroundPoll` hook and `pollOnForeground` (non-React): poll on mount and
  every `AppState` resume, abort on background, drop stale results; hook exposes
  `{ value, satisfied, loading, error, refresh }` and `enabled` to wait for
  permissions.

### Changed

- Docs/demo completeness: README Usage for `ensureAvailable` / `hasPermissions` /
  aggregates / `getChanges({ pageSize })`; history uses `Permission.*`; example
  adds PlannedExercise recipes + manifest perms; example README is a first-run
  tutorial pointing at the main Usage guide.

## [0.3.11] - 2026-11-21

### Added

- `Permission` constants for typed Health Connect permission strings
  (autocomplete instead of hand-typed literals).
- Quick helpers: `hasPermissions`, `missingPermissions`, `ensureAvailable`
  (optional open store when `notInstalled`).
- `PlannedExerciseSession` CRUD (feature-gated): blocks / steps, completion
  goals, performance targets; `Permission.READ/WRITE_PLANNED_EXERCISE`;
  `readPlannedExerciseSessions`; `ExercisePhase` constants.

### Changed

- CONTRIBUTING: document optional npmjs mirror + require `yarn test:android`.
- Example app: `Permission` constants + “Seed Demo Data (fake)” for QA
  (steps / heart rate / walk — not part of the published API).

### Fixed

- Release workflow fails when git tag `v*` does not match `package.json` version.

## [0.3.10] - 2026-11-21

### Added

- Example app: Health Connect permissions + rationale intent-filters / string;
  recipes for `updateRecords` and background permission.
- README `updateRecords` usage snippet (`metadata.id` required).
- Kotlin tests: segments/laps, zone offsets, `requireMetadataIdForUpdate`,
  `FeatureSupport` name map.

### Fixed

- CI: cache Robolectric `android-all` jars (`~/.cache/robolectric`) and pin Maven
  Central for the test fetcher (avoids flaky `MavenArtifactFetcher` HTTP failures).

## [0.3.9] - 2026-11-20

### Added

- Typed special permissions: `READ_HEALTH_DATA_HISTORY`, `READ_HEALTH_DATA_IN_BACKGROUND`
  (with README / SECURITY guidance and feature-status gating).
- `updateRecords()` for edit/sync; metadata round-trip preserves `id` / recording method /
  optional `device` on write/update.
- `getChanges(token, { pageSize })` soft page-size hint (1–5000).
- Exercise session 1.2 fields (feature-gated): `plannedExerciseSessionId`,
  `rateOfPerceivedExertion` when `exerciseSessionImprovements` is available.
- `ExerciseSegmentType` constants aligned with connect-client 1.2.

### Changed

- `jsonToMetadata` no longer always uses bare `manualEntry()` (supports `*WithId` for updates).
- Expo plugin docs: omitting `permissions` declares none (intent-filters only).
- Example app recipes: aggregates, `getChanges`, history permission, exercise route.

### Fixed

- `ExerciseType` values now match `ExerciseSessionRecord.EXERCISE_TYPE_*` (connect-client 1.2);
  segment-only ids moved to `ExerciseSegmentType`. `WHEEL_CHAIR` kept as alias of `WHEELCHAIR`.

## [0.3.8] - 2026-11-20

### Added

- Aggregate APIs: `aggregateRecord`, `aggregateGroupByDuration` (Instant buckets — avoids
  Android 14+ UTC shift), `aggregateGroupByPeriod` (LocalDateTime calendar buckets).
- Exercise routes on `ExerciseSession`: write `{ route: Location[] }` with optional altitude /
  accuracy (meters); read `{ type: DATA \| NO_DATA \| CONSENT_REQUIRED, route }` with
  `LengthResult` fields; `requestExerciseRoute(recordId)` for one-time consent.
- Permissions: `READ_EXERCISE_ROUTES` / `WRITE_EXERCISE_ROUTE`.
- Changelog APIs: `getChangesToken` / `getChanges` (upsertion + deletion pages,
  `hasMore`, `changesTokenExpired`; tokens valid ~30 days).
- CI `test-android` job + `yarn test:android` for Kotlin / Robolectric unit tests.
- Release workflow: SPDX SBOM on the GitHub Release + Sigstore build/SBOM
  attestations for the packed `.tgz` (GitHub artifact attestations).
- Optional npmjs.org mirror on Release when repo secret `NPM_TOKEN` is set
  (`npm publish --provenance`); GitHub Packages remains the primary registry.

### Changed

- Package metadata aligned with RN library standards: richer `keywords` / description,
  `sideEffects: false`, explicit `exports` for Expo `app.plugin.js` + `react-native`/`import`,
  ship `LICENSE` / `CHANGELOG` / `SECURITY` / logo in the tarball.
- Added PR + feature-request templates; CONTRIBUTING quality-gate checklist;
  SECURITY.md security-model section (HC permissions vs host-app duties).

## [0.3.7] - 2026-11-20

### Added

- `getHealthConnectAvailability()` — detailed status (`sdkStatus`, `provider` framework/apk,
  GMS / Play Store flags, advice) for Android 14+ built-in vs APK install and China / HMS cases.
- Safer `openHealthConnectApp()` using official `market://` Play Store intent with HTTPS
  fallback; Settings fallback when Play Store is missing on Android 14+.

### Fixed

- Clearer `HEALTH_CONNECT_UNAVAILABLE` reject messages (install vs no GMS / China vs unsupported).
- Document that raw `sdkStatus === 3` is `SDK_AVAILABLE` (common misread as “version too old”).

## [0.3.6] - 2026-11-20

### Changed

- Raised static analysis to PHPStan level-10 equivalent for TypeScript:
  max-strict `tsconfig`, type-aware ESLint (`no-explicit-any`, `no-unsafe-*`,
  floating promises, exhaustiveness), and Jest coverage gates
  (statements/lines/functions ≥95%, branches ≥75%).
- Kotlin `allWarningsAsErrors`; safer unit-test assertions (no `!!`).
- CI fails when coverage thresholds drop.

### Fixed

- `checkLibraryUpdate` treats an explicit non-function `fetchImpl` as
  missing fetch (no longer swallowed by `??`).

### Added

- Broader API unit tests (permissions revoke, data-management navigation,
  PHR helpers, default options branches).

## [0.3.5] - 2026-11-20

### Fixed

- Skip applying `kotlin-android` when AGP 9+ already registered the `kotlin` extension (built-in Kotlin). Unconditional apply failed consumer builds with `Cannot add extension with name 'kotlin'`. See [Migrate to built-in Kotlin](https://developer.android.com/build/migrate-to-built-in-kotlin). AGP 8 / `android.builtInKotlin=false` hosts still get the legacy plugin.

### Added

- Contract tests for the AGP 9 Kotlin plugin guard (`src/__tests__/androidAgpKotlinPlugin.test.ts`).

### Changed

- Weekly version-check Action prefers Maven `<latest>` (includes alphas), adds Actions job summary, and documents daily / weekly / bi-weekly cron options.

## [0.3.4] - 2026-11-18

### Added

- Alpha Health Connect API wrappers: mindfulness, skin temperature, activity intensity, matchmaking, and Personal Health Record (PHR) helpers.

## [0.3.3] - 2026-11-18

### Changed

- Packaging / CI alignment for the 0.3.x (AGP 9 / compileSdk 37) line.

## [0.2.4] - 2026-11-18

### Changed

- Stable 0.2.x line (HC `1.1.0`, AGP 8.9 / sdk 36): GitHub Packages + hosted CI parity and security dependency fixes.

[0.3.11]: https://github.com/solutionforest/AndroidHealthConnect/releases/tag/v0.3.11
[0.3.10]: https://github.com/solutionforest/AndroidHealthConnect/releases/tag/v0.3.10
[0.3.9]: https://github.com/solutionforest/AndroidHealthConnect/releases/tag/v0.3.9
[0.3.8]: https://github.com/solutionforest/AndroidHealthConnect/releases/tag/v0.3.8
[0.3.7]: https://github.com/solutionforest/AndroidHealthConnect/releases/tag/v0.3.7
[0.3.6]: https://github.com/solutionforest/AndroidHealthConnect/releases/tag/v0.3.6
[0.3.5]: https://github.com/solutionforest/AndroidHealthConnect/releases/tag/v0.3.5
[0.3.4]: https://github.com/solutionforest/AndroidHealthConnect/releases/tag/v0.3.4
[0.3.3]: https://github.com/solutionforest/AndroidHealthConnect/releases/tag/v0.3.3
[0.2.4]: https://github.com/solutionforest/AndroidHealthConnect/releases/tag/v0.2.4
