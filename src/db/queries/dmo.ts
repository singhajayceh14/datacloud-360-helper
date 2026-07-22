import "server-only";
import { asc } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { dmoObjects } from "@/db/schema";
import { loadDmoCatalogFile, type DmoObject } from "@/lib/dmo-catalog";

export function listDmoObjects() {
  return getDb()
    .select()
    .from(dmoObjects)
    .orderBy(asc(dmoObjects.category), asc(dmoObjects.name));
}

/** Seed the catalog table from a list; existing names are left untouched. */
export async function upsertDmoObjects(list: DmoObject[]) {
  if (!list.length) return;
  await getDb()
    .insert(dmoObjects)
    .values(
      list.map((o) => ({
        name: o.name,
        category: o.category,
        fields: o.fields,
        isStandard: o.isStandard ?? true,
      })),
    )
    .onConflictDoNothing({ target: dmoObjects.name });
}

/**
 * The DMO catalog for the app: prefer the DB (extensible with org-specific
 * objects later); auto-seed it from the local file on first use; fall back to
 * the file if the DB is unavailable or unconfigured.
 */
export async function getDmoObjects(): Promise<DmoObject[]> {
  const file = loadDmoCatalogFile();
  if (!isDbConfigured()) return file;
  try {
    let rows = await listDmoObjects();
    if (rows.length === 0 && file.length > 0) {
      await upsertDmoObjects(file);
      rows = await listDmoObjects();
    }
    return rows.length
      ? rows.map((r) => ({
          name: r.name,
          category: r.category,
          fields: r.fields,
          isStandard: r.isStandard,
        }))
      : file;
  } catch {
    return file;
  }
}
