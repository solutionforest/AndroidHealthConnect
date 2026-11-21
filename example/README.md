# Android Health Connect — example app

Bare React Native host that exercises
[`@solutionforest/android-health-connect`](../README.md).

> Complete the [RN environment setup](https://reactnative.dev/docs/set-up-your-environment) first.

## Run

```sh
# from repo root
yarn
yarn example start          # Metro
# other terminal:
yarn example android
```

Or from `example/`:

```sh
yarn start
yarn android
```

Android-only (no iOS project). Prefer an emulator/device with Google Play so
Health Connect can install.

## Suggested path (first run)

1. Confirm **Availability** is `available` (or tap Install / Open Health Connect).
2. **Request Permissions** → grant Steps / Heart Rate.
3. **Seed Demo Data (fake)** → writes sample Steps + HR + walk.
4. **Read Steps** / **Aggregate Steps** / **Update Steps (+100)**.
5. **getChanges (Steps)** → changelog token + page.
6. Optional: History / Background permission buttons (feature-gated).
7. Exercise route write/read; Planned exercise write/read when the device
   supports `plannedExercise`.

Full host-app tutorial (install, Expo plugin, manifests, API snippets):
**[../README.md](../README.md)#usage**.

## Buttons → APIs

### Core

| Button | API |
| --- | --- |
| Request Permissions | `requestPermissions` + `Permission.*` |
| Check Permissions | `checkPermissions` + `hasPermissions` / `missingPermissions` |
| Write / Read Steps · Read Heart Rate | `writeRecords` / `readSteps` / `readHeartRate` |
| Seed Demo Data (fake) | example-only multi-type `writeRecords` |

### Recipes

| Button | API |
| --- | --- |
| Aggregate Steps (7d) | `aggregateRecord` |
| Update Steps (+100) | `updateRecords` (`metadata.id`) |
| getChanges (Steps) | `getChangesToken` + `getChanges({ pageSize })` |
| Request History Permission | `getFeatureStatus('readHealthDataHistory')` + `Permission.READ_HEALTH_DATA_HISTORY` |
| Request Background Permission | `getFeatureStatus('readHealthDataInBackground')` + `Permission.READ_HEALTH_DATA_IN_BACKGROUND` |
| Write / Read Exercise Route | `ExerciseSession` + `exerciseRoute` / `requestExerciseRoute` |
| Write / Read Planned Exercise | `PlannedExerciseSession` (feature-gated) |

Startup uses `ensureAvailable({ openStoreIfMissing: false })` so the UI can show
status without auto-opening the store.

Health Connect permissions + rationale intent-filters:
`android/app/src/main/AndroidManifest.xml` and
`res/values/health_permissions.xml`.

Edit `src/App.tsx` and save — Fast Refresh applies. Force reload from the Dev
Menu if needed (`Cmd ⌘` + `M` on macOS).
