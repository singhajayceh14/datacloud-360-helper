import { Banner, Card, PageHeader, Pill } from "@/components/ui";
import { isDbConfigured } from "@/db";
import { getActiveProjectId } from "@/lib/active-project";
import { getProject } from "@/db/queries/projects";
import { getEntitlement } from "@/db/queries/entitlements";
import { DEFAULT_LINES } from "@/lib/entitlements/calc";
import { EntitlementEditor, type InitialCaps } from "./EntitlementEditor";

export const dynamic = "force-dynamic";

export default async function EntitlementsPage() {
  const header = (
    <PageHeader
      title="Entitlements"
      sub="Capture the order-form caps and run the consumption calculator against them."
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
          <strong>Select a project</strong> from the sidebar to plan its
          entitlements.
        </Banner>
      </div>
    );
  }

  const row = await getEntitlement(project.id).catch(() => null);

  const initialCaps: InitialCaps = {
    dataServicesCredits: row?.dataServicesCredits ?? 0,
    sandboxCredits: row?.sandboxCredits ?? 0,
    flexCredits: row?.flexCredits ?? 0,
    dataStorageTb: row?.dataStorageTb ?? 0,
    contractStart: row?.contractStart ?? "",
    orderEndDate: row?.orderEndDate ?? "",
    notes: row?.notes ?? "",
  };
  const initialLines =
    row && row.lineItems.length > 0 ? row.lineItems : DEFAULT_LINES;

  return (
    <div>
      {header}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="font-semibold">Order form &amp; consumption</h2>
          <Pill tone="other">{project.name}</Pill>
          {!row && <Pill tone="beta">starter rate card</Pill>}
        </div>
        <EntitlementEditor
          projectId={project.id}
          initialCaps={initialCaps}
          initialLines={initialLines}
        />
      </Card>
    </div>
  );
}
