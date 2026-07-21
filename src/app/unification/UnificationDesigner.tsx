"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MatchRule } from "@/db/schema";
import { Pill } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { saveUnificationAction } from "./actions";

export function UnificationDesigner({
  projectId,
  initialRules,
  initialNotes,
  suggested,
}: {
  projectId: string;
  initialRules: MatchRule[];
  initialNotes: string;
  suggested: MatchRule[];
}) {
  const router = useRouter();
  const [rules, setRules] = useState<MatchRule[]>(initialRules);
  const [notes, setNotes] = useState(initialNotes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function toggle(i: number) {
    setRules((r) =>
      r.map((rule, idx) =>
        idx === i ? { ...rule, enabled: !rule.enabled } : rule,
      ),
    );
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    setError("");
    const res = await saveUnificationAction({ projectId, matchRules: rules, notes });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">Match-rule ladder</h2>
        <button
          type="button"
          onClick={() => {
            setRules(suggested);
            setSaved(false);
          }}
          className="text-[12px] text-brand hover:underline"
        >
          Reset to suggested
        </button>
      </div>

      <Stagger className="mb-4 flex flex-col gap-2">
        {rules.map((rule, i) => (
          <StaggerItem
            key={i}
            className={`flex items-center gap-3 rounded-[10px] border px-4 py-3 transition-colors ${
              rule.enabled ? "border-line bg-white" : "border-line bg-slate-50 opacity-60"
            }`}
          >
            <span className="text-[12px] font-semibold text-muted">#{i + 1}</span>
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={() => toggle(i)}
            />
            <div className="grow">
              <div className="font-semibold">{rule.name}</div>
              <div className="text-[12px] text-muted">
                on {rule.keys.join(" + ")}
              </div>
            </div>
            <Pill tone={rule.type === "exact" ? "ga" : "beta"}>{rule.type}</Pill>
          </StaggerItem>
        ))}
      </Stagger>

      <label className="mb-1 block text-[13px] font-semibold">
        Reconciliation &amp; scenario decisions
      </label>
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        rows={4}
        placeholder="e.g. Last-updated-wins for contact fields; exclude info@/sales@ from email matching; guest orders keyed by order email only…"
        className="w-full rounded-lg border border-line bg-white p-3 text-[13px] outline-none focus:border-brand"
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save unification design"}
        </button>
        {saved && <span className="text-[13px] text-ok">Saved ✓</span>}
        {error && <span className="text-[13px] text-red-700">{error}</span>}
      </div>
    </div>
  );
}
