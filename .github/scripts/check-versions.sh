#!/usr/bin/env bash
# Short check: library release drift + Health Connect SDK (connect-client) on Maven.
# Opens / updates a GitHub issue when an upgrade is recommended.
set -euo pipefail

REPO="${GITHUB_REPOSITORY:-solutionforest/AndroidHealthConnect}"
ISSUE_LABEL="upgrade-reminder"
ISSUE_TITLE="Upgrade reminder: newer versions available"
CHANGELOG_URL="https://developer.android.com/jetpack/androidx/releases/health-connect"
MAVEN_META_URL="https://dl.google.com/dl/android/maven2/androidx/health/connect/connect-client/maven-metadata.xml"

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

echo "::group::Fetch connect-client from Google Maven"
MAVEN_XML="$(curl -fsSL "$MAVEN_META_URL")"
# Prefer <latest> (includes alphas). Fall back to <release>, then last <version>.
MAVEN_INFO="$(
  node -e '
    const xml = process.argv[1];
    const latestTag = (xml.match(/<latest>([^<]+)<\/latest>/) || [])[1] || "";
    const releaseTag = (xml.match(/<release>([^<]+)<\/release>/) || [])[1] || "";
    const versions = [...xml.matchAll(/<version>([^<]+)<\/version>/g)].map((m) => m[1]);
    const pick = latestTag || releaseTag || versions[versions.length - 1] || "";
    const recent = versions.slice(-5).reverse();
    process.stdout.write(JSON.stringify({ pick, releaseTag, latestTag, recent }));
  ' "$MAVEN_XML"
)"
LATEST_CONNECT="$(node -e "process.stdout.write(JSON.parse(process.argv[1]).pick||'')" "$MAVEN_INFO")"
RECENT_CONNECT="$(node -e "process.stdout.write((JSON.parse(process.argv[1]).recent||[]).join(', '))" "$MAVEN_INFO")"
echo "Maven latest connect-client: ${LATEST_CONNECT:-unknown}"
echo "Recent: ${RECENT_CONNECT}"
echo "::endgroup::"

NOTES=()
NEEDS_REMINDER=0

if [[ -n "$LATEST_TAG" ]]; then
  if [[ "$PACKAGE_VERSION" != "$LATEST_TAG" ]]; then
    NEEDS_REMINDER=1
    NOTES+=("- **Library:** \`package.json\` is \`${PACKAGE_VERSION}\`, latest GitHub release is \`${LATEST_TAG}\`. ${LATEST_URL}")
  else
    NOTES+=("- **Library:** matches latest release (\`${PACKAGE_VERSION}\`).")
  fi
else
  NOTES+=("- **Library:** no GitHub release found to compare.")
fi

if [[ -n "$LATEST_CONNECT" && -n "$CONNECT_CLIENT_VERSION" ]]; then
  if [[ "$CONNECT_CLIENT_VERSION" != "$LATEST_CONNECT" ]]; then
    NEEDS_REMINDER=1
    NOTES+=("- **Health Connect SDK:** \`android/build.gradle\` uses \`connect-client:${CONNECT_CLIENT_VERSION}\`; Maven latest is \`${LATEST_CONNECT}\`.")
    NOTES+=("  - Changelog: ${CHANGELOG_URL}")
    NOTES+=("  - Recent Maven versions: ${RECENT_CONNECT}")
  else
    NOTES+=("- **Health Connect SDK:** up to date (\`${CONNECT_CLIENT_VERSION}\`).")
  fi
fi

BODY="$(printf '%s\n' \
  '## Upgrade reminder' \
  '' \
  'Short scheduled check found version drift.' \
  '' \
  "${NOTES[@]}" \
  '' \
  '### Suggested actions' \
  '1. Read the [Health Connect release notes]('"${CHANGELOG_URL}"').' \
  '2. Bump `connect-client` in `android/build.gradle` (and `release/0.2.x` if the stable line should move).' \
  '3. Cut a library release and tell app consumers to upgrade.' \
  '' \
  "Detected at: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  '' \
  '_Maintained by `.github/workflows/version-check.yml`._'
)"

echo "::group::Summary"
printf '%s\n' "${NOTES[@]}"
echo "needs_reminder=${NEEDS_REMINDER}"
echo "::endgroup::"

# Always emit a short job summary for the Actions UI.
{
  echo "## Version check"
  printf '%s\n' "${NOTES[@]}"
  if [[ "$NEEDS_REMINDER" -eq 0 ]]; then
    echo
    echo "✅ No upgrade needed."
  else
    echo
    echo "⚠️ Reminder issue will be opened/updated."
  fi
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"

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
  gh issue edit -R "$REPO" "$EXISTING" --title "$ISSUE_TITLE" --body "$BODY"
  gh issue comment -R "$REPO" "$EXISTING" --body "$BODY"
else
  echo "Creating new upgrade-reminder issue"
  gh label create "$ISSUE_LABEL" -R "$REPO" --description "Automated upgrade reminders" --color "FBCA04" 2>/dev/null || true
  gh issue create -R "$REPO" --title "$ISSUE_TITLE" --label "$ISSUE_LABEL" --body "$BODY"
fi
