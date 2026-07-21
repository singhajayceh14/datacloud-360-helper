import { Banner, Card, PageHeader, Pill } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { isDbConfigured } from "@/db";
import { listProjects } from "@/db/queries/projects";
import type { Project } from "@/db/schema";
import { CreateProjectForm } from "./CreateProjectForm";
import { DeleteProjectButton } from "./DeleteProjectButton";

// Always reflect the latest DB state.
export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export default async function ProjectsPage() {
  const configured = isDbConfigured();

  let projects: Project[] = [];
  let loadError: string | null = null;

  if (configured) {
    try {
      projects = await listProjects();
    } catch (e) {
      loadError = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        sub="Each project designs one Salesforce Data Cloud 360 implementation end to end."
      />

      {!configured && (
        <Banner tone="info">
          <strong>Database not connected yet.</strong> Add your Supabase{" "}
          <code className="rounded bg-white/60 px-1">DATABASE_URL</code> to{" "}
          <code className="rounded bg-white/60 px-1">.env.local</code>, then run{" "}
          <code className="rounded bg-white/60 px-1">npm run db:migrate</code> and
          restart the dev server.
        </Banner>
      )}

      {configured && loadError && (
        <Banner tone="warn">
          <strong>Couldn&apos;t reach the database.</strong> Check{" "}
          <code className="rounded bg-white/60 px-1">DATABASE_URL</code> and make
          sure you&apos;ve run{" "}
          <code className="rounded bg-white/60 px-1">npm run db:migrate</code>.
          <br />
          <span className="text-[12px] opacity-80">{loadError}</span>
        </Banner>
      )}

      <Card>
        <CreateProjectForm disabled={!configured} />
      </Card>

      {configured && !loadError && projects.length === 0 && (
        <p className="text-muted">No projects yet — create one above.</p>
      )}

      <Stagger className="flex flex-col gap-2.5">
        {projects.map((p) => (
          <StaggerItem
            key={p.id}
            className="flex items-center gap-3 rounded-[10px] border border-line bg-white px-4 py-3 transition-colors hover:border-indigo-200"
          >
            <div className="grow">
              <div className="flex items-center gap-2 font-semibold">
                {p.name}
                {p.status !== "active" && (
                  <Pill tone="other">{p.status}</Pill>
                )}
              </div>
              <div className="text-[12px] text-muted">{p.client || "—"}</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] text-muted">
                Phase {p.phase || "—"}
              </div>
              <div className="text-[12px] text-muted">{p.edition || ""}</div>
            </div>
            <div className="text-[12px] text-muted">
              {fmtDate(p.updatedAt)}
            </div>
            <DeleteProjectButton id={p.id} name={p.name} />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
