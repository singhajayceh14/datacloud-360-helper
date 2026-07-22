import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { objectives } from "@/db/schema";

export function listObjectives(projectId: string) {
  return getDb()
    .select()
    .from(objectives)
    .where(eq(objectives.projectId, projectId))
    .orderBy(asc(objectives.createdAt));
}

export async function createObjective(projectId: string, text: string) {
  const [row] = await getDb()
    .insert(objectives)
    .values({ projectId, text })
    .returning();
  return row;
}

export async function deleteObjective(id: string) {
  await getDb().delete(objectives).where(eq(objectives.id, id));
}
