import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

// Placeholder for tabs still being ported from the original console. It already
// surfaces the relevant project files (read-only) so the data is visible while
// the rich UI is built. See MIGRATION.md for what each tab needs.
export default function Stub({ title, blurb, project, fileHint }) {
  const [files, setFiles] = useState([]);
  const [open, setOpen] = useState(null);
  const [content, setContent] = useState('');

  useEffect(() => {
    setOpen(null); setContent('');
    if (!project) { setFiles([]); return; }
    api.project(project).then(r => {
      const fs = (r.files || []).filter(f => f.kind === 'md' && (!fileHint || f.relpath.toLowerCase().includes(fileHint)));
      setFiles(fs);
    }).catch(() => setFiles([]));
  }, [project, fileHint]);

  function view(relpath) {
    setOpen(relpath);
    api.readFile(project, relpath).then(r => setContent(r.content)).catch(e => setContent('Error: ' + e.message));
  }

  return (
    <div>
      <h1 className="h1">{title}</h1>
      <p className="sub">{blurb}</p>
      <div className="banner info">This tab is being ported from the original console. Its project files are shown below in the meantime.</div>

      {!project && <p className="muted">Open a project to see its {title.toLowerCase()} files.</p>}
      {project && files.length === 0 && <p className="muted">No matching files in <b>{project}</b> yet.</p>}

      {files.map(f => (
        <div key={f.relpath}>
          <div className="list-item" style={{ cursor: 'pointer' }} onClick={() => view(f.relpath)}>
            <div className="grow"><span className="title">{f.relpath}</span></div>
            <span className="tag">{open === f.relpath ? 'hide' : 'view'}</span>
          </div>
          {open === f.relpath && (
            <pre style={{ background: '#0b1220', color: '#e2e8f0', padding: 16, borderRadius: 10, overflow: 'auto', fontSize: 12.5, lineHeight: 1.5 }}>{content}</pre>
          )}
        </div>
      ))}
    </div>
  );
}
