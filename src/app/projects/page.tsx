import { Card, PageHeader, Pill } from "@/components/ui";

export default function ProjectsPage() {
  return (
    <div>
      <PageHeader
        title="Projects"
        sub="Each project designs one Salesforce Data Cloud 360 implementation end to end."
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            className="grow rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand"
            placeholder="New project name (e.g. Acme Retail)"
            disabled
          />
          <input
            className="grow rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand"
            placeholder="Client / description (optional)"
            disabled
          />
          <button
            className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-50"
            disabled
          >
            Create
          </button>
        </div>
      </Card>

      <div className="flex items-center gap-2 text-muted">
        <span>
          No projects yet — project storage arrives in Phase 1 (Supabase /
          Postgres).
        </span>
        <Pill tone="beta">Phase 0</Pill>
      </div>
    </div>
  );
}
