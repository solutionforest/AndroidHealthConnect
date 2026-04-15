# android-health-connect

A React Native library for integrating with [Android Health Connect](https://developer.android.com/health-and-fitness/health-connect) — the unified health & fitness data platform on Android 10+ (API 29+).

> **Android only.** This library has no iOS implementation.

## Requirements

| Requirement | Minimum |
|---|---|
| Android OS | 10 (API 29) |
| Health Connect app | Required on Android 9-13; built-in on Android 14+ |
| React Native | 0.71+ (New Architecture / TurboModules) |

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

## API reference

### Availability

| Function | Returns | Description |
|---|---|---|
| `isHealthConnectAvailable()` | `Promise<HealthConnectAvailability>` | Check if HC is usable |
| `openHealthConnectApp()` | `void` | Open HC app or Play Store |
| `openHealthConnectSettings()` | `void` | Open HC settings |
| `openHealthConnectDataManagement(pkg?)` | `void` | Open permission management |

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
