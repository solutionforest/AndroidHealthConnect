This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use the following command to build and run the Android app (the library is Android-only, so the example has no iOS project):

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

If everything is set up correctly, you should see your new app running in the Android Emulator or your connected device.

This is one way to run your app — you can also build it directly from Android Studio.

## Step 3: Try the demo recipes

`src/App.tsx` includes buttons for the core flow (permissions / steps / heart rate)
plus recipes for:

| Button | API |
| --- | --- |
| Aggregate Steps (7d) | `aggregateRecord` |
| Update Steps (+100) | `updateRecords` (requires `metadata.id`) |
| getChanges (Steps) | `getChangesToken` + `getChanges({ pageSize })` |
| Request History Permission | `getFeatureStatus('readHealthDataHistory')` + `READ_HEALTH_DATA_HISTORY` |
| Request Background Permission | `getFeatureStatus('readHealthDataInBackground')` + `READ_HEALTH_DATA_IN_BACKGROUND` |
| Write Exercise + Route | `writeRecords` `ExerciseSession` + `exerciseRoute` |
| Read Exercise Route | `readExerciseSessions` + `requestExerciseRoute` if `CONSENT_REQUIRED` |

Health Connect permissions and rationale intent-filters live in
`android/app/src/main/AndroidManifest.xml` (plus `res/values/health_permissions.xml`).

Edit `App.tsx` and save — Fast Refresh applies changes. Force reload from the
Dev Menu if needed (`Cmd ⌘` + `M` on macOS).

## Congratulations! :tada:

You've successfully run the Health Connect example. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
