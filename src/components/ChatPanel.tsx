"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Summarize the current project status",
  "Which sources feed which DMOs?",
  "What data gaps block my segments?",
  "List the open questions for the client call",
];

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

  // Esc closes the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.2, 0.9, 0.25, 1] }}
            className="fixed bottom-[96px] right-6 z-50 flex h-[min(560px,calc(100dvh-7rem))] w-[min(384px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[20px] border border-line bg-white shadow-2xl shadow-slate-900/20"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-hover text-white">
                <SparkleIcon />
                {ready && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                )}
              </span>
              <div className="min-w-0 grow">
                <div className="text-[15px] font-bold leading-tight text-ink">Data 360</div>
                <div className="text-[12.5px] text-muted">
                  Assistant · {ready ? "online" : "offline"}
                </div>
              </div>
              <button
                type="button"
                title="New chat"
                onClick={() => {
                  setMessages([]);
                  setError("");
                }}
                className="grid h-[34px] w-[34px] place-items-center rounded-[10px] text-muted transition-colors hover:bg-slate-100 hover:text-ink"
              >
                <RefreshIcon />
              </button>
              <button
                type="button"
                title="Close"
                onClick={() => setOpen(false)}
                className="grid h-[34px] w-[34px] place-items-center rounded-[10px] text-muted transition-colors hover:bg-slate-100 hover:text-ink"
              >
                <XIcon />
              </button>
            </div>

            {/* Body */}
            <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center pt-4 text-center">
                  <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-hover text-white">
                    <SparkleIcon size={22} />
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
                      className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed ${
                        m.role === "user"
                          ? "self-end rounded-br-md bg-gradient-to-br from-brand to-brand-hover text-white"
                          : "self-start rounded-bl-md border border-line bg-slate-50"
                      }`}
                    >
                      {m.content}
                    </div>
                  ))}
                  {busy && (
                    <div className="inline-flex gap-1 self-start rounded-2xl rounded-bl-md bg-slate-50 px-4 py-3">
                      {[0, 0.2, 0.4].map((d) => (
                        <span
                          key={d}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
                          style={{ animationDelay: `${d}s` }}
                        />
                      ))}
                    </div>
                  )}
                  {error && <div className="self-start text-[12px] text-red-700">{error}</div>}
                </>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-line p-3">
              <div className="flex items-end gap-2 rounded-2xl border border-line bg-slate-50 px-3 py-1.5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15">
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
                  placeholder="Ask me anything…"
                  rows={1}
                  className="max-h-28 grow resize-none bg-transparent py-1.5 text-[14px] outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => send(input)}
                  disabled={!ready || busy || !input.trim()}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-hover text-white transition-transform hover:-translate-y-px disabled:opacity-40"
                >
                  <SendIcon />
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-muted">
                AI can make mistakes. Double-check important info.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating launcher */}
      <div className="fixed bottom-6 right-6 z-50 h-[60px] w-[60px]">
        {!open && (
          <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-brand/25" />
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close assistant" : "Open assistant"}
          className="relative grid h-[60px] w-[60px] place-items-center rounded-full bg-gradient-to-br from-brand to-brand-hover text-white shadow-[0_12px_28px_-6px_rgba(74,99,255,0.55)] transition-transform hover:-translate-y-0.5 hover:scale-105 active:scale-95"
        >
          <span
            className={`absolute grid place-items-center transition-all duration-300 ${
              open ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
            }`}
          >
            <ChatBubble />
          </span>
          <span
            className={`absolute grid place-items-center transition-all duration-300 ${
              open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"
            }`}
          >
            <XIcon size={22} />
          </span>
          {!open && (
            <span className="absolute right-0.5 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#ff5a76]" />
          )}
        </button>
      </div>
    </>
  );
}

function ChatBubble() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}

function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 103-6.7" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function SparkleIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.4L12 15l-1.9-4.6L5.5 9l4.6-1.4L12 3z" />
      <circle cx="18" cy="17" r="1.5" />
      <circle cx="6" cy="16" r="1" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}
