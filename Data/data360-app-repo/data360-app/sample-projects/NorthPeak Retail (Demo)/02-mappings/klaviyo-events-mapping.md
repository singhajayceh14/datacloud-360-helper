# klaviyo_events.csv — Field Mapping (DLO → DMO)

Maps the Klaviyo events export (3,000 rows) to Email Engagement.

**Proposed DLO**: `klaviyo_events` · category **Engagement** · primary key `person_id`+`event_timestamp` (composite via formula) · event time `event_timestamp`.

## Mapping table

| # | Source Field | Sample Value | DLO Field | Data Type | Target DMO | DMO Field | Transform / Formula | Notes |
|---|--------------|--------------|-----------|-----------|------------|-----------|---------------------|-------|
| 1 | person_id | `KL-4521` | person_id | Text | Party Identification | Identification Number | type=KlaviyoId | |
| 2 | email | `maria.g@gmail.com` | email | Email | Contact Point Email | Email Address | lowercase | identity bridge |
| 3 | event_name | `Opened Email` | event_name | Text | Email Engagement | Engagement Channel Action | map Open/Click/Unsub | |
| 4 | campaign_name | `Summer Sale` | campaign_name | Text | Email Engagement | Campaign | — | |
| 5 | event_timestamp | `2026-05-02T09:12:00Z` | event_timestamp | DateTime | Email Engagement | Activity Date | — | event time |
