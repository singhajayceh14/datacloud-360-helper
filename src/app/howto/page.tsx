import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";

type Step = { title: string; body: string; href?: string; tab?: string };

const STEPS: Step[] = [
  {
    title: "Start a project",
    body: "Create or select a project — one project = one Data Cloud 360 implementation design. Switch the active project any time from the sidebar picker.",
    href: "/projects",
    tab: "Projects",
  },
  {
    title: "Capture the source inventory",
    body: "List the systems you'll ingest (Shopify, Klaviyo, POS…). Search the 325-connector catalog and one-click “Add to inventory”, or add sources manually with their method, frequency, and status.",
    href: "/ingestion",
    tab: "Ingestion",
  },
  {
    title: "Import & auto-map CSVs",
    body: "Drop a client CSV — it's profiled and auto-mapped column → DMO → field (person-split rules). Retarget any field from the standard DMO catalog and flag identity keys.",
    href: "/mapping",
    tab: "Data Mapping",
  },
  {
    title: "Design identity resolution",
    body: "The match-rule ladder is derived from your identity fields (Party ID → Email → Phone → guarded fuzzy), with reconciliation notes, scenario warnings, and a readiness check.",
    href: "/unification",
    tab: "Unification",
  },
  {
    title: "Build the segment catalog",
    body: "Define segments — objective, criteria, required DMOs, cadence, channel, status. Required DMOs are validated against what's actually mapped, so gaps surface early.",
    href: "/segments",
    tab: "Segments",
  },
  {
    title: "Plan activation",
    body: "Push each segment to a destination. Cadence-vs-segment and consent checks flag stale audiences and missing lawful basis before you publish.",
    href: "/activation",
    tab: "Activation",
  },
  {
    title: "Size entitlements & consumption",
    body: "Capture the order-form caps and run the consumption calculator against the credit pool — annual burn, utilization %, and runway.",
    href: "/entitlements",
    tab: "Entitlements",
  },
  {
    title: "Watch the Canvas",
    body: "The whole design as one status-colored picture: sources → DMOs → identity → segments → targets. Red nodes are data gaps. Use the next-steps list and scenario comparison to converge.",
    href: "/canvas",
    tab: "Canvas",
  },
  {
    title: "Generate the deliverables",
    body: "The BRD / SDD assembles every tab into a client-ready document — export it as Word, Markdown, or PDF.",
    href: "/brd",
    tab: "BRD / SDD",
  },
  {
    title: "Work with the Assistant",
    body: "Ask the grounded, project-aware Assistant anything about Data Cloud 360 — it answers from the curated reference and your current design.",
    href: "/assistant",
    tab: "Assistant",
  },
];

export default function HowToPage() {
  return (
    <div>
      <PageHeader
        title="How to"
        sub="The end-to-end workflow — from a client's raw exports to a finished Data Cloud 360 solution design."
      />

      <Stagger className="flex flex-col gap-2.5">
        {STEPS.map((s, i) => (
          <StaggerItem key={i}>
            <div className="flex items-start gap-3 rounded-xl border border-line bg-panel p-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white">
                {i + 1}
              </div>
              <div className="grow">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{s.title}</h2>
                  {s.href && s.tab && (
                    <Link
                      href={s.href}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-brand hover:text-white"
                    >
                      {s.tab} →
                    </Link>
                  )}
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  {s.body}
                </p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
