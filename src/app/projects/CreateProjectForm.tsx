"use client";

import { useActionState } from "react";
import { createProjectAction, type CreateState } from "./actions";

const initial: CreateState = {};

export function CreateProjectForm({ disabled }: { disabled?: boolean }) {
  const [state, action, pending] = useActionState(
    createProjectAction,
    initial,
  );

  return (
    <form action={action}>
      <div className="flex flex-wrap items-center gap-2.5">
        <input
          name="name"
          required
          disabled={disabled || pending}
          className="grow rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand disabled:opacity-50"
          placeholder="New project name (e.g. Acme Retail)"
        />
        <input
          name="client"
          disabled={disabled || pending}
          className="grow rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand disabled:opacity-50"
          placeholder="Client / description (optional)"
        />
        <button
          type="submit"
          disabled={disabled || pending}
          className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create"}
        </button>
      </div>
      {state.error && (
        <p className="mt-2 text-[13px] text-red-700">{state.error}</p>
      )}
    </form>
  );
}
