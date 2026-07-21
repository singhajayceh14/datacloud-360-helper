// The grounding layer. Bundled grounding.md is the ground truth every AI call
// is anchored to (provider-agnostic). At ~49KB it fits directly in context, so
// today we inject the whole digest plus any project-specific additions. When it
// outgrows the window, swap injectFor() for embedding-based retrieval — the
// call sites won't change.
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from '../config.js';

const GROUNDING_PATH = path.join(DATA_DIR, 'grounding.md');
const EXTRA_PATH = path.join(DATA_DIR, 'grounding.extra.md'); // UI "Add knowledge" appends here

export function readGrounding() {
  let base = '';
  try { base = fs.readFileSync(GROUNDING_PATH, 'utf8'); } catch { base = ''; }
  let extra = '';
  try { extra = fs.readFileSync(EXTRA_PATH, 'utf8'); } catch { extra = ''; }
  return extra ? base + '\n\n## Added knowledge (this workspace)\n' + extra : base;
}

export function appendKnowledge(note, author) {
  const stamp = `\n\n---\n_${new Date().toISOString().slice(0, 10)}${author ? ' · ' + author : ''}_\n\n${note.trim()}\n`;
  fs.appendFileSync(EXTRA_PATH, stamp, 'utf8');
  return { ok: true };
}

// The system prompt every provider receives. Keeps Claude and Gemini answering
// from identical ground truth.
export function systemPrompt(projectContext) {
  const g = readGrounding();
  return [
    'You are a Salesforce Data 360 (formerly Data Cloud) implementation copilot for Icreon consultants.',
    'Answer strictly in line with the GROUNDING below — it is the authoritative, verified reference for',
    'connectors, DMO/DLO modelling, identity resolution, segmentation, activation, and consumption/credits.',
    'If something is not covered by the grounding, say so rather than inventing platform behaviour.',
    'Prefer concrete, implementation-ready guidance. Cite the relevant rule when it matters.',
    '',
    '================= GROUNDING =================',
    g,
    '================ END GROUNDING ==============',
    projectContext ? '\n============ CURRENT PROJECT CONTEXT ============\n' + projectContext + '\n=========== END PROJECT CONTEXT ===========' : '',
  ].join('\n');
}

export function groundingMeta() {
  const g = readGrounding();
  return { chars: g.length, approxTokens: Math.round(g.length / 4), hasExtra: fs.existsSync(EXTRA_PATH) };
}
