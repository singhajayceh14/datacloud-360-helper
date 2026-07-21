"use client";

import { useTransition } from "react";
import { Select } from "@/components/Select";
import { updateActivationStatusAction } from "./actions";

const STATUSES = ["Draft", "Active", "Paused", "Archived"];

export function ActivationStatus({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      size="sm"
      className="min-w-[104px]"
      value={status}
      disabled={pending}
      options={STATUSES}
      ariaLabel="Activation status"
      onChange={(v) => {
        const fd = new FormData();
        fd.set("id", id);
        fd.set("status", v);
        startTransition(() => updateActivationStatusAction(fd));
      }}
    />
  );
}
