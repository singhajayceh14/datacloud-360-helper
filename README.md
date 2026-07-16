# DataCloud 360 Helper

A delivery console for designing **Salesforce Data Cloud 360** implementations end to end —
source connectors, CSV→data-model mapping, identity resolution, segments, activation,
consumption/entitlements, and the client-facing **BRD/SDD** — with a grounded AI assistant
(Claude or Gemini) that answers from a curated Data 360 reference.

This is a ground-up rebuild of the original single-file console (`reference/console.reference.html`)
on a modern stack.

## Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) + **React 19** |
| Language | **TypeScript** |
| Styling | **Tailwind CSS v4** (design tokens in `src/app/globals.css`) |
| Database | **PostgreSQL** via **Supabase** (transaction pooler) |
| ORM | **Drizzle ORM** + drizzle-kit migrations |
| AI | Anthropic (Claude) + Google (Gemini) via server routes |
| Word export | `docx` |
| Deploy _(optional, later)_ | Vercel |

## Getting started

```bash
npm install
cp .env.example .env.local     # then fill in your values (see below)
npm run db:migrate             # create tables in your Supabase project
npm run dev                    # http://localhost:3000  (redirects to /projects)
```

Node ≥ 20 required.

### Environment

All keys are read server-side from `.env.local` (git-ignored — never committed; this repo is
public). Copy `.env.example` and fill in:

- **Supabase** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, and `DATABASE_URL` (use the **transaction pooler**, port 6543).
- **AI** — at least one of `ANTHROPIC_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY`. The assistant
  prefers Claude whenever its key is present and falls back to Gemini. Optional model overrides:
  `CLAUDE_MODEL` (default `claude-opus-4-8`), `GEMINI_MODEL` (default `gemini-2.0-flash`).

The **Settings** tab shows live connection/provider status so you can confirm everything is wired.

### Scripts

```bash
npm run dev          # dev server (Turbopack)
npm run build        # production build
npm start            # serve the production build
npm run lint         # eslint
npm run db:generate  # generate a Drizzle migration from schema changes
npm run db:migrate   # apply migrations to the database
```

## Features

- **Projects** — create/select the implementation you're designing (active project via cookie).
- **Ingestion** — search the bundled 325-connector catalog by name/release.
- **Data Mapping** — profile a CSV and auto-infer the person-split field mapping (DLO→DMO,
  identity flags).
- **Unification** — derive the identity-resolution match-rule ladder with scenario warnings and
  a segment-readiness check.
- **Segments** — build the segment catalog (objective, criteria, DMOs, cadence, channel, status).
- **Activation** — plan segment→destination activations with cadence-vs-segment and consent
  warnings.
- **Entitlements** — capture order-form caps and run a live consumption calculator vs the credit
  pool.
- **BRD / SDD** — a living solution-design document that aggregates every tab, exportable as
  **Word (.docx)**, **Markdown**, or **PDF** (print).
- **Assistant** — grounded, project-aware AI answering from the Data 360 reference.
- **Settings** — connection & provider diagnostics.

## Project structure

```
src/
  app/                 App Router — one folder per tab (page + client parts + server actions)
    layout.tsx         root shell: sidebar + main
    error.tsx / global-error.tsx / loading.tsx / not-found.tsx   app-wide UX states
    api/               route handlers (ai/ask, brd/export, connectors, mapping/profile)
  components/
    Sidebar.tsx        dark nav sidebar
    ui.tsx             design-system primitives (PageHeader, Card, Pill, Banner, Stub)
  db/
    schema.ts          Drizzle tables (projects, mappings, unifications, segments,
                       activations, entitlements, app_settings)
    index.ts           lazy postgres.js client (prepare:false for the pooler)
    queries/           per-table query modules (server-only)
  lib/
    tabs.ts            navigation model
    ai/                provider-agnostic grounded completion (Claude SDK / Gemini fetch)
    mapping/ unification/ activation/ entitlements/ brd/   domain logic + document builders
drizzle/               generated SQL migrations
reference/             read-only reference for the rebuild (not shipped)
Data/                  handover, migration, and setup docs
```

## Notes

- Domain logic (mapping inference, unification ladder, activation/consumption warnings, the
  BRD builder) is pure and unit-testable, kept separate from DB and UI.
- Every domain tab degrades gracefully: distinct banners for no-database, no-active-project, and
  empty-data states.

See `Data/HANDOVER.md` and `Data/MIGRATION.md` for the full domain background.
