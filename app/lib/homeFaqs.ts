// The homepage FAQ. Shown on the page, sent as FAQPage JSON-LD and listed in /llms.txt, so all three say the same thing.
export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQS: FAQItem[] = [
  {
    question: 'What is AnalyzeIt?',
    answer:
      'AnalyzeIt is an AI assistant for business data analysis that also handles research, writing and code. You ask a question in plain English about a spreadsheet, a database or a connected source such as Stripe or Postgres; AnalyzeIt computes the answer in code and shows the source, the query and the working, so every number can be checked. It runs in the browser, as a desktop app and as a command-line tool.',
  },
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
