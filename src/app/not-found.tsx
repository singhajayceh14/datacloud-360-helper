import Link from "next/link";

/** 404 for unknown routes and `notFound()` calls. */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="mb-1 text-4xl font-bold">404</div>
      <p className="mb-4 text-muted">
        That page doesn&apos;t exist. Pick a tab from the sidebar, or head back
        to your projects.
      </p>
      <Link
        href="/projects"
        className="inline-block rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-hover"
      >
        Back to Projects
      </Link>
    </div>
  );
}
