"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Mapping } from "@/db/schema";

const CAT_HEX: Record<string, string> = {
  Identity: "#3b82f6",
  "Contact Point": "#14b8a6",
  Consent: "#f59e0b",
  Party: "#8b5cf6",
  Attribute: "#94a3b8",
};
const hex = (c: string) => CAT_HEX[c] ?? CAT_HEX.Attribute;

// Layout constants.
const GROUP_W = 244;
const HEADER_H = 38;
const ROW_H = 42;
const GROUP_GAP = 28;
const COL_X = 14;
const DMO_X = 600;

type GroupData = { label: string; count: number };
type ColumnData = { column: string; category: string; identity: boolean };
type DmoData = { dmo: string; category: string; count: number; sources: string[] };

function GroupNode({ data }: { data: GroupData }) {
  return (
    <div className="h-full w-full rounded-xl border border-slate-300 bg-slate-50/70">
      <div className="flex items-center gap-1.5 rounded-t-xl border-b border-slate-200 bg-white px-3 py-2">
        <span className="text-2xl leading-none">⇥</span>
        <span className="truncate text-[13px] font-bold text-ink">{data.label}</span>
        <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-muted">
          {data.count}
        </span>
      </div>
    </div>
  );
}

function ColumnNode({ data }: { data: ColumnData }) {
  const color = hex(data.category);
  return (
    <div
      className="rounded-md border border-line bg-white px-2 py-1 shadow-sm"
      style={{ borderLeft: `3px solid ${color}`, width: 212 }}
    >
      <div className="flex items-center gap-1">
        <span className="truncate font-mono text-[11px] font-semibold text-ink">
          {data.column}
        </span>
        {data.identity && (
          <span className="ml-auto rounded bg-blue-100 px-1 text-[8px] font-bold text-blue-700">
            ID
          </span>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: color, width: 7, height: 7, border: "none" }}
      />
    </div>
  );
}

function DmoNode({ data }: { data: DmoData }) {
  const color = hex(data.category);
  const unified = data.sources.length > 1;
  return (
    <div
      className="rounded-lg border-2 bg-white px-3 py-2 shadow-sm"
      style={{ borderColor: color, width: 216 }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color, width: 8, height: 8, border: "none" }}
      />
      <div className="flex items-center gap-1.5">
        <span className="truncate text-[12px] font-semibold" style={{ color }}>
          {data.dmo}
        </span>
        {unified && (
          <span className="ml-auto shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
            unified
          </span>
        )}
      </div>
      <div className="truncate text-[10px] text-muted">
        {data.count} field{data.count === 1 ? "" : "s"} · {data.sources.join(", ")}
      </div>
    </div>
  );
}

const nodeTypes = { group: GroupNode, column: ColumnNode, dmo: DmoNode };

/**
 * The whole project's field mappings as one graph: each source is a group of
 * column nodes on the left, all flowing into the shared, de-duplicated set of
 * target DMOs on the right. A DMO fed by more than one source is marked
 * "unified" — the visual payoff of cross-source identity resolution.
 */
export function ProjectMappingCanvas({ mappings }: { mappings: Mapping[] }) {
  const { nodes, edges } = useMemo(() => {
    const nodeList: Node[] = [];
    const edgeList: Edge[] = [];

    // First pass: collect unique DMOs (first-seen order) and who feeds them.
    const dmoOrder: string[] = [];
    const dmoInfo = new Map<
      string,
      { category: string; count: number; sources: Set<string> }
    >();
    for (const m of mappings) {
      for (const f of m.fields) {
        if (!dmoInfo.has(f.dmo)) {
          dmoInfo.set(f.dmo, { category: f.category, count: 0, sources: new Set() });
          dmoOrder.push(f.dmo);
        }
        const info = dmoInfo.get(f.dmo)!;
        info.count++;
        info.sources.add(m.sourceName);
      }
    }
    const dmoIndex = new Map(dmoOrder.map((d, i) => [d, i]));
    const dmoNodeId = (d: string) => `dmo-${dmoIndex.get(d)}`;

    // Source groups + column nodes + edges.
    let y = 0;
    mappings.forEach((m, mi) => {
      const gh = HEADER_H + m.fields.length * ROW_H + 12;
      nodeList.push({
        id: `g${mi}`,
        type: "group",
        position: { x: 0, y },
        data: { label: m.sourceName, count: m.fields.length },
        style: { width: GROUP_W, height: gh },
      });
      m.fields.forEach((f, ci) => {
        nodeList.push({
          id: `g${mi}-c${ci}`,
          type: "column",
          parentId: `g${mi}`,
          extent: "parent",
          position: { x: COL_X, y: HEADER_H + ci * ROW_H },
          data: { column: f.column, category: f.category, identity: f.identity },
        });
        edgeList.push({
          id: `e${mi}-${ci}`,
          source: `g${mi}-c${ci}`,
          target: dmoNodeId(f.dmo),
          animated: f.identity,
          style: { stroke: hex(f.category), strokeWidth: f.identity ? 2.5 : 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: hex(f.category) },
        });
      });
      y += gh + GROUP_GAP;
    });

    const totalH = Math.max(y, 1);
    dmoOrder.forEach((dmo, j) => {
      const info = dmoInfo.get(dmo)!;
      nodeList.push({
        id: `dmo-${j}`,
        type: "dmo",
        position: {
          x: DMO_X,
          y: (j + 0.5) * (totalH / dmoOrder.length) - 24,
        },
        data: {
          dmo,
          category: info.category,
          count: info.count,
          sources: [...info.sources],
        },
      });
    });

    return { nodes: nodeList, edges: edgeList };
  }, [mappings]);

  return (
    <div className="h-[620px] overflow-hidden rounded-xl border border-line bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.15}
        nodesConnectable={false}
        edgesFocusable={false}
      >
        <Background gap={16} color="#eef1f5" />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) =>
            n.type === "dmo"
              ? hex((n.data as DmoData).category)
              : n.type === "column"
                ? hex((n.data as ColumnData).category)
                : "#cbd5e1"
          }
          className="!bg-white"
        />
        <Panel position="top-left">
          <div className="rounded-lg border border-line bg-white/90 px-3 py-2 text-[11px] shadow-sm backdrop-blur">
            <div className="mb-1 font-semibold text-ink">Categories</div>
            <div className="flex flex-col gap-0.5">
              {Object.entries(CAT_HEX).map(([cat, color]) => (
                <span key={cat} className="flex items-center gap-1.5 text-muted">
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                  {cat}
                </span>
              ))}
            </div>
            <div className="mt-1.5 border-t border-line pt-1.5 text-muted">
              <span className="font-medium text-blue-700">Animated</span> edge = identity key
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
