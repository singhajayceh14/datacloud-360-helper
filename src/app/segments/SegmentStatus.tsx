"use client";

import { useTransition } from "react";
import { updateSegmentStatusAction } from "./actions";

const STATUSES = ["Draft", "Active", "Paused", "Archived"];

export function SegmentStatus({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const fd = new FormData();
        fd.set("id", id);
        fd.set("status", e.target.value);
        startTransition(() => updateSegmentStatusAction(fd));
      }}
      className="rounded-lg border border-line bg-white px-2 py-1 text-[12px] outline-none focus:border-brand disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s}>{s}</option>
      ))}
    </select>
  );
}
