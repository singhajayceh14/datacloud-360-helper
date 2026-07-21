# Migration roadmap — console.html → React app

The original console (`_console/console.html`, ~836 KB single file) is the reference implementation. All the domain logic already exists and is proven; porting is mostly **lifting each feature's logic into a React component and pointing its reads/writes at the new API** instead of the old `/api/bash` + `/api/write` transport.

## What's already done
| Area | Status | Where |
|---|---|---|
| Project store (markdown), create/open/list | ✅ | `server/services/projects.js`, `client/components/Projects.jsx` |
| `console:xxx` block parse/serialize (interop) | ✅ | `server/services/markdown.js` |
| Connector catalog search | ✅ | `server/services/connectors.js`, `client/components/Ingestion.jsx` |
| Grounded AI (Claude + Gemini, project-aware) | ✅ | `server/services/ai.js` + `grounding.js`, `client/components/Assistant.jsx` |
| Settings (provider, keys, models, projects dir) | ✅ | `server/config.js`, `client/components/Settings.jsx` |
| SQLite index + feedback/chat tables | ✅ | `server/db.js` |

## Transport mapping (old → new)
The old page issued shell/file ops through the local server. In the app, use the API instead:

| Old call | New API |
|---|---|
| `sh('cat …')`, `readFirst(globs)` | `POST /api/projects/:name/read {relpath}` |
| `api('/api/write', {path, content})` | `POST /api/projects/:name/write {relpath, content}` |
| `sh('ls …')`, project discovery | `GET /api/projects`, `GET /api/projects/:name` |
| upload CSV | `POST /api/projects/:name/upload?relpath=…` (raw body) |
| `api('/api/ask', {prompt})` | `POST /api/ai/ask {messages, project}` |
| org check (`/api/org`) | intentionally dropped (needs sf CLI; add later if wanted) |

## Tabs to port (in recommended order)
Each is a self-contained component today showing the project's files read-only (`components/Stub.jsx`). Replace with the real UI.

1. **Data Mapping** — import a CSV (`upload`), profile it, auto-draft a DLO→DMO field mapping. Source: the `autoMap` / profiling + the field-flow diagram renderer in console.html. Person-split rules (IDs→Party Identification, emails→Contact Point Email, consent→Communication Subscription) are in the grounding and in the existing mapping markdown — keep them. Output: `02-mappings/<file>-mapping.md`. **New server work:** a CSV profiler endpoint (or profile client-side and POST the mapping markdown).

2. **Unification** — derive the match-rule ladder from mapping identity fields; reconciliation rules; scenario checks (shared inboxes, PII-less feeds, guest checkout); segment-readiness. Source: the unification designer in console.html. Output: `03-deliverables/<project>-unification-design.md` + BRD/SDD §6.

3. **Segments** — segment catalog with objective/criteria/DMOs/CI/cadence/channel/status. Source: `segCatalogMd()` / `SEGS` array in console.html; persists as a `console:segjson` block (already supported by `markdown.jsonBlock`). Output: `03-deliverables/segment-catalog.md`.

4. **Activation** — target registry + activation plan; cadence-vs-segment and consent warnings (`actWarnings()` in console.html). Output: `03-deliverables/activation-plan.md`.

5. **Entitlements** — order-form capture + the consumption **calculator** on the official July-2025 rate card (Profile Unification 100k credits/1M rows; Sept-2025 Data Services merge). Source: the calculator logic in console.html. Output: `04-entitlements/entitlements.md`.

6. **BRD / SDD** — the living doc. Sections 4/5/6/9 auto-sync via `upsertSectionBlock` (already ported to `markdown.js`) from the tabs above; hand-written prose is preserved. Add **Word (.doc) export** (the old page built a `.doc`; reuse that serializer). Output: `03-deliverables/<project>-BRD.md` (+ export).

## Suggested porting workflow (per tab)
1. Open `_console/console.html`, find the tab's render + save functions.
2. Move the pure logic (calculations, markdown builders, warnings) into `server/services/<tab>.js` — it's easier to unit-test there and keeps components thin.
3. Build the React component; read via `api.project()/readFile`, write via `api.writeFile`.
4. Reuse `markdown.js` for all `console:xxx` blocks so files stay interoperable.
5. Verify round-trip: open an existing NorthPeak file, edit in the app, confirm the markdown diff is clean and the old console still reads it.

## Nice-to-haves later
- Field-flow / architecture **diagrams** (the old SVG renderers) — port as an SVG React component or reuse the `icreon-diagrams` skill output.
- **Word/PDF export** for BRD/SDD.
- Optional **live org check** via a bundled `sf` call (re-add `/api/org`).
- Embedding-based grounding retrieval when `grounding.md` outgrows the context window.
