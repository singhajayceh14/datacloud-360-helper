"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import type { MappingField } from "@/db/schema";
import { MappingRows } from "./MappingFields";
import { saveMappingAction } from "./actions";

export function MappingWorkbench({
  projectId,
  dmoCatalog,
}: {
  projectId: string;
  dmoCatalog?: { name: string; fields: string[] }[];
}) {
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
          <MappingRows
            fields={fields}
            rowsSampled={rowsSampled}
            onUpdate={update}
            dmoCatalog={dmoCatalog}
            rightSlot={
              <button
                onClick={save}
                disabled={busy}
                className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save mapping"}
              </button>
            }
          />
        </motion.div>
      )}
    </div>
  );
}
