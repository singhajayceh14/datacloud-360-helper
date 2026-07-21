import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function Settings({ onChange }) {
  const [s, setS] = useState(null);
  const [provider, setProvider] = useState('anthropic');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [models, setModels] = useState({ anthropic: '', gemini: '' });
  const [projectsDir, setProjectsDir] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    api.settings().then(r => {
      setS(r); setProvider(r.aiProvider); setModels(r.models); setProjectsDir(r.projectsDir);
    });
  }, []);

  async function save() {
    const patch = { aiProvider: provider, models, projectsDir, keys: {} };
    if (anthropicKey) patch.keys.anthropic = anthropicKey;
    if (geminiKey) patch.keys.gemini = geminiKey;
    const r = await api.saveSettings(patch);
    setS(r); setAnthropicKey(''); setGeminiKey('');
    setSaved('Saved.'); setTimeout(() => setSaved(''), 2500);
    onChange && onChange();
  }

  if (!s) return <p className="muted">Loading…</p>;

  return (
    <div>
      <h1 className="h1">Settings</h1>
      <p className="sub">Your API keys stay on this machine (server settings file) and are only ever used server-side.</p>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>AI provider</h3>
        <div className="row" style={{ marginBottom: 14 }}>
          <label className="row"><input type="radio" checked={provider === 'anthropic'} onChange={() => setProvider('anthropic')} /> Anthropic (Claude)</label>
          <label className="row"><input type="radio" checked={provider === 'gemini'} onChange={() => setProvider('gemini')} /> Google (Gemini)</label>
        </div>
        <div className="kv">
          <div>Anthropic API key {s.keysSet.anthropic && <span className="pill ga">set {s.keysMasked.anthropic}</span>}</div>
          <input className="txt" type="password" placeholder={s.keysSet.anthropic ? 'leave blank to keep' : 'sk-ant-…'} value={anthropicKey} onChange={e => setAnthropicKey(e.target.value)} />
          <div>Claude model</div>
          <input className="txt" value={models.anthropic} onChange={e => setModels({ ...models, anthropic: e.target.value })} />
          <div>Gemini API key {s.keysSet.gemini && <span className="pill ga">set {s.keysMasked.gemini}</span>}</div>
          <input className="txt" type="password" placeholder={s.keysSet.gemini ? 'leave blank to keep' : 'AIza…'} value={geminiKey} onChange={e => setGeminiKey(e.target.value)} />
          <div>Gemini model</div>
          <input className="txt" value={models.gemini} onChange={e => setModels({ ...models, gemini: e.target.value })} />
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Projects folder</h3>
        <p className="muted" style={{ marginTop: 0 }}>Where project folders are read from and written to.</p>
        <input className="txt" value={projectsDir} onChange={e => setProjectsDir(e.target.value)} />
      </div>

      <div className="row">
        <button className="btn" onClick={save}>Save settings</button>
        {saved && <span className="pill ga">{saved}</span>}
      </div>
    </div>
  );
}
