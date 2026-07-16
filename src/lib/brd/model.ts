/**
 * A tab-agnostic document model for the BRD / SDD. The builder assembles a
 * BrdDoc from the other tabs; renderers turn it into on-page HTML, Markdown,
 * or a .docx — so every output stays in sync with one source of truth.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "note"; tone: "info" | "warn"; text: string };

export type Section = {
  id: string;
  title: string;
  blocks: Block[];
};

export type BrdDoc = {
  title: string;
  subtitle: string;
  generatedAt: string; // ISO date, injected — never computed in a renderer
  sections: Section[];
};

/** Render the document as GitHub-flavored Markdown. */
export function toMarkdown(doc: BrdDoc): string {
  const out: string[] = [];
  out.push(`# ${doc.title}`);
  out.push("");
  out.push(`_${doc.subtitle}_`);
  out.push("");
  out.push(`Generated ${doc.generatedAt} — sections sync from the console tabs.`);
  out.push("");

  doc.sections.forEach((s, i) => {
    out.push(`## ${i + 1}. ${s.title}`);
    out.push("");
    for (const b of s.blocks) {
      switch (b.type) {
        case "h3":
          out.push(`### ${b.text}`, "");
          break;
        case "p":
          out.push(b.text, "");
          break;
        case "note":
          out.push(`> ${b.tone === "warn" ? "⚠" : "ℹ"} ${b.text}`, "");
          break;
        case "ul":
          for (const it of b.items) out.push(`- ${it}`);
          out.push("");
          break;
        case "table": {
          out.push(`| ${b.head.join(" | ")} |`);
          out.push(`| ${b.head.map(() => "---").join(" | ")} |`);
          for (const r of b.rows) out.push(`| ${r.map(mdCell).join(" | ")} |`);
          out.push("");
          break;
        }
      }
    }
  });

  return out.join("\n");
}

function mdCell(s: string): string {
  return String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}
