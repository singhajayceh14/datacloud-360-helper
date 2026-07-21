// Data 360 Console — local backend.
// Replaces the Cowork mcp__workspace__bash bridge: serves console.html and
// exposes /api/bash (Git Bash over the workspace), /api/write, /api/upload,
// and /api/ask (bundled claude.exe -p for the side-chat).
// Start:  node _console/server.js   →  http://127.0.0.1:4360
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const ROOT = path.resolve(__dirname, '..');            // the workspace = parent of _console
const PORT = 4360;

const WIN = process.platform === 'win32';

function findBash() {
  if (!WIN) {
    for (const c of ['/bin/bash', '/usr/bin/bash', '/usr/local/bin/bash']) if (fs.existsSync(c)) return c;
    return 'bash';
  }
  const cands = [
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Git', 'bin', 'bash.exe')
  ];
  for (const c of cands) if (fs.existsSync(c)) return c;
  return 'bash.exe'; // hope it's on PATH
}
const BASH = findBash();
// Windows path -> Git Bash path (D:\Data Cloud Claude -> /d/Data Cloud Claude).
// On macOS/Linux the filesystem path is already the shell path.
const BASH_ROOT = WIN ? '/' + ROOT[0].toLowerCase() + ROOT.slice(2).replace(/\\/g, '/') : ROOT;

function findClaude() {
  // Desktop app bundles the claude CLI under versioned dirs; pick the newest.
  try {
    const base = WIN
      ? path.join(process.env.APPDATA, 'Claude', 'claude-code')
      : path.join(process.env.HOME || '', 'Library', 'Application Support', 'Claude', 'claude-code');
    const exe = WIN ? 'claude.exe' : 'claude';
    const versions = fs.readdirSync(base)
      .filter(v => fs.existsSync(path.join(base, v, exe)))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (versions.length) return path.join(base, versions[versions.length - 1], exe);
  } catch (e) { /* fall through */ }
  return 'claude'; // hope it's on PATH
}
const CLAUDE = findClaude();
// A nested CLAUDE* env makes claude -p think it's running inside a session.
const CLEAN_ENV = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => !/^CLAUDE/i.test(k))
);

function safe(rel) {
  const p = path.resolve(ROOT, rel || '');
  if (p !== ROOT && !p.startsWith(ROOT + path.sep)) throw new Error('path outside workspace');
  return p;
}
function body(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', d => chunks.push(d));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  // CORS so the console also works when opened as a file:// page
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  try {
    const u = new URL(req.url, 'http://localhost');

    if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      // inject this machine's workspace path so the page is portable
      const page = fs.readFileSync(path.join(__dirname, 'console.html'), 'utf8')
        .replace(/const ROOT='[^']*';/, `const ROOT='${BASH_ROOT}';`);
      res.end(page);

    } else if (req.method === 'GET' && u.pathname === '/connectors.json') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(fs.readFileSync(path.join(__dirname, 'connectors.json')));

    } else if (req.method === 'POST' && u.pathname === '/api/bash') {
      const { command } = JSON.parse(await body(req));
      execFile(BASH, ['-c', command], { cwd: ROOT, timeout: 30000, maxBuffer: 8 * 1024 * 1024 },
        (err, stdout, stderr) => {
          // Match the Cowork bash tool: a non-zero exit with no output (e.g. an
          // unmatched glob ending a for-loop) is not an error, just empty text.
          if (err && (err.code === 'ENOENT' || err.killed)) json(res, 200, { isError: true, text: err.message });
          else if (err && !stdout && stderr) json(res, 200, { isError: true, text: stderr });
          else json(res, 200, { isError: false, text: stdout || '' });
        });

    } else if (req.method === 'POST' && u.pathname === '/api/write') {
      const { path: rel, content } = JSON.parse(await body(req));
      fs.writeFileSync(safe(rel), content, 'utf8');
      json(res, 200, { ok: true });

    } else if (req.method === 'POST' && u.pathname === '/api/upload') {
      const dest = safe(u.searchParams.get('path'));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, await body(req));
      json(res, 200, { ok: true });

    } else if (req.method === 'GET' && u.pathname === '/api/org') {
      // Live Data Cloud check via the sf CLI (org alias comes from project-state.md)
      const alias = (u.searchParams.get('alias') || '').trim();
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(alias)) return json(res, 200, { error: 'no org alias found in project-state.md (expected e.g. "CLI alias `AlpineDC`")' });
      const sfCmd = WIN ? ['cmd.exe', ['/c', 'sf', 'api', 'request', 'rest',
        '/services/data/v66.0/ssot/metadata?entityType=DataModelObject', '-o', alias]]
        : ['sf', ['api', 'request', 'rest',
        '/services/data/v66.0/ssot/metadata?entityType=DataModelObject', '-o', alias]];
      execFile(sfCmd[0], sfCmd[1],
        { timeout: 90000, maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
          // sf colorizes via ANSI escapes when run under cmd — strip before parsing
          const out = ((stdout || '') + (stderr || '')).replace(/\[[0-9;]*m/g, '');
          try {
            const m = out.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            const j = JSON.parse(m[0]);
            if (Array.isArray(j) && j[0] && j[0].errorCode) return json(res, 200, { enabled: false, detail: j[0].message });
            const objs = (j.metadata || []).map(o => ({ name: o.name, label: o.displayName, category: o.category })).slice(0, 400);
            json(res, 200, { enabled: true, dmoCount: (j.metadata || []).length, dmos: objs });
          } catch (e) { json(res, 200, { error: (out || e.message).slice(0, 300) }); }
        });

    } else if (req.method === 'POST' && u.pathname === '/api/ask') {
      const { prompt } = JSON.parse(await body(req));
      const child = execFile(CLAUDE, ['-p', '--model', 'haiku'],
        { cwd: __dirname, env: CLEAN_ENV, timeout: 180000, maxBuffer: 4 * 1024 * 1024 },
        (err, stdout, stderr) => {
          if (/not logged in/i.test(stdout || '')) {
            json(res, 200, { error:
              'The side-chat needs a one-time login for the Claude CLI. Open a terminal and run:\n\n' +
              `"${CLAUDE}"\n\nthen type /login and finish sign-in in the browser. After that, chat here works.` });
          } else if (err && !stdout) {
            json(res, 200, { error: (stderr || err.message).slice(0, 2000) });
          } else {
            json(res, 200, { text: stdout.trim() });
          }
        });
      child.stdin.end(prompt);

    } else {
      json(res, 404, { error: 'not found' });
    }
  } catch (e) {
    json(res, 500, { error: e.message });
  }
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use — the console server is probably already running.`);
    console.log(`Just open http://127.0.0.1:${PORT} in your browser.`);
  } else console.error(e);
});
server.listen(PORT, '127.0.0.1', () =>
  console.log(`Data 360 Console at http://127.0.0.1:${PORT}  (workspace: ${ROOT}, claude: ${CLAUDE})`));
