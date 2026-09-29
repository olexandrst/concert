#!/usr/bin/env bash
# Збирає статичний сайт для GitHub Pages у вказану папку (за замовчуванням _site).
set -euo pipefail

out="${1:-_site}"
root="$(cd "$(dirname "$0")/.." && pwd)"
src="$root/student-cabinet"

rm -rf "$out"
mkdir -p "$out"
cp "$src/web/index.html" "$src/web/dc-lite.js" "$out/"
cp "$src/project/Main.dc.html" "$out/app.dc.html"
touch "$out/.nojekyll"
echo "Сайт зібрано в $out"
