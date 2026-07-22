"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { SourceLite } from "./IngestionTabs";

/** Edge color by refresh frequency (matches the caption). */
function freqColor(freq: string): string {
  if (/stream|real.?time/i.test(freq)) return "#2563eb"; // blue
  if (/hour|rapid/i.test(freq)) return "#16a34a"; // green
  if (/daily/i.test(freq)) return "#f59e0b"; // amber
  return "#94a3b8"; // grey (weekly+ / TBD)
}

function monogram(name: string): string {
  return name
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const dotColor = (s: string) =>
  s === "Live" ? "#16a34a" : s === "Blocked" ? "#dc2626" : s === "In progress" ? "#f59e0b" : "#94a3b8";

function SourceNode({ data }: { data: SourceLite }) {
  return (
    <div
      className="w-[220px] rounded-xl border-2 bg-white px-3 py-2 shadow-sm"
      style={{ borderColor: dotColor(data.status) }}
    >
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-[12px] font-bold text-slate-600">
          {monogram(data.name)}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-bold text-ink">{data.name}</div>
          {data.entities && (
            <div className="truncate text-[11px] text-muted">{data.entities}</div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

function HubNode() {
  const stages = [
    "Data Streams",
    "Data Lake Objects (raw)",
    "Data Model Objects (C360)",
    "Unified Individual",
  ];
  return (
    <div className="w-[240px] rounded-2xl border-2 border-brand/40 bg-brand/5 p-3">
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="mb-2 text-center text-[12px] font-bold tracking-wide text-brand">
        SALESFORCE DATA 360
      </div>
      <div className="flex flex-col gap-1.5">
        {stages.map((s, i) => (
          <div
            key={s}
            className={`rounded-lg border bg-white px-2.5 py-1.5 text-center text-[12px] font-medium ${
              i === 3 ? "border-emerald-300 text-emerald-700" : "border-line text-ink"
            }`}
          >
            {s}
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

function ActNode({ data }: { data: { label: string; sub?: string; green?: boolean } }) {
  return (
    <div
      className={`w-[180px] rounded-xl border-2 px-3 py-2.5 text-center shadow-sm ${
        data.green ? "border-emerald-300 bg-emerald-50" : "border-line bg-white"
      }`}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="text-[13px] font-bold text-ink">{data.label}</div>
      {data.sub && <div className="text-[11px] text-muted">{data.sub}</div>}
    </div>
  );
}

const nodeTypes = { source: SourceNode, hub: HubNode, act: ActNode };

export function IngestionArchitecture({
  sources,
  segmentCount,
  targetCount,
}: {
  sources: SourceLite[];
  segmentCount: number;
  targetCount: number;
}) {
  const { nodes, edges, height } = useMemo(() => {
    const ROWH = 92;
    const n = Math.max(sources.length, 1);
    const totalH = n * ROWH;
    const hubY = totalH / 2 - 120;

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    sources.forEach((s, i) => {
      nodes.push({ id: `s${i}`, type: "source", position: { x: 0, y: i * ROWH }, data: s });
      const color = freqColor(s.frequency);
      edges.push({
        id: `es${i}`,
        source: `s${i}`,
        target: "hub",
        label: `${s.method || "TBD"} · ${s.frequency}`,
        labelStyle: { fontSize: 10, fill: "#64748b" },
        labelBgStyle: { fill: "#fff" },
        style: { stroke: color, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color },
      });
    });

    nodes.push({ id: "hub", type: "hub", position: { x: 340, y: hubY }, data: {} });

    nodes.push({
      id: "seg",
      type: "act",
      position: { x: 700, y: hubY + 20 },
      data: {
        label: `${segmentCount} segment${segmentCount === 1 ? "" : "s"}`,
        sub: "publish",
        green: true,
      },
    });
    nodes.push({
      id: "tgt",
      type: "act",
      position: { x: 700, y: hubY + 130 },
      data: { label: `${targetCount} target${targetCount === 1 ? "" : "s"}` },
    });
    edges.push({
      id: "eseg",
      source: "hub",
      target: "seg",
      style: { stroke: "#16a34a", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#16a34a" },
    });
    edges.push({
      id: "etgt",
      source: "hub",
      target: "tgt",
      style: { stroke: "#16a34a", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#16a34a" },
    });

    return { nodes, edges, height: Math.max(360, totalH + 40) };
  }, [sources, segmentCount, targetCount]);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white" style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.2}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        nodesConnectable={false}
        nodesDraggable={false}
        edgesFocusable={false}
      >
        <Background gap={16} color="#f1f5f9" />
      </ReactFlow>
    </div>
  );
}
