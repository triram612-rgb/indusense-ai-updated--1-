import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="readout text-4xl font-medium text-edge">404</p>
      <h1 className="mt-3 text-sm font-medium text-ink">No panel at this address</h1>
      <p className="mt-1.5 max-w-[46ch] text-xs leading-relaxed text-ink-muted">
        The route does not exist in this build. Pick a layer from the sidebar, or go back to the shift view.
      </p>
      <Link
        to="/dashboard"
        className="mt-4 rounded-sm border border-signal/40 bg-signal-wash px-3 py-1.5 text-xs font-medium text-signal-bright hover:border-signal"
      >
        Open Command Center
      </Link>
    </div>
  );
}
