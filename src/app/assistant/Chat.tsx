"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Msg = { role: "user" | "assistant"; content: string };

export function Chat({ ready }: { ready: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed.");
      setMessages((m) => [...m, { role: "assistant", content: data.text }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      });
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-1"
      >
        {messages.length === 0 && (
          <p className="text-muted">
            Ask about Data Cloud 360 — connectors, mapping, identity resolution,
            segments, activation, or consumption.
          </p>
        )}
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`max-w-[80%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 leading-relaxed ${
              m.role === "user"
                ? "self-end bg-brand text-white"
                : "self-start border border-line bg-panel"
            }`}
          >
            {m.content}
          </motion.div>
        ))}
        {busy && <div className="self-start text-muted">Thinking…</div>}
        {error && <div className="self-start text-[13px] text-red-700">{error}</div>}
      </div>

      <div className="mt-3 flex gap-2.5">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          disabled={!ready || busy}
          placeholder={
            ready ? "Ask a question…" : "Add an AI key to .env.local to chat"
          }
          className="min-h-[52px] flex-1 resize-none rounded-xl border border-line bg-white p-3 outline-none focus:border-brand disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={!ready || busy || !input.trim()}
          className="self-end rounded-lg bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
