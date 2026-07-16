"use server";

import { revalidatePath } from "next/cache";
import { createProject, deleteProject } from "@/db/queries/projects";

export type CreateState = { error?: string; ok?: boolean };

export async function createProjectAction(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const name = String(formData.get("name") ?? "").trim();
  const client = String(formData.get("client") ?? "").trim();

  if (!name) return { error: "Project name is required." };

  try {
    await createProject({ name, client: client || null });
    revalidatePath("/projects");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/unique|duplicate/i.test(msg)) {
      return { error: `A project named "${name}" already exists.` };
    }
    return { error: msg };
  }
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteProject(id);
  revalidatePath("/projects");
}
