#!/usr/bin/env bash
# Publish an update: everyone's app sees it on next launch and offers "Update".
#   scripts/release.sh 1.2.0 "What changed, one line"
# Bumps the version, builds the signed APK, commits + tags, and creates the GitHub release with the APK attached.
# Needs: the release key in ~/.savings-release (see android/app/build.gradle), gh logged in, a clean git tree.
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION="${1:?usage: scripts/release.sh <version, e.g. 1.2.0> \"<notes>\"}"
NOTES="${2:?add a one-line description of the update}"
[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "version must look like 1.2.0"; exit 1; }
[ -f "$HOME/.savings-release/keystore.properties" ] || { echo "no release key in ~/.savings-release: updates would not install over the old app"; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "commit or stash your changes first"; exit 1; }
git rev-parse -q --verify "refs/tags/v$VERSION" >/dev/null && { echo "v$VERSION already exists"; exit 1; }
# Notes show in everyone's update banner: refuse template text like "<what's new>" or "what changed".
shopt -s nocasematch
case "$NOTES" in *"<"*|*">"*|*"what changed"*|*"what's new"*|"notes"|"") echo "write real release notes in your own words: friends see them in the update banner"; exit 1 ;; esac
shopt -u nocasematch
LAST=$(git describe --tags --abbrev=0 2>/dev/null || true)
# Only the version bump since the last release = nothing new to ship.
if [ -n "$LAST" ] && [ -z "$(git diff --name-only "$LAST" HEAD -- . ':!android/app/build.gradle')" ]; then
  echo "nothing changed since $LAST: make changes before releasing"; exit 1
fi

GRADLE=android/app/build.gradle
CODE=$(( $(sed -n 's/^ *versionCode \([0-9]*\).*/\1/p' "$GRADLE") + 1 ))
sed -i "s/^\( *\)versionCode [0-9]*/\1versionCode $CODE/; s/^\( *\)versionName \"[^\"]*\"/\1versionName \"$VERSION\"/" "$GRADLE"

npm run build
npx cap sync android
export JAVA_HOME="${JAVA_HOME:-C:/Program Files/Java/jdk-21}"   # Gradle 8.14 can't run on Android Studio's JDK 25
(cd android && ./gradlew assembleRelease --console=plain -q)

APK=android/app/build/outputs/apk/release/app-release.apk
OUT="savings-$VERSION.apk"
cp "$APK" "$OUT"

git add "$GRADLE"
git commit -q -m "Release $VERSION"
git tag "v$VERSION"
git push -q origin HEAD "v$VERSION"
gh release create "v$VERSION" "$OUT" --title "Savings $VERSION" --notes "$NOTES"
rm "$OUT"
echo "Published v$VERSION (versionCode $CODE)"
