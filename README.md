# android-health-connect

[![CI](https://github.com/solutionforest/AndroidHealthConnect/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/solutionforest/AndroidHealthConnect/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/android-health-connect.svg)](https://www.npmjs.com/package/android-health-connect)
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
| CI (self-hosted) | ✅ Supported | lint, typecheck, Jest, library build, audit |
| Android example native build in CI | ⚠️ X64 only | Skipped on ARM64 runners (`aapt2` is x86_64-only) |
| CodeQL on PRs | ⚠️ Manual / scheduled | Needs GitHub Advanced Security on private repos |

## Requirements

| Requirement | Minimum |
|---|---|
| Android OS | 10 (API 29) |
| compileSdk | 37 |
| Android Gradle Plugin | 9.1.1 |
| Health Connect Jetpack SDK | [`connect-client:1.2.0-alpha06`](https://developer.android.com/jetpack/androidx/releases/health-connect) |
| Health Connect app | Required on Android 9–13; built-in on Android 14+ |
| React Native | 0.84+ (New Architecture / TurboModules) |
| Node.js | 22.11+ |

### Health Connect SDK notice (`1.1.0` → `1.2.0-alpha06`)

This library ships with **`androidx.health.connect:connect-client:1.2.0-alpha06`** (upgraded from stable **`1.1.0`**). That is the current **alpha** line of the official Jetpack SDK; Google’s **stable** release remains **`1.1.0`**.

Official release notes that matter for integrators ([full changelog](https://developer.android.com/jetpack/androidx/releases/health-connect)):

| SDK version | Date | What changed |
|---|---|---|
| **1.2.0-alpha06** | 2026-08-26 | Updated Health Connect **release and dev signing certificates** |
| **1.2.0-alpha05** | 2026-08-12 | Jetpack SDK `minSdk` lowered to **API 24**; secured Health Connect intents on Android &lt; 14; signature validation fix |
| **1.2.0-alpha04** | 2026-04-22 | **Matchmaking APIs** (`checkIfMatchmakingIsPossible`, `createMatchmakingIntent`) to discover compatible data sources |
| **1.2.0-alpha03** | 2026-03-25 | Richer **`ExerciseSessionRecord` / `ExerciseSegment`** fields; change-log `pageSize`; activity-intensity support |
| **1.2.0-alpha02** | 2025-10-08 | Additional **device type** enums |
| **1.2.0-alpha01** | 2025-07-30 | Backwards-compat for **skin temperature** & **mindfulness**; **activity intensity** API (Android 14+) |
| **1.1.0** (stable) | 2025-10-08 | First stable `connect-client` release |

**Host app requirements** (from Google’s [Get started](https://developer.android.com/health-and-fitness/health-connect/get-started) guide for `connect-client` 1.1.0+):

- `compileSdk` **36+** (this library targets **37**)
- Android Gradle Plugin **8.9.1+** (example app uses **9.1.1**)

**What this React Native package exposes today:** the [19 record types](#supported-record-types) below (same surface as before the SDK bump). New alpha-only APIs (matchmaking, mindfulness, skin temperature, activity intensity, PHR) are **not** wrapped in the JS API yet — watch [GitHub Releases](https://github.com/solutionforest/AndroidHealthConnect/releases) and the weekly upgrade-reminder issue when we add them.

## Installation

```sh
npm install android-health-connect
# or
yarn add android-health-connect
```

### Expo setup

If you are using **Expo** (SDK 50+), add the library's config plugin to your `app.json` or `app.config.js`. The plugin automatically handles adding the required Health Connect intent filters to your Android manifest.

```json
{
  "expo": {
    "plugins": [
      [
        "android-health-connect",
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
    "plugins": ["android-health-connect"]
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
import { isHealthConnectAvailable, openHealthConnectApp } from 'android-health-connect';

const availability = await isHealthConnectAvailable();
// 'available' | 'notInstalled' | 'notSupported'

if (availability === 'notInstalled') {
  openHealthConnectApp(); // Opens Play Store listing
}
```

### Request permissions

```ts
import { requestPermissions } from 'android-health-connect';

const granted = await requestPermissions([
  'android.permission.health.READ_STEPS',
  'android.permission.health.WRITE_STEPS',
  'android.permission.health.READ_HEART_RATE',
]);

console.log('Granted:', granted);
```

### Read records

```ts
import { readSteps, readHeartRate } from 'android-health-connect';

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
import { readRecords } from 'android-health-connect';
import type { WeightRecord } from 'android-health-connect';

const { records } = await readRecords<WeightRecord>('Weight', {
  timeRangeFilter: { startTime: '...', endTime: '...' },
});
```

### Write records

```ts
import { writeRecords } from 'android-health-connect';

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
import { deleteRecordsByTime, deleteRecordsById } from 'android-health-connect';

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
import { checkLibraryUpdate, LIBRARY_VERSION } from 'android-health-connect';

const update = await checkLibraryUpdate();
if (update.updateAvailable) {
  console.warn(update.advice);
  // e.g. show in-app banner: update.currentVersion → update.latestVersion
}
```

Maintainers: CI, CodeQL, and the weekly version-check Action all run on the **self-hosted** GitHub Actions runner. Version-check opens/updates an `upgrade-reminder` issue when `package.json` or the Health Connect SDK falls behind.

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
