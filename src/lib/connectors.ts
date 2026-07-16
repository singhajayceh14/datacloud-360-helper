import "server-only";
import fs from "node:fs";
import path from "node:path";

export type Connector = {
  name: string;
  label: string;
  desc: string;
  release: string;
  features: string[];
};

type Catalog = { verified?: string; source?: string; connectors: Connector[] };

let cache: Connector[] | null = null;

function all(): Connector[] {
  if (cache === null) {
    try {
      const raw = fs.readFileSync(
        path.join(process.cwd(), "reference", "connectors.json"),
        "utf8",
      );
      cache = (JSON.parse(raw) as Catalog).connectors ?? [];
    } catch {
      cache = [];
    }
  }
  return cache;
}

export function searchConnectors(opts: {
  q?: string;
  release?: string;
  limit?: number;
}): { total: number; connectors: Connector[] } {
  const needle = (opts.q ?? "").trim().toLowerCase();
  const limit = opts.limit ?? 100;

  let out = all();
  if (opts.release) out = out.filter((c) => c.release === opts.release);
  if (needle) {
    out = out.filter(
      (c) =>
        c.label.toLowerCase().includes(needle) ||
        c.name.toLowerCase().includes(needle) ||
        (c.desc ?? "").toLowerCase().includes(needle) ||
        (c.features ?? []).some((f) => f.toLowerCase().includes(needle)),
    );
  }

  return { total: out.length, connectors: out.slice(0, limit) };
}

export function connectorCount(): number {
  return all().length;
}
