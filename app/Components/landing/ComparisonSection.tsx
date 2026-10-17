import React from 'react';

interface ComparisonRow {
  topic: string;
  oldWay: string;
  analyzeIt: string;
}

const COMPARISONS: ComparisonRow[] = [
  {
    topic: 'Getting your data in',
    oldWay: 'Export a file from your payment provider, upload it to a chatbot, and do it all again next week.',
    analyzeIt: 'Connect once. When you ask, the data is refreshed first if it is more than a few minutes old.',
  },
  {
    topic: 'Knowing what to ask',
    oldWay: 'You have to already suspect the problem before you can ask about it.',
    analyzeIt: 'It checks every status, method and bank for you and shows what is out of line, and when it started.',
  },
  {
    topic: 'Trusting the number',
    oldWay: 'A chat may compute a figure or may estimate it, and you often cannot tell which.',
    analyzeIt: 'Every figure comes from a query you can read. The checks were tested on data with nothing wrong, to measure how often they cry wolf.',
  },
  {
    topic: 'Your customers’ details',
    oldWay: 'Exports often include customer emails and phone numbers, and the whole file goes to a third-party chat.',
    analyzeIt: 'Only revenue fields are read. Customer email, phone, card and UPI details are never stored.',
  },
];

export const ComparisonSection: React.FC = () => {
  return (
    <section
      id="comparison"
      className="relative py-24 md:py-36 px-6 md:px-16 max-w-7xl mx-auto space-y-16 pointer-events-auto scroll-mt-[calc(var(--nav-h,96px)+16px)]"
    >
      <div id="why-calm" className="absolute -top-28 h-px w-px overflow-hidden" aria-hidden="true" />
      {/* Header */}
      <div className="max-w-2xl space-y-4">
        <p className="eyebrow">Why not a chatbot?</p>
        <h2 className="font-serif text-4xl md:text-5xl text-[var(--text-primary)] font-normal leading-tight">
          You can upload a file to a chatbot. Here is{' '}
          <em className="font-serif not-italic text-[var(--accent-text)]">
            what changes when it is every week.
          </em>
        </h2>
        <p className="text-base text-[var(--text-secondary)]">
          For a one-off question, a general chatbot is fine. For your payments, week after week, you want the data connected, the problem found without being asked, and numbers you can check.
        </p>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden border border-[var(--border)] divide-y divide-[#414141]/8 dark:divide-[#262626] shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 bg-[#F8F8F8]/90 dark:bg-[#262626] p-6 md:px-10 text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] border-b border-[#414141]/08 dark:border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#414141]/30 dark:bg-[#BABABA]/40" />
            Uploading a file to a chatbot
          </div>
          <div className="hidden md:flex items-center gap-2 text-[var(--accent-text)]">
            <span className="w-2 h-2 rounded-full bg-[var(--brand)]" />
            With AnalyzeIt
          </div>
        </div>

        {/* Rows */}
        {COMPARISONS.map((row, idx) => (
          <div
            key={idx}
            className="grid grid-cols-1 md:grid-cols-2 p-6 md:p-10 gap-6 md:gap-12 hover:bg-white/30 dark:hover:bg-[#262626]/50 transition-colors"
          >
            {/* The Old Way */}
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-[var(--text-muted)] dark:text-[var(--text-muted)] uppercase tracking-wider">
                {row.topic}
              </div>
              <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed">
                {row.oldWay}
              </p>
            </div>

            {/* With AnalyzeIt */}
            <div className="space-y-1.5 pt-4 md:pt-0 border-t md:border-t-0 border-[#414141]/6 dark:border-[var(--border)]">
              <div className="md:hidden text-xs font-mono text-[var(--accent-text)] uppercase tracking-wider">
                With AnalyzeIt
              </div>
              <p className="text-sm md:text-base text-[var(--text-primary)] font-medium leading-relaxed">
                {row.analyzeIt}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
