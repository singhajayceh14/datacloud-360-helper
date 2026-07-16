import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';

// Grounded chat. Every message is answered from the bundled grounding + the
// current project's context, via whichever provider is active in Settings.
export default function Assistant({ project, aiStatus }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    if (!project) { setMessages([]); return; }
    api.history(project).then(r => setMessages(r.history.map(h => ({ role: h.role, content: h.content })))).catch(() => {});
  }, [project]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next); setInput(''); setBusy(true); setErr('');
    try {
      const out = await api.ask(next.map(m => ({ role: m.role, content: m.content })), project);
      setMessages([...next, { role: 'assistant', content: out.text }]);
    } catch (e) {
      setErr(e.message);
      setMessages(next);
    }
    setBusy(false);
  }

  const ready = aiStatus?.activeReady;

  return (
    <div>
      <h1 className="h1">Assistant <span className="tag" style={{ fontWeight: 400 }}>· {aiStatus?.provider} {aiStatus?.models?.[aiStatus.provider]}</span></h1>
      <p className="sub">{project ? <>Answering with <b>{project}</b> in context.</> : 'No project open — answers use the grounding only.'}</p>

      {!ready && <div className="banner warn">No API key set for <b>{aiStatus?.provider}</b>. Add one in Settings to enable the assistant.</div>}
      {err && <div className="banner warn">{err}</div>}

      <div className="chat">
        <div className="msgs">
          {messages.length === 0 && <p className="muted">Ask anything about Data 360 — connectors, DMO/DLO modelling, identity resolution, segmentation, activation, or credits. Answers are anchored to the bundled grounding.</p>}
          {messages.map((m, i) => <div key={i} className={'msg ' + m.role}>{m.content}</div>)}
          {busy && <div className="msg assistant muted">Thinking…</div>}
          <div ref={endRef} />
        </div>
        <div className="composer">
          <textarea placeholder="Ask the grounded assistant…" value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button className="btn" onClick={send} disabled={busy || !ready}>Send</button>
        </div>
      </div>
    </div>
  );
}
