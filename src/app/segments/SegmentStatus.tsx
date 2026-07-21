"use client";

import { useTransition } from "react";
import { Select } from "@/components/Select";
import { updateSegmentStatusAction } from "./actions";

const STATUSES = ["Draft", "Active", "Paused", "Archived"];

export function SegmentStatus({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      size="sm"
      className="min-w-[104px]"
      value={status}
      disabled={pending}
      options={STATUSES}
      ariaLabel="Segment status"
      onChange={(v) => {
        const fd = new FormData();
        fd.set("id", id);
        fd.set("status", v);
        startTransition(() => updateSegmentStatusAction(fd));
      }}
    />
  );
}
