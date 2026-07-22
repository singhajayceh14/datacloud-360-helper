export type Tab = {
  id: string;
  label: string;
  icon: string;
  href: string;
};

/**
 * The primary navigation. Mirrors the reference console's tab set and order.
 * Icons are simple glyphs (matching the reference) — swap for an icon set later.
 */
export const TABS: Tab[] = [
  { id: "projects", label: "Projects", icon: "▦", href: "/projects" },
  { id: "canvas", label: "Canvas", icon: "◇", href: "/canvas" },
  { id: "ingestion", label: "Ingestion", icon: "⇥", href: "/ingestion" },
  { id: "mapping", label: "Data Mapping", icon: "⇄", href: "/mapping" },
  { id: "unification", label: "Unification", icon: "⚭", href: "/unification" },
  { id: "segments", label: "Segments", icon: "◑", href: "/segments" },
  { id: "activation", label: "Activation", icon: "⇱", href: "/activation" },
  { id: "entitlements", label: "Entitlements", icon: "▤", href: "/entitlements" },
  { id: "brd", label: "BRD / SDD", icon: "▧", href: "/brd" },
  { id: "assistant", label: "Assistant", icon: "✦", href: "/assistant" },
  { id: "settings", label: "Settings", icon: "⚙", href: "/settings" },
];
