import type { Mapping, MatchRule } from "@/db/schema";

export type Warning = { level: "warn" | "info"; text: string };

export type DerivedUnification = {
  matchRules: MatchRule[];
  warnings: Warning[];
  readiness: { ready: boolean; reason: string };
  identity: {
    hasPartyId: boolean;
    hasEmail: boolean;
    hasPhone: boolean;
    hasName: boolean;
    hasAddress: boolean;
    piiLessSources: string[]; // sources with no identity fields
  };
};

function hasDmo(mappings: Mapping[], dmoIncludes: string, identityOnly = false) {
  return mappings.some((m) =>
    m.fields.some(
      (f) =>
        f.dmo.toLowerCase().includes(dmoIncludes) &&
        (!identityOnly || f.identity),
    ),
  );
}

/**
 * Derive the match-rule ladder, scenario warnings, and segment-readiness from
 * the project's mappings. Strongest (highest-confidence) rules come first.
 */
export function deriveUnification(mappings: Mapping[]): DerivedUnification {
  const hasPartyId = hasDmo(mappings, "party identification", true);
  const hasEmail = hasDmo(mappings, "contact point email");
  const hasPhone = hasDmo(mappings, "contact point phone");
  const hasName = hasDmo(mappings, "individual");
  const hasAddress = hasDmo(mappings, "contact point address");

  const piiLessSources = mappings
    .filter((m) => !m.fields.some((f) => f.identity))
    .map((m) => m.sourceName);

  const matchRules: MatchRule[] = [];
  if (hasPartyId)
    matchRules.push({
      name: "Party Identification exact match",
      keys: ["Party Identification"],
      type: "exact",
      enabled: true,
    });
  if (hasEmail)
    matchRules.push({
      name: "Email exact match",
      keys: ["Contact Point Email"],
      type: "exact",
      enabled: true,
    });
  if (hasPhone)
    matchRules.push({
      name: "Phone exact match",
      keys: ["Contact Point Phone"],
      type: "exact",
      enabled: true,
    });
  if (hasName && hasAddress)
    matchRules.push({
      name: "Name + Address fuzzy match",
      keys: ["Individual", "Contact Point Address"],
      type: "fuzzy",
      enabled: true,
    });

  const warnings: Warning[] = [];
  if (hasEmail)
    warnings.push({
      level: "warn",
      text: "Email match key present — shared/role inboxes (info@, sales@) can over-merge distinct people. Exclude generic inboxes from the email match rule.",
    });
  if (hasEmail && !hasPartyId)
    warnings.push({
      level: "warn",
      text: "Sources have email/phone but no stable Party Identification — guest-checkout and anonymous records may fragment across profiles.",
    });
  if (piiLessSources.length > 0)
    warnings.push({
      level: "warn",
      text: `PII-less feed(s) with no identity fields cannot participate in unification: ${piiLessSources.join(", ")}.`,
    });
  if (matchRules.length === 1 && matchRules[0].type === "fuzzy")
    warnings.push({
      level: "warn",
      text: "Only a fuzzy rule is available — matches will be low-confidence. Add a stable identifier (ID, email, or phone) to a source.",
    });

  const hasExact = matchRules.some((r) => r.type === "exact");
  const readiness = hasExact
    ? {
        ready: true,
        reason:
          "At least one exact-match identity rule is available — the project can unify profiles and build segments.",
      }
    : {
        ready: false,
        reason:
          "No exact-match identity field found across mappings. Flag an ID, email, or phone field in Data Mapping before unifying.",
      };

  return {
    matchRules,
    warnings,
    readiness,
    identity: {
      hasPartyId,
      hasEmail,
      hasPhone,
      hasName,
      hasAddress,
      piiLessSources,
    },
  };
}
