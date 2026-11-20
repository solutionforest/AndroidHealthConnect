# Community listings checklist

How to get **`@solutionforest/android-health-connect`** into React Native community indexes (especially [reactnative.directory](https://reactnative.directory/)).

## Status (as of 2026-11-20, Asia/Singapore)

| Channel | Status | Blocker / note |
|---|---|---|
| [React Native Directory](https://reactnative.directory/) | **Not listed** | Package must be on **registry.npmjs.org** first (GitHub Packages alone is rejected) |
| npmjs.org | **Missing** | `npm view` → 404. Release workflow can mirror when `NPM_TOKEN` is set |
| GitHub Packages | Published | Primary registry today |
| GitHub topics | Done | `android`, `expo`, `fitness`, `health-connect`, `healthcare`, `kotlin`, `react-native`, `turbomodules`, `typescript` |
| [awesome-react-native](https://github.com/jondot/awesome-react-native) | Not listed | Curated; expects adoption / novelty — submit after Directory + some usage signal |
| Competitor already on Directory | Listed | [`react-native-health-connect`](https://reactnative.directory/?search=health-connect) (matinzd) |

---

## 1. Publish to npmjs.org (required for Directory)

Release already has an optional mirror step (`.github/workflows/release.yml` → **Publish to npmjs.org**).

### One-time setup

1. On [npmjs.com](https://www.npmjs.com/), ensure the `@solutionforest` org/user can publish `@solutionforest/android-health-connect`.
2. Create an **Automation** token with publish rights for that scope.
3. In GitHub → **solutionforest/AndroidHealthConnect** → **Settings → Secrets and variables → Actions**, add:
   - Name: `NPM_TOKEN`
   - Value: the automation token
4. Re-run publish for the current release:
   - **Actions → Release → Run workflow**
   - Tag input: `v0.3.9` (or leave empty to use `package.json` version)
5. Confirm:

```sh
npm view @solutionforest/android-health-connect name version repository.url
# expect name + version, not 404
```

Until this succeeds, Directory maintainers / CI will reject the listing PR.

---

## 2. Submit to React Native Directory

Official docs: [react-native-community/directory README](https://github.com/react-native-community/directory#how-do-i-add-a-library)

### Option A — CLI (fastest)

From this repo root (after npmjs publish):

```sh
bunx rn-directory submit
# or
bunx rn-directory autoSubmit
```

Needs Bun + `gh` logged in as you (not a bot).

### Option B — Manual PR

1. Fork [react-native-community/directory](https://github.com/react-native-community/directory).
2. Append the entry in [`react-native-directory-entry.json`](./react-native-directory-entry.json) to the **end** of `react-native-libraries.json` (order drives “Recently added”).
3. Open a PR with the body in [`directory-pr-body.md`](./directory-pr-body.md).

Website UI: open Directory → **Add a library** → Add manually / Add via CLI.

### Entry fields (why these)

| Field | Value | Why |
|---|---|---|
| `githubUrl` | repo URL | Required |
| `npmPkg` | `@solutionforest/android-health-connect` | Repo name ≠ npm name |
| `examples` | `.../tree/main/example` | Ships an example app |
| `android` | `true` | Android-only |
| `newArchitecture` | `"new-arch-only"` | TurboModule / RN ≥ 0.84 |
| `configPlugin` | `true` | Expo config plugin via `app.plugin.js` |
| `expoGo` | omitted | Needs native Health Connect / prebuild or a custom client |

Do **not** set `ios`, `web`, or other false platforms.

---

## 3. Other React Native community places

### GitHub (already good)

- Topics: keep `react-native`, `health-connect`, `expo`, `turbomodules`.
- Optional: enable Discussions for support Q&A (helps Directory “known” signals over time).

### [awesome-react-native](https://github.com/jondot/awesome-react-native)

Curated list. Contributing bar: actively maintained, modern RN, **real adoption or exceptional novelty**.

Suggested section: **Components → System & Device**.

Ready line (after Directory + some stars/downloads):

```md
- [@solutionforest/android-health-connect](https://github.com/solutionforest/AndroidHealthConnect) - Android Health Connect TurboModule (RN 0.84+): permissions, records, aggregates, matchmaking, Expo config plugin.
```

Open one PR per suggestion. See their [CONTRIBUTING.md](https://github.com/jondot/awesome-react-native/blob/master/CONTRIBUTING.md).

### npm discoverability

`package.json` keywords already include `react-native`, `health-connect`, `expo`, `turbo-module`. After npmjs publish, these feed npm search and Directory topic scoring.

### Not primary targets

| Place | Why skip / defer |
|---|---|
| Expo SDK docs | Official Expo modules only |
| awesome-expo | Mostly apps / older community libs; Directory is the real Expo discovery path |
| React Native Discord / X / Reddit | Marketing posts after Directory is live — not a structured “listing” |

---

## 4. Suggested order

1. Add `NPM_TOKEN` → re-run **Release** for `v0.3.9` → verify `npm view`.
2. Open Directory PR (CLI or manual) using files in this folder.
3. After merge, tweet / Discord / blog with the Directory link.
4. When there is adoption signal, PR **awesome-react-native**.

---

## Files in this folder

| File | Purpose |
|---|---|
| [`react-native-directory-entry.json`](./react-native-directory-entry.json) | Exact JSON object to append |
| [`directory-pr-body.md`](./directory-pr-body.md) | PR description template |
| [`awesome-react-native-entry.md`](./awesome-react-native-entry.md) | Curated-list PR snippet |
