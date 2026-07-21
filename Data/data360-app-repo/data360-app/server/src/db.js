// A lightweight index over the markdown projects. Markdown files remain the
// source of truth; this SQLite index just makes listing/search fast and gives
// us somewhere to store feedback and chat history.
//
// Uses Node's built-in node:sqlite (Node >= 22.5). If unavailable, everything
// degrades gracefully to a no-op index and the app scans markdown directly.
import path from 'node:path';
import { DATA_DIR } from './config.js';

let db = null;
let available = false;

try {
  const { DatabaseSync } = await import('node:sqlite');
  db = new DatabaseSync(path.join(DATA_DIR, 'index.sqlite'));
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      name TEXT PRIMARY KEY,
      client TEXT, phase TEXT, updated TEXT, openQuestions INTEGER DEFAULT 0,
      indexedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS files (
      project TEXT, relpath TEXT, kind TEXT, title TEXT, mtime TEXT,
      PRIMARY KEY (project, relpath)
    );
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project TEXT, author TEXT, tab TEXT, body TEXT, createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS chat (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project TEXT, role TEXT, content TEXT, provider TEXT, createdAt TEXT
    );
  `);
  available = true;
} catch (e) {
  console.warn('[db] node:sqlite unavailable (' + e.message + ') — running index-free (markdown scan only).');
}

export const dbAvailable = () => available;

export function upsertProject(p) {
  if (!available) return;
  db.prepare(`INSERT INTO projects (name,client,phase,updated,openQuestions,indexedAt)
    VALUES (?,?,?,?,?,?)
    ON CONFLICT(name) DO UPDATE SET client=excluded.client, phase=excluded.phase,
      updated=excluded.updated, openQuestions=excluded.openQuestions, indexedAt=excluded.indexedAt`)
    .run(p.name, p.client || '', p.phase || '', p.updated || '', p.openQuestions || 0, new Date().toISOString());
}

export function replaceFiles(project, files) {
  if (!available) return;
  db.prepare('DELETE FROM files WHERE project=?').run(project);
  const ins = db.prepare('INSERT OR REPLACE INTO files (project,relpath,kind,title,mtime) VALUES (?,?,?,?,?)');
  for (const f of files) ins.run(project, f.relpath, f.kind || '', f.title || '', f.mtime || '');
}

export function cachedProjects() {
  if (!available) return null;
  return db.prepare('SELECT * FROM projects ORDER BY updated DESC').all();
}

export function addFeedback(fb) {
  if (!available) return { ok: false, reason: 'no-index' };
  db.prepare('INSERT INTO feedback (project,author,tab,body,createdAt) VALUES (?,?,?,?,?)')
    .run(fb.project || '', fb.author || '', fb.tab || '', fb.body || '', new Date().toISOString());
  return { ok: true };
}

export function listFeedback(project) {
  if (!available) return [];
  return db.prepare('SELECT * FROM feedback WHERE project=? ORDER BY id DESC').all(project);
}

export function addChat(project, role, content, provider) {
  if (!available) return;
  db.prepare('INSERT INTO chat (project,role,content,provider,createdAt) VALUES (?,?,?,?,?)')
    .run(project || '', role, content, provider || '', new Date().toISOString());
}

export function chatHistory(project, limit = 40) {
  if (!available) return [];
  return db.prepare('SELECT role,content,provider,createdAt FROM chat WHERE project=? ORDER BY id DESC LIMIT ?')
    .all(project || '', limit).reverse();
}
