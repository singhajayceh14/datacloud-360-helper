"use server";

import { revalidatePath } from "next/cache";
import { createMapping, deleteMapping } from "@/db/queries/mappings";
import type { MappingField } from "@/db/schema";

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
    revalidatePath("/mapping");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteMappingAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteMapping(id);
  revalidatePath("/mapping");
}
