import type { ConsumptionLine } from "@/db/schema";

/**
 * A starter rate card of the metered Data 360 usage types (grounding.md:
 * records processed / queried / analyzed, segmentation & activation, ad
 * audiences, identity resolution, calculated insights).
 *
 * The multipliers below are ILLUSTRATIVE placeholders, not official Salesforce
 * rates — replace them with the values from your order form. Volumes are in
 * millions of rows per month.
 */
export const DEFAULT_LINES: ConsumptionLine[] = [
  { category: "Data ingestion & processing", unit: "M rows / mo", monthlyVolume: 10, creditsPerUnit: 1000 },
  { category: "Identity resolution", unit: "M rows resolved / mo", monthlyVolume: 5, creditsPerUnit: 2000 },
  { category: "Segmentation & activation", unit: "M rows processed / mo", monthlyVolume: 20, creditsPerUnit: 1200 },
  { category: "Calculated insights", unit: "M rows / mo", monthlyVolume: 5, creditsPerUnit: 1500 },
  { category: "Data queries (Query / Profile API)", unit: "M records / mo", monthlyVolume: 10, creditsPerUnit: 400 },
  { category: "Ad audiences", unit: "M rows / mo", monthlyVolume: 2, creditsPerUnit: 1800 },
];

export type ConsumptionSummary = {
  monthlyCredits: number;
  annualCredits: number;
  perLine: number[]; // annual credits per line, index-aligned with input
  utilizationPct: number | null; // null when no credit pool is set
  remaining: number; // pool − annual (negative = overage)
  warnings: string[];
};

export function lineAnnualCredits(l: ConsumptionLine): number {
  const v = Number(l.monthlyVolume) || 0;
  const r = Number(l.creditsPerUnit) || 0;
  return v * r * 12;
}

export function calcConsumption(
  lines: ConsumptionLine[],
  dataServicesCredits: number,
): ConsumptionSummary {
  const perLine = lines.map(lineAnnualCredits);
  const annualCredits = perLine.reduce((a, b) => a + b, 0);
  const monthlyCredits = annualCredits / 12;
  const pool = Number(dataServicesCredits) || 0;
  const utilizationPct = pool > 0 ? (annualCredits / pool) * 100 : null;
  const remaining = pool - annualCredits;

  const warnings: string[] = [];
  if (pool <= 0) {
    warnings.push(
      "No Data Services credit pool set — enter your order-form credits to check the estimate against your entitlement.",
    );
  } else if (annualCredits > pool) {
    warnings.push(
      `Estimated annual burn (${formatCredits(annualCredits)}) exceeds the credit pool (${formatCredits(pool)}) by ${formatCredits(annualCredits - pool)} — over-committed.`,
    );
  } else if (utilizationPct !== null && utilizationPct >= 80) {
    warnings.push(
      `Estimated burn is ${utilizationPct.toFixed(0)}% of the credit pool — little headroom for growth or reprocessing spikes.`,
    );
  }

  return {
    monthlyCredits,
    annualCredits,
    perLine,
    utilizationPct,
    remaining,
    warnings,
  };
}

/** Compact credit formatting: 2_500_000 → "2.5M". */
export function formatCredits(n: number): string {
  const v = Math.round(n);
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(v);
}
