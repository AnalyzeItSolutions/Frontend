import React from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'Is AnalyzeIt only for data questions?',
    answer:
      'No. Ask it anything: draft an email, write or fix code, plan a project, explain a concept, research a topic, or work out a loan or an investment. It is strongest where numbers matter: sums, statistics and money maths run in code, so the figures are exact, and answers on your own data show which tools produced them. Attach a file or connect a source when you want it to work on your own numbers; you never need data to ask a question.',
  },
  {
    question: 'What data sources can I connect?',
    answer:
      'GitHub, Stripe, Salesforce, Postgres, SQLite, and online datasets from Kaggle, Hugging Face, and OpenML. Stripe accepts OAuth or a restricted API key; Salesforce accepts OAuth or an access token. Chat attachments upload into a turn for spreadsheet and document analysis. Agent tools also cover markets, weather, web search, and project objects.',
  },
  {
    question: 'Do I need technical or SQL knowledge to use AnalyzeIt?',
    answer:
      'No. The platform is designed from the ground up so anyone—from founders to operations managers—can ask questions in everyday English. For technical team members, the generated SQL queries and raw data tables are always visible and inspectable.',
  },
  {
    question: 'How does this differ from traditional BI dashboards?',
    answer:
      'Traditional BI tools require building static dashboards that quickly become outdated or cluttered with too many charts. AnalyzeIt functions more like an analytical assistant: monitoring your underlying metrics, drafting concise text explanations, and answering ad-hoc inquiries on demand.',
  },
  {
    question: 'How does AnalyzeIt use fewer tokens without forgetting things?',
    answer:
      'It does not replay the whole conversation. Each question carries the last two turns plus only the earlier turns that match it, and long tool results are kept out of the prompt until needed. On a 60-turn test conversation, questions about an earlier turn were answered correctly 18 of 18 times (before: 0 of 18) with 71% fewer prompt tokens. That saving is for long conversations; on a single question it is small. The method and limits are in the docs.',
  },
  {
    question: 'How much can it remember?',
    answer:
      'Free keeps 10M tokens, Premium 500M and VIP 1B. A subset (25M on Premium, 50M on VIP) is searched by meaning at once; the rest is reached through summaries and exact words, and the assistant opens the original passage rather than answering from a summary. You can see, rename and delete everything on the Memory page.',
  },
  {
    question: 'How is my data protected?',
    answer:
      'Credentials are encrypted at rest when a vault key is configured. Network traffic uses HTTPS in production. Private business data is not used to train public language models.',
  },
  {
    question: 'Can my whole team collaborate in one workspace?',
    answer:
      'You can share a result or project with a link that you can switch off at any time.',
  },
];

export const FAQSection: React.FC = () => {
  return (
    <section
      id="faq"
      className="relative py-24 md:py-36 px-6 md:px-16 max-w-4xl mx-auto space-y-16 pointer-events-auto scroll-mt-[calc(var(--nav-h,96px)+16px)]"
    >
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[var(--text-secondary)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9EBB9A]" />
          Common Questions
        </div>
        <h2 className="font-serif text-4xl md:text-5xl text-[var(--text-primary)] font-normal">
          Frequently asked questions
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
