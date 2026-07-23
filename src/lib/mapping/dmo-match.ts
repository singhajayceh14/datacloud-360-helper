/** Normalize a DMO name for fuzzy matching (strip case + non-letters). */
export const normDmo = (d: string) => d.toLowerCase().replace(/[^a-z]/g, "");

/**
 * Is a required DMO covered by the mapped set? Fuzzy (bidirectional substring)
 * so the SAME rule is used everywhere gap detection appears — Segments, Canvas,
 * tab badges, scenario comparison, unification.
 */
export function dmoMapped(dmo: string, mapped: Iterable<string>): boolean {
  const n = normDmo(dmo);
  for (const m of mapped) {
    const nm = normDmo(m);
    if (nm === n || nm.includes(n) || n.includes(nm)) return true;
  }
  return false;
}
