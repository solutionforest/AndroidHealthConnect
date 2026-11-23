# Contributing

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## Development workflow

This project is a monorepo managed using [Yarn workspaces](https://yarnpkg.com/features/workspaces). It contains the following packages:

- The library package in the root directory.
- An example app in the `example/` directory.

To get started with the project, make sure you have the correct version of [Node.js](https://nodejs.org/) installed. See the [`.nvmrc`](./.nvmrc) file for the version used in this project.

Run `yarn` in the root directory to install the required dependencies for each package:

```sh
yarn
```

> Since the project relies on Yarn workspaces, you cannot use [`npm`](https://github.com/npm/cli) for development without manually migrating.

The [example app](/example/) demonstrates usage of the library. You need to run it to test any changes you make.

It is configured to use the local version of the library, so any changes you make to the library's source code will be reflected in the example app. Changes to the library's JavaScript code will be reflected in the example app without a rebuild, but native code changes will require a rebuild of the example app.

The library is Android-only, so the example app has no iOS project.

To edit the Java or Kotlin files, open `example/android` in Android studio and find the source files at `android-health-connect` under `Android`.

You can use various commands from the root directory to work with the project.

To start the packager:

```sh
yarn example start
```

To run the example app on Android:

```sh
yarn example android
```

To confirm that the app is running with the new architecture, you can check the Metro logs for a message like this:

```sh
Running "AndroidHealthConnectExample" with {"fabric":true,"initialProps":{"concurrentRoot":true},"rootTag":1}
```

Note the `"fabric":true` and `"concurrentRoot":true` properties.

Make sure your code passes TypeScript:

```sh
yarn typecheck
```

To check for linting errors, run the following:

```sh
yarn lint
```

To fix formatting errors, run the following:

```sh
yarn lint --fix
```

Remember to add tests for your change if possible. Run the unit tests by:

```sh
yarn test
yarn test:android   # Kotlin / Robolectric (needs Android SDK + JDK 17)
```


### Commit message convention

We follow the [conventional commits specification](https://www.conventionalcommits.org/en) for our commit messages:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `docs`: changes into documentation, e.g. add usage example for the module.
- `test`: adding or updating tests, e.g. add integration tests using detox.
- `chore`: tooling changes, e.g. change CI config.

Our pre-commit hooks verify that your commit message matches this format when committing.


### Publishing

**Primary:** [npmjs.org](https://www.npmjs.com/package/@solutionforest/android-health-connect)
via **Trusted Publishing** (OIDC from GitHub Actions — no long-lived `NPM_TOKEN`
for publish).

**Also:** GitHub Releases `.tgz` (SPDX SBOM + attestations) and a GitHub Packages
mirror (`npm.pkg.github.com`).

Tag `v*` on `main` to trigger Release — the tag **must** match `package.json`
(`v0.3.13` ↔ `"version": "0.3.13"`).

We use [release-it](https://github.com/release-it/release-it) for version bumps locally when needed:

```sh
yarn release
```

#### Trusted Publishing (npmjs + GitHub Actions)

Configured on the package Settings → **Trusted Publisher**:

| Field | Value |
|---|---|
| Publisher | GitHub Actions |
| Organization or user | `solutionforest` |
| Repository | `AndroidHealthConnect` |
| Workflow filename | `release.yml` |
| Allowed actions | **Allow npm publish** |

`release.yml` already has `permissions.id-token: write`. The first OIDC publish
must succeed within **2 days** of creating the trusted-publisher connection.

**Max security (recommended after OIDC works):** package Settings → Publishing
access → *Require two-factor authentication and disallow bypass 2fa tokens* →
Update. Then revoke any automation / bypass-2FA tokens that were used for the
first publish.

### Quality gates (required)

Before opening a PR, run:

```sh
yarn lint
yarn typecheck
yarn test:coverage
yarn test:android
```

CI enforces the same gates (max-strict TypeScript, type-aware ESLint, Jest
coverage thresholds, Kotlin / Robolectric unit tests).

### Scripts

The `package.json` file contains various scripts for common tasks:

- `yarn`: setup project by installing dependencies.
- `yarn typecheck`: type-check files with TypeScript.
- `yarn lint`: lint files with [ESLint](https://eslint.org/).
- `yarn test`: run unit tests with [Jest](https://jestjs.io/).
- `yarn test:coverage`: unit tests with coverage summary (thresholds enforced).
- `yarn test:android`: Kotlin unit tests via the example Gradle project (Robolectric).
- `yarn pack:check`: dry-run pack list (verify published files).
- `yarn example start`: start the Metro server for the example app.
- `yarn example android`: run the example app on Android.

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.
