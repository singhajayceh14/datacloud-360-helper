# NorthPeak Retail (Demo) — Identity Resolution (Unification) Design

Generated 2026-07-15 by the Data 360 Console from the Phase 2 mapping docs; review with the client before configuring the ruleset in the org. Profiles matching **any** rule merge into one Unified Individual (criteria within a rule = AND, rules within a ruleset = OR).

**Target segments driving this design:**
- Lapsed buyers (180d)
- Loyalty prospects
- Open-ticket suppression

## Identity signal matrix

| Source | External ID | Email | Phone | Name | Address |
|---|---|---|---|---|---|
| Shopify | ✓ `loyalty_no` (70% fill, LoyaltyId), `customer_id` (ShopifyId) | ✓ `email` (100%) | ✓ `phone` (75%) | ✓ | ✓ (88%) |
| Klaviyo | ✓ `person_id` (KlaviyoId) | ✓ `email` (100%) | — | — | — |
| Zendesk (proposed) | — | ✓ `requester_email` | — | — | — |

## Match rules (in order)

| # | Rule | Criteria | Sources | Status |
|---|---|---|---|---|
| 1 | Loyalty ID exact | Party Identification: Identification Name `LoyaltyId` + Type `Loyalty` + Number exact | Shopify | Recommended |
| 2 | Email exact (normalized) | Contact Point Email, normalized match | Shopify, Klaviyo, Zendesk | Recommended |
| 3 | Phone + last name | Contact Point Phone normalized + Individual Last Name exact | Shopify | Optional — enable after validation (household over-match risk) |

**Rule 1** — strongest signal; requires Identification Name AND Type to be mapped identically in every source (five-field Party Identification pattern). **Rule 2** — normalized email strips case/characters but NOT Gmail dots/pluses; watch shared family inboxes. **Rule 3** — safety net; fuzzy matching in Data 360 applies to first name only (Low/Medium/High precision) and is deliberately NOT used here at go-live.

## Reconciliation rules (which value wins)

| Attribute | Method | Rationale |
|---|---|---|
| Default | Last Updated | freshest wins |
| First/Last Name | Source Priority → Shopify | commerce profile is master — [OPEN — client to confirm] |
| Address | Source Priority → Shopify | only source with full address |

## Consolidation & validation

The customers file contains ~25 known duplicate pairs (same email, different customer_id). Expected consolidation ≈ 6–12% on this demo data (healthy B2C often 10–40%). Validate after first publish: Profile Explorer spot-checks on known duplicates, consolidation-rate comparison if testing a second ruleset. Consolidation rate is a diagnostic, not a target.

## Operations & consumption

- Scheduled IR runs queue ~every 24h; max 4 on-demand runs per 24h (triggerable from Flow). Only changed rows are processed and charged.
- Profile Unification is the most expensive rate-card operation (100,000 credits per 1M rows processed) — no speculative rules, no unnecessary rulesets (each extra ruleset re-processes everything).
- Unified profiles do not cross data spaces.
