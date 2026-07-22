import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  projects,
  sources,
  mappings,
  unifications,
  segments,
  activations,
  entitlements,
} from "@/db/schema";
import { calcConsumption } from "@/lib/entitlements/calc";

/** Base name shared by a project and its scenario forks. */
export const baseName = (name: string) => name.split(" — Scenario")[0].trim();

/** Deep-clone a project and all its per-tab data into a new named project. */
export async function duplicateProject(sourceId: string, newName: string) {
  const db = getDb();
  const [orig] = await db.select().from(projects).where(eq(projects.id, sourceId));
  if (!orig) throw new Error("Project not found.");

  const [np] = await db
    .insert(projects)
    .values({
      name: newName,
      client: orig.client,
      edition: orig.edition,
      phase: orig.phase,
      status: orig.status,
    })
    .returning();

  const srcRows = await db.select().from(sources).where(eq(sources.projectId, sourceId));
  if (srcRows.length)
    await db.insert(sources).values(
      srcRows.map((s) => ({
        projectId: np.id,
        name: s.name,
        entities: s.entities,
        method: s.method,
        frequency: s.frequency,
        status: s.status,
        notes: s.notes,
      })),
    );

  const mapRows = await db.select().from(mappings).where(eq(mappings.projectId, sourceId));
  if (mapRows.length)
    await db.insert(mappings).values(
      mapRows.map((m) => ({
        projectId: np.id,
        sourceName: m.sourceName,
        fileName: m.fileName,
        rowsSampled: m.rowsSampled,
        fields: m.fields,
      })),
    );

  const [uni] = await db
    .select()
    .from(unifications)
    .where(eq(unifications.projectId, sourceId));
  if (uni)
    await db
      .insert(unifications)
      .values({ projectId: np.id, matchRules: uni.matchRules, notes: uni.notes });

  // Segments — capture old→new id map so activations can be re-pointed.
  const segRows = await db.select().from(segments).where(eq(segments.projectId, sourceId));
  const idMap = new Map<string, string>();
  for (const s of segRows) {
    const [ns] = await db
      .insert(segments)
      .values({
        projectId: np.id,
        name: s.name,
        objective: s.objective,
        criteria: s.criteria,
        dmos: s.dmos,
        calculatedInsights: s.calculatedInsights,
        cadence: s.cadence,
        channel: s.channel,
        status: s.status,
      })
      .returning();
    idMap.set(s.id, ns.id);
  }

  const actRows = await db.select().from(activations).where(eq(activations.projectId, sourceId));
  const actVals = actRows
    .filter((a) => idMap.has(a.segmentId))
    .map((a) => ({
      projectId: np.id,
      segmentId: idMap.get(a.segmentId)!,
      target: a.target,
      channel: a.channel,
      cadence: a.cadence,
      consentBasis: a.consentBasis,
      status: a.status,
    }));
  if (actVals.length) await db.insert(activations).values(actVals);

  const [ent] = await db
    .select()
    .from(entitlements)
    .where(eq(entitlements.projectId, sourceId));
  if (ent)
    await db.insert(entitlements).values({
      projectId: np.id,
      dataServicesCredits: ent.dataServicesCredits,
      sandboxCredits: ent.sandboxCredits,
      flexCredits: ent.flexCredits,
      dataStorageTb: ent.dataStorageTb,
      contractStart: ent.contractStart,
      orderEndDate: ent.orderEndDate,
      notes: ent.notes,
      lineItems: ent.lineItems,
    });

  return np;
}

export type ScenarioRow = {
  id: string;
  name: string;
  sources: number;
  dmos: number;
  gaps: number;
  segments: number;
  activations: number;
  credits: number | null;
};

/** Per-project design metrics for the scenario comparison table. */
export async function getScenarioComparison(): Promise<ScenarioRow[]> {
  const db = getDb();
  const projs = await db.select().from(projects).orderBy(asc(projects.name));

  return Promise.all(
    projs.map(async (p) => {
      const [srcs, maps, segs, acts, entRows] = await Promise.all([
        db.select().from(sources).where(eq(sources.projectId, p.id)),
        db.select().from(mappings).where(eq(mappings.projectId, p.id)),
        db.select().from(segments).where(eq(segments.projectId, p.id)),
        db.select().from(activations).where(eq(activations.projectId, p.id)),
        db.select().from(entitlements).where(eq(entitlements.projectId, p.id)),
      ]);

      const dmos = new Set<string>();
      maps.forEach((m) => m.fields.forEach((f) => dmos.add(f.dmo)));
      const mappedNorm = new Set([...dmos].map((d) => d.toLowerCase()));
      const gaps = new Set<string>();
      segs.forEach((s) =>
        s.dmos
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
          .forEach((r) => {
            if (!mappedNorm.has(r.toLowerCase())) gaps.add(r);
          }),
      );
      const ent = entRows[0];
      const credits = ent
        ? calcConsumption(ent.lineItems, ent.dataServicesCredits).annualCredits
        : null;

      return {
        id: p.id,
        name: p.name,
        sources: srcs.length,
        dmos: dmos.size,
        gaps: gaps.size,
        segments: segs.length,
        activations: acts.length,
        credits,
      };
    }),
  );
}
