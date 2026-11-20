<p align="center">
  <img src="docs/assets/logo.jpg" alt="android-health-connect" width="160" height="160" />
</p>

<h1 align="center">android-health-connect</h1>

<p align="center">
  <a href="https://github.com/solutionforest/AndroidHealthConnect/actions/workflows/ci.yml"><img src="https://github.com/solutionforest/AndroidHealthConnect/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" /></a>
  <a href="https://github.com/solutionforest/AndroidHealthConnect/releases"><img src="https://img.shields.io/github/v/release/solutionforest/AndroidHealthConnect" alt="GitHub release" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  <a href="https://developer.android.com/health-and-fitness/health-connect"><img src="https://img.shields.io/badge/platform-Android-3DDC84.svg" alt="Platform" /></a>
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React%20Native-0.84%2B-61DAFB.svg" alt="React Native" /></a>
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6.svg" alt="TypeScript strict" />
  <img src="https://img.shields.io/badge/coverage-100%25%20lines-brightgreen.svg" alt="Coverage 100% lines" />
  <img src="https://img.shields.io/badge/quality-max--strict-0F172A.svg" alt="Quality max-strict" />
</p>

A React Native library for integrating with [Android Health Connect](https://developer.android.com/health-and-fitness/health-connect) — the unified health & fitness data platform on Android 10+ (API 29+).

> **Android only.** This library has no iOS implementation.

Quality bar (since **0.3.7**): max-strict TypeScript, type-aware ESLint (no `any` / no-unsafe-*), Jest coverage gates, Kotlin `allWarningsAsErrors`, and CI that fails when quality drops.

## Support

| Area | Status | Notes |
|---|---|---|
| Android | ✅ Supported | API 29+ / Android 10+ |
| iOS | ❌ Not supported | No native iOS implementation |
| React Native New Architecture | ✅ Required | TurboModules / RN 0.84+ |
| Expo | ✅ Supported | SDK 50+ via config plugin |
| Bare React Native | ✅ Supported | Manual manifest + rationale setup |
| Health Connect permissions | ✅ Supported | Request / check / revoke |
| Read / write / delete records | ✅ Supported | See [Supported record types](#supported-record-types) |
| Library upgrade reminder | ✅ Supported | `checkLibraryUpdate()` + weekly CI (HC SDK / release drift → issue) |
| CI / quality gates | ✅ GitHub-hosted | lint, typecheck, coverage thresholds, library + Android build, audit |
| Distribution | ✅ GitHub Packages + Releases | `@solutionforest/android-health-connect` on `npm.pkg.github.com` — **not** npmjs.org |
| CodeQL | ✅ Supported | On `main` PRs/pushes + weekly schedule |

## Requirements

Two release lines — pick by your AGP / Health Connect SDK:

| Package | `connect-client` | Min AGP | Min `compileSdk` | Branch / tag |
|---|---|---|---|---|
| **[`0.3.7`](https://github.com/solutionforest/AndroidHealthConnect/releases/tag/v0.3.7)** (default / `main`) | **`1.2.0-alpha06`** | **9.1.0** | **37** | `main` |
| **[`0.2.4`](https://github.com/solutionforest/AndroidHealthConnect/releases/tag/v0.2.4)** (maintenance) | **`1.1.0`** (stable) | **8.9.1** | **36** | [`release/0.2.x`](https://github.com/solutionforest/AndroidHealthConnect/tree/release/0.2.x) |

```sh
# GitHub Packages (see Installation for .npmrc)
yarn add @solutionforest/android-health-connect@0.3.7   # AGP 9.1+ / compileSdk 37
yarn add @solutionforest/android-health-connect@0.2.4   # AGP 8.9.1+ / compileSdk 36 (dist-tag release-0.2)
```

### What `0.3.7` (this branch) needs in your host app

| Requirement | Value for `0.3.7` |
|---|---|
| Install | `@solutionforest/android-health-connect` via GitHub Packages |
| Health Connect Jetpack SDK | [`connect-client:1.2.0-alpha06`](https://developer.android.com/jetpack/androidx/releases/health-connect) |
| Android Gradle Plugin | **9.1.1** (min **9.1.0**) |
| Gradle | **9.3.1+** (required by AGP 9.1) |
| compileSdk | **37** |
| Android OS | 10 (API 29)+ |
| Health Connect app | Required on Android 9–13; built-in on Android 14+ |
| React Native | 0.84+ (New Architecture / TurboModules) |
| Node.js | 22.11+ |

### Health Connect SDK changelog (context)

Official notes ([full changelog](https://developer.android.com/jetpack/androidx/releases/health-connect)):

| SDK version | Date | What changed |
|---|---|---|
| **1.2.0-alpha06** | 2026-08-26 | Updated Health Connect **release and dev signing certificates** |
| **1.2.0-alpha05** | 2026-08-12 | Jetpack SDK `minSdk` → API 24; secured intents on Android &lt; 14; signature validation fix |
| **1.2.0-alpha04** | 2026-04-22 | **Matchmaking APIs** |
| **1.2.0-alpha03** | 2026-03-25 | Richer exercise fields; change-log `pageSize`; activity intensity |
| **1.2.0-alpha02** | 2025-10-08 | Additional device type enums |
| **1.2.0-alpha01** | 2025-07-30 | Skin temperature / mindfulness compat; activity intensity (Android 14+) |
| **1.1.0** (stable) | 2025-10-08 | First stable `connect-client` |

JS API covers the [22 record types](#supported-record-types) below, plus feature checks, Matchmaking, and Personal Health Record (PHR) helpers. Feature-gated types require `getFeatureStatus(...) === 'available'` on the device.

## Installation

Published to **[GitHub Packages](https://github.com/orgs/solutionforest/packages?repo_name=AndroidHealthConnect)** (`npm.pkg.github.com`) and mirrored as a `.tgz` on **[GitHub Releases](https://github.com/solutionforest/AndroidHealthConnect/releases)**. Not published to npmjs.org.

### 1. Point `@solutionforest` at GitHub Packages

Add to your project `.npmrc` (or user `~/.npmrc`):

```ini
@solutionforest:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

Use a classic PAT with `read:packages` (and SSO authorized for the `solutionforest` org if required).

### 2. Install the package

```sh
# Default (0.3.x): connect-client 1.2.0-alpha06 — needs AGP 9.1+ / compileSdk 37
yarn add @solutionforest/android-health-connect@0.3.7
# or
npm install @solutionforest/android-health-connect@0.3.7

# Maintenance (0.2.x): connect-client 1.1.0 stable — AGP 8.9.1+ / compileSdk 36
yarn add @solutionforest/android-health-connect@release-0.2
```

Alternatives: install from git (`solutionforest/AndroidHealthConnect#v0.3.7`) or download the Release `.tgz`.

Pushing a `v*` tag runs the **Release** workflow: packs `.tgz`, uploads to the GitHub Release, and `npm publish`es to GitHub Packages.

### Expo setup

If you are using **Expo** (SDK 50+), add the library's config plugin to your `app.json` or `app.config.js`. The plugin automatically handles adding the required Health Connect intent filters to your Android manifest.

```json
{
  "expo": {
    "plugins": [
      [
        "@solutionforest/android-health-connect",
        {
          "permissions": [
            "android.permission.health.READ_STEPS",
            "android.permission.health.WRITE_STEPS",
            "android.permission.health.READ_HEART_RATE"
          ]
        }
      ]
    ]
  }
}
```

If you omit the options object (or the `permissions` array), all permissions supported by the library are declared:

```json
{
  "expo": {
    "plugins": ["@solutionforest/android-health-connect"]
  }
}
```

After updating `app.json`, run `npx expo prebuild` to regenerate the native Android project.

### Android setup (bare React Native)

#### 1. Declare permissions in your app's `AndroidManifest.xml`

Health Connect requires every permission your app uses to be declared in the **host app's** manifest (the library manifest is merged automatically, but you must also add them to your app):

```xml
<manifest ...>
  <!-- Declare only the permissions your app actually needs -->
  <uses-permission android:name="android.permission.health.READ_STEPS" />
  <uses-permission android:name="android.permission.health.WRITE_STEPS" />
  <uses-permission android:name="android.permission.health.READ_HEART_RATE" />
  <!-- ... other permissions ... -->

  <application ...>
    <activity android:name=".MainActivity" ...>
      <!-- Required for Health Connect permission rationale (Android ≤ 13) -->
      <intent-filter>
        <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
      </intent-filter>

      <!-- Required for Health Connect permission UI (Android 14+) -->
      <intent-filter>
        <action android:name="android.intent.action.VIEW_PERMISSION_USAGE" />
        <category android:name="android.intent.category.HEALTH_PERMISSIONS" />
      </intent-filter>
    </activity>
  </application>
</manifest>
```

#### 2. Add Health Connect permission rationale (required)

Create `res/values/health_permissions.xml`:

```xml
<resources>
  <string name="health_permissions_rationale">
    This app uses Health Connect to read and write your health data.
  </string>
</resources>
```

## Usage

### Check availability

```ts
import {
  isHealthConnectAvailable,
  getHealthConnectAvailability,
  openHealthConnectApp,
} from '@solutionforest/android-health-connect';

const availability = await isHealthConnectAvailable();
// 'available' | 'notInstalled' | 'notSupported'

if (availability === 'notInstalled') {
  openHealthConnectApp(); // Play Store market:// (or Settings on Android 14+)
}

// Prefer details when diagnosing install vs built-in vs China / HMS:
const info = await getHealthConnectAvailability();
// info.provider: 'framework' (Android 14+) | 'apk' (9–13) | 'none'
// info.sdkStatus: 1 = UNAVAILABLE, 2 = PROVIDER_UPDATE_REQUIRED, 3 = AVAILABLE
// info.googlePlayServicesAvailable / playStoreAvailable / advice
```

### Device & region notes

| Situation | What happens | What to do |
|---|---|---|
| **Android 14+** | Health Connect is **built into** the system | Use Settings / `openHealthConnectSettings()` |
| **Android 9–13** | Health Connect is a **Play Store APK** | `openHealthConnectApp()` → Play Store install/update |
| **`sdkStatus === 3`** | **Available** (not “version too old”) | Safe to call APIs |
| **Mainland China / no GMS** | HC requires Google Play services; CN Play Storefront does not list HC | `status: 'notSupported'`; hide HC UI — cannot install via Play |
| **Huawei / HMS without GMS** | Same as no GMS | Unsupported for Health Connect |
| **Samsung / Xiaomi data gaps** | Vendor apps must **write into** HC; library only reads HC | Enable Health Connect sharing in the vendor app |

Official availability: [Check Health Connect availability](https://developer.android.com/health-and-fitness/health-connect/availability).

### Request permissions

```ts
import { requestPermissions } from '@solutionforest/android-health-connect';

const granted = await requestPermissions([
  'android.permission.health.READ_STEPS',
  'android.permission.health.WRITE_STEPS',
  'android.permission.health.READ_HEART_RATE',
]);

console.log('Granted:', granted);
```

### Read records

```ts
import { readSteps, readHeartRate } from '@solutionforest/android-health-connect';

const { records, pageToken } = await readSteps({
  timeRangeFilter: {
    startTime: '2024-01-01T00:00:00Z',
    endTime:   '2024-01-08T00:00:00Z',
  },
  ascendingOrder: true,
  pageSize: 100,
});

records.forEach(r => console.log(r.count, r.startTime));
```

Using the generic helper:

```ts
import { readRecords } from '@solutionforest/android-health-connect';
import type { WeightRecord } from '@solutionforest/android-health-connect';

const { records } = await readRecords<WeightRecord>('Weight', {
  timeRangeFilter: { startTime: '...', endTime: '...' },
});
```

### Write records

```ts
import { writeRecords } from '@solutionforest/android-health-connect';

const { recordIdsList } = await writeRecords([
  {
    recordType: 'Steps',
    count: 8000,
    startTime: '2024-01-01T08:00:00Z',
    endTime:   '2024-01-01T09:00:00Z',
  },
  {
    recordType: 'Weight',
    weight: 75.5, // kg
    time: '2024-01-01T07:30:00Z',
  },
]);
```

### Delete records

```ts
import { deleteRecordsByTime, deleteRecordsById } from '@solutionforest/android-health-connect';

// By time range
await deleteRecordsByTime('Steps', '2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z');

// By ID
await deleteRecordsById('Steps', ['record-id-1', 'record-id-2']);
```

## Supported record types

| Record type | Read | Write | Notes |
|---|---|---|---|
| `Steps` | ✅ | ✅ | |
| `HeartRate` | ✅ | ✅ | |
| `SleepSession` | ✅ | ✅ | |
| `ActiveCaloriesBurned` | ✅ | ✅ | |
| `TotalCaloriesBurned` | ✅ | ✅ | |
| `Distance` | ✅ | ✅ | |
| `Weight` | ✅ | ✅ | |
| `Height` | ✅ | ✅ | |
| `BloodPressure` | ✅ | ✅ | |
| `BloodGlucose` | ✅ | ✅ | |
| `OxygenSaturation` | ✅ | ✅ | |
| `BodyTemperature` | ✅ | ✅ | |
| `BodyFat` | ✅ | ✅ | |
| `Hydration` | ✅ | ✅ | |
| `ExerciseSession` | ✅ | ✅ | |
| `RestingHeartRate` | ✅ | ✅ | |
| `RespiratoryRate` | ✅ | ✅ | |
| `FloorsClimbed` | ✅ | ✅ | |
| `ElevationGained` | ✅ | ✅ | |
| `MindfulnessSession` | ✅ | ✅ | Requires `getFeatureStatus('mindfulnessSession')` |
| `SkinTemperature` | ✅ | ✅ | Requires `getFeatureStatus('skinTemperature')` |
| `ActivityIntensity` | ✅ | ✅ | Requires `getFeatureStatus('activityIntensity')` |

### Feature-gated APIs

```ts
import {
  getFeatureStatus,
  checkIfMatchmakingIsPossible,
  launchMatchmaking,
  createMedicalDataSource,
  upsertMedicalResources,
  readMedicalResources,
  MedicalResourceType,
} from '@solutionforest/android-health-connect';

// Feature availability (skin temperature, mindfulness, activity intensity, matchmaking, PHR, …)
const skinTemp = await getFeatureStatus('skinTemperature'); // 'available' | 'unavailable'

// Matchmaking (experimental) — discover apps/devices that can write data you can read
if ((await getFeatureStatus('matchmaking')) === 'available') {
  const { isMatchmakingPossible } = await checkIfMatchmakingIsPossible({
    recordTypes: ['Steps', 'HeartRate'],
  });
  if (isMatchmakingPossible) {
    await launchMatchmaking({ recordTypes: ['Steps', 'HeartRate'] });
  }
}

// Personal Health Record / medical (experimental) — FHIR MedicalDataSource + MedicalResource
if ((await getFeatureStatus('personalHealthRecord')) === 'available') {
  const source = await createMedicalDataSource({
    displayName: 'Clinic FHIR',
    fhirBaseUri: 'https://example.com/fhir/',
    fhirVersion: { major: 4, minor: 0, patch: 1 },
  });
  await upsertMedicalResources([
    {
      dataSourceId: source.id,
      fhirVersion: source.fhirVersion,
      data: JSON.stringify({ resourceType: 'AllergyIntolerance', id: '1', /* … */ }),
    },
  ]);
  const page = await readMedicalResources({
    medicalResourceType: MedicalResourceType.ALLERGIES_INTOLERANCES,
    medicalDataSourceIds: [source.id],
  });
}
```

## Upgrade reminders

Check GitHub Releases and show a reminder when a newer library version is available:

```ts
import { checkLibraryUpdate, LIBRARY_VERSION } from '@solutionforest/android-health-connect';

const update = await checkLibraryUpdate();
if (update.updateAvailable) {
  console.warn(update.advice);
  // e.g. show in-app banner: update.currentVersion → update.latestVersion
}
```

Maintainers: CI, CodeQL, Release, and the **weekly** version-check Action run on **GitHub-hosted** `ubuntu-latest` runners (Monday 08:00 UTC). That job compares `connect-client` to Google Maven and the library to the latest GitHub Release, then opens/updates an `upgrade-reminder` issue when something is behind (also runnable via **Actions → Version check → Run workflow**). To change cadence, edit the cron in `.github/workflows/version-check.yml` (`daily` / `weekly` / `bi-weekly` examples are in the file comments). Tag `v*` to upload a Release `.tgz` and publish `@solutionforest/android-health-connect` to GitHub Packages (not npmjs.org).

## API reference

### Availability

| Function | Returns | Description |
|---|---|---|
| `isHealthConnectAvailable()` | `Promise<HealthConnectAvailability>` | Check if HC is usable |
| `getHealthConnectAvailability()` | `Promise<HealthConnectAvailabilityInfo>` | Detailed status (framework/apk, GMS, Play Store, advice) |
| `openHealthConnectApp()` | `void` | Open HC app or Play Store |
| `openHealthConnectSettings()` | `void` | Open HC settings |
| `openHealthConnectDataManagement(pkg?)` | `void` | Open permission management |
| `checkLibraryUpdate(options?)` | `Promise<LibraryUpdateInfo>` | Upgrade reminder vs GitHub Releases |
| `LIBRARY_VERSION` | `string` | Current package version |

### Permissions

| Function | Returns | Description |
|---|---|---|
| `requestPermissions(perms)` | `Promise<string[]>` | Show permission dialog |
| `checkPermissions(perms)` | `Promise<string[]>` | Check which are granted |
| `revokeAllPermissions()` | `Promise<void>` | Revoke all permissions |

### Records

| Function | Returns | Description |
|---|---|---|
| `readRecords<T>(type, options)` | `Promise<ReadRecordsResponse<T>>` | Generic read |
| `writeRecords(records)` | `Promise<InsertRecordsResponse>` | Insert records |
| `deleteRecordsByTime(type, start, end)` | `Promise<void>` | Delete by time range |
| `deleteRecordsById(type, ids)` | `Promise<void>` | Delete by IDs |
| `readSteps(options?)` | `Promise<ReadRecordsResponse<StepsRecord>>` | Convenience helper |
| `readHeartRate(options?)` | … | Convenience helper |
| *(and one per record type, including Mindfulness / SkinTemperature / ActivityIntensity)* | | |

### Features / Matchmaking / PHR

| Function | Returns | Description |
|---|---|---|
| `getFeatureStatus(feature)` | `Promise<'available' \| 'unavailable'>` | Check HC feature flags |
| `checkIfMatchmakingIsPossible(opts?)` | `Promise<{ isMatchmakingPossible }>` | Whether Matchmaking UI has candidates |
| `launchMatchmaking(opts?)` | `Promise<boolean>` | Launch Matchmaking activity |
| `createMedicalDataSource(req)` | `Promise<MedicalDataSource>` | Create FHIR data source |
| `getMedicalDataSources(req?)` | `Promise<MedicalDataSource[]>` | List medical data sources |
| `deleteMedicalDataSourceWithData(id)` | `Promise<void>` | Delete source + its resources |
| `upsertMedicalResources(reqs)` | `Promise<MedicalResource[]>` | Insert/update FHIR resources |
| `readMedicalResources(req)` | `Promise<ReadMedicalResourcesResponse>` | Paged medical resource read |
| `deleteMedicalResources(req)` | `Promise<void>` | Delete by IDs or filters |

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
