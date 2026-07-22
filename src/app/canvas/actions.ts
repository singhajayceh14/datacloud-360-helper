"use server";

import { revalidatePath } from "next/cache";
import { listProjects } from "@/db/queries/projects";
import { duplicateProject } from "@/db/queries/scenarios";

/** Fork the active project into a uniquely-named scenario copy. */
export async function duplicateProjectAction(formData: FormData) {
  const sourceId = String(formData.get("id") ?? "");
  if (!sourceId) return;

  const projs = await listProjects();
  const orig = projs.find((p) => p.id === sourceId);
  if (!orig) return;

  const names = new Set(projs.map((p) => p.name));
  const base = `${orig.name} — Scenario`;
  let name = base;
  let n = 2;
  while (names.has(name)) name = `${base} ${n++}`;

  await duplicateProject(sourceId, name);
  revalidatePath("/", "layout"); // refresh the sidebar project list
  revalidatePath("/canvas");
}
