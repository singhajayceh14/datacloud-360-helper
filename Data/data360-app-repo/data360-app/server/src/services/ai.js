// Provider-agnostic AI layer. One ask() entry point; the active provider and
// BYO key come from settings. Both providers receive the same grounded system
// prompt (see grounding.js), so answers stay consistent whichever is chosen.
//
// Uses global fetch (Node >= 18). No SDK dependency. Keys live only in the
// local settings file / OS env and never reach the browser.
import { loadSettings } from '../config.js';
import { systemPrompt } from './grounding.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const GEMINI_URL = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

export function aiStatus() {
  const s = loadSettings();
  return {
    provider: s.aiProvider,
    models: s.models,
    ready: { anthropic: !!s.keys.anthropic, gemini: !!s.keys.gemini },
    activeReady: !!s.keys[s.aiProvider],
  };
}

// messages: [{role:'user'|'assistant', content:'...'}]
export async function ask({ messages, projectContext, provider, temperature = 0.3, maxTokens = 2000 }) {
  const s = loadSettings();
  const prov = provider || s.aiProvider;
  const key = s.keys[prov];
  if (!key) throw new Error(`No API key set for ${prov}. Add one in Settings.`);
  const sys = systemPrompt(projectContext);
  const model = s.models[prov];
  if (prov === 'anthropic') return askAnthropic({ key, model, sys, messages, temperature, maxTokens });
  if (prov === 'gemini') return askGemini({ key, model, sys, messages, temperature, maxTokens });
  throw new Error('Unknown provider: ' + prov);
}

async function askAnthropic({ key, model, sys, messages, temperature, maxTokens }) {
  const r = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model, max_tokens: maxTokens, temperature, system: sys,
      messages: messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || `Anthropic error ${r.status}`);
  const text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
  return { provider: 'anthropic', model, text, usage: j.usage };
}

async function askGemini({ key, model, sys, messages, temperature, maxTokens }) {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const r = await fetch(GEMINI_URL(model, key), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sys }] },
      contents,
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || `Gemini error ${r.status}`);
  const text = (j.candidates?.[0]?.content?.parts || []).map(p => p.text).filter(Boolean).join('\n').trim();
  return { provider: 'gemini', model, text, usage: j.usageMetadata };
}
