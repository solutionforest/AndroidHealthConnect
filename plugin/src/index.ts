import {
  AndroidConfig,
  type ConfigPlugin,
  createRunOncePlugin,
  withAndroidManifest,
} from '@expo/config-plugins';

const pkg = require('../../package.json') as { name: string; version: string };

/**
 * All Health Connect permissions supported by the library.
 * Used as the default when no explicit list is provided.
 */
const ALL_PERMISSIONS: string[] = [
  // Activity
  'android.permission.health.READ_STEPS',
  'android.permission.health.WRITE_STEPS',
  'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
  'android.permission.health.WRITE_ACTIVE_CALORIES_BURNED',
  'android.permission.health.READ_TOTAL_CALORIES_BURNED',
  'android.permission.health.WRITE_TOTAL_CALORIES_BURNED',
  'android.permission.health.READ_DISTANCE',
  'android.permission.health.WRITE_DISTANCE',
  'android.permission.health.READ_FLOORS_CLIMBED',
  'android.permission.health.WRITE_FLOORS_CLIMBED',
  'android.permission.health.READ_ELEVATION_GAINED',
  'android.permission.health.WRITE_ELEVATION_GAINED',
  'android.permission.health.READ_EXERCISE',
  'android.permission.health.WRITE_EXERCISE',
  // Body measurements
  'android.permission.health.READ_HEIGHT',
  'android.permission.health.WRITE_HEIGHT',
  'android.permission.health.READ_WEIGHT',
  'android.permission.health.WRITE_WEIGHT',
  'android.permission.health.READ_BODY_FAT',
  'android.permission.health.WRITE_BODY_FAT',
  // Vitals
  'android.permission.health.READ_HEART_RATE',
  'android.permission.health.WRITE_HEART_RATE',
  'android.permission.health.READ_RESTING_HEART_RATE',
  'android.permission.health.WRITE_RESTING_HEART_RATE',
  'android.permission.health.READ_RESPIRATORY_RATE',
  'android.permission.health.WRITE_RESPIRATORY_RATE',
  'android.permission.health.READ_BLOOD_PRESSURE',
  'android.permission.health.WRITE_BLOOD_PRESSURE',
  'android.permission.health.READ_BLOOD_GLUCOSE',
  'android.permission.health.WRITE_BLOOD_GLUCOSE',
  'android.permission.health.READ_OXYGEN_SATURATION',
  'android.permission.health.WRITE_OXYGEN_SATURATION',
  'android.permission.health.READ_BODY_TEMPERATURE',
  'android.permission.health.WRITE_BODY_TEMPERATURE',
  // Sleep
  'android.permission.health.READ_SLEEP',
  'android.permission.health.WRITE_SLEEP',
  // Nutrition
  'android.permission.health.READ_HYDRATION',
  'android.permission.health.WRITE_HYDRATION',
];

export type AndroidHealthConnectPluginOptions = {
  /**
   * Subset of Health Connect permissions to declare in the Android manifest.
   * Defaults to all permissions supported by the library.
   *
   * Note: the library's native manifest already declares all permissions and
   * they are merged at build time. Use this option to explicitly declare only
   * the permissions your app actually uses, which improves transparency to
   * users in the Health Connect UI.
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
  if (!manifest['uses-permission']) {
    manifest['uses-permission'] = [];
  }
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

  if (!mainActivity['intent-filter']) {
    mainActivity['intent-filter'] = [];
  }

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
  const permissions = options?.permissions ?? ALL_PERMISSIONS;

  return withAndroidManifest(config, (modConfig) => {
    const androidManifest = modConfig.modResults;

    // Declare the Health Connect permissions in the host app's manifest.
    // While the library's own AndroidManifest.xml is merged at build time,
    // explicit declaration here lets users control which permissions to include.
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
