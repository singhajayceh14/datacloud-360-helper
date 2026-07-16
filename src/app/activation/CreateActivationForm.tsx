"use client";

import { useActionState } from "react";
import { createActivationAction, type CreateState } from "./actions";

const CADENCES = ["Real-time", "Hourly", "Daily", "Weekly", "Manual"];
const STATUSES = ["Draft", "Active", "Paused", "Archived"];

const inputCls =
  "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";

export function CreateActivationForm({
  projectId,
  segments,
}: {
  projectId: string;
  segments: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<CreateState, FormData>(
    createActivationAction,
    {},
  );

  return (
    <form action={action}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <select name="segmentId" required defaultValue="" className={inputCls}>
          <option value="" disabled>
            Segment to activate *
          </option>
          {segments.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          name="target"
          required
          placeholder="Destination (Marketing Cloud, Google Ads…) *"
          className={inputCls}
        />
        <input
          name="channel"
          placeholder="Channel (Email, SMS, Ads, Push…)"
          className={inputCls}
        />
        <input
          name="consentBasis"
          placeholder="Consent basis (e.g. Email opt-in DMO)"
          className={inputCls}
        />
        <select name="cadence" defaultValue="Daily" className={inputCls}>
          {CADENCES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select name="status" defaultValue="Draft" className={inputCls}>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add activation"}
        </button>
        {state.error && (
          <span className="text-[13px] text-red-700">{state.error}</span>
        )}
      </div>
    </form>
  );
}
