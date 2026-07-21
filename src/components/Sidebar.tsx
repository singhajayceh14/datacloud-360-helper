"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { motion } from "framer-motion";
import { TABS } from "@/lib/tabs";
import { Stagger, StaggerItem } from "@/components/motion";
import { Select } from "@/components/Select";
import { setActiveProject } from "@/app/actions/active-project";

const MotionLink = motion.create(Link);

type Opt = { id: string; name: string };

export default function Sidebar({
  projects,
  activeId,
  dbReady,
}: {
  projects: Opt[];
  activeId: string | null;
  dbReady: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSelect(id: string) {
    startTransition(async () => {
      await setActiveProject(id);
      router.refresh();
    });
  }

  return (
    <aside className="flex flex-col gap-1 overflow-auto bg-sidebar px-2.5 py-3.5 text-slate-200">
      <div className="px-2.5 pb-3 pt-1.5 text-[15px] font-bold tracking-wide">
        Data 360 <span className="text-brand">App</span>
      </div>

      <Select
        ariaLabel="Active project"
        className="mb-2.5"
        value={activeId ?? ""}
        disabled={!dbReady || pending}
        onChange={(v) => onSelect(v)}
        options={[
          {
            value: "",
            label: dbReady ? "— no project —" : "— database not connected —",
          },
          ...projects.map((p) => ({ value: p.id, label: p.name })),
        ]}
        triggerClassName="flex w-full items-center justify-between gap-2 rounded-lg border border-sidebar-border bg-sidebar-input px-2.5 py-2 text-left text-[13px] text-slate-200 outline-none transition-colors hover:border-slate-500 disabled:opacity-70"
      />

      <Stagger className="flex flex-col gap-1">
        {TABS.map((t) => {
          const active =
            pathname === t.href ||
            (t.href !== "/projects" && pathname.startsWith(t.href));
          return (
            <StaggerItem key={t.id}>
              <MotionLink
                href={t.href}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  active
                    ? "text-white"
                    : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-brand"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10 w-4 text-center">{t.icon}</span>
                <span className="relative z-10">{t.label}</span>
              </MotionLink>
            </StaggerItem>
          );
        })}
      </Stagger>

      <div className="mt-auto px-2.5 py-2.5 text-[11px] text-slate-500">
        {dbReady ? "Supabase: connected" : "Supabase: not connected"}
      </div>
    </aside>
  );
}
