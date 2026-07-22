"use client";

import { useTransition } from "react";
import { Select } from "@/components/Select";
import { updateSourceStatusAction } from "./actions";

const STATUSES = ["Proposed", "In progress", "Live", "Blocked"];

export function SourceStatus({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      size="sm"
      className="min-w-[112px]"
      value={status}
      disabled={pending}
      options={STATUSES}
      ariaLabel="Source status"
      onChange={(v) => {
        const fd = new FormData();
        fd.set("id", id);
        fd.set("status", v);
        startTransition(() => updateSourceStatusAction(fd));
      }}
    />
  );
}
