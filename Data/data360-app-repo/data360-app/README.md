# Data 360 App

A local, installable rebuild of the Data 360 Delivery Console as a **React frontend + Node backend**. Team members run it on their own machine, do a full project run (ingestion → mapping → unification → segments → activation → entitlements → BRD/SDD), and get grounded AI help from **Claude or Gemini** using their own API key.

This is the successor to `_console/` (single-file HTML + `server.js`). It keeps the same on-disk format — **projects are folders of markdown** — so it stays fully interoperable with the existing projects, the local console, and the `datacloud-360` Claude skill.

## Requirements
- **Node.js** — v18+ works; **v22.5+** recommended so the fast SQLite index turns on (otherwise it falls back to a markdown scan, which is fine for a few projects).
- No database server, no Docker, no build tooling to install globally. The backend has **zero npm dependencies**; only the React client uses Vite/React.

## Run it
**Easiest:** double-click **`Start Data 360 App.command`** (macOS) or **`Start Data 360 App.cmd`** (Windows). First launch installs client deps, builds the app, then opens http://127.0.0.1:4370.

**Manually:**
```bash
npm run setup     # installs client dependencies (one time)
npm run build     # builds the React app
npm start         # serves app + API at http://127.0.0.1:4370
```

**While developing the UI:** run `npm run dev:server` and `npm run dev:client` in two terminals; Vite serves the client on :5173 and proxies the API to :4370.

## First-time setup in the app
1. Open **Settings** → pick your provider (Anthropic or Gemini), paste your API key, save. Keys are stored in `server/data/settings.local.json` on your machine and are only ever used server-side — never sent to the browser, never committed.
2. Set the **Projects folder** if you want projects stored somewhere other than the default (the folder that contains `data360-app`).
3. Go to **Projects** → create one, or open the bundled **NorthPeak Retail (Demo)**.

## Architecture
```
data360-app/
├─ server/                 Node backend (zero deps: node:http, node:sqlite, fetch)
│  ├─ src/index.js         HTTP server + JSON API + serves the built client
│  ├─ src/config.js        settings + paths (projects dir, keys, provider)
│  ├─ src/db.js            SQLite index over the markdown (graceful fallback)
│  └─ src/services/
│     ├─ projects.js       markdown project store (source of truth)
│     ├─ markdown.js       console:xxx block parse/serialize (interop)
│     ├─ grounding.js      builds the grounded system prompt every AI call uses
│     ├─ ai.js             provider-agnostic ask() → Claude or Gemini
│     └─ connectors.js     325-connector catalog search
│  └─ data/                bundled grounding.md + connectors.json (+ local settings)
└─ client/                 React (Vite)
   └─ src/components/       Projects, Ingestion, Assistant, Settings + tab stubs
```

**Data model.** Every project is a folder: `project-state.md` + `01-sources/ 02-mappings/ 03-deliverables/ 04-entitlements/ 05-deploy/`. Structured data is embedded in markdown as `<!-- console:MARKER --> … <!-- /console:MARKER -->` blocks (and standalone `console:segjson` JSON), byte-compatible with the old console. SQLite only indexes/caches this for speed.

**Grounding.** `server/data/grounding.md` (~49 KB) is injected into the system prompt on every AI call, so Claude and Gemini answer from identical ground truth. The **Add knowledge** flow appends to `grounding.extra.md`. When grounding outgrows the context window, replace `grounding.injectFor()` with embedding-based retrieval — nothing else changes.

## Status
Working today: Projects (create/open/list from markdown), Ingestion (connector search), Assistant (grounded chat, project-aware, provider-switchable), Settings, and read-only file views for the remaining tabs. The domain tabs (Mapping, Unification, Segments, Activation, Entitlements, BRD/SDD) are being ported from `_console/console.html` — see **MIGRATION.md**.
