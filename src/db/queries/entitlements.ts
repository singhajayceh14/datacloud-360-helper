import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { entitlements, type ConsumptionLine } from "@/db/schema";

export type EntitlementCaps = {
  dataServicesCredits: number;
  sandboxCredits: number;
  flexCredits: number;
  dataStorageTb: number;
  contractStart: string;
  orderEndDate: string;
  notes: string;
};

export async function getEntitlement(projectId: string) {
  const [row] = await getDb()
    .select()
    .from(entitlements)
    .where(eq(entitlements.projectId, projectId));
  return row ?? null;
}

export async function upsertEntitlement(
  projectId: string,
  caps: EntitlementCaps,
  lineItems: ConsumptionLine[],
) {
  const values = { projectId, ...caps, lineItems };
  const [row] = await getDb()
    .insert(entitlements)
    .values(values)
    .onConflictDoUpdate({
      target: entitlements.projectId,
      set: { ...caps, lineItems },
    })
    .returning();
  return row;
}
