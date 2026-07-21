# Segment catalog — NorthPeak Retail (Demo)

Updated 2026-07-15 via the Data 360 Console. Publish cadences follow Salesforce standard schedules (12/24h; rapid where licensed). Aggregation logic lives in Calculated Insights (dimension = Unified Individual; CIs must run once before use; dimensions immutable after creation).

| # | Segment | Objective | Criteria (plain English) | Required DMOs | CI dependency | Publish cadence | Channel | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | Lapsed buyers (180d) | Win back lapsed buyers (no purchase in 6 months) | No Sales Order in 180 days AND lifetime orders >= 1 | Sales Order, Individual, Contact Point Email | Days-since-last-purchase per Unified Individual | 24 hours | Meta Ads | Reviewed |
| 2 | Loyalty prospects | Grow loyalty program enrollment from 30% to 50% | No LoyaltyId in Party Identification AND >= 2 orders AND email-engaged in 90 days | Party Identification, Sales Order, Email Engagement | Order count per Unified Individual | 12 hours | Marketing Cloud Next (native) | Draft |
| 3 | Open-ticket suppression | Suppress customers with open support tickets from promotions | Open Case in last 30 days (exclusion segment — apply to all promo activations) | Case | — | 24 hours | All channels (exclusion) | Draft |

## Calculated Insights required

- Days-since-last-purchase per Unified Individual (batch, 24h schedule)
- Order count per Unified Individual (batch, 24h schedule)

CI rules: min one measure + one dimension; dimension must equal the segment-on entity (Unified Individual); max 3 runs/day; must run once before segmentation can reference it.

<!-- console:segjson
[
 {
  "id": "S1",
  "name": "Lapsed buyers (180d)",
  "objective": "Win back lapsed buyers (no purchase in 6 months)",
  "criteria": "No Sales Order in 180 days AND lifetime orders >= 1",
  "dmos": [
   "Sales Order",
   "Individual",
   "Contact Point Email"
  ],
  "ci": "Days-since-last-purchase per Unified Individual",
  "cadence": "24 hours",
  "channel": "Meta Ads",
  "status": "Reviewed"
 },
 {
  "id": "S2",
  "name": "Loyalty prospects",
  "objective": "Grow loyalty program enrollment from 30% to 50%",
  "criteria": "No LoyaltyId in Party Identification AND >= 2 orders AND email-engaged in 90 days",
  "dmos": [
   "Party Identification",
   "Sales Order",
   "Email Engagement"
  ],
  "ci": "Order count per Unified Individual",
  "cadence": "12 hours",
  "channel": "Marketing Cloud Next (native)",
  "status": "Draft"
 },
 {
  "id": "S3",
  "name": "Open-ticket suppression",
  "objective": "Suppress customers with open support tickets from promotions",
  "criteria": "Open Case in last 30 days (exclusion segment \u2014 apply to all promo activations)",
  "dmos": [
   "Case"
  ],
  "ci": "",
  "cadence": "24 hours",
  "channel": "All channels (exclusion)",
  "status": "Draft"
 }
]
-->
