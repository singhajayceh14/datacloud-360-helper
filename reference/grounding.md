# Official grounding — Salesforce Data 360 Developer Guide

Distilled 2026-07-15 from developer.salesforce.com (Data 360 Developer Guide, "Get Started" section). These are the authoritative facts the console and its chat must not contradict. Where the tool's heuristics and this document disagree, this document wins.

## Architecture (dc-architecture.html)

- Data flow: sources → connectors → data streams → **Data Lake Objects (DLOs, original schema)** → mapping → **Data Model Objects (DMOs, C360 Data Model schema)** → identity resolution → **Unified profiles** → insights / segments → activation.
- The C360 Data Model is pre-loaded with **300+ industry-agnostic objects**, customizable for specialized schemas.
- For non-Salesforce data: **270+ connectors**, APIs, SDKs, and MuleSoft. **Zero Copy connectors federate read-only** access from partner platforms without copying — positioned as respecting prior data-platform investments.
- **Unstructured data** lands in Unstructured DLOs (UDLOs), is chunked, indexed, embedded into Data 360's vector database; retrieved via **vector or hybrid search** (grounding for Agentforce/RAG).
- Transformations: **batch and streaming**, including inline formula transforms (proper case, trim, concatenation).
- **Identity resolution**: match rules group individuals (criteria: **fuzzy, exact, normalized** matching); reconciliation rules pick the best value (**frequency, last updated, trusted/source priority**). Behind the scenes Data 360 builds **link tables** tying related records to the unified individual — **original attributes and records remain intact**.
- Segmentation: standard, **generative (Einstein Segment Creation, natural language)**, **waterfall** (prioritizes an individual's segment when they qualify for several), and **nested** (reuse complex criteria).
- Calculated Insights: batch **and streaming** aggregations (e.g., LTV).
- Einstein Studio: predictions, **BYOM** from Vertex AI / SageMaker.
- Query: **SOQL, SQL, vector/hybrid search**; BI via Tableau, Power BI, **JDBC driver**.
- Act: Agentforce agents; **activations** to Marketing Cloud, ad platforms (Meta, LinkedIn, Amazon), Core CRM; **Flows/Data Actions** (record-triggered, platform events, webhooks, API calls); **Data Shares** push derived data out zero-copy.
- Multi-org: **Data 360 Home org ↔ Companion orgs** (Data Cloud One) share data spaces and metadata zero-copy; Home↔Home via APIs, enrichments, record-triggered flows.
- Foundations: governance (tagging, masking, classification, **digital wallet** for usage/credit transparency), security (Einstein Trust Layer), **sandboxes** for DevOps/ALM.

## Object model (dc-object-model.html)

| Object | Official definition |
|---|---|
| **DLO** | Container for data ingested into Data 360 |
| **DMO** | Harmonized grouping created from data streams, insights, and other sources; DLO data is standardized by mapping to a DMO using the Customer 360 Model |
| **Unified DMO** | DMO containing unified data produced by identity resolution rulesets |
| **CIO** | Calculated Insight Object — multidimensional metric (LTV, CSAT, most-viewed categories) at profile, segment, or population level |

## Cost & usage (dc-cost-usage.html)

- **Data storage is metered.** **Service usage is metered** and includes: records **processed, queried, or analyzed**; **segmentation and activation**; and **the number of ad audiences** counts against service usage.
- Canonical rate detail lives in *Data 360 Billable Usage Types* (help.salesforce.com, id=data.c360_a_data_usage_types) and *Limits and Guidelines* — billing specifics are contractual. The console's calculator multipliers must be re-verified against that help page at implementation time.
- The **digital wallet** in-product is the transparency mechanism for usage types and credit consumption.

## Best practices for optimizing usage (best-practices-usage.html)

1. **Query lean**: SQL with WHERE filters and only needed SELECT fields; queries are preferred over GET API requests (more control = fewer rows processed).
2. **Ingest lean**: import only relevant records; **aggregate data before ingesting** when individual data points aren't needed; don't ingest attributes nobody will use.
3. **Test lean**: limit test-org data volumes to what functional testing needs.

## Developer quick start (dc-quick-start.html)

- Org needs a Data 360 license; API users need **Minimum Access - API Only Integrations** profile + Data 360 permission sets.
- API access via an **External Client App** (successor to connected apps) with OAuth scopes: `cdp_query_api` (ANSI SQL), `cdp_profile_api` (profile records), `cdp_ingest_api` (Ingestion API), `refresh_token`, `api`.
- Auth is **two-step**: Salesforce access token → exchanged for a **Data 360 access token + tenant-specific instance URL**; all Data 360 API calls go to that instance URL.
- Postman collection: "Salesforce Data Cloud APIs" (salesforce-developers workspace).

## Source pages

- https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-quick-start.html
- https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-architecture.html
- https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-features-overview.html
- https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-object-model.html
- https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-cost-usage.html
- https://developer.salesforce.com/docs/data/data-cloud-dev/guide/best-practices-usage.html
- Video (not machine-readable; content to be summarized manually): https://www.youtube.com/watch?v=G6jBXSQL1Ic

---

# Practitioner implementation reference — "Data Cloud Deep Dive" playlist

Source: YouTube playlist **Data Cloud Deep Dive** by Trailblazing Together (@MCLearningCamp), 12 sessions, recorded 2023–2024 (pre-"Data 360" rename — read "Data Cloud" as Data 360; feature details may predate current releases, verify against the official docs above). Sessions indexed 2026-07-15. **Transcript status:** YouTube currently refuses machine transcript retrieval (FAILED_PRECONDITION); the topic map below is from the session metadata, corroborated with written practitioner sources. Paste transcript text here to deepen any session.

## Session → tool phase map

| # | Session (speakers where known) | Feeds which part of this system |
|---|---|---|
| 1 | Data Cloud for Admins and Developers (Danielle Larregui) | Baseline platform mental model; chat answers for org setup questions |
| 2 | Data Cloud for Architects | Canvas architecture view; data-space / org topology decisions |
| 3 | Web & Mobile SDK, Ingestion API | Phase 1 fallback options when no native connector exists |
| 4 | Lessons learned from the trenches (Kyle Lassen, Matt Moses, May 2024) | Insights engine; risk items below |
| 5 | Integrate via the Ingestion API | Phase 1 method decision; custom stream design |
| 6 | Streamlining Data Unification | Phase 4 playbook; match-rule ladder validation |
| 7 | How to make data actionable | Phases 5–6; data actions, flows, activation patterns |
| 8 | MC Personalization + Data Cloud in tandem | Activation target notes (Salesforce Personalization) |
| 9 | Implementation Best Practices & Requirements Gathering | Discovery checklist below; New-project intake |
| 10 | Real-world POC case study (AUG Dublin) | Scoping pattern: prove one use case end-to-end first |
| 11 | Zero Copy Data Federation (2025) | Phase 1 method ladder — federation vs ingestion trade-off |
| 12 | RAG process in Data Cloud (2025) | Unstructured/UDLO awareness; out of current console scope |

## Practitioner rules the tool enforces (corroborated by written sources)

1. **Use-case first, always.** Start from one business use case and a named person whose work improves; provision, ingest, and design only what that use case needs, then expand. (Deep Dive #9/#10 theme; Salesforce Ben "3 pillars", Trailhead "Plan Your Data Cloud Implementation".) → This is why the console's Canvas leads with use-case chips and gap lighting.
2. **Discovery questions before design** (Deep Dive #9 theme; Salesforce Ben, Cloud for Good): What are the top 2–3 use cases and who owns them? Which systems hold customer data, who owns each, and how clean is it? Is there a common key or contact point across systems (can you even define one customer)? What volumes and refresh expectations? What consent/compliance constraints? Who consumes the outputs (channels, teams) and at what cadence? What does success look like in 90 days? → mirrored in the skill's Phase 1 intake and the console's open-questions tracking.
3. **Garbage in, garbage out is the #1 failure mode** (Deep Dive #4 theme; Salesforce blog "3 lessons", The Spot). Data Cloud unifies on commonalities — if sources share no reliable keys or emit inconsistent values, unified profiles, segments, and insights all degrade. Cleanse/standardize at the source where possible; validate fill rates before designing match rules.
4. **Treat data as a product** with an accountable owner per source (Salesforce engineering lesson). The console's per-source "owner" field exists for this.
5. **Prove a thin end-to-end slice** (POC pattern, session 10): one source → mapping → unification → one segment → one activation, demonstrated to stakeholders, before scaling breadth.
6. **Waterfall-ish start, agile later**: initial implementation benefits from upfront architecture (org topology, data spaces, identity strategy) because these are hard to change; iterate on segments/activations agilely afterwards.
7. **Zero Copy vs ingestion is an economic decision** (session 11): federation avoids copy/storage and respects existing warehouse investments, but query-time access has its own consumption profile — model both in the credit calculator before choosing.

Written corroboration: salesforce.com/blog/3-lessons-from-using-data-cloud · thespotforpardot.com (2023 implementation lessons) · salesforceben.com "Data 360: The 3 Pillars of Implementation" and requirements-gathering guides · trailhead "Data Cloud: Prepare for Success".

---

# Bootcamp transcripts digest — Data Cloud Consultant Bootcamp (Days 1–12)

Distilled 2026-07-15 from the full session transcripts supplied by the user (Trailblazing Together / MC Learning Camp, ~2024 — items flagged [~2024] may have changed; verify against the official docs above, which win on conflicts). This is the "Salesforce-suggested way" the tool enforces during design.

## Solution Lifecycle, Use Cases & AMA (Days 1-2, 12)

Source: MC Learning Camp bootcamp (~early 2024, Salesforce Partner Product Success presenters). Limits reflect ~2024 — verify flagged items.

### Implementation lifecycle ("day in the life of customer data")
Canonical phase order, strict sequence:
1. **Connect/Ingest** — batch or streaming. Sources: native connectors for all SF clouds (CRM, Marketing Cloud, Commerce, Loyalty), cloud storage (Amazon S3, Google Cloud Storage, Azure), SFTP, Ingestion API, Web/Mobile SDK (fastest real-time path), MuleSoft for anything else (on-prem, arbitrary DBs).
2. **Transform** — lightweight ETL in Data Cloud: batch + streaming transforms (CRM Analytics framework): transpose/consolidate rows, filter, cleanse at/after load.
3. **Harmonize/Model** — map DLOs to the opinionated **Customer 360 data model** (the "Rosetta Stone": CRM contact = MC subscriber = Commerce profile → Individual DMO). Standard **bundles** for Sales/Service/Marketing Cloud auto-map common objects; extensible with custom objects/attributes.
4. **Unify (Identity Resolution)** — match rules (exact + fuzzy on name, address, email, phone, party identifiers) + reconciliation rules → Unified Individual. **B2B account unification GA (~2023/24)** via account name/address/DUNS. Reference model, not MDM survivorship: all source profiles persist with links — "system of reference, not system of mastery"; lossless.
5. **Act** — calculated insights (multi-dimensional metrics: LTV, RFM, engagement scores; SQL or visual), streaming insights (time-series on in-flight data + data actions: fraud alerts, auto-case on repeat troubleshooting visits, geofence triggers), drag-and-drop segmentation, activation (MC email/SMS/push; first-party ads Google/Meta/Amazon), data actions → platform events → Flow, BYOM (SageMaker, Google Vertex — GA), Tableau/CRMA/MC Intelligence natively (JDBC driver for any BI tool), LWC/APIs to surface in CRM consoles.

**Discovery approach (Day 2):** "Begin with the end in mind" — customers never ask for "a Data Cloud"; listen for pain-point triggers (agent productivity, stale data, multiple SF orgs, single customer view, AI readiness). Every use case reduces to **three questions**: (1) what data must come in, (2) how must it be harmonized/unified, (3) what insights are needed and what actions taken, and why. Audit source data quality first; Data Cloud consumes governance rather than providing it — have a data stewardship plan before ingesting.

### Decide BEFORE touching the org / hard to reverse
- **Data residency**: Hyperforce only; ~2024 just **5 regions — North America, Germany, Australia, Japan, India**. Confirm availability before purchase; CRM may be local where Data Cloud isn't. *(Outdated — more regions since.)*
- **Web/Mobile SDK destination**: same SDK serves MC Personalization and Data Cloud, but events go to **only ONE destination per page** — choose up front; dual sitemaps cause discrepancies. No native anonymous-to-known bridge in the MCP connector (~2024); anonymous ingestion balloons volume/credits with few uses — proceed with caution. Activating segments to Marketing Cloud **requires a contact point** (email/phone) and consent.
- **Never design Data Cloud as pass-through/bulk-export storage**: only three exits — segment activation, data actions, APIs. Bulk-ETL of DMOs out is explicitly unsupported. Surface data in place (LWC, related lists, CRM-enrichment copy fields) rather than copying — a customer with **40 Salesforce orgs** was told to unify centrally and retrieve in real time, not replicate.
- **Consumption cost model**: every store/access/process burns Data Services credits at differing multipliers; **streaming/real-time carry the highest multipliers**. Justify cost-to-serve per use case (IoT telemetry: consider a MuleSoft event bus sending only outliers/aggregates, not raw rows).
- Data Cloud is additive storage (off-core lakehouse + on-core Salesforce UX), NOT a replacement for the CRM transactional DB, MC Connect, MuleSoft, Informatica, or BI tools. Keep MC Connect synchronized DEs; don't rebuild simple CRM→MC journeys as data actions ("overbuilt"). Adopt only when a use case needs cross-source unification the existing stack can't do — weakest fit when the customer has no Salesforce footprint.

### Use-case patterns by industry
- **Marketing**: unify 10+ sources, insight democratization, 1:1 segmentation/activation, martech consolidation; cookie deprecation elevates first-party data.
- **Sales**: cross-org opportunity view, lead/opportunity scoring, rep prioritization — CRM connector + third-party purchase/web data + insights.
- **Service**: churn likelihood (SF + billing data), proactive outage/failure alerts, case deflection — calculated insights + data actions.
- **Financial services**: large deposit → data action creates wealth-advisor lead; abandoned mortgage application surfaced in CRM; high mortgage-email engagement → nurture; low card usage → attrition risk + next-best-action; loan final installment → cross-sell content. Needs streaming ingestion, IR across line-of-business orgs, data actions.
- **Healthcare**: Health Cloud's Unified Health Score is powered by Data Cloud; EHR new patient → lead; device malfunction → service ticket; refill request → profile update + provider alert.
- **Manufacturing**: web visit → personalized journey; large order → supply-chain bottleneck analysis; IoT forklift pressure drop → auto-fill cart with replacement part + work order.
- **Automotive (Kia Connect)**: telematics/charging data unified; Tableau feature-usage analysis (windows-down → fuel-saving prompt); **first use case live in 3 months**.
- **Digital banking (Banco Inter, Brazil, 2022 adopter)**: **100+ data streams, 10B+ records**; affinity scores → segments → MC Journey Builder; ~20% campaign ROI lift; ~1.5 hrs/week saved per employee.

### Licensing / credits / certification numbers
- Consumption pricing (credits), not seats; API families meter differently (profile vs query); data graphs add materialization cost. A "free of cost" starter offering (~2024) let customers stand up 1–2 use cases in ~3 months before investing. *(Outdated — check current free-tier terms.)*
- Consultant cert: **60 questions, 62% pass (~37 correct), 105 min, $200 / $100 retake, no prerequisites**. Weights: Solution Overview 18% (~11 q), Setup/Admin 12%, Modeling & Ingestion 20%; IR, Segmentation/Insights, Act on Data make up the rest. No public Trailhead org with Data Cloud (~2024); partners get 30-day orgs via Partner Learning Camp. Demo org: 64M source profiles → 29.9M unified.
- Audience Studio (Krux DMP) heading to end-of-life; Data Cloud ad activation replaces it. *(Outdated — EOL complete.)*

### Best AMA answers (Day 12, technical)
1. **Multiple emails/phones per unified profile?** All source values persist; pick at **activation time via source priority** — by design.
2. **Remote-org data retrieval**: pick API by need — Query API (all DLOs/DMOs, slowest; engagement data unindexed), Profile API (profile-only, fast), Calculated Insights API, **Data Graphs API** (new; materialized-view-like, extra credit cost).
3. **Ingest-to-available latency: ~2 minutes to ~1 hour** depending on integration type; check published guardrails (data-action trigger volumes, API limits) in Help.
4. **Replace MC Connect?** No — it still handles CRM-triggered journeys, journey→CRM writebacks, marketing-view data; Data Cloud adds cross-source segments. Coexist; don't turn off synchronized data sources.
5. **Bulk-load into core CRM?** Anti-pattern. Use CRM enrichment (related lists — standard list defaults to **last 7 days**; dynamic lists filterable; copy-field for CI values), data actions carrying payloads to trigger flows (create opportunities/tasks in target orgs), or on-the-fly LWC retrieval.
6. **Zero-ETL (Snowflake/Databricks)**: schema exposed as a virtual/federated DLO — live query pushdown, no copy; harmonize/segment/activate as if native. Gotcha: source schema changes silently break downstream dependencies — coordinate schema governance.
7. **Validation post-ingest/IR**: Data Explorer, Profile Explorer, Query API, query workspaces for tactical QA; IR match-rate insights per Help docs; no universal "optimal match rate" — compare **two rulesets** side by side; bake into formal QA.
8. **Einstein Studio vs calculated insights for churn**: CI = prescriptive SQL logic you author; Einstein Studio/BYOM = actual ML models. Overlapping outputs, different paradigms.
9. **Metadata API**: Data Cloud config coverage was incomplete (~2024), parity in progress; key use case — automated connector key rotation without clicking Setup.
10. **Governance (~2024)**: encryption at rest/in transit via Hyperforce; access control essentially **data-space granularity** — anyone in the data space sees its data; tagging/policy controls were roadmap.
11. **Required fields**: DLO needs a primary key (+ event datetime for engagement category); contact-point DMOs have mandatory field subsets for IR — a yellow warning triangle flags unmapped required fields.
12. **Roadmap (~2024, verify GA)**: FedRAMP/Government Cloud, native industry-cloud DMOs, Shield + bring-your-own-key encryption ("this fiscal").

Other anchors: average company runs **~1,000+ apps**, **~70% disconnected**; segment publish: rapid vs standard, refresh manual or 12/24h.

## Setup, Administration & Ingestion (Days 3-5)

*Sessions ~2024. Speakers stressed cadences/limits change every release — verify against the current "Data Cloud limits" help doc.*

### Provisioning & org setup
- Data Cloud runs on Hyperforce: data lakehouse storage plus metadata-driven platform capabilities (reports, flows, auth shared with CRM).
- Two provisioning models. **(1) Standalone org** — separate from the home CRM org; requires a new user and core platform licensing in the new instance. Preferred with multiple Salesforce orgs, heavily customized architecture, regulated/audited permissions, or separate admins. Caveat: out-of-box data views sit outside the core org, so custom LWCs may need rebuilding. **(2) Home org** — Data Cloud on the existing Sales/Service org; best for a single line of business; one admin, combined view; Data/Profile Explorer usable inside the service console.
- Setup sequence: existing org — assign the standard **Data Cloud Admin** (or Marketing Admin) permission set and the app appears. New org — admin gets an email with account details, logs in, configures permissions, adds users. Admin then configures connectors in Data Cloud Setup (required before streams can use them; S3 is the exception).
- User management requires a Salesforce Administrator profile. Use the **standard** permission sets (Admin, Marketing Admin, Marketing Manager/Specialist, User) — do **not** create custom ones. Access is full / view-only / no access per persona; segmentation+activation sits with Data Cloud (for) Marketing Admin.
- Other admin duties: packaging/data kits; flows chaining ingestion→segmentation→activation; reports/dashboards on exposed objects (streams, identity resolution, segments); sharing rules on segments/streams/calculated insights (a partner-BU marketer sees only their BU's segments); identifying the account's functional domain (Hyperforce region); Lightning record pages for unified individuals; data spaces.

### Connectors & topology
- Cadence classes: **batch** (CRM, Marketing Cloud — hourly), **near real time** (Ingestion API — engagement micro-batches every 15 min; streaming commits ~2–3 min), **~real time** (web/mobile SDK, ~2 min).
- **Starter data bundles**: Salesforce-predefined stream definitions with DMO mappings (Sales Cloud has 1,000+ objects; bundles pre-pick standard ones). Available for Sales, Service, Loyalty, B2C Commerce (B2B/B2C/order management), Marketing Cloud, MC Personalization. MC bundle: Email (sends/opens/clicks/bounces), MobileConnect, MobilePush, recently WhatsApp; MC data has a **90-day lookback**. Bundles enforce default category mappings that can't be changed.
- **CRM connector**: supports 1:1, 1:many (region/brand segregation, dev vs prod), many:1 (multiple CRM orgs into one Data Cloud). Home org pre-connected; external orgs and sandboxes connect via credentials. Sync: initial full load, hourly upsert deltas, weekly full refresh.
- **Marketing Cloud connector**: strictly **one MC Enterprise ID per Data Cloud instance** (multiple Data Clouds may connect to one MC, not vice versa). Connection is at EID level; BUs then selected for ingestion/activation; data extensions can be ingested individually outside bundles. Data Cloud auto-creates automations in MC — **never modify them**. Don't use MC Automation Studio as an intermediate ETL layer — ingest directly (or via cloud storage) to preserve data lineage; DEs are fine for CloudPage form data.
- **MC Personalization**: multiple datasets can feed one Data Cloud, but each dataset connects to only one Data Cloud instance. (Multi-EID MC support was "roadmap" — likely outdated.)
- **Amazon S3**: not configured in Setup — configured per data stream; bucket, access key, secret key, file type re-entered for **every** new stream; one account can use multiple buckets. **GCS**: credentials defined once (one connection per org then), subdirectory per stream, hourly sync. Also: Azure Blob, SFTP (recent), MuleSoft Anypoint (streaming or bulk, can publish insights back upstream), Financial Services Cloud connector (new).
- No native SQL/ODBC connector: extract to S3/GCS and ingest, or zero-copy federation with supported warehouses (Snowflake, Databricks, more announced).
- External activation platforms then supported: Amazon Ads, Google Ads, Facebook; extendable via AppExchange partners.

### Data spaces
- Logical partitions of data/metadata/processes for multi-brand/geo/department use cases **Limit: 50 per account.** Not a data-residency solution; not recommended as a sandbox substitute (some customers do it anyway); do **not** use them where unification must span partitions — unified profiles don't cross data spaces. The data space is chosen at stream creation, so multiple CRM orgs can each land in separate spaces.

### Administration specifics
- **Error monitoring**: record-triggered flows on supported Data Cloud objects, entry conditions like "last publish status = error AND publish status changed" → email alert.
- **Reports**: report builder has a "Data Cloud" report type over DMOs (e.g., unified individuals with points > 3,000).
- **Packaging**: **data kits** (created inside Data Cloud) package B2C Commerce and CRM streams plus attached data models, and can be embedded in a standard package. **Standard packages** (via CRM Package Manager) carry calculated insights, S3 streams with mappings, Ingestion API streams, custom DMOs. Gotcha: **log out of all Data Cloud instances before opening the installation URL** or you may deploy to the wrong org. Historic driver: no Data Cloud sandbox SKU, so config moved between two prod orgs via kits — a sandbox was just releasing at recording time (treat as changed).
- Data Explorer (per data space: DLOs, DMOs, calculated insights) vs Profile Explorer (unified individuals only) — troubleshoot mappings with test records before trusting identity resolution.
- API families: **Connect API** (platform-routed via flows/Apex/LWC; main surface for ISVs and non-home-org CRM enrichment), **Direct/Ingestion APIs** (on Hyperforce for high volume), Enterprise REST (sObjects), Metadata API.

### Ingestion pipeline, categories, transforms
- Lineage: source → data stream → **DSO** (physical staging, raw format; *minor* transforms via **formulas** at ingestion) → **DLO** (first inspectable; mapping + further transforms) → **DMO** (virtual, non-materialized view; query results not stored). Medallion bronze→silver→gold.
- **Categories — Profile / Engagement / Other** — selected at stream creation and **cannot be changed afterward** (Elliot: near-guaranteed cert question; he saw an implementation with everything tagged "Other" — a bad idea). A DMO inherits the category of the first DLO mapped to it and thereafter accepts only that category. Individual DMO is always Profile. Engagement data is time-bound and voluminous — backed by hot/cold stores with small engagement windows — so tag genuinely time-bound event data as Engagement.
- Refresh: batch connectors run full refresh or upsert deltas on schedule (CRM: full, hourly upserts, weekly full); DLOs can also be refreshed manually. **Lookback window**: sample dataset OOTB connectors use initially to establish field data types; data outside it needs a custom path.
- **Ingestion API**: streaming accepts JSON matching the schema defined in the deployed data stream (schema file required at setup); fire-and-forget, processed asynchronously ~every 3 min (nominally 2 + scheduler latency); micro-batches ≤ ~200 KB. **Bulk**: CSV up to **150 MB/file, 100 files/job**; job lifecycle like Salesforce Bulk API (create → upload → close → process); supports create/update/**delete**; suited to daily/weekly loads (POS, loyalty balances).
- **Web SDK** (Salesforce Interactions SDK): client-side beacon JS; known and pseudo-anonymous visitors; captures profile, e-commerce (cart/items/orders/catalog), and consent — sends only if consent given. MC Personalization NOT required. **Mobile SDK** (ex-MC mobile SDK, iOS/Android) adds a Data Cloud module; MobilePush not required. "Real time" means near real time: profile ≤ ~2 min, engagement every 15 min.

### Q&A pairs
- **Can SFMC SOAP objects be ingested as data bundles?** No — use API-based ingestion (speaker to confirm).
- **Limit on data spaces?** 50 per account; beyond that, engage the account/engineering team.
- **Data actions vs activations vs data shares?** Activation pushes segment audiences to marketing/ad targets; data actions push events into CRM (e.g., points > 1,000 → update a lead field); data shares export data objects to external warehouses.
- **Can multiple Salesforce orgs map to separate data spaces of one Data Cloud?** Yes — pick the data space when creating each stream.
- **Need a second Marketing Cloud EID?** Not supported natively; bring the extra MC's data via the Ingestion API (accept API costs/limits). Multiple BUs of the connected MC are fine.
- **Why is MC 1:1 but Personalization many-to-one?** Personalization datasets live on separate instances, so several can attach; MC connects at its single EID.
- **Connect to on-prem SQL Server?** No native connector — stage to S3/cloud storage, or zero-copy via Snowflake/Databricks-class warehouses.
- **Is the MC connector visible without an MC license?** The tile shows; credentials/license needed to connect.

## Data Modeling, Harmonization & Identity Resolution (Days 6-7)

*Source: Data Cloud partner bootcamp, ~2024. Items flagged [~2024] may have changed.*

### Harmonization = mapping + modeling (NOT unification)

- Pipeline: Data Source Object (raw, no UI access) → Data Lake Object (DLO, post-transform, viewable in Data Explorer) → mapped to Data Model Object (DMO). Ingestion and mapping are separate steps; unmapped data is invisible downstream — segmentation, IR, insights, actions all read DMOs, never DLOs.
- A DMO is a **non-materialized view**: mapping stores query instructions, not copied data. Removing a mapping instantly hides data downstream without deleting DLO data; full data removal requires deleting at DLO/data-stream level. DLO and DMO can share a name (e.g., Individual) but are different objects — common confusion.
- Standard model = Customer 360 Data Model (descended from the open-sourced CIM). Decision rule: **exhaust standard objects/attributes first, then extend** — real implementations are almost always hybrid. References: Help docs, developer.salesforce.com (fields/relationships), architect.salesforce.com (ERD galleries).
- Creating a custom DMO from the mapping UI copies the DLO's labels, API names, data types and sets the PK automatically.

### Required mappings for identity resolution

- Must map **Individual** (first/last name + an identifier) PLUS at least one **Contact Point** (Email / Phone / Address / App / Social) OR **Party Identification**. Quiz emphasis: Contact Point Email is the DMO required for unification+activation in the individual scenario.
- The "Party" field on Contact Point / Party Identification DMOs is a foreign key to Individual ID (speaker: "mislabeled" — a true Party junction object was never built). Party ≠ Party Identification.
- **Party Identification** = identifiers matched elsewhere (driver's license, SSN, loyalty ID, MDM ID, contact ID). Minimum **five fields**: Party Identification ID (PK), Party (FK to Individual/Account), Identification Number (actual value), Identification Name (descriptor, e.g., "Minnesota license plate"), Identification Type (superset, e.g., "License plate").
- **B2B/account-based IR is supported**: map Account instead of Individual as prime entity; Party fields point to Account ID; Contact Point Email/Phone/Address apply (no Social/App for accounts). Never map accounts into Individual. Account Contacts map to Account Contact and aren't used for account resolution.
- Consent DMOs exist (global, engagement channel, contact point, data use purpose) but few customers populate all levels — gaps are fine. No unified consent object [~2024].

### Modeling mechanics and constraints

- **Primary keys: single field only** — no composite DMO PKs. Collapse composite source keys via **formula fields on ingest** (concatenation; convert dates to text). Data stream PK ≠ DMO mapping PK.
- PK gotchas: avoid mutable fields in PKs (changed email → whole new record); **UUID() regenerates on every ingestion run** — never for updatable profile data, fine for immutable event streams. PKs treated case-insensitively (speaker's conclusion; IR identifier matching offers an optional case-sensitive setting). Field name length limit ~30-40 chars (speaker unsure — verify in docs).
- Denormalized rows must split for the normalized DMO model: one CRM contact row (2 emails, 2 addresses, 2 phones) → 1 Individual + 6 contact-point records, **each with its own generated PK** (six formula fields for one row); name each formula field after its target DMO (e.g., ContactPointEmailID).
- **Same record can't map twice into one DMO** — primary+secondary email in one row requires transposing/splitting into separate rows.
- Multiple DLOs → one DMO is normal (web orders + offline sales → Sales Order); one DLO → multiple DMOs is normal (contact → Individual + contact points + Party Identification).
- **Category inheritance**: a DMO has no pre-assigned category; it inherits the category (Profile/Engagement/Other) of the first mapped object, restricting further mappings. Some mixing allowed (Other↔Profile; Engagement+Other) but Engagement DMOs accept only Engagement objects. DMO missing from the mapping picker → suspect category mismatch.
- **Relationships**: single field → single field only (no multi-field joins), UI-configured with cardinality (1:1, 1:N, N:1). Graph view visualizes relationships; default list shows only mapped objects (switch "Map" → "All").
- **Change friction (near-immutability in practice)**: mappings/attributes used by segments, activations, or IR can't be removed until dependencies are unwound — small changes become long sequenced exercises. Invest in design: source audit (keys, nullability, sample data, normalized vs denormalized shape) + solution design doc before build. Deleting a standard DMO keeps its schema for redeploy; deleting a custom DMO deletes the definition; neither deletes DLO data.
- Auto-suggested mappings appear on name matches — always verify. **Value suggestion** (opt-in per field): profiles up to the **1,000 most frequent values** into a segmentation dropdown.
- Don't use formula fields as a substitute for standardization — fix data in the source. Verify mappings/formulas in Data Explorer before building downstream.

### Identity resolution (Day 7)

- Two-part process run together: **(1) match rules** group profiles; **(2) reconciliation rules** summarize attributes. Outputs: **Unified Profile** (Unified Individual or Unified Account — a "key ring" linking source profiles) and **Unified Link** (junction between unified profile and each source profile; one link per connected profile; an unmatched profile still gets its own unified profile + one link).
- **Nothing merged or destroyed** — unlike MDM golden-record/survivorship, lineage is kept; if source data changes, reruns regroup profiles. Unified Link lets an external org traverse: contact → link → unified individual → other orgs' profiles.
- Sequence: audit source identifiers → match rules → reconciliation rules → run → inspect → tune.
- **Rule logic**: criteria within a rule = AND; rules within a ruleset = OR (no AND across rules). More criteria per rule → lower match rate; more rules per ruleset → higher match rate.
- **Match methods**: Exact (text equality — beware shared household phone/email/address); Normalized (phone/email/address only; email strips characters/case but NOT Gmail dots/pluses [~2024]; addresses parsed by an ML normalizer); **Fuzzy — first name only** [~2024]: Low precision (misspellings, Lysa/Liza/Lisa), Medium (initials, uncommon nicknames like Pepe/Jose), High (hyphenation, common nicknames like Matt/Matthew).
- **Party Identification matching** requires equality on Identification Name + Type + Number (only name+type entered in the rule UI; no match pattern). Gotcha: MC "Subscriber Key" vs CRM "Contact ID" holding the same value will NOT match unless Identification Names align at mapping; plan naming conventions for multi-org CRM. Most precise method; prefer it over stuffing IDs into Individual attributes.
- **Default ruleset** = fuzzy first name + exact last name + email — often too loose (sister-in-law-at-same-address example: over-match leaks the wrong person's reconciled data). Over-matching risks wrong-person activations; too-strict rules give near-zero consolidation, making unification worthless.
- **Reconciliation options**: Last Modified, Most Frequently Occurring, Source Priority — settable per field; defaults provided. Reconciled attributes are safe internally (LWC embeds, consoles, dashboards) but should NOT be activated directly to customers ("creepy," possibly wrong). Activations send a mix of unified-profile attributes + the individual's contact points; per-channel contact-point selection (email1 promo vs email2 service) not yet available [~2024, roadmap].
- **Multiple rulesets** allowed (strict operational / liberal analytical / test); each produces its own full set of unified profiles/links; each data space needs its own rulesets. IR is one of the most **credit-intensive** operations — multiplying rulesets multiplies cost; only changed rows are processed/charged [~2024]. (Numeric caps on rulesets/rules weren't stated in these sessions.)
- **Scheduling**: scheduled IR queues roughly **every 24 hours**; on-demand up to **4 runs per 24-hour period**; can be triggered via Flow (e.g., post-ingestion, or a CRM button).
- **Consolidation rate** = % of profiles consolidated (0% = no matches, ~100% = everything merged). **No optimal target** — a diagnostic to compare rule changes, not a score to maximize.

### Attendee Q&A highlights

- **Q: Character limit on field names/PKs?** A: Yes, ~30-40 chars — verify in documentation.
- **Q: Are PK values case-sensitive?** A: Believed insensitive; IR identifiers have an optional case-sensitive setting.
- **Q: How do we unify accounts (B2B)?** A: Map Account in place of Individual; Party points to Account ID; Contact Point Email/Phone/Address only.
- **Q: Individual table used for accounts?** A: Don't — use Account + Account Contact with account-based resolution.
- **Q: Composite source key vs single DMO PK?** A: Formula field concatenating components (order number + "_" + line number).
- **Q: Identical Subscriber Key and Contact ID values — Party ID match?** A: No — Name and Type must also match.
- **Q: Pick email1 for promos, email2 for service at activation?** A: Not yet [~2024]; contact-point orchestration was roadmap.
- **Q: Does IR run daily on everything?** A: Scheduled daily but only changed rows are processed and charged.

## Insights, Segmentation, Activation & Data Actions (Days 8-11)

Source: Data Cloud bootcamp Days 8-11, ~Feb 2024. All limits/features are ~2024-era — re-verify against current docs.

### Calculated Insights (CIs)
- CIs build multi-dimensional metrics (CLV, RFM, std dev, trig/log) on any related Data Cloud data via the no-code Visual Insights Builder or raw SQL — either way **Apache Spark SQL** executes. Query Workspaces uses **Trino SQL**; queries don't translate 1:1 (gotcha).
- Requires **min one metric (measure) and one dimension** (typically Individual, Unified Individual, Account, or Unified Account ID). Names must end `__c`; measures need aggregate functions (`FIRST` is the trick to return a row value as a metric); no temp tables.
- **CI dimension must match the segment-on entity** (Individual vs Unified Individual not interchangeable), and a CI must have **run at least once** to be usable in segmentation.
- **Limits**: 10 dimensions/CI; 50 measures/CI; **300 CIs per org** (hard, shared across data spaces); max **3 runs/day**; schedules **6/12/24 hours** or manual; **2-hour max runtime** then killed.
- **Edits**: can add metrics (if aggregatable); **cannot remove referenced metrics; cannot add or remove dimensions** (exam quiz: CI won't save after edit = a dimension was added). To delete a CI, back out all segment/activation references first.
- **Formulas vs CIs** (exam trap): formulas run once at ingestion, row-level only, stored as DLO fields, never reapplied, no related-data access; CIs run in batch across related data, output a new object with relationships, rerunnable. Never use formulas to standardize (currency conversion hardcodes rates).
- **Metrics on metrics**: a CI can reference another CI by API name + metric name, like a table.
- CIs can **trigger data actions** (added ~2023, previously streaming-only) on change events/new rows — e.g., loyalty-tier change fires a platform event → Flow, MC journey/email, or webhook.
- Billing: credits **per row processed, only when underlying data changed**. For single-profile console display, prefer Query API via LWC (or copy fields / related lists) over CI + push to CRM. Inspect via Data Explorer, Query Workspaces, or the CI API (DBeaver, cross-org).
- Zero-copy (~2024: Snowflake pilot, BigQuery TBD) supports CIs on the batch cadence, but fast DMO/DLO change-event data actions need **ingested** data.

### Streaming Insights
- Built for speed: windows as small as **1 minute**; only simple aggregations (counts, sums); scope = **the streaming object + one hop to directly related profile objects**. A **window function is mandatory** — won't validate/save without one (exam point). Output = one row per dimension per window.
- Purpose: aggregate inbound stream fast → trigger a data action. Good: geofencing, service anomaly detection. Weak: fraud detection (window/scope too limited).
- **Streaming insights CANNOT be used in segmentation; calculated insights CAN** — the #1 exam takeaway.
- Anti-pattern: don't use them for transactional messages (password resets, order confirmations) — use a direct integration / MC transactional API. Data Cloud belongs only where aggregation, enrichment, or filtration is needed.

### Segmentation (Day 9)
- No-code: pick data space → name → **segment on** a DMO (Individual, Unified Individual, Account, Contact, Lead...). Canvas = attribute library (with related-attribute drill-down) + drag-and-drop rule builder; **containers** group AND/OR logic; operators vary by data type. Live count shows atop the canvas; exclusion (suppression) uses the same builder.
- **Related attributes have a one-to-many relationship with the segment target** (exam quiz).
- **Publishing** makes a segment usable: unpublished segments can't feed activations or nested segments, and membership doesn't exist until publish. Ongoing schedule options: **12 and 24 hours** (exam quiz); stagger schedules — concurrent publishes degrade performance.
- **Nested segments**: include a published segment, then layer filters. Base-segment edits ripple to dependents.
- Copying duplicates filters; **deleted** = gone; **inactivated** = can never be re-enabled or published — copy to reuse.
- Keep segments simple: multi-source aggregation (RFM/LTV) belongs in a CI referenced by the segment; timeouts mean simplify or move logic to a CI. Hard caps (active segments, total attributes) plus edition-dependent soft limits — see help docs.
- Verify membership: Data Explorer on the segment-on DMO (eyeball only, not a count tool), publish first, filter by segment ID. Quality depends on upstream mapping + identity resolution.

### Activation (Day 10)
- Activation = delivering a **payload of segment members + attributes to a connected target**. Segmentation only returns qualifying Unified Individual IDs; activation assembles attributes from **both unified (reconciliation-rule) and non-unified source values**. One segment → multiple targets, each with a different payload.
- **Steps**: 1) create activation target (some auto-create on connector install — **B2C Commerce** is the exam example), 2) select segment, 3) pick direct attributes, related attributes, contact points, 4) set publish schedule.
- **Targets (~2024)**: MC Engagement — creates a **new shared data extension** per activation, BU-selectable; refresh updates that same DE; you can never target an existing DE or synchronized data sources. Also: Journey Builder entry via DE; MC Personalization (creates a user segment); B2C Commerce (customer groups); S3 (**members CSV + JSON metadata file of the segment definition** — exam tip); Google Cloud Storage; Azure; SFTP (don't reuse MC's SFTP); back into Data Cloud as a **curated DMO**; ad platforms Google/Meta/Amazon; AppExchange partners (The Trade Desk, LiveRamp, Criteo).
- **Contact points**: one per channel per activation. MC **requires** email OR phone OR mobile app; file storage and Personalization make them optional; external targets define their own (device ID, mobile advertiser ID). Multiple values resolve by **source priority order** (e.g., CRM > e-commerce > MC); multiple emails all from MC resolve by **Einstein engagement score — primary email with highest click value**. An exact contact-point filter was "coming" (~2024 — verify GA); meanwhile do a last-mile consent/address check in the target.
- **Attributes**: up to **100 per activation**; rename in-payload via "preferred attribute name". From CIs, **metrics only — never CI dimensions**; dimension filters allowed.
- **Related attributes (~2024)**: only **MC and S3** targets; max **30 activations** using them; segment **<10M records**; up to **4 hops** down ONE child-DMO path (Individual → Policy → Asset → Coverage → Coverage Detail), never across paths; own filter separate from the segment's; delivered as a **JSON blob**, parsed in MC with SSJS/GTL/AMPscript (a new AMPscript function was added).
- Common errors (exam): required fields empty, invalid email/date, invalid SMS locale, someone modifying the shared DE's fields in MC.

### Data Actions (Day 11)
- Near-real-time events fired on changes in exactly **two object types: DMOs (change data capture) and calculated insights** (streaming insights also trigger them). Exactly **three targets: Salesforce platform events, webhooks, Marketing Cloud** (email or Journey Builder API entry event). **The Data Action Target must exist before the data action** — both recurring exam questions (data actions ≈ 6-7% of the 18% "Act on Data" section).
- Config: target → data space → object type → primary object → related objects via DMO relationships → subscriber key → event rule (created/updated/deleted) → conditions (gotcha: exact values must be typed, no picklist assist) → fire every time vs first time only.
- **MC gotcha**: pre-create the DE with attribute names **exactly matching the DMO API format** (`ssot__SaleOrder__dlm.FieldName`), same subscriber key, then a Journey Builder **API entry event** on that DE. Naming mismatch is the top failure mode (exam troubleshooting question).
- Platform events land in Flow via the **Data Object Data Change Event** trigger — cross-org capable; Data Cloud record-triggered flows are a newer alternative. Webhooks: supply URL, Data Cloud generates a token to configure on the receiving side (AWS, Slack workflows, push servers).
- **Vs activation**: activation = marketer, scheduled publishes of large segments (100Ks-millions) to marketing/ad/file targets; data action = data engineer, micro-batches or single records on change events to PE/webhook/MC.

### Q&A (attendee questions)
- **Q: My CI doesn't appear when building a segment.** A: Dimension mismatch (Individual vs Unified Individual), or the CI has never run — run it once.
- **Q: Edited CI has valid syntax but won't save.** A: A new dimension was added; dimensions can't be added or removed — adding metrics is fine.
- **Q: Can I pick the subscriber key / target DE when activating to MC?** A: No — activation always creates a new shared DE keyed on the Data Cloud Individual ID; refreshes update it.
- **Q: Is BigQuery zero-copy available?** A: (~2024) Snowflake pilot exiting ~March; BigQuery/Databricks unconfirmed — verify.
- **Q: Must a data-action email route through CRM first?** A: No — set MC as the Data Action Target and send directly; add a platform event if CRM also needs updating.
- **Q: How do streaming insights drive MC journeys?** A: Data action → MC target, DE attributes exactly matching DMO field API names plus matching subscriber key, fronted by a Journey Builder API entry event.
- **Q: Can a data action on Unified Individual include contact points and update CRM?** A: Yes — related Contact Point Email/Phone/Address attributes are selectable; a platform event + Flow writes to CRM.

