export type Tab = {
  id: string;
  label: string;
  icon: string;
  href: string;
};

/**
 * Primary navigation — mirrors the Data 360 console's tab set, order, and
 * labels exactly (Canvas → How to). Project switching lives in the sidebar
 * project picker (the console's header select).
 */
export const TABS: Tab[] = [
  { id: "canvas", label: "Canvas", icon: "◇", href: "/canvas" },
  { id: "ingestion", label: "Ingestion", icon: "⇥", href: "/ingestion" },
  { id: "mapping", label: "Data Mapping", icon: "⇄", href: "/mapping" },
  { id: "unification", label: "Unification", icon: "⚭", href: "/unification" },
  { id: "segments", label: "Segments", icon: "◑", href: "/segments" },
  { id: "activation", label: "Activation", icon: "⇱", href: "/activation" },
  { id: "entitlements", label: "Entitlements", icon: "▤", href: "/entitlements" },
  { id: "howto", label: "How to", icon: "?", href: "/howto" },
];

/**
 * Secondary navigation — capabilities the console places elsewhere (project
 * management in the header, deliverables via buttons, the assistant as a
 * sidebar chat). Kept as their own routes here, below a divider.
 */
export const SECONDARY_TABS: Tab[] = [
  { id: "projects", label: "Projects", icon: "▦", href: "/projects" },
  { id: "brd", label: "BRD / SDD", icon: "▧", href: "/brd" },
  { id: "assistant", label: "Assistant", icon: "✦", href: "/assistant" },
  { id: "settings", label: "Settings", icon: "⚙", href: "/settings" },
];
