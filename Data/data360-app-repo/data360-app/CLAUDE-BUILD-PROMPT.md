# Build prompt for Claude — replicate the console into the React/Node app

Paste the block below to Claude (Claude Code, run from the repo root of `data360-app`). It has full file access, so it can read the reference and the existing scaffold. Work through it tab by tab; don't try to do everything in one pass.

The reference UI+logic is pinned in this repo at **`reference/console.reference.html`** (the original single-file console, ~836 KB, self-contained). The live original also still runs from `../_console/` via its launcher if you want to click around it.

---

## THE PROMPT (copy from here down)

You are finishing a rebuild of the **Data 360 Delivery Console**. The original is a single-file app at `reference/console.reference.html` (HTML + inline JS, ~836 KB). It has already been re-architected into a **React frontend + zero-dependency Node backend** in this repo. Your job: **replicate the original's entire UI and logic into the new app**, tab by tab, so the new app looks and behaves identically — same layout, same styling, same features, same outputs — while using the new architecture.

### First, read these (in order)
1. `HANDOVER.md` — architecture, decisions, conventions. **§5 (interop contract) is a hard constraint.**
2. `MIGRATION.md` — the tab-by-tab plan and the old→new API mapping.
3. `README.md` — how to run (`npm run dev:server` + `npm run dev:client`).
4. `reference/console.reference.html` — the UI+logic you are replicating. This is the source of truth for *appearance and behaviour*.
5. `server/src/services/*.js` and `client/src/**` — the scaffold you're extending.

### Non-negotiable constraints
- **Markdown is the source of truth.** Projects are folders of markdown; structured data lives in `<!-- console:MARKER -->…<!-- /console:MARKER -->` blocks and standalone `console:segjson` JSON. Persist ONLY through `server/src/services/markdown.js` helpers so files stay byte-compatible with the original console and the `datacloud-360` skill. After any persistence change, round-trip test against `../NorthPeak Retail (Demo)`: edit in the app, confirm the markdown diff is minimal and the original console still parses it.
- **Backend stays dependency-free** — `node:http`, `node:sqlite`, global `fetch` only. No new npm packages server-side without explicit sign-off.
- **All backend calls go through `client/src/lib/api.js`.** No `fetch` scattered in components. Add new endpoints to the route table in `server/src/index.js` and to `api.js`.
- **Path safety:** every filesystem op goes through `projects.safeProjectPath()`. Never interpolate user input into a path directly.
- **AI is provider-agnostic** (`server/src/services/ai.js`, `ask()`), grounded via `grounding.systemPrompt()`. Any AI feature (e.g. Activation "AI insights", mapping suggestions) calls `ask()`; it works for both Claude and Gemini. Keys stay server-side.
- **Visual parity:** match the original's Icreon look — primary blue `#386AFF`, the Hero New / system font stack, hairline borders, grouped cards, the header action bar, GA/Beta pills. Extract the original's CSS where practical rather than re-inventing spacing.
- **Put pure logic in `server/src/services/<tab>.js`** (calculators, markdown builders, warnings, diagram data). Keep React components thin (render + calls).

### Transport mapping (the original used a different backend)
The original talked to a local server via `sh()`/`api('/api/bash')`/`api('/api/write')`. The new API is typed and file-scoped — see the table in `MIGRATION.md §"Transport mapping"`. In short: reads → `POST /api/projects/:name/read`; writes → `POST /api/projects/:name/write`; uploads → `POST /api/projects/:name/upload?relpath=`; AI → `POST /api/ai/ask`. The original's `/api/org` (live Salesforce check) is intentionally dropped for now — stub it or add it behind a flag; don't block on it.

### Tabs to replicate (each is a `<panel-*>` in the reference; currently a read-only Stub)
Match features AND appearance for each:

1. **Canvas** (`panel-canvas`) — the project home: grouped sections, the credit/consumption overlay, scenarios, and the work queue. This is the landing view once a project is open.
2. **Ingestion** (`panel-ingest`) — connector search (already working — extend it) PLUS the branded **architecture diagram** (all systems → Data 360, downloadable SVG), the auto business write-up, business-objectives capture, source inventory, and per-system sub-tabs with a system→Data 360 diagram.
3. **Data Mapping** (`panel-mapping`) — per-system sub-tabs; **CSV import + auto-map** to DLOs/DMOs with the correct person split (IDs→Party Identification, emails→Contact Point Email, consent→Communication Subscription); **field-flow lineage diagrams** (with ✕/Esc to exit), the ✎ **inline editor**, and volume capture. Output: `02-mappings/<file>-mapping.md`. You'll likely need a CSV-profiler endpoint (or profile client-side and POST the mapping markdown).
4. **Unification** (`panel-unify`) — identity-resolution designer: derive match-rule ladder from mapping identity fields, reconciliation rules, the profile-vs-transaction explainer, the breaking scenarios (shared inboxes, PII-less feeds, guest checkout), segment-readiness check, and the ruleset diagram. Output: `03-deliverables/<project>-unification-design.md` + BRD/SDD §6.
5. **Segments** (`panel-seg`) — segment catalog (objective/criteria/DMOs/CI/cadence/channel/status), calculated-insights list, persisted as a `console:segjson` block. Output: `03-deliverables/segment-catalog.md`.
6. **Activation** (`panel-act`) — target registry, per-target mini-diagrams, the ✨ **AI insights** (via `ask()`), and cadence-vs-segment / consent **warnings**. Output: `03-deliverables/activation-plan.md`.
7. **Entitlements** (`panel-ent`) — order-form capture (the original does PDF-text autofill — reproduce or degrade gracefully) and the **consumption calculator** on the official July-2025 rate card (Profile Unification 100k credits/1M rows; the Sept-2025 Data Services merge), with runway-vs-entitlement warnings. Output: `04-entitlements/entitlements.md`.
8. **How-to** (`panel-howto`) — the guidance tab plus **＋ Add knowledge → grounding** (already wired: `POST /api/grounding/knowledge`).

### Header actions (top bar in the reference)
Replicate: **⬇ BRD**, **⬇ SDD** (generate/download the living doc; sections 4/5/6/9 auto-sync from the tabs via `markdown.upsertSectionBlock`; add **Word/.doc export** as the original did), **⑂ Scenario** (fork a what-if copy of the project), **⇧ Deploy pack** (bundle deliverables), **💬 Feedback** (already index-backed via `/api/feedback`).

### Per-tab workflow
1. Open the tab's markup + functions in `reference/console.reference.html` (search `panel-<id>` and the related render/save functions).
2. Move the pure logic into `server/src/services/<tab>.js`; expose it via a new route if needed.
3. Build the React component under `client/src/components/`, replacing the Stub in `client/src/App.jsx`. Read via `api.readFile`, write via `api.writeFile`, use `markdown.js` for all blocks.
4. Match the original's styling (lift CSS into `client/src/styles.css`).
5. **Acceptance:** visual parity with the reference; round-trip clean against NorthPeak; feature works for both AI providers where AI is involved; backend still dependency-free.

### Order of work
Data Mapping → Unification → Segments → Activation → Entitlements → Canvas → Ingestion diagrams → BRD/SDD + exports. Commit per tab. Ask me (the human) only for things code can't answer — org access, client specifics, priorities.

_(end of prompt — everything below is for Saurabh, not Claude)_

---

## Notes for you (Saurabh), not part of the prompt

- **The reference HTML is the *target*, not a drop-in.** `reference/console.reference.html` is wired to the *old* server's API, so it won't function if you just serve it from the new Node app — but it renders its full UI (in degraded mode) when opened directly, which is exactly what Claude and your partner need as the visual/logic spec. To click a fully-working original, run `../_console/` via its launcher.
- **What to commit to Git:** the whole `data360-app/` folder. `.gitignore` already excludes `node_modules/`, `client/dist/`, and your local keys/index. The `reference/`, `server/data/grounding.md`, and `connectors.json` **are** tracked so the repo is self-contained.
- **Keep grounding in sync:** if you update `server/data/grounding.md`, mirror it to `../_console/grounding.md` and the skill copy.
- Give Claude one tab at a time for best results; the prompt tells it the order and to commit per tab.
