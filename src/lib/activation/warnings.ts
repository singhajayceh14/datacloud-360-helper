import type { Activation, Segment } from "@/db/schema";

export type ActivationWarning = {
  level: "warn" | "info";
  message: string;
};

/** Cadence frequency, lower = more frequent. Used to compare activation vs segment refresh. */
const CADENCE_RANK: Record<string, number> = {
  "Real-time": 0,
  Hourly: 1,
  Daily: 2,
  Weekly: 3,
  Manual: 4,
};

/** Targets that push to a person and therefore need a consent/lawful basis. */
function isMarketingTarget(target: string): boolean {
  return /email|sms|text|push|\bads?\b|meta|google|amazon|tiktok|linkedin|marketing cloud|personalization|social|display/i.test(
    target,
  );
}

/**
 * Compute the classic Data 360 activation risks for one activation, given the
 * segment it targets (or undefined if the segment is missing).
 */
export function activationWarnings(
  act: Activation,
  segment: Segment | undefined,
): ActivationWarning[] {
  const out: ActivationWarning[] = [];

  // Missing segment (should be rare given the FK, but stays defensive).
  if (!segment) {
    out.push({ level: "warn", message: "Target segment no longer exists." });
    return out;
  }

  // Activating against a segment that isn't live.
  if (act.status === "Active" && segment.status !== "Active") {
    out.push({
      level: "warn",
      message: `Activation is Active but segment "${segment.name}" is ${segment.status} — no audience will be published until the segment is activated.`,
    });
  }

  // Consent: a marketing/ad target with no lawful basis recorded.
  if (isMarketingTarget(act.target) && !act.consentBasis.trim()) {
    out.push({
      level: "warn",
      message: `No consent basis recorded for the ${act.target} activation — capture the Communication Subscription / consent DMO before publishing.`,
    });
  }

  // Cadence: activation runs more frequently than the segment refreshes.
  const actRank = CADENCE_RANK[act.cadence];
  const segRank = CADENCE_RANK[segment.cadence];
  if (
    actRank !== undefined &&
    segRank !== undefined &&
    actRank < segRank
  ) {
    out.push({
      level: "warn",
      message: `Activation runs ${act.cadence} but segment "${segment.name}" only refreshes ${segment.cadence} — the audience is stale between refreshes.`,
    });
  }

  return out;
}
