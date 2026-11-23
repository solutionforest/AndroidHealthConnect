---
name: android-health-connect
description: >-
  Integrate Solution Forest's React Native TurboModule for Android Health
  Connect (@solutionforest/android-health-connect). Use when adding HC
  permissions, reading/writing health records, aggregates, changelog sync,
  Matchmaking, PHR, Expo plugin setup, or choosing npmjs vs GitHub Packages.
---

# android-health-connect

## When to use

- Wiring Android Health Connect into a React Native / Expo app
- Choosing install source: **npmjs.org (primary)** or **GitHub Packages (mirror)**
- Implementing availability, permissions, records, aggregates, or resume polling

## Do not

- Invent APIs — only use exports from `@solutionforest/android-health-connect` (see published types / repo `src/index.tsx`)
- Target iOS — this library is Android-only
- Assume RN below 0.84 or Old Architecture
- Hand-type permission strings when `Permission.*` exists
- Expect push/live updates from Health Connect — poll on resume

## Install

### npmjs.org (primary)

```sh
yarn add @solutionforest/android-health-connect
# or: npm install @solutionforest/android-health-connect
```

No `.npmrc` required.

### GitHub Packages (mirror)

```ini
# .npmrc
@solutionforest:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

PAT: classic with `read:packages` (SSO for `solutionforest` if needed).

```sh
yarn add @solutionforest/android-health-connect
```

Same scoped name on both registries: `@solutionforest/android-health-connect`.

### Version lines

| Line | HC SDK | AGP | compileSdk | Node |
|---|---|---|---|---|
| `0.3.x` (default) | `1.2.0-alpha06` | ≥9.1 | 37 | ≥22.22 |
| `release-0.2` / `0.2.x` | `1.1.0` stable | ≥8.9.1 | 36 | ≥22.11 |

## Hard constraints

- React Native **≥0.84**, New Architecture / TurboModules
- Android API **29+**
- Feature-gated APIs: call `getFeatureStatus(feature)` and only proceed when `'available'`

## Canonical implementation order

1. **Availability** — `getHealthConnectAvailability()` / `ensureAvailable()`; open store with `openHealthConnectApp()` when needed.
2. **Permissions** — `ensurePermissions([Permission.READ_STEPS, ...])` (or `requestPermissions` / `checkPermissions`).
3. **Read** — `readSteps({ timeRangeFilter: timeRangeToday() })` or `readRecords('Steps', …)`.
4. **Resume UX** — first value after foreground is often `0`/empty. Use:

```ts
import {
  readSteps,
  timeRangeToday,
  useForegroundPoll,
} from '@solutionforest/android-health-connect';

const { value, loading, refresh } = useForegroundPoll(
  () => readSteps({ timeRangeFilter: timeRangeToday() }),
  { ready: (r) => (r.records?.length ?? 0) > 0, timeoutMs: 15_000 },
);
```

Non-React: `pollOnForeground` / `pollUntil` / `waitUntil`.

5. **Write / update** — `writeRecords`; `updateRecords` requires `metadata.id` from a prior read.
6. **Aggregates** — `aggregateRecord`, `aggregateGroupByDuration` (Instant buckets), `aggregateGroupByPeriod` (calendar).
7. **Changelog** — `getChangesToken` → `getChanges` / `pullChanges` (tokens ~30 days; prefer one record type per token).
8. **Matchmaking / PHR** — only after feature status checks.

## Expo

Add the config plugin, list only needed health permissions, then `npx expo prebuild`.

## Bare RN

Declare the same health permissions in the host `AndroidManifest.xml` and add Health Connect rationale / intent-filters (see repo README).

## Installing this skill

Save this file as `SKILL.md` in the project's skills folder, then commit it:

| Agent | Path |
|---|---|
| Cursor | `.cursor/skills/android-health-connect/SKILL.md` |
| Claude Code | `.claude/skills/android-health-connect/SKILL.md` |
| Others (Codex, Gemini CLI, …) | `.agents/skills/android-health-connect/SKILL.md` |

Source: `node_modules/@solutionforest/android-health-connect/skills.md` (matches the installed version) or https://solutionforest.github.io/AndroidHealthConnect/skills.md (latest). Re-copy after upgrading the package.

## References

- Skill install guide: https://solutionforest.github.io/AndroidHealthConnect/#agents

- Docs: https://solutionforest.github.io/AndroidHealthConnect/
- Install: https://solutionforest.github.io/AndroidHealthConnect/install.html
- API: https://solutionforest.github.io/AndroidHealthConnect/api.html
- npm: https://www.npmjs.com/package/@solutionforest/android-health-connect
- GitHub Packages: https://github.com/orgs/solutionforest/packages?repo_name=AndroidHealthConnect
- Source: https://github.com/solutionforest/AndroidHealthConnect
