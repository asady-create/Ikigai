export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-md space-y-3 py-10 text-center">
      <p className="font-display text-2xl font-semibold tracking-tight">
        You’re offline
      </p>
      <p className="text-sm text-[var(--muted)]">
        This page was not cached yet. Open it once while online, then it will
        be available without a network.
      </p>
    </div>
  );
}
