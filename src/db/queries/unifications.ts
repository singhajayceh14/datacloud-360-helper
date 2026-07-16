import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { unifications, type MatchRule } from "@/db/schema";

export async function getUnification(projectId: string) {
  const [row] = await getDb()
    .select()
    .from(unifications)
    .where(eq(unifications.projectId, projectId));
  return row ?? null;
}

export async function upsertUnification(
  projectId: string,
  matchRules: MatchRule[],
  notes: string,
) {
  const [row] = await getDb()
    .insert(unifications)
    .values({ projectId, matchRules, notes })
    .onConflictDoUpdate({
      target: unifications.projectId,
      set: { matchRules, notes },
    })
    .returning();
  return row;
}
