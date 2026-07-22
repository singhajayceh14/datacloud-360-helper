import "server-only";
import fs from "node:fs";
import path from "node:path";

export type DmoObject = {
  name: string;
  category: string;
  fields: string[];
  isStandard?: boolean;
};

let cache: DmoObject[] | null = null;

/** The curated standard DMO catalog (reference/dmo-catalog.json), read once. */
export function loadDmoCatalogFile(): DmoObject[] {
  if (cache !== null) return cache;
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), "reference", "dmo-catalog.json"),
      "utf8",
    );
    const parsed = JSON.parse(raw) as { objects?: DmoObject[] };
    cache = parsed.objects ?? [];
  } catch {
    cache = [];
  }
  return cache;
}
