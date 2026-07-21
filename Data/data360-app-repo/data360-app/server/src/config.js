// Central configuration. Everything is overridable via env or the local
// settings file (server/data/settings.local.json), which is written by the UI.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const SERVER_ROOT = path.resolve(__dirname, '..');          // .../server
export const APP_ROOT = path.resolve(SERVER_ROOT, '..');           // .../data360-app
export const DATA_DIR = path.join(SERVER_ROOT, 'data');            // bundled assets
export const CLIENT_DIST = path.join(APP_ROOT, 'client', 'dist');  // built React app
export const SETTINGS_FILE = path.join(DATA_DIR, 'settings.local.json');

// Where client projects live. Preference order:
//   1. DATA360_PROJECTS_DIR env override
//   2. the folder that CONTAINS data360-app, IF it already holds projects
//      (Saurabh's setup — picks up existing NorthPeak/Alpine automatically)
//   3. the bundled sample-projects/ (a fresh git clone — works out of the box)
//   4. the parent folder anyway
function defaultProjectsDir() {
  if (process.env.DATA360_PROJECTS_DIR) return path.resolve(process.env.DATA360_PROJECTS_DIR);
  const parent = path.resolve(APP_ROOT, '..');
  const sample = path.join(APP_ROOT, 'sample-projects');
  try {
    const hasProjects = fs.readdirSync(parent).some(n => {
      try { return fs.existsSync(path.join(parent, n, 'project-state.md')); } catch { return false; }
    });
    if (hasProjects) return parent;
  } catch { /* ignore */ }
  if (fs.existsSync(sample)) return sample;
  return parent;
}
const DEFAULT_PROJECTS_DIR = defaultProjectsDir();

export const PORT = Number(process.env.PORT || process.env.DATA360_PORT || 4370);

// ---- local settings (provider keys, projects dir, defaults) ----
const DEFAULT_SETTINGS = {
  projectsDir: process.env.DATA360_PROJECTS_DIR || DEFAULT_PROJECTS_DIR,
  aiProvider: 'anthropic',                 // 'anthropic' | 'gemini'
  models: { anthropic: 'claude-sonnet-5', gemini: 'gemini-2.0-flash' },
  keys: { anthropic: '', gemini: '' },     // BYO — never committed
};

export function loadSettings() {
  try {
    const raw = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    return {
      ...DEFAULT_SETTINGS, ...raw,
      models: { ...DEFAULT_SETTINGS.models, ...(raw.models || {}) },
      keys: { ...DEFAULT_SETTINGS.keys, ...(raw.keys || {}) },
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(patch) {
  const cur = loadSettings();
  const next = {
    ...cur, ...patch,
    models: { ...cur.models, ...(patch.models || {}) },
    keys: { ...cur.keys, ...(patch.keys || {}) },
  };
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

// Settings the UI is allowed to read back — API keys are masked, never sent raw.
export function publicSettings() {
  const s = loadSettings();
  const mask = (k) => (k ? '••••••' + k.slice(-4) : '');
  return {
    projectsDir: s.projectsDir,
    aiProvider: s.aiProvider,
    models: s.models,
    keysSet: { anthropic: !!s.keys.anthropic, gemini: !!s.keys.gemini },
    keysMasked: { anthropic: mask(s.keys.anthropic), gemini: mask(s.keys.gemini) },
  };
}
