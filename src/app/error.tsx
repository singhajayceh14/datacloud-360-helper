"use client";

import { useEffect } from "react";

/**
 * Segment-level error boundary. Catches render/data errors in any page and
 * offers a retry (re-runs the failed server render) without a full reload.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in the server/terminal log during local dev.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="mb-2 text-2xl font-bold">Something went wrong</div>
      <p className="mb-1 text-muted">
        This tab hit an error while loading. It&apos;s often a database or API
        hiccup — retrying usually clears it.
      </p>
      {error.digest && (
        <p className="mb-4 text-[12px] text-muted">
          Reference: <code className="rounded bg-slate-100 px-1">{error.digest}</code>
        </p>
      )}
      <div className="mt-4 flex justify-center gap-2">
        <button
          onClick={reset}
          className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-hover"
        >
          Try again
        </button>
        <a
          href="/projects"
          className="rounded-lg border border-line bg-white px-4 py-2 font-semibold text-ink hover:border-brand"
        >
          Back to Projects
        </a>
      </div>
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-6 overflow-x-auto rounded-lg bg-slate-900 p-3 text-left text-[12px] text-slate-100">
          {error.message}
        </pre>
      )}
    </div>
  );
}
