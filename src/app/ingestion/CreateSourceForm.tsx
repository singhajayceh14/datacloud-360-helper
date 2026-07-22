"use client";

import { useActionState } from "react";
import { Select } from "@/components/Select";
import { createSourceAction, type CreateState } from "./actions";

const METHODS = [
  "Native connector",
  "Ingestion API",
  "S3 / Cloud storage",
  "SFTP",
  "MuleSoft",
  "Web / Mobile SDK",
  "Zero Copy federation",
  "Manual CSV",
  "TBD",
];
const FREQUENCIES = [
  "Streaming / Real-time",
  "Hourly",
  "Daily",
  "Weekly",
  "Batch / manual",
  "TBD",
];
const STATUSES = ["Proposed", "In progress", "Live", "Blocked"];

const inputCls =
  "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";

export function CreateSourceForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState<CreateState, FormData>(
    createSourceAction,
    {},
  );

  return (
    <form action={action}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <input name="name" required placeholder="Source name (e.g. Shopify) *" className={inputCls} />
        <input
          name="entities"
          placeholder="Entities (customers, orders…)"
          className={inputCls}
        />
        <Select name="method" placeholder="Ingestion method" options={METHODS} />
        <Select name="frequency" defaultValue="TBD" options={FREQUENCIES} />
        <Select name="status" defaultValue="Proposed" options={STATUSES} />
        <input name="notes" placeholder="Notes" className={inputCls} />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-4 py-2 font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add source"}
        </button>
        {state.error && (
          <span className="text-[13px] text-red-700">{state.error}</span>
        )}
      </div>
    </form>
  );
}
