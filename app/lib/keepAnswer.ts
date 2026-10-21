import { getProjectLayout, updateProjectLayout, type WidgetSpec } from './chatApi';
import { newWidgetId } from './dashboardTools.mjs';

const MAX_WIDGETS = 30;

export interface KeptAnswer {
  question: string;
  text: string;
  sources?: Array<{ host: string; verified?: boolean }>;
  tables?: Array<{ title: string; columns: string[]; rows: Array<Array<string | number>> }>;
}

/** The widgets a chat answer becomes: a note with the answer (marked as AI-written, with its sources) plus any result tables as real tables. */
export function widgetsForAnswer(a: KeptAnswer, now = new Date()): WidgetSpec[] {
  const title = (a.question || a.text.split('\n')[0] || 'Saved answer').replace(/\s+/g, ' ').trim().slice(0, 80);
  const hosts = [...new Set((a.sources ?? []).map((s) => s.host.replace(/^www\./, '')))].slice(0, 8);
  const body = `${a.text.trim().slice(0, 6000)}${hosts.length ? `\n\nSources: ${hosts.join(', ')}` : ''}`;
  const stamp = now.toISOString();
  const note = {
    id: newWidgetId('keep'),
    type: 'text_block',
    component: 'text_block',
    title,
    heading: title,
    body,
    variant: 'insight',
    span: 2,
    freshness: `Kept from chat · ${now.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`,
    provenance: { kind: 'synthetic_ai', source: 'AnalyzeIt chat answer (AI-written)', timestamp: stamp },
  } as unknown as WidgetSpec;
  const tables = (a.tables ?? []).slice(0, 3).map(
    (t) =>
      ({
        id: newWidgetId('keep'),
        type: 'table',
        component: 'table',
        title: t.title || 'Result',
        span: 2,
        data: t.rows.map((r) => Object.fromEntries(t.columns.map((c, i) => [c, r[i]]))),
        provenance: { kind: 'synthetic_ai', source: 'AnalyzeIt chat answer', timestamp: stamp },
      }) as unknown as WidgetSpec,
  );
  return [note, ...tables];
}

/** Saves an answer onto a project's dashboard (layout is versioned, so a clash is reported, not overwritten). */
export async function keepAnswerOnDashboard(projectId: string, answer: KeptAnswer): Promise<number> {
  const layout = await getProjectLayout(projectId);
  const existing = layout.layout_json.widgets || [];
  const added = widgetsForAnswer(answer);
  if (existing.length + added.length > MAX_WIDGETS) throw new Error(`That dashboard is full (${MAX_WIDGETS} widgets). Remove one first.`);
  await updateProjectLayout(projectId, layout.version, { widgets: [...existing, ...added] }, 'user');
  return added.length;
}
