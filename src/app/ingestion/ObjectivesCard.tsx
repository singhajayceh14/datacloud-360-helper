"use client";

import { useActionState, useState } from "react";
import { Card } from "@/components/ui";
import { saveObjectivesAction, type CreateState } from "./actions";

export type ObjectiveLite = { id: string; text: string };

export function ObjectivesCard({
  projectId,
  objectives,
}: {
  projectId: string;
  objectives: ObjectiveLite[];
}) {
  const [state, action, pending] = useActionState<CreateState, FormData>(
    saveObjectivesAction,
    {},
  );
  const [text, setText] = useState(objectives.map((o) => o.text).join("\n"));

  return (
    <Card>
      <h2 className="mb-1 font-semibold">Business objectives / target segments</h2>
      <p className="mb-3 text-[13px] text-muted">
        What does the client want to achieve? Target segments named here guide
        the mapping and unification design, light the Canvas coverage, and feed
        the BRD/SDD.
      </p>
      <form action={action}>
        <input type="hidden" name="projectId" value={projectId} />
        <textarea
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={"Win back lapsed buyers…\nGrow loyalty enrollment…\nOne objective per line"}
          className="w-full resize-y rounded-lg border border-line bg-white p-3 text-[13px] leading-relaxed outline-none focus:border-brand"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save objectives"}
          </button>
          {state.ok && <span className="text-[13px] text-emerald-700">Saved.</span>}
          {state.error && (
            <span className="text-[13px] text-red-700">{state.error}</span>
          )}
        </div>
      </form>
    </Card>
  );
}
