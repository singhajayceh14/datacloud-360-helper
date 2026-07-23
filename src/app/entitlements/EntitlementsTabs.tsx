"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui";
import { extractPdfText, extractCaps } from "./order-form";
import {
  RATE_CARD,
  RATE_CARD_DATE,
  calcConsumptionFromVolumes,
  rateFor,
  type CalcEnv,
} from "@/lib/entitlements/rate-card";
import { formatCredits } from "@/lib/entitlements/calc";
import {
  saveEntitlementCapsAction,
  saveConsumptionAction,
  type SaveState,
} from "./actions";

export type Caps = {
  dataServicesCredits: number;
  sandboxCredits: number;
  flexCredits: number;
  dataStorageTb: number;
  contractStart: string;
  orderEndDate: string;
  notes: string;
};

const fmt = (n: number) => (n > 0 ? n.toLocaleString("en-US") : "—");

export function EntitlementsTabs({
  projectId,
  caps,
  calcEnv,
  volumes,
}: {
  projectId: string;
  caps: Caps;
  calcEnv: CalcEnv;
  volumes: Record<string, number>;
}) {
  const [view, setView] = useState<"license" | "calc">("license");

  const pill = (active: boolean) =>
    `rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${
      active ? "bg-brand text-white" : "border border-line bg-white text-ink hover:border-brand"
    }`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button className={pill(view === "license")} onClick={() => setView("license")}>
          License &amp; entitlements
        </button>
        <button className={pill(view === "calc")} onClick={() => setView("calc")}>
          Credit Calculator
        </button>
      </div>

      {view === "license" ? (
        <LicenseView projectId={projectId} initial={caps} />
      ) : (
        <CalcView
          projectId={projectId}
          prodPool={caps.dataServicesCredits}
          sandPool={caps.sandboxCredits}
          initialEnv={calcEnv}
          initialVolumes={volumes}
        />
      )}
    </div>
  );
}

/* ----------------------------- License view ----------------------------- */

function LicenseView({ projectId, initial }: { projectId: string; initial: Caps }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    saveEntitlementCapsAction,
    {},
  );
  const [caps, setCaps] = useState<Caps>(initial);
  const [days, setDays] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [upBusy, setUpBusy] = useState(false);
  const [upMsg, setUpMsg] = useState("");

  async function onOrderForm(file: File) {
    setUpBusy(true);
    setUpMsg("Reading order form…");
    try {
      const text = await extractPdfText(file);
      const found = extractCaps(text);
      const keys = Object.keys(found) as (keyof typeof found)[];
      if (keys.length === 0) {
        setUpMsg("No entitlement values found — enter them manually below.");
      } else {
        setCaps((c) => ({ ...c, ...found }));
        setUpMsg(
          `${keys.length} field${keys.length === 1 ? "" : "s"} auto-filled — verify against the PDF, then Save.`,
        );
      }
    } catch (e) {
      setUpMsg(
        "Couldn't read the PDF (" +
          (e instanceof Error ? e.message : String(e)) +
          ") — enter values manually.",
      );
    } finally {
      setUpBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // Days-left reads the clock, so it must run client-side in an effect
  // (avoids the SSR/client mismatch and the render-purity rule).
  useEffect(() => {
    const end = caps.orderEndDate;
    const n = end
      ? Math.ceil((new Date(end).getTime() - Date.now()) / 86400000)
      : NaN;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDays(Number.isNaN(n) ? null : n);
  }, [caps.orderEndDate]);

  const setNum = (k: keyof Caps, v: string) =>
    setCaps((c) => ({ ...c, [k]: Number(v.replace(/[, ]/g, "")) || 0 }));
  const setStr = (k: keyof Caps, v: string) => setCaps((c) => ({ ...c, [k]: v }));

  const inputCls =
    "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-brand";

  return (
    <form action={action}>
      <input type="hidden" name="projectId" value={projectId} />
      <Card>
        <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
          <h2 className="font-semibold">License &amp; entitlements</h2>
          <div>
            <button
              type="button"
              disabled={upBusy}
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-brand disabled:opacity-50"
            >
              {upBusy ? "Reading…" : "⬆ Upload order form"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onOrderForm(f);
              }}
            />
          </div>
        </div>
        <p className="mb-3 text-[13px] text-muted">
          From the Salesforce Order Form. Upload the PDF to auto-fill the values
          below, or enter them manually. Credits expire at the Order End Date —
          no rollover (rate card terms, {RATE_CARD_DATE}).
        </p>
        {upMsg && (
          <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-[12.5px] text-blue-800">
            {upMsg}
          </p>
        )}

        {/* Big numbers */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Big label="Data Services Credits" value={fmt(caps.dataServicesCredits)} sub="production pool" />
          <Big label="Sandbox Credits" value={fmt(caps.sandboxCredits)} sub="sandbox pool" />
          <Big label="Flex Credits" value={fmt(caps.flexCredits)} sub="convertible" />
          <Big label="Data Storage" value={caps.dataStorageTb ? `${caps.dataStorageTb} TB` : "—"} sub="contracted" />
          <Big
            label="Order end"
            value={caps.orderEndDate || "—"}
            sub={
              days === null
                ? "credits expire here"
                : days >= 0
                  ? `${days} days left`
                  : `expired ${-days} days ago`
            }
            tone={days !== null && days < 60 ? "warn" : undefined}
          />
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Data Services Credits">
            <input name="dataServicesCredits" inputMode="numeric" value={caps.dataServicesCredits || ""} onChange={(e) => setNum("dataServicesCredits", e.target.value)} placeholder="e.g. 2500000" className={inputCls} />
          </Field>
          <Field label="Sandbox Credits">
            <input name="sandboxCredits" inputMode="numeric" value={caps.sandboxCredits || ""} onChange={(e) => setNum("sandboxCredits", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Flex Credits">
            <input name="flexCredits" inputMode="numeric" value={caps.flexCredits || ""} onChange={(e) => setNum("flexCredits", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Data Storage (TB)">
            <input name="dataStorageTb" inputMode="numeric" value={caps.dataStorageTb || ""} onChange={(e) => setNum("dataStorageTb", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Contract start">
            <input name="contractStart" type="date" value={caps.contractStart} onChange={(e) => setStr("contractStart", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Order end date">
            <input name="orderEndDate" type="date" value={caps.orderEndDate} onChange={(e) => setStr("orderEndDate", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Edition / notes" className="sm:col-span-2">
            <input name="notes" value={caps.notes} onChange={(e) => setStr("notes", e.target.value)} placeholder="e.g. Data 360 + MC Advanced" className={inputCls} />
          </Field>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button type="submit" disabled={pending} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50">
            {pending ? "Saving…" : "Save entitlements"}
          </button>
          {state.ok && <span className="text-[13px] text-emerald-700">Saved.</span>}
          {state.error && <span className="text-[13px] text-red-700">{state.error}</span>}
        </div>
      </Card>
    </form>
  );
}

function Big({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "warn" }) {
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <div className="text-[12px] text-muted">{label}</div>
      <div className="mt-1 truncate text-[20px] font-bold tabular-nums text-ink">{value}</div>
      <div className={`text-[11px] ${tone === "warn" ? "font-medium text-amber-700" : "text-muted"}`}>{sub}</div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`text-[13px] ${className}`}>
      <span className="mb-1 block text-muted">{label}</span>
      {children}
    </label>
  );
}

/* --------------------------- Calculator view --------------------------- */

function CalcView({
  projectId,
  prodPool,
  sandPool,
  initialEnv,
  initialVolumes,
}: {
  projectId: string;
  prodPool: number;
  sandPool: number;
  initialEnv: CalcEnv;
  initialVolumes: Record<string, number>;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    saveConsumptionAction,
    {},
  );
  const [env, setEnv] = useState<CalcEnv>(initialEnv);
  const [volumes, setVolumes] = useState<Record<string, number>>(initialVolumes);

  // Sandbox estimates draw down the sandbox credit pool, not production.
  const pool = env === "sand" ? sandPool : prodPool;
  const sum = calcConsumptionFromVolumes(volumes, env, pool);

  const setVol = (k: string, v: string) =>
    setVolumes((m) => ({ ...m, [k]: Number(v) || 0 }));

  const envBtn = (e: CalcEnv, label: string) => (
    <button
      type="button"
      onClick={() => setEnv(e)}
      className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
        env === e ? "bg-brand text-white" : "border border-line bg-white text-ink hover:border-brand"
      }`}
    >
      {label}
    </button>
  );

  return (
    <form action={action}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="calcEnv" value={env} />
      <input type="hidden" name="volumes" value={JSON.stringify(volumes)} />
      <Card>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Credit consumption calculator</h2>
          <div className="flex gap-2">
            {envBtn("prod", "Production")}
            {envBtn("sand", "Sandbox")}
          </div>
        </div>
        <p className="mb-3 text-[13px] text-muted">
          Multipliers from the official Salesforce Customer Data Cloud rate card
          ({RATE_CARD_DATE}) plus the Segmentation &amp; Activation card (merged
          into Data Services credits, Sept 2025). Enter monthly volumes; rates
          change — re-verify on renewal.
        </p>

        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[620px] text-[13px]">
            <colgroup>
              <col />
              <col className="w-[150px]" />
              <col className="w-[128px]" />
              <col className="w-[112px]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5 font-semibold">Usage type</th>
                <th className="px-3 py-2.5 text-right font-semibold">Rate</th>
                <th className="px-3 py-2.5 text-right font-semibold">Volume / mo</th>
                <th className="px-3 py-2.5 text-right font-semibold">Credits / mo</th>
              </tr>
            </thead>
            <tbody>
              {RATE_CARD.map((group) => (
                <RateGroupRows
                  key={group.category}
                  category={group.category}
                  rates={group.rates}
                  env={env}
                  volumes={volumes}
                  perKey={sum.perKey}
                  onVol={setVol}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Total bar */}
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border border-line bg-slate-50 px-4 py-3">
          <span className="text-[12px] text-muted">Monthly</span>
          <span className="text-[18px] font-bold tabular-nums">{formatCredits(sum.monthlyCredits)}</span>
          <span className="text-[12px] text-muted">Annual</span>
          <span className="text-[18px] font-bold tabular-nums">{formatCredits(sum.annualCredits)}</span>
          {sum.runwayMonths !== null && (
            <span
              className={`text-[13px] font-medium ${sum.runwayMonths >= 12 ? "text-emerald-700" : "text-red-700"}`}
            >
              Runway: {sum.runwayMonths.toFixed(1)} months of {formatCredits(pool)} credits
              {sum.runwayMonths < 12 ? " — under 12 months!" : ""}
            </span>
          )}
        </div>
        {sum.warnings.length > 0 && sum.runwayMonths === null && (
          <p className="mt-2 text-[12px] text-muted">{sum.warnings[0]}</p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button type="submit" disabled={pending} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50">
            {pending ? "Saving…" : "Save estimate"}
          </button>
          {state.ok && <span className="text-[13px] text-emerald-700">Saved.</span>}
          {state.error && <span className="text-[13px] text-red-700">{state.error}</span>}
        </div>
      </Card>
    </form>
  );
}

function RateGroupRows({
  category,
  rates,
  env,
  volumes,
  perKey,
  onVol,
}: {
  category: string;
  rates: import("@/lib/entitlements/rate-card").Rate[];
  env: CalcEnv;
  volumes: Record<string, number>;
  perKey: Record<string, number>;
  onVol: (k: string, v: string) => void;
}) {
  return (
    <>
      <tr>
        <td colSpan={4} className="border-y border-line bg-slate-100/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">
          {category}
        </td>
      </tr>
      {rates.map((r) => {
        const credits = perKey[r.key] ?? 0;
        return (
          <tr key={r.key} className="border-b border-line/60 align-top transition-colors last:border-0 hover:bg-slate-50/60">
            <td className="px-3 py-2.5">
              <div className="font-medium text-ink">{r.title}</div>
              {r.note && <div className="mt-0.5 text-[11px] leading-snug text-muted">{r.note}</div>}
            </td>
            <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
              <div className="font-medium text-ink">{rateFor(r, env).toLocaleString("en-US")}</div>
              <div className="text-[10.5px] text-muted">{r.unit}</div>
            </td>
            <td className="px-3 py-2.5 text-right">
              <input
                type="number"
                min={0}
                step="any"
                value={volumes[r.key] || ""}
                onChange={(e) => onVol(r.key, e.target.value)}
                placeholder="0"
                className="w-24 rounded-lg border border-line px-2.5 py-1.5 text-right text-[13px] tabular-nums outline-none focus:border-brand"
              />
              <div className="mt-0.5 text-[10.5px] text-muted">{r.volLabel}</div>
            </td>
            <td className="px-3 py-2.5 text-right align-middle tabular-nums">
              <span className={credits > 0 ? "font-semibold text-ink" : "text-muted"}>
                {credits > 0 ? formatCredits(credits) : "—"}
              </span>
            </td>
          </tr>
        );
      })}
    </>
  );
}
