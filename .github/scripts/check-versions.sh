#!/usr/bin/env bash
# Checks library release drift and Health Connect SDK freshness.
# Creates / updates a GitHub issue when an upgrade is recommended (提醒).
set -euo pipefail

REPO="${GITHUB_REPOSITORY:-solutionforest/AndroidHealthConnect}"
ISSUE_LABEL="upgrade-reminder"
ISSUE_TITLE="Upgrade reminder: newer versions available"

echo "::group::Collect current versions"
PACKAGE_VERSION="$(node -p "require('./package.json').version")"
CONNECT_CLIENT_VERSION="$(
  rg -oN 'androidx\.health\.connect:connect-client:([^\s"]+)' android/build.gradle \
    | head -1 \
    | sed -E 's/.*connect-client:([^[:space:]"]+)/\1/'
)"
echo "package.json version: ${PACKAGE_VERSION}"
echo "connect-client version: ${CONNECT_CLIENT_VERSION}"
echo "::endgroup::"

echo "::group::Fetch latest GitHub release"
LATEST_RELEASE_JSON="$(gh api "repos/${REPO}/releases/latest" 2>/dev/null || echo '{}')"
LATEST_TAG="$(node -e "const d=JSON.parse(process.argv[1]||'{}'); process.stdout.write(String(d.tag_name||'').replace(/^v/,''))" "$LATEST_RELEASE_JSON")"
LATEST_URL="$(node -e "const d=JSON.parse(process.argv[1]||'{}'); process.stdout.write(d.html_url||'')" "$LATEST_RELEASE_JSON")"
echo "latest GitHub release: ${LATEST_TAG:-none}"
echo "::endgroup::"

echo "::group::Fetch latest connect-client from Google Maven"
MAVEN_META_URL="https://dl.google.com/dl/android/maven2/androidx/health/connect/connect-client/maven-metadata.xml"
MAVEN_XML="$(curl -fsSL "$MAVEN_META_URL")"
LATEST_CONNECT="$(
  node -e '
    const xml = process.argv[1];
    const release = (xml.match(/<release>([^<]+)<\/release>/) || [])[1];
    const latest = (xml.match(/<latest>([^<]+)<\/latest>/) || [])[1];
    process.stdout.write(release || latest || "");
  ' "$MAVEN_XML"
)"
echo "latest connect-client on Maven: ${LATEST_CONNECT:-unknown}"
echo "::endgroup::"

compare_semver() {
  node -e '
    const normalize = (v) => String(v || "").replace(/^v/, "").split("-")[0].split(".").map((n) => parseInt(n, 10) || 0);
    const a = normalize(process.argv[1]);
    const b = normalize(process.argv[2]);
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const av = a[i] || 0;
      const bv = b[i] || 0;
      if (av > bv) process.exit(1);
      if (av < bv) process.exit(2);
    }
    process.exit(0);
  ' "$1" "$2"
  return $?
}

NOTES=()
NEEDS_REMINDER=0

if [[ -n "$LATEST_TAG" ]]; then
  set +e
  compare_semver "$PACKAGE_VERSION" "$LATEST_TAG"
  CMP=$?
  set -e
  if [[ $CMP -eq 2 ]]; then
    NEEDS_REMINDER=1
    NOTES+=("- Library: package.json is \`${PACKAGE_VERSION}\`, latest GitHub release is \`${LATEST_TAG}\`. Please bump / release sync. ${LATEST_URL}")
  elif [[ "$PACKAGE_VERSION" != "$LATEST_TAG" ]]; then
    # Pre-release / unequal tags still worth a nudge when not equal
    NOTES+=("- Library: package.json (\`${PACKAGE_VERSION}\`) differs from latest release tag (\`${LATEST_TAG}\`). ${LATEST_URL}")
    NEEDS_REMINDER=1
  else
    NOTES+=("- Library: package.json matches latest release (\`${PACKAGE_VERSION}\`).")
  fi
else
  NOTES+=("- Library: no GitHub release found to compare.")
fi

if [[ -n "$LATEST_CONNECT" && -n "$CONNECT_CLIENT_VERSION" ]]; then
  if [[ "$CONNECT_CLIENT_VERSION" != "$LATEST_CONNECT" ]]; then
    NEEDS_REMINDER=1
    NOTES+=("- Health Connect SDK: using \`${CONNECT_CLIENT_VERSION}\`, Maven latest is \`${LATEST_CONNECT}\`. Consider upgrading \`android/build.gradle\`.")
  else
    NOTES+=("- Health Connect SDK: up to date (\`${CONNECT_CLIENT_VERSION}\`).")
  fi
fi

BODY="$(printf '%s\n' \
  '## Upgrade reminder / 升级提醒' \
  '' \
  'Automated weekly check found version drift.' \
  '' \
  "${NOTES[@]}" \
  '' \
  '### Suggested actions' \
  '1. Review release notes and changelog.' \
  '2. Upgrade dependencies / bump library version as needed.' \
  '3. Advise app consumers to upgrade when a new library release is published.' \
  '' \
  "Detected at: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  '' \
  '_This issue is maintained by `.github/workflows/version-check.yml`._'
)"

echo "::group::Summary"
printf '%s\n' "${NOTES[@]}"
echo "needs_reminder=${NEEDS_REMINDER}"
echo "::endgroup::"

if [[ "$NEEDS_REMINDER" -eq 0 ]]; then
  echo "All checked versions look current. Closing any open reminder issue."
  EXISTING="$(gh issue list -R "$REPO" --label "$ISSUE_LABEL" --state open --json number --jq '.[0].number // empty')"
  if [[ -n "$EXISTING" ]]; then
    gh issue close -R "$REPO" "$EXISTING" --comment "Automated check: versions are current. Closing reminder."
  fi
  exit 0
fi

EXISTING="$(gh issue list -R "$REPO" --label "$ISSUE_LABEL" --state open --json number --jq '.[0].number // empty')"
if [[ -n "$EXISTING" ]]; then
  echo "Updating existing issue #${EXISTING}"
  gh issue comment -R "$REPO" "$EXISTING" --body "$BODY"
  gh issue edit -R "$REPO" "$EXISTING" --title "$ISSUE_TITLE" --body "$BODY"
else
  echo "Creating new upgrade-reminder issue"
  gh label create "$ISSUE_LABEL" -R "$REPO" --description "Automated upgrade reminders" --color "FBCA04" 2>/dev/null || true
  gh issue create -R "$REPO" --title "$ISSUE_TITLE" --label "$ISSUE_LABEL" --body "$BODY"
fi
