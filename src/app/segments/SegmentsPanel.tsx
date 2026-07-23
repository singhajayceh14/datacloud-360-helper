"use client";

import { useActionState, useEffect, useState } from "react";
import { Card, Pill } from "@/components/ui";
import { Select } from "@/components/Select";
import { RichText } from "@/components/RichText";
import { normDmo, dmoMapped } from "@/lib/mapping/dmo-match";
import { saveSegmentAction, deleteSegmentAction, type CreateState } from "./actions";

export type SegmentLite = {
  id: string;
  name: string;
  objective: string;
  criteria: string;
  dmos: string;
  calculatedInsights: string;
  cadence: string;
  channel: string;
  status: string;
};

const CADENCES = ["Real-time", "Hourly", "Daily", "Weekly", "Manual"];
const STATUSES = ["Draft", "Active", "Paused", "Archived"];
const COMMON_TARGETS = [
  "Marketing Cloud Next (native)",
  "Marketing Cloud Engagement",
  "Meta Ads",
  "Google Ads (Customer Match)",
  "Amazon Ads",
  "TikTok Ads",
  "LinkedIn Ads",
  "Salesforce Personalization",
  "Loyalty Management",
  "Cloud storage (S3/GCS/Azure)",
  "Activation API / webhook",
];

const splitDmos = (s: string) =>
  s.split(",").map((x) => x.trim()).filter(Boolean);

function statusTone(s: string): "ga" | "beta" | "other" {
  if (s === "Active") return "ga";
  if (s === "Paused" || s === "Draft") return "beta";
  return "other";
}

export function SegmentsPanel({
  projectId,
  segments,
  dmoOptions,
  mappedDmos,
  objectives,
  ready,
}: {
  projectId: string;
  segments: SegmentLite[];
  dmoOptions: string[];
  mappedDmos: string[];
  objectives: string[];
  ready: boolean;
}) {
  const [editing, setEditing] = useState<SegmentLite | "new" | null>(null);

  return (
    <Card>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Segment catalog</h2>
          <Pill tone="ga">{segments.length}</Pill>
        </div>
        <div className="flex flex-wrap gap-2">
          <AskAI
            projectId={projectId}
            objectives={objectives}
            mappedDmos={mappedDmos}
            existing={segments.map((s) => s.name)}
            ready={ready}
          />
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="rounded-lg bg-brand px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            ＋ Add segment
          </button>
        </div>
      </div>
      <p className="mb-3 text-[13px] text-muted">
        Every segment is validated against the DMOs actually mapped —{" "}
        <span className="font-medium text-red-700">red chips</span> mean the data
        isn&apos;t ingested yet (also lights the Canvas). In-org build options:
        standard, generative (Einstein), waterfall, and nested.
      </p>

      {editing && (
        <SegmentForm
          key={editing === "new" ? "new" : editing.id}
          projectId={projectId}
          segment={editing === "new" ? null : editing}
          dmoOptions={dmoOptions}
          objectives={objectives}
          onClose={() => setEditing(null)}
        />
      )}

      {segments.length === 0 ? (
        <p className="text-[13px] text-muted">
          No segments yet — add one, or ask the assistant to propose some.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5 font-semibold">Segment</th>
                <th className="px-3 py-2.5 font-semibold">Objective</th>
                <th className="px-3 py-2.5 font-semibold">Required DMOs</th>
                <th className="px-3 py-2.5 font-semibold">Cadence</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {segments.map((s) => {
                const dmos = splitDmos(s.dmos);
                const missing = dmos.filter((d) => !dmoMapped(d, mappedDmos));
                return (
                  <tr key={s.id} className="border-t border-line/60 align-top hover:bg-slate-50/60">
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-ink">{s.name}</div>
                      {s.criteria && (
                        <div className="mt-0.5 max-w-[240px] text-[11px] leading-snug text-muted">
                          {s.criteria}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-muted">{s.objective || "—"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {dmos.length === 0 && <span className="text-muted">—</span>}
                        {dmos.map((d) => {
                          const miss = !dmoMapped(d, mappedDmos);
                          return (
                            <span
                              key={d}
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                miss ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {d}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted">{s.cadence}</td>
                    <td className="px-3 py-2.5">
                      <Pill tone={statusTone(s.status)}>{s.status}</Pill>
                      {missing.length > 0 && (
                        <div className="mt-1 text-[11px] font-medium text-red-700">⚠ gap</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setEditing(s)}
                        className="rounded-md border border-line px-2 py-1 text-[12px] text-ink transition-colors hover:border-brand"
                      >
                        Edit
                      </button>{" "}
                      <form action={deleteSegmentAction} className="inline">
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-line px-2 py-1 text-[12px] text-muted transition-colors hover:border-red-300 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function SegmentForm({
  projectId,
  segment,
  dmoOptions,
  objectives,
  onClose,
}: {
  projectId: string;
  segment: SegmentLite | null;
  dmoOptions: string[];
  objectives: string[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<CreateState, FormData>(
    saveSegmentAction,
    {},
  );
  const checked = new Set(
    segment ? splitDmos(segment.dmos).map(normDmo) : [],
  );
  const inputCls =
    "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-brand";

  // Close the form once the save succeeds (the list revalidates server-side).
  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <form
      action={action}
      className="mb-4 rounded-xl border border-brand/30 bg-brand/5 p-4"
    >
      <input type="hidden" name="projectId" value={projectId} />
      {segment && <input type="hidden" name="id" value={segment.id} />}
      <h3 className="mb-3 font-semibold">{segment ? "Edit segment" : "New segment"}</h3>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Name *</span>
          <input name="name" required defaultValue={segment?.name} placeholder="e.g. Lapsed high-value buyers" className={inputCls} />
        </label>
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Business objective</span>
          <input name="objective" list="seg-obj-dl" defaultValue={segment?.objective} placeholder="pick the objective it serves" className={inputCls} />
          <datalist id="seg-obj-dl">
            {objectives.map((o) => <option key={o} value={o} />)}
          </datalist>
        </label>
      </div>

      <label className="mt-2.5 block text-[13px]">
        <span className="mb-1 block text-muted">Criteria (plain English)</span>
        <textarea name="criteria" rows={2} defaultValue={segment?.criteria} placeholder="e.g. No purchase in 180 days AND lifetime spend > $500" className={inputCls} />
      </label>

      <div className="mt-2.5 text-[13px]">
        <span className="mb-1 block text-muted">Required DMOs</span>
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-line bg-white p-2">
          {dmoOptions.map((d) => (
            <label
              key={d}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[12px] transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-white"
            >
              <input
                type="checkbox"
                name="dmos"
                value={d}
                defaultChecked={checked.has(normDmo(d))}
                className="sr-only"
              />
              {d}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Calculated Insight dependency</span>
          <input name="calculatedInsights" defaultValue={segment?.calculatedInsights} placeholder="e.g. LTV per Unified Individual" className={inputCls} />
        </label>
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Publish cadence</span>
          <Select name="cadence" defaultValue={segment?.cadence || "Daily"} options={cadenceOpts(segment?.cadence)} />
        </label>
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Channel</span>
          <input name="channel" list="seg-ch-dl" defaultValue={segment?.channel} placeholder="where it activates" className={inputCls} />
          <datalist id="seg-ch-dl">
            {COMMON_TARGETS.map((t) => <option key={t} value={t} />)}
          </datalist>
        </label>
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Status</span>
          <Select name="status" defaultValue={segment?.status || "Draft"} options={statusOpts(segment?.status)} />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50">
          {pending ? "Saving…" : "Save segment"}
        </button>
        <button type="button" onClick={onClose} className="rounded-lg border border-line bg-white px-4 py-2 text-[13px] text-muted transition-colors hover:border-slate-300">
          Cancel
        </button>
        {state.error && <span className="text-[13px] text-red-700">{state.error}</span>}
      </div>
    </form>
  );
}

// Ensure any existing custom value stays selectable.
const cadenceOpts = (cur?: string) =>
  cur && !CADENCES.includes(cur) ? [cur, ...CADENCES] : CADENCES;
const statusOpts = (cur?: string) =>
  cur && !STATUSES.includes(cur) ? [cur, ...STATUSES] : STATUSES;

function AskAI({
  projectId,
  objectives,
  mappedDmos,
  existing,
  ready,
}: {
  projectId: string;
  objectives: string[];
  mappedDmos: string[];
  existing: string[];
  ready: boolean;
}) {
  const [out, setOut] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function ask() {
    if (busy) return;
    setBusy(true);
    setOut("Thinking…");
    const prompt =
      "You are a Salesforce Data 360 segmentation strategist. Given these business objectives:\n" +
      (objectives.join("\n") || "(none captured)") +
      "\n\nAnd these mapped DMOs (the ONLY data available): " +
      (mappedDmos.join(", ") || "none") +
      "\n\nExisting segments: " +
      (existing.join(", ") || "none") +
      "\n\nPropose the next 3-5 segments as a compact markdown table with columns: Segment | Objective served | Plain-English criteria | Required DMOs | Cadence | Channel. Only use available DMOs; if an objective needs unavailable data, say which DMO is missing instead of inventing a segment.";
    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], projectContext: `Project ${projectId}` }),
      });
      const data = await res.json();
      setOut(res.ok ? data.text : `Error: ${data.error || "no response"}`);
    } catch (e) {
      setOut(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={ask}
        disabled={!ready || busy}
        title={ready ? "Propose segments from your objectives & mapped DMOs" : "Add an AI key to use this"}
        className="rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-brand disabled:opacity-50"
      >
        {busy ? "Asking…" : "✨ Ask AI to propose segments"}
      </button>
      {out !== null && (
        <div className="mt-3 w-full basis-full rounded-xl border border-line bg-slate-50 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted">Suggested segments</span>
            <button type="button" onClick={() => setOut(null)} className="text-[12px] text-muted hover:text-ink">
              Dismiss
            </button>
          </div>
          <RichText size="sm">{out}</RichText>
        </div>
      )}
    </>
  );
}
