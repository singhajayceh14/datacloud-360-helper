"use client";

import { useActionState, useState } from "react";
import type { ConsumptionLine } from "@/db/schema";
import {
  calcConsumption,
  formatCredits,
  lineAnnualCredits,
} from "@/lib/entitlements/calc";
import { saveEntitlementAction, type SaveState } from "./actions";

const inputCls =
  "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";
const cellCls =
  "w-full rounded-md border border-line bg-white px-2 py-1 text-[13px] outline-none focus:border-brand";

export type InitialCaps = {
  dataServicesCredits: number;
  sandboxCredits: number;
  flexCredits: number;
  dataStorageTb: number;
  contractStart: string;
  orderEndDate: string;
  notes: string;
};

export function EntitlementEditor({
  projectId,
  initialCaps,
  initialLines,
}: {
  projectId: string;
  initialCaps: InitialCaps;
  initialLines: ConsumptionLine[];
}) {
  const [caps, setCaps] = useState<InitialCaps>(initialCaps);
  const [lines, setLines] = useState<ConsumptionLine[]>(initialLines);
  const [state, action, pending] = useActionState<SaveState, FormData>(
    saveEntitlementAction,
    {},
  );

  const summary = calcConsumption(lines, caps.dataServicesCredits);

  const setCap = (k: keyof InitialCaps, v: string) =>
    setCaps((c) => ({
      ...c,
      [k]:
        k === "contractStart" || k === "orderEndDate" || k === "notes"
          ? v
          : Number(v.replace(/[, ]/g, "")) || 0,
    }));

  const setLine = (i: number, k: keyof ConsumptionLine, v: string) =>
    setLines((ls) =>
      ls.map((l, j) =>
        j === i
          ? {
              ...l,
              [k]:
                k === "category" || k === "unit" ? v : Number(v) || 0,
            }
          : l,
      ),
    );

  const addLine = () =>
    setLines((ls) => [
      ...ls,
      { category: "", unit: "M rows / mo", monthlyVolume: 0, creditsPerUnit: 0 },
    ]);
  const removeLine = (i: number) =>
    setLines((ls) => ls.filter((_, j) => j !== i));

  return (
    <form action={action}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="lineItems" value={JSON.stringify(lines)} />
      {(
        [
          "dataServicesCredits",
          "sandboxCredits",
          "flexCredits",
          "dataStorageTb",
          "contractStart",
          "orderEndDate",
          "notes",
        ] as const
      ).map((k) => (
        <input key={k} type="hidden" name={k} value={String(caps[k])} />
      ))}

      {/* Order-form caps */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Data Services credits</span>
          <input
            inputMode="numeric"
            value={caps.dataServicesCredits || ""}
            onChange={(e) => setCap("dataServicesCredits", e.target.value)}
            placeholder="e.g. 2500000"
            className={inputCls}
          />
        </label>
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Sandbox credits</span>
          <input
            inputMode="numeric"
            value={caps.sandboxCredits || ""}
            onChange={(e) => setCap("sandboxCredits", e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Flex credits</span>
          <input
            inputMode="numeric"
            value={caps.flexCredits || ""}
            onChange={(e) => setCap("flexCredits", e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Data storage (TB)</span>
          <input
            inputMode="numeric"
            value={caps.dataStorageTb || ""}
            onChange={(e) => setCap("dataStorageTb", e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Contract start</span>
          <input
            type="date"
            value={caps.contractStart}
            onChange={(e) => setCap("contractStart", e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Order end date</span>
          <input
            type="date"
            value={caps.orderEndDate}
            onChange={(e) => setCap("orderEndDate", e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="text-[13px] sm:col-span-2">
          <span className="mb-1 block text-muted">Edition / notes</span>
          <input
            value={caps.notes}
            onChange={(e) => setCap("notes", e.target.value)}
            placeholder="e.g. Data 360 + MC Advanced"
            className={inputCls}
          />
        </label>
      </div>

      {/* Consumption calculator */}
      <h3 className="mb-2 mt-6 font-semibold">Consumption calculator</h3>
      <p className="mb-2 text-[12px] text-muted">
        Multipliers are illustrative placeholders — replace with your order-form
        rate card.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <thead>
            <tr className="text-left text-muted">
              <th className="pb-1 font-medium">Usage type</th>
              <th className="pb-1 font-medium">Unit</th>
              <th className="pb-1 text-right font-medium">Volume / mo</th>
              <th className="pb-1 text-right font-medium">Credits / unit</th>
              <th className="pb-1 text-right font-medium">Annual credits</th>
              <th className="pb-1"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-t border-line">
                <td className="py-1 pr-2">
                  <input
                    value={l.category}
                    onChange={(e) => setLine(i, "category", e.target.value)}
                    placeholder="Usage type"
                    className={cellCls}
                  />
                </td>
                <td className="py-1 pr-2">
                  <input
                    value={l.unit}
                    onChange={(e) => setLine(i, "unit", e.target.value)}
                    className={cellCls}
                  />
                </td>
                <td className="py-1 pr-2">
                  <input
                    inputMode="decimal"
                    value={l.monthlyVolume || ""}
                    onChange={(e) => setLine(i, "monthlyVolume", e.target.value)}
                    className={`${cellCls} text-right`}
                  />
                </td>
                <td className="py-1 pr-2">
                  <input
                    inputMode="decimal"
                    value={l.creditsPerUnit || ""}
                    onChange={(e) => setLine(i, "creditsPerUnit", e.target.value)}
                    className={`${cellCls} text-right`}
                  />
                </td>
                <td className="py-1 pr-2 text-right tabular-nums text-muted">
                  {formatCredits(lineAnnualCredits(l))}
                </td>
                <td className="py-1 text-right">
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="rounded-md border border-line bg-white px-2 py-1 text-[12px] text-muted hover:border-red-300 hover:text-red-700"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addLine}
        className="mt-2 rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] text-ink hover:border-brand"
      >
        + Add usage type
      </button>

      {/* Live summary */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label="Est. monthly credits" value={formatCredits(summary.monthlyCredits)} />
        <SummaryCard label="Est. annual credits" value={formatCredits(summary.annualCredits)} />
        <SummaryCard
          label="Pool utilization"
          value={
            summary.utilizationPct === null
              ? "—"
              : `${summary.utilizationPct.toFixed(0)}%`
          }
          tone={
            summary.utilizationPct === null
              ? "muted"
              : summary.utilizationPct > 100
                ? "bad"
                : summary.utilizationPct >= 80
                  ? "warn"
                  : "ok"
          }
        />
      </div>
      {caps.dataServicesCredits > 0 && (
        <p className="mt-2 text-[12px] text-muted">
          {summary.remaining >= 0
            ? `${formatCredits(summary.remaining)} credits headroom against the ${formatCredits(caps.dataServicesCredits)} pool.`
            : `${formatCredits(-summary.remaining)} credits over the ${formatCredits(caps.dataServicesCredits)} pool.`}
        </p>
      )}
      {summary.warnings.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {summary.warnings.map((w, i) => (
            <li
              key={i}
              className="rounded-md bg-amber-50 px-2 py-1 text-[12px] text-amber-800"
            >
              ⚠ {w}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save entitlements"}
        </button>
        {state.ok && (
          <span className="text-[13px] text-emerald-700">Saved.</span>
        )}
        {state.error && (
          <span className="text-[13px] text-red-700">{state.error}</span>
        )}
      </div>
    </form>
  );
}

function SummaryCard({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "muted" | "ok" | "warn" | "bad";
}) {
  const toneCls =
    tone === "ok"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : tone === "bad"
          ? "text-red-700"
          : "text-ink";
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <div className="text-[12px] text-muted">{label}</div>
      <div className={`mt-1 text-[22px] font-semibold tabular-nums ${toneCls}`}>
        {value}
      </div>
    </div>
  );
}
