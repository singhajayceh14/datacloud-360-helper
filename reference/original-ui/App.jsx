import React, { useEffect, useState } from 'react';
import { api } from './lib/api.js';
import Projects from './components/Projects.jsx';
import Ingestion from './components/Ingestion.jsx';
import Assistant from './components/Assistant.jsx';
import Settings from './components/Settings.jsx';
import Stub from './components/Stub.jsx';

const TABS = [
  { id: 'projects', label: 'Projects', icon: '▦' },
  { id: 'ingestion', label: 'Ingestion', icon: '⇥' },
  { id: 'mapping', label: 'Data Mapping', icon: '⇄' },
  { id: 'unification', label: 'Unification', icon: '⚭' },
  { id: 'segments', label: 'Segments', icon: '◑' },
  { id: 'activation', label: 'Activation', icon: '⇱' },
  { id: 'entitlements', label: 'Entitlements', icon: '▤' },
  { id: 'brd', label: 'BRD / SDD', icon: '▧' },
  { id: 'assistant', label: 'Assistant', icon: '✦' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export default function App() {
  const [tab, setTab] = useState('projects');
  const [project, setProject] = useState('');
  const [projects, setProjects] = useState([]);
  const [health, setHealth] = useState(null);

  const refreshHealth = () => api.health().then(setHealth).catch(() => setHealth(null));
  const refreshProjects = () => api.projects().then(r => setProjects(r.projects)).catch(() => {});
  useEffect(() => { refreshHealth(); refreshProjects(); }, []);

  function openProject(name) { setProject(name); refreshProjects(); if (tab === 'projects') setTab('ingestion'); }

  const ai = health?.ai;
  const common = { project, aiStatus: ai };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">Data 360 <span>App</span></div>
        <select className="projsel" value={project} onChange={e => setProject(e.target.value)}>
          <option value="">— no project —</option>
          {projects.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
        {TABS.map(t => (
          <button key={t.id} className={'navbtn' + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>
            <span style={{ width: 16, textAlign: 'center' }}>{t.icon}</span>{t.label}
            {t.id === 'projects' && projects.some(p => p.openQuestions > 0) &&
              <span className="dot">{projects.reduce((n, p) => n + (p.openQuestions || 0), 0)}</span>}
          </button>
        ))}
        <div className="sidefoot">
          {health ? (
            <>index {health.index ? 'on' : 'off'} · grounding {Math.round(health.grounding.chars / 1000)}KB<br />
            AI: {ai?.provider} {ai?.activeReady ? '✓' : '— no key'}</>
          ) : 'connecting…'}
        </div>
      </aside>

      <main className="main">
        {tab === 'projects' && <Projects current={project} onOpen={openProject} />}
        {tab === 'ingestion' && <Ingestion />}
        {tab === 'mapping' && <Stub title="Data Mapping" fileHint="mapping" blurb="CSV → DLO/DMO field mapping with the correct person split and identity-field flags." {...common} />}
        {tab === 'unification' && <Stub title="Unification" fileHint="unification" blurb="Identity-resolution ruleset design, derived from mapping identity fields." {...common} />}
        {tab === 'segments' && <Stub title="Segments" fileHint="segment" blurb="Segment catalog with cadence, calculated insights, and readiness checks." {...common} />}
        {tab === 'activation' && <Stub title="Activation" fileHint="activation" blurb="Target registry and activation plan with cadence/consent warnings." {...common} />}
        {tab === 'entitlements' && <Stub title="Entitlements" fileHint="entitlement" blurb="Order-form credits/storage and the consumption calculator." {...common} />}
        {tab === 'brd' && <Stub title="BRD / SDD" fileHint="brd" blurb="Living solution-design doc; sections auto-sync from the other tabs." {...common} />}
        {tab === 'assistant' && <Assistant {...common} />}
        {tab === 'settings' && <Settings onChange={refreshHealth} />}
      </main>
    </div>
  );
}
