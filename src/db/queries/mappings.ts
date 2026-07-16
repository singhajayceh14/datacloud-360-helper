import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { mappings, type NewMapping } from "@/db/schema";

export function listMappings(projectId: string) {
  return getDb()
    .select()
    .from(mappings)
    .where(eq(mappings.projectId, projectId))
    .orderBy(desc(mappings.updatedAt));
}

export async function createMapping(data: NewMapping) {
  const [row] = await getDb().insert(mappings).values(data).returning();
  return row;
}

export async function deleteMapping(id: string) {
  await getDb().delete(mappings).where(eq(mappings.id, id));
}
