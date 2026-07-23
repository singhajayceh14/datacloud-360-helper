"use server";

import { revalidatePath } from "next/cache";
import {
  createMapping,
  updateMapping,
  deleteMapping,
} from "@/db/queries/mappings";
import type { MappingField } from "@/db/schema";

/** Mapped DMOs drive gap detection on these tabs, so revalidate them together. */
function revalidateMappingDependents() {
  revalidatePath("/mapping");
  revalidatePath("/canvas");
  revalidatePath("/unification");
  revalidatePath("/segments");
}

export type SaveMappingInput = {
  projectId: string;
  sourceName: string;
  fileName: string | null;
  rowsSampled: number;
  fields: MappingField[];
};

export async function saveMappingAction(
  input: SaveMappingInput,
): Promise<{ ok?: boolean; error?: string }> {
  if (!input.projectId) return { error: "No active project." };
  if (!input.sourceName.trim()) return { error: "Source name is required." };
  if (!input.fields?.length) return { error: "Nothing to save — profile a CSV first." };

  try {
    await createMapping({
      projectId: input.projectId,
      sourceName: input.sourceName.trim(),
      fileName: input.fileName,
      rowsSampled: input.rowsSampled,
      fields: input.fields,
    });
    revalidateMappingDependents();
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export type UpdateMappingInput = {
  id: string;
  sourceName: string;
  fields: MappingField[];
};

export async function updateMappingAction(
  input: UpdateMappingInput,
): Promise<{ ok?: boolean; error?: string }> {
  if (!input.id) return { error: "Missing mapping id." };
  if (!input.sourceName.trim()) return { error: "Source name is required." };
  if (!input.fields?.length) return { error: "A mapping needs at least one field." };

  try {
    await updateMapping(input.id, {
      sourceName: input.sourceName.trim(),
      fields: input.fields,
    });
    revalidateMappingDependents();
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteMappingAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteMapping(id);
  revalidateMappingDependents();
}
