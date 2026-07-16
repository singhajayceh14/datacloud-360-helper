import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { isDbConfigured } from "@/db";
import { listProjects } from "@/db/queries/projects";
import { getActiveProjectId } from "@/lib/active-project";

export const metadata: Metadata = {
  title: "DataCloud 360 Helper",
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
      /* DB unreachable — sidebar still renders */
    }
  }
  const activeId = await getActiveProjectId();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">
        <div className="grid h-screen grid-cols-[232px_1fr]">
          <Sidebar projects={projects} activeId={activeId} dbReady={dbReady} />
          <main className="overflow-auto px-8 py-7">{children}</main>
        </div>
      </body>
    </html>
  );
}
