import { Banner, PageHeader } from "@/components/ui";
import { isDbConfigured } from "@/db";
import { getActiveProjectId } from "@/lib/active-project";
import { getProject } from "@/db/queries/projects";
import { listSources } from "@/db/queries/sources";
import { listObjectives } from "@/db/queries/objectives";
import type { Source } from "@/db/schema";
import { IngestionTabs, type SourceLite } from "./IngestionTabs";

export const dynamic = "force-dynamic";

export default async function IngestionPage() {
  const header = (
    <PageHeader
      title="Ingestion"
      sub="Search the connector directory and build the per-project source inventory."
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
  const project = activeId ? await getProject(activeId).catch(() => null) : null;
  if (!project) {
    return (
      <div>
        {header}
        <Banner tone="info">
          <strong>Select a project</strong> from the header to build its source
          inventory.
        </Banner>
      </div>
    );
  }

  const [rows, objRows] = await Promise.all([
    listSources(project.id).catch(() => [] as Source[]),
    listObjectives(project.id).catch(() => []),
  ]);
  const sources: SourceLite[] = rows.map((s) => ({
    id: s.id,
    name: s.name,
    entities: s.entities,
    method: s.method,
    frequency: s.frequency,
    status: s.status,
    notes: s.notes,
  }));
  const objectives = objRows.map((o) => ({ id: o.id, text: o.text }));

  return (
    <div>
      {header}
      <IngestionTabs
        projectId={project.id}
        sources={sources}
        objectives={objectives}
      />
    </div>
  );
}
