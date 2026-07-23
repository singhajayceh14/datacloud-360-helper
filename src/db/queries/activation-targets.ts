import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { activationTargets, type NewActivationTarget } from "@/db/schema";

export function listActivationTargets(projectId: string) {
  return getDb()
    .select()
    .from(activationTargets)
    .where(eq(activationTargets.projectId, projectId))
    .orderBy(asc(activationTargets.createdAt));
}

export async function registerActivationTarget(
  data: Omit<NewActivationTarget, "id" | "createdAt">,
) {
  const [row] = await getDb().insert(activationTargets).values(data).returning();
  return row;
}

export async function deleteActivationTarget(id: string) {
  await getDb().delete(activationTargets).where(eq(activationTargets.id, id));
}
