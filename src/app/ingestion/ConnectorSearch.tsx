"use client";

import { useEffect, useState } from "react";
import { Pill } from "@/components/ui";

type Connector = {
  name: string;
  label: string;
  desc: string;
  release: string;
  features: string[];
};

const RELEASES = ["GA", "BETA", "MuleSoft", "IN_DEV", "ACCESS_CHECK", "PILOT"];

function releaseTone(release: string): "ga" | "beta" | "other" {
  if (release === "GA") return "ga";
  if (release === "BETA") return "beta";
  return "other";
}

export function ConnectorSearch() {
  const [q, setQ] = useState("");
  const [release, setRelease] = useState("");
  const [data, setData] = useState<{ total: number; connectors: Connector[] }>({
    total: 0,
    connectors: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (release) params.set("release", release);
      try {
        const res = await fetch(`/api/connectors?${params}`, {
          signal: ctrl.signal,
        });
        setData(await res.json());
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, release]);

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search 325 connectors — Shopify, Salesforce, S3, Snowflake…"
        className="w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <FilterChip active={release === ""} onClick={() => setRelease("")}>
          All
        </FilterChip>
        {RELEASES.map((r) => (
          <FilterChip
            key={r}
            active={release === r}
            onClick={() => setRelease(r)}
          >
            {r}
          </FilterChip>
        ))}
      </div>

      <div className="my-3 text-[12px] text-muted">
        {loading ? "Searching…" : `${data.total} connector${data.total === 1 ? "" : "s"}`}
        {data.total > data.connectors.length &&
          ` · showing first ${data.connectors.length}`}
      </div>

      <div className="flex flex-col gap-2">
        {data.connectors.map((c) => (
          <div
            key={c.name}
            className="rounded-[10px] border border-line bg-white px-4 py-3 hover:border-indigo-200"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold">{c.label}</span>
              <Pill tone={releaseTone(c.release)}>{c.release}</Pill>
            </div>
            <div className="mt-0.5 text-[13px] text-muted">{c.desc}</div>
            {c.features?.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {c.features.map((f) => (
                  <span
                    key={f}
                    className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {!loading && data.connectors.length === 0 && (
          <p className="text-muted">No connectors match your search.</p>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
        active
          ? "border-brand bg-brand text-white"
          : "border-line bg-white text-muted hover:border-brand hover:text-brand"
      }`}
    >
      {children}
    </button>
  );
}
