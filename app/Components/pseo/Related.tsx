import { LinkList, Section, linkCls } from './Blocks';
import { GUIDES, readMinutes } from '../../lib/guides.mjs';
import { method } from '../../lib/pseo/methods.mjs';
import { metric } from '../../lib/pseo/metrics.mjs';
import { metricTitle } from '../../lib/pseo/pages.mjs';
import { tool } from '../../lib/tools/tools.mjs';

type Slugs = { slugs: string[]; title?: string };

/** Guides by slug. Unknown slugs are skipped (the link-graph test is what keeps them from existing). */
export function GuideList({ slugs, title = 'Related guides' }: Partial<Slugs>) {
  const items = (slugs ?? []).map((s) => GUIDES.find((g) => g.slug === s)).filter((g): g is NonNullable<typeof g> => !!g);
  if (!items.length) return null;
  return (
    <Section title={title}>
      <LinkList items={items.map((g) => ({ href: `/guides/${g.slug}`, label: g.seoTitle ?? g.title, note: `${readMinutes(g)} min read` }))} />
    </Section>
  );
}

export function MethodList({ slugs, title = 'Methods used' }: Slugs) {
  const items = slugs.map((s) => method(s)).filter((m): m is NonNullable<typeof m> => !!m);
  if (!items.length) return null;
  return (
    <Section title={title}>
      <LinkList items={items.map((m) => ({ href: `/methods/${m.slug}`, label: m.name }))} />
    </Section>
  );
}

export function MetricList({ slugs, title = 'Metrics to try' }: Slugs) {
  const items = slugs.map((s) => metric(s)).filter((m): m is NonNullable<typeof m> => !!m);
  if (!items.length) return null;
  return (
    <Section title={title}>
      <LinkList items={items.map((m) => ({ href: `/metrics/${m.slug}`, label: metricTitle(m) }))} />
    </Section>
  );
}

export function ToolList({ slugs, title = 'Free tools' }: Slugs) {
  const items = slugs.map((s) => tool(s)).filter((t): t is NonNullable<typeof t> => !!t);
  if (!items.length) return null;
  return (
    <Section title={title}>
      <LinkList items={items.map((t) => ({ href: `/tools/${t.slug}`, label: t.name }))} />
    </Section>
  );
}

/** Reference pages outside the site: the idea (Wikipedia) and the function's own documentation. Opens in a new tab. */
export function ExternalRefs({ refs, title = 'Further reading' }: { refs: readonly (readonly [string, string])[]; title?: string }) {
  if (!refs.length) return null;
  return (
    <Section title={title}>
      <ul className="list-disc space-y-1.5 pl-5">
        {refs.map(([label, href]) => (
          <li key={href}>
            <a href={href} className={linkCls} rel="noopener" target="_blank">{label}</a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
