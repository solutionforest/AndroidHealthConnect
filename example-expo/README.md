# Android Health Connect — Expo example

A minimal [Expo](https://docs.expo.dev/) app that uses
[`@solutionforest/android-health-connect`](../README.md) through its config
plugin. It shows the usual flow:

1. Check Health Connect availability.
2. Request the `READ_STEPS` permission.
3. Read the last 7 days of step records.
4. Aggregate the step total for the same range.

The bare React Native example in [`../example`](../example) covers the rest of
the API.

Health Connect is a native module, so this app needs a
[development build](https://docs.expo.dev/develop/development-builds/introduction/).
It does not run in Expo Go.

## Versions

- Expo SDK 58 (React Native 0.88)
- `minSdkVersion` 29, set with `expo-build-properties`

## Run

You need the [Android toolchain](https://docs.expo.dev/get-started/set-up-your-environment/?platform=android&device=physical&mode=development-build&buildEnv=local)
and a device or emulator with Google Play, so Health Connect can be installed.

```sh
# from the repo root
yarn                 # install all workspaces
yarn prepare         # build the library and its config plugin

cd example-expo
npx expo prebuild --platform android   # generate android/ from app.json
npx expo run:android                   # build, install and start the dev client
```

`android/` is generated, so it is git-ignored. Run `npx expo prebuild --clean`
after you change `app.json`.

## How the config plugin is set up

`app.json` registers the plugin and lists the permissions the app declares:

```json
[
  "@solutionforest/android-health-connect",
  { "permissions": ["android.permission.health.READ_STEPS"] }
]
```

On prebuild, the plugin writes those `<uses-permission>` entries and the Health
Connect intent filters into `AndroidManifest.xml`. Keep the list in sync with
what the app requests at runtime (`PERMISSIONS` in `src/App.tsx`).

`metro.config.js` points Metro at the library source in this repo. A normal
Expo app installs the package from npm and does not need it.
