"use server";

import { revalidatePath } from "next/cache";
import { upsertUnification } from "@/db/queries/unifications";
import type { MatchRule } from "@/db/schema";

export async function saveUnificationAction(input: {
  projectId: string;
  matchRules: MatchRule[];
  notes: string;
}): Promise<{ ok?: boolean; error?: string }> {
  if (!input.projectId) return { error: "No active project." };
  try {
    await upsertUnification(
      input.projectId,
      input.matchRules,
      input.notes ?? "",
    );
    revalidatePath("/unification");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
