import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, type NewProject } from "@/db/schema";

export function listProjects() {
  return db.select().from(projects).orderBy(projects.updatedAt);
}

export async function getProject(id: string) {
  const [row] = await db.select().from(projects).where(eq(projects.id, id));
  return row ?? null;
}

export async function createProject(data: NewProject) {
  const [row] = await db.insert(projects).values(data).returning();
  return row;
}

export async function updateProject(
  id: string,
  data: Partial<Omit<NewProject, "id">>,
) {
  const [row] = await db
    .update(projects)
    .set(data)
    .where(eq(projects.id, id))
    .returning();
  return row ?? null;
}

export async function deleteProject(id: string) {
  await db.delete(projects).where(eq(projects.id, id));
}
