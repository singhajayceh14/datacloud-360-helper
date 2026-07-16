"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] text-ink hover:border-brand"
    >
      Print / Save as PDF
    </button>
  );
}
