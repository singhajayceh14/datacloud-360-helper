// Data 360 App — Node backend (zero npm dependencies).
// Serves the built React client and a small JSON API. Run: npm start
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { PORT, CLIENT_DIST, publicSettings, saveSettings, loadSettings } from './config.js';
import * as projects from './services/projects.js';
import * as grounding from './services/grounding.js';
import * as connectors from './services/connectors.js';
import * as ai from './services/ai.js';
import * as db from './db.js';

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', d => chunks.push(d));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
async function json(req) { const b = await readBody(req); return b.length ? JSON.parse(b.toString('utf8')) : {}; }

// ---- API routes: [method, /path, handler] ; :param supported ----
const routes = [
  ['GET', '/api/health', () => ({ ok: true, index: db.dbAvailable(), grounding: grounding.groundingMeta(), ai: ai.aiStatus() })],
  ['GET', '/api/settings', () => publicSettings()],
  ['POST', '/api/settings', async (req) => { saveSettings(await json(req)); return publicSettings(); }],

  ['GET', '/api/projects', () => ({ projects: projects.listProjects() })],
  ['POST', '/api/projects', async (req) => { const { name, client } = await json(req); return projects.createProject(name, client); }],
  ['GET', '/api/projects/:name', (req, p) => ({ ...projects.readState(p.name), files: projects.listFiles(p.name) })],
  ['GET', '/api/projects/:name/files', (req, p) => ({ files: projects.listFiles(p.name) })],
  ['POST', '/api/projects/:name/read', async (req, p) => { const { relpath } = await json(req); return { content: projects.readFile(p.name, relpath) }; }],
  ['POST', '/api/projects/:name/write', async (req, p) => { const { relpath, content } = await json(req); return projects.writeFile(p.name, relpath, content); }],
  ['POST', '/api/projects/:name/upload', async (req, p) => {
    const url = new URL(req.url, 'http://x'); const relpath = url.searchParams.get('relpath');
    return projects.writeBinary(p.name, relpath, await readBody(req));
  }],
  ['GET', '/api/projects/:name/context', (req, p) => ({ context: projects.projectContext(p.name) })],

  ['GET', '/api/connectors', (req) => { const q = new URL(req.url, 'http://x').searchParams.get('q'); return { connectors: connectors.searchConnectors(q) }; }],

  ['GET', '/api/grounding', () => ({ ...grounding.groundingMeta(), content: grounding.readGrounding() })],
  ['POST', '/api/grounding/knowledge', async (req) => { const { note, author } = await json(req); return grounding.appendKnowledge(note, author); }],

  ['GET', '/api/ai/status', () => ai.aiStatus()],
  ['POST', '/api/ai/ask', async (req) => {
    const { messages, project, provider } = await json(req);
    const ctx = project ? projects.projectContext(project) : '';
    const out = await ai.ask({ messages, projectContext: ctx, provider });
    if (project) { db.addChat(project, 'user', messages[messages.length - 1]?.content || '', out.provider); db.addChat(project, 'assistant', out.text, out.provider); }
    return out;
  }],
  ['GET', '/api/ai/history', (req) => { const project = new URL(req.url, 'http://x').searchParams.get('project'); return { history: db.chatHistory(project) }; }],

  ['POST', '/api/feedback', async (req) => db.addFeedback(await json(req))],
  ['GET', '/api/feedback', (req) => { const project = new URL(req.url, 'http://x').searchParams.get('project'); return { feedback: db.listFeedback(project) }; }],
];

function match(method, pathname) {
  for (const [m, tpl, handler] of routes) {
    if (m !== method) continue;
    const tp = tpl.split('/'), pp = pathname.split('/');
    if (tp.length !== pp.length) continue;
    const params = {}; let ok = true;
    for (let i = 0; i < tp.length; i++) {
      if (tp[i].startsWith(':')) params[tp[i].slice(1)] = decodeURIComponent(pp[i]);
      else if (tp[i] !== pp[i]) { ok = false; break; }
    }
    if (ok) return { handler, params };
  }
  return null;
}

function serveStatic(res, pathname) {
  let rel = pathname === '/' ? '/index.html' : pathname;
  let file = path.join(CLIENT_DIST, rel);
  if (!file.startsWith(CLIENT_DIST) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    // SPA fallback (React Router / client routing)
    file = path.join(CLIENT_DIST, 'index.html');
  }
  if (!fs.existsSync(file)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(NO_BUILD_PAGE);
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

const NO_BUILD_PAGE = `<!doctype html><meta charset=utf-8><title>Data 360 App</title>
<body style="font:15px system-ui;max-width:640px;margin:60px auto;padding:0 20px;color:#111">
<h2>Backend is running ✅</h2>
<p>The React client hasn't been built yet. From <code>data360-app/client</code> run:</p>
<pre style="background:#f4f4f5;padding:12px;border-radius:8px">npm install
npm run build</pre>
<p>…or during development run <code>npm run dev</code> in <code>client</code> and open the Vite URL (it proxies the API here).</p>
<p>API health: <a href="/api/health">/api/health</a></p></body>`;

const server = http.createServer(async (req, res) => {
  // The client is same-origin in production; permissive CORS keeps `npm run dev` (Vite) working too.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const { pathname } = new URL(req.url, 'http://x');
  try {
    if (pathname.startsWith('/api/')) {
      const r = match(req.method, pathname);
      if (!r) return send(res, 404, { error: 'not found: ' + pathname });
      const out = await r.handler(req, r.params);
      return send(res, 200, out);
    }
    serveStatic(res, pathname);
  } catch (e) {
    send(res, 500, { error: e.message });
  }
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') console.log(`Port ${PORT} in use — the app is probably already running at http://127.0.0.1:${PORT}`);
  else console.error(e);
});
server.listen(PORT, '127.0.0.1', () => {
  const s = loadSettings();
  console.log(`\nData 360 App  →  http://127.0.0.1:${PORT}`);
  console.log(`  projects dir : ${s.projectsDir}`);
  console.log(`  index (sqlite): ${db.dbAvailable() ? 'on' : 'off (markdown scan)'}`);
  console.log(`  AI provider  : ${s.aiProvider}  (key ${s.keys[s.aiProvider] ? 'set' : 'NOT set'})\n`);
});
