import Link from "next/link";
import { Banner, Card, PageHeader, Pill } from "@/components/ui";
import { isDbConfigured } from "@/db";
import { getActiveProjectId } from "@/lib/active-project";
import { getProject } from "@/db/queries/projects";
import { listSources } from "@/db/queries/sources";
import { listMappings } from "@/db/queries/mappings";
import { getUnification } from "@/db/queries/unifications";
import { deriveUnification } from "@/lib/unification/derive";
import { listSegments } from "@/db/queries/segments";
import { listActivations } from "@/db/queries/activations";
import { getEntitlement } from "@/db/queries/entitlements";
import { listObjectives } from "@/db/queries/objectives";
import { getScenarioComparison, baseName } from "@/db/queries/scenarios";
import { formatCredits } from "@/lib/entitlements/calc";
import { calcConsumptionFromVolumes } from "@/lib/entitlements/rate-card";
import { dmoMapped } from "@/lib/mapping/dmo-match";
import { DuplicateButton } from "./DuplicateButton";
import { DesignBoard, type Board, type BoardEdge, type BoardNode, type NodeStatus } from "./DesignBoard";

export const dynamic = "force-dynamic";

const srcStatus = (s: string): NodeStatus =>
  s === "Live" ? "ok" : s === "Blocked" ? "gap" : s === "In progress" ? "wip" : "planned";
const segStatus = (s: string): NodeStatus =>
  s === "Active" ? "ok" : s === "Draft" || s === "Paused" ? "wip" : "planned";

export default async function CanvasPage() {
  const header = (
    <PageHeader
      title="Canvas"
      sub="The whole design as one picture — sources through to activation, color-coded by status. Click a node to open its tab."
    />
  );

  if (!isDbConfigured()) {
    return (
      <div>
        {header}
        <Banner tone="info">
          <strong>Database not connected.</strong> Add{" "}
          <code className="rounded bg-white/60 px-1">DATABASE_URL</code> and run{" "}
          <code className="rounded bg-white/60 px-1">npm run db:migrate</code>.
        </Banner>
      </div>
    );
  }

  const activeId = await getActiveProjectId();
  const project = activeId ? await getProject(activeId).catch(() => null) : null;
  if (!project) {
    return (
      <div>
        {header}
        <Banner tone="info">
          <strong>Select a project</strong> from the sidebar to see its design
          board.
        </Banner>
      </div>
    );
  }

  const [sources, mappings, unification, segments, activations, entitlement, objectives] =
    await Promise.all([
      listSources(project.id).catch(() => []),
      listMappings(project.id).catch(() => []),
      getUnification(project.id).catch(() => null),
      listSegments(project.id).catch(() => []),
      listActivations(project.id).catch(() => []),
      getEntitlement(project.id).catch(() => null),
      listObjectives(project.id).catch(() => []),
    ]);

  const derived = deriveUnification(mappings);
  const nodes: BoardNode[] = [];
  const edges: BoardEdge[] = [];

  // Col 0 — sources (union of inventory + mapped sources).
  const srcMap = new Map<string, NodeStatus>();
  for (const s of sources) srcMap.set(s.name, srcStatus(s.status));
  for (const m of mappings) if (!srcMap.has(m.sourceName)) srcMap.set(m.sourceName, "wip");
  for (const [name, status] of srcMap) {
    nodes.push({ id: `src:${name}`, col: 0, label: name, status, kind: "source" });
  }

  // Col 1 — DMOs (from mappings), edges from their sources.
  const dmoSources = new Map<string, Set<string>>();
  for (const m of mappings) {
    for (const f of m.fields) {
      const set = dmoSources.get(f.dmo) ?? new Set<string>();
      set.add(m.sourceName);
      dmoSources.set(f.dmo, set);
    }
  }
  for (const [dmo, srcs] of dmoSources) {
    nodes.push({
      id: `dmo:${dmo}`,
      col: 1,
      label: dmo,
      status: "wip",
      kind: "dmo",
      sub: `${srcs.size} source${srcs.size === 1 ? "" : "s"}`,
    });
    for (const s of srcs) edges.push({ from: `src:${s}`, to: `dmo:${dmo}` });
  }

  // Col 2 — identity resolution. A saved ruleset counts as designed.
  const hasSavedRuleset = Boolean(unification && unification.matchRules.length > 0);
  const irStatus: NodeStatus = hasSavedRuleset
    ? "ok"
    : derived.readiness.ready
      ? "ok"
      : mappings.length
        ? "wip"
        : "planned";
  nodes.push({
    id: "ir",
    col: 2,
    label: "Identity Resolution",
    status: irStatus,
    kind: "identity",
    sub: hasSavedRuleset
      ? "ruleset saved"
      : derived.readiness.ready
        ? "ready"
        : "not ready",
  });
  for (const dmo of dmoSources.keys()) edges.push({ from: `dmo:${dmo}`, to: "ir" });

  // Col 3 — segments (with data-gap detection vs mapped DMOs).
  const mappedDmos = [...dmoSources.keys()];
  const gaps = new Set<string>();
  for (const seg of segments) {
    const required = seg.dmos
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    const missing = required.filter((r) => !dmoMapped(r, mappedDmos));
    missing.forEach((mm) => gaps.add(mm));
    nodes.push({
      id: `seg:${seg.id}`,
      col: 3,
      label: seg.name,
      status: missing.length ? "gap" : segStatus(seg.status),
      kind: "segment",
      sub: missing.length ? `needs ${missing.join(", ")}` : seg.status,
    });
    edges.push({ from: "ir", to: `seg:${seg.id}` });
  }

  // Col 4 — activation targets.
  const targetStatus = new Map<string, NodeStatus>();
  for (const a of activations) {
    const st: NodeStatus = a.status === "Active" ? "ok" : "wip";
    const cur = targetStatus.get(a.target);
    targetStatus.set(a.target, cur === "ok" ? "ok" : st);
    edges.push({ from: `seg:${a.segmentId}`, to: `tgt:${a.target}` });
  }
  for (const [t, status] of targetStatus) {
    nodes.push({ id: `tgt:${t}`, col: 4, label: t, status, kind: "target" });
  }

  const board: Board = { nodes, edges, gaps: [...gaps] };
  const empty = sources.length === 0 && mappings.length === 0 && segments.length === 0;

  // Use-case coverage: one chip per business objective (or per segment
  // objective if none are defined), lit by the segments that serve it.
  const segMissing = (dmoList: string) =>
    dmoList
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .filter((r) => !dmoMapped(r, mappedDmos));

  const coverage =
    objectives.length > 0
      ? objectives.map((o) => {
          const ot = o.text.trim().toLowerCase();
          const serving = segments.filter((s) => {
            const so = (s.objective ?? "").trim().toLowerCase();
            return so && (so === ot || so.includes(ot) || ot.includes(so));
          });
          let status: NodeStatus = "planned"; // unaddressed
          if (serving.length) {
            const anyGap = serving.some((s) => segMissing(s.dmos).length > 0);
            status = anyGap
              ? "gap"
              : serving.some((s) => s.status === "Active")
                ? "ok"
                : "wip";
          }
          return { label: o.text, status };
        })
      : segments.map((seg) => ({
          label: seg.objective?.trim() || seg.name,
          status: segMissing(seg.dmos).length ? ("gap" as NodeStatus) : segStatus(seg.status),
        }));

  // Next steps: derived to-do list with a link to the tab that resolves it.
  const insights: { text: string; href: string }[] = [];
  const blocked = sources.filter((s) => s.status === "Blocked");
  if (sources.length === 0)
    insights.push({ text: "Add your source systems", href: "/ingestion" });
  for (const b of blocked)
    insights.push({ text: `Unblock source “${b.name}”`, href: "/ingestion" });
  if (mappings.length === 0)
    insights.push({ text: "Import & map a source CSV", href: "/mapping" });
  if (board.gaps.length > 0)
    insights.push({
      text: `Map a source to: ${board.gaps.join(", ")}`,
      href: "/mapping",
    });
  if (!hasSavedRuleset && mappings.length > 0)
    insights.push({ text: "Design identity resolution", href: "/unification" });
  const draftSegs = segments.filter((s) => s.status === "Draft").length;
  if (draftSegs > 0)
    insights.push({
      text: `Activate ${draftSegs} draft segment${draftSegs === 1 ? "" : "s"}`,
      href: "/segments",
    });
  const activatedSegIds = new Set(activations.map((a) => a.segmentId));
  const unActivated = segments.filter((s) => !activatedSegIds.has(s.id));
  if (segments.length > 0 && unActivated.length > 0)
    insights.push({
      text: `Plan activation for ${unActivated.length} segment${unActivated.length === 1 ? "" : "s"}`,
      href: "/activation",
    });
  if (!entitlement)
    insights.push({ text: "Capture the order form & entitlements", href: "/entitlements" });
  if (insights.length === 0)
    insights.push({ text: "Design looks complete — generate the BRD / SDD", href: "/brd" });

  // Economics: annual credit burn vs the pool (from the entitlements tab).
  const econEnv = entitlement?.calcEnv === "sand" ? "sand" : "prod";
  const econ = entitlement
    ? calcConsumptionFromVolumes(
        entitlement.volumes,
        econEnv,
        econEnv === "sand" ? entitlement.sandboxCredits : entitlement.dataServicesCredits,
      )
    : null;

  // Scenario family: this project plus any forks sharing its base name.
  const family = (await getScenarioComparison().catch(() => [])).filter(
    (r) => baseName(r.name) === baseName(project.name),
  );

  // Phase stepper — status derived from real design state.
  type PhaseStatus = "complete" | "inprogress" | "planned";
  const anyLiveSource = sources.some((s) => s.status === "Live");
  const allActiveSeg = segments.length > 0 && segments.every((s) => s.status === "Active");
  const allActiveAct = activations.length > 0 && activations.every((a) => a.status === "Active");
  const phases: { n: number; title: string; status: PhaseStatus }[] = [
    {
      n: 1,
      title: "Source discovery & ingestion",
      status: sources.length ? (anyLiveSource ? "complete" : "inprogress") : "planned",
    },
    {
      n: 2,
      title: "Data mapping",
      status: mappings.length ? (board.gaps.length ? "inprogress" : "complete") : "planned",
    },
    {
      n: 3,
      title: "BRD / SDD",
      status: mappings.length ? "inprogress" : "planned",
    },
    {
      n: 4,
      title: "Unification",
      status: hasSavedRuleset ? "complete" : mappings.length ? "inprogress" : "planned",
    },
    {
      n: 5,
      title: "Segmentation",
      status: segments.length ? (allActiveSeg ? "complete" : "inprogress") : "planned",
    },
    {
      n: 6,
      title: "Activation",
      status: activations.length ? (allActiveAct ? "complete" : "inprogress") : "planned",
    },
  ];
  const pct = Math.round(
    (100 *
      phases.reduce(
        (a, p) => a + (p.status === "complete" ? 1 : p.status === "inprogress" ? 0.5 : 0),
        0,
      )) /
      phases.length,
  );
  const phaseLabel: Record<PhaseStatus, string> = {
    complete: "Complete",
    inprogress: "In progress",
    planned: "Planned",
  };

  return (
    <div>
      {header}

      {/* Phase stepper + progress */}
      <Card>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <div className="font-semibold">
            {project.name}
            {project.phase && (
              <>
                {" — "}
                <span className="text-brand">{project.phase}</span>
              </>
            )}
          </div>
          <div className="text-[13px] font-medium text-muted">{pct}% complete</div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {phases.map((p) => {
            const c =
              p.status === "complete"
                ? { box: "border-emerald-200 bg-emerald-50", dot: "bg-emerald-500" }
                : p.status === "inprogress"
                  ? { box: "border-amber-200 bg-amber-50", dot: "bg-amber-500" }
                  : { box: "border-line bg-white", dot: "bg-slate-400" };
            return (
              <div key={p.n} className={`rounded-xl border p-3 ${c.box}`}>
                <div className="flex items-start gap-2">
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${c.dot}`}
                  >
                    {p.n}
                  </span>
                  <span className="text-[13px] font-semibold leading-tight">
                    {p.title}
                  </span>
                </div>
                <div className="mt-1 text-[12px] text-muted">
                  {phaseLabel[p.status]}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {board.gaps.length > 0 && (
        <Banner tone="warn">
          <strong>
            {board.gaps.length} data gap{board.gaps.length === 1 ? "" : "s"}
          </strong>{" "}
          — segments need DMOs that nothing maps to yet:{" "}
          <span className="font-medium">{board.gaps.join(", ")}</span>. Map a
          source to them on the Data Mapping tab.
        </Banner>
      )}

      {empty ? (
        <Banner tone="info">
          Nothing to draw yet — add sources (Ingestion), map a CSV (Data
          Mapping), and build segments. The board fills in as you design.
        </Banner>
      ) : (
        <>
          <h2 className="mb-2 mt-1 font-semibold">Design board</h2>
          <p className="mb-2 text-[12px] text-muted">
            Click any node for its config and the tab that owns it.
          </p>
          <DesignBoard board={board} />

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* Use-case coverage */}
            <Card className="mb-0">
              <h2 className="mb-2 font-semibold">Use-case coverage</h2>
              {coverage.length === 0 ? (
                <p className="text-[13px] text-muted">
                  No segments yet — objectives light up here once you build them.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {coverage.map((c, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${
                        c.status === "gap"
                          ? "bg-red-50 text-red-700"
                          : c.status === "ok"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {c.label}
                    </span>
                  ))}
                </div>
              )}
            </Card>

            {/* Next steps */}
            <Card className="mb-0">
              <h2 className="mb-2 font-semibold">Next steps</h2>
              <ul className="flex flex-col gap-1.5">
                {insights.map((it, i) => (
                  <li key={i}>
                    <Link
                      href={it.href}
                      className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-[13px] transition-colors hover:border-brand hover:bg-slate-50"
                    >
                      <span className="text-brand">→</span>
                      <span className="grow">{it.text}</span>
                      <span className="text-[11px] text-muted">
                        {it.href.replace("/", "")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Economics */}
            <Card className="mb-0 lg:col-span-2">
              <div className="mb-2 flex items-center gap-2">
                <h2 className="font-semibold">Economics</h2>
                {econ && (
                  <Pill
                    tone={
                      econ.utilizationPct === null
                        ? "other"
                        : econ.utilizationPct > 100
                          ? "beta"
                          : "ga"
                    }
                  >
                    {econ.utilizationPct === null
                      ? "no pool set"
                      : `${econ.utilizationPct.toFixed(0)}% of pool`}
                  </Pill>
                )}
              </div>
              {econ ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric label="Monthly credits" value={formatCredits(econ.monthlyCredits)} />
                  <Metric label="Annual credits" value={formatCredits(econ.annualCredits)} />
                  <Metric
                    label="Credit pool"
                    value={formatCredits(entitlement!.dataServicesCredits)}
                  />
                  <Metric
                    label={econ.remaining >= 0 ? "Headroom" : "Over pool"}
                    value={formatCredits(Math.abs(econ.remaining))}
                    tone={econ.remaining >= 0 ? "ok" : "bad"}
                  />
                </div>
              ) : (
                <p className="text-[13px] text-muted">
                  No entitlements captured —{" "}
                  <Link href="/entitlements" className="text-brand hover:underline">
                    add the order form
                  </Link>{" "}
                  to estimate credit burn vs the pool.
                </p>
              )}
            </Card>

            {/* Scenario comparison */}
            <Card className="mb-0 lg:col-span-2">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">Scenarios</h2>
                  <Pill tone="other">
                    {family.length} in family
                  </Pill>
                </div>
                <DuplicateButton projectId={project.id} />
              </div>
              <p className="mb-3 text-[12px] text-muted">
                Fork this project to compare alternatives (e.g. Zero Copy vs
                ingestion) side by side — the cheapest consistent scenario wins
                the client conversation.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-[13px]">
                  <thead>
                    <tr className="text-left text-muted">
                      <th className="border-b border-line pb-1 pr-3 font-medium">Scenario</th>
                      <th className="border-b border-line pb-1 pr-3 text-right font-medium">Sources</th>
                      <th className="border-b border-line pb-1 pr-3 text-right font-medium">DMOs</th>
                      <th className="border-b border-line pb-1 pr-3 text-right font-medium">Gaps</th>
                      <th className="border-b border-line pb-1 pr-3 text-right font-medium">Segments</th>
                      <th className="border-b border-line pb-1 pr-3 text-right font-medium">Activations</th>
                      <th className="border-b border-line pb-1 text-right font-medium">Est. credits/yr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {family.map((r) => (
                      <tr
                        key={r.id}
                        className={`border-b border-line/60 ${r.id === project.id ? "bg-slate-50" : ""}`}
                      >
                        <td className="py-1.5 pr-3">
                          {r.name.replace(baseName(r.name), "").replace(/^ — /, "") || "Base"}
                          {r.id === project.id && (
                            <span className="ml-1.5 text-[11px] text-brand">current</span>
                          )}
                        </td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{r.sources}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{r.dmos}</td>
                        <td className={`py-1.5 pr-3 text-right tabular-nums ${r.gaps > 0 ? "text-red-700" : ""}`}>{r.gaps}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{r.segments}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{r.activations}</td>
                        <td className="py-1.5 text-right tabular-nums">
                          {r.credits === null ? "—" : formatCredits(r.credits)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "muted" | "ok" | "bad";
}) {
  const cls =
    tone === "ok" ? "text-emerald-700" : tone === "bad" ? "text-red-700" : "text-ink";
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <div className="text-[12px] text-muted">{label}</div>
      <div className={`mt-1 text-[20px] font-semibold tabular-nums ${cls}`}>
        {value}
      </div>
    </div>
  );
}
