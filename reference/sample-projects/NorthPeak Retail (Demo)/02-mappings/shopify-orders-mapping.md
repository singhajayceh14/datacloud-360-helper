# orders.csv — Field Mapping (DLO → DMO)

Maps the Shopify `orders.csv` export (1,500 rows) to Sales Order. Engagement stream keyed to the customer.

**Proposed DLO**: `shopify_orders` · category **Engagement** · primary key `order_id` · event time `order_date`.

## Mapping table

| # | Source Field | Sample Value | DLO Field | Data Type | Target DMO | DMO Field | Transform / Formula | Notes |
|---|--------------|--------------|-----------|-----------|------------|-----------|---------------------|-------|
| 1 | order_id | `ORD-100001` | order_id | Text | Sales Order | Order Number | — | PK |
| 2 | customer_id | `SH-20001` | customer_id | Text | Sales Order | Sold To Customer | — | FK → Individual |
| 3 | order_date | `2025-06-01T10:20:00Z` | order_date | DateTime | Sales Order | Order Purchase Date | — | event time |
| 4 | order_total | `129.90` | order_total | Number | Sales Order | Grand Total Amount | — | |
| 5 | currency | `USD` | currency | Text | Sales Order | Currency | — | |
| 6 | status | `fulfilled` | status | Text | Sales Order | Order Status | — | exclude refunded from revenue CIs |
