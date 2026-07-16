import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { activations, type NewActivation } from "@/db/schema";

export async function listActivations(projectId: string) {
  return getDb()
    .select()
    .from(activations)
    .where(eq(activations.projectId, projectId))
    .orderBy(asc(activations.createdAt));
}

export async function createActivation(
  data: Omit<NewActivation, "id" | "createdAt" | "updatedAt">,
) {
  const [row] = await getDb().insert(activations).values(data).returning();
  return row;
}

export async function updateActivation(
  id: string,
  data: Partial<Omit<NewActivation, "id" | "projectId" | "createdAt">>,
) {
  const [row] = await getDb()
    .update(activations)
    .set(data)
    .where(eq(activations.id, id))
    .returning();
  return row;
}

export async function deleteActivation(id: string) {
  await getDb().delete(activations).where(eq(activations.id, id));
}
