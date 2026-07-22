"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createProject } from "@/db/queries/projects";

/** Create a project from the header "New client name" field and activate it. */
export async function quickCreateProjectAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  try {
    const p = await createProject({ name });
    (await cookies()).set("activeProjectId", p.id, { path: "/" });
    revalidatePath("/", "layout");
  } catch {
    /* duplicate name or DB error — ignore, header stays as-is */
  }
}
