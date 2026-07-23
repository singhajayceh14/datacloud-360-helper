import { formatCredits } from "./calc";

export const RATE_CARD_DATE = "July 2025";

export type Rate = {
  key: string;
  title: string;
  unit: string; // rate unit, e.g. "per 1M rows"
  volLabel: string; // input unit, e.g. "M rows/mo"
  prod: number;
  sand: number;
  note?: string;
};

export type RateGroup = { category: string; rates: Rate[] };

/**
 * The official Salesforce Customer Data Cloud rate card (July 2025), plus the
 * Segmentation & Activation card merged into Data Services credits (Sept 2025).
 * Multipliers are credits per unit; re-verify on renewal — they change.
 */
export const RATE_CARD: RateGroup[] = [
  {
    category: "Connect, Harmonize & Unify",
    rates: [
      { key: "pipeInt", title: "Data Pipeline — internal Salesforce sources", unit: "per 1M rows", volLabel: "M rows/mo", prod: 0, sand: 0, note: "CRM, Marketing Cloud etc. — included" },
      { key: "pipeB", title: "External Data Pipeline — batch", unit: "per 1M rows", volLabel: "M rows/mo", prod: 2000, sand: 1600 },
      { key: "pipeS", title: "External Data Pipeline — streaming", unit: "per 1M rows", volLabel: "M rows/mo", prod: 5000, sand: 4000 },
      { key: "txB", title: "Data Transforms — batch", unit: "per 1M rows", volLabel: "M rows/mo", prod: 400, sand: 320 },
      { key: "txS", title: "Data Transforms — streaming", unit: "per 1M rows", volLabel: "M rows/mo", prod: 5000, sand: 4000 },
      { key: "unstr", title: "Unstructured Data Processed", unit: "per MB", volLabel: "MB/mo", prod: 60, sand: 48 },
      { key: "fed", title: "Data Federation / Zero Copy — rows accessed", unit: "per 1M rows", volLabel: "M rows/mo", prod: 70, sand: 56 },
      { key: "share", title: "Data Share — rows shared out", unit: "per 1M rows", volLabel: "M rows/mo", prod: 800, sand: 640 },
      { key: "pconn", title: "Private Connect data processed", unit: "per GB", volLabel: "GB/mo", prod: 500, sand: 400 },
      { key: "unify", title: "Profile Unification (identity resolution)", unit: "per 1M rows", volLabel: "M rows/mo", prod: 100000, sand: 80000, note: "highest multiplier on the card — rows = profiles processed per run × runs" },
    ],
  },
  {
    category: "End-to-end real time",
    rates: [
      { key: "rte", title: "Sub-second Real-Time Events / API / Actions", unit: "per 1M events", volLabel: "M events/mo", prod: 70000, sand: 56000 },
    ],
  },
  {
    category: "Analyze & Predict",
    rates: [
      { key: "ciB", title: "Calculated Insights — batch", unit: "per 1M rows", volLabel: "M rows/mo", prod: 15, sand: 12 },
      { key: "ciS", title: "Calculated Insights — streaming", unit: "per 1M rows", volLabel: "M rows/mo", prod: 800, sand: 640 },
      { key: "inf", title: "Inferences (predictions)", unit: "per 1M inferences", volLabel: "M inf/mo", prod: 3500, sand: 2800 },
    ],
  },
  {
    category: "Act",
    rates: [
      { key: "dq", title: "Data Queries", unit: "per 1M rows", volLabel: "M rows/mo", prod: 2, sand: 1.6 },
      { key: "sa", title: "Streaming Actions (incl. lookups)", unit: "per 1M rows", volLabel: "M rows/mo", prod: 800, sand: 640 },
    ],
  },
  {
    category: "Segmentation & Activation — draws from Data Services credits since Sept 2025",
    rates: [
      { key: "seg", title: "Segment rows processed", unit: "per 1M rows", volLabel: "M rows/mo", prod: 20, sand: 16, note: "rows evaluated per segment refresh × refreshes" },
      { key: "actB", title: "Activation — batch", unit: "per 1M rows", volLabel: "M rows/mo", prod: 10, sand: 8 },
      { key: "actS", title: "Activate DMO — streaming", unit: "per 1M rows", volLabel: "M rows/mo", prod: 1600, sand: 1280 },
    ],
  },
];

export const ALL_RATES: Rate[] = RATE_CARD.flatMap((g) => g.rates);

export type CalcEnv = "prod" | "sand";

export type ConsumptionSummary = {
  perKey: Record<string, number>; // monthly credits per rate key
  monthlyCredits: number;
  annualCredits: number;
  utilizationPct: number | null; // annual vs pool
  remaining: number; // pool − annual
  runwayMonths: number | null; // pool / monthly
  warnings: string[];
};

export function rateFor(r: Rate, env: CalcEnv): number {
  return env === "prod" ? r.prod : r.sand;
}

/** Compute per-line and total credit consumption from volumes + environment. */
export function calcConsumptionFromVolumes(
  volumes: Record<string, number>,
  env: CalcEnv,
  poolCredits: number,
): ConsumptionSummary {
  const perKey: Record<string, number> = {};
  let monthlyCredits = 0;
  for (const r of ALL_RATES) {
    const vol = Number(volumes?.[r.key]) || 0;
    const credits = vol * rateFor(r, env);
    perKey[r.key] = credits;
    monthlyCredits += credits;
  }
  const annualCredits = monthlyCredits * 12;
  const pool = Number(poolCredits) || 0;
  const utilizationPct = pool > 0 ? (annualCredits / pool) * 100 : null;
  const remaining = pool - annualCredits;
  const runwayMonths = pool > 0 && monthlyCredits > 0 ? pool / monthlyCredits : null;

  const warnings: string[] = [];
  if (pool <= 0) {
    warnings.push("No Data Services credit pool set — enter it on the License tab to see runway.");
  } else if (runwayMonths !== null && runwayMonths < 12) {
    warnings.push(
      `Runway is ${runwayMonths.toFixed(1)} months against ${formatCredits(pool)} credits — under 12 months, revisit the design.`,
    );
  } else if (utilizationPct !== null && utilizationPct >= 80) {
    warnings.push(
      `Estimated burn is ${utilizationPct.toFixed(0)}% of the annual pool — little headroom.`,
    );
  }

  return { perKey, monthlyCredits, annualCredits, utilizationPct, remaining, runwayMonths, warnings };
}
