import { Banner, PageHeader } from "@/components/ui";
import { isDbConfigured } from "@/db";
import { getActiveProjectId } from "@/lib/active-project";
import { getProject } from "@/db/queries/projects";
import { listSources } from "@/db/queries/sources";
import { listMappings } from "@/db/queries/mappings";
import { getUnification } from "@/db/queries/unifications";
import { deriveUnification } from "@/lib/unification/derive";
import { listSegments } from "@/db/queries/segments";
import { listActivations } from "@/db/queries/activations";
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

  const [sources, mappings, unification, segments, activations] =
    await Promise.all([
      listSources(project.id).catch(() => []),
      listMappings(project.id).catch(() => []),
      getUnification(project.id).catch(() => null),
      listSegments(project.id).catch(() => []),
      listActivations(project.id).catch(() => []),
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
  const mappedNorm = new Set([...dmoSources.keys()].map((d) => d.toLowerCase()));
  const gaps = new Set<string>();
  for (const seg of segments) {
    const required = seg.dmos
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    const missing = required.filter((r) => !mappedNorm.has(r.toLowerCase()));
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

  return (
    <div>
      {header}

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
        <DesignBoard board={board} />
      )}
    </div>
  );
}
