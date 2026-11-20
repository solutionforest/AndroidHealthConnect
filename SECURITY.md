# Security Policy

## Supported Versions

Security fixes are provided for the latest released line of this library.

| Version | Supported |
| ------- | --------- |
| 0.3.x   | ✅ Yes |
| 0.2.x   | ❌ No — please upgrade to 0.3.x |
| < 0.2   | ❌ No |

Use `checkLibraryUpdate()` or watch [GitHub Releases](https://github.com/solutionforest/AndroidHealthConnect/releases) for newer versions.

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

### Preferred: GitHub Security Advisory

1. Go to the repository **Security** tab → **Advisories** → **Report a vulnerability**  
   or open: https://github.com/solutionforest/AndroidHealthConnect/security/advisories/new
2. Include:
   - Affected package / version(s)
   - Description of the issue and impact
   - Steps to reproduce (PoC if available)
   - Any suggested fix

### Alternative: Email

If you cannot use private advisories, email **jayden.chan@solutionforest.net** with the subject:

`[SECURITY] android-health-connect`

Do not attach secrets or production credentials. Redact sensitive patient/health data from any logs.

## What to Expect

| Step | Target |
| ---- | ------ |
| Initial acknowledgement | Within **3 business days** |
| Status update | Within **7 business days** of acknowledgement |
| Fix / advisory (if confirmed) | As soon as practical; timing depends on severity and complexity |

If we accept the report, we will coordinate a fix and, when appropriate, publish a GitHub Security Advisory and release notes.  
If we decline the report, we will explain why (e.g. not reproducible, out of scope, or accepted risk).

## Scope

This project is a **React Native / Android Health Connect client library**. In scope:

- Vulnerabilities in this repository’s TypeScript, Kotlin, Expo config plugin, or CI scripts that could lead to unauthorized access, privilege escalation, or unexpected exposure of health data **through misuse of this library’s APIs**
- Supply-chain issues in **direct** dependencies that we can reasonably patch or pin

Out of scope (report upstream where applicable):

- Bugs in Android OS, Health Connect, React Native, Expo, or Google Play services themselves
- Issues that require a compromised device, rooted phone, or malicious host app with already-granted Health Connect permissions (unless the library mishandles permissions beyond the host app’s intent)
- Denial-of-service against third-party services
- Social engineering, physical attacks, or speculative reports without a concrete impact

## Security model (what this library does / does not do)

Health data access is gated by **Android Health Connect** and the **host app**:

| Layer | Responsibility |
| ----- | -------------- |
| OS / Health Connect | User consent UI, per-type permissions, on-device store, provider signature checks |
| This library | Thin TurboModule bridge; requests only the permissions the host app asks for; no network upload of health records |
| Host app | Least-privilege permission lists, UI copy, retention, any server sync / encryption beyond HC |

This package does **not** provide root detection, certificate pinning, or anti-tamper. Those belong in the host app if required.

Use `getHealthConnectAvailability()` before enabling HC UI — devices without Google Play services (common on mainland China / some HMS phones) cannot use Health Connect.

## Security Practices

- Dependency updates via Dependabot (npm, Gradle, GitHub Actions)
- CI security audit job (`yarn npm audit`) on GitHub-hosted runners
- Scheduled CodeQL analysis on `main` and weekly
- Coverage / lint / typecheck gates on every PR
- Weekly version-check workflow that opens upgrade-reminder issues for maintainers

## Safe Harbor

We appreciate good-faith security research. We will not pursue legal action against researchers who:

- Make a good-faith effort to avoid privacy violations, service disruption, and data destruction
- Report vulnerabilities promptly through the channels above
- Do not exploit the issue beyond what is needed to demonstrate it
