"use server";

import { revalidatePath } from "next/cache";
import {
  upsertEntitlementCaps,
  upsertEntitlementCalc,
} from "@/db/queries/entitlements";

export type SaveState = { error?: string; ok?: boolean };

function revalidate() {
  revalidatePath("/entitlements");
  revalidatePath("/canvas");
}

export async function saveEntitlementCapsAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return { error: "No active project." };

  const num = (k: string) => {
    const n = Number(String(formData.get(k) ?? "").replace(/[, ]/g, ""));
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  };
  const str = (k: string) => String(formData.get(k) ?? "").trim();

  try {
    await upsertEntitlementCaps(projectId, {
      dataServicesCredits: num("dataServicesCredits"),
      sandboxCredits: num("sandboxCredits"),
      flexCredits: num("flexCredits"),
      dataStorageTb: num("dataStorageTb"),
      contractStart: str("contractStart"),
      orderEndDate: str("orderEndDate"),
      notes: str("notes"),
    });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function saveConsumptionAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return { error: "No active project." };
  const calcEnv = String(formData.get("calcEnv") ?? "prod") === "sand" ? "sand" : "prod";

  const volumes: Record<string, number> = {};
  try {
    const parsed = JSON.parse(String(formData.get("volumes") ?? "{}"));
    for (const [k, v] of Object.entries(parsed)) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) volumes[k] = n;
    }
  } catch {
    return { error: "Could not read the volumes." };
  }

  try {
    await upsertEntitlementCalc(projectId, calcEnv, volumes);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
