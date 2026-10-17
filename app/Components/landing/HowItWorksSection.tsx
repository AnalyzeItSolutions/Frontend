import React from 'react';

interface Step {
  step: string;
  title: string;
  tagline: string;
  description: string;
}

const STEPS: Step[] = [
  {
    step: '1',
    title: 'Connect',
    tagline: 'Read-only, from where your data already is.',
    description:
      'Attach a connector (OAuth, an API key, SQL or a public dataset) or upload a file. Each source shows its real status: connected, ready or error.',
  },
  {
    step: '2',
    title: 'Ask',
    tagline: 'Plain words, or let it look for you.',
    description:
      'Ask a question, or ask what stands out. Simple calculations, weather, exchange rates and stock prices come from a tool and cost no tokens.',
  },
  {
    step: '3',
    title: 'Check',
    tagline: 'Every figure comes with its working.',
    description:
      'Open “Show the working” to see the exact numbers and the query behind each finding. Pin what matters to a dashboard, or explore it on the globe.',
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section
      id="how-it-works"
      className="relative py-24 md:py-36 px-6 md:px-16 max-w-7xl mx-auto space-y-16 pointer-events-auto scroll-mt-[calc(var(--nav-h,96px)+16px)]"
    >
      <div className="max-w-2xl space-y-4">
        <p className="eyebrow">Three steps</p>
        <h2 className="font-serif text-4xl md:text-5xl text-[var(--text-primary)] font-normal">
          How it works
        </h2>
        <p className="text-base text-[var(--text-secondary)]">
          From a connected source to a figure you can verify, without building a dashboard first.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {STEPS.map((s) => (
          <div
            key={s.step}
            className="glass-card card-static rounded-3xl p-8 space-y-5 relative border border-[var(--border)]"
          >
            <span aria-hidden="true" className="block font-serif text-4xl tabular-nums leading-none text-[var(--accent-text)] font-normal">{s.step}</span>
            <div className="space-y-2">
              <h3 className="font-serif text-2xl text-[var(--text-primary)] font-normal"><span className="sr-only">Step {s.step}: </span>{s.title}</h3>
              <p className="text-sm font-medium text-[var(--text-primary)]">{s.tagline}</p>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{s.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
