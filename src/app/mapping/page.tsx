import { Banner, Card, PageHeader, Pill } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { isDbConfigured } from "@/db";
import { getActiveProjectId } from "@/lib/active-project";
import { getProject } from "@/db/queries/projects";
import { listMappings } from "@/db/queries/mappings";
import type { Mapping } from "@/db/schema";
import { MappingWorkbench } from "./MappingWorkbench";
import { SavedMapping } from "./SavedMapping";
import { ProjectMappingCanvas } from "./ProjectMappingCanvas";

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

      {existing.length > 0 && (
        <Card>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">Project data model</h2>
            <Pill tone="ga">
              {existing.length} source{existing.length === 1 ? "" : "s"}
            </Pill>
          </div>
          <p className="mb-3 text-[13px] text-muted">
            Every source&apos;s columns fanning into the shared, de-duplicated
            Data 360 model. A DMO fed by more than one source is marked{" "}
            <span className="font-semibold text-emerald-700">unified</span> —
            the visual of cross-source identity resolution.
          </p>
          <ProjectMappingCanvas mappings={existing} />
        </Card>
      )}

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
