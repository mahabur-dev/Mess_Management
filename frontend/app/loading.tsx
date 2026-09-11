export default function Loading() {
  return (
    <main className="messzen-site-loader" role="status" aria-live="polite" aria-label="Loading Messzen">
      <span className="messzen-site-loader__word" aria-hidden="true">Messzen</span>
      <span className="sr-only">Loading Messzen</span>
    </main>
  )
}
