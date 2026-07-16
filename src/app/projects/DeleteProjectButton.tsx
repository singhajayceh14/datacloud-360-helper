"use client";

import { useTransition } from "react";
import { deleteProjectAction } from "./actions";

export function DeleteProjectButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(() => deleteProjectAction(fd));
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      aria-label={`Delete ${name}`}
      className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] text-muted hover:border-red-300 hover:text-red-700 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
