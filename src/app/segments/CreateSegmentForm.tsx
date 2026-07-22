"use client";

import { useActionState } from "react";
import { Select } from "@/components/Select";
import { createSegmentAction, type CreateState } from "./actions";

const CADENCES = ["Real-time", "Hourly", "Daily", "Weekly", "Manual"];
const STATUSES = ["Draft", "Active", "Paused", "Archived"];

const inputCls =
  "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";

export function CreateSegmentForm({
  projectId,
  objectives = [],
}: {
  projectId: string;
  objectives?: string[];
}) {
  const [state, action, pending] = useActionState<CreateState, FormData>(
    createSegmentAction,
    {},
  );

  return (
    <form action={action}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <input name="name" required placeholder="Segment name *" className={inputCls} />
        <input name="channel" placeholder="Channel (Email, SMS, Ads…)" className={inputCls} />
        <input
          name="objective"
          list="seg-objectives"
          placeholder="Objective (from business objectives)"
          className={`${inputCls} sm:col-span-2`}
        />
        {objectives.length > 0 && (
          <datalist id="seg-objectives">
            {objectives.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        )}
        <textarea
          name="criteria"
          placeholder="Criteria / segment definition"
          rows={2}
          className={`${inputCls} sm:col-span-2`}
        />
        <input name="dmos" placeholder="DMOs used (comma-separated)" className={inputCls} />
        <input
          name="calculatedInsights"
          placeholder="Calculated insights"
          className={inputCls}
        />
        <Select name="cadence" defaultValue="Daily" options={CADENCES} />
        <Select name="status" defaultValue="Draft" options={STATUSES} />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add segment"}
        </button>
        {state.error && (
          <span className="text-[13px] text-red-700">{state.error}</span>
        )}
      </div>
    </form>
  );
}
