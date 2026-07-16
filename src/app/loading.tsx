/** Route-level loading fallback — shown while a server page streams in. */
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-5">
        <div className="h-6 w-48 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-80 rounded bg-slate-100" />
      </div>
      <div className="mb-4 h-32 rounded-xl border border-line bg-slate-50" />
      <div className="mb-2.5 h-20 rounded-xl border border-line bg-slate-50" />
      <div className="h-20 rounded-xl border border-line bg-slate-50" />
    </div>
  );
}
