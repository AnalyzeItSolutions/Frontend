'use client';

import type { WidgetSpec } from '../../lib/chatApi';
import { SandboxedWidgetRenderer } from './WidgetRenderer';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';

/** The widgets of a shared project, read only: no edit, move or delete controls are passed in. */
export function SharedDashboard({ widgets }: { widgets: WidgetSpec[] }) {
  if (widgets.length === 0) {
    return <p className="mt-8 text-sm text-[var(--text-muted)]">This dashboard has no widgets yet.</p>;
  }
  return (
    <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
      {widgets.map((widget, i) => {
        const wide = !['metric_card', 'metric'].includes(String(widget.type || widget.component || ''));
        return (
          <div key={widget.id || i} className={wide ? 'md:col-span-2' : ''}>
            <WidgetErrorBoundary title={widget.title}>
              <SandboxedWidgetRenderer widget={widget} />
            </WidgetErrorBoundary>
          </div>
        );
      })}
    </div>
  );
}
