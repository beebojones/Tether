// Confirmations belong where the eye already is. These used to render inline at the top
// of the view: on long pages (Settings, Reports) the top is scrolled well out of sight by
// the time you press the button that fires one, so a successful action was indistinguishable
// from a dead button. The .toast-host rule was written for this and never wired up.
import type { ReactNode } from 'react';

export default function Toast({ children, error = false }: { children: ReactNode; error?: boolean }) {
  if (!children) return null;
  return (
    <div className="toast-host">
      <div className={error ? 'toast error' : 'toast'} role="status" aria-live="polite">
        {children}
      </div>
    </div>
  );
}
