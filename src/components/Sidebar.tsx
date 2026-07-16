"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TABS } from "@/lib/tabs";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col gap-1 overflow-auto bg-sidebar px-2.5 py-3.5 text-slate-200">
      <div className="px-2.5 pb-3 pt-1.5 text-[15px] font-bold tracking-wide">
        Data 360 <span className="text-brand">App</span>
      </div>

      {/* Project selector — wired to Supabase/Postgres in Phase 1 */}
      <select
        aria-label="Active project"
        defaultValue=""
        disabled
        className="mb-2.5 w-full rounded-lg border border-sidebar-border bg-sidebar-input px-2 py-2 text-slate-300 disabled:opacity-70"
      >
        <option value="">— no project —</option>
      </select>

      <nav className="flex flex-col gap-1">
        {TABS.map((t) => {
          const active =
            pathname === t.href ||
            (t.href !== "/projects" && pathname.startsWith(t.href));
          return (
            <Link
              key={t.id}
              href={t.href}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                active
                  ? "bg-brand text-white"
                  : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
              }`}
            >
              <span className="w-4 text-center">{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2.5 py-2.5 text-[11px] text-slate-500">
        Phase 0 · shell scaffolded
        <br />
        Supabase: not connected
      </div>
    </aside>
  );
}
