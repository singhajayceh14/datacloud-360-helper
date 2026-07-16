import { Banner, Card, PageHeader, Pill } from "@/components/ui";
import { isDbConfigured } from "@/db";
import { getActiveProjectId } from "@/lib/active-project";
import { getProject } from "@/db/queries/projects";
import { listSegments } from "@/db/queries/segments";
import { listActivations } from "@/db/queries/activations";
import { activationWarnings } from "@/lib/activation/warnings";
import type { Activation, Segment } from "@/db/schema";
import { CreateActivationForm } from "./CreateActivationForm";
import { ActivationStatus } from "./ActivationStatus";
import { deleteActivationAction } from "./actions";

export const dynamic = "force-dynamic";

function statusTone(s: string): "ga" | "beta" | "other" {
  if (s === "Active") return "ga";
  if (s === "Paused" || s === "Draft") return "beta";
  return "other";
}

export default async function ActivationPage() {
  const header = (
    <PageHeader
      title="Activation"
      sub="Publish segments to destinations — with cadence-vs-segment and consent checks."
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
          <strong>Select a project</strong> from the sidebar to build its
          activation plan.
        </Banner>
      </div>
    );
  }

  const segments: Segment[] = await listSegments(project.id).catch(() => []);
  if (segments.length === 0) {
    return (
      <div>
        {header}
        <Banner tone="info">
          <strong>No segments yet.</strong> Build a segment on the{" "}
          <strong>Segments</strong> tab first — activations publish a segment to
          a destination.
        </Banner>
      </div>
    );
  }

  const activations: Activation[] = await listActivations(project.id).catch(
    () => [],
  );
  const segmentById = new Map(segments.map((s) => [s.id, s]));

  // Portfolio-level warning count for the header banner.
  const totalWarnings = activations.reduce(
    (n, a) => n + activationWarnings(a, segmentById.get(a.segmentId)).length,
    0,
  );

  return (
    <div>
      {header}

      {totalWarnings > 0 && (
        <Banner tone="warn">
          <strong>
            {totalWarnings} activation{totalWarnings === 1 ? "" : "s"} warning
            {totalWarnings === 1 ? "" : "s"}
          </strong>{" "}
          — review cadence and consent flags below before publishing.
        </Banner>
      )}

      <Card>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-semibold">New activation</h2>
          <Pill tone="other">{project.name}</Pill>
        </div>
        <CreateActivationForm
          projectId={project.id}
          segments={segments.map((s) => ({ id: s.id, name: s.name }))}
        />
      </Card>

      <h2 className="mb-2 mt-6 font-semibold">
        Activation plan{" "}
        <span className="font-normal text-muted">({activations.length})</span>
      </h2>
      {activations.length === 0 && (
        <p className="text-muted">No activations yet — add one above.</p>
      )}

      <div className="flex flex-col gap-2.5">
        {activations.map((a) => {
          const segment = segmentById.get(a.segmentId);
          const warnings = activationWarnings(a, segment);
          return (
            <Card key={a.id} className="mb-0">
              <div className="flex items-start gap-3">
                <div className="grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {segment?.name ?? "—"}
                    </span>
                    <span className="text-muted">→</span>
                    <span className="font-medium">{a.target}</span>
                    <Pill tone={statusTone(a.status)}>{a.status}</Pill>
                    {a.channel && (
                      <span className="text-[12px] text-muted">
                        · {a.channel}
                      </span>
                    )}
                    <span className="text-[12px] text-muted">
                      · {a.cadence}
                    </span>
                  </div>
                  {a.consentBasis && (
                    <div className="mt-1 text-[12px] text-muted">
                      <span className="font-medium">Consent:</span>{" "}
                      {a.consentBasis}
                    </div>
                  )}
                  {warnings.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1">
                      {warnings.map((w, i) => (
                        <li
                          key={i}
                          className="rounded-md bg-amber-50 px-2 py-1 text-[12px] text-amber-800"
                        >
                          ⚠ {w.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <ActivationStatus id={a.id} status={a.status} />
                  <form action={deleteActivationAction}>
                    <input type="hidden" name="id" value={a.id} />
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
          );
        })}
      </div>
    </div>
  );
}
