# Project State — NorthPeak Retail (Demo)

> Single source of truth. Read me first, update me after every working session.

- **Client**: NorthPeak Retail (outdoor apparel, B2C, ~1.2M customers)
- **Engagement start**: 2026-06-01
- **Data 360 org / edition**: Data 360 + Marketing Cloud Advanced
- **Current phase**: 5 — Segmentation
- **Last updated**: 2026-07-15 — demo refreshed to grounded rules; unification design complete

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| 1. Source discovery & ingestion | Complete | 4 sources decided |
| 2. Data mapping | In progress | Shopify + Klaviyo mapped; Zendesk pending |
| 3. BRD / SDD | In progress | generate on demand from console |
| 4. Unification | Complete | design in 03-deliverables; configure per runbook |
| 5. Segmentation | In progress | catalog uses 12/24h cadences; S3 blocked by Case gap |
| 6. Activation | In progress | targets registered |

## Source inventory

| Source | Entities | Method | Frequency | Status | Notes |
|--------|----------|--------|-----------|--------|-------|
| Shopify | customers, orders | Native connector (Beta) | Hourly | Live | GraphQL-2024-07 schema |
| Klaviyo | email engagement | S3 file drop (daily CSV) | Daily | Live | no native connector |
| Zendesk | tickets, satisfaction | Native connector (Beta) | Daily | Proposed | needed for suppression segment |
| Store POS (PostgreSQL) | in-store transactions | TBD — research connectors | TBD | Proposed | hosting location unknown |

## Decisions log

| Date | Decision | Rationale | Who |
|------|----------|-----------|-----|
| 2026-06-10 | Batch-first ingestion, no streaming at go-live | credit conservation; no real-time use case yet | Saurabh |
| 2026-06-24 | Klaviyo via S3 drop | no native connector; client has ETL | Saurabh |

## Open questions for client

| # | Question | Raised | Owner | Status |
|---|----------|--------|-------|--------|
| 1 | Where is the POS PostgreSQL hosted (RDS / self-hosted)? | 2026-06-10 | IT | Open |
| 2 | Which system is master for customer name? | 2026-06-24 | Marketing | Open |

## Business objectives (from client)

- Win back lapsed buyers (no purchase in 6 months)
- Grow loyalty program enrollment from 30% to 50%
- Suppress customers with open support tickets from promotions
