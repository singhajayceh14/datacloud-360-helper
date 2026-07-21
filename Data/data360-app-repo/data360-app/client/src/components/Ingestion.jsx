import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const relClass = (r) => (r === 'GA' ? 'ga' : /BETA/i.test(r || '') ? 'beta' : 'other');

export default function Ingestion() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(null);

  useEffect(() => { api.connectors('').then(r => setCount(r.connectors.length >= 30 ? '325+' : r.connectors.length)); }, []);
  useEffect(() => {
    const t = setTimeout(() => { api.connectors(q).then(r => setResults(r.connectors)).catch(() => setResults([])); }, 150);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <h1 className="h1">Ingestion</h1>
      <p className="sub">Search the Salesforce connector directory before committing a source. Availability shown as GA / Beta / other.</p>

      <div className="card">
        <input className="txt" placeholder="Search connectors — e.g. Shopify, Snowflake, Azure, Zendesk…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
        <p className="tag" style={{ marginBottom: 0, marginTop: 8 }}>Catalog verified 2026-07-10.</p>
      </div>

      {results.map((c, i) => (
        <div key={i} className="list-item">
          <div className="grow">
            <div className="title">{c.label || c.name} <span className={'pill ' + relClass(c.release)}>{c.release || '?'}</span></div>
            <div className="tag">{c.desc || c.description || ''}</div>
            {(c.features || []).length > 0 && <div className="tag" style={{ marginTop: 3 }}>{c.features.join(' · ')}</div>}
          </div>
        </div>
      ))}
      {q && results.length === 0 && (
        <div className="banner info">No native connector matches “{q}”. Options: Ingestion API, cloud-storage drop (S3/GCS/Azure), Zero Copy, or MuleSoft. Verify live before committing.</div>
      )}
    </div>
  );
}
