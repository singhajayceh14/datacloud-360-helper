"use client";

import { useState } from "react";
import { Card, Pill } from "@/components/ui";
import Link from "next/link";
import { ConnectorSearch } from "./ConnectorSearch";
import { CreateSourceForm } from "./CreateSourceForm";
import { SourceStatus } from "./SourceStatus";
import { ObjectivesCard, type ObjectiveLite } from "./ObjectivesCard";
import { IngestionArchitecture } from "./IngestionArchitecture";
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
  objectives,
  phase,
  segmentCount,
  targetCount,
  openQuestions,
}: {
  projectId: string;
  sources: SourceLite[];
  objectives: ObjectiveLite[];
  phase: string | null;
  segmentCount: number;
  targetCount: number;
  openQuestions: string[];
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
        <OverviewView
          projectId={projectId}
          sources={sources}
          objectives={objectives}
          phase={phase}
          segmentCount={segmentCount}
          targetCount={targetCount}
          openQuestions={openQuestions}
        />
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

function OverviewView({
  projectId,
  sources,
  objectives,
  phase,
  segmentCount,
  targetCount,
  openQuestions,
}: {
  projectId: string;
  sources: SourceLite[];
  objectives: ObjectiveLite[];
  phase: string | null;
  segmentCount: number;
  targetCount: number;
  openQuestions: string[];
}) {
  const writeup = buildWriteup(sources, objectives);

  return (
    <>
      {/* Ingestion architecture */}
      <Card>
        <h2 className="mb-1 font-semibold">Ingestion architecture</h2>
        <p className="mb-3 text-[13px] text-muted">
          All systems connected to Data 360 — use the diagram and write-up in the
          BRD/SDD.
        </p>
        {sources.length > 0 ? (
          <IngestionArchitecture
            sources={sources}
            segmentCount={segmentCount}
            targetCount={targetCount}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-[13px] text-muted">
            No systems yet — click “＋ Connect a system”.
          </p>
        )}
        <p className="mt-2 text-[11px] text-muted">
          Edge colors: blue streaming/real-time · green hourly/rapid · amber
          daily · grey weekly+ / TBD.
        </p>

        <div className="mt-4 rounded-xl border border-line bg-slate-50/60 p-4">
          <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
            {writeup}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <CopyWriteupButton writeup={writeup} />
          <a
            href="/api/brd/export?format=docx"
            className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Update BRD / SDD now
          </a>
        </div>
      </Card>

      {/* Business objectives */}
      <ObjectivesCard projectId={projectId} objectives={objectives} />

      {/* What's next + Data Cloud org */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="mb-0">
          <h2 className="mb-1 font-semibold">What&apos;s next</h2>
          <p className="mb-2 text-[13px] text-muted">
            {phase ? `Phase: ${phase}.` : "Design in progress."}{" "}
            {openQuestions.length > 0
              ? `${openQuestions.length} open question${openQuestions.length === 1 ? "" : "s"} for the client.`
              : ""}
          </p>
          {openQuestions.length > 0 && (
            <ul className="mb-2 ml-4 list-disc text-[13px]">
              {openQuestions.map((q, i) => (
                <li key={i} className="mb-0.5">
                  {q}
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/segments"
            className="inline-block rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-brand"
          >
            Build segments for their goals →
          </Link>
        </Card>

        <Card className="mb-0">
          <h2 className="mb-1 font-semibold">Data Cloud org</h2>
          <p className="mb-2 text-[13px] text-muted">
            No org connected — this console is design-time. Live metadata fetch
            (DMOs/DLOs) from a Data Cloud org is a future step.
          </p>
          <Link
            href="/settings"
            className="inline-block rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-brand"
          >
            Check status
          </Link>
        </Card>
      </div>

      {/* Source inventory table */}
      <Card>
        <div className="mb-1 flex items-center gap-2">
          <h2 className="font-semibold">Source inventory</h2>
          <Pill tone="ga">
            {sources.length} source{sources.length === 1 ? "" : "s"}
          </Pill>
        </div>
        <p className="mb-3 text-[13px] text-muted">
          The table the whole project builds on.
        </p>
        {sources.length === 0 ? (
          <p className="text-[13px] text-muted">
            No sources yet — click “＋ Connect a system”.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-muted">
                  {["Source", "Entities", "Method", "Frequency", "Status", "Notes", ""].map(
                    (h, i) => (
                      <th key={i} className="border-b border-line pb-1.5 pr-3 font-medium">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id} className="border-b border-line/60 align-top">
                    <td className="py-2 pr-3 font-semibold">{s.name}</td>
                    <td className="py-2 pr-3 text-muted">{s.entities || "—"}</td>
                    <td className="py-2 pr-3 text-muted">{s.method || "—"}</td>
                    <td className="py-2 pr-3 text-muted">{s.frequency}</td>
                    <td className="py-2 pr-3">
                      <Pill tone={statusTone(s.status)}>{s.status}</Pill>
                    </td>
                    <td className="py-2 pr-3 text-muted">{s.notes || "—"}</td>
                    <td className="py-2 text-right">
                      <form action={deleteSourceAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-line px-2 py-0.5 text-[12px] text-muted transition-colors hover:border-red-300 hover:text-red-700"
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
        )}
      </Card>
    </>
  );
}

/** Prose "Why this architecture" write-up for the BRD/SDD. */
function buildWriteup(sources: SourceLite[], objectives: ObjectiveLite[]): string {
  if (sources.length === 0)
    return "No systems registered yet — connect the client's sources to generate the architecture write-up.";
  const objLine =
    objectives.length > 0
      ? `The design exists to serve ${objectives.length} business objective${objectives.length === 1 ? "" : "s"}: ${objectives
          .map((o) => o.text.replace(/\.$/, ""))
          .join("; ")}. Every source below earns its place by feeding at least one of them.`
      : "Capture the client's business objectives above so each source can be justified against them.";
  const bullets = sources
    .map(
      (s) =>
        `• ${s.name} contributes ${s.entities || "its data"} — connects via ${s.method || "a method still being researched"} and refreshes ${s.frequency}.`,
    )
    .join("\n");
  return (
    `Why this architecture. ${objLine}\n\n${bullets}\n\n` +
    "Each source lands in its own data stream and Data Lake Object (original schema), is harmonized onto the C360 standard model, and resolves into the Unified Individual — the single customer the segments and activations act on. Per Salesforce best practice, only decision-relevant records and attributes are ingested."
  );
}

function CopyWriteupButton({ writeup }: { writeup: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(writeup);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:border-brand"
    >
      {done ? "Copied ✓" : "Copy write-up"}
    </button>
  );
}
