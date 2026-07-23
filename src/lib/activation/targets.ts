export type TargetSpec = {
  name: string;
  type: string;
  keys: string;
  notes: string;
};

/** The activation-destination catalog (Salesforce Data 360 targets). */
export const ACT_TARGET_CATALOG: TargetSpec[] = [
  { name: "Marketing Cloud Next (native)", type: "Salesforce native", keys: "Unified Individual (direct)", notes: "No connector needed — segments publish natively to MC Growth/Advanced journeys and campaigns." },
  { name: "Marketing Cloud Engagement", type: "Salesforce (activation target)", keys: "Subscriber Key / email", notes: "Creates a NEW shared data extension per activation (cannot target existing DEs or synchronized sources); refreshes update that DE. Contact point (email/phone) required." },
  { name: "Salesforce Personalization", type: "Salesforce native", keys: "Anonymous + known ID", notes: "Real-time site/app personalization from unified profiles." },
  { name: "Loyalty Management", type: "Salesforce native", keys: "Loyalty Program Member", notes: "Tier/points-driven promotions back into loyalty." },
  { name: "Meta Ads", type: "Ad platform", keys: "Hashed email, phone, MAID", notes: "Custom Audiences. Send ALL hashed emails per individual for match rate. Consent + data-sharing terms required." },
  { name: "Google Ads (Customer Match)", type: "Ad platform", keys: "Hashed email, phone, name+address", notes: "Customer Match lists; eligibility rules apply to the ads account. Send all contact points." },
  { name: "Amazon Ads", type: "Ad platform", keys: "Hashed email/phone/address", notes: "Amazon DSP audiences." },
  { name: "TikTok Ads", type: "Ad platform", keys: "Hashed email, phone, MAID", notes: "Custom audiences via connector." },
  { name: "LinkedIn Ads", type: "Ad platform", keys: "Hashed email", notes: "Matched audiences — B2B plays." },
  { name: "Cloud storage (S3/GCS/Azure)", type: "File export", keys: "Any (CSV columns)", notes: "Generic file drop for ESPs, call centers, direct mail. Downstream ownership must be named." },
  { name: "Activation API / webhook", type: "API", keys: "Any (JSON payload)", notes: "Custom endpoints; client engineering owns the receiver." },
  { name: "Data Share (Snowflake / BigQuery)", type: "Zero-copy share", keys: "Row-level share", notes: "Share segments/DMOs to the warehouse without copying — analytics and reverse-ETL suites." },
];

export function targetSpec(name: string): TargetSpec | null {
  return (
    ACT_TARGET_CATALOG.find(
      (t) => t.name.toLowerCase() === String(name || "").toLowerCase(),
    ) ?? null
  );
}
