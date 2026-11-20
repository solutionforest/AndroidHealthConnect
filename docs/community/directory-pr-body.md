# Add @solutionforest/android-health-connect

## Why

React Native TurboModule for [Android Health Connect](https://developer.android.com/health-and-fitness/health-connect) (API 29+):

- Permissions (request / check / revoke), read / write / delete records
- Aggregates, exercise routes, changelog sync
- Matchmaking + PHR helpers (feature-gated)
- Expo config plugin + bare RN setup
- New Architecture only (RN ≥ 0.84)

## Entry

Appended to the end of `react-native-libraries.json` (Recently added order).

```json
{
  "githubUrl": "https://github.com/solutionforest/AndroidHealthConnect",
  "npmPkg": "@solutionforest/android-health-connect",
  "examples": [
    "https://github.com/solutionforest/AndroidHealthConnect/tree/main/example"
  ],
  "android": true,
  "newArchitecture": "new-arch-only",
  "configPlugin": true
}
```

## Checklist

- [x] Added library to **`react-native-libraries.json`**
- [x] Package published on **registry.npmjs.org** as `@solutionforest/android-health-connect`
- [x] Public GitHub repository
- [x] `npmPkg` set because repo name ≠ package name
- [x] Skipped `false` platform fields
- [x] `expoGo` omitted (native Health Connect; use prebuild / dev client)
- [x] Example app linked under `examples`

## Links

- Repo: https://github.com/solutionforest/AndroidHealthConnect
- npm: https://www.npmjs.com/package/@solutionforest/android-health-connect
- Example: https://github.com/solutionforest/AndroidHealthConnect/tree/main/example
