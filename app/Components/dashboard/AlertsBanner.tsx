'use client';

import { useEffect, useState } from 'react';
import { IconBell } from '@tabler/icons-react';
import { listAlerts, type ProjectAlert } from '../../lib/alertsApi';

/** New alerts, shown where the numbers are, so the dashboard itself tells you when something crossed a line. */
export function AlertsBanner({ projectId, refreshKey, onOpen }: { projectId: string; refreshKey: number; onOpen: () => void }) {
  const [alerts, setAlerts] = useState<ProjectAlert[]>([]);
  useEffect(() => {
    let cancelled = false;
    listAlerts(projectId).then((a) => !cancelled && setAlerts(a.alerts.filter((x) => !x.read))).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [projectId, refreshKey]);
  if (!alerts.length) return null;
  const top = alerts[0];
  return (
    <button type="button" onClick={onOpen} className="mb-4 flex w-full items-start gap-3 rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-left" aria-label={`${alerts.length} new alerts. Open alerts`}>
      <IconBell size={16} className="mt-0.5 shrink-0 text-[var(--danger)]" />
      <span className="min-w-0 text-xs">
        <span className="block font-medium text-[var(--text-primary)]">{alerts.length === 1 ? top.title : `${alerts.length} new alerts — latest: ${top.title}`}</span>
        <span className="mt-0.5 block text-[var(--text-secondary)]">{top.detail}</span>
      </span>
    </button>
  );
}
