# Data 360 App — Developer Handover

_Last updated: 2026-07-16 · Owner: Saurabh (saurabh@icreon.com) · Audience: engineer joining the build_

This document gets a new engineer productive on **data360-app** fast. Read it, then `README.md` (run/setup) and `MIGRATION.md` (the remaining work). It assumes you're comfortable with Node and React but new to this codebase and to Salesforce Data 360.

---

## 1. What this is, in one paragraph

Icreon consultants deliver Salesforce **Data 360** (formerly Data Cloud) implementations. This app is the tool they use to design one end to end: pick source connectors, map client CSV exports to the Data 360 data model, design identity resolution, plan segments and activations, size credit consumption, and produce the **BRD/SDD** (the client-facing solution-design document). It also has a **grounded AI assistant** (Claude or Gemini, consultant's own API key) that answers from a curated Data 360 reference.

It is a **rebuild** of an older tool (`../_console/`, a single 836 KB `console.html` + a Node `server.js`) into a proper **React + Node** app that installs and runs locally. Our job is to finish that rebuild.

---

## 2. Why the architecture is what it is (decisions already made)

These were deliberate calls — please don't re-litigate them without a reason:

- **Local Node server + React, not Electron/Tauri, not a hosted server.** Saurabh wants each team member to run it on their own machine (`npm start` → browser). We considered a shared server but rejected it: the old server ran arbitrary shell over an HTTP endpoint (fine on localhost, an RCE if exposed). The new backend has **no shell endpoint at all** — only typed, path-scoped file operations.
- **Backend has zero npm dependencies.** Just `node:http`, `node:sqlite`, and global `fetch`. Keeps install trivial and the attack surface tiny. Please keep it dependency-free unless there's a strong reason.
- **Markdown files are the source of truth; SQLite is only an index.** This is the single most important constraint — see §5. Do not move project data into SQLite.
- **Provider-agnostic AI via BYO key.** One `ask()` that targets Claude *or* Gemini. Keys live server-side only.
- **Grounding is injected into every AI call** so both providers answer from identical ground truth.

---

## 3. Repo layout

```
data360-app/
├─ Start Data 360 App.command / .cmd   launchers (install → build → run)
├─ package.json                        root convenience scripts
├─ README.md                           setup + run
├─ MIGRATION.md                        the remaining work, tab by tab
├─ HANDOVER.md                         this file
├─ server/                             backend — zero deps
│  ├─ package.json
│  ├─ src/index.js                     HTTP server, route table, static serving
│  ├─ src/config.js                    settings + paths + key storage
│  ├─ src/db.js                        SQLite index (node:sqlite) w/ graceful fallback
│  └─ src/services/
│     ├─ projects.js                   markdown project store (CRUD, path safety)
│     ├─ markdown.js                   console:xxx block parse/serialize — INTEROP
│     ├─ grounding.js                  builds the grounded system prompt
│     ├─ ai.js                         ask() → Anthropic or Gemini via fetch
│     └─ connectors.js                 catalog search
│  └─ data/                            bundled assets (git-tracked) + local state (git-ignored)
│     ├─ grounding.md                  ~49 KB Data 360 reference (ground truth)
│     ├─ connectors.json               325 connectors
│     ├─ settings.local.json           provider/keys/projectsDir  (git-ignored)
│     ├─ grounding.extra.md            "Add knowledge" appends here (git-ignored)
│     └─ index.sqlite                  the index (git-ignored, regenerated)
└─ client/                             React (Vite)
   ├─ vite.config.js                   dev proxy /api → :4370; build → dist/
   └─ src/
      ├─ App.jsx                       shell: sidebar, project selector, tab router
      ├─ lib/api.js                    the only place that talks to the backend
      └─ components/                   Projects, Ingestion, Assistant, Settings, Stub
```

`../_console/console.html` is the **reference implementation** — every feature we still need to port already works there. Keep it open while porting.

---

## 4. How to run (dev loop)

Requirements: **Node ≥ 18**, **≥ 22.5 recommended** (that's when `node:sqlite` ships; below it the app runs index-free via a markdown scan — functionally fine).

```bash
# one time
cd data360-app/client && npm install

# two-terminal dev loop
npm run dev:server     # from data360-app/ — Node API on :4370, --watch reload
npm run dev:client     # from data360-app/ — Vite on :5173, proxies /api to :4370
# open http://127.0.0.1:5173

# production-style (what testers run)
npm run build          # builds client/dist
npm start              # server serves dist + API on :4370
```

Backend has no build step and no deps — just run it. Health check: `GET http://127.0.0.1:4370/api/health`.

---

## 5. The interop contract (read this twice)

The old console, this app, and the `datacloud-360` Claude skill all read/write the **same files**. A consultant might edit a project in the app, then have a Claude session continue it, then open the old console — all on the same markdown. **Do not break this.**

- A project is a folder under the projects dir: `project-state.md` + `01-sources/ 02-mappings/ 03-deliverables/ 04-entitlements/ 05-deploy/`.
- Structured data is embedded in markdown as blocks:
  - Paired: `<!-- console:MARKER -->` … `<!-- /console:MARKER -->` (used inside numbered BRD/SDD sections).
  - Standalone JSON: `<!-- console:segjson` newline `{…json…}` newline `-->`.
- All parsing/serializing goes through `server/src/services/markdown.js` — `readPairedBlock`, `readJsonBlock`, `upsertSectionBlock`, `jsonBlock`, `parseFirstTable`, `parseBulletMeta`. These mirror the old console's functions byte-for-byte. **When you add a feature that persists data, use these helpers**, don't hand-roll block writing.
- Round-trip test whenever you touch persistence: open an existing `NorthPeak Retail (Demo)` file, edit it in the app, and confirm the markdown diff is minimal and the old console still parses it.

Projects live in the **parent of `data360-app`** by default (i.e. `Data Cloud Claude/`), so the existing `NorthPeak Retail (Demo)` and `Alpine-Demo` projects show up immediately. Overridable in Settings.

---

## 6. Backend API (the whole surface)

Defined as a route table in `server/src/index.js`. `:name` is a URL-encoded project name.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | status: index on/off, grounding size, AI readiness |
| GET/POST | `/api/settings` | read (masked keys) / update provider, keys, models, projectsDir |
| GET | `/api/projects` | list (light metadata parsed from `project-state.md`) |
| POST | `/api/projects` | create `{name, client}` — scaffolds the folder tree |
| GET | `/api/projects/:name` | project metadata + file list |
| POST | `/api/projects/:name/read` | `{relpath}` → file content |
| POST | `/api/projects/:name/write` | `{relpath, content}` |
| POST | `/api/projects/:name/upload?relpath=` | raw body → binary file (CSV uploads) |
| GET | `/api/projects/:name/context` | project aggregated for AI context |
| GET | `/api/connectors?q=` | connector catalog search |
| GET | `/api/grounding` | grounding text + meta |
| POST | `/api/grounding/knowledge` | `{note, author}` → append to grounding.extra.md |
| GET | `/api/ai/status` | provider + which keys are set |
| POST | `/api/ai/ask` | `{messages, project?, provider?}` → grounded completion |
| GET/POST | `/api/feedback`, GET `/api/ai/history` | index-backed (no-op if SQLite off) |

Frontend never calls `fetch` directly — everything goes through `client/src/lib/api.js`. Add new endpoints there too.

**Path safety:** `projects.safeProjectPath()` refuses anything outside a project folder. Any new file op must go through it. Never interpolate user input into a filesystem path without it.

---

## 7. The AI layer

- `server/src/services/ai.js` — `ask({messages, projectContext, provider})`. Picks provider from settings, pulls the BYO key, builds the system prompt via `grounding.systemPrompt(projectContext)`, and calls Anthropic's Messages API or Gemini's `generateContent` with plain `fetch`. No SDKs.
- Both providers get the **same** system prompt = grounding + (optional) current project context. That's what keeps answers consistent across providers.
- Keys: stored in `settings.local.json`, returned to the UI **masked** (`publicSettings()`), never raw. Don't add an endpoint that echoes a raw key.
- Default models are in `config.js` (`claude-sonnet-5`, `gemini-2.0-flash`) and user-overridable in Settings. Verify current model strings when you touch this.

---

## 8. What's done vs. what's left

**Done and working:** Projects (create/open/list from markdown), Ingestion (connector search), Assistant (grounded, project-aware, provider-switchable), Settings, SQLite index with graceful fallback, the full backend API and interop layer.

**Left — the bulk of the work.** Six domain tabs currently render their project files read-only via `components/Stub.jsx`. Each needs its real UI ported from `console.html`: **Data Mapping, Unification, Segments, Activation, Entitlements, BRD/SDD**. `MIGRATION.md` has the recommended order, the source functions to lift, and the old→new API mapping. Recommended first tab: **Data Mapping** (front of the delivery flow; needs a CSV-profiler endpoint).

Also deferred by design: live Salesforce org check (old `/api/org`, needs the `sf` CLI), Word/PDF export of the BRD/SDD, and diagram rendering. All noted in MIGRATION.md.

---

## 9. Conventions & gotchas

- **Keep the backend dependency-free.** If you think you need a package, check whether a `node:` builtin or `fetch` covers it first.
- **Port pure logic into `server/src/services/<tab>.js`, keep React components thin.** Calculators, markdown builders, and warning logic are easier to test server-side.
- **`node:sqlite` is experimental** and prints a warning — expected. It also failed with "disk I/O error" in one sandboxed test environment; the code already falls back to a markdown scan, so the app never hard-fails on it. On a normal local disk it works.
- **ESM everywhere** (`"type": "module"`). Use `import`, not `require`.
- **Two ports:** API `4370`, Vite dev `5173`. The old console used `4360` — both can run side by side.
- Git-ignored: `node_modules/`, `client/dist/`, and everything user-specific in `server/data/` (keys, index, extra grounding). The bundled `grounding.md` and `connectors.json` **are** tracked.
- The grounding is the product's spine. If Data 360 platform facts change, update `server/data/grounding.md` (and keep it in sync with `../_console/grounding.md` and the skill's copy).

---

## 10. Suggested division of work

The tabs are largely independent, so two people can parallelize cleanly:

- **Person A:** Data Mapping → Unification (they share the identity-field concepts; Mapping feeds Unification).
- **Person B:** Segments → Activation → Entitlements (Segments feeds Activation; Entitlements is standalone).
- **Then together:** BRD/SDD, which aggregates all of the above via `upsertSectionBlock`, plus Word/PDF export.

Coordinate on `markdown.js` and `api.js` (shared surfaces) and on the `console:` markers so files stay interoperable.

---

## 11. Context you may want

- `../HANDOVER.md` — the original toolkit handover (broader system, the local console, the skill).
- `../_console/console.html` — reference implementation for every unported feature.
- `../_console/grounding.md` — the same grounding, in its original home.
- `../NorthPeak Retail (Demo)/` — a complete worked project to test against.
- The `datacloud-360` skill (`../.claude/skills/datacloud-360/`) — the AI-side counterpart; shares the file formats.

Questions that only Saurabh can answer (org access, client specifics, priorities) should go to him. Everything about *how the code works* is in this doc, the README, and MIGRATION.md.
