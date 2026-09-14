export default function LoadingSkeleton({ label = 'Loading work data' }: { label?: string }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-panel" />
      <div className="skeleton skeleton-row" />
      <div className="skeleton skeleton-row" />
    </div>
  );
}
