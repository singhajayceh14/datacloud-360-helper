# customers.csv — Field Mapping (DLO → DMO)

Maps the Shopify `customers.csv` export (425 rows, 13 columns) to the Data 360 standard model. Person data fans out across five objects joined by Individual Id = `customer_id`.

**Proposed DLO**: `shopify_customers` · category **Profile** · primary key `customer_id` · event time: n/a (Profile stream).

## Mapping table

| # | Source Field | Sample Value | DLO Field | Data Type | Target DMO | DMO Field | Transform / Formula | Notes |
|---|--------------|--------------|-----------|-----------|------------|-----------|---------------------|-------|
| 1 | customer_id | `SH-20001` | customer_id | Text | Individual | Individual Id | — | person key |
| 2 | first_name | `Maria` | first_name | Text | Individual | First Name | trim | fuzzy-match material |
| 3 | last_name | `Gonzalez` | last_name | Text | Individual | Last Name | trim | |
| 4 | email | `maria.g@gmail.com` | email | Email | Contact Point Email | Email Address | lowercase | Party FK → Individual |
| 5 | phone | `(212) 555-0134` | phone | Phone | Contact Point Phone | Telephone Number | E.164, default +1 | 75% fill |
| 6 | city | `New York` | city | Text | Contact Point Address | City | — | |
| 7 | state | `NY` | state | Text | Contact Point Address | State Province | — | |
| 8 | zip | `10001` | zip | Text | Contact Point Address | Postal Code | keep Text (leading zeros) | |
| 9 | loyalty_no | `LY-70001` | loyalty_no | Text | Party Identification | Identification Number | Name=`LoyaltyId`, Type=`Loyalty` (all five PI fields mapped; keep Name+Type identical across sources or match rules will not fire) | 70% fill — strongest match key |
| 10 | customer_id | `SH-20001` | customer_id | Text | Party Identification | Identification Number | Name=`ShopifyId`, Type=`SystemId` | lineage; never map IDs as Individual attributes |
| 11 | accepts_marketing | `true` | accepts_marketing | Boolean | Communication Subscription | Opt In | — | consent, not an Individual attribute |

## Identity fields (flag for Phase 4 unification)

- `email` → Contact Point Email · `phone` → Contact Point Phone · `loyalty_no` → Party Identification (LoyaltyId) · names → Individual
