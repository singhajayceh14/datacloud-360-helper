"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import type { MappingField } from "@/db/schema";
import { saveMappingAction } from "./actions";

const CATEGORIES = ["Identity", "Contact Point", "Consent", "Party", "Attribute"];

export function MappingWorkbench({ projectId }: { projectId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [sourceName, setSourceName] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [rowsSampled, setRowsSampled] = useState(0);
  const [fields, setFields] = useState<MappingField[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
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
    // reset for the next source
    setFields(null);
    setFileName(null);
    setRowsSampled(0);
    setSourceName("");
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        <input
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
          placeholder="Source / system name (e.g. Shopify)"
          className="grow rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand"
        />
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
          className="text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:font-semibold file:text-white"
        />
      </div>
      {busy && !fields && <p className="mt-2 text-muted">Profiling CSV…</p>}
      {error && <p className="mt-2 text-[13px] text-red-700">{error}</p>}

      {fields && (
        <motion.div
          className="mt-4"
          initial={{ opacity: 0, y: reduce ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] text-muted">
              {fields.length} columns · {rowsSampled} rows profiled ·{" "}
              {fields.filter((f) => f.identity).length} identity fields
            </span>
            <button
              onClick={save}
              disabled={busy}
              className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save mapping"}
            </button>
          </div>

          <div className="overflow-x-auto rounded-[10px] border border-line">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50 text-left text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">Column</th>
                  <th className="px-3 py-2 font-semibold">Sample</th>
                  <th className="px-3 py-2 font-semibold">DMO (target)</th>
                  <th className="px-3 py-2 font-semibold">Category</th>
                  <th className="px-3 py-2 font-semibold">ID?</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((f, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-3 py-1.5 font-medium">{f.column}</td>
                    <td className="max-w-[160px] truncate px-3 py-1.5 text-muted">
                      {f.sample ?? "—"}
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        value={f.dmo}
                        onChange={(e) => update(i, { dmo: e.target.value })}
                        className="w-full rounded border border-line px-2 py-1 outline-none focus:border-brand"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <select
                        value={f.category}
                        onChange={(e) => update(i, { category: e.target.value })}
                        className="rounded border border-line px-2 py-1 outline-none focus:border-brand"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={f.identity}
                        onChange={(e) => update(i, { identity: e.target.checked })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
