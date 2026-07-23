import { Banner, Card, PageHeader } from "@/components/ui";
import { isDbConfigured } from "@/db";
import { getActiveProjectId } from "@/lib/active-project";
import { getProject } from "@/db/queries/projects";
import { listMappings } from "@/db/queries/mappings";
import { getUnification } from "@/db/queries/unifications";
import { listSegments } from "@/db/queries/segments";
import { listObjectives } from "@/db/queries/objectives";
import { providerStatus } from "@/lib/ai/config";
import { designUnification, ID_TYPES } from "@/lib/unification/design";
import { UnificationDesigner } from "./UnificationDesigner";

export const dynamic = "force-dynamic";

export default async function UnificationPage() {
  const header = (
    <PageHeader
      title="Unification"
      sub="A work-backwards identity-resolution design derived from your mapped identity fields."
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
          <strong>Select a project</strong> from the header to design its
          unification.
        </Banner>
      </div>
    );
  }

  const [mappings, saved, segments, objRows] = await Promise.all([
    listMappings(project.id).catch(() => []),
    getUnification(project.id).catch(() => null),
    listSegments(project.id).catch(() => []),
    listObjectives(project.id).catch(() => []),
  ]);

  if (mappings.length === 0) {
    return (
      <div>
        {header}
        <Banner tone="info">
          <strong>No source mappings yet.</strong> Map at least one CSV on the{" "}
          <strong>Data Mapping</strong> tab — the design derives from the
          identity fields you flag there.
        </Banner>
      </div>
    );
  }

  const segTexts = segments.map((s) => s.objective?.trim() || s.name);
  const objectives = objRows.map((o) => o.text);
  const design = designUnification(mappings, objectives, segTexts);

  const savedEnabled: Record<string, boolean> = Object.fromEntries(
    (saved?.matchRules ?? []).map((r) => [r.name, r.enabled]),
  );
  const readyCount = design.segmentReadiness.filter((x) => x.ok).length;

  return (
    <div>
      {header}

      {/* Readiness banner */}
      <Banner tone={readyCount === design.segmentReadiness.length ? "info" : "warn"}>
        <strong>
          Segment readiness: {readyCount}/{design.segmentReadiness.length} covered
        </strong>{" "}
        by this design. Proposed master (reconciliation priority):{" "}
        <span className="font-medium">{design.master}</span> — confirm with the client.
      </Banner>

      {/* Match-rule ladder (interactive) */}
      <Card>
        <UnificationDesigner
          projectId={project.id}
          rules={design.rules}
          savedEnabled={savedEnabled}
          initialNotes={saved?.notes ?? ""}
          ready={providerStatus().ready}
        />
      </Card>

      {/* Identity signal matrix */}
      <Card>
        <h2 className="mb-2 font-semibold">Identity signal matrix</h2>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead>
              <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-semibold">Source</th>
                {ID_TYPES.map((t) => (
                  <th key={t} className="px-3 py-2 font-semibold">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {design.sources.map((s) => (
                <tr key={s.name} className="border-t border-line/60 align-top">
                  <td className="px-3 py-2 font-semibold">{s.name}</td>
                  {ID_TYPES.map((t) => (
                    <td key={t} className="px-3 py-2">
                      {s.types[t].length > 0 ? (
                        <span className="text-emerald-700">
                          ✓{" "}
                          <span className="font-mono text-[11px] text-muted">
                            {s.types[t].join(", ")}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Reconciliation */}
        <Card className="mb-0">
          <h2 className="mb-2 font-semibold">Reconciliation rules (which value wins)</h2>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[420px] text-[13px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-semibold">Attribute</th>
                  <th className="px-3 py-2 font-semibold">Method</th>
                </tr>
              </thead>
              <tbody>
                {design.reconciliation.map((r) => (
                  <tr key={r.attribute} className="border-t border-line/60 align-top">
                    <td className="px-3 py-2 font-medium">{r.attribute}</td>
                    <td className="px-3 py-2">
                      <div>{r.method}</div>
                      <div className="text-[11px] text-muted">{r.rationale}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Scenario checks */}
        <Card className="mb-0">
          <h2 className="mb-2 font-semibold">Scenario checks</h2>
          <ul className="flex flex-col gap-2">
            {design.scenarios.map((s, i) => (
              <li key={i} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800">
                {s}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Segment readiness */}
      <Card>
        <h2 className="mb-2 font-semibold">Segment readiness</h2>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead>
              <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-semibold">Target segment / objective</th>
                <th className="px-3 py-2 font-semibold">Unification requirement</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {design.segmentReadiness.map((x, i) => (
                <tr key={i} className="border-t border-line/60 align-top">
                  <td className="px-3 py-2 font-medium">{x.segment}</td>
                  <td className="px-3 py-2 text-muted">{x.requirement}</td>
                  <td className="px-3 py-2">
                    {x.ok ? (
                      <span className="font-medium text-emerald-700">✓ covered</span>
                    ) : (
                      <span className="font-medium text-red-700">⚠ gap</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
