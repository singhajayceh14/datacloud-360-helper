import { Banner, PageHeader } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { isDbConfigured } from "@/db";
import { getActiveProjectId } from "@/lib/active-project";
import { buildBrd } from "@/lib/brd/build";
import type { Block } from "@/lib/brd/model";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "h3":
      return <h4 className="mt-4 mb-1.5 font-semibold">{block.text}</h4>;
    case "p":
      return <p className="mb-2 text-[13px] leading-relaxed">{block.text}</p>;
    case "note":
      return (
        <p
          className={`mb-2 rounded-md px-2.5 py-1.5 text-[12px] ${
            block.tone === "warn"
              ? "bg-amber-50 text-amber-800"
              : "bg-blue-50 text-blue-800"
          }`}
        >
          {block.tone === "warn" ? "⚠" : "ℹ"} {block.text}
        </p>
      );
    case "ul":
      return (
        <ul className="mb-2 ml-4 list-disc text-[13px]">
          {block.items.map((it, i) => (
            <li key={i} className="mb-0.5">
              {it}
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="mb-3 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[12px]">
            <thead>
              <tr className="text-left text-muted">
                {block.head.map((h, i) => (
                  <th key={i} className="border-b border-line pb-1 pr-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r, ri) => (
                <tr key={ri} className="border-b border-line/60">
                  {r.map((c, ci) => (
                    <td key={ci} className="py-1 pr-3 align-top">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export default async function BrdPage() {
  const header = (
    <PageHeader
      title="BRD / SDD"
      sub="A living solution-design document — every section syncs from the other tabs."
    />
  );

  if (!isDbConfigured()) {
    return (
      <div>
        {header}
        <Banner tone="info">
          <strong>Database not connected.</strong> Add{" "}
          <code className="rounded bg-white/60 px-1">DATABASE_URL</code> and run{" "}
          <code className="rounded bg-white/60 px-1">npm run db:migrate</code>.
        </Banner>
      </div>
    );
  }

  const activeId = await getActiveProjectId();
  const today = new Date().toISOString().slice(0, 10);
  const doc = activeId ? await buildBrd(activeId, today).catch(() => null) : null;

  if (!doc) {
    return (
      <div>
        {header}
        <Banner tone="info">
          <strong>Select a project</strong> from the sidebar to assemble its
          solution-design document.
        </Banner>
      </div>
    );
  }

  return (
    <div>
      <div
        className="flex flex-wrap items-start justify-between gap-3"
        data-print-hide
      >
        {header}
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <a
            href="/api/brd/export?format=docx"
            className="rounded-lg bg-brand px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-brand-hover"
          >
            Download Word (.docx)
          </a>
          <a
            href="/api/brd/export?format=md"
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] text-ink hover:border-brand"
          >
            Download Markdown
          </a>
          <PrintButton />
        </div>
      </div>

      <article className="mt-2 rounded-xl border border-line bg-panel p-6">
        <h1 className="text-[22px] font-bold">{doc.title}</h1>
        <p className="mt-1 text-[13px] italic text-muted">{doc.subtitle}</p>
        <p className="mt-1 text-[12px] text-muted">
          Generated {doc.generatedAt} — sections sync from the console tabs.
        </p>

        <Stagger>
          {doc.sections.map((s, i) => (
            <StaggerItem key={s.id}>
              <section className="mt-6">
                <h2 className="mb-2 border-b border-line pb-1 text-[16px] font-semibold">
                  {i + 1}. {s.title}
                </h2>
                {s.blocks.map((b, bi) => (
                  <BlockView key={bi} block={b} />
                ))}
              </section>
            </StaggerItem>
          ))}
        </Stagger>
      </article>
    </div>
  );
}
