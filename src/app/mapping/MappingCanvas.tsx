"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { MappingField } from "@/db/schema";

/** Category → hex, matching the list view's Tailwind palette. */
const CAT_HEX: Record<string, string> = {
  Identity: "#3b82f6",
  "Contact Point": "#14b8a6",
  Consent: "#f59e0b",
  Party: "#8b5cf6",
  Attribute: "#94a3b8",
};
const hex = (c: string) => CAT_HEX[c] ?? CAT_HEX.Attribute;

type SourceData = {
  column: string;
  sample: string | null;
  category: string;
  identity: boolean;
};
type TargetData = { dmo: string; category: string; count: number };

function SourceNode({ data }: { data: SourceData }) {
  const color = hex(data.category);
  return (
    <div
      className="min-w-[160px] max-w-[200px] rounded-lg border border-line bg-white px-3 py-2 shadow-sm"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-center gap-1.5">
        <span className="truncate font-mono text-[12px] font-semibold text-ink">
          {data.column}
        </span>
        {data.identity && (
          <span className="rounded bg-blue-100 px-1 text-[9px] font-bold text-blue-700">
            ID
          </span>
        )}
      </div>
      {data.sample && (
        <div className="truncate text-[10px] text-muted">e.g. {data.sample}</div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: color, width: 8, height: 8, border: "none" }}
      />
    </div>
  );
}

function TargetNode({ data }: { data: TargetData }) {
  const color = hex(data.category);
  return (
    <div
      className="min-w-[150px] max-w-[220px] rounded-lg border-2 bg-white px-3 py-2 shadow-sm"
      style={{ borderColor: color }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color, width: 8, height: 8, border: "none" }}
      />
      <div className="truncate text-[12px] font-semibold" style={{ color }}>
        {data.dmo}
      </div>
      <div className="text-[10px] text-muted">
        {data.count} field{data.count === 1 ? "" : "s"}
      </div>
    </div>
  );
}

const nodeTypes = { source: SourceNode, target: TargetNode };

/**
 * Read-only React Flow canvas: source columns on the left flow into their
 * unique target DMOs on the right, colored by category. Identity edges are
 * thicker and animated. Pan / zoom / drag nodes; edges aren't editable here.
 */
export function MappingCanvas({ fields }: { fields: MappingField[] }) {
  const { nodes, edges } = useMemo(() => {
    const SPACING = 76;
    const TARGET_X = 440;
    const totalH = Math.max(fields.length, 1) * SPACING;

    const sourceNodes: Node[] = fields.map((f, i) => ({
      id: `s-${i}`,
      type: "source",
      position: { x: 0, y: i * SPACING },
      data: {
        column: f.column,
        sample: f.sample,
        category: f.category,
        identity: f.identity,
      },
    }));

    // Collapse to unique DMOs (person-split fans many columns into few DMOs).
    const dmoMap = new Map<string, { category: string; count: number }>();
    for (const f of fields) {
      const e = dmoMap.get(f.dmo);
      if (e) e.count++;
      else dmoMap.set(f.dmo, { category: f.category, count: 1 });
    }
    const dmos = [...dmoMap.entries()];
    const targetNodes: Node[] = dmos.map(([dmo, info], j) => ({
      id: `t-${dmo}`,
      type: "target",
      position: {
        x: TARGET_X,
        y: (j + 0.5) * (totalH / dmos.length) - 24,
      },
      data: { dmo, category: info.category, count: info.count },
    }));

    const edgeList: Edge[] = fields.map((f, i) => ({
      id: `e-${i}`,
      source: `s-${i}`,
      target: `t-${f.dmo}`,
      animated: f.identity,
      style: { stroke: hex(f.category), strokeWidth: f.identity ? 2.5 : 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: hex(f.category) },
    }));

    return { nodes: [...sourceNodes, ...targetNodes], edges: edgeList };
  }, [fields]);

  return (
    <div className="h-[460px] overflow-hidden rounded-xl border border-line bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        nodesConnectable={false}
        edgesFocusable={false}
        elevateEdgesOnSelect={false}
      >
        <Background gap={16} color="#eef1f5" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
