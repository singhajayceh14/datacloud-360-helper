// Read/write the console's markdown conventions so this app stays 100%
// interoperable with the existing projects, the local console, and the
// datacloud-360 Claude skill.
//
// Two block forms are supported (both produced by the original console.html):
//   1. Section-embedded, paired:
//        <!-- console:MARKER -->
//        ...content or JSON...
//        <!-- /console:MARKER -->
//   2. Standalone JSON (no closing tag — terminated by a line that is just `-->`):
//        <!-- console:segjson
//        { ...json... }
//        -->

// Extract a paired block's inner text by marker name. Returns null if absent.
export function readPairedBlock(md, marker) {
  const open = `<!-- console:${marker} -->`;
  const close = `<!-- /console:${marker} -->`;
  const s = md.indexOf(open);
  if (s < 0) return null;
  const e = md.indexOf(close, s + open.length);
  if (e < 0) return null;
  return md.slice(s + open.length, e).replace(/^\n/, '').replace(/\n$/, '');
}

// Extract a standalone JSON block (form 2). Returns parsed object/array or null.
export function readJsonBlock(md, marker) {
  const open = `<!-- console:${marker}`;
  const s = md.indexOf(open);
  if (s < 0) return null;
  const after = md.indexOf('\n', s);
  const end = md.indexOf('\n-->', after);
  if (after < 0 || end < 0) return null;
  const raw = md.slice(after + 1, end).trim();
  try { return JSON.parse(raw); } catch { return null; }
}

// Upsert a paired block inside a numbered section (## N. Title ...), mirroring
// console.html's upsertBlock so BRD/SDD round-trips are byte-compatible.
export function upsertSectionBlock(content, secNum, marker, block) {
  const hm = content.match(new RegExp('\\n## ' + secNum + '\\.[^\\n]*'));
  if (!hm) return content;
  const start = content.indexOf(hm[0]) + hm[0].length;
  let end = content.indexOf('\n## ', start);
  if (end < 0) end = content.length;
  const open = `<!-- console:${marker} -->`, close = `<!-- /console:${marker} -->`;
  const seg = content.slice(start, end);
  const bi = seg.indexOf(open);
  let newSeg;
  if (bi >= 0) {
    const be = seg.indexOf(close, bi);
    newSeg = seg.slice(0, bi) + open + '\n' + block + '\n' + close + (be >= 0 ? seg.slice(be + close.length) : '');
  } else {
    newSeg = seg.replace(/\s*$/, '') + '\n\n' + open + '\n' + block + '\n' + close + '\n';
  }
  return content.slice(0, start) + newSeg + content.slice(end);
}

// Serialize a standalone JSON block (form 2).
export function jsonBlock(marker, obj) {
  return `<!-- console:${marker}\n${JSON.stringify(obj, null, 1)}\n-->\n`;
}

// Parse the first GitHub-style markdown table found after an optional heading.
// Returns { headers:[], rows:[{header:value}] }.
export function parseFirstTable(md) {
  const lines = md.split('\n');
  let i = lines.findIndex(l => /^\s*\|.*\|\s*$/.test(l) && /\|/.test(lines[lines.indexOf(l) + 1] || ''));
  if (i < 0) return null;
  const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  const headers = cells(lines[i]);
  const rows = [];
  for (let j = i + 2; j < lines.length; j++) {
    if (!/^\s*\|.*\|\s*$/.test(lines[j])) break;
    const c = cells(lines[j]);
    const row = {};
    headers.forEach((h, k) => { row[h] = c[k] ?? ''; });
    rows.push(row);
  }
  return { headers, rows };
}

// Pull simple "- **Key**: value" bullet metadata (project-state header style).
export function parseBulletMeta(md) {
  const out = {};
  for (const m of md.matchAll(/^-\s+\*\*(.+?)\*\*:\s*(.+)$/gm)) {
    out[m[1].trim().toLowerCase()] = m[2].trim();
  }
  return out;
}
