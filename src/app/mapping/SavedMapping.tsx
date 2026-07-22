"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Mapping, MappingField } from "@/db/schema";
import { MappingRows } from "./MappingFields";
import { MappingCanvas } from "./MappingCanvas";
import { deleteMappingAction, updateMappingAction } from "./actions";

const clone = (fields: MappingField[]) => fields.map((f) => ({ ...f }));

export function SavedMapping({
  mapping,
  dmoCatalog,
}: {
  mapping: Mapping;
  dmoCatalog?: { name: string; fields: string[] }[];
}) {
  const router = useRouter();
  const reduce = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"fields" | "canvas">("fields");
  const [sourceName, setSourceName] = useState(mapping.sourceName);
  const [fields, setFields] = useState<MappingField[]>(clone(mapping.fields));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const identityCount = mapping.fields.filter((f) => f.identity).length;
  const dirty =
    sourceName !== mapping.sourceName ||
    JSON.stringify(fields) !== JSON.stringify(mapping.fields);

  function toggle() {
    if (!open) {
      // Re-sync local state from the source of truth when opening.
      setSourceName(mapping.sourceName);
      setFields(clone(mapping.fields));
      setError("");
      setView("fields");
    }
    setOpen((o) => !o);
  }

  function update(i: number, patch: Partial<MappingField>) {
    setFields((f) => f.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  async function save() {
    setBusy(true);
    setError("");
    const res = await updateMappingAction({ id: mapping.id, sourceName, fields });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-line bg-white">
      {/* Summary row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={toggle}
          className="flex min-w-0 grow items-center gap-2 text-left"
        >
          <motion.span
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
            className="shrink-0 text-muted"
          >
            ▸
          </motion.span>
          <span className="min-w-0">
            <span className="block truncate font-semibold">{mapping.sourceName}</span>
            <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                {mapping.fields.length} fields
              </span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-700">
                {identityCount} identity
              </span>
              <span>· {mapping.rowsSampled} rows</span>
              {mapping.fileName && <span>· {mapping.fileName}</span>}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={toggle}
          className="shrink-0 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] text-ink transition-colors hover:border-brand"
        >
          {open ? "Close" : "View / Edit"}
        </button>
        <form action={deleteMappingAction}>
          <input type="hidden" name="id" value={mapping.id} />
          <button
            type="submit"
            className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:border-red-300 hover:text-red-700"
          >
            Delete
          </button>
        </form>
      </div>

      {/* Editable detail */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: reduce ? "auto" : 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: reduce ? "auto" : 0 }}
            transition={{ duration: reduce ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line"
          >
            <div className="bg-slate-50/60 p-4">
              <div className="mb-3 flex flex-wrap items-end gap-3">
                <label className="grow">
                  <span className="mb-1 block text-[12px] font-medium text-muted">
                    Source name
                  </span>
                  <input
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    className="w-full max-w-sm rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-brand"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Fields | Canvas toggle */}
                  <div className="inline-flex rounded-lg border border-line bg-white p-0.5 text-[12px] font-medium">
                    {(["fields", "canvas"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setView(v)}
                        className={`rounded-md px-2.5 py-1 capitalize transition-colors ${
                          view === v
                            ? "bg-brand text-white"
                            : "text-muted hover:text-ink"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  {error && (
                    <span className="text-[12px] text-red-700">{error}</span>
                  )}
                  <button
                    onClick={toggle}
                    className="rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-muted transition-colors hover:border-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    disabled={busy || !dirty}
                    className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
                  >
                    {busy ? "Saving…" : dirty ? "Save changes" : "Saved"}
                  </button>
                </div>
              </div>

              {view === "fields" ? (
                <MappingRows
                  fields={fields}
                  rowsSampled={mapping.rowsSampled}
                  onUpdate={update}
                  dmoCatalog={dmoCatalog}
                />
              ) : (
                <MappingCanvas fields={fields} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
