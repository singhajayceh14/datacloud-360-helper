import type { Metadata } from "next";
import "./globals.css";
import TopBar from "@/components/TopBar";
import TabBar from "@/components/TabBar";
import ChatPanel from "@/components/ChatPanel";
import { AnimatedMain } from "@/components/motion";
import { isDbConfigured } from "@/db";
import { listProjects } from "@/db/queries/projects";
import { getProjectCounts } from "@/db/queries/counts";
import { getActiveProjectId } from "@/lib/active-project";
import { providerStatus } from "@/lib/ai/config";

export const metadata: Metadata = {
  title: "Data 360 Console",
  description:
    "Design Salesforce Data Cloud 360 implementations end to end — sources, mappings, unification, segments, activation, entitlements, and the BRD/SDD.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dbReady = isDbConfigured();
  let projects: { id: string; name: string }[] = [];
  if (dbReady) {
    try {
      projects = (await listProjects()).map((p) => ({ id: p.id, name: p.name }));
    } catch {
      /* DB unreachable — header still renders */
    }
  }
  const activeId = await getActiveProjectId();
  const activeName = projects.find((p) => p.id === activeId)?.name ?? null;
  const counts =
    dbReady && activeId
      ? await getProjectCounts(activeId).catch(() => null)
      : null;
  const ai = providerStatus();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">
        <div className="flex h-screen flex-col">
          <TopBar
            projects={projects}
            activeId={activeId}
            activeName={activeName}
            dbReady={dbReady}
          />
          <TabBar counts={counts} />
          <div className="flex min-h-0 flex-1">
            <AnimatedMain>{children}</AnimatedMain>
          </div>
        </div>
        <ChatPanel
          projectName={activeName}
          ready={ai.ready}
          provider={ai.active}
        />
      </body>
    </html>
  );
}
