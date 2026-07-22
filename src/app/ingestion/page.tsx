import { Banner, Card, PageHeader, Pill } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { isDbConfigured } from "@/db";
import { getActiveProjectId } from "@/lib/active-project";
import { getProject } from "@/db/queries/projects";
import { listSources } from "@/db/queries/sources";
import type { Source } from "@/db/schema";
import { connectorCount } from "@/lib/connectors";
import { ConnectorSearch } from "./ConnectorSearch";
import { CreateSourceForm } from "./CreateSourceForm";
import { SourceStatus } from "./SourceStatus";
import { deleteSourceAction } from "./actions";

export const dynamic = "force-dynamic";

function statusTone(s: string): "ga" | "beta" | "other" {
  if (s === "Live") return "ga";
  if (s === "Proposed" || s === "In progress") return "beta";
  return "other"; // Blocked
}

export default async function IngestionPage() {
  const count = connectorCount();
  const dbReady = isDbConfigured();
  const activeId = dbReady ? await getActiveProjectId() : null;
  const project = activeId ? await getProject(activeId).catch(() => null) : null;
  const sources: Source[] = project
    ? await listSources(project.id).catch(() => [])
    : [];

  return (
    <div>
      <PageHeader
        title="Ingestion"
        sub="Search the connector catalog and build the per-project source inventory."
      />

      <Stagger>
        {/* Connector catalog — reference, always available */}
        <StaggerItem>
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="font-semibold">Connector catalog</h2>
              <Pill tone="ga">{count} connectors</Pill>
            </div>
            <ConnectorSearch />
          </Card>
        </StaggerItem>

        {/* Source inventory — per project */}
        <StaggerItem>
          <Card>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">Source inventory</h2>
              {project && <Pill tone="other">{project.name}</Pill>}
              {project && (
                <Pill tone="ga">
                  {sources.length} source{sources.length === 1 ? "" : "s"}
                </Pill>
              )}
            </div>

            {!dbReady ? (
              <Banner tone="info">
                <strong>Database not connected.</strong> Add{" "}
                <code className="rounded bg-white/60 px-1">DATABASE_URL</code> and
                run{" "}
                <code className="rounded bg-white/60 px-1">
                  npm run db:migrate
                </code>
                .
              </Banner>
            ) : !project ? (
              <Banner tone="info">
                <strong>Select a project</strong> from the sidebar to build its
                source inventory.
              </Banner>
            ) : (
              <>
                <CreateSourceForm projectId={project.id} />

                {sources.length === 0 && (
                  <p className="mt-4 text-muted">
                    No sources yet — add the systems you&apos;ll ingest above.
                  </p>
                )}

                <div className="mt-4 flex flex-col gap-2">
                  {sources.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start gap-3 rounded-[10px] border border-line bg-white px-4 py-3 transition-colors hover:border-indigo-200"
                    >
                      <div className="grow">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{s.name}</span>
                          <Pill tone={statusTone(s.status)}>{s.status}</Pill>
                          {s.method && (
                            <span className="text-[12px] text-muted">
                              · {s.method}
                            </span>
                          )}
                          <span className="text-[12px] text-muted">
                            · {s.frequency}
                          </span>
                        </div>
                        {s.entities && (
                          <div className="mt-1 text-[12px] text-muted">
                            <span className="font-medium">Entities:</span>{" "}
                            {s.entities}
                          </div>
                        )}
                        {s.notes && (
                          <div className="mt-1 text-[12px] text-muted">
                            {s.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <SourceStatus id={s.id} status={s.status} />
                        <form action={deleteSourceAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:border-red-300 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </StaggerItem>
      </Stagger>
    </div>
  );
}
