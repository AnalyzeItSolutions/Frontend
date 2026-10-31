import type { Metadata } from 'next';
import { DocPage } from '../Components/docs/DocPage';
import { CHANGELOG } from '../lib/changelog.mjs';

export const metadata: Metadata = {
  title: 'AnalyzeIt changelog: what shipped and when',
  description: 'Dated release notes for AnalyzeIt: new analyses, connectors, desktop app and CLI changes, and features that are still rolling out, marked as such.',
  category: 'Release notes',
  alternates: { canonical: '/changelog' },
};

export default function Page() {
  return (
    <DocPage title="Changelog" subtitle="What shipped, dated. Things that are not finished are marked as rolling out.">
      {CHANGELOG.map((entry) => (
        <section key={entry.date}>
          <h2>
            <time dateTime={entry.date}>{new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}</time>
          </h2>
          <ul>
            {entry.items.map((item) => (
              <li key={item.title}>
                <strong>{item.title}.</strong> {item.body}
                {item.rollingOut ? <span className="ml-1 rounded-full bg-[#C9A66B]/25 px-2 py-0.5 text-xs">rolling out</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </DocPage>
  );
}
