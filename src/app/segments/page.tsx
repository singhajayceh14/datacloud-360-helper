import { Banner, PageHeader } from "@/components/ui";
import { isDbConfigured } from "@/db";
import { getActiveProjectId } from "@/lib/active-project";
import { getProject } from "@/db/queries/projects";
import { listSegments } from "@/db/queries/segments";
import { listMappings } from "@/db/queries/mappings";
import { listObjectives } from "@/db/queries/objectives";
import { getDmoObjects } from "@/db/queries/dmo";
import { providerStatus } from "@/lib/ai/config";
import type { Segment } from "@/db/schema";
import { SegmentsPanel, type SegmentLite } from "./SegmentsPanel";

export const dynamic = "force-dynamic";

export default async function SegmentsPage() {
  const header = (
    <PageHeader
      title="Segments"
      sub="Build the segment catalog — validated against the DMOs you've actually mapped."
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
          <strong>Select a project</strong> from the header to build its segment
          catalog.
        </Banner>
      </div>
    );
  }

  const [segRows, mappings, objRows, dmoCatalog] = await Promise.all([
    listSegments(project.id).catch(() => [] as Segment[]),
    listMappings(project.id).catch(() => []),
    listObjectives(project.id).catch(() => []),
    getDmoObjects().catch(() => []),
  ]);

  const mappedDmos = [...new Set(mappings.flatMap((m) => m.fields.map((f) => f.dmo)))];
  const dmoOptions = [
    ...new Set([...mappedDmos, ...dmoCatalog.map((o) => o.name)]),
  ];
  const objectives = objRows.map((o) => o.text);
  const segments: SegmentLite[] = segRows.map((s) => ({
    id: s.id,
    name: s.name,
    objective: s.objective,
    criteria: s.criteria,
    dmos: s.dmos,
    calculatedInsights: s.calculatedInsights,
    cadence: s.cadence,
    channel: s.channel,
    status: s.status,
  }));

  return (
    <div>
      {header}
      <SegmentsPanel
        projectId={project.id}
        segments={segments}
        dmoOptions={dmoOptions}
        mappedDmos={mappedDmos}
        objectives={objectives}
        ready={providerStatus().ready}
      />
    </div>
  );
}
