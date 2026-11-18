# android-health-connect

[![CI](https://github.com/solutionforest/AndroidHealthConnect/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/solutionforest/AndroidHealthConnect/actions/workflows/ci.yml)
[![GitHub release](https://img.shields.io/github/v/release/solutionforest/AndroidHealthConnect)](https://github.com/solutionforest/AndroidHealthConnect/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Platform](https://img.shields.io/badge/platform-Android-3DDC84.svg)](https://developer.android.com/health-and-fitness/health-connect)
[![React Native](https://img.shields.io/badge/React%20Native-0.84%2B-61DAFB.svg)](https://reactnative.dev/)

A React Native library for integrating with [Android Health Connect](https://developer.android.com/health-and-fitness/health-connect) — the unified health & fitness data platform on Android 10+ (API 29+).

> **Android only.** This library has no iOS implementation.

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
| Library upgrade reminder | ✅ Supported | `checkLibraryUpdate()` + weekly CI issue |
| CI | ✅ GitHub-hosted | `ubuntu-latest` — lint, typecheck, Jest, library + Android build, audit |
| Distribution | ✅ GitHub Packages + Releases | `@solutionforest/android-health-connect` on `npm.pkg.github.com` — **not** npmjs.org |
| CodeQL | ✅ Supported | On `main` PRs/pushes + weekly schedule |

## Requirements

Two release lines — pick by your AGP / Health Connect SDK:

| Package | `connect-client` | Min AGP | Min `compileSdk` | Branch / tag |
|---|---|---|---|---|
| **[`0.3.3`](https://github.com/solutionforest/AndroidHealthConnect/releases/tag/v0.3.3)** (default / `main`) | **`1.2.0-alpha06`** | **9.1.0** | **37** | `main` |
| **[`0.2.3`](https://github.com/solutionforest/AndroidHealthConnect/releases/tag/v0.2.3)** (maintenance) | **`1.1.0`** (stable) | **8.9.1** | **36** | [`release/0.2.x`](https://github.com/solutionforest/AndroidHealthConnect/tree/release/0.2.x) |

```sh
# GitHub Packages (see Installation for .npmrc)
yarn add @solutionforest/android-health-connect@0.3.3   # AGP 9.1+ / compileSdk 37
```

### What `0.3.3` (this branch) needs in your host app

| Requirement | Value for `0.3.3` |
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

JS API still covers the [19 record types](#supported-record-types) below. Alpha-only APIs (matchmaking, mindfulness, skin temperature, activity intensity, PHR) are **not** wrapped yet.

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
yarn add @solutionforest/android-health-connect@0.3.3
# or
npm install @solutionforest/android-health-connect@0.3.3
```

Alternatives: install from git (`solutionforest/AndroidHealthConnect#v0.3.3`) or download the Release `.tgz`.

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
import { isHealthConnectAvailable, openHealthConnectApp } from '@solutionforest/android-health-connect';

const availability = await isHealthConnectAvailable();
// 'available' | 'notInstalled' | 'notSupported'

if (availability === 'notInstalled') {
  openHealthConnectApp(); // Opens Play Store listing
}
```

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

| Record type | Read | Write |
|---|---|---|
| `Steps` | ✅ | ✅ |
| `HeartRate` | ✅ | ✅ |
| `SleepSession` | ✅ | ✅ |
| `ActiveCaloriesBurned` | ✅ | ✅ |
| `TotalCaloriesBurned` | ✅ | ✅ |
| `Distance` | ✅ | ✅ |
| `Weight` | ✅ | ✅ |
| `Height` | ✅ | ✅ |
| `BloodPressure` | ✅ | ✅ |
| `BloodGlucose` | ✅ | ✅ |
| `OxygenSaturation` | ✅ | ✅ |
| `BodyTemperature` | ✅ | ✅ |
| `BodyFat` | ✅ | ✅ |
| `Hydration` | ✅ | ✅ |
| `ExerciseSession` | ✅ | ✅ |
| `RestingHeartRate` | ✅ | ✅ |
| `RespiratoryRate` | ✅ | ✅ |
| `FloorsClimbed` | ✅ | ✅ |
| `ElevationGained` | ✅ | ✅ |

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

Maintainers: CI, CodeQL, Release, and the weekly version-check Action run on **GitHub-hosted** `ubuntu-latest` runners. Version-check opens/updates an `upgrade-reminder` issue when `package.json` or the Health Connect SDK falls behind. Tag `v*` to upload a Release `.tgz` and publish `@solutionforest/android-health-connect` to GitHub Packages (not npmjs.org).

## API reference

### Availability

| Function | Returns | Description |
|---|---|---|
| `isHealthConnectAvailable()` | `Promise<HealthConnectAvailability>` | Check if HC is usable |
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
| *(and one per record type)* | | |

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
