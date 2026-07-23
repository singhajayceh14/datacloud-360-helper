"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/ui";
import { RichText } from "@/components/RichText";
import type { DesignRule } from "@/lib/unification/design";
import type { MatchRule } from "@/db/schema";
import { saveUnificationAction } from "./actions";

export function UnificationDesigner({
  projectId,
  rules,
  savedEnabled,
  initialNotes,
  ready,
}: {
  projectId: string;
  rules: DesignRule[];
  savedEnabled: Record<string, boolean>;
  initialNotes: string;
  ready: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(
      rules.map((r) => [
        r.n,
        r.name in savedEnabled ? savedEnabled[r.name] : !r.optional,
      ]),
    ),
  );
  const [notes, setNotes] = useState(initialNotes);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [aiOut, setAiOut] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError("");
    const matchRules: MatchRule[] = rules.map((r) => ({
      name: r.name,
      keys: r.keys,
      type: r.optional ? "fuzzy" : "exact",
      enabled: !!enabled[r.n],
    }));
    const res = await saveUnificationAction({ projectId, matchRules, notes });
    setBusy(false);
    if (res.error) return setError(res.error);
    setSaved(true);
    router.refresh();
  }

  async function refine() {
    if (aiBusy) return;
    setAiBusy(true);
    setAiOut("Thinking…");
    const active = rules.filter((r) => enabled[r.n]);
    const prompt =
      "You are a Salesforce Data 360 identity-resolution architect. Review this proposed match-rule ladder and advise on over-match risk, ordering, and whether the fuzzy rule should ship at go-live:\n\n" +
      active.map((r) => `${r.n}. ${r.name} — ${r.criteria} (sources: ${r.sources.join(", ")})`).join("\n") +
      "\n\nKeep it concise and specific to these rules.";
    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], projectContext: `Project ${projectId}` }),
      });
      const data = await res.json();
      setAiOut(res.ok ? data.text : `Error: ${data.error || "no response"}`);
    } catch (e) {
      setAiOut(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Match-rule ladder</h2>
        <p className="text-[12px] text-muted">
          Profiles matching <span className="font-semibold">any</span> rule merge
          (criteria within a rule = AND, rules = OR).
        </p>
      </div>

      {rules.length === 0 ? (
        <p className="text-[13px] text-muted">
          No identity fields mapped yet — flag identity columns on the Data
          Mapping tab (email, phone, external IDs) and the ladder derives itself.
        </p>
      ) : (
        <ol className="mb-4 flex flex-col gap-2">
          {rules.map((r) => {
            const on = !!enabled[r.n];
            return (
              <li
                key={r.n}
                className={`rounded-xl border px-4 py-3 transition-colors ${
                  on ? "border-line bg-white" : "border-line bg-slate-50 opacity-70"
                }`}
              >
                <div className="flex items-start gap-3">
                  <label className="mt-0.5 flex shrink-0 items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => {
                        setEnabled((e) => ({ ...e, [r.n]: !e[r.n] }));
                        setSaved(false);
                      }}
                    />
                    <span className="text-[12px] font-semibold text-muted">#{r.n}</span>
                  </label>
                  <div className="grow">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{r.name}</span>
                      <Pill tone={r.optional ? "beta" : "ga"}>
                        {r.optional ? "optional" : "recommended"}
                      </Pill>
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted">
                      <span className="font-medium">Criteria:</span> {r.criteria}
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted">
                      <span className="font-medium">Sources:</span> {r.sources.join(", ")}
                    </div>
                    <div className="mt-1 text-[12px] leading-snug text-slate-500">{r.why}</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <label className="mb-1 block text-[13px] font-semibold">
        Reconciliation &amp; scenario decisions
      </label>
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        rows={3}
        placeholder="e.g. Last-updated-wins for contact fields; exclude info@/sales@ from email matching; confirm master source with client…"
        className="w-full rounded-lg border border-line bg-white p-3 text-[13px] outline-none focus:border-brand"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save unification design"}
        </button>
        <button
          onClick={refine}
          disabled={!ready || aiBusy || rules.length === 0}
          className="rounded-lg border border-line bg-white px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:border-brand disabled:opacity-50"
        >
          {aiBusy ? "Asking…" : "✨ Refine with AI"}
        </button>
        {saved && <span className="text-[13px] text-emerald-700">Saved ✓</span>}
        {error && <span className="text-[13px] text-red-700">{error}</span>}
      </div>

      {aiOut !== null && (
        <div className="mt-3 rounded-xl border border-line bg-slate-50 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted">AI review</span>
            <button type="button" onClick={() => setAiOut(null)} className="text-[12px] text-muted hover:text-ink">
              Dismiss
            </button>
          </div>
          <RichText size="sm">{aiOut}</RichText>
        </div>
      )}
    </div>
  );
}
