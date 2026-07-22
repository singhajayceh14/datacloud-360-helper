"use client";

import { useState } from "react";
import { Card, Pill } from "@/components/ui";
import { ConnectorSearch } from "./ConnectorSearch";
import { CreateSourceForm } from "./CreateSourceForm";
import { SourceStatus } from "./SourceStatus";
import { deleteSourceAction } from "./actions";

export type SourceLite = {
  id: string;
  name: string;
  entities: string;
  method: string;
  frequency: string;
  status: string;
  notes: string;
};

const dotColor = (s: string) =>
  s === "Live"
    ? "bg-emerald-500"
    : s === "Blocked"
      ? "bg-red-500"
      : s === "In progress"
        ? "bg-amber-500"
        : "bg-slate-400";

function statusTone(s: string): "ga" | "beta" | "other" {
  if (s === "Live") return "ga";
  if (s === "Proposed" || s === "In progress") return "beta";
  return "other";
}

export function IngestionTabs({
  projectId,
  sources,
}: {
  projectId: string;
  sources: SourceLite[];
}) {
  const [view, setView] = useState<string>("overview");

  const pill = (active: boolean) =>
    `flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${
      active
        ? "bg-brand text-white"
        : "border border-line bg-white text-ink hover:border-brand"
    }`;

  const selected = sources.find((s) => s.id === view);

  return (
    <div>
      {/* Sub-nav */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button className={pill(view === "overview")} onClick={() => setView("overview")}>
          Overview
        </button>
        {sources.map((s) => (
          <button key={s.id} className={pill(view === s.id)} onClick={() => setView(s.id)}>
            <span className={`h-2 w-2 rounded-full ${dotColor(s.status)}`} />
            {s.name}
          </button>
        ))}
        <button
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${
            view === "connect"
              ? "bg-slate-900 text-white"
              : "bg-slate-800 text-white hover:bg-slate-900"
          }`}
          onClick={() => setView("connect")}
        >
          ＋ Connect a system
        </button>
      </div>

      {/* Views */}
      {view === "connect" ? (
        <Card>
          <h2 className="mb-1 font-semibold">Connect a system</h2>
          <p className="mb-3 text-[13px] text-muted">
            Search the Salesforce connector directory (325 connectors, verified
            2026-07-10 — re-verify availability at implementation time). Pick the
            client&apos;s system to see what&apos;s natively available.
          </p>
          <ConnectorSearch projectId={projectId} />

          <hr className="my-5 border-line" />

          <p className="mb-3 text-[13px]">
            <span className="font-semibold">Not in the directory?</span> Register
            it manually — the method defaults to “research”, and options are
            verified live at implementation time.
          </p>
          <CreateSourceForm projectId={projectId} />
        </Card>
      ) : selected ? (
        <Card>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${dotColor(selected.status)}`} />
            <h2 className="font-semibold">{selected.name}</h2>
            <Pill tone={statusTone(selected.status)}>{selected.status}</Pill>
            <div className="ml-auto flex items-center gap-2">
              <SourceStatus id={selected.id} status={selected.status} />
              <form action={deleteSourceAction}>
                <input type="hidden" name="id" value={selected.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:border-red-300 hover:text-red-700"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
          <dl className="grid grid-cols-1 gap-2 text-[13px] sm:grid-cols-2">
            <Field label="Entities" value={selected.entities} />
            <Field label="Method" value={selected.method} />
            <Field label="Frequency" value={selected.frequency} />
            <Field label="Owner / notes" value={selected.notes} />
          </dl>
        </Card>
      ) : (
        <OverviewView sources={sources} />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-2.5">
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{value?.trim() || "—"}</dd>
    </div>
  );
}

function OverviewView({ sources }: { sources: SourceLite[] }) {
  const live = sources.filter((s) => s.status === "Live").length;
  const writeup =
    sources.length === 0
      ? "No systems registered yet — use “＋ Connect a system” to search the connector directory or add a source manually."
      : `${sources.length} source system${sources.length === 1 ? "" : "s"} feed Data 360 (${live} live): ` +
        sources
          .map((s) => `${s.name} — ${s.method || "method TBD"}, ${s.frequency}`)
          .join("; ") +
        ".";

  return (
    <>
      <Card>
        <h2 className="mb-1 font-semibold">Ingestion write-up</h2>
        <p className="text-[13px] leading-relaxed text-muted">{writeup}</p>
      </Card>

      <Card>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="font-semibold">Source inventory</h2>
          <Pill tone="ga">
            {sources.length} source{sources.length === 1 ? "" : "s"}
          </Pill>
        </div>
        {sources.length === 0 ? (
          <p className="text-[13px] text-muted">
            No sources yet — click “＋ Connect a system”.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {sources.map((s) => (
              <div
                key={s.id}
                className="flex items-start gap-3 rounded-[10px] border border-line bg-white px-4 py-3"
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor(s.status)}`} />
                <div className="grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{s.name}</span>
                    <Pill tone={statusTone(s.status)}>{s.status}</Pill>
                    {s.method && (
                      <span className="text-[12px] text-muted">· {s.method}</span>
                    )}
                    <span className="text-[12px] text-muted">· {s.frequency}</span>
                  </div>
                  {s.entities && (
                    <div className="mt-1 text-[12px] text-muted">
                      <span className="font-medium">Entities:</span> {s.entities}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <SourceStatus id={s.id} status={s.status} />
                  <form action={deleteSourceAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:border-red-300 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

    </>
  );
}
