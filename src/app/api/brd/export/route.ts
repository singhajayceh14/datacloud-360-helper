import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db";
import { getActiveProjectId } from "@/lib/active-project";
import { buildBrd } from "@/lib/brd/build";
import { toMarkdown } from "@/lib/brd/model";
import { toDocxBuffer } from "@/lib/brd/docx";

export const dynamic = "force-dynamic";

/** Turn a project name into a safe file slug. */
function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "project"
  );
}

export async function GET(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not connected." }, { status: 503 });
  }

  const projectId = await getActiveProjectId();
  if (!projectId) {
    return NextResponse.json({ error: "No active project." }, { status: 400 });
  }

  const format = new URL(req.url).searchParams.get("format") ?? "md";
  const today = new Date().toISOString().slice(0, 10);
  const doc = await buildBrd(projectId, today);
  if (!doc) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const base = `${slug(doc.title.replace(/ — .*/, ""))}-sdd-${today}`;

  if (format === "docx") {
    const buf = await toDocxBuffer(doc);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${base}.docx"`,
      },
    });
  }

  // Default: Markdown.
  return new NextResponse(toMarkdown(doc), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${base}.md"`,
    },
  });
}
