"use client";

/**
 * Root error boundary — catches failures in the layout itself (where the
 * segment `error.tsx` can't run). Must render its own <html>/<body>.
 */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#f7f8fa",
          color: "#0f172a",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
        }}
      >
        <div style={{ maxWidth: 480, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            The app failed to load
          </h1>
          <p style={{ color: "#64748b", marginBottom: 16 }}>
            A top-level error occurred. Reloading usually recovers.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#386aff",
              color: "#fff",
              border: 0,
              borderRadius: 8,
              padding: "10px 16px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
