"use server";

import { revalidatePath } from "next/cache";
import { upsertEntitlement } from "@/db/queries/entitlements";
import type { ConsumptionLine } from "@/db/schema";

export type SaveState = { error?: string; ok?: boolean };

/** Coerce arbitrary input into a clean ConsumptionLine[]. */
function sanitizeLines(input: unknown): ConsumptionLine[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((l) => ({
      category: String((l as ConsumptionLine)?.category ?? "").trim(),
      unit: String((l as ConsumptionLine)?.unit ?? "").trim(),
      monthlyVolume: Number((l as ConsumptionLine)?.monthlyVolume) || 0,
      creditsPerUnit: Number((l as ConsumptionLine)?.creditsPerUnit) || 0,
    }))
    .filter((l) => l.category !== "");
}

export async function saveEntitlementAction(
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

  let lineItems: ConsumptionLine[] = [];
  try {
    lineItems = sanitizeLines(JSON.parse(String(formData.get("lineItems") ?? "[]")));
  } catch {
    return { error: "Could not read the consumption line items." };
  }

  try {
    await upsertEntitlement(
      projectId,
      {
        dataServicesCredits: num("dataServicesCredits"),
        sandboxCredits: num("sandboxCredits"),
        flexCredits: num("flexCredits"),
        dataStorageTb: num("dataStorageTb"),
        contractStart: str("contractStart"),
        orderEndDate: str("orderEndDate"),
        notes: str("notes"),
      },
      lineItems,
    );
    revalidatePath("/entitlements");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
