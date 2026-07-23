"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Card, Pill } from "@/components/ui";
import { Select } from "@/components/Select";
import { RichText } from "@/components/RichText";
import { ACT_TARGET_CATALOG, targetSpec } from "@/lib/activation/targets";
import {
  saveActivationAction,
  deleteActivationAction,
  registerTargetAction,
  deleteTargetAction,
  type CreateState,
} from "./actions";

export type ActLite = {
  id: string;
  segmentId: string;
  target: string;
  cadence: string;
  status: string;
  contactPoints: string;
  relatedAttributes: string;
  consentBasis: string;
};
export type TgtLite = { id: string; name: string; type: string; notes: string };
export type SegLite = { id: string; name: string };

const CADENCES = ["Real-time", "Hourly", "Daily", "Weekly", "Manual"];
const STATUSES = ["Draft", "Active", "Paused", "Archived"];

function statusTone(s: string): "ga" | "beta" | "other" {
  if (s === "Active") return "ga";
  if (s === "Paused" || s === "Draft") return "beta";
  return "other";
}

export function ActivationTabs({
  projectId,
  activations,
  targets,
  segments,
  warnings,
  ready,
}: {
  projectId: string;
  activations: ActLite[];
  targets: TgtLite[];
  segments: SegLite[];
  warnings: string[];
  ready: boolean;
}) {
  const [view, setView] = useState<string>("overview"); // overview | add | <targetId>

  const pill = (active: boolean) =>
    `flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${
      active ? "bg-brand text-white" : "border border-line bg-white text-ink hover:border-brand"
    }`;

  const selectedTarget = targets.find((t) => t.id === view);

  return (
    <div>
      {/* Sub-nav */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button className={pill(view === "overview")} onClick={() => setView("overview")}>
          Overview
        </button>
        {targets.map((t) => (
          <button key={t.id} className={pill(view === t.id)} onClick={() => setView(t.id)}>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {t.name}
          </button>
        ))}
        <button
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${
            view === "add" ? "bg-slate-900 text-white" : "bg-slate-800 text-white hover:bg-slate-900"
          }`}
          onClick={() => setView("add")}
        >
          ＋ Add a target
        </button>
      </div>

      {view === "add" ? (
        <AddTargetView projectId={projectId} registered={targets.map((t) => t.name)} />
      ) : selectedTarget ? (
        <TargetView
          projectId={projectId}
          target={selectedTarget}
          activations={activations.filter((a) => a.target === selectedTarget.name)}
          segments={segments}
          targets={targets}
        />
      ) : (
        <OverviewView
          projectId={projectId}
          activations={activations}
          targets={targets}
          segments={segments}
          warnings={warnings}
          ready={ready}
        />
      )}
    </div>
  );
}

/* ------------------------------- Overview ------------------------------- */

function OverviewView({
  projectId,
  activations,
  targets,
  segments,
  warnings,
  ready,
}: {
  projectId: string;
  activations: ActLite[];
  targets: TgtLite[];
  segments: SegLite[];
  warnings: string[];
  ready: boolean;
}) {
  const segName = new Map(segments.map((s) => [s.id, s.name]));
  const [editing, setEditing] = useState<ActLite | "new" | null>(null);

  return (
    <>
      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Activation overview</h2>
          <div className="flex flex-wrap gap-2">
            <AskAI projectId={projectId} ready={ready} />
            {segments.length > 0 && targets.length > 0 && (
              <button
                type="button"
                onClick={() => setEditing("new")}
                className="rounded-lg bg-brand px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                ＋ Add activation
              </button>
            )}
          </div>
        </div>
        <p className="mb-3 text-[13px] text-muted">
          Frequency × audience size drives credit consumption; the refresh chain
          (source → segment publish → activation) must line up or audiences go
          stale. See the{" "}
          <Link href="/canvas" className="text-brand hover:underline">
            Canvas
          </Link>{" "}
          for the full source → target flow.
        </p>

        {warnings.length > 0 && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800">
            {warnings.map((w, i) => (
              <div key={i}>⚠ {w}</div>
            ))}
          </div>
        )}

        {editing && (
          <ActivationForm
            key={editing === "new" ? "new" : editing.id}
            projectId={projectId}
            activation={editing === "new" ? null : editing}
            segments={segments}
            targets={targets}
            onClose={() => setEditing(null)}
          />
        )}

        {/* Targets summary */}
        <h3 className="mb-1 mt-2 text-[13px] font-semibold text-muted">Targets</h3>
        {targets.length === 0 ? (
          <p className="mb-3 text-[13px] text-muted">
            No targets yet — use “＋ Add a target”.
          </p>
        ) : (
          <div className="mb-4 overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-semibold">Target</th>
                  <th className="px-3 py-2 font-semibold">Type</th>
                  <th className="px-3 py-2 font-semibold">Match keys</th>
                  <th className="px-3 py-2 text-right font-semibold">Activations</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((t) => {
                  const spec = targetSpec(t.name);
                  const n = activations.filter((a) => a.target === t.name).length;
                  return (
                    <tr key={t.id} className="border-t border-line/60">
                      <td className="px-3 py-2 font-semibold">{t.name}</td>
                      <td className="px-3 py-2 text-muted">{t.type}</td>
                      <td className="px-3 py-2 text-muted">{spec?.keys ?? "—"}</td>
                      <td className={`px-3 py-2 text-right tabular-nums ${n === 0 ? "text-amber-700" : ""}`}>
                        {n || "none yet"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* All activations */}
        <h3 className="mb-1 text-[13px] font-semibold text-muted">All activations</h3>
        {activations.length === 0 ? (
          <p className="text-[13px] text-muted">No activations yet.</p>
        ) : (
          <ActivationTable
            activations={activations}
            segName={segName}
            onEdit={(a) => setEditing(a)}
          />
        )}
      </Card>
    </>
  );
}

/* ------------------------------ Target view ----------------------------- */

function TargetView({
  projectId,
  target,
  activations,
  segments,
  targets,
}: {
  projectId: string;
  target: TgtLite;
  activations: ActLite[];
  segments: SegLite[];
  targets: TgtLite[];
}) {
  const spec = targetSpec(target.name);
  const segName = new Map(segments.map((s) => [s.id, s.name]));
  const [editing, setEditing] = useState<ActLite | "new" | null>(null);

  return (
    <Card>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">{target.name}</h2>
            <Pill tone="other">{target.type}</Pill>
          </div>
          {spec && (
            <p className="mt-0.5 text-[12px] text-muted">
              <span className="font-medium">Match keys:</span> {spec.keys}
            </p>
          )}
        </div>
        <form action={deleteTargetAction}>
          <input type="hidden" name="id" value={target.id} />
          <button
            type="submit"
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-red-600 transition-colors hover:border-red-300"
          >
            Remove target
          </button>
        </form>
      </div>
      {target.notes && (
        <p className="mb-3 rounded-lg bg-slate-50 p-2.5 text-[12.5px] text-muted">{target.notes}</p>
      )}

      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-muted">Activations to this target</h3>
        {segments.length > 0 && (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="rounded-lg bg-brand px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            ＋ Add activation
          </button>
        )}
      </div>

      {editing && (
        <ActivationForm
          key={editing === "new" ? "new" : editing.id}
          projectId={projectId}
          activation={editing === "new" ? { target: target.name } : editing}
          segments={segments}
          targets={targets}
          onClose={() => setEditing(null)}
        />
      )}

      {activations.length === 0 ? (
        <p className="text-[13px] text-muted">
          No activations to {target.name} yet.
        </p>
      ) : (
        <ActivationTable
          activations={activations}
          segName={segName}
          onEdit={(a) => setEditing(a)}
        />
      )}
    </Card>
  );
}

/* ----------------------------- Add target ------------------------------- */

function AddTargetView({
  projectId,
  registered,
}: {
  projectId: string;
  registered: string[];
}) {
  return (
    <Card>
      <h2 className="mb-1 font-semibold">Add an activation target</h2>
      <p className="mb-3 text-[13px] text-muted">
        Register a destination from the Data 360 target catalog — each gets its
        own sub-tab.
      </p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {ACT_TARGET_CATALOG.map((t) => {
          const isReg = registered.some((r) => r.toLowerCase() === t.name.toLowerCase());
          return (
            <div key={t.name} className="flex items-start gap-3 rounded-xl border border-line bg-white p-3">
              <div className="grow">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{t.name}</span>
                  <Pill tone="other">{t.type}</Pill>
                </div>
                <div className="mt-0.5 text-[11px] text-muted">
                  <span className="font-medium">Keys:</span> {t.keys}
                </div>
                <div className="mt-1 text-[12px] leading-snug text-muted">{t.notes}</div>
              </div>
              {isReg ? (
                <span className="shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-700">
                  Registered
                </span>
              ) : (
                <form action={registerTargetAction} className="shrink-0">
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="name" value={t.name} />
                  <button
                    type="submit"
                    className="rounded-lg bg-brand px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover"
                  >
                    Register
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------------------------- shared pieces ----------------------------- */

function ActivationTable({
  activations,
  segName,
  onEdit,
}: {
  activations: ActLite[];
  segName: Map<string, string>;
  onEdit: (a: ActLite) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[760px] text-[13px]">
        <thead>
          <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2 font-semibold">Segment</th>
            <th className="px-3 py-2 font-semibold">Target</th>
            <th className="px-3 py-2 font-semibold">Contact points</th>
            <th className="px-3 py-2 font-semibold">Attributes</th>
            <th className="px-3 py-2 font-semibold">Frequency</th>
            <th className="px-3 py-2 font-semibold">Consent</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {activations.map((a) => (
            <tr key={a.id} className="border-t border-line/60 align-top hover:bg-slate-50/60">
              <td className="px-3 py-2 font-semibold">{segName.get(a.segmentId) ?? "—"}</td>
              <td className="px-3 py-2">{a.target}</td>
              <td className="px-3 py-2 text-muted">{a.contactPoints || "—"}</td>
              <td className="px-3 py-2 text-muted">{a.relatedAttributes || "—"}</td>
              <td className="px-3 py-2 text-muted">{a.cadence}</td>
              <td className="px-3 py-2 text-muted">{a.consentBasis || "—"}</td>
              <td className="px-3 py-2">
                <Pill tone={statusTone(a.status)}>{a.status}</Pill>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(a)}
                  className="rounded-md border border-line px-2 py-1 text-[12px] text-ink transition-colors hover:border-brand"
                >
                  Edit
                </button>{" "}
                <form action={deleteActivationAction} className="inline">
                  <input type="hidden" name="id" value={a.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-line px-2 py-1 text-[12px] text-muted transition-colors hover:border-red-300 hover:text-red-700"
                  >
                    ✕
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivationForm({
  projectId,
  activation,
  segments,
  targets,
  onClose,
}: {
  projectId: string;
  activation: (Partial<ActLite> & { id?: string }) | null;
  segments: SegLite[];
  targets: TgtLite[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<CreateState, FormData>(
    saveActivationAction,
    {},
  );
  const [segmentId, setSegmentId] = useState(activation?.segmentId ?? segments[0]?.id ?? "");
  const [target, setTarget] = useState(activation?.target ?? targets[0]?.name ?? "");

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  const inputCls =
    "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-brand";

  return (
    <form action={action} className="mb-4 rounded-xl border border-brand/30 bg-brand/5 p-4">
      <input type="hidden" name="projectId" value={projectId} />
      {activation?.id && <input type="hidden" name="id" value={activation.id} />}
      <input type="hidden" name="segmentId" value={segmentId} />
      <input type="hidden" name="target" value={target} />
      <h3 className="mb-3 font-semibold">{activation?.id ? "Edit activation" : "New activation"}</h3>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Segment</span>
          <Select value={segmentId} onChange={setSegmentId} options={segments.map((s) => ({ value: s.id, label: s.name }))} />
        </label>
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Target</span>
          <Select value={target} onChange={setTarget} options={targets.map((t) => t.name)} />
        </label>
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Frequency</span>
          <Select name="cadence" defaultValue={activation?.cadence || "Daily"} options={CADENCES} />
        </label>
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Status</span>
          <Select name="status" defaultValue={activation?.status || "Draft"} options={STATUSES} />
        </label>
      </div>
      <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Contact points</span>
          <input name="contactPoints" defaultValue={activation?.contactPoints} placeholder="e.g. all hashed emails" className={inputCls} />
        </label>
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Related attributes</span>
          <input name="relatedAttributes" defaultValue={activation?.relatedAttributes} placeholder="keep minimal — every column is PII" className={inputCls} />
        </label>
        <label className="text-[13px]">
          <span className="mb-1 block text-muted">Consent handling</span>
          <input name="consentBasis" defaultValue={activation?.consentBasis} placeholder="e.g. email opt-in; suppress open cases" className={inputCls} />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50">
          {pending ? "Saving…" : "Save activation"}
        </button>
        <button type="button" onClick={onClose} className="rounded-lg border border-line bg-white px-4 py-2 text-[13px] text-muted transition-colors hover:border-slate-300">
          Cancel
        </button>
        {state.error && <span className="text-[13px] text-red-700">{state.error}</span>}
      </div>
    </form>
  );
}

function AskAI({ projectId, ready }: { projectId: string; ready: boolean }) {
  const [out, setOut] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function ask() {
    if (busy) return;
    setBusy(true);
    setOut("Thinking…");
    const prompt =
      "You are a Salesforce Data 360 activation strategist. Review this project's activation plan for: refresh-chain waste (activation running more often than the segment publishes), missing consent handling on ad/marketing targets, contact-point requirements (MC needs email/phone), and over-broad related attributes. Give concise, prioritized recommendations.";
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
        className="rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-brand disabled:opacity-50"
      >
        {busy ? "Asking…" : "✨ AI insights"}
      </button>
      {out !== null && (
        <div className="mt-3 w-full basis-full rounded-xl border border-line bg-slate-50 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted">Activation review</span>
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
