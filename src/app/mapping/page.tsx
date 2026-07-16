import { Banner, Card, PageHeader, Pill } from "@/components/ui";
import { isDbConfigured } from "@/db";
import { getActiveProjectId } from "@/lib/active-project";
import { getProject } from "@/db/queries/projects";
import { listMappings } from "@/db/queries/mappings";
import type { Mapping } from "@/db/schema";
import { MappingWorkbench } from "./MappingWorkbench";
import { deleteMappingAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MappingPage() {
  const header = (
    <PageHeader
      title="Data Mapping"
      sub="Import a CSV, profile it, and auto-draft the DLO → DMO field mapping."
    />
  );

  if (!isDbConfigured()) {
    return (
      <div>
        {header}
        <Banner tone="info">
          <strong>Database not connected.</strong> Add{" "}
          <code className="rounded bg-white/60 px-1">DATABASE_URL</code> to{" "}
          <code className="rounded bg-white/60 px-1">.env.local</code> and run{" "}
          <code className="rounded bg-white/60 px-1">npm run db:migrate</code>.
        </Banner>
      </div>
    );
  }

  const activeId = await getActiveProjectId();
  const project = activeId
    ? await getProject(activeId).catch(() => null)
    : null;

  if (!project) {
    return (
      <div>
        {header}
        <Banner tone="info">
          <strong>Select a project</strong> from the sidebar dropdown to start
          mapping. Create one on the Projects tab if you don&apos;t have any yet.
        </Banner>
      </div>
    );
  }

  const existing: Mapping[] = await listMappings(project.id).catch(() => []);

  return (
    <div>
      {header}
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-semibold">New source mapping</h2>
          <Pill tone="other">{project.name}</Pill>
        </div>
        <MappingWorkbench projectId={project.id} />
      </Card>

      <h2 className="mb-2 mt-6 font-semibold">
        Saved mappings{" "}
        <span className="font-normal text-muted">({existing.length})</span>
      </h2>
      {existing.length === 0 && (
        <p className="text-muted">
          No mappings yet — upload a CSV above to create the first one.
        </p>
      )}
      <div className="flex flex-col gap-2">
        {existing.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-[10px] border border-line bg-white px-4 py-3"
          >
            <div className="grow">
              <div className="font-semibold">{m.sourceName}</div>
              <div className="text-[12px] text-muted">
                {m.fields.length} fields ·{" "}
                {m.fields.filter((f) => f.identity).length} identity ·{" "}
                {m.rowsSampled} rows {m.fileName ? `· ${m.fileName}` : ""}
              </div>
            </div>
            <form action={deleteMappingAction}>
              <input type="hidden" name="id" value={m.id} />
              <button
                type="submit"
                className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] text-muted hover:border-red-300 hover:text-red-700"
              >
                Delete
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
