import { ReactNode } from "react";

/** Page title + subtitle, matching the reference's `.h1` / `.sub`. */
export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="mb-5">
      <h1 className="text-xl font-bold">{title}</h1>
      {sub && <p className="mt-0.5 text-muted">{sub}</p>}
    </header>
  );
}

/** Rounded, hairline-bordered panel — the reference's `.card`. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mb-4 rounded-xl border border-line bg-panel p-[18px] ${className}`}
    >
      {children}
    </div>
  );
}

type BannerTone = "info" | "warn";

/** Inline notice — the reference's `.banner`. */
export function Banner({
  tone = "info",
  children,
}: {
  tone?: BannerTone;
  children: ReactNode;
}) {
  const tones: Record<BannerTone, string> = {
    info: "bg-info-bg text-info border-blue-200",
    warn: "bg-warn-bg text-warn border-amber-200",
  };
  return (
    <div className={`mb-4 rounded-[10px] border px-3.5 py-3 text-[13px] ${tones[tone]}`}>
      {children}
    </div>
  );
}

type PillTone = "ga" | "beta" | "other";

/** GA / Beta / other status pill — the reference's `.pill`. */
export function Pill({
  children,
  tone = "other",
}: {
  children: ReactNode;
  tone?: PillTone;
}) {
  const tones: Record<PillTone, string> = {
    ga: "bg-ok-bg text-ok",
    beta: "bg-warn-bg text-warn",
    other: "bg-slate-200 text-slate-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Dashed placeholder for tabs not yet built — the reference's `.stub`. */
export function Stub({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-line p-9 text-center text-muted">
      <div className="mb-1 font-semibold text-ink">{title}</div>
      <p className="mx-auto max-w-md">{blurb}</p>
      <div className="mt-3">
        <Pill tone="beta">Coming in a later phase</Pill>
      </div>
    </div>
  );
}
