import "server-only";
import { getProject } from "@/db/queries/projects";
import { listMappings } from "@/db/queries/mappings";
import { getUnification } from "@/db/queries/unifications";
import { listSegments } from "@/db/queries/segments";
import { listActivations } from "@/db/queries/activations";
import { getEntitlement } from "@/db/queries/entitlements";
import { listSources } from "@/db/queries/sources";
import { listObjectives } from "@/db/queries/objectives";
import { deriveUnification } from "@/lib/unification/derive";
import { activationWarnings } from "@/lib/activation/warnings";
import { calcConsumption, formatCredits } from "@/lib/entitlements/calc";
import type { Block, BrdDoc, Section } from "./model";

const yn = (b: boolean) => (b ? "Yes" : "—");
const dash = (s: string | null | undefined) => (s && s.trim() ? s : "—");

/**
 * Assemble the living BRD / SDD for a project from every tab. `generatedAt`
 * is passed in (ISO date) so the pure model never has to read the clock.
 */
export async function buildBrd(
  projectId: string,
  generatedAt: string,
): Promise<BrdDoc | null> {
  const project = await getProject(projectId).catch(() => null);
  if (!project) return null;

  const [mappings, unification, segments, activations, entitlement, srcInventory, objectives] =
    await Promise.all([
      listMappings(projectId).catch(() => []),
      getUnification(projectId).catch(() => null),
      listSegments(projectId).catch(() => []),
      listActivations(projectId).catch(() => []),
      getEntitlement(projectId).catch(() => null),
      listSources(projectId).catch(() => []),
      listObjectives(projectId).catch(() => []),
    ]);

  const derived = deriveUnification(mappings);
  const segmentById = new Map(segments.map((s) => [s.id, s]));
  const openItems: string[] = [];

  const sections: Section[] = [];

  // 1 — Project overview.
  const overviewBlocks: Block[] = [
    {
      type: "p",
      text: `This solution-design document captures the Data Cloud 360 implementation design for ${project.name}. It is generated from the console tabs and stays in sync as each tab is updated.`,
    },
    {
      type: "table",
      head: ["Field", "Value"],
      rows: [
        ["Project", project.name],
        ["Client", dash(project.client)],
        ["Edition", dash(project.edition)],
        ["Phase", dash(project.phase)],
        ["Status", dash(project.status)],
      ],
    },
  ];
  if (objectives.length > 0) {
    overviewBlocks.push({ type: "h3", text: "Business objectives" });
    overviewBlocks.push({ type: "ul", items: objectives.map((o) => o.text) });
  }
  sections.push({ id: "overview", title: "Project overview", blocks: overviewBlocks });

  // 2 — Data sources & ingestion.
  const sourceBlocks: Block[] = [];

  // Ingestion inventory (from the Ingestion tab).
  if (srcInventory.length > 0) {
    sourceBlocks.push({ type: "h3", text: "Ingestion inventory" });
    sourceBlocks.push({
      type: "table",
      head: ["Source", "Entities", "Method", "Frequency", "Status"],
      rows: srcInventory.map((s) => [
        s.name,
        dash(s.entities),
        dash(s.method),
        s.frequency,
        s.status,
      ]),
    });
    for (const s of srcInventory) {
      if (s.status === "Blocked")
        openItems.push(`Ingestion: source "${s.name}" is Blocked.`);
    }
  }

  // Mapped/profiled sources (from the Data Mapping tab).
  if (mappings.length === 0) {
    sourceBlocks.push({
      type: "note",
      tone: srcInventory.length > 0 ? "info" : "warn",
      text: "No sources mapped yet — add mappings on the Data Mapping tab.",
    });
    if (srcInventory.length === 0) openItems.push("No data sources mapped.");
  } else {
    sourceBlocks.push({ type: "h3", text: "Mapped sources" });
    sourceBlocks.push({
      type: "table",
      head: ["Source", "File", "Rows sampled", "Fields", "Identity fields"],
      rows: mappings.map((m) => [
        m.sourceName,
        dash(m.fileName),
        String(m.rowsSampled),
        String(m.fields.length),
        String(m.fields.filter((f) => f.identity).length),
      ]),
    });
  }
  sections.push({
    id: "sources",
    title: "Data sources & ingestion",
    blocks: sourceBlocks,
  });

  // 3 — Data model & field mapping.
  const modelBlocks: Block[] = [];
  if (mappings.length === 0) {
    modelBlocks.push({
      type: "note",
      tone: "info",
      text: "Field mappings will appear here once sources are mapped.",
    });
  } else {
    for (const m of mappings) {
      modelBlocks.push({ type: "h3", text: m.sourceName });
      modelBlocks.push({
        type: "table",
        head: ["Column", "Sample", "DLO", "DMO", "Field", "Category", "Identity"],
        rows: m.fields.map((f) => [
          f.column,
          dash(f.sample),
          f.dlo,
          f.dmo,
          dash(f.dmoField),
          f.category,
          yn(f.identity),
        ]),
      });
    }
  }
  sections.push({
    id: "model",
    title: "Data model & field mapping",
    blocks: modelBlocks,
  });

  // 4 — Identity resolution (unification).
  const irBlocks: Block[] = [];
  const rules =
    unification && unification.matchRules.length > 0
      ? unification.matchRules
      : derived.matchRules;
  irBlocks.push({
    type: "table",
    head: ["Identity signal", "Present"],
    rows: [
      ["Party Identification", yn(derived.identity.hasPartyId)],
      ["Email", yn(derived.identity.hasEmail)],
      ["Phone", yn(derived.identity.hasPhone)],
      ["Name", yn(derived.identity.hasName)],
      ["Address", yn(derived.identity.hasAddress)],
    ],
  });
  if (rules.length > 0) {
    irBlocks.push({
      type: "table",
      head: ["#", "Rule", "Keys", "Type", "Enabled"],
      rows: rules.map((r, i) => [
        String(i + 1),
        r.name,
        r.keys.join(", "),
        r.type,
        yn(r.enabled),
      ]),
    });
  } else {
    irBlocks.push({
      type: "note",
      tone: "warn",
      text: "No match rules — map identity fields (email, phone, party ID) to build the ladder.",
    });
  }
  irBlocks.push({
    type: "note",
    tone: derived.readiness.ready ? "info" : "warn",
    text: `Readiness: ${derived.readiness.reason}`,
  });
  if (unification && unification.notes.trim()) {
    irBlocks.push({ type: "p", text: unification.notes });
  }
  for (const w of derived.warnings) {
    irBlocks.push({ type: "note", tone: w.level, text: w.text });
    if (w.level === "warn") openItems.push(`Unification: ${w.text}`);
  }
  sections.push({
    id: "unification",
    title: "Identity resolution (unification)",
    blocks: irBlocks,
  });

  // 5 — Segments.
  const segBlocks: Block[] = [];
  if (segments.length === 0) {
    segBlocks.push({
      type: "note",
      tone: "info",
      text: "No segments defined yet.",
    });
  } else {
    segBlocks.push({
      type: "table",
      head: ["Name", "Objective", "Criteria", "DMOs", "Cadence", "Channel", "Status"],
      rows: segments.map((s) => [
        s.name,
        dash(s.objective),
        dash(s.criteria),
        dash(s.dmos),
        s.cadence,
        dash(s.channel),
        s.status,
      ]),
    });
  }
  sections.push({ id: "segments", title: "Segments", blocks: segBlocks });

  // 6 — Activation plan.
  const actBlocks: Block[] = [];
  if (activations.length === 0) {
    actBlocks.push({
      type: "note",
      tone: "info",
      text: "No activations planned yet.",
    });
  } else {
    actBlocks.push({
      type: "table",
      head: ["Segment", "Destination", "Channel", "Cadence", "Consent", "Status"],
      rows: activations.map((a) => [
        segmentById.get(a.segmentId)?.name ?? "—",
        a.target,
        dash(a.channel),
        a.cadence,
        dash(a.consentBasis),
        a.status,
      ]),
    });
    for (const a of activations) {
      for (const w of activationWarnings(a, segmentById.get(a.segmentId))) {
        actBlocks.push({ type: "note", tone: "warn", text: w.message });
        openItems.push(`Activation: ${w.message}`);
      }
    }
  }
  sections.push({
    id: "activation",
    title: "Activation plan",
    blocks: actBlocks,
  });

  // 7 — Entitlements & consumption.
  const entBlocks: Block[] = [];
  if (!entitlement) {
    entBlocks.push({
      type: "note",
      tone: "info",
      text: "Entitlements not captured yet — complete the Entitlements tab.",
    });
    openItems.push("Entitlements / order form not captured.");
  } else {
    entBlocks.push({
      type: "table",
      head: ["Item", "Value"],
      rows: [
        ["Data Services credits", formatCredits(entitlement.dataServicesCredits)],
        ["Sandbox credits", formatCredits(entitlement.sandboxCredits)],
        ["Flex credits", formatCredits(entitlement.flexCredits)],
        ["Data storage (TB)", String(entitlement.dataStorageTb)],
        ["Contract start", dash(entitlement.contractStart)],
        ["Order end date", dash(entitlement.orderEndDate)],
        ["Edition / notes", dash(entitlement.notes)],
      ],
    });
    if (entitlement.lineItems.length > 0) {
      entBlocks.push({
        type: "table",
        head: ["Usage type", "Volume / mo", "Credits / unit", "Annual credits"],
        rows: entitlement.lineItems.map((l) => [
          l.category,
          `${l.monthlyVolume} ${l.unit}`,
          String(l.creditsPerUnit),
          formatCredits(l.monthlyVolume * l.creditsPerUnit * 12),
        ]),
      });
    }
    const sum = calcConsumption(
      entitlement.lineItems,
      entitlement.dataServicesCredits,
    );
    entBlocks.push({
      type: "p",
      text: `Estimated annual burn ${formatCredits(sum.annualCredits)}${
        sum.utilizationPct !== null
          ? ` — ${sum.utilizationPct.toFixed(0)}% of the ${formatCredits(entitlement.dataServicesCredits)} credit pool`
          : ""
      }.`,
    });
    for (const w of sum.warnings) {
      entBlocks.push({ type: "note", tone: "warn", text: w });
      openItems.push(`Entitlements: ${w}`);
    }
  }
  sections.push({
    id: "entitlements",
    title: "Entitlements & consumption",
    blocks: entBlocks,
  });

  // 8 — Open items & risks.
  sections.push({
    id: "open-items",
    title: "Open items & risks",
    blocks:
      openItems.length > 0
        ? [{ type: "ul", items: openItems }]
        : [
            {
              type: "note",
              tone: "info",
              text: "No open items flagged — all tabs pass their checks.",
            },
          ],
  });

  return {
    title: `${project.name} — Solution Design Document`,
    subtitle: "Data Cloud 360 implementation — Business Requirements & Solution Design",
    generatedAt,
    sections,
  };
}
