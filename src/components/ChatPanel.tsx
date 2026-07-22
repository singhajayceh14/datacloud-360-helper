"use client";

import { useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "List the open questions for the client call",
  "Which sources feed which DMOs?",
  "Summarize the current project status",
];

export default function ChatPanel({
  projectName,
  ready,
  provider,
}: {
  projectName: string | null;
  ready: boolean;
  provider: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy || !ready) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: next,
          projectContext: projectName ? `Active project: ${projectName}` : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed.");
      setMessages((m) => [...m, { role: "assistant", content: data.text }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }),
      );
    }
  }

  return (
    <aside className="hidden w-[360px] shrink-0 flex-col border-l border-line bg-panel lg:flex">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 bg-brand px-4 py-3 text-white">
        <span className="text-[13px] font-bold uppercase tracking-wide">
          Ask about this project
        </span>
        <button
          type="button"
          onClick={() =>
            send("Brief me: give a concise stakeholder status of this project.")
          }
          disabled={!ready || busy}
          className="rounded-lg bg-white/20 px-2.5 py-1 text-[12px] font-medium transition-colors hover:bg-white/30 disabled:opacity-50"
        >
          📄 Brief me
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-auto p-3">
        {!ready && (
          <p className="text-[13px] text-muted">
            Add an AI key (<code>ANTHROPIC_API_KEY</code> or{" "}
            <code>GOOGLE_GENERATIVE_AI_API_KEY</code>) to{" "}
            <code>.env.local</code> to chat.
          </p>
        )}
        {ready && messages.length === 0 && (
          <p className="text-[13px] text-muted">
            Ask about connectors, mapping, identity resolution, segments,
            activation, or consumption for{" "}
            <span className="font-medium text-ink">
              {projectName ?? "this project"}
            </span>
            .
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[92%] whitespace-pre-wrap rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
              m.role === "user"
                ? "self-end bg-brand text-white"
                : "self-start border border-line bg-white"
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy && <div className="self-start text-[13px] text-muted">Thinking…</div>}
        {error && <div className="self-start text-[12px] text-red-700">{error}</div>}
      </div>

      {/* Suggestions */}
      {ready && messages.length === 0 && (
        <div className="flex flex-col gap-1.5 px-3 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-line bg-white px-3 py-1.5 text-left text-[12px] text-ink transition-colors hover:border-brand"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-line p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            disabled={!ready || busy}
            placeholder={
              ready ? "e.g. Which sources feed Contact Point Email?" : "Add an AI key to chat"
            }
            rows={2}
            className="min-h-[46px] flex-1 resize-none rounded-lg border border-line bg-white p-2 text-[13px] outline-none focus:border-brand disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={!ready || busy || !input.trim()}
            className="self-end rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-muted">
          Answers come from {provider === "gemini" ? "Gemini" : "Claude"},
          grounded on the Data 360 reference and{" "}
          {projectName ? `“${projectName}”` : "the active project"}.
        </p>
      </div>
    </aside>
  );
}
