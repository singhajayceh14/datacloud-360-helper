"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Summarize the current project status",
  "Which sources feed which DMOs?",
  "What data gaps block my segments?",
  "List the open questions for the client call",
];

function Diamond({ className = "h-3 w-3" }: { className?: string }) {
  return <span className={`block rotate-45 rounded-[3px] bg-white ${className}`} />;
}

export default function ChatPanel({
  projectName,
  ready,
}: {
  projectName: string | null;
  ready: boolean;
  provider: string;
}) {
  const [open, setOpen] = useState(false);
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
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="widget"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-[92px] right-5 z-50 flex h-[min(560px,calc(100dvh-7rem))] w-[min(384px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl shadow-slate-900/15"
          >
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand">
                <Diamond className="h-3.5 w-3.5" />
              </span>
              <div className="grow">
                <div className="text-[14px] font-bold text-ink">Data 360</div>
                <div className="flex items-center gap-1.5 text-[12px]">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${ready ? "bg-emerald-500" : "bg-slate-300"}`}
                  />
                  <span className={ready ? "text-emerald-600" : "text-muted"}>
                    {ready ? "Assistant online" : "Assistant offline"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                title="New chat"
                onClick={() => {
                  setMessages([]);
                  setError("");
                }}
                className="grid h-8 w-8 place-items-center rounded-lg text-[18px] text-muted transition-colors hover:bg-slate-100"
              >
                +
              </button>
              <button
                type="button"
                title="Minimize"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-[18px] text-muted transition-colors hover:bg-slate-100"
              >
                −
              </button>
            </div>

            {/* Body */}
            <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-auto p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center pt-4 text-center">
                  <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand">
                    <Diamond className="h-4 w-4" />
                  </span>
                  <h3 className="text-[17px] font-bold text-ink">
                    How can I help with your data?
                  </h3>
                  <p className="mt-1 text-[13px] text-muted">
                    Ask about segments, pipeline, or your{" "}
                    <span className="text-brand">unified profiles</span>
                    {projectName ? ` in ${projectName}` : ""}.
                  </p>
                  <div className="mt-4 flex w-full flex-col gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={!ready}
                        onClick={() => send(s)}
                        className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-left text-[13px] text-ink transition-colors hover:border-brand hover:bg-slate-50 disabled:opacity-50"
                      >
                        <span className="text-brand">→</span>
                        <span className="grow">{s}</span>
                      </button>
                    ))}
                  </div>
                  {!ready && (
                    <p className="mt-3 text-[12px] text-muted">
                      Add an AI key to <code>.env.local</code> to chat.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                        m.role === "user"
                          ? "self-end bg-brand text-white"
                          : "self-start border border-line bg-slate-50"
                      }`}
                    >
                      {m.content}
                    </div>
                  ))}
                  {busy && <div className="self-start text-[13px] text-muted">Thinking…</div>}
                  {error && <div className="self-start text-[12px] text-red-700">{error}</div>}
                </>
              )}
            </div>

            {/* Input */}
            <div className="px-3 pb-2 pt-1">
              <div className="flex items-end gap-2 rounded-2xl border border-line bg-slate-50 px-3 py-2">
                <span className="pb-1 text-muted" title="Voice input (coming soon)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3z" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M19 11a7 7 0 01-14 0M12 18v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </span>
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
                  placeholder="Ask about your data…"
                  rows={1}
                  className="max-h-24 grow resize-none bg-transparent py-1 text-[13px] outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => send(input)}
                  disabled={!ready || busy || !input.trim()}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-white transition-colors hover:bg-brand-hover disabled:opacity-40"
                >
                  ↑
                </button>
              </div>
              <p className="mt-1.5 text-center text-[11px] text-muted">
                Responses may be inaccurate. Verify important data.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating toggle */}
      <div className="fixed bottom-5 right-5 z-50 h-14 w-14">
        {!open && (
          <>
            <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-brand/30" />
            <span className="pointer-events-none absolute -inset-2 rounded-full bg-brand/10" />
          </>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          title={open ? "Minimize assistant" : "Ask about this project"}
          className="relative grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-lg shadow-brand/40 transition-transform hover:scale-105"
        >
          {open ? (
            <span className="text-[24px] leading-none">−</span>
          ) : (
            <ChatBubble />
          )}
          {!open && (
            <span className="absolute right-1 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-rose-500" />
          )}
        </button>
      </div>
    </>
  );
}

function ChatBubble() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
