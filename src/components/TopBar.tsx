"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Select } from "@/components/Select";
import { setActiveProject } from "@/app/actions/active-project";
import { quickCreateProjectAction } from "@/app/actions/console";
import { duplicateProjectAction } from "@/app/canvas/actions";

type Opt = { id: string; name: string };

const btn =
  "flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-brand disabled:opacity-50";

export default function TopBar({
  projects,
  activeId,
  activeName,
  dbReady,
}: {
  projects: Opt[];
  activeId: string | null;
  activeName: string | null;
  dbReady: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSelect(id: string) {
    startTransition(async () => {
      await setActiveProject(id);
      router.refresh();
    });
  }

  return (
    <header className="border-b border-line bg-panel px-5 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {/* Logo / title */}
        <Link href="/canvas" className="flex items-center gap-2 whitespace-nowrap">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-[13px] font-bold text-white">
            D
          </span>
          <span className="text-[16px] font-semibold text-ink">
            Data 360 <span className="font-bold text-brand">Console</span>
          </span>
        </Link>

        {/* Project picker */}
        <Select
          ariaLabel="Active project"
          className="min-w-[220px]"
          value={activeId ?? ""}
          disabled={!dbReady || pending}
          onChange={onSelect}
          options={[
            {
              value: "",
              label: dbReady ? "— no project —" : "— database not connected —",
            },
            ...projects.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />

        {/* New client + Create */}
        <form action={quickCreateProjectAction} className="flex items-center gap-2">
          <input
            name="name"
            placeholder="New client name…"
            disabled={!dbReady}
            className="w-40 rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] outline-none focus:border-brand disabled:opacity-50"
          />
          <CreateButton />
        </form>

        {/* Action buttons */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => router.refresh()} className={btn}>
            ↻ Refresh
          </button>
          <a href="/api/brd/export?format=docx" className={btn}>
            ↓ BRD
          </a>
          <a href="/api/brd/export?format=md" className={btn}>
            ↓ SDD
          </a>
          {activeId && (
            <form action={duplicateProjectAction}>
              <input type="hidden" name="id" value={activeId} />
              <ScenarioButton />
            </form>
          )}
          <button type="button" className={`${btn} opacity-60`} title="Coming soon">
            ⤴ Deploy pack
          </button>
          <a href="/settings" className={btn} title="Settings & feedback">
            💬 Feedback
          </a>
          <Link href="/projects" className={btn} title="Manage projects">
            ▦
          </Link>
          <Link href="/settings" className={btn} title="Settings">
            ⚙
          </Link>
        </div>
      </div>

      {activeName && (
        <div className="mt-1 text-right text-[12px] text-muted">
          Project: <span className="font-medium text-ink">{activeName}</span>
        </div>
      )}
    </header>
  );
}

function CreateButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
    >
      {pending ? "Creating…" : "Create"}
    </button>
  );
}

function ScenarioButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btn}>
      {pending ? "Forking…" : "⤴ Scenario"}
    </button>
  );
}
