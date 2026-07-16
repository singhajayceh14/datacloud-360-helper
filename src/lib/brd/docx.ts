import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { Block, BrdDoc } from "./model";

function cell(text: string, bold = false): TableCell {
  return new TableCell({
    children: [
      new Paragraph({ children: [new TextRun({ text: text || "", bold })] }),
    ],
  });
}

function blockToDocx(b: Block): (Paragraph | Table)[] {
  switch (b.type) {
    case "h3":
      return [new Paragraph({ text: b.text, heading: HeadingLevel.HEADING_3 })];
    case "p":
      return [new Paragraph({ text: b.text })];
    case "note":
      return [
        new Paragraph({
          children: [
            new TextRun({
              text: `${b.tone === "warn" ? "⚠" : "ℹ"} ${b.text}`,
              italics: true,
            }),
          ],
        }),
      ];
    case "ul":
      return b.items.map(
        (it) => new Paragraph({ text: it, bullet: { level: 0 } }),
      );
    case "table":
      return [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: b.head.map((h) => cell(h, true)),
            }),
            ...b.rows.map(
              (r) => new TableRow({ children: r.map((c) => cell(c)) }),
            ),
          ],
        }),
        new Paragraph({ text: "" }),
      ];
  }
}

/** Render the BRD/SDD as a .docx and return it as a Buffer. */
export async function toDocxBuffer(doc: BrdDoc): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [
    new Paragraph({ text: doc.title, heading: HeadingLevel.TITLE }),
    new Paragraph({
      children: [new TextRun({ text: doc.subtitle, italics: true })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated ${doc.generatedAt} — sections sync from the console tabs.`,
          size: 18,
          color: "666666",
        }),
      ],
    }),
    new Paragraph({ text: "" }),
  ];

  doc.sections.forEach((s, i) => {
    children.push(
      new Paragraph({
        text: `${i + 1}. ${s.title}`,
        heading: HeadingLevel.HEADING_1,
      }),
    );
    for (const b of s.blocks) children.push(...blockToDocx(b));
  });

  const document = new Document({ sections: [{ children }] });
  return Packer.toBuffer(document);
}
