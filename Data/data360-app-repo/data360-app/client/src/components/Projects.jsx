import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function Projects({ current, onOpen }) {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.projects().then(r => setProjects(r.projects)).catch(e => setErr(e.message));
  useEffect(() => { load(); }, []);

  async function create() {
    if (!name.trim()) return;
    setBusy(true); setErr('');
    try {
      const p = await api.createProject(name.trim(), client.trim());
      setName(''); setClient('');
      await load();
      onOpen(p.name);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div>
      <h1 className="h1">Projects</h1>
      <p className="sub">Each project is a folder of markdown — portable, and readable by any Claude session or the datacloud-360 skill.</p>

      <div className="card">
        <div className="row">
          <input className="txt grow" placeholder="New project name (e.g. Acme Retail)" value={name}
                 onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} />
          <input className="txt grow" placeholder="Client / description (optional)" value={client}
                 onChange={e => setClient(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} />
          <button className="btn" onClick={create} disabled={busy || !name.trim()}>Create</button>
        </div>
        {err && <p style={{ color: '#b91c1c', marginBottom: 0 }}>{err}</p>}
      </div>

      {projects.length === 0 && <p className="muted">No projects yet — create one above.</p>}
      {projects.map(p => (
        <div key={p.name} className="list-item" style={{ cursor: 'pointer' }} onClick={() => onOpen(p.name)}>
          <div className="grow">
            <div className="title">{p.name} {p.name === current && <span className="pill ga">open</span>}</div>
            <div className="tag">{p.client || '—'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="tag">Phase {p.phase || '—'}</div>
            <div className="tag">{p.edition || ''}</div>
          </div>
          {p.openQuestions > 0 && <span className="pill beta">{p.openQuestions} open Q</span>}
          <div className="tag">{p.updated}</div>
        </div>
      ))}
    </div>
  );
}
