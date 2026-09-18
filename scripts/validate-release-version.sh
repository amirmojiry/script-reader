#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

version="$(tr -d '[:space:]' < VERSION)"
semver_re='^[0-9]+\.[0-9]+\.[0-9]+$'

if [[ ! "$version" =~ $semver_re ]]; then
  echo "VERSION must be strict MAJOR.MINOR.PATCH SemVer; got: $version" >&2
  exit 1
fi

for changelog in CHANGELOG.en.md CHANGELOG.fa.md; do
  if ! grep -Eq "^## \[$version\] - [0-9]{4}-[0-9]{2}-[0-9]{2}$" "$changelog"; then
    echo "$changelog is missing a dated section for VERSION $version" >&2
    exit 1
  fi
done

read_version_from_ref() {
  local ref="$1"
  local candidate
  if candidate="$(git show "$ref:VERSION" 2>/dev/null | tr -d '[:space:]')" && [[ "$candidate" =~ $semver_re ]]; then
    printf '%s' "$candidate"
  else
    printf '0.0.0'
  fi
}

base_version="0.0.0"
if [[ -n "${RELEASE_BASE_REF:-}" ]]; then
  if [[ "$RELEASE_BASE_REF" != "0.0.0" ]]; then
    if ! git rev-parse --verify "$RELEASE_BASE_REF^{commit}" >/dev/null 2>&1; then
      echo "RELEASE_BASE_REF is not available in the checkout: $RELEASE_BASE_REF" >&2
      exit 1
    fi
    base_version="$(read_version_from_ref "$RELEASE_BASE_REF")"
  fi
elif [[ "${GITHUB_REF:-}" == "refs/heads/master" ]] && [[ "${GITHUB_EVENT_NAME:-}" == "push" || "${GITHUB_EVENT_NAME:-}" == "workflow_dispatch" ]]; then
  if git rev-parse --verify HEAD^ >/dev/null 2>&1; then
    base_version="$(read_version_from_ref HEAD^)"
  fi
elif git rev-parse --verify origin/master >/dev/null 2>&1; then
  base_version="$(read_version_from_ref origin/master)"
fi

version_gt() {
  local lhs="$1" rhs="$2"
  local lmaj lmin lpat rmaj rmin rpat
  IFS=. read -r lmaj lmin lpat <<<"$lhs"
  IFS=. read -r rmaj rmin rpat <<<"$rhs"
  (( lmaj > rmaj )) && return 0
  (( lmaj < rmaj )) && return 1
  (( lmin > rmin )) && return 0
  (( lmin < rmin )) && return 1
  (( lpat > rpat ))
}

if ! version_gt "$version" "$base_version"; then
  echo "VERSION $version must be greater than base version $base_version" >&2
  exit 1
fi

echo "Release version validation passed: $base_version -> $version"
