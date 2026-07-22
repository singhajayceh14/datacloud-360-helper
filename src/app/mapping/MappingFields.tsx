"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { MappingField } from "@/db/schema";
import { Stagger, StaggerItem } from "@/components/motion";
import { Select } from "@/components/Select";

export const CATEGORIES = [
  "Identity",
  "Contact Point",
  "Consent",
  "Party",
  "Attribute",
];

/** Per-category color language — drives chips, accents, and the summary. */
const CAT_STYLE: Record<string, { chip: string; dot: string; accent: string }> = {
  Identity: { chip: "bg-blue-100 text-blue-700", dot: "bg-blue-500", accent: "border-l-blue-500" },
  "Contact Point": { chip: "bg-teal-100 text-teal-700", dot: "bg-teal-500", accent: "border-l-teal-500" },
  Consent: { chip: "bg-amber-100 text-amber-700", dot: "bg-amber-500", accent: "border-l-amber-500" },
  Party: { chip: "bg-violet-100 text-violet-700", dot: "bg-violet-500", accent: "border-l-violet-500" },
  Attribute: { chip: "bg-slate-100 text-slate-600", dot: "bg-slate-400", accent: "border-l-slate-300" },
};

export const catStyle = (c: string) => CAT_STYLE[c] ?? CAT_STYLE.Attribute;

/**
 * The colorful source → target field rows plus a summary bar. Shared by the
 * "new mapping" workbench and the saved-mapping editor. `onUpdate` toggles a
 * field; `rightSlot` holds the caller's action button(s).
 */
export function MappingRows({
  fields,
  rowsSampled,
  onUpdate,
  rightSlot,
  readOnly = false,
  dmoOptions,
}: {
  fields: MappingField[];
  rowsSampled: number;
  onUpdate: (i: number, patch: Partial<MappingField>) => void;
  rightSlot?: ReactNode;
  readOnly?: boolean;
  dmoOptions?: string[];
}) {
  const identityCount = fields.filter((f) => f.identity).length;
  const catCounts = CATEGORIES.map((c) => ({
    cat: c,
    n: fields.filter((f) => f.category === c).length,
  })).filter((x) => x.n > 0);

  return (
    <div>
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
        {rightSlot && <div className="ml-auto flex items-center gap-2">{rightSlot}</div>}
      </div>

      {/* Rows */}
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
                {!readOnly && dmoOptions && dmoOptions.length > 0 ? (
                  <Select
                    className="min-w-0 flex-1"
                    value={f.dmo}
                    onChange={(v) => onUpdate(i, { dmo: v })}
                    ariaLabel="Target DMO"
                    options={
                      f.dmo && !dmoOptions.includes(f.dmo)
                        ? [f.dmo, ...dmoOptions]
                        : dmoOptions
                    }
                  />
                ) : (
                  <input
                    value={f.dmo}
                    readOnly={readOnly}
                    onChange={(e) => onUpdate(i, { dmo: e.target.value })}
                    className="min-w-0 flex-1 rounded-lg border border-line px-2.5 py-1.5 text-[13px] font-medium outline-none read-only:bg-slate-50 read-only:text-muted focus:border-brand"
                  />
                )}
                {readOnly ? (
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold ${st.chip}`}>
                    {f.category}
                  </span>
                ) : (
                  <Select
                    value={f.category}
                    onChange={(v) => onUpdate(i, { category: v })}
                    options={CATEGORIES}
                    ariaLabel="Category"
                    triggerClassName={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold outline-none ${st.chip}`}
                  />
                )}
                <IdentityToggle
                  on={f.identity}
                  disabled={readOnly}
                  onToggle={() => onUpdate(i, { identity: !f.identity })}
                />
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}

/** Animated identity switch with an "ID" label. */
export function IdentityToggle({
  on,
  onToggle,
  disabled = false,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      title="Use for identity resolution"
      className="flex shrink-0 items-center gap-1.5 disabled:cursor-default"
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
      <span className={`text-[11px] font-bold ${on ? "text-brand" : "text-slate-400"}`}>
        ID
      </span>
    </button>
  );
}
