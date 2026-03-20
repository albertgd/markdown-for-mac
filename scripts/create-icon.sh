#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# create-icon.sh — Generates icon.icns from assets/icon.svg
#
# Author:  Albert Garcia Diaz
# Created: 2026-03-20
#
# Requires: sips and iconutil (both built into macOS)
# Usage: bash scripts/create-icon.sh
# -----------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."
ASSETS="$ROOT_DIR/assets"
SVG="$ASSETS/icon.svg"
TMP_PNG="$ASSETS/icon_source_1024.png"
ICONSET="$ASSETS/icon.iconset"
OUTPUT="$ASSETS/icon.icns"

echo "→ Converting SVG to 1024×1024 PNG..."
# Try sips first (macOS 12+), fall back to qlmanage (works on all macOS)
if sips -s format png "$SVG" --out "$TMP_PNG" -z 1024 1024 > /dev/null 2>&1; then
  echo "   (used sips)"
else
  QL_TMP="$(mktemp -d)"
  qlmanage -t -s 1024 -o "$QL_TMP" "$SVG" > /dev/null 2>&1
  cp "$QL_TMP/icon.svg.png" "$TMP_PNG"
  rm -rf "$QL_TMP"
  # Ensure exactly 1024×1024
  sips -z 1024 1024 "$TMP_PNG" > /dev/null 2>&1 || true
  echo "   (used qlmanage)"
fi

echo "→ Generating iconset sizes..."
mkdir -p "$ICONSET"

declare -a ENTRIES=(
  "16   icon_16x16.png"
  "32   icon_16x16@2x.png"
  "32   icon_32x32.png"
  "64   icon_32x32@2x.png"
  "128  icon_128x128.png"
  "256  icon_128x128@2x.png"
  "256  icon_256x256.png"
  "512  icon_256x256@2x.png"
  "512  icon_512x512.png"
  "1024 icon_512x512@2x.png"
)

for entry in "${ENTRIES[@]}"; do
  size=$(echo "$entry" | awk '{print $1}')
  name=$(echo "$entry" | awk '{print $2}')
  sips -z "$size" "$size" "$TMP_PNG" --out "$ICONSET/$name" > /dev/null 2>&1
  echo "   ✓ $name (${size}px)"
done

echo "→ Packaging icon.icns..."
iconutil -c icns "$ICONSET" -o "$OUTPUT"

echo "→ Cleaning up..."
rm -f "$TMP_PNG"
rm -rf "$ICONSET"

echo ""
echo "✓ Done! Icon saved to: assets/icon.icns"
