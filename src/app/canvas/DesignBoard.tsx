"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  Panel,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export type NodeStatus = "ok" | "wip" | "planned" | "gap";
export type BoardNode = {
  id: string;
  col: number;
  label: string;
  sub?: string;
  status: NodeStatus;
  kind: string;
};
export type BoardEdge = { from: string; to: string };
export type Board = { nodes: BoardNode[]; edges: BoardEdge[]; gaps: string[] };

const STATUS: Record<NodeStatus, { color: string; label: string }> = {
  ok: { color: "#16a34a", label: "Live / ready" },
  wip: { color: "#f59e0b", label: "Draft / mapped" },
  planned: { color: "#94a3b8", label: "Planned" },
  gap: { color: "#dc2626", label: "Data gap" },
};

const COLS = [
  "Sources",
  "Data model (DMOs)",
  "Identity resolution",
  "Segments",
  "Activation targets",
];

const KIND_HREF: Record<string, string> = {
  source: "/ingestion",
  dmo: "/mapping",
  identity: "/unification",
  segment: "/segments",
  target: "/activation",
};

const COLW = 264;
const ROWH = 78;

function StageNode({ data }: { data: BoardNode }) {
  const s = STATUS[data.status];
  const dashed = data.status === "planned" || data.status === "gap";
  return (
    <div
      className="min-w-[160px] max-w-[200px] cursor-pointer rounded-lg border-2 bg-white px-3 py-2 shadow-sm transition-shadow hover:shadow-md"
      style={{ borderColor: s.color, borderStyle: dashed ? "dashed" : "solid" }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="flex items-center gap-1.5">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: s.color }}
        />
        <span className="truncate text-[12px] font-semibold text-ink">
          {data.label}
        </span>
      </div>
      {data.sub && <div className="truncate text-[10px] text-muted">{data.sub}</div>}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

function HeaderNode({ data }: { data: { title: string } }) {
  return (
    <div className="whitespace-nowrap text-[12px] font-bold uppercase tracking-wide text-muted">
      {data.title}
    </div>
  );
}

const nodeTypes = { stage: StageNode, header: HeaderNode };

export function DesignBoard({ board }: { board: Board }) {
  const [selected, setSelected] = useState<BoardNode | null>(null);

  const { nodes, edges } = useMemo(() => {
    const byCol: Record<number, BoardNode[]> = {};
    for (const n of board.nodes) (byCol[n.col] ??= []).push(n);
    const maxCount = Math.max(1, ...Object.values(byCol).map((a) => a.length));
    const maxH = maxCount * ROWH;

    const nodes: Node[] = [];
    // Column headers.
    COLS.forEach((title, col) => {
      if (byCol[col]?.length) {
        nodes.push({
          id: `hdr${col}`,
          type: "header",
          position: { x: col * COLW, y: -56 },
          data: { title },
          draggable: false,
          selectable: false,
        });
      }
    });
    // Stage nodes, each column vertically centered.
    board.nodes.forEach((n) => {
      const list = byCol[n.col];
      const idx = list.indexOf(n);
      const yOffset = (maxH - list.length * ROWH) / 2;
      nodes.push({
        id: n.id,
        type: "stage",
        position: { x: n.col * COLW, y: yOffset + idx * ROWH },
        data: n,
      });
    });

    const edges: Edge[] = board.edges.map((e, i) => ({
      id: `e${i}`,
      source: e.from,
      target: e.to,
      style: { stroke: "#cbd5e1", strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#cbd5e1" },
    }));

    return { nodes, edges };
  }, [board]);

  return (
    <div className="h-[600px] overflow-hidden rounded-xl border border-line bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.14 }}
        minZoom={0.2}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        nodesConnectable={false}
        edgesFocusable={false}
        onNodeClick={(_, node) => {
          if (node.type === "stage") setSelected(node.data as BoardNode);
        }}
        onPaneClick={() => setSelected(null)}
      >
        <Background gap={16} color="#eef1f5" />
        <Controls showInteractive={false} />

        {/* Legend */}
        <Panel position="bottom-left">
          <div className="flex flex-wrap gap-2 rounded-lg border border-line bg-white/90 px-3 py-2 text-[11px] shadow-sm backdrop-blur">
            {(Object.keys(STATUS) as NodeStatus[]).map((k) => (
              <span key={k} className="flex items-center gap-1.5 text-muted">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: STATUS[k].color }}
                />
                {STATUS[k].label}
              </span>
            ))}
          </div>
        </Panel>

        {/* Detail / action panel */}
        {selected && (
          <Panel position="top-right">
            <div className="w-56 rounded-xl border border-line bg-white/95 p-3 shadow-lg backdrop-blur">
              <div className="mb-1 flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: STATUS[selected.status].color }}
                />
                <span className="text-[13px] font-semibold text-ink">
                  {selected.label}
                </span>
              </div>
              <div className="text-[11px] uppercase tracking-wide text-muted">
                {selected.kind}
              </div>
              <div className="mt-1 text-[12px] text-muted">
                Status: {STATUS[selected.status].label}
                {selected.sub ? ` · ${selected.sub}` : ""}
              </div>
              {KIND_HREF[selected.kind] && (
                <Link
                  href={KIND_HREF[selected.kind]}
                  className="mt-3 inline-block rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                  Open in {selected.kind === "identity" ? "Unification" : capitalize(hrefTab(selected.kind))} →
                </Link>
              )}
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

function hrefTab(kind: string) {
  return (KIND_HREF[kind] ?? "/").replace("/", "");
}
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
