#!/bin/bash
# Data 360 App launcher (macOS/Linux). Double-click, or run in a terminal.
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install it from https://nodejs.org (LTS), then run this again."
  read -p "Press Enter to close."; exit 1
fi
if [ ! -d client/node_modules ]; then
  echo "First run — installing client dependencies…"
  (cd client && npm install --no-audit --no-fund) || { echo "npm install failed"; read -p "Press Enter."; exit 1; }
fi
if [ ! -d client/dist ]; then
  echo "Building the app…"
  (cd client && npm run build) || { echo "build failed"; read -p "Press Enter."; exit 1; }
fi
echo "Starting Data 360 App at http://127.0.0.1:4370 …"
( sleep 1.5; command -v open >/dev/null && open http://127.0.0.1:4370 || true ) &
node server/src/index.js
