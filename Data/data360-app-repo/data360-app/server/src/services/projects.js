// Project store: folders of markdown, exactly like the original console.
// SQLite (db.js) is only an index/cache; every read/write hits the filesystem.
import fs from 'node:fs';
import path from 'node:path';
import { loadSettings } from '../config.js';
import { parseBulletMeta, parseFirstTable } from './markdown.js';
import * as idx from '../db.js';

const IGNORE = new Set(['_console', '_artifacts', '_project-template', '_archive-pre-console', '.claude', 'data360-app', 'node_modules', '.git']);

function projectsDir() { return loadSettings().projectsDir; }

// Guard: resolve a project-relative path and refuse anything outside its folder.
export function safeProjectPath(project, rel = '') {
  const root = path.resolve(projectsDir(), project);
  const base = path.resolve(projectsDir());
  if (root !== path.resolve(base, project)) throw new Error('bad project name');
  const p = path.resolve(root, rel);
  if (p !== root && !p.startsWith(root + path.sep)) throw new Error('path outside project');
  return p;
}

function isProjectDir(name) {
  if (IGNORE.has(name) || name.startsWith('.') || name.startsWith('_')) return false;
  const dir = path.join(projectsDir(), name);
  try {
    if (!fs.statSync(dir).isDirectory()) return false;
    return fs.existsSync(path.join(dir, 'project-state.md'));
  } catch { return false; }
}

export function listProjects() {
  const dir = projectsDir();
  let names = [];
  try { names = fs.readdirSync(dir).filter(isProjectDir); } catch { names = []; }
  const projects = names.map(name => {
    const meta = readState(name);
    idx.upsertProject({ name, ...meta });
    const { raw, ...light } = meta;   // list stays light; raw only on single-project read
    return { name, ...light };
  });
  projects.sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
  return projects;
}

// Parse project-state.md into structured metadata.
export function readState(name) {
  let md = '';
  try { md = fs.readFileSync(path.join(projectsDir(), name, 'project-state.md'), 'utf8'); } catch { return {}; }
  const meta = parseBulletMeta(md);
  const openQ = countOpenQuestions(md);
  return {
    client: meta['client'] || '',
    edition: meta['data 360 org / edition'] || meta['edition'] || '',
    phase: meta['current phase'] || '',
    updated: (meta['last updated'] || '').split(' —')[0].trim(),
    openQuestions: openQ,
    raw: md,
  };
}

function countOpenQuestions(md) {
  const s = md.indexOf('## Open questions');
  if (s < 0) return 0;
  let e = md.indexOf('\n## ', s + 4); if (e < 0) e = md.length;
  const seg = md.slice(s, e);
  return (seg.match(/^\|\s*\d+\s*\|/gm) || []).length;
}

export function listFiles(project) {
  const root = safeProjectPath(project);
  const out = [];
  (function walk(dir) {
    let ents = [];
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else {
        const rel = path.relative(root, full);
        const st = fs.statSync(full);
        out.push({ relpath: rel, kind: path.extname(e.name).slice(1), title: e.name, mtime: st.mtime.toISOString() });
      }
    }
  })(root);
  idx.replaceFiles(project, out);
  return out;
}

export function readFile(project, rel) {
  return fs.readFileSync(safeProjectPath(project, rel), 'utf8');
}

export function writeFile(project, rel, content) {
  const p = safeProjectPath(project, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
  return { ok: true };
}

export function writeBinary(project, rel, buffer) {
  const p = safeProjectPath(project, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, buffer);
  return { ok: true };
}

const STATE_TEMPLATE = (name, client) => `# Project State — ${name}

> Single source of truth. Read me first, update me after every working session.

- **Client**: ${client || name}
- **Engagement start**: ${new Date().toISOString().slice(0, 10)}
- **Data 360 org / edition**: TBD
- **Current phase**: 1 — Source discovery & ingestion
- **Last updated**: ${new Date().toISOString().slice(0, 10)} — created by app

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| 1. Source discovery & ingestion | Not started | |
| 2. Data mapping | Not started | |
| 3. BRD / SDD | Not started | |
| 4. Unification | Not started | |
| 5. Segmentation | Not started | |
| 6. Activation | Not started | |

## Source inventory

| Source | Entities | Method | Frequency | Status | Notes |
|--------|----------|--------|-----------|--------|-------|

## Decisions log

| Date | Decision | Rationale | Who |
|------|----------|-----------|-----|

## Open questions for client

| # | Question | Raised | Owner | Status |
|---|----------|--------|-------|--------|
`;

export function createProject(name, client) {
  const clean = String(name || '').trim();
  if (!clean || /[\\/:*?"<>|]/.test(clean)) throw new Error('invalid project name');
  const root = path.resolve(projectsDir(), clean);
  if (fs.existsSync(root)) throw new Error('project already exists');
  ['01-sources', '02-mappings', '03-deliverables', '04-entitlements', '05-deploy']
    .forEach(d => fs.mkdirSync(path.join(root, d), { recursive: true }));
  fs.writeFileSync(path.join(root, 'project-state.md'), STATE_TEMPLATE(clean, client), 'utf8');
  const meta = readState(clean);
  idx.upsertProject({ name: clean, ...meta });
  return { name: clean, ...meta };
}

// Aggregate a project's substance into a compact context string for the AI.
export function projectContext(project, maxCharsPerFile = 6000) {
  const files = listFiles(project).filter(f => f.kind === 'md');
  const order = ['project-state.md', '02-mappings', '03-deliverables', '04-entitlements'];
  files.sort((a, b) => order.findIndex(o => a.relpath.startsWith(o)) - order.findIndex(o => b.relpath.startsWith(o)));
  let out = '';
  for (const f of files) {
    try {
      const body = readFile(project, f.relpath).slice(0, maxCharsPerFile);
      out += `\n===== ${f.relpath} =====\n${body}\n`;
    } catch { /* skip */ }
  }
  return out.trim();
}

export { parseFirstTable };
