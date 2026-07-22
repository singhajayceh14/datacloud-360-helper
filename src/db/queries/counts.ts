import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sources, mappings, segments, activations } from "@/db/schema";

export type ProjectCounts = {
  sources: number;
  mappings: number;
  segments: number;
  activations: number;
  dmos: number;
  gaps: number;
};

/** Lightweight per-tab counts for the tab-bar badges. */
export async function getProjectCounts(projectId: string): Promise<ProjectCounts> {
  const db = getDb();
  const [srcs, maps, segs, acts] = await Promise.all([
    db.select({ id: sources.id }).from(sources).where(eq(sources.projectId, projectId)),
    db.select().from(mappings).where(eq(mappings.projectId, projectId)),
    db.select().from(segments).where(eq(segments.projectId, projectId)),
    db.select({ id: activations.id }).from(activations).where(eq(activations.projectId, projectId)),
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

  return {
    sources: srcs.length,
    mappings: maps.length,
    segments: segs.length,
    activations: acts.length,
    dmos: dmos.size,
    gaps: gaps.size,
  };
}
