#!/usr/bin/env bash
# Builds the Chrome extension from the one shared source, trim.user.js.
set -euo pipefail
cd "$(dirname "$0")"
sed '1,/==\/UserScript==/d' trim.user.js > chrome/content.js
v=$(grep -m1 '@version' trim.user.js | awk '{print $3}')
sed -i -E "s/\"version\": \"[0-9.]+\"/\"version\": \"$v\"/" chrome/manifest.json
rm -f "trim-chrome-$v.zip"
(cd chrome && zip -qr "../trim-chrome-$v.zip" manifest.json content.js popup.html popup.js icons)
echo "Built trim-chrome-$v.zip"
