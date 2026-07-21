import { Banner, Card, PageHeader } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { isDbConfigured } from "@/db";
import { getActiveProjectId } from "@/lib/active-project";
import { getProject } from "@/db/queries/projects";
import { listMappings } from "@/db/queries/mappings";
import { getUnification } from "@/db/queries/unifications";
import { deriveUnification } from "@/lib/unification/derive";
import { UnificationDesigner } from "./UnificationDesigner";

export const dynamic = "force-dynamic";

export default async function UnificationPage() {
  const header = (
    <PageHeader
      title="Unification"
      sub="Derive the identity-resolution match ladder from your mapping identity fields."
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
          <strong>Select a project</strong> from the sidebar to design its
          unification.
        </Banner>
      </div>
    );
  }

  const mappings = await listMappings(project.id).catch(() => []);
  if (mappings.length === 0) {
    return (
      <div>
        {header}
        <Banner tone="info">
          <strong>No source mappings yet.</strong> Add at least one CSV mapping
          on the <strong>Data Mapping</strong> tab — the match ladder is derived
          from the identity fields you flag there.
        </Banner>
      </div>
    );
  }

  const derived = deriveUnification(mappings);
  const saved = await getUnification(project.id).catch(() => null);

  return (
    <div>
      {header}

      <Banner tone={derived.readiness.ready ? "info" : "warn"}>
        <strong>
          Segment readiness: {derived.readiness.ready ? "Ready ✓" : "Not ready"}
        </strong>
        <br />
        <span className="text-[12px] opacity-90">{derived.readiness.reason}</span>
      </Banner>

      {derived.warnings.length > 0 && (
        <Card>
          <h2 className="mb-2 font-semibold">Scenario checks</h2>
          <Stagger className="flex flex-col gap-2">
            {derived.warnings.map((w, i) => (
              <StaggerItem
                key={i}
                className="rounded-[10px] border border-amber-200 bg-warn-bg px-3.5 py-2.5 text-[13px] text-warn"
              >
                {w.text}
              </StaggerItem>
            ))}
          </Stagger>
        </Card>
      )}

      <Card>
        <UnificationDesigner
          projectId={project.id}
          initialRules={saved?.matchRules ?? derived.matchRules}
          initialNotes={saved?.notes ?? ""}
          suggested={derived.matchRules}
        />
      </Card>
    </div>
  );
}
