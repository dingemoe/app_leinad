#!/usr/bin/env bash
set -euo pipefail

# Manual version bumping script
# Usage: ./version.sh [major|minor|patch]
# Default: patch

VERSION_FILE="VERSION"
TYPE="${1:-patch}"

# Les nåværende versjon
if [[ -f "$VERSION_FILE" ]]; then
  current="$(cat "$VERSION_FILE" | tr -d ' \n\r')"
else
  current="0.0.0"
fi

IFS='.' read -r MA MI PA <<<"${current:-0.0.0}"

case "$TYPE" in
  "major")
    MA=$(( MA + 1 ))
    MI=0
    PA=0
    ;;
  "minor")
    MI=$(( MI + 1 ))
    PA=0
    ;;
  "patch")
    PA=$(( PA + 1 ))
    ;;
  *)
    echo "Usage: $0 [major|minor|patch]"
    echo "Current version: v${current}"
    exit 1
    ;;
esac

new="$MA.$MI.$PA"
printf "%s\n" "$new" > "$VERSION_FILE"

echo "📦 Version manually bumped: v${current} → v${new} (${TYPE})"
echo "💡 Next commit will auto-update JS files and create tag v${new}"