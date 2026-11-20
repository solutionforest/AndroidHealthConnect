/**
 * Contract tests for android/build.gradle Kotlin plugin apply.
 *
 * Official AGP 9 built-in Kotlin migration guide:
 * https://developer.android.com/build/migrate-to-built-in-kotlin
 *
 * Applying `kotlin-android` / `org.jetbrains.kotlin.android` when AGP already
 * registered the `kotlin` extension fails configuration with:
 * - Cannot add extension with name 'kotlin', as there is an extension already registered
 * - The 'org.jetbrains.kotlin.android' plugin is no longer required for Kotlin support since AGP 9.0
 */

declare const __dirname: string;

type NodeFs = {
  readFileSync: (path: string, encoding: 'utf8') => string;
};
type NodePath = {
  join: (...parts: string[]) => string;
};

// Jest runs in Node; avoid adding @types/node to the library tsconfig.
const fs = require('fs') as NodeFs;
const path = require('path') as NodePath;

describe('android/build.gradle AGP 9 Kotlin plugin guard', () => {
  const gradlePath = path.join(
    __dirname,
    '..',
    '..',
    'android',
    'build.gradle'
  );
  const source = fs.readFileSync(gradlePath, 'utf8');

  it('applies com.android.library before deciding on kotlin-android', () => {
    const libraryIdx = source.indexOf('apply plugin: "com.android.library"');
    const kotlinGuardIdx = source.indexOf(
      'project.extensions.findByName("kotlin")'
    );

    expect(libraryIdx).toBeGreaterThanOrEqual(0);
    expect(kotlinGuardIdx).toBeGreaterThan(libraryIdx);
  });

  it('does not unconditionally apply kotlin-android after com.android.library', () => {
    const afterLibrary = source.slice(
      source.indexOf('apply plugin: "com.android.library"')
    );
    // Top-level (column-0) apply is the AGP 9 collision. Indented apply inside the
    // findByName("kotlin") == null guard is the supported AGP 8 fallback.
    expect(afterLibrary).not.toMatch(/^apply plugin:\s*"kotlin-android"\s*$/m);
  });

  it('only applies kotlin-android when the kotlin extension is missing', () => {
    expect(source).toMatch(
      /if\s*\(\s*project\.extensions\.findByName\(\s*"kotlin"\s*\)\s*==\s*null\s*\)\s*\{[\s\S]*?apply plugin:\s*"kotlin-android"/
    );
  });

  it('documents the official AGP 9 conflict so the guard is not removed casually', () => {
    expect(source).toContain('migrate-to-built-in-kotlin');
    expect(source).toContain(
      "Cannot add extension with name 'kotlin', as there is an extension already registered"
    );
  });
});

/**
 * Pure decision helper mirroring the Gradle guard — covers both AGP 8 and AGP 9 hosts.
 */
function shouldApplyKotlinAndroidPlugin(
  kotlinExtensionAlreadyRegistered: boolean
): boolean {
  return !kotlinExtensionAlreadyRegistered;
}

describe('shouldApplyKotlinAndroidPlugin', () => {
  it('skips kotlin-android when AGP built-in Kotlin already registered the extension', () => {
    expect(shouldApplyKotlinAndroidPlugin(true)).toBe(false);
  });

  it('applies kotlin-android when the host has not registered the kotlin extension', () => {
    expect(shouldApplyKotlinAndroidPlugin(false)).toBe(true);
  });
});
