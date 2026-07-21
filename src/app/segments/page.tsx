import { Banner, Card, PageHeader, Pill } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { isDbConfigured } from "@/db";
import { getActiveProjectId } from "@/lib/active-project";
import { getProject } from "@/db/queries/projects";
import { listSegments } from "@/db/queries/segments";
import type { Segment } from "@/db/schema";
import { CreateSegmentForm } from "./CreateSegmentForm";
import { SegmentStatus } from "./SegmentStatus";
import { deleteSegmentAction } from "./actions";

export const dynamic = "force-dynamic";

function statusTone(s: string): "ga" | "beta" | "other" {
  if (s === "Active") return "ga";
  if (s === "Paused" || s === "Draft") return "beta";
  return "other";
}

export default async function SegmentsPage() {
  const header = (
    <PageHeader
      title="Segments"
      sub="Build the segment catalog — objective, criteria, DMOs, cadence, channel, and status."
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
          <strong>Select a project</strong> from the sidebar to build its segment
          catalog.
        </Banner>
      </div>
    );
  }

  const segments: Segment[] = await listSegments(project.id).catch(() => []);

  return (
    <div>
      {header}

      <Card>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-semibold">New segment</h2>
          <Pill tone="other">{project.name}</Pill>
        </div>
        <CreateSegmentForm projectId={project.id} />
      </Card>

      <h2 className="mb-2 mt-6 font-semibold">
        Segment catalog{" "}
        <span className="font-normal text-muted">({segments.length})</span>
      </h2>
      {segments.length === 0 && (
        <p className="text-muted">No segments yet — add one above.</p>
      )}

      <Stagger className="flex flex-col gap-2.5">
        {segments.map((s) => (
          <StaggerItem key={s.id}>
          <Card className="mb-0">
            <div className="flex items-start gap-3">
              <div className="grow">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{s.name}</span>
                  <Pill tone={statusTone(s.status)}>{s.status}</Pill>
                  {s.channel && (
                    <span className="text-[12px] text-muted">· {s.channel}</span>
                  )}
                  <span className="text-[12px] text-muted">· {s.cadence}</span>
                </div>
                {s.objective && (
                  <div className="mt-1 text-[13px]">{s.objective}</div>
                )}
                {s.criteria && (
                  <div className="mt-1 text-[12px] text-muted">
                    <span className="font-medium">Criteria:</span> {s.criteria}
                  </div>
                )}
                {(s.dmos || s.calculatedInsights) && (
                  <div className="mt-1 flex flex-wrap gap-x-4 text-[12px] text-muted">
                    {s.dmos && (
                      <span>
                        <span className="font-medium">DMOs:</span> {s.dmos}
                      </span>
                    )}
                    {s.calculatedInsights && (
                      <span>
                        <span className="font-medium">CI:</span>{" "}
                        {s.calculatedInsights}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <SegmentStatus id={s.id} status={s.status} />
                <form action={deleteSegmentAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] text-muted hover:border-red-300 hover:text-red-700"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          </Card>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
