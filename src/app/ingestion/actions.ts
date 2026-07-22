"use server";

import { revalidatePath } from "next/cache";
import {
  createSource,
  updateSource,
  deleteSource,
} from "@/db/queries/sources";

export type CreateState = { error?: string; ok?: boolean };

export async function createSourceAction(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const projectId = String(formData.get("projectId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!projectId) return { error: "No active project." };
  if (!name) return { error: "Source name is required." };

  const get = (k: string) => String(formData.get(k) ?? "").trim();

  try {
    await createSource({
      projectId,
      name,
      entities: get("entities"),
      method: get("method"),
      frequency: get("frequency") || "TBD",
      status: get("status") || "Proposed",
      notes: get("notes"),
    });
    revalidatePath("/ingestion");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function updateSourceStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;
  await updateSource(id, { status });
  revalidatePath("/ingestion");
}

export async function deleteSourceAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteSource(id);
  revalidatePath("/ingestion");
}
