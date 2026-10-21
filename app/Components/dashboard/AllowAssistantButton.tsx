'use client';

import { useState } from 'react';
import { setAgentAccess } from '../../lib/agentAccessApi';

/** Where something is blocked until the assistant may read the project, the fix is one click right there. */
export function AllowAssistantButton({ projectId, onAllowed }: { projectId: string; onAllowed: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            await setAgentAccess(projectId, { default: 'allow' });
            onAllowed();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not change it.');
          } finally {
            setBusy(false);
          }
        }}
        className="btn-secondary text-xs disabled:opacity-50"
      >
        {busy ? 'Allowing…' : 'Allow the assistant to read this project'}
      </button>
      {error ? <span role="alert" className="text-xs text-[var(--danger)]">{error}</span> : null}
    </span>
  );
}
