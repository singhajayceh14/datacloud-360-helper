import { Banner, PageHeader } from "@/components/ui";
import { isDbConfigured } from "@/db";
import { getActiveProjectId } from "@/lib/active-project";
import { getProject } from "@/db/queries/projects";
import { listActivations } from "@/db/queries/activations";
import { listActivationTargets } from "@/db/queries/activation-targets";
import { listSegments } from "@/db/queries/segments";
import { activationWarnings } from "@/lib/activation/warnings";
import { providerStatus } from "@/lib/ai/config";
import {
  ActivationTabs,
  type ActLite,
  type TgtLite,
  type SegLite,
} from "./ActivationTabs";

export const dynamic = "force-dynamic";

export default async function ActivationPage() {
  const header = (
    <PageHeader
      title="Activation"
      sub="Register targets and plan activations — with refresh-chain and consent checks."
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
          <strong>Select a project</strong> from the header to plan its
          activations.
        </Banner>
      </div>
    );
  }

  const [actRows, tgtRows, segRows] = await Promise.all([
    listActivations(project.id).catch(() => []),
    listActivationTargets(project.id).catch(() => []),
    listSegments(project.id).catch(() => []),
  ]);

  const segmentById = new Map(segRows.map((s) => [s.id, s]));
  const warnings = actRows.flatMap((a) =>
    activationWarnings(a, segmentById.get(a.segmentId)).map((w) => w.message),
  );

  const activations: ActLite[] = actRows.map((a) => ({
    id: a.id,
    segmentId: a.segmentId,
    target: a.target,
    cadence: a.cadence,
    status: a.status,
    contactPoints: a.contactPoints,
    relatedAttributes: a.relatedAttributes,
    consentBasis: a.consentBasis,
  }));
  const targets: TgtLite[] = tgtRows.map((t) => ({
    id: t.id,
    name: t.name,
    type: t.type,
    notes: t.notes,
  }));
  const segments: SegLite[] = segRows.map((s) => ({ id: s.id, name: s.name }));

  return (
    <div>
      {header}
      <ActivationTabs
        projectId={project.id}
        activations={activations}
        targets={targets}
        segments={segments}
        warnings={warnings}
        ready={providerStatus().ready}
      />
    </div>
  );
}
