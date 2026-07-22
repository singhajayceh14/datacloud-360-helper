import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sources, type NewSource } from "@/db/schema";

export function listSources(projectId: string) {
  return getDb()
    .select()
    .from(sources)
    .where(eq(sources.projectId, projectId))
    .orderBy(asc(sources.createdAt));
}

export async function createSource(
  data: Omit<NewSource, "id" | "createdAt" | "updatedAt">,
) {
  const [row] = await getDb().insert(sources).values(data).returning();
  return row;
}

export async function updateSource(
  id: string,
  data: Partial<Omit<NewSource, "id" | "projectId" | "createdAt">>,
) {
  const [row] = await getDb()
    .update(sources)
    .set(data)
    .where(eq(sources.id, id))
    .returning();
  return row;
}

export async function deleteSource(id: string) {
  await getDb().delete(sources).where(eq(sources.id, id));
}
