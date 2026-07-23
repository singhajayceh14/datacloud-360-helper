import type { Mapping } from "@/db/schema";

export type IdType = "External ID" | "Email" | "Phone" | "Name" | "Address";
export const ID_TYPES: IdType[] = ["External ID", "Email", "Phone", "Name", "Address"];

export type SourceSignals = { name: string; types: Record<IdType, string[]> };
export type DesignRule = {
  n: number;
  name: string;
  criteria: string;
  /** Match keys (identity attributes) this rule matches on — NOT source names. */
  keys: string[];
  sources: string[];
  why: string;
  optional: boolean;
};
export type ReconRow = { attribute: string; method: string; rationale: string };
export type SegReadiness = { segment: string; requirement: string; ok: boolean };

export type UnificationDesign = {
  sources: SourceSignals[];
  rules: DesignRule[];
  reconciliation: ReconRow[];
  scenarios: string[];
  segmentReadiness: SegReadiness[];
  master: string;
  hasMappings: boolean;
};

function dmoToIdType(dmo: string): IdType | null {
  const d = dmo.toLowerCase();
  if (d.includes("party identification")) return "External ID";
  if (d.includes("contact point email")) return "Email";
  if (d.includes("contact point phone")) return "Phone";
  if (d.includes("contact point address")) return "Address";
  if (d.includes("individual")) return "Name";
  return null;
}

const emptyTypes = (): Record<IdType, string[]> => ({
  "External ID": [],
  Email: [],
  Phone: [],
  Name: [],
  Address: [],
});

/**
 * Work-backwards unification design derived from the mapping identity fields:
 * identity signal matrix, match-rule ladder (with rationale), reconciliation,
 * scenario warnings, and segment readiness.
 */
export function designUnification(
  mappings: Mapping[],
  objectives: string[],
  segmentTexts: string[],
): UnificationDesign {
  const bySource = new Map<
    string,
    { types: Record<IdType, string[]>; dmos: Set<string> }
  >();
  for (const m of mappings) {
    const e = bySource.get(m.sourceName) ?? { types: emptyTypes(), dmos: new Set<string>() };
    for (const f of m.fields) {
      const t = dmoToIdType(f.dmo);
      if (t && !e.types[t].includes(f.column)) e.types[t].push(f.column);
      e.dmos.add(f.dmo);
    }
    bySource.set(m.sourceName, e);
  }

  const names = [...bySource.keys()];
  const has = (t: IdType) => names.filter((s) => bySource.get(s)!.types[t].length > 0);

  const rules: DesignRule[] = [];
  const ext = has("External ID");
  if (ext.length)
    rules.push({
      n: rules.length + 1,
      name: "Party Identification — exact",
      criteria: "Identification Name + Identification Number equal",
      keys: ["Identification Name", "Identification Number"],
      sources: ext,
      optional: false,
      why:
        ext.length > 1
          ? `Deterministic — an external ID exists in ${ext.join(" and ")}. Strongest possible rule; always first.`
          : `Only ${ext[0]} carries an external ID today — becomes a cross-source rule once a second system shares the same ID; it also links engagement records to the person.`,
    });
  const em = has("Email");
  if (em.length)
    rules.push({
      n: rules.length + 1,
      name: "Contact Point Email — exact (normalized)",
      criteria: "Email Address equal after trim + lowercase",
      keys: ["Email Address"],
      sources: em,
      optional: false,
      why: `Email present in ${em.join(", ")}. Normalize at stream level so case/whitespace never blocks a match. Shared family/company inboxes are the over-match risk.`,
    });
  const ph = has("Phone");
  if (ph.length)
    rules.push({
      n: rules.length + 1,
      name: "Contact Point Phone — exact (E.164)",
      criteria: "Telephone Number equal after E.164 normalization",
      keys: ["Telephone Number"],
      sources: ph,
      optional: false,
      why: `Phone present in ${ph.join(", ")}. Only reliable after E.164 normalization with a confirmed default country code.`,
    });
  const nm = has("Name");
  if (nm.length && (has("Address").length || em.length || ph.length))
    rules.push({
      n: rules.length + 1,
      name: "Guarded fuzzy — Fuzzy First Name + Exact Last Name + exact anchor",
      criteria: "Fuzzy(First Name) AND Last Name equal AND (email OR phone OR full address equal)",
      keys: ["First Name (fuzzy)", "Last Name", "Email / Phone / Address anchor"],
      sources: nm,
      optional: true,
      why: "Catches typo'd duplicates. Optional — enable only after reviewing name fill rates. Never ship fuzzy-name-only or address-only rules: over-matching is far more damaging than under-matching.",
    });

  const master =
    [...names].sort(
      (a, b) =>
        Object.values(bySource.get(b)!.types).filter((x) => x.length).length -
        Object.values(bySource.get(a)!.types).filter((x) => x.length).length,
    )[0] ?? "the richest source";

  const reconciliation: ReconRow[] = [
    { attribute: "Default (most attributes)", method: "Last Updated", rationale: "Freshest value wins — the right default for volatile attributes." },
    { attribute: "First / Last Name", method: `Source Priority → ${master}, then Last Updated`, rationale: `${master} is the richest profile source — confirm with the client that it is the trusted master.` },
    { attribute: "Email / Phone", method: "Last Updated", rationale: "People change contact points; freshness beats source authority." },
    { attribute: "Address", method: `Source Priority → ${master}`, rationale: "Usually maintained in one system; avoids address flip-flop between sources." },
  ];

  const scenarios: string[] = [];
  const noPii = names.filter(
    (s) => !bySource.get(s)!.types.Email.length && !bySource.get(s)!.types.Phone.length && !bySource.get(s)!.types.Name.length,
  );
  noPii.forEach((s) =>
    scenarios.push(`${s} carries no person PII — its records reach the unified profile only through the shared external ID. The customer master must carry the same ID values, or these rows stay orphaned.`),
  );
  if (em.length)
    scenarios.push("Shared inboxes (family / company email) — email-exact can over-merge household members. Review the consolidation rate after first publish; if suspicious, tighten with Last Name.");
  if (ph.length)
    scenarios.push("Shared phone numbers — same risk as shared email; confirm the E.164 default country code before this rule goes live.");
  scenarios.push("Guest checkout / missing identifiers — profiles with no matching identifier stay standalone Unified Individuals and merge later when an identifier arrives (rules rerun on schedule).");
  scenarios.push(`Start strict, loosen deliberately — over-match recovery poisons segments and activations. Ship rules 1–${Math.min(3, rules.length)} first, measure consolidation, then consider the fuzzy rule.`);

  const allDmos = new Set<string>();
  names.forEach((s) => bySource.get(s)!.dmos.forEach((d) => allDmos.add(d)));
  const items = (segmentTexts.length ? segmentTexts : objectives).filter(Boolean);
  const segmentReadiness: SegReadiness[] = items.map((sg) => {
    const l = sg.toLowerCase();
    let requirement: string;
    let ok: boolean;
    if (/win.?back|lapsed|inactive|churn|no order/.test(l)) {
      requirement = "Order events joined to the person via shared external ID + event time";
      ok = ext.length >= 1 && allDmos.has("Sales Order");
    } else if (/vip|tier|spend|ltv|lifetime|top|revenue|rfm|repeat|frequen|loyalty/.test(l)) {
      requirement = "Orders aggregated per Unified Individual (CI on Sales Order); duplicates must merge or spend splits across profiles";
      ok = allDmos.has("Sales Order") && (ext.length > 0 || em.length > 0);
    } else if (/email|newsletter|campaign/.test(l)) {
      requirement = "Consented email contact point (Contact Point Email + Communication Subscription)";
      ok = allDmos.has("Contact Point Email");
    } else if (/sms|whatsapp|phone|call/.test(l)) {
      requirement = "E.164 phone contact point + consent on the unified profile";
      ok = allDmos.has("Contact Point Phone");
    } else if (/cart|browse|web|abandon/.test(l)) {
      requirement = "Web engagement source (Web & Mobile SDK) mapped";
      ok = allDmos.has("Website Engagement") || allDmos.has("Web Engagement");
    } else if (/suppress|ticket|case|support/.test(l)) {
      requirement = "Case / support object mapped and joined to the person";
      ok = allDmos.has("Case");
    } else {
      requirement = "Person-level profile with merged duplicates (baseline unification)";
      ok = true;
    }
    return { segment: sg, requirement, ok };
  });

  return {
    sources: names.map((n) => ({ name: n, types: bySource.get(n)!.types })),
    rules,
    reconciliation,
    scenarios,
    segmentReadiness,
    master,
    hasMappings: mappings.length > 0,
  };
}
