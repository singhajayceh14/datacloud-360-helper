"use client";

import { useCallback, useMemo, useState } from "react";
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
type DmoData = {
  dmo: string;
  category: string;
  count: number;
  sources: string[];
  focused?: boolean;
};

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
      className="cursor-pointer rounded-lg border-2 bg-white px-3 py-2 shadow-sm transition-shadow"
      style={{
        borderColor: color,
        width: 216,
        boxShadow: data.focused
          ? `0 0 0 3px ${color}55`
          : "0 1px 2px rgba(0,0,0,0.05)",
      }}
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
  const [activeId, setActiveId] = useState<string | null>(null); // null = all
  const [selectedDmo, setSelectedDmo] = useState<string | null>(null);

  const visibleMappings = useMemo(
    () => (activeId ? mappings.filter((m) => m.id === activeId) : mappings),
    [mappings, activeId],
  );

  const base = useMemo(() => {
    const nodeList: Node[] = [];
    const edgeList: Edge[] = [];

    // First pass: collect unique DMOs (first-seen order) and who feeds them.
    const dmoOrder: string[] = [];
    const dmoInfo = new Map<
      string,
      { category: string; count: number; sources: Set<string> }
    >();
    for (const m of visibleMappings) {
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
    visibleMappings.forEach((m, mi) => {
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
  }, [visibleMappings]);

  // Apply focus styling: when a DMO is selected, light up its incoming edges
  // and contributing source columns/groups, and dim everything else.
  const { nodes, edges } = useMemo(() => {
    if (!selectedDmo) return base;
    const litCols = new Set(
      base.edges.filter((e) => e.target === selectedDmo).map((e) => e.source),
    );
    const litGroups = new Set([...litCols].map((id) => id.split("-c")[0]));
    const lit = new Set<string>([selectedDmo, ...litCols, ...litGroups]);

    const nodes = base.nodes.map((n) => ({
      ...n,
      data:
        n.type === "dmo"
          ? { ...(n.data as DmoData), focused: n.id === selectedDmo }
          : n.data,
      style: {
        ...n.style,
        opacity: lit.has(n.id) ? 1 : 0.16,
        transition: "opacity 0.2s ease",
      },
    }));
    const edges = base.edges.map((e) => {
      const on = e.target === selectedDmo;
      return {
        ...e,
        animated: on,
        zIndex: on ? 10 : 0,
        style: {
          ...e.style,
          opacity: on ? 1 : 0.05,
          strokeWidth: on ? 3 : (e.style?.strokeWidth as number) ?? 1.5,
        },
      };
    });
    return { nodes, edges };
  }, [base, selectedDmo]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "dmo") {
        setSelectedDmo((prev) => (prev === node.id ? null : node.id));
      } else if (node.type === "column") {
        // Clicking a source column focuses the DMO it feeds.
        const edge = base.edges.find((e) => e.source === node.id);
        setSelectedDmo(edge ? (edge.target as string) : null);
      }
    },
    [base.edges],
  );

  const focusedName = selectedDmo
    ? (base.nodes.find((n) => n.id === selectedDmo)?.data as DmoData | undefined)
        ?.dmo
    : null;

  function pick(id: string | null) {
    setActiveId(id);
    setSelectedDmo(null);
  }

  return (
    <div>
      {/* Source view tabs */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <TabButton active={activeId === null} onClick={() => pick(null)}>
          All sources
          <span className="ml-1 opacity-70">{mappings.length}</span>
        </TabButton>
        {mappings.map((m) => (
          <TabButton
            key={m.id}
            active={activeId === m.id}
            onClick={() => pick(m.id)}
          >
            {m.sourceName}
            <span className="ml-1 opacity-70">{m.fields.length}</span>
          </TabButton>
        ))}
      </div>

      <div className="h-[620px] overflow-hidden rounded-xl border border-line bg-white">
        <ReactFlow
          key={activeId ?? "all"}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.15}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          nodesConnectable={false}
          edgesFocusable={false}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedDmo(null)}
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
            <div className="mt-1 text-muted">Click a DMO to trace its sources</div>
          </div>
        </Panel>

        {focusedName && (
          <Panel position="top-right">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-white/90 px-3 py-2 text-[12px] shadow-sm backdrop-blur">
              <span className="text-muted">Focused:</span>
              <span className="font-semibold text-ink">{focusedName}</span>
              <button
                type="button"
                onClick={() => setSelectedDmo(null)}
                className="rounded-md border border-line px-1.5 py-0.5 text-[11px] text-muted transition-colors hover:border-brand hover:text-brand"
              >
                Clear ✕
              </button>
            </div>
          </Panel>
        )}
        </ReactFlow>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
        active
          ? "bg-brand text-white"
          : "border border-line bg-white text-muted hover:border-brand hover:text-brand"
      }`}
    >
      {children}
    </button>
  );
}
