"use server";

import { revalidatePath } from "next/cache";
import {
  createSegment,
  updateSegment,
  deleteSegment,
} from "@/db/queries/segments";

export type CreateState = { error?: string; ok?: boolean };

/** Create or update a segment (full form). Required DMOs come as repeated
 * `dmos` checkbox values. */
export async function saveSegmentAction(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id && !projectId) return { error: "No active project." };
  if (!name) return { error: "Segment name is required." };

  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const dmos = formData.getAll("dmos").map(String).filter(Boolean).join(", ");
  const data = {
    name,
    objective: get("objective"),
    criteria: get("criteria"),
    dmos,
    calculatedInsights: get("calculatedInsights"),
    cadence: get("cadence") || "Daily",
    channel: get("channel"),
    status: get("status") || "Draft",
  };

  try {
    if (id) await updateSegment(id, data);
    else await createSegment({ projectId, ...data });
    revalidatePath("/segments");
    revalidatePath("/canvas");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function createSegmentAction(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const projectId = String(formData.get("projectId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!projectId) return { error: "No active project." };
  if (!name) return { error: "Segment name is required." };

  const get = (k: string) => String(formData.get(k) ?? "").trim();

  try {
    await createSegment({
      projectId,
      name,
      objective: get("objective"),
      criteria: get("criteria"),
      dmos: get("dmos"),
      calculatedInsights: get("calculatedInsights"),
      cadence: get("cadence") || "Daily",
      channel: get("channel"),
      status: get("status") || "Draft",
    });
    revalidatePath("/segments");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function updateSegmentStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;
  await updateSegment(id, { status });
  revalidatePath("/segments");
}

export async function deleteSegmentAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteSegment(id);
  revalidatePath("/segments");
}
