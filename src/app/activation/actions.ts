"use server";

import { revalidatePath } from "next/cache";
import {
  createActivation,
  updateActivation,
  deleteActivation,
} from "@/db/queries/activations";

export type CreateState = { error?: string; ok?: boolean };

export async function createActivationAction(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const projectId = String(formData.get("projectId") ?? "");
  const segmentId = String(formData.get("segmentId") ?? "");
  const target = String(formData.get("target") ?? "").trim();
  if (!projectId) return { error: "No active project." };
  if (!segmentId) return { error: "Pick a segment to activate." };
  if (!target) return { error: "Destination is required." };

  const get = (k: string) => String(formData.get(k) ?? "").trim();

  try {
    await createActivation({
      projectId,
      segmentId,
      target,
      channel: get("channel"),
      cadence: get("cadence") || "Daily",
      consentBasis: get("consentBasis"),
      status: get("status") || "Draft",
    });
    revalidatePath("/activation");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function updateActivationStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;
  await updateActivation(id, { status });
  revalidatePath("/activation");
}

export async function deleteActivationAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteActivation(id);
  revalidatePath("/activation");
}
