import { Banner, PageHeader } from "@/components/ui";
import { isDbConfigured } from "@/db";
import { getActiveProjectId } from "@/lib/active-project";
import { getProject } from "@/db/queries/projects";
import { getEntitlement } from "@/db/queries/entitlements";
import { EntitlementsTabs, type Caps } from "./EntitlementsTabs";

export const dynamic = "force-dynamic";

export default async function EntitlementsPage() {
  const header = (
    <PageHeader
      title="Entitlements"
      sub="Capture the order-form licence, then size credit consumption against it."
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
          entitlements.
        </Banner>
      </div>
    );
  }

  const row = await getEntitlement(project.id).catch(() => null);
  const caps: Caps = {
    dataServicesCredits: row?.dataServicesCredits ?? 0,
    sandboxCredits: row?.sandboxCredits ?? 0,
    flexCredits: row?.flexCredits ?? 0,
    dataStorageTb: row?.dataStorageTb ?? 0,
    contractStart: row?.contractStart ?? "",
    orderEndDate: row?.orderEndDate ?? "",
    notes: row?.notes ?? "",
  };
  const calcEnv = row?.calcEnv === "sand" ? "sand" : "prod";
  const volumes = row?.volumes ?? {};

  return (
    <div>
      {header}
      <EntitlementsTabs
        projectId={project.id}
        caps={caps}
        calcEnv={calcEnv}
        volumes={volumes}
      />
    </div>
  );
}
