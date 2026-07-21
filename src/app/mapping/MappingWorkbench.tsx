"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import type { MappingField } from "@/db/schema";
import { Stagger, StaggerItem } from "@/components/motion";
import { saveMappingAction } from "./actions";

const CATEGORIES = ["Identity", "Contact Point", "Consent", "Party", "Attribute"];

/** Per-category color language — drives chips, accents, and the summary. */
const CAT_STYLE: Record<
  string,
  { chip: string; dot: string; accent: string; label: string }
> = {
  Identity: {
    chip: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    accent: "border-l-blue-500",
    label: "Identity",
  },
  "Contact Point": {
    chip: "bg-teal-100 text-teal-700",
    dot: "bg-teal-500",
    accent: "border-l-teal-500",
    label: "Contact Point",
  },
  Consent: {
    chip: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    accent: "border-l-amber-500",
    label: "Consent",
  },
  Party: {
    chip: "bg-violet-100 text-violet-700",
    dot: "bg-violet-500",
    accent: "border-l-violet-500",
    label: "Party",
  },
  Attribute: {
    chip: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    accent: "border-l-slate-300",
    label: "Attribute",
  },
};

const catStyle = (c: string) => CAT_STYLE[c] ?? CAT_STYLE.Attribute;

export function MappingWorkbench({ projectId }: { projectId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [sourceName, setSourceName] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [rowsSampled, setRowsSampled] = useState(0);
  const [fields, setFields] = useState<MappingField[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const reduce = useReducedMotion();

  async function onFile(file: File) {
    setBusy(true);
    setError("");
    const derived = sourceName || file.name.replace(/\.csv$/i, "");
    try {
      const csv = await file.text();
      const res = await fetch("/api/mapping/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ csv, sourceName: derived }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Profiling failed.");
      setSourceName(derived);
      setFileName(file.name);
      setRowsSampled(data.rowsSampled);
      setFields(data.fields);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function update(i: number, patch: Partial<MappingField>) {
    setFields((f) =>
      f ? f.map((row, idx) => (idx === i ? { ...row, ...patch } : row)) : f,
    );
  }

  async function save() {
    if (!fields) return;
    setBusy(true);
    setError("");
    const result = await saveMappingAction({
      projectId,
      sourceName,
      fileName,
      rowsSampled,
      fields,
    });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setFields(null);
    setFileName(null);
    setRowsSampled(0);
    setSourceName("");
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  const identityCount = fields?.filter((f) => f.identity).length ?? 0;
  const catCounts = CATEGORIES.map((c) => ({
    cat: c,
    n: fields?.filter((f) => f.category === c).length ?? 0,
  })).filter((x) => x.n > 0);

  return (
    <div>
      {/* Source name + drop zone */}
      <input
        value={sourceName}
        onChange={(e) => setSourceName(e.target.value)}
        placeholder="Source / system name (e.g. Shopify)"
        className="mb-2.5 w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand"
      />

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors ${
          dragOver
            ? "border-brand bg-brand/5"
            : "border-line hover:border-brand/50 hover:bg-slate-50"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        <div className="text-2xl">⇥</div>
        <div className="text-[14px] font-semibold text-ink">
          {busy && !fields ? "Profiling CSV…" : "Drop a CSV here, or click to browse"}
        </div>
        <div className="text-[12px] text-muted">
          We auto-detect the DLO → DMO mapping and flag identity fields.
        </div>
      </label>

      {error && <p className="mt-2 text-[13px] text-red-700">{error}</p>}

      {fields && (
        <motion.div
          className="mt-5"
          initial={{ opacity: 0, y: reduce ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Summary bar */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-medium text-slate-600">
              {fields.length} columns
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-medium text-slate-600">
              {rowsSampled} rows
            </span>
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[12px] font-semibold text-blue-700">
              {identityCount} identity {identityCount === 1 ? "key" : "keys"}
            </span>
            <span className="mx-1 h-4 w-px bg-line" />
            {catCounts.map(({ cat, n }) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 text-[12px] text-muted ring-1 ring-line"
              >
                <span className={`h-2 w-2 rounded-full ${catStyle(cat).dot}`} />
                {cat} · {n}
              </span>
            ))}
            <button
              onClick={save}
              disabled={busy}
              className="ml-auto rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save mapping"}
            </button>
          </div>

          {/* Mapping rows: source → target */}
          <Stagger className="flex flex-col gap-2">
            {fields.map((f, i) => {
              const st = catStyle(f.category);
              return (
                <StaggerItem
                  key={i}
                  className={`group flex items-center gap-3 rounded-xl border border-line border-l-4 bg-white p-3 transition-shadow hover:shadow-sm ${st.accent}`}
                >
                  {/* SOURCE column */}
                  <div className="w-[34%] min-w-0">
                    <div className="truncate font-mono text-[13px] font-semibold text-ink">
                      {f.column}
                    </div>
                    <div className="truncate text-[11px] text-muted">
                      {f.sample ? `e.g. ${f.sample}` : "no sample"}
                    </div>
                  </div>

                  {/* Connector */}
                  <div className="flex shrink-0 items-center gap-1 text-muted">
                    <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                    <svg width="26" height="10" viewBox="0 0 26 10" fill="none" className="text-line">
                      <path d="M0 5H22" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                      <path d="M20 1L25 5L20 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {/* TARGET: DMO + category + identity */}
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <input
                      value={f.dmo}
                      onChange={(e) => update(i, { dmo: e.target.value })}
                      className="min-w-0 flex-1 rounded-lg border border-line px-2.5 py-1.5 text-[13px] font-medium outline-none focus:border-brand"
                    />
                    <select
                      value={f.category}
                      onChange={(e) => update(i, { category: e.target.value })}
                      className={`cursor-pointer rounded-full border-0 px-2.5 py-1 text-[12px] font-semibold outline-none ${st.chip}`}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <IdentityToggle
                      on={f.identity}
                      onToggle={() => update(i, { identity: !f.identity })}
                    />
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </motion.div>
      )}
    </div>
  );
}

/** Animated identity switch with an "ID" label. */
function IdentityToggle({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title="Use for identity resolution"
      className="flex shrink-0 items-center gap-1.5"
    >
      <span
        className={`relative flex h-5 w-9 items-center rounded-full transition-colors ${
          on ? "bg-brand" : "bg-slate-300"
        }`}
      >
        <motion.span
          className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
          animate={{ x: on ? 16 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </span>
      <span
        className={`text-[11px] font-bold ${on ? "text-brand" : "text-slate-400"}`}
      >
        ID
      </span>
    </button>
  );
}
