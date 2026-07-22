"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { TABS } from "@/lib/tabs";

const MotionLink = motion.create(Link);

/** Which tab shows a count badge, and which count feeds it. */
const BADGE: Record<string, keyof Counts> = {
  canvas: "gaps",
  ingestion: "sources",
  mapping: "mappings",
  segments: "segments",
  activation: "activations",
};

export type Counts = {
  sources: number;
  mappings: number;
  segments: number;
  activations: number;
  gaps: number;
};

export default function TabBar({ counts }: { counts: Counts | null }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-line bg-canvas px-4">
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        const badgeKey = BADGE[t.id];
        const count = counts && badgeKey ? counts[badgeKey] : undefined;
        return (
          <MotionLink
            key={t.id}
            href={t.href}
            whileTap={{ scale: 0.97 }}
            className={`relative flex items-center gap-2 whitespace-nowrap px-3 py-3 text-[14px] transition-colors ${
              active
                ? "font-semibold text-ink"
                : "text-muted hover:text-ink"
            }`}
          >
            <span>{t.label}</span>
            {count !== undefined && (
              <span
                className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold ${
                  badgeKey === "gaps" && count > 0
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {count}
              </span>
            )}
            {active && (
              <motion.span
                layoutId="tabbar-active"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </MotionLink>
        );
      })}
    </nav>
  );
}
