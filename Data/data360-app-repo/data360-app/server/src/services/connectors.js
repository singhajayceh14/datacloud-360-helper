// The 325-connector catalog, served for the Ingestion tab search.
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from '../config.js';

let CATALOG = null;
function load() {
  if (CATALOG) return CATALOG;
  try { CATALOG = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'connectors.json'), 'utf8')); }
  catch { CATALOG = []; }
  // catalog may be an array or {connectors:[...]}
  if (!Array.isArray(CATALOG)) CATALOG = CATALOG.connectors || CATALOG.items || [];
  return CATALOG;
}

export function allConnectors() { return load(); }

export function searchConnectors(q, limit = 30) {
  const list = load();
  const query = (q || '').toLowerCase().trim();
  if (!query) return list.slice(0, limit);
  return list.filter(c => {
    const hay = [c.label, c.name, c.desc, c.description, ...(c.features || [])].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(query);
  }).slice(0, limit);
}
