"use client";

import { useActionState } from "react";
import { Select } from "@/components/Select";
import { createSourceAction, type CreateState } from "./actions";

const METHODS = [
  { value: "Research", label: "Method: research (recommended)" },
  { value: "Native connector", label: "Method: Native connector" },
  { value: "Ingestion API", label: "Method: Ingestion API" },
  { value: "S3 / Cloud storage", label: "Method: S3 / Cloud storage" },
  { value: "SFTP", label: "Method: SFTP" },
  { value: "MuleSoft", label: "Method: MuleSoft" },
  { value: "Web / Mobile SDK", label: "Method: Web / Mobile SDK" },
  { value: "Zero Copy federation", label: "Method: Zero Copy federation" },
  { value: "Manual CSV", label: "Method: Manual CSV" },
];
const FREQUENCIES = [
  { value: "TBD", label: "Frequency: TBD" },
  { value: "Streaming / Real-time", label: "Frequency: Streaming / Real-time" },
  { value: "Hourly", label: "Frequency: Hourly" },
  { value: "Daily", label: "Frequency: Daily" },
  { value: "Weekly", label: "Frequency: Weekly" },
  { value: "Batch / manual", label: "Frequency: Batch / manual" },
];

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
        <input name="name" required placeholder="System name" className={inputCls} />
        <input name="entities" placeholder="entities" className={inputCls} />
        <Select name="method" defaultValue="Research" options={METHODS} />
        <Select name="frequency" defaultValue="TBD" options={FREQUENCIES} />
        <input
          name="notes"
          placeholder="client-side owner (optional)"
          className={`${inputCls} sm:col-span-2`}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2.5 w-full rounded-lg border border-line bg-white px-4 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:border-brand disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add manually to source inventory"}
      </button>
      {state.error && (
        <p className="mt-2 text-[13px] text-red-700">{state.error}</p>
      )}
    </form>
  );
}
