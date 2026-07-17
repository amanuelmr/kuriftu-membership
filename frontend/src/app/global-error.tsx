'use client'

// Catches errors thrown in the root layout itself (where the normal error.tsx
// boundary can't reach). Must render its own <html>/<body>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem", padding: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Something went wrong</h1>
        <p style={{ color: "#666", maxWidth: "28rem" }}>
          The application ran into an unexpected error. Please try again.
        </p>
        <button
          onClick={reset}
          style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "1px solid #ccc", cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
