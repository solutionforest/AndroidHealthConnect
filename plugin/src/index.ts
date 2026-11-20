import {
  AndroidConfig,
  type ConfigPlugin,
  createRunOncePlugin,
  withAndroidManifest,
} from '@expo/config-plugins';

const pkg = require('../../package.json') as { name: string; version: string };

export type AndroidHealthConnectPluginOptions = {
  /**
   * Health Connect permissions to declare in the host app's manifest.
   * Defaults to an empty array — you should list only the permissions your app uses.
   *
   * @example
   * ["android.permission.health.READ_STEPS", "android.permission.health.WRITE_STEPS"]
   */
  permissions?: string[];
};

/**
 * Ensures a `<uses-permission>` entry exists in the Android manifest.
 * Skips the insertion if the permission is already declared (avoids duplicates).
 */
function ensurePermission(
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
  permission: string
): void {
  const manifest = androidManifest.manifest;
  manifest['uses-permission'] ??= [];
  const exists = manifest['uses-permission'].some(
    (p) => p.$['android:name'] === permission
  );
  if (!exists) {
    manifest['uses-permission'].push({ $: { 'android:name': permission } });
  }
}

/**
 * Adds an intent-filter entry to the app's main activity.
 * Skips the insertion if an identical action is already registered.
 */
function addMainActivityIntentFilter(
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
  action: string,
  category?: string
): void {
  const mainActivity = AndroidConfig.Manifest.getMainActivity(androidManifest);
  if (!mainActivity) {
    return;
  }

  mainActivity['intent-filter'] ??= [];

  const alreadyPresent = mainActivity['intent-filter'].some((filter) =>
    filter.action?.some((a) => a.$['android:name'] === action)
  );
  if (alreadyPresent) {
    return;
  }

  const filter: AndroidConfig.Manifest.ManifestIntentFilter = {
    action: [{ $: { 'android:name': action } }],
  };
  if (category) {
    filter.category = [{ $: { 'android:name': category } }];
  }
  mainActivity['intent-filter'].push(filter);
}

const withAndroidHealthConnect: ConfigPlugin<
  AndroidHealthConnectPluginOptions | void
> = (config, options) => {
  const permissions = options?.permissions ?? [];

  return withAndroidManifest(config, (modConfig) => {
    const androidManifest = modConfig.modResults;

    // Only add permissions explicitly requested by the host app.
    for (const permission of permissions) {
      ensurePermission(androidManifest, permission);
    }

    // Required for the Health Connect permissions rationale screen (Android ≤ 13).
    addMainActivityIntentFilter(
      androidManifest,
      'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE'
    );

    // Required for the Health Connect permissions UI on Android 14+.
    addMainActivityIntentFilter(
      androidManifest,
      'android.intent.action.VIEW_PERMISSION_USAGE',
      'android.intent.category.HEALTH_PERMISSIONS'
    );

    return modConfig;
  });
};

export default createRunOncePlugin(
  withAndroidHealthConnect,
  pkg.name,
  pkg.version
);
