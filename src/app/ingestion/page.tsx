import { Banner, PageHeader } from "@/components/ui";
import { isDbConfigured } from "@/db";
import { getActiveProjectId } from "@/lib/active-project";
import { getProject } from "@/db/queries/projects";
import { listSources } from "@/db/queries/sources";
import { listObjectives } from "@/db/queries/objectives";
import { listSegments } from "@/db/queries/segments";
import { listActivations } from "@/db/queries/activations";
import { listMappings } from "@/db/queries/mappings";
import { searchConnectors } from "@/lib/connectors";
import type { Mapping, Source } from "@/db/schema";
import { IngestionTabs, type SourceLite, type SourceDetail } from "./IngestionTabs";
import type { StreamLite } from "./SourceFlow";

const inferCategory = (dmos: string[]) =>
  dmos.some((d) => /order|engagement|case|loyalty|campaign|event/i.test(d))
    ? "Engagement"
    : "Profile";

function streamFromMapping(m: Mapping): StreamLite {
  const dmos = [...new Set(m.fields.map((f) => f.dmo))];
  const dlo = (m.fileName || m.sourceName).replace(/\.csv$/i, "");
  const pk = m.fields.find((f) => f.identity)?.column ?? m.fields[0]?.column ?? "";
  const eventTime =
    m.fields.find((f) => /date|time|created|timestamp/i.test(f.column))?.column ?? "";
  return { dlo, category: inferCategory(dmos), pk, eventTime, dmos, doc: `${dlo}-mapping.md` };
}

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

  const [rows, objRows, segs, acts, maps] = await Promise.all([
    listSources(project.id).catch(() => [] as Source[]),
    listObjectives(project.id).catch(() => []),
    listSegments(project.id).catch(() => []),
    listActivations(project.id).catch(() => []),
    listMappings(project.id).catch(() => [] as Mapping[]),
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
  const targetCount = new Set(acts.map((a) => a.target)).size;

  // Per-source detail: its data streams (from mappings) + connector catalog info.
  const details: Record<string, SourceDetail> = {};
  for (const s of rows) {
    const streams = maps
      .filter((m) => m.sourceName === s.name)
      .map(streamFromMapping);
    const hit = searchConnectors({ q: s.name, limit: 1 }).connectors[0];
    details[s.name] = {
      streams,
      features: hit?.features ?? [],
      release: hit?.release ?? "",
      desc: hit?.desc ?? `Ingest or federate data from ${s.name}.`,
    };
  }

  return (
    <div>
      {header}
      <IngestionTabs
        projectId={project.id}
        sources={sources}
        objectives={objectives}
        phase={project.phase}
        segmentCount={segs.length}
        targetCount={targetCount}
        openQuestions={[]}
        details={details}
      />
    </div>
  );
}
