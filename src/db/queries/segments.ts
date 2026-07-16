import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { segments, type NewSegment } from "@/db/schema";

export function listSegments(projectId: string) {
  return getDb()
    .select()
    .from(segments)
    .where(eq(segments.projectId, projectId))
    .orderBy(desc(segments.updatedAt));
}

export async function createSegment(data: NewSegment) {
  const [row] = await getDb().insert(segments).values(data).returning();
  return row;
}

export async function updateSegment(
  id: string,
  data: Partial<Omit<NewSegment, "id" | "projectId">>,
) {
  const [row] = await getDb()
    .update(segments)
    .set(data)
    .where(eq(segments.id, id))
    .returning();
  return row ?? null;
}

export async function deleteSegment(id: string) {
  await getDb().delete(segments).where(eq(segments.id, id));
}
