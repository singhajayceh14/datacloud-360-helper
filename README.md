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
| Framework | **Next.js 16** (App Router) + **React 19** |
| Language | **TypeScript** |
| Styling | **Tailwind CSS v4** (design tokens in `src/app/globals.css`) |
| Database _(Phase 1)_ | **PostgreSQL** via **Supabase** (+ Storage + Auth) |
| ORM _(Phase 1)_ | Drizzle ORM |
| AI _(Phase 2)_ | Anthropic (Claude) + Google (Gemini) via server routes |
| Deploy _(optional, later)_ | Vercel |

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000  (redirects to /projects)
npm run build    # production build
npm start        # run the production build
```

Node ≥ 20 required.

## Project structure

```
src/
  app/                 App Router pages — one folder per tab
    layout.tsx         root shell: sidebar + main
    projects/ ingestion/ mapping/ unification/ segments/
    activation/ entitlements/ brd/ assistant/ settings/
  components/
    Sidebar.tsx        dark nav sidebar
    ui.tsx             design-system primitives (PageHeader, Card, Pill, Stub)
  lib/
    tabs.ts            navigation model
reference/             read-only reference for the rebuild (not shipped)
  console.reference.html   the original 836 KB working console (UI + logic spec)
  grounding.md             Data 360 knowledge base (ground truth for the AI)
  connectors.json          the 325-connector catalog
  sample-projects/         a complete worked project (NorthPeak Retail) for testing
  original-ui/             the earlier React scaffold, for design reference
Data/                  handover, migration, and setup docs
```

## Build phases

| Phase | Focus |
|---|---|
| **0** ✅ | Foundation — Next.js + TS + Tailwind scaffold, design system, app shell |
| **1** | Shell & Projects — Supabase/Postgres, project CRUD, settings |
| **2** | AI Assistant — grounded Claude/Gemini chat |
| **3** | Ingestion — connector catalog + CSV upload |
| **4–9** | Domain tabs — Data Mapping, Unification, Segments, Activation, Entitlements, BRD/SDD |
| **10** | Harden & ship |

See `Data/HANDOVER.md` and `Data/MIGRATION.md` for the full domain background.
