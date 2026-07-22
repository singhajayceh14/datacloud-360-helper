"use client";

import { useFormStatus } from "react-dom";
import { duplicateProjectAction } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      title="Fork this project into a scenario copy to compare alternatives"
      className="rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-brand disabled:opacity-50"
    >
      {pending ? "Duplicating…" : "+ Duplicate as scenario"}
    </button>
  );
}

export function DuplicateButton({ projectId }: { projectId: string }) {
  return (
    <form action={duplicateProjectAction}>
      <input type="hidden" name="id" value={projectId} />
      <Submit />
    </form>
  );
}
