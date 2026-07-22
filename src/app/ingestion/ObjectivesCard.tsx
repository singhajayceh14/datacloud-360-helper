"use client";

import { useActionState } from "react";
import { Card } from "@/components/ui";
import {
  createObjectiveAction,
  deleteObjectiveAction,
  type CreateState,
} from "./actions";

export type ObjectiveLite = { id: string; text: string };

export function ObjectivesCard({
  projectId,
  objectives,
}: {
  projectId: string;
  objectives: ObjectiveLite[];
}) {
  const [state, action, pending] = useActionState<CreateState, FormData>(
    createObjectiveAction,
    {},
  );

  return (
    <Card>
      <h2 className="mb-1 font-semibold">Business objectives</h2>
      <p className="mb-3 text-[13px] text-muted">
        The client&apos;s goals — segments serve these, and the Canvas lights
        coverage from them.
      </p>

      {objectives.length > 0 && (
        <ul className="mb-3 flex flex-col gap-1.5">
          {objectives.map((o) => (
            <li
              key={o.id}
              className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-[13px]"
            >
              <span className="text-brand">◆</span>
              <span className="grow">{o.text}</span>
              <form action={deleteObjectiveAction}>
                <input type="hidden" name="id" value={o.id} />
                <button
                  type="submit"
                  className="rounded-md border border-line px-2 py-0.5 text-[12px] text-muted transition-colors hover:border-red-300 hover:text-red-700"
                >
                  ✕
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="flex items-center gap-2">
        <input type="hidden" name="projectId" value={projectId} />
        <input
          name="text"
          required
          placeholder="Add a business objective…"
          className="grow rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </form>
      {state.error && (
        <p className="mt-2 text-[13px] text-red-700">{state.error}</p>
      )}
    </Card>
  );
}
