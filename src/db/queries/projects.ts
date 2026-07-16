import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { projects, type NewProject } from "@/db/schema";

export function listProjects() {
  return getDb().select().from(projects).orderBy(desc(projects.updatedAt));
}

export async function getProject(id: string) {
  const [row] = await getDb().select().from(projects).where(eq(projects.id, id));
  return row ?? null;
}

export async function createProject(data: NewProject) {
  const [row] = await getDb().insert(projects).values(data).returning();
  return row;
}

export async function updateProject(
  id: string,
  data: Partial<Omit<NewProject, "id">>,
) {
  const [row] = await getDb()
    .update(projects)
    .set(data)
    .where(eq(projects.id, id))
    .returning();
  return row ?? null;
}

export async function deleteProject(id: string) {
  await getDb().delete(projects).where(eq(projects.id, id));
}
