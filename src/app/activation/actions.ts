"use server";

import { revalidatePath } from "next/cache";
import {
  createActivation,
  updateActivation,
  deleteActivation,
} from "@/db/queries/activations";
import {
  registerActivationTarget,
  deleteActivationTarget,
} from "@/db/queries/activation-targets";
import { targetSpec } from "@/lib/activation/targets";

export type CreateState = { error?: string; ok?: boolean };

function revalidate() {
  revalidatePath("/activation");
  revalidatePath("/canvas");
}

/** Register a target (by name) into the project's activation registry. */
export async function registerTargetAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!projectId || !name) return;
  const spec = targetSpec(name);
  await registerActivationTarget({
    projectId,
    name,
    type: spec?.type ?? "Custom",
    notes: spec?.notes ?? "",
  });
  revalidate();
}

export async function deleteTargetAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteActivationTarget(id);
  revalidate();
}

/** Create or update an activation (full form). */
export async function saveActivationAction(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const segmentId = String(formData.get("segmentId") ?? "");
  const target = String(formData.get("target") ?? "").trim();
  if (!id && !projectId) return { error: "No active project." };
  if (!segmentId) return { error: "Pick a segment to activate." };
  if (!target) return { error: "Pick a target." };

  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const data = {
    segmentId,
    target,
    cadence: get("cadence") || "Daily",
    status: get("status") || "Draft",
    contactPoints: get("contactPoints"),
    relatedAttributes: get("relatedAttributes"),
    consentBasis: get("consentBasis"),
    channel: get("channel"),
  };

  try {
    if (id) await updateActivation(id, data);
    else await createActivation({ projectId, ...data });
    revalidate();
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
  revalidate();
}

export async function deleteActivationAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteActivation(id);
  revalidate();
}
