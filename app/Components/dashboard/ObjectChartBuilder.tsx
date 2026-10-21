'use client';

import { useState } from 'react';
import type { ObjectSchema } from '../../lib/customObjectsApi';
import {
  BUCKETS,
  CHART_KINDS,
  CHART_METRICS,
  chartFieldChoices,
  newWidgetId,
  objectChartWidget,
  validateChartForm,
  type WidgetLike,
} from '../../lib/dashboardTools.mjs';

const input =
  'w-full px-3 py-2 text-sm rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--coral)]';

type Form = { kind: string; groupBy: string; metric: string; field: string; bucket: string; title: string };

/** Pick a chart type, what to group by and what to measure; the chart is then bound live to the object's records. */
export function ObjectChartBuilder({
  schema,
  projectId,
  disabled,
  onBack,
  onAdd,
}: {
  schema: ObjectSchema;
  projectId: string;
  disabled: boolean;
  onBack: () => void;
  onAdd: (spec: WidgetLike) => void;
}) {
  const [form, setForm] = useState<Form>({ kind: 'bar_chart', groupBy: '', metric: 'count', field: '', bucket: 'month', title: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const kind = CHART_KINDS.find((c) => c.type === form.kind)!;
  const choices = chartFieldChoices(schema, form.kind);
  const metric = CHART_METRICS.find((m) => m.id === form.metric)!;
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateChartForm(schema, form);
    setErrors(found);
    if (Object.keys(found).length === 0) onAdd(objectChartWidget(newWidgetId(), projectId, schema, form) as WidgetLike);
  };
  const err = (key: string) => (errors[key] ? <p role="alert" className="mt-1 text-xs text-red-500">{errors[key]}</p> : null);
  const label = 'block text-xs font-semibold text-[var(--text-primary)] mb-1';

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <p className="text-xs text-[var(--text-muted)]">
        A live chart of your <strong>{schema.label_plural || schema.label}</strong> records. It always shows what is in them now.
      </p>

      <div role="radiogroup" aria-label="Chart type" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CHART_KINDS.map((c) => (
          <button
            key={c.type}
            type="button"
            role="radio"
            aria-checked={form.kind === c.type}
            onClick={() => set({ kind: c.type, groupBy: '' })}
            className={`rounded-xl border p-2.5 text-left transition-colors ${form.kind === c.type ? 'border-[var(--coral)] bg-[var(--coral)]/10' : 'border-[var(--border)] hover:border-[var(--coral)]/50'}`}
          >
            <span className="block text-xs font-medium text-[var(--text-primary)]">{c.label}</span>
            <span className="block text-[11px] text-[var(--text-muted)]">{c.hint}</span>
          </button>
        ))}
      </div>

      {kind.groups ? (
        <div>
          <label htmlFor="oc-group" className={label}>{kind.dateGroup ? 'Date field' : 'Group by'}</label>
          <select id="oc-group" className={input} value={form.groupBy} onChange={(e) => set({ groupBy: e.target.value })}>
            <option value="">Choose a field…</option>
            {choices.groupable.map((f) => (
              <option key={f.api_name} value={f.api_name}>{f.label}</option>
            ))}
          </select>
          {err('groupBy')}
        </div>
      ) : null}

      {kind.dateGroup ? (
        <div>
          <label htmlFor="oc-bucket" className={label}>Per</label>
          <select id="oc-bucket" className={input} value={form.bucket} onChange={(e) => set({ bucket: e.target.value })}>
            {BUCKETS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="oc-metric" className={label}>Measure</label>
          <select id="oc-metric" className={input} value={form.metric} onChange={(e) => set({ metric: e.target.value, field: '' })}>
            {CHART_METRICS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          {err('metric')}
        </div>
        {metric.needsField ? (
          <div>
            <label htmlFor="oc-field" className={label}>Number field</label>
            <select id="oc-field" className={input} value={form.field} onChange={(e) => set({ field: e.target.value })}>
              <option value="">Choose a field…</option>
              {choices.numeric.map((f) => (
                <option key={f.api_name} value={f.api_name}>{f.label}</option>
              ))}
            </select>
            {err('field')}
          </div>
        ) : null}
      </div>

      <div>
        <label htmlFor="oc-title" className={label}>Title (optional)</label>
        <input id="oc-title" className={input} value={form.title} maxLength={80} placeholder="We'll name it from your choices" onChange={(e) => set({ title: e.target.value })} />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={onBack} className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] cursor-pointer">Back</button>
        <button type="submit" disabled={disabled} className="px-3 py-1.5 text-sm rounded-lg bg-[var(--coral)] hover:bg-[var(--coral-dark)] text-[var(--brand-ink)] font-medium disabled:opacity-50 cursor-pointer">Add chart</button>
      </div>
    </form>
  );
}
