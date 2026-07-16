# Activation plan — NorthPeak Retail (Demo)

Updated 2026-07-15 via the Data 360 Console. Salesforce rules held: contact point required for MC targets; ≤100 attributes per activation; MC Engagement activations always create a NEW shared data extension (cannot target existing DEs); ad platforms take hashed match keys; S3 activations deliver members CSV + JSON metadata of the segment definition.

## Activation targets

| Target | Type | Match keys / interface | Notes |
|---|---|---|---|
| Meta Ads | Ad platform | Hashed email, phone, MAID | Custom Audiences; send ALL hashed emails per individual for match rate |
| Marketing Cloud Next (native) | Salesforce native | Unified Individual (direct) | native, no connector |
| Cloud storage (S3/GCS/Azure) | File export | Any (CSV columns) | members CSV + JSON metadata file |

## Activations

| # | Segment | Target | Contact points | Related attributes | Frequency | Consent handling | Status |
|---|---|---|---|---|---|---|---|
| 1 | Lapsed buyers (180d) | Meta Ads | all hashed emails | none | Hourly | — | Draft |
| 2 | Loyalty prospects | Marketing Cloud Next (native) | email (required for MC targets); multiple values resolve by source priority: Shopify > Loyalty > Klaviyo | first name, order count (2 of max 100) | Weekly | email opt-in enforced via Communication Subscription; suppression segment S3 applied | Reviewed |

## Refresh-chain warnings

- ⚠ "Lapsed buyers (180d)" activates Hourly but the segment only publishes every 24 hours — activation re-sends the same audience (wasted Data Services credits). Align to 24h or justify rapid publish.
- ⚠ "Lapsed buyers (180d)" → Meta Ads: consent handling not specified — ad audiences also count against metered service usage.

<!-- console:actjson
{
 "targets": [
  {
   "name": "Meta Ads",
   "type": "Ad platform"
  },
  {
   "name": "Marketing Cloud Next (native)",
   "type": "Salesforce native"
  },
  {
   "name": "Cloud storage (S3/GCS/Azure)",
   "type": "File export"
  }
 ],
 "acts": [
  {
   "id": "A1",
   "seg": "Lapsed buyers (180d)",
   "target": "Meta Ads",
   "cps": "all hashed emails",
   "attrs": "none",
   "freq": "Hourly",
   "consent": "",
   "status": "Draft"
  },
  {
   "id": "A2",
   "seg": "Loyalty prospects",
   "target": "Marketing Cloud Next (native)",
   "cps": "email (required for MC targets); multiple values resolve by source priority: Shopify > Loyalty > Klaviyo",
   "attrs": "first name, order count (2 of max 100)",
   "freq": "Weekly",
   "consent": "email opt-in enforced via Communication Subscription; suppression segment S3 applied",
   "status": "Reviewed"
  }
 ]
}
-->
