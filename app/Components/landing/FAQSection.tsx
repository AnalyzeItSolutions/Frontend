import React from 'react';
import { FAQS } from '../../lib/homeFaqs';

export const FAQSection: React.FC = () => {
  return (
    <section
      id="faq"
      className="relative py-24 md:py-36 px-6 md:px-16 max-w-4xl mx-auto space-y-16 pointer-events-auto scroll-mt-[calc(var(--nav-h,96px)+16px)]"
    >
      <div className="text-center space-y-4">
        <p className="eyebrow">Common questions</p>
        <h2 className="font-serif text-4xl md:text-5xl text-[var(--text-primary)] font-normal">
          Frequently asked questions about AnalyzeIt
        </h2>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, idx) => (
          <details
            key={faq.question}
            open={idx < 2}
            className="glass-card rounded-2xl overflow-hidden border border-[var(--border)] transition-all duration-200 group"
          >
            <summary className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/20 dark:hover:bg-[#262626]/50 transition-colors list-none">
              <span className="font-serif text-xl md:text-2xl text-[var(--text-primary)] font-normal">
                {faq.question}
              </span>
              <span className="text-[var(--accent-text)] text-2xl font-light transition-transform duration-300 group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="px-6 pb-6 pt-1 text-sm md:text-base text-[var(--text-secondary)] leading-relaxed border-t border-[#414141]/6 dark:border-[var(--border)]">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
};
