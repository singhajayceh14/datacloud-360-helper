import { Banner, Card, PageHeader, Pill } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { isDbConfigured } from "@/db";
import { getActiveProjectId } from "@/lib/active-project";
import { getProject } from "@/db/queries/projects";
import { listMappings } from "@/db/queries/mappings";
import type { Mapping } from "@/db/schema";
import { MappingWorkbench } from "./MappingWorkbench";
import { SavedMapping } from "./SavedMapping";

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
      <Stagger className="flex flex-col gap-2">
        {existing.map((m) => (
          <StaggerItem key={m.id}>
            <SavedMapping mapping={m} />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
