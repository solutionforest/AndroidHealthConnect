# Changelog

All notable changes to `@solutionforest/android-health-connect` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.3.5]: https://github.com/solutionforest/AndroidHealthConnect/releases/tag/v0.3.5
[0.3.4]: https://github.com/solutionforest/AndroidHealthConnect/releases/tag/v0.3.4
[0.3.3]: https://github.com/solutionforest/AndroidHealthConnect/releases/tag/v0.3.3
[0.2.4]: https://github.com/solutionforest/AndroidHealthConnect/releases/tag/v0.2.4
