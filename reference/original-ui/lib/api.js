// Tiny fetch wrapper for the backend JSON API.
async function req(method, path, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const r = await fetch(path, opts);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || `${r.status} ${path}`);
  return j;
}
const get = (p) => req('GET', p);
const post = (p, b) => req('POST', p, b);
const enc = encodeURIComponent;

export const api = {
  health: () => get('/api/health'),
  settings: () => get('/api/settings'),
  saveSettings: (patch) => post('/api/settings', patch),

  projects: () => get('/api/projects'),
  createProject: (name, client) => post('/api/projects', { name, client }),
  project: (name) => get(`/api/projects/${enc(name)}`),
  readFile: (name, relpath) => post(`/api/projects/${enc(name)}/read`, { relpath }),
  writeFile: (name, relpath, content) => post(`/api/projects/${enc(name)}/write`, { relpath, content }),

  connectors: (q) => get(`/api/connectors?q=${enc(q || '')}`),

  grounding: () => get('/api/grounding'),
  addKnowledge: (note, author) => post('/api/grounding/knowledge', { note, author }),

  aiStatus: () => get('/api/ai/status'),
  ask: (messages, project, provider) => post('/api/ai/ask', { messages, project, provider }),
  history: (project) => get(`/api/ai/history?project=${enc(project || '')}`),
};
