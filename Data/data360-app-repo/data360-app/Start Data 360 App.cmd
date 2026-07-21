@echo off
REM Data 360 App launcher (Windows). Double-click, or run from a terminal.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install it from https://nodejs.org ^(LTS^), then run this again.
  pause & exit /b 1
)
if not exist client\node_modules (
  echo First run - installing client dependencies...
  pushd client & call npm install --no-audit --no-fund & popd
)
if not exist client\dist (
  echo Building the app...
  pushd client & call npm run build & popd
)
echo Starting Data 360 App at http://127.0.0.1:4370 ...
start "" http://127.0.0.1:4370
node server\src\index.js
