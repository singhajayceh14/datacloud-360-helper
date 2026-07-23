import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { entitlements } from "@/db/schema";

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

/** Save the order-form caps (License & entitlements tab). */
export async function upsertEntitlementCaps(
  projectId: string,
  caps: EntitlementCaps,
) {
  const [row] = await getDb()
    .insert(entitlements)
    .values({ projectId, ...caps, lineItems: [] })
    .onConflictDoUpdate({ target: entitlements.projectId, set: caps })
    .returning();
  return row;
}

/** Save the rate-card calculator state (environment + monthly volumes). */
export async function upsertEntitlementCalc(
  projectId: string,
  calcEnv: "prod" | "sand",
  volumes: Record<string, number>,
) {
  const [row] = await getDb()
    .insert(entitlements)
    .values({ projectId, lineItems: [], calcEnv, volumes })
    .onConflictDoUpdate({ target: entitlements.projectId, set: { calcEnv, volumes } })
    .returning();
  return row;
}
