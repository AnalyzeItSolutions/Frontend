import React from 'react';

const POINTS = [
  {
    title: 'It remembers',
    body: 'Facts, figures and decisions from earlier chats and your connected data are kept in memory, not pasted back into every prompt.',
  },
  {
    title: 'It sends only what the question needs',
    body: 'Before each answer, AnalyzeIt pulls the few pieces of memory that matter and sends those, so the model reads less and costs less.',
  },
  {
    title: 'You can check it',
    body: 'Every answer shows which memories and which query it used. Nothing is guessed, and you can edit or delete what it remembers.',
  },
];

/** Schematic only: bar lengths are an illustration of the idea, not measured values. */
function Schematic() {
  return (
    <figure className="space-y-3" aria-label="Illustration of the idea, not a measurement">
      {[
        { label: 'Re-send the whole history every time', width: '100%', tone: 'bg-[var(--surface-muted)]' },
        { label: 'AnalyzeIt: send what this question needs', width: '28%', tone: 'bg-[var(--brand)]' },
      ].map((row) => (
        <div key={row.label} className="space-y-1.5">
          <p className="text-xs font-medium text-[var(--text-secondary)]">{row.label}</p>
          <div className="h-3 rounded-full bg-[var(--surface-muted)]/60">
            <div className={`h-3 rounded-full ${row.tone}`} style={{ width: row.width }} />
          </div>
        </div>
      ))}
      <figcaption className="text-xs text-[var(--text-muted)]">Illustration of the idea, not a measured result.</figcaption>
    </figure>
  );
}

export const MemorySection: React.FC = () => (
  <section
    id="memory"
    className="relative z-10 bg-[var(--bg)] text-[var(--text-primary)] py-20 md:py-28 px-5 sm:px-8 md:px-16 scroll-mt-[calc(var(--nav-h,96px)+16px)] pointer-events-auto"
  >
    <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
      <div className="space-y-6">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">How it stays cheap</p>
        <h2 className="font-heading text-3xl md:text-5xl leading-tight">
          A long memory that feels like{' '}
          <em className="font-heading italic text-[var(--accent-text)]">a bigger context window.</em>
        </h2>
        <ul className="space-y-5">
          {POINTS.map((p) => (
            <li key={p.title} className="space-y-1">
              <h3 className="font-heading text-xl">{p.title}</h3>
              <p className="text-sm md:text-base leading-relaxed text-[var(--text-secondary)]">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-[var(--shadow-md)]">
        <Schematic />
      </div>
    </div>
  </section>
);
