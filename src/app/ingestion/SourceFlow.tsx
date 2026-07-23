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

export type StreamLite = {
  dlo: string;
  category: string;
  pk: string;
  eventTime: string;
  dmos: string[];
  doc: string;
};

function SrcNode({ data }: { data: { label: string } }) {
  return (
    <div className="rounded-lg border-2 border-brand/50 bg-brand/10 px-4 py-2 text-[13px] font-semibold text-ink">
      {data.label}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

function StreamNode({ data }: { data: { dlo: string; category: string } }) {
  return (
    <div className="w-[200px] rounded-lg border border-line bg-white px-3 py-2 text-center text-[12px] shadow-sm">
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="text-muted">Data Stream ·</div>
      <div className="font-mono font-semibold text-ink">{data.dlo}</div>
      <div className="text-[11px] text-muted">({data.category})</div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

function DmoNode({ data }: { data: { label: string } }) {
  return (
    <div className="w-[180px] rounded-lg border border-line bg-white px-3 py-2 text-center text-[12px] font-medium text-ink shadow-sm">
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      {data.label}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

function UnifiedNode({ data }: { data: { label: string } }) {
  return (
    <div className="rounded-xl bg-brand px-4 py-2.5 text-[13px] font-bold text-white shadow">
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      {data.label}
    </div>
  );
}

const nodeTypes = { src: SrcNode, stream: StreamNode, dmo: DmoNode, unified: UnifiedNode };

export function SourceFlow({
  sourceName,
  method,
  streams,
}: {
  sourceName: string;
  method: string;
  streams: StreamLite[];
}) {
  const { nodes, edges, height } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Unique DMOs across all streams (first-seen order).
    const dmoOrder: string[] = [];
    for (const s of streams)
      for (const d of s.dmos) if (!dmoOrder.includes(d)) dmoOrder.push(d);

    const DMO_H = 74;
    const STREAM_H = 130;
    const dmoTotal = Math.max(dmoOrder.length, 1) * DMO_H;
    const streamTotal = Math.max(streams.length, 1) * STREAM_H;
    const total = Math.max(dmoTotal, streamTotal, 300);
    const mid = total / 2;

    nodes.push({
      id: "src",
      type: "src",
      position: { x: 20, y: mid - 20 },
      data: { label: sourceName },
    });
    nodes.push({
      id: "unified",
      type: "unified",
      position: { x: 980, y: mid - 22 },
      data: { label: "Unified Individual" },
    });

    streams.forEach((s, i) => {
      const y = (total - streamTotal) / 2 + i * STREAM_H;
      nodes.push({
        id: `st${i}`,
        type: "stream",
        position: { x: 260, y },
        data: { dlo: s.dlo, category: s.category },
      });
      edges.push({
        id: `es${i}`,
        source: "src",
        target: `st${i}`,
        label: method || "TBD",
        labelStyle: { fontSize: 10, fill: "#64748b" },
        style: { stroke: "#94a3b8", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
      });
      for (const d of s.dmos)
        edges.push({
          id: `sd${i}-${d}`,
          source: `st${i}`,
          target: `dmo-${dmoOrder.indexOf(d)}`,
          style: { stroke: "#cbd5e1", strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#cbd5e1" },
        });
    });

    dmoOrder.forEach((d, j) => {
      const y = (total - dmoTotal) / 2 + j * DMO_H;
      nodes.push({ id: `dmo-${j}`, type: "dmo", position: { x: 620, y }, data: { label: d } });
      edges.push({
        id: `du${j}`,
        source: `dmo-${j}`,
        target: "unified",
        style: { stroke: "#cbd5e1", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
      });
    });

    return { nodes, edges, height: Math.max(360, total + 40) };
  }, [sourceName, method, streams]);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-slate-50/40" style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.08 }}
        minZoom={0.2}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        nodesConnectable={false}
        nodesDraggable={false}
        edgesFocusable={false}
      >
        <Background gap={16} color="#eef1f5" />
      </ReactFlow>
    </div>
  );
}
