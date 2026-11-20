import { version as packageVersion } from '../package.json';

export const LIBRARY_VERSION: string = packageVersion;

export type LibraryUpdateInfo = {
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  releaseUrl: string | null;
  releaseName: string | null;
  /** Human-readable upgrade reminder (升级提醒) for UI / logs. */
  advice: string;
};

export type CheckLibraryUpdateOptions = {
  /** GitHub owner/repo. Defaults to solutionforest/AndroidHealthConnect. */
  repository?: string;
  /** Override current version (defaults to package.json version). */
  currentVersion?: string;
  /** Injected fetch for tests. */
  fetchImpl?: typeof fetch;
};

const DEFAULT_REPOSITORY = 'solutionforest/AndroidHealthConnect';

function normalizeVersion(version: string): string {
  return version.trim().replace(/^v/i, '');
}

/** Compare core semver (ignores pre-release suffix). Returns -1 / 0 / 1. */
export function compareSemver(a: string, b: string): number {
  const parse = (v: string): number[] =>
    normalizeVersion(v)
      .split('-')[0]!
      .split('.')
      .map((part) => {
        const n = Number.parseInt(part, 10);
        return Number.isFinite(n) ? n : 0;
      });

  const left = parse(a);
  const right = parse(b);
  const len = Math.max(left.length, right.length);

  for (let i = 0; i < len; i++) {
    const av = left[i] ?? 0;
    const bv = right[i] ?? 0;
    if (av > bv) {
      return 1;
    }
    if (av < bv) {
      return -1;
    }
  }
  return 0;
}

type GithubRelease = {
  tag_name?: string;
  name?: string | null;
  html_url?: string;
  draft?: boolean;
  prerelease?: boolean;
};

/**
 * Checks GitHub Releases for a newer library version and returns upgrade advice.
 * Does not auto-upgrade — apps should show the reminder to users / maintainers.
 */
export async function checkLibraryUpdate(
  options: CheckLibraryUpdateOptions = {}
): Promise<LibraryUpdateInfo> {
  const repository = options.repository ?? DEFAULT_REPOSITORY;
  const currentVersion = normalizeVersion(
    options.currentVersion ?? LIBRARY_VERSION
  );
  // Use `in` so callers can inject a non-function (null) for the no-fetch path.
  // `??` would replace null with globalThis.fetch and hide that branch.
  const fetchImpl =
    'fetchImpl' in options ? options.fetchImpl : globalThis.fetch;

  if (typeof fetchImpl !== 'function') {
    return {
      currentVersion,
      latestVersion: null,
      updateAvailable: false,
      releaseUrl: null,
      releaseName: null,
      advice: `Unable to check for updates (no fetch). Current version is ${currentVersion}.`,
    };
  }

  const response = await fetchImpl(
    `https://api.github.com/repos/${repository}/releases/latest`,
    {
      headers: {
        'Accept': 'application/vnd.github+json',
        'User-Agent': `android-health-connect/${currentVersion}`,
      },
    }
  );

  if (!response.ok) {
    return {
      currentVersion,
      latestVersion: null,
      updateAvailable: false,
      releaseUrl: null,
      releaseName: null,
      advice: `Unable to check for updates (GitHub HTTP ${response.status}). Current version is ${currentVersion}.`,
    };
  }

  const release = (await response.json()) as GithubRelease;
  const latestVersion = release.tag_name
    ? normalizeVersion(release.tag_name)
    : null;
  const releaseUrl = release.html_url ?? null;
  const releaseName = release.name ?? null;

  if (!latestVersion) {
    return {
      currentVersion,
      latestVersion: null,
      updateAvailable: false,
      releaseUrl,
      releaseName,
      advice: `No GitHub release found. Current version is ${currentVersion}.`,
    };
  }

  const updateAvailable = compareSemver(currentVersion, latestVersion) < 0;

  if (updateAvailable) {
    return {
      currentVersion,
      latestVersion,
      updateAvailable: true,
      releaseUrl,
      releaseName,
      advice: `Upgrade recommended / 建议升级: ${currentVersion} → ${latestVersion}. See ${
        releaseUrl ?? `https://github.com/${repository}/releases`
      }`,
    };
  }

  return {
    currentVersion,
    latestVersion,
    updateAvailable: false,
    releaseUrl,
    releaseName,
    advice: `You are on the latest version (${currentVersion}).`,
  };
}
